import React, { useState, useEffect } from 'react';
import { getBlockchainContext } from './blockchain';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import RTODashboard from './components/RTODashboard';
import ServiceDashboard from './components/ServiceDashboard';
import UserDashboard from './components/UserDashboard';
import ToastContainer from './components/Toast';

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('vlm_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('vlm_user');
      }
    }
  }, []);

  // Auto-connect wallet when user is set and wallet isn't connected yet
  useEffect(() => {
    if (user && !account) {
      // Try to silently connect if MetaMask was previously authorized
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        }).catch(() => {});
      }
    }
  }, [user]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          // Re-connect with new account
          connectWallet();
        } else {
          setAccount('');
          setContract(null);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, []);

  // Connect MetaMask
  const connectWallet = async () => {
    try {
      const { address, contract } = await getBlockchainContext();
      setAccount(address);
      setContract(contract);
    } catch (error) {
      console.error(error);
    }
  };

  // Switch wallet — prompts MetaMask to show account picker
  const switchWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        const { address, contract } = await getBlockchainContext();
        setAccount(address);
        setContract(contract);
        addToast(`Switched to wallet ${address.substring(0, 6)}...${address.substring(38)}`);
      }
    } catch (error) {
      console.error('Wallet switch cancelled or failed:', error);
    }
  };

  // Login handler — called from LoginPage
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('vlm_user', JSON.stringify(userData));
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setAccount('');
    setContract(null);
    localStorage.removeItem('vlm_user');
  };

  // Render the correct dashboard based on role
  const renderDashboard = () => {
    const dashboardProps = { contract, loading, setLoading, user, addToast };
    switch (user.role) {
      case 'RTO':
        return <RTODashboard {...dashboardProps} />;
      case 'SERVICE':
        return <ServiceDashboard {...dashboardProps} />;
      case 'USER':
        return <UserDashboard {...dashboardProps} />;
      default:
        return <p className="text-center text-red-500 mt-10">Unknown role: {user.role}</p>;
    }
  };

  // Not logged in → show login page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Logged in → show navbar + dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <Navbar
        user={user}
        account={account}
        onConnectWallet={connectWallet}
        onSwitchWallet={switchWallet}
        onLogout={handleLogout}
      />
      {renderDashboard()}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </div>
  );
}

export default App;