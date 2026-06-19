import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReputationRegistry", function () {
  let registry: Contract;
  let agentA: SignerWithAddress;
  let agentB: SignerWithAddress;
  let agentC: SignerWithAddress;

  beforeEach(async function () {
    [agentA, agentB, agentC] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ReputationRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  describe("attest", function () {
    it("should record an attestation", async function () {
      await registry.connect(agentA).attest(agentB.address, "delivered data", true);

      const attestations = await registry.getAttestations(agentB.address);
      expect(attestations.length).to.equal(1);
      expect(attestations[0].attestor).to.equal(agentA.address);
      expect(attestations[0].subject).to.equal(agentB.address);
      expect(attestations[0].outcome).to.equal("delivered data");
      expect(attestations[0].onTime).to.be.true;
    });

    it("should emit AttestationRecorded event", async function () {
      await expect(
        registry.connect(agentA).attest(agentB.address, "good work", true)
      )
        .to.emit(registry, "AttestationRecorded")
        .withArgs(agentA.address, agentB.address, "good work");
    });

    it("should revert on self-attestation", async function () {
      await expect(
        registry.connect(agentA).attest(agentA.address, "great", true)
      ).to.be.revertedWith("ReputationRegistry: self-attestation");
    });

    it("should revert on zero address", async function () {
      await expect(
        registry.connect(agentA).attest(ethers.ZeroAddress, "test", true)
      ).to.be.revertedWith("ReputationRegistry: zero address");
    });

    it("should revert on empty outcome", async function () {
      await expect(
        registry.connect(agentA).attest(agentB.address, "", true)
      ).to.be.revertedWith("ReputationRegistry: empty outcome");
    });
  });

  describe("getAttestations", function () {
    it("should return empty array for agent with no attestations", async function () {
      const attestations = await registry.getAttestations(agentA.address);
      expect(attestations.length).to.equal(0);
    });

    it("should return all attestations for a subject", async function () {
      await registry.connect(agentA).attest(agentB.address, "good", true);
      await registry.connect(agentC).attest(agentB.address, "also good", true);

      const attestations = await registry.getAttestations(agentB.address);
      expect(attestations.length).to.equal(2);
    });
  });

  describe("getAttestationCount", function () {
    it("should return correct count", async function () {
      await registry.connect(agentA).attest(agentB.address, "good", true);
      await registry.connect(agentC).attest(agentB.address, "bad", false);

      expect(await registry.getAttestationCount(agentB.address)).to.equal(2);
    });
  });

  describe("getScore", function () {
    it("should return 0 for agent with no attestations", async function () {
      expect(await registry.getScore(agentA.address)).to.equal(0);
    });

    it("should return 100 for all on-time attestations", async function () {
      await registry.connect(agentA).attest(agentB.address, "good", true);
      await registry.connect(agentC).attest(agentB.address, "good", true);

      expect(await registry.getScore(agentB.address)).to.equal(100);
    });

    it("should return 0 for all late attestations", async function () {
      await registry.connect(agentA).attest(agentB.address, "late", false);
      await registry.connect(agentC).attest(agentB.address, "late", false);

      expect(await registry.getScore(agentB.address)).to.equal(0);
    });

    it("should return 50 for half on-time", async function () {
      await registry.connect(agentA).attest(agentB.address, "on time", true);
      await registry.connect(agentC).attest(agentB.address, "late", false);

      expect(await registry.getScore(agentB.address)).to.equal(50);
    });
  });
});
