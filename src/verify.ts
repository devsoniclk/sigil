import { PublicClient, Address, verifyMessage, Hex } from "viem";
import { IDENTITY_REGISTRY_ABI } from "./types";
import type { Attestation, VerificationResult } from "./types";

export class SigilVerify {
  private publicClient: PublicClient;
  private identityAddress: Address;
  private maxAgeSeconds: number;

  constructor(
    publicClient: PublicClient,
    identityAddress: Address,
    maxAgeSeconds: number = 90 * 24 * 60 * 60 // 90 days default
  ) {
    this.publicClient = publicClient;
    this.identityAddress = identityAddress;
    this.maxAgeSeconds = maxAgeSeconds;
  }

  /**
   * Verify an attestation's validity.
   * Checks: signature validity, attestor has an identity, freshness.
   */
  async verify(attestation: Attestation): Promise<VerificationResult> {
    // Check attestor has an on-chain identity
    try {
      const identity = (await this.publicClient.readContract({
        address: this.identityAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "resolve",
        args: [attestation.attestor],
      })) as { owner: Address; metadataURI: string; registeredAt: bigint; active: boolean };

      if (!identity.active) {
        return {
          valid: false,
          attestor: attestation.attestor,
          reason: "Attestor identity is not active",
        };
      }
    } catch {
      return {
        valid: false,
        attestor: attestation.attestor,
        reason: "Attestor has no registered identity",
      };
    }

    // Check attestation freshness
    const attestationAge =
      BigInt(Math.floor(Date.now() / 1000)) - attestation.timestamp;
    if (attestationAge > BigInt(this.maxAgeSeconds)) {
      return {
        valid: false,
        attestor: attestation.attestor,
        reason: `Attestation is stale (${attestationAge}s old, max ${this.maxAgeSeconds}s)`,
      };
    }

    // Verify signature if present
    if (attestation.signature && attestation.signature !== "0x") {
      const payload = JSON.stringify({
        subject: attestation.subject,
        outcome: attestation.outcome,
        onTime: attestation.onTime,
        timestamp: Number(attestation.timestamp),
      });

      try {
        const valid = await verifyMessage({
          address: attestation.attestor,
          message: payload,
          signature: attestation.signature,
        });

        if (!valid) {
          return {
            valid: false,
            attestor: attestation.attestor,
            reason: "Invalid signature",
          };
        }
      } catch {
        return {
          valid: false,
          attestor: attestation.attestor,
          reason: "Signature verification failed",
        };
      }
    }

    return {
      valid: true,
      attestor: attestation.attestor,
      reason: "Attestation is valid",
    };
  }

  /**
   * Verify multiple attestations in batch.
   */
  async verifyBatch(
    attestations: Attestation[]
  ): Promise<VerificationResult[]> {
    return Promise.all(attestations.map((a) => this.verify(a)));
  }
}
