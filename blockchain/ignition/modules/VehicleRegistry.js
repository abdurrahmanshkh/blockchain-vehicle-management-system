const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VehicleRegistryModule", (m) => {
  // Tells Hardhat to deploy the "VehicleRegistry" contract we compiled in Step 2
  const vehicleRegistry = m.contract("VehicleRegistry");

  return { vehicleRegistry };
});