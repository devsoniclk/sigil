import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("IdentityRegistry", function () {
  let registry: Contract;
  let owner: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("IdentityRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  describe("register", function () {
    it("should register a new agent", async function () {
      await registry.connect(owner).register("ipfs://QmTest123");

      const identity = await registry.resolve(owner.address);
      expect(identity.owner).to.equal(owner.address);
      expect(identity.metadataURI).to.equal("ipfs://QmTest123");
      expect(identity.active).to.be.true;
      expect(identity.registeredAt).to.be.greaterThan(0);
    });

    it("should emit AgentRegistered event", async function () {
      await expect(registry.connect(owner).register("ipfs://QmTest"))
        .to.emit(registry, "AgentRegistered")
        .withArgs(owner.address, "ipfs://QmTest");
    });

    it("should revert if already registered", async function () {
      await registry.connect(owner).register("ipfs://QmTest");
      await expect(
        registry.connect(owner).register("ipfs://QmTest2")
      ).to.be.revertedWith("IdentityRegistry: already registered");
    });

    it("should revert on empty URI", async function () {
      await expect(
        registry.connect(owner).register("")
      ).to.be.revertedWith("IdentityRegistry: empty URI");
    });
  });

  describe("updateMetadata", function () {
    it("should update metadata URI", async function () {
      await registry.connect(owner).register("ipfs://QmOld");
      await registry.connect(owner).updateMetadata("ipfs://QmNew");

      const identity = await registry.resolve(owner.address);
      expect(identity.metadataURI).to.equal("ipfs://QmNew");
    });

    it("should emit AgentUpdated event", async function () {
      await registry.connect(owner).register("ipfs://QmOld");
      await expect(registry.connect(owner).updateMetadata("ipfs://QmNew"))
        .to.emit(registry, "AgentUpdated")
        .withArgs(owner.address, "ipfs://QmNew");
    });

    it("should revert if not registered", async function () {
      await expect(
        registry.connect(owner).updateMetadata("ipfs://QmNew")
      ).to.be.revertedWith("IdentityRegistry: not registered");
    });
  });

  describe("deactivate", function () {
    it("should deactivate an identity", async function () {
      await registry.connect(owner).register("ipfs://QmTest");
      await registry.connect(owner).deactivate();

      const identity = await registry.resolve(owner.address);
      expect(identity.active).to.be.false;
    });

    it("should emit AgentDeactivated event", async function () {
      await registry.connect(owner).register("ipfs://QmTest");
      await expect(registry.connect(owner).deactivate())
        .to.emit(registry, "AgentDeactivated")
        .withArgs(owner.address);
    });

    it("should revert if not active", async function () {
      await expect(
        registry.connect(owner).deactivate()
      ).to.be.revertedWith("IdentityRegistry: not active");
    });
  });

  describe("resolve", function () {
    it("should return zero address identity for unregistered agent", async function () {
      const identity = await registry.resolve(other.address);
      expect(identity.owner).to.equal(ethers.ZeroAddress);
      expect(identity.active).to.be.false;
    });
  });

  describe("isActive", function () {
    it("should return true for active agents", async function () {
      await registry.connect(owner).register("ipfs://QmTest");
      expect(await registry.isActive(owner.address)).to.be.true;
    });

    it("should return false for unregistered agents", async function () {
      expect(await registry.isActive(other.address)).to.be.false;
    });

    it("should return false for deactivated agents", async function () {
      await registry.connect(owner).register("ipfs://QmTest");
      await registry.connect(owner).deactivate();
      expect(await registry.isActive(owner.address)).to.be.false;
    });
  });
});
