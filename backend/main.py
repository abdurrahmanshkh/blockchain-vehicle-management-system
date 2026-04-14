from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from web3 import Web3
import json
import os

app = FastAPI(
    title="Vehicle Lifecycle Management API",
    description="Backend API to interact with the Ethereum Blockchain for Vehicle Tracking.",
    version="1.0.0"
)

# Enable CORS so our React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. BLOCKCHAIN CONFIGURATION
# ==========================================
# Replace this with the address from Step 3!
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Connect to the local Hardhat Node running in your other terminal
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Dynamically load the ABI from the blockchain folder
# This prevents us from having to copy-paste giant JSON strings
ARTIFACT_PATH = os.path.join("..", "blockchain", "artifacts", "contracts", "VehicleRegistry.sol", "VehicleRegistry.json")

try:
    with open(ARTIFACT_PATH, "r") as f:
        artifact = json.load(f)
        CONTRACT_ABI = artifact["abi"]
except FileNotFoundError:
    raise Exception("ABI file not found. Ensure you compiled the contract in Step 2.")

# Initialize the contract instance
if w3.is_connected():
    contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)
else:
    print("WARNING: Web3 is not connected to the Hardhat node.")

# ==========================================
# 2. API ENDPOINTS
# ==========================================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "Backend is active", 
        "blockchain_connected": w3.is_connected()
    }

@app.get("/api/vehicle/{vin}")
def get_vehicle_details(vin: str):
    """Fetch core vehicle details directly from the blockchain."""
    try:
        # Call the Solidity getter function
        vehicle_data = contract.functions.getVehicleDetails(vin).call()
        
        # vehicle_data returns a tuple. We map it to a readable dictionary based on our Solidity Struct.
        return {
            "vin": vehicle_data[0],
            "make": vehicle_data[1],
            "model": vehicle_data[2],
            "year": vehicle_data[3],
            "currentOwner": vehicle_data[4],
            "isRegistered": vehicle_data[5]
        }
    except Exception as e:
        # If the vehicle isn't registered, Solidity throws an error. We catch it here.
        raise HTTPException(status_code=404, detail="Vehicle not found or not registered.")

@app.get("/api/vehicle/{vin}/history")
def get_vehicle_history(vin: str):
    """Fetch the array of lifecycle records (Service, Accidents) from the blockchain."""
    try:
        history_data = contract.functions.getVehicleHistory(vin).call()
        
        formatted_history = []
        for record in history_data:
            formatted_history.append({
                "recordType": record[0],
                "ipfsHash": record[1],
                "timestamp": record[2],
                "provider": record[3],
                "description": record[4]
            })
            
        return formatted_history
    except Exception as e:
        raise HTTPException(status_code=404, detail="Vehicle history not found.")