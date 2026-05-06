# Technical Working & Architecture

This document provides a deep-dive into the technical architecture, data storage strategy, and transaction lifecycle of the **Blockchain Vehicle Lifecycle Management System**.

---

## 1. System Architecture Overview
The project follows a **Hybrid Decentralized Architecture**. It combines the immutability of blockchain with the high performance of traditional web databases.

### Components:
- **Smart Contracts (Solidity)**: The engine that enforces business rules and maintains the "Source of Truth."
- **FastAPI Backend (Python)**: The "Sync Engine" that bridges the blockchain and the database.
- **MongoDB**: A high-speed caching layer that stores a processed version of the blockchain history for instant UI rendering.
- **React Frontend**: The interface that interacts with both the Backend API (for reading data) and MetaMask/Ethereum (for writing data).

---

## 2. Data Storage Strategy (The Three Tiers)

### Tier 1: The Blockchain (On-Chain)
To minimize gas costs, we differentiate between **State** and **Events**:
- **State Variables**: Only the "Current Status" is stored in contract memory (e.g., current owner, registration status, authorization lists).
- **Event Logs**: Detailed history (Transfers, Registrations, Maintenance) is emitted as **Events**. 
    - *Why?* Events are ~80% cheaper to store than contract arrays/mappings. They are immutable and permanently searchable via the blockchain index.

### Tier 2: MongoDB (Off-Chain Cache)
The blockchain is slow to query for complex history. 
- The backend reconstructs the "Ownership Chain" from blockchain events and stores it in MongoDB.
- MongoDB serves as a **read-optimized view** of the vehicle lifecycle.

### Tier 3: IPFS (Document Storage)
- For detailed service reports or PDFs, we store the file on **IPFS** and save only the **CID (Content Identifier)** or Hash on the blockchain. 
- This ensures data integrity (the file cannot be changed without changing the hash) without the massive cost of storing files on-chain.

---

## 3. The Transaction Lifecycle
When a user performs an action (e.g., **Transferring Ownership**), the data follows this path:

1.  **Frontend (Action)**: The user initiates a transfer in the React UI.
2.  **Wallet (Signing)**: Ethers.js triggers **MetaMask**. The user signs the transaction using their private key.
3.  **Smart Contract (Validation)**: The transaction is sent to the `VehicleRegistry.sol` contract. 
    - The contract verifies the sender is the current owner (`require(msg.sender == currentOwner)`).
    - If valid, the contract updates its state and emits the `OwnershipTransferred` event.
4.  **Backend (Syncing)**: The FastAPI **Sync Engine** detects the new transaction on the blockchain. 
    - It fetches the event logs for that VIN.
    - It parses the block timestamp and transaction hash.
5.  **Database (Persistence)**: The backend updates the vehicle document in MongoDB with the new owner and the extended ownership history array.
6.  **Frontend (Update)**: The Public Search and User Dashboard now show the updated data retrieved via the FastAPI REST API.

---

## 4. Feature-Specific Logic

### Vehicle Registration (RTO)
- **Constraint**: Only the address designated as `rto` can call `registerVehicle`.
- **Action**: Creates a new mapping entry and emits `VehicleRegistered`.

### Service Records (Service Centers)
- **Constraint**: Only addresses in the `authorizedServiceCenters` mapping can call `addServiceRecord`.
- **Action**: Links an IPFS hash and description to the VIN on-chain.

### Ownership History (Public Search)
- **Logic**: The UI does not query the blockchain directly. It queries the `/api/sync/{vin}` endpoint.
- **Data**: The backend merges the static metadata (Make/Model) with the chronological list of events (Registrations + Transfers) to build the visual timeline.

---

## 5. Security & Optimization Summary
- **Optimization**: By using a sync engine and events, we avoid "Gas Exhaustion" errors that would happen if we tried to store a 100-entry ownership array inside a smart contract.
- **Security**: All state-changing functions are protected by `modifiers` (e.g., `onlyOwner`, `onlyRTO`).
- **Auditability**: Every change in the system is linked to a **Transaction Hash**, which can be verified independently on any Ethereum block explorer (like Etherscan).
