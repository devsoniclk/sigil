/// Sigil — Agent identity + reputation on ERC-8004

import { Address, Hash, Hex } from "viem";

// ─── Identity ──────────────────────────────────────────────

export interface AgentIdentity {
  owner: Address;
  metadataURI: string;
  registeredAt: bigint;
  active: boolean;
}

export interface AgentProfile {
  address: Address;
  metadataURI: string;
  registeredAt: bigint;
  active: boolean;
  reputation: ReputationSummary;
  attestations: Attestation[];
}

export interface RegistrationResult {
  txHash: Hash;
  agent: Address;
  metadataURI: string;
}

export interface UpdateResult {
  txHash: Hash;
  agent: Address;
  newURI: string;
}

// ─── Attestation ───────────────────────────────────────────

export interface Attestation {
  attestor: Address;
  subject: Address;
  outcome: string;
  onTime: boolean;
  timestamp: bigint;
  signature: Hex;
}

export interface AttestationInput {
  subject: Address;
  outcome: string;
  onTime: boolean;
}

export interface AttestationResult {
  txHash: Hash;
  attestor: Address;
  subject: Address;
  outcome: string;
}

export interface VerificationResult {
  valid: boolean;
  attestor: Address | null;
  reason: string;
}

// ─── Reputation ────────────────────────────────────────────

export interface ReputationSummary {
  score: number;          // 0-100
  totalAttestations: number;
  onTimeRate: number;     // 0-1
  outcomes: Record<string, number>;
}

// ─── Chain Config ──────────────────────────────────────────

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
}

export const BASE_TESTNET: ChainConfig = {
  id: 84532,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
};

// ─── Contract ABIs (minimal) ──────────────────────────────

export const IDENTITY_REGISTRY_ABI = [
  {
    type: "function",
    name: "register",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateMetadata",
    inputs: [{ name: "newURI", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivate",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "registeredAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgentUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "newURI", type: "string", indexed: false },
    ],
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "attest",
    inputs: [
      { name: "subject", type: "address" },
      { name: "outcome", type: "string" },
      { name: "onTime", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAttestations",
    inputs: [{ name: "subject", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "attestor", type: "address" },
          { name: "subject", type: "address" },
          { name: "outcome", type: "string" },
          { name: "onTime", type: "bool" },
          { name: "timestamp", type: "uint256" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getScore",
    inputs: [{ name: "subject", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAttestationCount",
    inputs: [{ name: "subject", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AttestationRecorded",
    inputs: [
      { name: "attestor", type: "address", indexed: true },
      { name: "subject", type: "address", indexed: true },
      { name: "outcome", type: "string", indexed: false },
    ],
  },
] as const;
