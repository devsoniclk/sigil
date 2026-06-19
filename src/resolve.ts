import { PublicClient, Address } from "viem";
import { IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from "./types";
import type { AgentIdentity, AgentProfile, Attestation, ReputationSummary } from "./types";
import { ReputationAggregator } from "./reputation";

interface CacheEntry {
  profile: AgentProfile;
  fetchedAt: number;
}

export class SigilResolve {
  private publicClient: PublicClient;
  private identityAddress: Address;
  private reputationAddress: Address;
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(
    publicClient: PublicClient,
    identityAddress: Address,
    reputationAddress: Address,
    ttlMs: number = 30_000 // 30 second default TTL
  ) {
    this.publicClient = publicClient;
    this.identityAddress = identityAddress;
    this.reputationAddress = reputationAddress;
    this.ttlMs = ttlMs;
  }

  /**
   * Resolve an agent address to a full trust profile.
   * Returns identity, reputation score, and attestations.
   * Results are cached with configurable TTL.
   */
  async resolve(agentAddress: Address): Promise<AgentProfile> {
    // Check cache
    const cached = this.cache.get(agentAddress.toLowerCase());
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      return cached.profile;
    }

    // Fetch identity from IdentityRegistry
    const identity = (await this.publicClient.readContract({
      address: this.identityAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolve",
      args: [agentAddress],
    })) as AgentIdentity;

    // Fetch attestations from ReputationRegistry
    const rawAttestations = (await this.publicClient.readContract({
      address: this.reputationAddress,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "getAttestations",
      args: [agentAddress],
    })) as Attestation[];

    // Calculate reputation
    const aggregator = new ReputationAggregator();
    const reputation = aggregator.calculateProfile(rawAttestations);

    const profile: AgentProfile = {
      address: agentAddress,
      metadataURI: identity.metadataURI,
      registeredAt: identity.registeredAt,
      active: identity.active,
      reputation,
      attestations: rawAttestations,
    };

    // Update cache
    this.cache.set(agentAddress.toLowerCase(), {
      profile,
      fetchedAt: Date.now(),
    });

    return profile;
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove a specific entry from the cache.
   */
  invalidate(agentAddress: Address): void {
    this.cache.delete(agentAddress.toLowerCase());
  }
}
