import React, { useState } from 'react';
import axios from 'axios';
import { getBlockchainContext } from './blockchain';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [searchVin, setSearchVin] = useState('');
  const [vehicleData, setVehicleData] = useState(null);

  // 1. Connect Wallet
  const connectWallet = async () => {
    try {
      const { address, contract } = await getBlockchainContext();
      setAccount(address);
      setContract(contract);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  // 2. Register Vehicle (Blockchain Write + Backend Sync)
  const registerVehicle = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect wallet first");
    setLoading(true);

    try {
      // Step A: Send transaction to the blockchain via MetaMask
      const tx = await contract.registerVehicle(vin, make, model, parseInt(year), account);
      console.log("Transaction sent! Hash:", tx.hash);
      
      // Wait for the block to be mined
      await tx.wait();
      alert("Vehicle Registered on Blockchain!");

      // Step B: Tell our FastAPI backend to sync this new data into MongoDB
      await axios.post(`http://127.0.0.1:8000/api/sync/${vin}`);
      alert("Vehicle Synced to MongoDB Cache!");
      
      // Clear form
      setVin(''); setMake(''); setModel(''); setYear('');
    } catch (error) {
      console.error(error);
      alert("Registration failed. Are you sure you are the RTO admin?");
    } finally {
      setLoading(false);
    }
  };

  // 3. Search Vehicle (FastAPI Read)
  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/vehicle/${searchVin}`);
      setVehicleData(response.data);
    } catch (error) {
      console.error(error);
      alert("Vehicle not found in database.");
      setVehicleData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex justify-between items-center bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-blue-800">RTO Vehicle Lifecycle Manager</h1>
        {account ? (
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-mono text-sm">
            Connected: {account.substring(0, 6)}...{account.substring(38)}
          </span>
        ) : (
          <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
            Connect MetaMask
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: REGISTRATION FORM */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Register New Vehicle (RTO Only)</h2>
          <form onSubmit={registerVehicle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">VIN</label>
              <input type="text" required value={vin} onChange={(e) => setVin(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input type="text" required value={make} onChange={(e) => setMake(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <button type="submit" disabled={loading || !account} className="w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? "Processing Transaction..." : "Register on Blockchain"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: SEARCH & DETAILS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Verify Vehicle Status</h2>
          <div className="flex space-x-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter VIN..." 
              value={searchVin} 
              onChange={(e) => setSearchVin(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2"
            />
            <button onClick={fetchVehicle} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
              Search
            </button>
          </div>

          {vehicleData && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-lg text-blue-800 mb-2">{vehicleData.year} {vehicleData.make} {vehicleData.model}</h3>
              <p><strong>VIN:</strong> {vehicleData.vin}</p>
              <p><strong>Owner:</strong> <span className="font-mono text-sm">{vehicleData.currentOwner}</span></p>
              <p><strong>Status:</strong> {vehicleData.isRegistered ? "Registered ✅" : "Pending ❌"}</p>
              
              <h4 className="font-bold mt-4 border-t pt-2">Lifecycle History</h4>
              {vehicleData.history.length === 0 ? (
                <p className="text-gray-500 text-sm mt-1">No service or accident records found.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {vehicleData.history.map((record, index) => (
                    <li key={index} className="text-sm bg-white p-2 rounded shadow-sm">
                      <span className="font-bold">{record.recordType}:</span> {record.description} <br/>
                      <a href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`} target="_blank" className="text-blue-500 underline text-xs">View Document</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;