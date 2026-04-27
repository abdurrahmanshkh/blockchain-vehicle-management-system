"""
seed.py — Comprehensive Data Seeding Script (Self-Funding Version)
Populates Blockchain with 25 vehicles, 50+ service records, and multi-step transfers.
"""

import os
import json
import time
import random
from datetime import datetime
from web3 import Web3
from pymongo import MongoClient
from eth_account import Account
from dotenv import load_dotenv

# 1. CONFIGURATION & SETUP
load_dotenv()

# Blockchain Connection
RPC_URL = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Standard Hardhat Default Private Keys (Accounts 0 to 12)
ALL_KEYS = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", # 0: RTO
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", # 1: SC1
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", # 2: SC2
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", # 3: User1
    "0x47e179314cB1dBf4206584cDB62b9ce950137452e8964893796d889218d61794", # 4: User2
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d33aF885172a6a12a0", # 5: User3
    "0x5bfe1760413009697e0892a0004fb0f2491b4fa7848419615a13c9a62961d679", # 6: User4
    "0x1f02c67d96E25b128526569ec1f994B6984e96196758a59cdd51d916E270E11", # 7: User5
    "0x701b615BBdf84de2a5676778f6990C3667c4A431525a74070a9E37108920C8a2", # 8: User6
    "0x2a871d0798f97d79848a011d13039d67D926659c25f9b493f3508493B140b656", # 9: User7
    "0xde9be8585793bc9298e7881f10bcad7b92f72e96196758a59cdd51d916E270E1", # 10: User8
    "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", # 11: User9
    "0x18FceEf5bf199411956C2371900388e404Ff3A9d646845311956C2371900388e", # 12: User10
    "0xdfa09320e405629c1598cefa372675681c6bb58d2491b4fa7848419615a13c9a", # 13: User11
]

# Map Wallets to Keys Dynamically
WALLET_TO_KEY = {}
DISPLAY_NAMES = [
    "Regional Transport Office", 
    "AutoCare Express", "QuickFix Motors",
    "Rahul Sharma", "Priya Patel", "Amit Deshmukh", "Sneha Kulkarni", 
    "Vikram Singh", "Anjali Mehta", "Rohan Gupta", "Kavita Reddy", 
    "Arjun Nair", "Deepika Joshi"
]

users = []
for i in range(len(DISPLAY_NAMES)):
    key = ALL_KEYS[i]
    address = Account.from_key(key).address
    WALLET_TO_KEY[address.lower()] = key
    
    role = "RTO" if i == 0 else "SERVICE" if i < 3 else "USER"
    username = f"rto" if i == 0 else f"service{i}" if i < 3 else f"user{i-2}"
    
    users.append({
        "username": username,
        "password": username,
        "role": role,
        "displayName": DISPLAY_NAMES[i],
        "walletAddress": address
    })

# MongoDB Connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "VehicleLifecycleDB")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Load ABI
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(BASE_DIR, "..", "blockchain", "artifacts", "contracts", "VehicleRegistry.sol", "VehicleRegistry.json")
with open(ARTIFACT_PATH, "r") as f:
    CONTRACT_ABI = json.load(f)["abi"]

contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)

# 2. HELPER FUNCTIONS
def send_tx(priv_key, func_call):
    account = Account.from_key(priv_key)
    tx = func_call.build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    signed_tx = Account.sign_transaction(tx, priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    return w3.eth.wait_for_transaction_receipt(tx_hash)

def send_eth(from_priv_key, to_address, amount_eth):
    account = Account.from_key(from_priv_key)
    tx = {
        'to': to_address,
        'value': w3.to_wei(amount_eth, 'ether'),
        'gas': 21000,
        'gasPrice': w3.to_wei('50', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address),
    }
    signed_tx = Account.sign_transaction(tx, from_priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    return w3.eth.wait_for_transaction_receipt(tx_hash)

car_catalog = [
    ("Toyota", ["Camry", "Corolla", "RAV4", "Fortuner"]),
    ("Honda", ["Civic", "CR-V", "Accord", "City"]),
    ("Tesla", ["Model 3", "Model Y", "Model S"]),
    ("BMW", ["3 Series", "5 Series", "X5"]),
    ("Mercedes", ["C-Class", "E-Class", "GLC"]),
    ("Ford", ["Mustang", "Endeavour", "F-150"]),
    ("Hyundai", ["Creta", "Verna", "Ioniq 5"]),
]
services = ["Annual General Service", "Brake Pad Replacement", "Oil and Filter Change", "Tire Rotation"]

def main():
    print("--- Starting Robust Data Seeding (With Auto-Funding) ---")

    # Step 1: Users
    db.drop_collection("users")
    db.users.insert_many(users)
    print(f"Users seeded ({len(users)}).")

    # Step 2: Distribution of Gas Funds (RTO funds all other accounts)
    print("\nDistributing Gas Funds from RTO to all accounts...")
    RTO_PRIV = ALL_KEYS[0]
    for u in users[1:]: # Skip RTO
        balance = w3.eth.get_balance(u['walletAddress'])
        if balance < w3.to_wei(2, 'ether'):
            print(f"  Funding {u['username']} ({u['walletAddress']}) with 10 ETH...")
            send_eth(RTO_PRIV, u['walletAddress'], 10)
    print("All accounts funded.")

    # Step 3: Auth
    print("\nAuthorizing Service Centers...")
    send_tx(RTO_PRIV, contract.functions.authorizeServiceCenter(users[1]['walletAddress']))
    send_tx(RTO_PRIV, contract.functions.authorizeServiceCenter(users[2]['walletAddress']))
    print("Service Centers authorized.")

    # Step 4: Register 25 Vehicles
    print("\nRegistering 25 Vehicles...")
    vins = []
    owner_wallets = [u['walletAddress'] for u in users if u['role'] == 'USER']
    for i in range(25):
        make, models = random.choice(car_catalog)
        model = random.choice(models)
        vin = f"VIN{random.randint(100000, 999999)}{chr(65+i)}"
        owner = owner_wallets[i % len(owner_wallets)]
        send_tx(RTO_PRIV, contract.functions.registerVehicle(vin, make, model, 2018+random.randint(0,6), owner))
        vins.append(vin)
    print("25 Vehicles registered.")

    # Step 5: Rich Ownership Transfers
    print("\nExecuting Ownership Transfers...")
    # Pass 1: 15 vehicles to depth 2
    for i in range(15):
        vin = vins[i]
        curr = contract.functions.getVehicleDetails(vin).call()[4]
        nxt = owner_wallets[(owner_wallets.index(curr) + 1) % len(owner_wallets)]
        print(f"  Transferring {vin} to depth 2...")
        send_tx(WALLET_TO_KEY[curr.lower()], contract.functions.transferOwnership(vin, nxt))
    
    # Pass 2: 5 vehicles to depth 3
    for i in range(5):
        vin = vins[i]
        curr = contract.functions.getVehicleDetails(vin).call()[4]
        nxt = owner_wallets[(owner_wallets.index(curr) + 1) % len(owner_wallets)]
        print(f"  Transferring {vin} to depth 3...")
        send_tx(WALLET_TO_KEY[curr.lower()], contract.functions.transferOwnership(vin, nxt))

    # Pass 3: 2 vehicles to depth 4
    for i in range(2):
        vin = vins[i]
        curr = contract.functions.getVehicleDetails(vin).call()[4]
        nxt = owner_wallets[(owner_wallets.index(curr) + 1) % len(owner_wallets)]
        print(f"  Transferring {vin} to depth 4...")
        send_tx(WALLET_TO_KEY[curr.lower()], contract.functions.transferOwnership(vin, nxt))
    print("Transfers complete.")

    # Step 6: Service Records
    print("\nAdding 50 Service Records...")
    for i in range(50):
        vin = random.choice(vins)
        sc_key = ALL_KEYS[random.randint(1,2)]
        ipfs = f"QmDemoHash{random.randint(100,999)}Record{i}"
        send_tx(sc_key, contract.functions.addServiceRecord(vin, ipfs, random.choice(services)))
    print("50 Service records added.")

    # Step 7: Sync
    print("\nFinal Sync to MongoDB...")
    db.drop_collection("vehicles")
    for vin in vins:
        v = contract.functions.getVehicleDetails(vin).call()
        h = contract.functions.getVehicleHistory(vin).call()
        reg_logs = contract.events.VehicleRegistered().get_logs(from_block=0, to_block="latest", argument_filters={"vin": vin})
        tr_logs = contract.events.OwnershipTransferred().get_logs(from_block=0, to_block="latest", argument_filters={"vin": vin})
        own_h = []
        for l in reg_logs:
            blk = w3.eth.get_block(l["blockNumber"])
            own_h.append({"event": "Registration", "to": l["args"]["owner"], "timestamp": blk["timestamp"], "txHash": l["transactionHash"].hex()})
        for l in tr_logs:
            blk = w3.eth.get_block(l["blockNumber"])
            own_h.append({"event": "Transfer", "from": l["args"]["oldOwner"], "to": l["args"]["newOwner"], "timestamp": blk["timestamp"], "txHash": l["transactionHash"].hex()})
        own_h.sort(key=lambda x: x["timestamp"]) # Sort by timestamp for UI
        db.vehicles.update_one({"vin": vin}, {"$set": {
            "vin": v[0], "make": v[1], "model": v[2], "year": v[3], "currentOwner": v[4], "isRegistered": v[5],
            "history": [{"recordType": r[0], "ipfsHash": r[1], "timestamp": r[2], "provider": r[3], "description": r[4]} for r in h],
            "ownershipHistory": own_h, "ownerCount": len(own_h)
        }}, upsert=True)
    print("Sync complete. Seeding finished.")

if __name__ == "__main__":
    main()
