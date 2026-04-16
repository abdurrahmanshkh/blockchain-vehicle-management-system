"""
seed.py — Pre-populate MongoDB with test user accounts.
Run: python seed.py (from the backend/ directory with venv activated)
"""

from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "VehicleLifecycleDB")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Drop the users collection if it exists for a clean slate
db.drop_collection("users")
print("Dropped existing 'users' collection.")

users = [
    # RTO Admin
    {
        "username": "rto",
        "password": "rto",
        "role": "RTO",
        "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
    # Service Centers
    {
        "username": "service1",
        "password": "service1",
        "role": "SERVICE",
        "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    {
        "username": "service2",
        "password": "service2",
        "role": "SERVICE",
        "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    },
    # Vehicle Owners
    {
        "username": "user1",
        "password": "user1",
        "role": "USER",
        "walletAddress": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    },
    {
        "username": "user2",
        "password": "user2",
        "role": "USER",
        "walletAddress": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    },
    {
        "username": "user3",
        "password": "user3",
        "role": "USER",
        "walletAddress": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    },
    {
        "username": "user4",
        "password": "user4",
        "role": "USER",
        "walletAddress": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    },
    {
        "username": "user5",
        "password": "user5",
        "role": "USER",
        "walletAddress": "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    },
    {
        "username": "user6",
        "password": "user6",
        "role": "USER",
        "walletAddress": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    },
    {
        "username": "user7",
        "password": "user7",
        "role": "USER",
        "walletAddress": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    },
    {
        "username": "user8",
        "password": "user8",
        "role": "USER",
        "walletAddress": "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
    },
    {
        "username": "user9",
        "password": "user9",
        "role": "USER",
        "walletAddress": "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
    },
    {
        "username": "user10",
        "password": "user10",
        "role": "USER",
        "walletAddress": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    },
]

result = db["users"].insert_many(users)
print(f"Successfully inserted {len(result.inserted_ids)} user accounts into '{DB_NAME}.users'.")
print("\nAccounts seeded:")
for u in users:
    print(f"  {u['role']:8s} | {u['username']:10s} | {u['walletAddress']}")

client.close()
