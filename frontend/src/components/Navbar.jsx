import React from 'react';

const ROLE_CONFIG = {
  RTO: { label: 'RTO Admin', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  SERVICE: { label: 'Service Center', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  USER: { label: 'Vehicle Owner', color: 'bg-violet-100 text-violet-800 border-violet-200' },
};

function Navbar({ user, account, onConnectWallet, onLogout }) {
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER;

  const walletMismatch = account && user.walletAddress &&
    account.toLowerCase() !== user.walletAddress.toLowerCase();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left — Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">VehicleChain</span>
          </div>

          {/* Center — Role Badge + User */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${roleConfig.color}`}>
              {roleConfig.label}
            </span>
            <span className="text-sm text-gray-600 hidden sm:block">
              Logged in as <span className="font-semibold text-gray-900">{user.username}</span>
            </span>
          </div>

          {/* Right — Wallet + Logout */}
          <div className="flex items-center gap-3">
            {account ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {account.substring(0, 6)}...{account.substring(38)}
              </span>
            ) : (
              <button
                onClick={onConnectWallet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                </svg>
                Connect Wallet
              </button>
            )}

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Mismatch Warning Banner */}
      {walletMismatch && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Wallet mismatch!</strong> Your MetaMask address (<code className="font-mono text-xs">{account.substring(0, 8)}...</code>) does not match your registered address (<code className="font-mono text-xs">{user.walletAddress.substring(0, 8)}...</code>). Please switch to the correct account in MetaMask.
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
