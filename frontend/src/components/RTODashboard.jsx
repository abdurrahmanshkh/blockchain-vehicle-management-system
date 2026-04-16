import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublicSearch from './PublicSearch';
import SearchableSelect from './SearchableSelect';

const API = 'http://127.0.0.1:8000';

function RTODashboard({ contract, loading, setLoading, user, addToast }) {
  // States: Register Vehicle
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');

  // States: Authorize Service Center
  const [selectedSC, setSelectedSC] = useState('');

  // Data: Users and Vehicles
  const [serviceUsers, setServiceUsers] = useState([]);
  const [ownerUsers, setOwnerUsers] = useState([]);
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch users and vehicles on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [scRes, userRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/api/users?role=SERVICE`),
        axios.get(`${API}/api/users?role=USER`),
        axios.get(`${API}/api/vehicles/all`),
      ]);
      setServiceUsers(scRes.data);
      setOwnerUsers(userRes.data);
      setRegisteredVehicles(vehiclesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const syncDatabase = async (targetVin) => {
    await axios.post(`${API}/api/sync/${targetVin}`);
  };

  // Build dropdown options
  const scOptions = serviceUsers.map(u => ({
    value: u.walletAddress,
    label: u.displayName || u.username,
    sublabel: `@${u.username}`,
  }));

  const ownerOptions = ownerUsers.map(u => ({
    value: u.walletAddress,
    label: u.displayName || u.username,
    sublabel: `@${u.username}`,
  }));

  // Find owner name by wallet address
  const getOwnerName = (wallet) => {
    const found = ownerUsers.find(u => u.walletAddress.toLowerCase() === wallet.toLowerCase());
    return found ? (found.displayName || found.username) : `${wallet.substring(0, 8)}...`;
  };

  const registerVehicle = async (e) => {
    e.preventDefault();
    if (!contract) return addToast('Connect wallet first!', 'warning');
    if (!selectedOwner) return addToast('Please select an initial owner.', 'warning');
    setLoading(true);
    try {
      const tx = await contract.registerVehicle(vin, make, model, parseInt(year), selectedOwner);
      await tx.wait();
      await syncDatabase(vin);
      addToast(`Vehicle ${vin} registered successfully to ${getOwnerName(selectedOwner)}!`, 'success');
      setVin(''); setMake(''); setModel(''); setYear(''); setSelectedOwner('');
      fetchData(); // Refresh vehicle list
    } catch (err) {
      addToast('Registration failed. Are you the RTO Admin?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const authorizeSC = async (e) => {
    e.preventDefault();
    if (!contract) return addToast('Connect wallet first!', 'warning');
    if (!selectedSC) return addToast('Please select a service center.', 'warning');
    setLoading(true);
    try {
      const tx = await contract.authorizeServiceCenter(selectedSC);
      await tx.wait();
      const scName = serviceUsers.find(u => u.walletAddress === selectedSC)?.displayName || selectedSC;
      addToast(`${scName} has been authorized as a Service Center!`, 'success');
      setSelectedSC('');
    } catch (err) {
      addToast('Authorization failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">RTO Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Register new vehicles, authorize service centers, and monitor all registrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authorize Service Center Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/50 rounded-t-2xl">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Service Center</label>
              <SearchableSelect
                id="sc-select"
                options={scOptions}
                value={selectedSC}
                onChange={setSelectedSC}
                placeholder="Search service centers..."
                accentColor="amber"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50 rounded-t-2xl">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Owner</label>
              <SearchableSelect
                id="owner-select"
                options={ownerOptions}
                value={selectedOwner}
                onChange={setSelectedOwner}
                placeholder="Search vehicle owners..."
                accentColor="blue"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Processing...' : 'Register Vehicle'}
            </button>
          </form>
        </div>

        {/* Registered Vehicles Table — full width */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-800">Registered Vehicles</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {registeredVehicles.length} total
              </span>
            </div>
          </div>
          <div className="p-6">
            {loadingData ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : registeredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm text-gray-400">No vehicles registered yet. Register your first vehicle above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">VIN</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {registeredVehicles.map((v) => (
                      <tr key={v.vin} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-xs text-blue-600 font-medium">{v.vin}</td>
                        <td className="py-2.5 px-3 text-gray-900 font-medium">{v.make} {v.model}</td>
                        <td className="py-2.5 px-3 text-gray-600">{v.year}</td>
                        <td className="py-2.5 px-3 text-gray-600">{getOwnerName(v.currentOwner)}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {v.history?.length || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default RTODashboard;
