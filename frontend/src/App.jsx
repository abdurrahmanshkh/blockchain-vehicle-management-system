import React, { useState, useEffect } from 'react';
import { getBlockchainContext } from './blockchain';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import RTODashboard from './components/RTODashboard';
import ServiceDashboard from './components/ServiceDashboard';
import UserDashboard from './components/UserDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

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
    switch (user.role) {
      case 'RTO':
        return <RTODashboard contract={contract} loading={loading} setLoading={setLoading} />;
      case 'SERVICE':
        return <ServiceDashboard contract={contract} loading={loading} setLoading={setLoading} />;
      case 'USER':
        return <UserDashboard contract={contract} loading={loading} setLoading={setLoading} />;
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
        onLogout={handleLogout}
      />
      {renderDashboard()}
    </div>
  );
}

export default App;