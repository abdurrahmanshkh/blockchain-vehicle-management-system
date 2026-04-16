// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VehicleRegistry {
    // ==========================================
    // 1. STATE VARIABLES & ROLES
    // ==========================================
    // SLITHER FIX: Added 'immutable' keyword to save gas
    address public immutable adminRTO;

    mapping(address => bool) public authorizedServiceCenters;
    mapping(address => bool) public authorizedInsuranceCos;

    // ==========================================
    // 2. DATA STRUCTURES
    // ==========================================
    struct Vehicle {
        string vin;          
        string make;
        string model;
        uint16 year;
        address currentOwner;
        bool isRegistered;
    }

    struct Record {
        string recordType;   
        string ipfsHash;     
        uint256 date;        
        address provider;    
        string description;  
    }

    mapping(string => Vehicle) private vehicles;
    mapping(string => Record[]) private vehicleRecords;

    // ==========================================
    // 3. EVENTS
    // ==========================================
    // SLITHER FIX: Added 'indexed' to address parameters for faster log searching
    event VehicleRegistered(string vin, address indexed owner);
    event OwnershipTransferred(string vin, address indexed oldOwner, address indexed newOwner);
    event RecordAdded(string vin, string recordType, string ipfsHash);
    event EntityAuthorized(address indexed entity, string role);

    // ==========================================
    // 4. MODIFIERS
    // ==========================================
    modifier onlyRTO() {
        require(msg.sender == adminRTO, "Only RTO can perform this action");
        _;
    }

    modifier onlyVehicleOwner(string memory vin) {
        require(vehicles[vin].currentOwner == msg.sender, "Only the vehicle owner can perform this action");
        _;
    }

    // ==========================================
    // 5. CONSTRUCTOR
    // ==========================================
    constructor() {
        adminRTO = msg.sender;
    }

    // ==========================================
    // 6. ROLE MANAGEMENT FUNCTIONS
    // ==========================================
    // SLITHER FIX: Removed underscores from parameters
    function authorizeServiceCenter(address serviceCenter) public onlyRTO {
        authorizedServiceCenters[serviceCenter] = true;
        emit EntityAuthorized(serviceCenter, "ServiceCenter");
    }

    function authorizeInsuranceCompany(address insuranceCo) public onlyRTO {
        authorizedInsuranceCos[insuranceCo] = true;
        emit EntityAuthorized(insuranceCo, "InsuranceCompany");
    }

    // ==========================================
    // 7. CORE BUSINESS LOGIC
    // ==========================================
    function registerVehicle(string memory vin, string memory make, string memory model, uint16 year, address initialOwner) public onlyRTO {
        require(!vehicles[vin].isRegistered, "Vehicle already registered");

        vehicles[vin] = Vehicle({
            vin: vin,
            make: make,
            model: model,
            year: year,
            currentOwner: initialOwner,
            isRegistered: true
        });

        emit VehicleRegistered(vin, initialOwner);
    }

    function transferOwnership(string memory vin, address newOwner) public onlyVehicleOwner(vin) {
        require(vehicles[vin].isRegistered, "Vehicle not registered");
        require(newOwner != address(0), "Invalid new owner address");

        address oldOwner = vehicles[vin].currentOwner;
        vehicles[vin].currentOwner = newOwner;

        emit OwnershipTransferred(vin, oldOwner, newOwner);
    }

    function addServiceRecord(string memory vin, string memory ipfsHash, string memory description) public {
        require(authorizedServiceCenters[msg.sender], "Not an authorized Service Center");
        require(vehicles[vin].isRegistered, "Vehicle not registered");

        vehicleRecords[vin].push(Record({
            recordType: "Service",
            ipfsHash: ipfsHash,
            date: block.timestamp,
            provider: msg.sender,
            description: description
        }));

        emit RecordAdded(vin, "Service", ipfsHash);
    }

    function addAccidentRecord(string memory vin, string memory ipfsHash, string memory description) public {
        require(authorizedInsuranceCos[msg.sender], "Not an authorized Insurance Company");
        require(vehicles[vin].isRegistered, "Vehicle not registered");

        vehicleRecords[vin].push(Record({
            recordType: "Accident",
            ipfsHash: ipfsHash,
            date: block.timestamp,
            provider: msg.sender,
            description: description
        }));

        emit RecordAdded(vin, "Accident", ipfsHash);
    }

    // ==========================================
    // 8. GETTER FUNCTIONS 
    // ==========================================
    function getVehicleDetails(string memory vin) public view returns (Vehicle memory) {
        require(vehicles[vin].isRegistered, "Vehicle not registered");
        return vehicles[vin];
    }

    function getVehicleHistory(string memory vin) public view returns (Record[] memory) {
        require(vehicles[vin].isRegistered, "Vehicle not registered");
        return vehicleRecords[vin];
    }
}