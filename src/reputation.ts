import type { Attestation, ReputationSummary } from "./types";

export class ReputationAggregator {
  /**
   * Calculate a reputation profile from a set of attestations.
   * Weighted scoring: attestations from high-reputation attestors count more.
   * This is the off-chain computation; the on-chain contract has a simpler version.
   */
  calculateProfile(attestations: Attestation[]): ReputationSummary {
    if (attestations.length === 0) {
      return {
        score: 0,
        totalAttestations: 0,
        onTimeRate: 0,
        outcomes: {},
      };
    }

    // Count outcomes
    const outcomes: Record<string, number> = {};
    for (const att of attestations) {
      outcomes[att.outcome] = (outcomes[att.outcome] || 0) + 1;
    }

    // Calculate on-time rate
    const onTimeCount = attestations.filter((a) => a.onTime).length;
    const onTimeRate = onTimeCount / attestations.length;

    // Weighted score: base weight 1.0
    // Attestors with more attestations of their own get higher weight
    // (proxy for attestor reputation — in a full system we'd resolve their on-chain score)
    const attestorCounts = new Map<string, number>();
    for (const att of attestations) {
      const key = att.attestor.toLowerCase();
      attestorCounts.set(key, (attestorCounts.get(key) || 0) + 1);
    }

    let weightedOnTime = 0;
    let totalWeight = 0;

    for (const att of attestations) {
      const weight = this.getAttestorWeight(att.attestor, attestorCounts);
      totalWeight += weight;
      if (att.onTime) {
        weightedOnTime += weight;
      }
    }

    const score =
      totalWeight > 0 ? Math.round((weightedOnTime / totalWeight) * 100) : 0;

    return {
      score,
      totalAttestations: attestations.length,
      onTimeRate: Math.round(onTimeRate * 1000) / 1000,
      outcomes,
    };
  }

  /**
   * Calculate weight for an attestor.
   * Higher weight for attestors who have made more attestations (proxy for reputation).
   */
  private getAttestorWeight(
    attestor: string,
    attestorCounts: Map<string, number>
  ): number {
    const count = attestorCounts.get(attestor.toLowerCase()) || 0;
    if (count >= 20) return 2.0;
    if (count >= 10) return 1.5;
    return 1.0;
  }

  /**
   * Calculate a diversity score: how many unique attestors contributed.
   * More unique attestors = more trustworthy (harder to Sybil).
   */
  calculateDiversity(attestations: Attestation[]): number {
    const unique = new Set(attestations.map((a) => a.attestor.toLowerCase()));
    return unique.size;
  }

  /**
   * Detect potential collusion: many attestations from the same attestor.
   * Returns the ratio of the most prolific attestor's attestations to total.
   * A ratio > 0.5 suggests possible collusion.
   */
  collusionRisk(attestations: Attestation[]): number {
    if (attestations.length === 0) return 0;

    const counts = new Map<string, number>();
    for (const att of attestations) {
      const key = att.attestor.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const maxCount = Math.max(...Array.from(counts.values()));
    return maxCount / attestations.length;
  }
}
