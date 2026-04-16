from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3
from pymongo import MongoClient
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Vehicle Lifecycle Management API",
    description="Backend API to interact with Ethereum, IPFS, and MongoDB.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. CONFIGURATIONS
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
    if w3.is_connected():
        contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)
except Exception as e:
    print(f"Blockchain setup error: {e}")

# --- MONGODB ---
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "VehicleLifecycleDB")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
vehicles_collection = db["vehicles"]
users_collection = db["users"]

# --- PINATA (IPFS) ---
PINATA_JWT = os.getenv("PINATA_JWT")
PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

headers = {
    "Authorization": f"Bearer {PINATA_JWT}"
}

# ==========================================
# 2. MODELS
# ==========================================
class LoginRequest(BaseModel):
    username: str
    password: str

# ==========================================
# 3. API ENDPOINTS
# ==========================================

@app.get("/")
def read_root():
    return {
        "status": "Backend is active", 
        "blockchain_connected": w3.is_connected(),
        "mongodb_connected": "VehicleLifecycleDB" in mongo_client.list_database_names()
    }

# --- AUTH ENDPOINT ---
@app.post("/api/login")
def login(req: LoginRequest):
    """Authenticates a user against the MongoDB users collection."""
    user = users_collection.find_one(
        {"username": req.username, "password": req.password},
        {"_id": 0}  # Exclude Mongo's internal _id
    )
    if user:
        return user
    raise HTTPException(status_code=401, detail="Invalid credentials")

# --- IPFS ENDPOINT ---
@app.post("/api/upload")
async def upload_file_to_ipfs(file: UploadFile = File(...)):
    """Uploads a file to IPFS via Pinata and returns the CID (Hash)."""
    if not PINATA_JWT or PINATA_JWT == "YOUR_PINATA_JWT_HERE":
        raise HTTPException(status_code=500, detail="Pinata JWT not configured in .env")

    try:
        # Read file contents into memory
        file_content = await file.read()
        
        # Prepare the file for the Pinata API
        files = {
            'file': (file.filename, file_content)
        }
        
        # Send POST request to Pinata
        response = requests.post(PINATA_API_URL, files=files, headers=headers)
        
        if response.status_code == 200:
            ipfs_hash = response.json()["IpfsHash"]
            return {"message": "File uploaded successfully", "ipfsHash": ipfs_hash}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# --- BLOCKCHAIN TO MONGODB SYNC ENDPOINT ---
@app.post("/api/sync/{vin}")
def sync_vehicle_to_db(vin: str):
    """
    Fetches the latest vehicle data and history from the blockchain 
    and caches it in MongoDB for lightning-fast frontend reads.
    """
    try:
        # 1. Fetch from Blockchain
        vehicle_data = contract.functions.getVehicleDetails(vin).call()
        history_data = contract.functions.getVehicleHistory(vin).call()
        
        # 2. Format Vehicle Data
        vehicle_dict = {
            "vin": vehicle_data[0],
            "make": vehicle_data[1],
            "model": vehicle_data[2],
            "year": vehicle_data[3],
            "currentOwner": vehicle_data[4],
            "isRegistered": vehicle_data[5]
        }
        
        # 3. Format History Data
        formatted_history = []
        for record in history_data:
            formatted_history.append({
                "recordType": record[0],
                "ipfsHash": record[1],
                "timestamp": record[2],
                "provider": record[3],
                "description": record[4]
            })
            
        vehicle_dict["history"] = formatted_history

        # 4. Save/Update MongoDB Cache
        # Use upsert=True to insert if it doesn't exist, or update if it does
        vehicles_collection.update_one(
            {"vin": vin}, 
            {"$set": vehicle_dict}, 
            upsert=True
        )
        
        return {"message": f"Vehicle {vin} successfully synced to MongoDB."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync vehicle: {str(e)}")

# --- CACHED READ ENDPOINT ---
@app.get("/api/vehicle/{vin}")
def get_vehicle(vin: str):
    """Fetches vehicle data instantly from the MongoDB Cache."""
    vehicle = vehicles_collection.find_one({"vin": vin}, {"_id": 0}) # Exclude Mongo's internal _id
    if vehicle:
        return vehicle
    raise HTTPException(status_code=404, detail="Vehicle not found in cache. Ensure it has been synced.")

# --- USER LISTING ENDPOINT ---
@app.get("/api/users")
def get_users(role: str = None):
    """Returns a list of users, optionally filtered by role. Excludes passwords."""
    query = {}
    if role:
        query["role"] = role.upper()
    users = list(users_collection.find(query, {"_id": 0, "password": 0}))
    return users

# --- VEHICLES BY OWNER ENDPOINT ---
@app.get("/api/vehicles/owner/{wallet_address}")
def get_vehicles_by_owner(wallet_address: str):
    """Returns all vehicles owned by a specific wallet address from the MongoDB cache."""
    vehicles = list(vehicles_collection.find(
        {"currentOwner": {"$regex": f"^{wallet_address}$", "$options": "i"}},
        {"_id": 0}
    ))
    return vehicles

# --- ALL VEHICLES ENDPOINT ---
@app.get("/api/vehicles/all")
def get_all_vehicles():
    """Returns all registered vehicles from the MongoDB cache. Used by RTO dashboard."""
    vehicles = list(vehicles_collection.find({}, {"_id": 0}))
    return vehicles