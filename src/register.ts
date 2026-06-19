import { PublicClient, WalletClient, Address, encodeFunctionData } from "viem";
import { IDENTITY_REGISTRY_ABI } from "./types";
import type { RegistrationResult, UpdateResult } from "./types";

export class SigilRegister {
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
   * Register a new agent identity on-chain.
   * The caller (msg.sender) becomes the owner of the identity.
   */
  async register(params: {
    agent: Address;
    metadataURI: string;
    chain: { id: number; name: string };
  }): Promise<RegistrationResult> {
    const { metadataURI } = params;

    if (!metadataURI || metadataURI.length === 0) {
      throw new Error("metadataURI is required");
    }

    const data = encodeFunctionData({
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "register",
      args: [metadataURI],
    });

    const hash = await this.walletClient.sendTransaction({
      to: this.contractAddress,
      data,
      chain: null,
      account: params.agent,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      throw new Error(`Registration reverted: ${hash}`);
    }

    return {
      txHash: hash,
      agent: params.agent,
      metadataURI,
    };
  }

  /**
   * Update the metadata URI for an existing agent identity.
   */
  async update(params: {
    agent: Address;
    metadataURI: string;
    chain: { id: number; name: string };
  }): Promise<UpdateResult> {
    const { metadataURI } = params;

    if (!metadataURI || metadataURI.length === 0) {
      throw new Error("metadataURI is required");
    }

    const data = encodeFunctionData({
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "updateMetadata",
      args: [metadataURI],
    });

    const hash = await this.walletClient.sendTransaction({
      to: this.contractAddress,
      data,
      chain: null,
      account: params.agent,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      throw new Error(`Update reverted: ${hash}`);
    }

    return {
      txHash: hash,
      agent: params.agent,
      newURI: metadataURI,
    };
  }
}
