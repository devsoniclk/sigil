/**
 * Example: Agent A vets Agent B before paying
 *
 * Full flow:
 * 1. Agent A registers on-chain
 * 2. Agent B registers on-chain
 * 3. Agent A transacts with Agent B, leaves attestation
 * 4. Before next transaction, Agent A resolves Agent B's profile
 * 5. Agent A checks reputation score before proceeding
 */

import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
  SigilRegister,
  SigilResolve,
  SigilAttest,
  SigilVerify,
  ReputationAggregator,
} from "../src";

// ─── Configuration ─────────────────────────────────────────
const IDENTITY_REGISTRY = "0xYOUR_IDENTITY_REGISTRY" as `0x${string}`;
const REPUTATION_REGISTRY = "0xYOUR_REPUTATION_REGISTRY" as `0x${string}`;

// Agent private keys (for demo purposes — in production use secure key management)
const AGENT_A_KEY = "0x" + "a".repeat(64); // Replace with real keys
const AGENT_B_KEY = "0x" + "b".repeat(64);

async function main() {
  // ─── Setup Clients ───────────────────────────────────────
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  const accountA = privateKeyToAccount(AGENT_A_KEY as `0x${string}`);
  const accountB = privateKeyToAccount(AGENT_B_KEY as `0x${string}`);

  const walletA = createWalletClient({
    account: accountA,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  const walletB = createWalletClient({
    account: accountB,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  // ─── Step 1: Both Agents Register ────────────────────────
  console.log("=== Step 1: Register Agents ===\n");

  const registrarA = new SigilRegister(walletA, publicClient, IDENTITY_REGISTRY);
  const regA = await registrarA.register({
    agent: accountA.address,
    metadataURI: "ipfs://QmAgentAMeta",
    chain: { id: 84532, name: "Base Sepolia" },
  });
  console.log(`Agent A registered: ${regA.txHash}`);

  const registrarB = new SigilRegister(walletB, publicClient, IDENTITY_REGISTRY);
  const regB = await registrarB.register({
    agent: accountB.address,
    metadataURI: "ipfs://QmAgentBMeta",
    chain: { id: 84532, name: "Base Sepolia" },
  });
  console.log(`Agent B registered: ${regB.txHash}`);

  // ─── Step 2: Agent A Attests About Agent B ───────────────
  console.log("\n=== Step 2: Agent A Attests About Agent B ===\n");

  const attester = new SigilAttest(walletA, publicClient, REPUTATION_REGISTRY);
  const attResult = await attester.attest({
    attestor: accountA.address,
    subject: accountB.address,
    outcome: "delivered data API response on time",
    onTime: true,
  });
  console.log(`Attestation recorded: ${attResult.txHash}`);

  // ─── Step 3: Before Next Transaction, Vet Agent B ────────
  console.log("\n=== Step 3: Vet Agent B Before Next Payment ===\n");

  const resolver = new SigilResolve(
    publicClient,
    IDENTITY_REGISTRY,
    REPUTATION_REGISTRY
  );

  const profile = await resolver.resolve(accountB.address);
  console.log(`Agent B profile:`);
  console.log(`  Address: ${profile.address}`);
  console.log(`  Active: ${profile.active}`);
  console.log(`  Score: ${profile.reputation.score}/100`);
  console.log(`  On-time rate: ${(profile.reputation.onTimeRate * 100).toFixed(1)}%`);
  console.log(`  Total attestations: ${profile.reputation.totalAttestations}`);

  // ─── Step 4: Make Decision ───────────────────────────────
  console.log("\n=== Step 4: Decision ===\n");

  const aggregator = new ReputationAggregator();
  const diversity = aggregator.calculateDiversity(profile.attestations);
  const collusion = aggregator.collusionRisk(profile.attestations);

  console.log(`  Unique attestors: ${diversity}`);
  console.log(`  Collusion risk: ${(collusion * 100).toFixed(1)}%`);

  const MIN_SCORE = 50;
  const MIN_ATTESTORS = 2;
  const MAX_COLLUSION = 0.5;

  if (
    profile.reputation.score >= MIN_SCORE &&
    diversity >= MIN_ATTESTORS &&
    collusion < MAX_COLLUSION
  ) {
    console.log(`\n✅ Agent B passes vetting. Proceeding with payment.`);
  } else if (profile.reputation.totalAttestations === 0) {
    console.log(`\n⚠️ Agent B has no attestations. Consider a small test transaction.`);
  } else {
    console.log(`\n❌ Agent B does not meet trust criteria. Skipping transaction.`);
  }
}

main().catch(console.error);
