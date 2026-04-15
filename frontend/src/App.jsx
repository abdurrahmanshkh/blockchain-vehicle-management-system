import React, { useState } from 'react';
import axios from 'axios';
import { getBlockchainContext } from './blockchain';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // States: RTO
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [initialOwner, setInitialOwner] = useState('');
  const [serviceCenterAddress, setServiceCenterAddress] = useState('');

  // States: Service Center
  const [scVin, setScVin] = useState('');
  const [scDesc, setScDesc] = useState('');
  const [scFile, setScFile] = useState(null);

  // States: Owner Transfer
  const [transferVin, setTransferVin] = useState('');
  const [newOwner, setNewOwner] = useState('');

  // States: Search
  const [searchVin, setSearchVin] = useState('');
  const [vehicleData, setVehicleData] = useState(null);

  // ==========================================
  // 1. CONNECTION & UTILS
  // ==========================================
  const connectWallet = async () => {
    try {
      const { address, contract } = await getBlockchainContext();
      setAccount(address);
      setContract(contract);
    } catch (error) {
      console.error(error);
    }
  };

  const syncDatabase = async (targetVin) => {
    await axios.post(`http://127.0.0.1:8000/api/sync/${targetVin}`);
  };

  // ==========================================
  // 2. RTO FUNCTIONS
  // ==========================================
  const registerVehicle = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet!");
    setLoading(true);
    try {
      const tx = await contract.registerVehicle(vin, make, model, parseInt(year), initialOwner);
      await tx.wait();
      await syncDatabase(vin);
      alert("Vehicle Registered and Synced!");
    } catch (err) {
      alert("Registration failed. Are you the RTO Admin?");
    } finally {
      setLoading(false);
    }
  };

  const authorizeSC = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet!");
    setLoading(true);
    try {
      const tx = await contract.authorizeServiceCenter(serviceCenterAddress);
      await tx.wait();
      alert("Service Center Authorized!");
    } catch (err) {
      alert("Authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. SERVICE CENTER FUNCTIONS
  // ==========================================
  const addServiceRecord = async (e) => {
    e.preventDefault();
    if (!contract || !scFile) return alert("Connect wallet and select a file!");
    setLoading(true);
    try {
      // 1. Upload to IPFS via FastAPI
      const formData = new FormData();
      formData.append("file", scFile);
      const uploadRes = await axios.post("http://127.0.0.1:8000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const ipfsHash = uploadRes.data.ipfsHash;

      // 2. Save Hash to Blockchain
      const tx = await contract.addServiceRecord(scVin, ipfsHash, scDesc);
      await tx.wait();

      // 3. Sync Database
      await syncDatabase(scVin);
      alert("Service Record Uploaded to IPFS & Blockchain!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload. Are you an authorized Service Center?");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. OWNER FUNCTIONS
  // ==========================================
  const transferOwnership = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet!");
    setLoading(true);
    try {
      const tx = await contract.transferOwnership(transferVin, newOwner);
      await tx.wait();
      await syncDatabase(transferVin);
      alert("Ownership Transferred Successfully!");
    } catch (err) {
      alert("Transfer failed. Are you the current owner of this vehicle?");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. PUBLIC SEARCH
  // ==========================================
  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/vehicle/${searchVin}`);
      setVehicleData(response.data);
    } catch (error) {
      alert("Vehicle not found in database.");
      setVehicleData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto flex justify-between items-center bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Lifecycle Dashboard</h1>
        {account ? (
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded font-mono text-sm shadow-sm border border-green-200">
            Wallet: {account.substring(0, 6)}...{account.substring(38)}
          </span>
        ) : (
          <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition">
            Connect MetaMask
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RTO DASHBOARD */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">🏢 RTO Admin Panel</h2>
          
          <form onSubmit={authorizeSC} className="mb-6 space-y-2">
            <label className="block text-sm font-semibold">Authorize Service Center (Address)</label>
            <div className="flex space-x-2">
              <input type="text" required value={serviceCenterAddress} onChange={(e) => setServiceCenterAddress(e.target.value)} className="flex-1 border p-2 rounded" placeholder="0x..." />
              <button type="submit" disabled={loading} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Authorize</button>
            </div>
          </form>

          <form onSubmit={registerVehicle} className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-600">Register New Vehicle</h3>
            <input type="text" placeholder="VIN (e.g., MH01AB1234)" required value={vin} onChange={(e) => setVin(e.target.value)} className="w-full border p-2 rounded" />
            <div className="flex space-x-2">
              <input type="text" placeholder="Make" required value={make} onChange={(e) => setMake(e.target.value)} className="w-1/2 border p-2 rounded" />
              <input type="text" placeholder="Model" required value={model} onChange={(e) => setModel(e.target.value)} className="w-1/2 border p-2 rounded" />
            </div>
            <input type="number" placeholder="Year" required value={year} onChange={(e) => setYear(e.target.value)} className="w-full border p-2 rounded" />
            <input type="text" placeholder="Initial Owner Wallet Address" required value={initialOwner} onChange={(e) => setInitialOwner(e.target.value)} className="w-full border p-2 rounded" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">Register Vehicle</button>
          </form>
        </div>

        {/* SERVICE CENTER DASHBOARD */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">🔧 Service Center Panel</h2>
          <form onSubmit={addServiceRecord} className="space-y-3">
            <input type="text" placeholder="Target VIN" required value={scVin} onChange={(e) => setScVin(e.target.value)} className="w-full border p-2 rounded" />
            <input type="text" placeholder="Service Description (e.g., Oil Change, Brake Fix)" required value={scDesc} onChange={(e) => setScDesc(e.target.value)} className="w-full border p-2 rounded" />
            <div className="border border-dashed border-gray-400 p-4 rounded bg-gray-50">
              <label className="block text-sm text-gray-600 mb-1">Upload Invoice/Image (IPFS)</label>
              <input type="file" required onChange={(e) => setScFile(e.target.files[0])} className="w-full text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">Upload Record</button>
          </form>
        </div>

        {/* OWNER DASHBOARD */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">👤 Vehicle Owner Panel</h2>
          <form onSubmit={transferOwnership} className="space-y-3">
            <input type="text" placeholder="Your Vehicle VIN" required value={transferVin} onChange={(e) => setTransferVin(e.target.value)} className="w-full border p-2 rounded" />
            <input type="text" placeholder="Buyer's Wallet Address" required value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="w-full border p-2 rounded" />
            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50">Transfer Ownership</button>
          </form>
        </div>

        {/* SEARCH DASHBOARD */}
        <div className="bg-white p-6 rounded-lg shadow-md text-black border-t-4 border-gray-400">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">🔍 Public Verification</h2>
          <div className="flex space-x-2 mb-4">
            <input type="text" placeholder="Enter VIN..." value={searchVin} onChange={(e) => setSearchVin(e.target.value)} className="flex-1 border p-2 rounded text-black" />
            <button onClick={fetchVehicle} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-500 text-white">Search</button>
          </div>

          {vehicleData && (
            <div className="bg-gray-700 p-4 rounded text-sm">
              <h3 className="font-bold text-lg text-blue-300">{vehicleData.year} {vehicleData.make} {vehicleData.model}</h3>
              <p><strong>Owner:</strong> <span className="font-mono text-xs">{vehicleData.currentOwner}</span></p>
              
              <h4 className="font-bold mt-4 border-t border-gray-600 pt-2 text-yellow-400">Lifecycle Records:</h4>
              {vehicleData.history.length === 0 ? <p className="text-gray-400 italic">No records found.</p> : (
                <ul className="mt-2 space-y-2">
                  {vehicleData.history.map((rec, i) => (
                    <li key={i} className="bg-gray-600 p-2 rounded border border-gray-500">
                      <span className="font-bold text-green-300">{rec.recordType}:</span> {rec.description} <br/>
                      <a href={`https://gateway.pinata.cloud/ipfs/${rec.ipfsHash}`} target="_blank" rel="noreferrer" className="text-blue-300 underline text-xs">View Document</a>
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