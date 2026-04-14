// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VehicleRegistry {
    // ==========================================
    // 1. STATE VARIABLES & ROLES
    // ==========================================
    address public adminRTO;

    mapping(address => bool) public authorizedServiceCenters;
    mapping(address => bool) public authorizedInsuranceCos;

    // ==========================================
    // 2. DATA STRUCTURES
    // ==========================================
    struct Vehicle {
        string vin;          // Vehicle Identification Number
        string make;
        string model;
        uint16 year;
        address currentOwner;
        bool isRegistered;
    }

    struct Record {
        string recordType;   // e.g., "Service", "Accident"
        string ipfsHash;     // Link to the document/image on IPFS
        uint256 date;        // Timestamp
        address provider;    // Who uploaded it (Service Center / Insurance)
        string description;  // Short text summary
    }

    // Mapping VIN to Vehicle details
    mapping(string => Vehicle) private vehicles;
    
    // Mapping VIN to an array of lifecycle records
    mapping(string => Record[]) private vehicleRecords;

    // ==========================================
    // 3. EVENTS (For the frontend to listen to)
    // ==========================================
    event VehicleRegistered(string vin, address owner);
    event OwnershipTransferred(string vin, address oldOwner, address newOwner);
    event RecordAdded(string vin, string recordType, string ipfsHash);
    event EntityAuthorized(address entity, string role);

    // ==========================================
    // 4. MODIFIERS (Access Control)
    // ==========================================
    modifier onlyRTO() {
        require(msg.sender == adminRTO, "Only RTO can perform this action");
        _;
    }

    modifier onlyVehicleOwner(string memory _vin) {
        require(vehicles[_vin].currentOwner == msg.sender, "Only the vehicle owner can perform this action");
        _;
    }

    // ==========================================
    // 5. CONSTRUCTOR
    // ==========================================
    constructor() {
        // The account that deploys the contract becomes the RTO Admin
        adminRTO = msg.sender;
    }

    // ==========================================
    // 6. ROLE MANAGEMENT FUNCTIONS
    // ==========================================
    function authorizeServiceCenter(address _serviceCenter) public onlyRTO {
        authorizedServiceCenters[_serviceCenter] = true;
        emit EntityAuthorized(_serviceCenter, "ServiceCenter");
    }

    function authorizeInsuranceCompany(address _insuranceCo) public onlyRTO {
        authorizedInsuranceCos[_insuranceCo] = true;
        emit EntityAuthorized(_insuranceCo, "InsuranceCompany");
    }

    // ==========================================
    // 7. CORE BUSINESS LOGIC
    // ==========================================
    
    // RTO registers a new vehicle
    function registerVehicle(string memory _vin, string memory _make, string memory _model, uint16 _year, address _initialOwner) public onlyRTO {
        require(!vehicles[_vin].isRegistered, "Vehicle already registered");

        vehicles[_vin] = Vehicle({
            vin: _vin,
            make: _make,
            model: _model,
            year: _year,
            currentOwner: _initialOwner,
            isRegistered: true
        });

        emit VehicleRegistered(_vin, _initialOwner);
    }

    // Owner transfers vehicle to a buyer
    function transferOwnership(string memory _vin, address _newOwner) public onlyVehicleOwner(_vin) {
        require(vehicles[_vin].isRegistered, "Vehicle not registered");
        require(_newOwner != address(0), "Invalid new owner address");

        address oldOwner = vehicles[_vin].currentOwner;
        vehicles[_vin].currentOwner = _newOwner;

        emit OwnershipTransferred(_vin, oldOwner, _newOwner);
    }

    // Service Center adds a maintenance record (IPFS Hash)
    function addServiceRecord(string memory _vin, string memory _ipfsHash, string memory _description) public {
        require(authorizedServiceCenters[msg.sender], "Not an authorized Service Center");
        require(vehicles[_vin].isRegistered, "Vehicle not registered");

        vehicleRecords[_vin].push(Record({
            recordType: "Service",
            ipfsHash: _ipfsHash,
            date: block.timestamp,
            provider: msg.sender,
            description: _description
        }));

        emit RecordAdded(_vin, "Service", _ipfsHash);
    }

    // Insurance Company adds an accident record (IPFS Hash)
    function addAccidentRecord(string memory _vin, string memory _ipfsHash, string memory _description) public {
        require(authorizedInsuranceCos[msg.sender], "Not an authorized Insurance Company");
        require(vehicles[_vin].isRegistered, "Vehicle not registered");

        vehicleRecords[_vin].push(Record({
            recordType: "Accident",
            ipfsHash: _ipfsHash,
            date: block.timestamp,
            provider: msg.sender,
            description: _description
        }));

        emit RecordAdded(_vin, "Accident", _ipfsHash);
    }

    // ==========================================
    // 8. GETTER FUNCTIONS (Read-only)
    // ==========================================
    function getVehicleDetails(string memory _vin) public view returns (Vehicle memory) {
        require(vehicles[_vin].isRegistered, "Vehicle not registered");
        return vehicles[_vin];
    }

    function getVehicleHistory(string memory _vin) public view returns (Record[] memory) {
        require(vehicles[_vin].isRegistered, "Vehicle not registered");
        return vehicleRecords[_vin];
    }
}