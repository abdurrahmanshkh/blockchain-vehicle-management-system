import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublicSearch from './PublicSearch';
import SearchableSelect from './SearchableSelect';

const API = 'http://127.0.0.1:8000';

function UserDashboard({ contract, loading, setLoading, user, addToast }) {
  const [transferVin, setTransferVin] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('');

  // Data
  const [myVehicles, setMyVehicles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch my vehicles and user list on mount
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.walletAddress) return;
    setLoadingData(true);
    try {
      const [vehiclesRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/vehicles/owner/${user.walletAddress}`),
        axios.get(`${API}/api/users?role=USER`),
      ]);
      setMyVehicles(vehiclesRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const syncDatabase = async (targetVin) => {
    await axios.post(`${API}/api/sync/${targetVin}`);
  };

  // Build buyer options — exclude self
  const buyerOptions = allUsers
    .filter(u => u.walletAddress.toLowerCase() !== user.walletAddress.toLowerCase())
    .map(u => ({
      value: u.walletAddress,
      label: u.displayName || u.username,
      sublabel: `@${u.username}`,
    }));

  const transferOwnership = async (e) => {
    e.preventDefault();
    if (!contract) return addToast('Connect wallet first!', 'warning');
    if (!selectedBuyer) return addToast('Please select a buyer.', 'warning');
    if (!transferVin) return addToast('Please select or enter a vehicle VIN.', 'warning');

    const buyerName = allUsers.find(u => u.walletAddress === selectedBuyer)?.displayName || 'the buyer';
    setLoading(true);
    try {
      const tx = await contract.transferOwnership(transferVin, selectedBuyer);
      await tx.wait();
      await syncDatabase(transferVin);
      addToast(`Vehicle ${transferVin} transferred to ${buyerName}!`, 'success');
      setTransferVin(''); setSelectedBuyer('');
      fetchData(); // Refresh my vehicles
    } catch (err) {
      addToast('Transfer failed. Are you the current owner of this vehicle?', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill VIN from "My Vehicles" card
  const handleQuickTransfer = (vin) => {
    setTransferVin(vin);
    // Scroll to the transfer form
    document.getElementById('transfer-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    addToast(`VIN ${vin} selected for transfer. Choose a buyer below.`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Owner Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">View your registered vehicles, transfer ownership, and look up any vehicle's lifecycle.</p>
      </div>

      {/* My Vehicles — full width at top */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-violet-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">My Vehicles</h2>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {myVehicles.length} owned
            </span>
          </div>
        </div>
        <div className="p-6">
          {loadingData ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading your vehicles...</div>
          ) : myVehicles.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm text-gray-400">No vehicles registered to your account yet.</p>
              <p className="text-xs text-gray-400 mt-1">Ask the RTO to register a vehicle under your name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myVehicles.map((v) => (
                <div key={v.vin} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:border-violet-300 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{v.make} {v.model}</h3>
                      <p className="text-xs text-gray-500">{v.year}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                      {v.history?.length || 0} records
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mb-3">VIN: {v.vin}</p>
                  <button
                    onClick={() => handleQuickTransfer(v.vin)}
                    className="w-full py-1.5 px-3 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors duration-200"
                  >
                    Transfer This Vehicle →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Ownership Card */}
        <div id="transfer-form" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-violet-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">Transfer Ownership</h2>
            </div>
          </div>
          <form onSubmit={transferOwnership} className="p-6 space-y-4">
            <div>
              <label htmlFor="transfer-vin" className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle VIN</label>
              {myVehicles.length > 0 ? (
                <select
                  id="transfer-vin"
                  value={transferVin}
                  onChange={(e) => setTransferVin(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-200"
                >
                  <option value="">Select a vehicle...</option>
                  {myVehicles.map(v => (
                    <option key={v.vin} value={v.vin}>{v.vin} — {v.make} {v.model} ({v.year})</option>
                  ))}
                </select>
              ) : (
                <input
                  id="transfer-vin-input"
                  type="text"
                  required
                  value={transferVin}
                  onChange={(e) => setTransferVin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-200"
                  placeholder="e.g., MH01AB1234"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Transfer To (Buyer)</label>
              <SearchableSelect
                id="buyer-select"
                options={buyerOptions}
                value={selectedBuyer}
                onChange={setSelectedBuyer}
                placeholder="Search buyers by name..."
                accentColor="violet"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This action is permanent and will be recorded on the blockchain. The vehicle will be removed from your ownership.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-xl shadow-sm hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Processing Transfer...' : 'Transfer Ownership'}
            </button>
          </form>
        </div>

        {/* Quick Guide Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">Ownership Transfer Guide</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Select Your Vehicle</p>
                  <p className="text-xs text-gray-500">Choose from your registered vehicles above, or click "Transfer" on a vehicle card.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Choose the Buyer</p>
                  <p className="text-xs text-gray-500">Search for the buyer by name. The system will automatically resolve their blockchain address.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Confirm in MetaMask</p>
                  <p className="text-xs text-gray-500">Sign the transaction in MetaMask. The transfer is irreversible once confirmed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Public Search — full width */}
        <div className="lg:col-span-2">
          <PublicSearch addToast={addToast} />
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
