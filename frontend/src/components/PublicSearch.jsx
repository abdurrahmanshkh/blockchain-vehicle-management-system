import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function shortenAddress(addr) {
  if (!addr) return '—';
  return `${addr.substring(0, 8)}...${addr.substring(36)}`;
}

function PublicSearch({ addToast }) {
  const [searchVin, setSearchVin] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ownership'); // 'ownership' | 'service'

  const fetchVehicle = async () => {
    if (!searchVin.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveTab('ownership');
    try {
      const response = await axios.get(`${API}/api/vehicle/${searchVin}`);
      setVehicleData(response.data);
    } catch (error) {
      setVehicleData(null);
      if (addToast) addToast('Vehicle not found in database. Ensure it has been synced.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchVehicle();
  };

  const ownershipHistory = vehicleData?.ownershipHistory || [];
  const serviceHistory = vehicleData?.history || [];
  const ownerCount = vehicleData?.ownerCount ?? ownershipHistory.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800">Public Vehicle Verification</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6">
        <div className="flex gap-2">
          <input
            id="public-search-vin"
            type="text"
            placeholder="Enter VIN (e.g., MH01AB1234)"
            value={searchVin}
            onChange={(e) => setSearchVin(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
          />
          <button
            id="public-search-btn"
            onClick={fetchVehicle}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-xl shadow-sm hover:from-slate-800 hover:to-slate-900 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="mt-5">
            {vehicleData ? (
              <div>
                {/* Vehicle Summary Card */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {vehicleData.year} {vehicleData.make} {vehicleData.model}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">VIN: {vehicleData.vin}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                        ✓ Registered
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                        {ownerCount} owner{ownerCount !== 1 ? 's' : ''}
                      </span>
                      {serviceHistory.length > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                          {serviceHistory.length} service record{serviceHistory.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-3">
                    <span className="font-medium">Current Owner:</span>
                    <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                      {vehicleData.currentOwner}
                    </code>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-4 gap-1">
                  <button
                    onClick={() => setActiveTab('ownership')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-150 ${
                      activeTab === 'ownership'
                        ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Ownership Chain
                    <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'ownership' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ownershipHistory.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('service')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-150 ${
                      activeTab === 'service'
                        ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50/50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Service & Accident Records
                    <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'service' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {serviceHistory.length}
                    </span>
                  </button>
                </div>

                {/* Ownership Chain Timeline */}
                {activeTab === 'ownership' && (
                  <div>
                    {ownershipHistory.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-1">No ownership history synced yet. Try syncing the vehicle.</p>
                    ) : (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200" />

                        <div className="space-y-3">
                          {ownershipHistory.map((entry, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === ownershipHistory.length - 1;
                            return (
                              <div key={idx} className="relative flex items-start gap-4">
                                {/* Timeline dot */}
                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                  isFirst
                                    ? 'bg-blue-50 border-blue-300'
                                    : isLast
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-white border-gray-300'
                                }`}>
                                  {isFirst ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                  ) : isLast ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3.5 min-w-0">
                                  <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        entry.event === 'Registration'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-violet-100 text-violet-700'
                                      }`}>
                                        {entry.event === 'Registration' ? 'Initial Registration' : `Transfer #${idx}`}
                                      </span>
                                      {isLast && ownershipHistory.length > 1 && (
                                        <span className="text-xs text-emerald-600 font-medium">Current Owner</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400">{formatTimestamp(entry.timestamp)}</span>
                                  </div>

                                  {entry.from && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                      <span className="text-gray-400">From:</span>
                                      <code className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                        {shortenAddress(entry.from)}
                                      </code>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <span className="text-gray-400">{entry.from ? 'To:' : 'Owner:'}</span>
                                    <code className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 font-semibold">
                                      {shortenAddress(entry.to)}
                                    </code>
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                                    <span className="text-xs text-gray-400">Tx:</span>
                                    <code className="text-xs font-mono text-gray-400 truncate">{entry.txHash?.substring(0, 20)}...</code>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Service & Accident Records */}
                {activeTab === 'service' && (
                  <div>
                    {serviceHistory.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-1">No service or accident records found.</p>
                    ) : (
                      <div className="space-y-2">
                        {serviceHistory.map((rec, i) => (
                          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  rec.recordType === 'Accident'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {rec.recordType}
                                </span>
                                <span className="text-xs text-gray-400">{formatTimestamp(rec.timestamp)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{rec.description}</p>
                            </div>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${rec.ipfsHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
                            >
                              View Doc
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Vehicle not found in database. Ensure it has been synced.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicSearch;
