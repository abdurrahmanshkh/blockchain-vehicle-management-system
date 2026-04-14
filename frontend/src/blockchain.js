import { ethers } from "ethers";
import ContractArtifact from "./contracts/VehicleRegistry.json";

// Replace with your deployed contract address!
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

export const getBlockchainContext = async () => {
    if (!window.ethereum) {
        alert("Please install MetaMask to use this application!");
        throw new Error("MetaMask not found");
    }

    // Connect to MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    await provider.send("eth_requestAccounts", []);
    
    // Get the signer (the currently connected account)
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Create the contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractArtifact.abi, signer);

    return { provider, signer, address, contract };
};