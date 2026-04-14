const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  const VehicleRegistry = await hre.ethers.getContractFactory("VehicleRegistry");
  const vehicleRegistry = await VehicleRegistry.deploy();

  await vehicleRegistry.waitForDeployment();

  const address = await vehicleRegistry.getAddress();
  console.log(`✅ Success! VehicleRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});