import React, { useState } from 'react';
import axios from 'axios';

function PublicSearch() {
  const [searchVin, setSearchVin] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVehicle = async () => {
    if (!searchVin.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/vehicle/${searchVin}`);
      setVehicleData(response.data);
    } catch (error) {
      setVehicleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchVehicle();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
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
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {vehicleData.year} {vehicleData.make} {vehicleData.model}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">VIN: {vehicleData.vin}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    Registered
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                  <span className="font-medium">Owner:</span>
                  <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{vehicleData.currentOwner}</code>
                </div>

                {/* History */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lifecycle Records
                  </h4>

                  {vehicleData.history.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No records found.</p>
                  ) : (
                    <div className="space-y-2">
                      {vehicleData.history.map((rec, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{rec.recordType}</span>
                            <p className="text-sm text-gray-700 mt-1">{rec.description}</p>
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
