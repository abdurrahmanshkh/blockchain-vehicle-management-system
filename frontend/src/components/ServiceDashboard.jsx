import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublicSearch from './PublicSearch';

const API = 'http://127.0.0.1:8000';

function ServiceDashboard({ contract, loading, setLoading, user, addToast }) {
  const [scVin, setScVin] = useState('');
  const [scDesc, setScDesc] = useState('');
  const [scFile, setScFile] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking

  // Check authorization status on mount
  useEffect(() => {
    checkAuthorization();
  }, [contract, user]);

  const checkAuthorization = async () => {
    if (!contract || !user?.walletAddress) {
      setIsAuthorized(null);
      return;
    }
    try {
      const result = await contract.authorizedServiceCenters(user.walletAddress);
      setIsAuthorized(result);
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthorized(null);
    }
  };

  const syncDatabase = async (targetVin) => {
    await axios.post(`${API}/api/sync/${targetVin}`);
  };

  const addServiceRecord = async (e) => {
    e.preventDefault();
    if (!contract || !scFile) return addToast('Connect wallet and select a file!', 'warning');
    setLoading(true);
    try {
      // 1. Upload to IPFS via FastAPI
      const formData = new FormData();
      formData.append("file", scFile);
      const uploadRes = await axios.post(`${API}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const ipfsHash = uploadRes.data.ipfsHash;

      // 2. Save Hash to Blockchain
      const tx = await contract.addServiceRecord(scVin, ipfsHash, scDesc);
      await tx.wait();

      // 3. Sync Database
      await syncDatabase(scVin);
      addToast(`Service record for ${scVin} uploaded to IPFS & recorded on blockchain!`, 'success');
      setScVin(''); setScDesc(''); setScFile(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to upload. Are you an authorized Service Center?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Authorization Status Banner */}
      {isAuthorized !== null && (
        <div className={`mb-6 px-5 py-3 rounded-xl border flex items-center gap-3 ${
          isAuthorized
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {isAuthorized ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Authorized Service Center</p>
                <p className="text-xs opacity-75">You are authorized to add service records to the blockchain.</p>
              </div>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Not Yet Authorized</p>
                <p className="text-xs opacity-75">Contact the RTO Admin to authorize your service center before uploading records.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Service Center Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Upload service records with IPFS-backed documentation to the blockchain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Service Record Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">Add Service Record</h2>
            </div>
          </div>
          <form onSubmit={addServiceRecord} className="p-6 space-y-4">
            <div>
              <label htmlFor="sc-vin" className="block text-sm font-medium text-gray-700 mb-1.5">Target Vehicle VIN</label>
              <input
                id="sc-vin"
                type="text"
                required
                value={scVin}
                onChange={(e) => setScVin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all duration-200"
                placeholder="e.g., MH01AB1234"
              />
            </div>
            <div>
              <label htmlFor="sc-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Service Description</label>
              <input
                id="sc-desc"
                type="text"
                required
                value={scDesc}
                onChange={(e) => setScDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all duration-200"
                placeholder="e.g., Oil Change, Brake Fix"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Invoice / Document (IPFS)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/30 text-center hover:border-emerald-300 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <input
                  id="sc-file"
                  type="file"
                  required
                  onChange={(e) => setScFile(e.target.files[0])}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {scFile && (
                  <p className="text-xs text-emerald-600 mt-2">Selected: {scFile.name}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || isAuthorized === false}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Uploading & Recording...' : isAuthorized === false ? 'Not Authorized' : 'Upload Record to Blockchain'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800">How It Works</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-700">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Upload Document</p>
                  <p className="text-xs text-gray-500">Your invoice/image is uploaded to IPFS via Pinata for permanent, decentralized storage.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-700">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Record on Blockchain</p>
                  <p className="text-xs text-gray-500">The IPFS hash and description are permanently written to the Ethereum smart contract.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-700">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Sync to Database</p>
                  <p className="text-xs text-gray-500">The MongoDB cache is updated for fast, off-chain reads via the public search.</p>
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

export default ServiceDashboard;
