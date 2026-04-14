import { ethers } from "ethers";
import ContractArtifact from "./contracts/VehicleRegistry.json";

// Replace with your deployed contract address!
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

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