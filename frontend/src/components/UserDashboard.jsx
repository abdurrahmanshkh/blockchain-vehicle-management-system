import React, { useState } from 'react';
import axios from 'axios';
import PublicSearch from './PublicSearch';

function UserDashboard({ contract, loading, setLoading }) {
  const [transferVin, setTransferVin] = useState('');
  const [newOwner, setNewOwner] = useState('');

  const syncDatabase = async (targetVin) => {
    await axios.post(`http://127.0.0.1:8000/api/sync/${targetVin}`);
  };

  const transferOwnership = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect wallet first!");
    setLoading(true);
    try {
      const tx = await contract.transferOwnership(transferVin, newOwner);
      await tx.wait();
      await syncDatabase(transferVin);
      alert("Ownership Transferred Successfully!");
      setTransferVin(''); setNewOwner('');
    } catch (err) {
      alert("Transfer failed. Are you the current owner of this vehicle?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Owner Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Transfer vehicle ownership and look up any vehicle's lifecycle history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Ownership Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
              <label htmlFor="transfer-vin" className="block text-sm font-medium text-gray-700 mb-1.5">Your Vehicle VIN</label>
              <input
                id="transfer-vin"
                type="text"
                required
                value={transferVin}
                onChange={(e) => setTransferVin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-200"
                placeholder="e.g., MH01AB1234"
              />
            </div>
            <div>
              <label htmlFor="transfer-buyer" className="block text-sm font-medium text-gray-700 mb-1.5">Buyer's Wallet Address</label>
              <input
                id="transfer-buyer"
                type="text"
                required
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-200"
                placeholder="0x..."
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This action is permanent and will be recorded on the blockchain. Make sure the buyer's wallet address is correct before confirming.</span>
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
                  <p className="text-sm font-medium text-gray-800">Enter Vehicle VIN</p>
                  <p className="text-xs text-gray-500">You must be the current registered owner on the blockchain to transfer.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Enter Buyer's Wallet</p>
                  <p className="text-xs text-gray-500">The new owner's Ethereum address. Double-check before submitting.</p>
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
          <PublicSearch />
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
