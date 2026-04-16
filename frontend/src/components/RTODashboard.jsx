import React, { useState } from 'react';
import axios from 'axios';
import PublicSearch from './PublicSearch';

function RTODashboard({ contract, loading, setLoading }) {
  // States: Register Vehicle
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [initialOwner, setInitialOwner] = useState('');

  // States: Authorize Service Center
  const [serviceCenterAddress, setServiceCenterAddress] = useState('');

  const syncDatabase = async (targetVin) => {
    await axios.post(`http://127.0.0.1:8000/api/sync/${targetVin}`);
  };

  const registerVehicle = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");
    setLoading(true);
    try {
      const tx = await contract.registerVehicle(vin, make, model, parseInt(year), initialOwner);
      await tx.wait();
      await syncDatabase(vin);
      alert("Vehicle Registered and Synced!");
      setVin(''); setMake(''); setModel(''); setYear(''); setInitialOwner('');
    } catch (err) {
      alert("Registration failed. Are you the RTO Admin?");
    } finally {
      setLoading(false);
    }
  };

  const authorizeSC = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");
    setLoading(true);
    try {
      const tx = await contract.authorizeServiceCenter(serviceCenterAddress);
      await tx.wait();
      alert("Service Center Authorized!");
      setServiceCenterAddress('');
    } catch (err) {
      alert("Authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">RTO Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Register new vehicles and authorize service centers on the blockchain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authorize Service Center Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">Authorize Service Center</h2>
            </div>
          </div>
          <form onSubmit={authorizeSC} className="p-6 space-y-4">
            <div>
              <label htmlFor="sc-address" className="block text-sm font-medium text-gray-700 mb-1.5">Service Center Wallet Address</label>
              <input
                id="sc-address"
                type="text"
                required
                value={serviceCenterAddress}
                onChange={(e) => setServiceCenterAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition-all duration-200"
                placeholder="0x..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl shadow-sm hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Processing...' : 'Authorize on Blockchain'}
            </button>
          </form>
        </div>

        {/* Register Vehicle Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">Register New Vehicle</h2>
            </div>
          </div>
          <form onSubmit={registerVehicle} className="p-6 space-y-4">
            <div>
              <label htmlFor="reg-vin" className="block text-sm font-medium text-gray-700 mb-1.5">VIN</label>
              <input id="reg-vin" type="text" required value={vin} onChange={(e) => setVin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                placeholder="e.g., MH01AB1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-make" className="block text-sm font-medium text-gray-700 mb-1.5">Make</label>
                <input id="reg-make" type="text" required value={make} onChange={(e) => setMake(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                  placeholder="Toyota" />
              </div>
              <div>
                <label htmlFor="reg-model" className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                <input id="reg-model" type="text" required value={model} onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                  placeholder="Camry" />
              </div>
            </div>
            <div>
              <label htmlFor="reg-year" className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
              <input id="reg-year" type="number" required value={year} onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                placeholder="2024" />
            </div>
            <div>
              <label htmlFor="reg-owner" className="block text-sm font-medium text-gray-700 mb-1.5">Initial Owner Wallet Address</label>
              <input id="reg-owner" type="text" required value={initialOwner} onChange={(e) => setInitialOwner(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                placeholder="0x..." />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Processing...' : 'Register Vehicle'}
            </button>
          </form>
        </div>

        {/* Public Search — spans full width */}
        <div className="lg:col-span-2">
          <PublicSearch />
        </div>
      </div>
    </div>
  );
}

export default RTODashboard;
