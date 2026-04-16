# 🚗 Blockchain-Based Vehicle Lifecycle Management System

## 📖 Abstract
The used-car market faces major challenges such as lack of transparency, odometer fraud, and fragmented accident histories. This project solves these issues using a decentralized Web2.5 architecture. By leveraging Ethereum smart contracts for immutable ownership tracking, IPFS for decentralized document storage, and MongoDB for high-speed caching, this system ensures trust between buyers, sellers, service centers, and the RTO.

## 🛠 Tech Stack
* **Blockchain:** Hardhat (Local Ethereum Network), Solidity (`^0.8.24`), Ethers.js
* **Backend:** FastAPI (Python 3.12), Web3.py, Pymongo, SlowAPI (Rate Limiting)
* **Frontend:** React.js, Vite, Tailwind CSS
* **Storage:** MongoDB (Off-chain Cache), Pinata (IPFS Gateway)

## 📋 Prerequisites
Ensure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v22+)
* [Python](https://www.python.org/) (v3.12+)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Running locally on port `27017`)
* [MetaMask](https://metamask.io/) Browser Extension

## 🚀 Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/abdurrahmanshkh/blockchain-vehicle-management-system
cd VehicleLifecycleSystem
```

### 2. Start the Blockchain Network
```bash
cd blockchain
npm install
npx hardhat node
```
*Leave this terminal open. Import Account #0 into MetaMask to act as the RTO Admin.*

### 3. Deploy the Smart Contract
Open a *new* terminal in the `blockchain` folder:
```bash
npx hardhat ignition deploy ignition/modules/VehicleRegistry.js --network localhost
```
*(Copy the deployed contract address and paste it into `backend/main.py` and `frontend/src/blockchain.js`)*.

### 4. Setup the Backend
Open a *new* terminal in the `backend` folder:
```bash
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory and add your Pinata JWT:
```env
PINATA_JWT=your_pinata_jwt_here
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=VehicleLifecycleDB
```
Start the server:
```bash
uvicorn main:app --reload
```

### 5. Start the Frontend
Open a *new* terminal in the `frontend` folder:
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser. Ensure your MetaMask network is set to Localhost (RPC: `http://127.0.0.1:8545`, Chain ID: `31337`).

## 🛡️ Security
This project has been audited using **Slither**, returning zero critical vulnerabilities (no reentrancy, overflow, or access control flaws).