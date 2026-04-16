"""
seed.py — Comprehensive Data Seeding Script
Populates Blockchain with 25 vehicles, 50+ service records, and transfers.
Synchronizes all data to MongoDB for a production-ready presentation demo.
"""

import os
import json
import time
import random
from datetime import datetime
from web3 import Web3
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. CONFIGURATION & SETUP
load_dotenv()

# Blockchain Connection
RPC_URL = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Hardhat Default Private Keys (Programmatic Automation)
# RTO Admin = Account[0]
RTO_PRIV_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# Service Center 1 = Account[1]
SC1_PRIV_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
# Service Center 2 = Account[2]
SC2_PRIV_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
# Users (Account[3] through Account[12])
USER_KEYS = [
    "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
    "0xde9be8585793bc9298e7881f10bcad7b92f72e96196758a59cdd51d916E270E1",
    "0xdfa09320e405629c1598cefa372675681c6bb58d2491b4fa7848419615a13c9a",
    "0xbd9230537243c2BA218fceef5bf199411956C2371900388e404Ff3A9d6468453",
    "0x2a871d0798f97d79848a011d13039d67D926659c25f9b493f3508493B140b656",
    "0xf214f2b2CD2352b1450a93a56Cf2cF0097651e06D9280B77402F6a096a604245",
    "0x701b615BBdf84de2a5676778f6990C3667c4A431525a74070a9E37108920C8a2",
    "0x689af8E031a0808a68843960010Ea037df75D3043147489569068019a7979661",
    "0xe486987771777037fB80816ED2663b655f448c26A065C791696547647cc96c9d",
    "0x47e179314cB1dBf4206584cDB62b9ce950137452e8964893796d889218d61794",
]

# MongoDB Connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "VehicleLifecycleDB")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Load ABI (Robust path detection)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(BASE_DIR, "..", "blockchain", "artifacts", "contracts", "VehicleRegistry.sol", "VehicleRegistry.json")
with open(ARTIFACT_PATH, "r") as f:
    CONTRACT_ABI = json.load(f)["abi"]

contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)

# 2. HELPER FUNCTIONS
def send_tx(priv_key, func_call):
    account = w3.eth.account.from_key(priv_key)
    tx = func_call.build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"  Sent TX: {tx_hash.hex()}")
    return w3.eth.wait_for_transaction_receipt(tx_hash)

# 3. SEED DATA DEFINITIONS
users = [
    {"username": "rto", "password": "rto", "role": "RTO", "displayName": "Regional Transport Office", "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
    {"username": "service1", "password": "service1", "role": "SERVICE", "displayName": "AutoCare Express", "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"},
    {"username": "service2", "password": "service2", "role": "SERVICE", "displayName": "QuickFix Motors", "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"},
    {"username": "user1", "password": "user1", "role": "USER", "displayName": "Rahul Sharma", "walletAddress": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"},
    {"username": "user2", "password": "user2", "role": "USER", "displayName": "Priya Patel", "walletAddress": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"},
    {"username": "user3", "password": "user3", "role": "USER", "displayName": "Amit Deshmukh", "walletAddress": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"},
    {"username": "user4", "password": "user4", "role": "USER", "displayName": "Sneha Kulkarni", "walletAddress": "0x976EA74026E726554dB657fA54763abd0C3a0aa9"},
    {"username": "user5", "password": "user5", "role": "USER", "displayName": "Vikram Singh", "walletAddress": "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"},
    {"username": "user6", "password": "user6", "role": "USER", "displayName": "Anjali Mehta", "walletAddress": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"},
    {"username": "user7", "password": "user7", "role": "USER", "displayName": "Rohan Gupta", "walletAddress": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"},
    {"username": "user8", "password": "user8", "role": "USER", "displayName": "Kavita Reddy", "walletAddress": "0xBcd4042DE499D14e55001CcbB24a551F3b954096"},
    {"username": "user9", "password": "user9", "role": "USER", "displayName": "Arjun Nair", "walletAddress": "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"},
    {"username": "user10", "password": "user10", "role": "USER", "displayName": "Deepika Joshi", "walletAddress": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"},
]

car_catalog = [
    ("Toyota", ["Camry", "Corolla", "RAV4", "Fortuner"]),
    ("Honda", ["Civic", "CR-V", "Accord", "City"]),
    ("Tesla", ["Model 3", "Model Y", "Model S"]),
    ("BMW", ["3 Series", "5 Series", "X5"]),
    ("Mercedes", ["C-Class", "E-Class", "GLC"]),
    ("Ford", ["Mustang", "Endeavour", "F-150"]),
    ("Hyundai", ["Creta", "Verna", "Ioniq 5"]),
]

services = [
    "Annual General Service", "Brake Pad Replacement", "Oil and Filter Change", 
    "Battery Health Check", "Tire Rotation and Balance", "AC System Cleaning",
    "ECU Software Update", "Full Body Polish", "Suspension Tuning"
]

# 4. EXECUTION
def main():
    print("--- Starting Comprehensive Seed Script ---")

    # Step 1: Seed Users to MongoDB
    db.drop_collection("users")
    db.users.insert_many(users)
    print(f"User collection seeded ({len(users)} users).")

    # Step 2: Authorize Service Centers on Blockchain
    print("\nAuthorizing Service Centers on Blockchain...")
    send_tx(RTO_PRIV_KEY, contract.functions.authorizeServiceCenter(users[1]['walletAddress']))
    send_tx(RTO_PRIV_KEY, contract.functions.authorizeServiceCenter(users[2]['walletAddress']))
    print("Service Centers authorized.")

    # Step 3: Register 25 Vehicles
    print("\nRegistering 25 Vehicles...")
    vins = []
    owner_wallets = [u['walletAddress'] for u in users if u['role'] == 'USER']
    
    for i in range(25):
        make, models = random.choice(car_catalog)
        model = random.choice(models)
        year = random.randint(2018, 2024)
        vin = f"VIN{random.randint(100000, 999999)}{chr(65+i)}"
        owner = random.choice(owner_wallets)
        
        print(f"  Registering {make} {model} ({vin}) to {owner}...")
        send_tx(RTO_PRIV_KEY, contract.functions.registerVehicle(vin, make, model, year, owner))
        vins.append(vin)
    print("25 Vehicles registered.")

    # Step 4: Perform ~15 Transfers
    print("\nPerforming 15 Ownership Transfers...")
    for _ in range(15):
        vin = random.choice(vins)
        # Fetch current owner on-chain
        current_owner_addr = contract.functions.getVehicleDetails(vin).call()[4]
        
        # Find the private key for this owner
        owner_idx = -1
        for i, u in enumerate(users):
            if u['walletAddress'].lower() == current_owner_addr.lower():
                owner_idx = i
                break
        
        if owner_idx < 3: continue # Skip if RTO/Service
        
        # Hardhat key mapping: Acc[3] = USER_KEYS[0]
        priv_key = USER_KEYS[owner_idx - 3]
        
        # Pick new owner (not current)
        new_owner = random.choice([u['walletAddress'] for u in users if u['role'] == 'USER' and u['walletAddress'] != current_owner_addr])
        
        print(f"  Transferring {vin} from {current_owner_addr} to {new_owner}...")
        try:
            send_tx(priv_key, contract.functions.transferOwnership(vin, new_owner))
        except Exception as e:
            print(f"  ⚠️ Transfer failed (maybe logic error in mapping): {e}")
    print("Transfers complete.")

    # Step 5: Add ~50 Service Records
    print("\nAdding 50 Service Records...")
    sc_keys = [SC1_PRIV_KEY, SC2_PRIV_KEY]
    for i in range(50):
        vin = random.choice(vins)
        desc = random.choice(services)
        sc_key = random.choice(sc_keys)
        # Placeholder IPFS Hash
        ipfs = f"Qm{random.randint(100000, 999999)}AbCdEfGhIjKlMnOpQrStUvWxYz{i}"
        
        print(f"  [{i+1}/50] Adding service record for {vin}: {desc}...")
        try:
            send_tx(sc_key, contract.functions.addServiceRecord(vin, ipfs, desc))
        except Exception as e:
            print(f"  ⚠️ Service record failed: {e}")
    print("Service records added.")

    # Step 6: Sync everything to MongoDB
    print("\nSynchronizing Blockchain data to MongoDB Cache...")
    # We replicate the sync logic here to avoid external API calls
    db.drop_collection("vehicles")
    
    for vin in vins:
        print(f"  Syncing {vin}...")
        v_data = contract.functions.getVehicleDetails(vin).call()
        h_data = contract.functions.getVehicleHistory(vin).call()
        
        # Events for Ownership History
        reg_logs = contract.events.VehicleRegistered().get_logs(from_block=0, to_block="latest", argument_filters={"vin": vin})
        trans_logs = contract.events.OwnershipTransferred().get_logs(from_block=0, to_block="latest", argument_filters={"vin": vin})
        
        ownership_history = []
        for log in reg_logs:
            block = w3.eth.get_block(log["blockNumber"])
            ownership_history.append({"event": "Registration", "from": None, "to": log["args"]["owner"], "timestamp": block["timestamp"], "txHash": log["transactionHash"].hex(), "blockNumber": log["blockNumber"]})
        for log in trans_logs:
            block = w3.eth.get_block(log["blockNumber"])
            ownership_history.append({"event": "Transfer", "from": log["args"]["oldOwner"], "to": log["args"]["newOwner"], "timestamp": block["timestamp"], "txHash": log["transactionHash"].hex(), "blockNumber": log["blockNumber"]})
        
        ownership_history.sort(key=lambda x: x["blockNumber"])
        
        vehicle_dict = {
            "vin": v_data[0], "make": v_data[1], "model": v_data[2], "year": v_data[3], "currentOwner": v_data[4], "isRegistered": v_data[5],
            "history": [{"recordType": r[0], "ipfsHash": r[1], "timestamp": r[2], "provider": r[3], "description": r[4]} for r in h_data],
            "ownershipHistory": ownership_history,
            "ownerCount": len(ownership_history)
        }
        db.vehicles.update_one({"vin": vin}, {"$set": vehicle_dict}, upsert=True)

    print("\n--- Seeding Completed Successfully! ---")
    print(f"Total Vehicles: 25")
    print(f"Total Users:    {len(users)}")
    print("You can now start the web app and enjoy the fully populated dashboards.")

if __name__ == "__main__":
    main()
