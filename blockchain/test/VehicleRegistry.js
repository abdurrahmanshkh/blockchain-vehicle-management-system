const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vehicle Lifecycle Registry System", function () {
  let vehicleRegistry;
  let adminRTO, serviceCenter, buyer, seller;

  // This runs before every single test to give us a fresh blockchain state
  beforeEach(async function () {
    // Get dummy accounts from Hardhat
    [adminRTO, serviceCenter, seller, buyer] = await ethers.getSigners();
    
    // Deploy a fresh contract
    vehicleRegistry = await ethers.deployContract("VehicleRegistry");
  });

  describe("Deployment & Roles", function () {
    it("Should set the deployer as the RTO Admin", async function () {
      expect(await vehicleRegistry.adminRTO()).to.equal(adminRTO.address);
    });
  });

  describe("Vehicle Registration & Ownership", function () {
    it("Should allow the RTO to register a new vehicle", async function () {
      await vehicleRegistry.registerVehicle("VIN123", "Honda", "Civic", 2020, seller.address);
      const vehicle = await vehicleRegistry.getVehicleDetails("VIN123");
      
      expect(vehicle.isRegistered).to.be.true;
      expect(vehicle.currentOwner).to.equal(seller.address);
    });

    it("Should allow the owner to transfer the vehicle to a buyer", async function () {
      await vehicleRegistry.registerVehicle("VIN123", "Honda", "Civic", 2020, seller.address);
      
      // Seller initiates the transfer
      await vehicleRegistry.connect(seller).transferOwnership("VIN123", buyer.address);
      
      const vehicle = await vehicleRegistry.getVehicleDetails("VIN123");
      expect(vehicle.currentOwner).to.equal(buyer.address);
    });

    it("Should FAIL if a non-owner tries to transfer the vehicle", async function () {
      await vehicleRegistry.registerVehicle("VIN123", "Honda", "Civic", 2020, seller.address);
      
      // Buyer maliciously tries to transfer it to themselves without seller permission
      await expect(
        vehicleRegistry.connect(buyer).transferOwnership("VIN123", buyer.address)
      ).to.be.revertedWith("Only the vehicle owner can perform this action");
    });
  });

  describe("Lifecycle Records (IPFS Hashes)", function () {
    it("Should allow an authorized Service Center to append an IPFS hash", async function () {
      await vehicleRegistry.registerVehicle("VIN123", "Honda", "Civic", 2020, seller.address);
      
      // RTO Authorizes the service center
      await vehicleRegistry.authorizeServiceCenter(serviceCenter.address);
      
      // Service Center uploads the record
      const dummyIpfsHash = "QmHashxyz123456789";
      await vehicleRegistry.connect(serviceCenter).addServiceRecord("VIN123", dummyIpfsHash, "Replaced brake pads");
      
      const history = await vehicleRegistry.getVehicleHistory("VIN123");
      
      expect(history.length).to.equal(1);
      expect(history[0].ipfsHash).to.equal(dummyIpfsHash);
      expect(history[0].recordType).to.equal("Service");
    });
  });
});