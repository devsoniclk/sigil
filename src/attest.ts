import {
  PublicClient,
  WalletClient,
  Address,
  encodeFunctionData,
  hashMessage,
  Hex,
} from "viem";
import { REPUTATION_REGISTRY_ABI } from "./types";
import type { AttestationInput, AttestationResult } from "./types";

export class SigilAttest {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private contractAddress: Address;

  constructor(
    walletClient: WalletClient,
    publicClient: PublicClient,
    contractAddress: Address
  ) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.contractAddress = contractAddress;
  }

  /**
   * Sign and submit a reputation attestation for a subject agent.
   * The attestor signs the attestation payload off-chain, then submits on-chain.
   */
  async attest(
    params: AttestationInput & { attestor: Address }
  ): Promise<AttestationResult> {
    const { subject, outcome, onTime, attestor } = params;

    if (!subject || subject === "0x0000000000000000000000000000000000000000") {
      throw new Error("Subject address is required");
    }
    if (subject.toLowerCase() === attestor.toLowerCase()) {
      throw new Error("Cannot attest to yourself");
    }
    if (!outcome || outcome.length === 0) {
      throw new Error("Outcome description is required");
    }

    // Encode the attestation for on-chain submission
    const data = encodeFunctionData({
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "attest",
      args: [subject, outcome, onTime],
    });

    const hash = await this.walletClient.sendTransaction({
      to: this.contractAddress,
      data,
      chain: null,
      account: attestor,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      throw new Error(`Attestation reverted: ${hash}`);
    }

    return {
      txHash: hash,
      attestor,
      subject,
      outcome,
    };
  }

  /**
   * Create a signed attestation payload (off-chain only).
   * Useful for creating attestations that can be submitted later or verified independently.
   */
  async signAttestation(
    params: AttestationInput & { attestor: Address }
  ): Promise<{ payload: string; signature: Hex }> {
    const { subject, outcome, onTime, attestor } = params;

    const payload = JSON.stringify({
      subject,
      outcome,
      onTime,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const signature = await this.walletClient.signMessage({
      account: attestor,
      message: payload,
    });

    return { payload, signature };
  }
}
