# Blockchain Vehicle Lifecycle Management System

## Project Overview
The **Blockchain Vehicle Lifecycle Management System** is a decentralized platform designed to bring transparency, security, and trust to the automotive industry. By recording every significant event in a vehicle's life—from initial registration to ownership transfers and maintenance records—on an immutable blockchain, the system eliminates the possibility of record tampering and fraud.

## Technology Stack
- **Blockchain**: Ethereum (Solidity Smart Contracts)
- **Development Environment**: Hardhat
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Caching layer for fast retrieval)
- **Frontend**: React.js with Vite and Tailwind CSS
- **Blockchain Interface**: Web3.py (Backend) & Ethers.js (Frontend)

---

## Key Features

### 1. RTO (Regional Transport Office) Dashboard
The RTO acts as the root of trust in the system.
- **Vehicle Registration**: The RTO is the only entity authorized to register new vehicles on the blockchain. They link a unique VIN to an owner's wallet address.
- **Service Center Authorization**: The RTO authorizes reputable service centers to add maintenance records, ensuring that only certified professionals can update a vehicle's health history.
- **Master Registry**: A comprehensive view of all registered vehicles and their current status.

### 2. Service Center Dashboard
Authorized service centers contribute to the vehicle's "Health Record."
- **Add Service Records**: Service centers can log maintenance tasks (e.g., oil changes, brake replacements).
- **Verifiable Maintenance**: Each record includes a description and a link to off-chain data (simulated via IPFS hashes), creating a tamper-proof service history that stays with the vehicle forever.

### 3. User Dashboard
Provides a user-friendly interface for vehicle owners.
- **My Vehicles**: Users can see all vehicles registered to their specific wallet address.
- **Ownership Transfer**: Owners can initiate a transfer of ownership to another user's wallet address directly. This updates the blockchain record instantly.
- **Owner Rank**: Displays if the user is the 1st, 2nd, or nth owner of the vehicle.

### 4. Public Search & Ownership History
The most powerful tool for potential buyers and investigators.
- **VIN Lookup**: Anyone can search for a vehicle using its VIN.
- **Ownership Chain Timeline**: A beautiful, vertical visual timeline showing the entire history of the vehicle. It displays every transfer, the date it happened, and the transaction hash as proof.
- **Service History**: A detailed list of all maintenance performed on the vehicle, providing a complete picture of its condition.
- **Status Badges**: Visual indicators showing if a vehicle is "Single Owner" or has had multiple owners.

### 5. Automated Data Seeding
- **Comprehensive Demo Data**: The `seed.py` script populates the system with 25 vehicles, 50+ service records, and complex ownership chains (up to 4 owners per vehicle) to demonstrate the system's capabilities in a production-like environment.

---

## How It Works: The Hybrid Architecture

### The Source of Truth (Blockchain)
All critical transactions (Registration, Transfer, Service) happen on-chain. We use **Ethereum Event Logs** (`VehicleRegistered`, `OwnershipTransferred`, `ServiceRecordAdded`) to store history. This is significantly more gas-efficient than storing large arrays in the contract state while remaining just as immutable.

### The Performance Layer (Backend Sync)
Querying the blockchain for every page load is slow. To solve this, our FastAPI backend implements a **Synchronization Engine**:
1. It listens for/scans the blockchain for event logs related to a VIN.
2. It reconstructs the chronological history (Ownership Chain) from these logs.
3. It calculates the `ownerCount` and current status.
4. It caches this processed data in **MongoDB**.

### The User Interface (Frontend)
The React frontend communicates with the FastAPI backend to display data at high speed. For write operations (like transferring a vehicle), the frontend interacts directly with the user's wallet (e.g., MetaMask) to sign transactions, which are then picked up by the sync engine.

---

## Security & Auditing
The system has been designed with security as a priority:
- **Static Analysis**: Audited using **Slither** to detect common Solidity vulnerabilities.
- **Symbolic Execution**: Tested with **Mythril** to identify complex logical flaws.
- **Property-Based Testing**: Validated using **Echidna** to ensure that "invariants" (like only owners being able to transfer) can never be broken.

---

## Getting Started

### Prerequisites
- Node.js & NPM
- Python 3.10+
- MongoDB (Running locally)

### Installation
1. **Blockchain**: Run `npx hardhat node` in the `blockchain` directory.
2. **Backend**: Install requirements and run `uvicorn main:app --reload` in the `backend` directory.
3. **Frontend**: Run `npm install` and `npm run dev` in the `frontend` directory.
4. **Seed Data**: Run `python seed.py` in the `backend` directory to populate the demo data.
