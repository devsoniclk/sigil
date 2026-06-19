import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy IdentityRegistry
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identity = await IdentityRegistry.deploy();
  await identity.waitForDeployment();
  const identityAddress = await identity.getAddress();
  console.log("IdentityRegistry deployed to:", identityAddress);

  // Deploy ReputationRegistry
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputation = await ReputationRegistry.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("ReputationRegistry deployed to:", reputationAddress);

  console.log("\nDeployment complete!");
  console.log(`IDENTITY_REGISTRY_ADDRESS=${identityAddress}`);
  console.log(`REPUTATION_REGISTRY_ADDRESS=${reputationAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
