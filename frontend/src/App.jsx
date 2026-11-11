import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/hero';
import Featured from './components/featured';
import Earn from './components/earn';
import Contact from './components/Contact';
import Footer from './components/footer';
import ConnectModal from './components/ConnectModal';
import Toast from './components/Toast';

function App() {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleConnectWallet = (account) => {
    setConnectedAccount(account);
    showToast(`Connected wallet: ${account.slice(0, 6)}...${account.slice(-4)}`, 'success');
  };

  const handleDisconnectWallet = () => {
    setConnectedAccount(null);
    showToast('Wallet disconnected successfully.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8ff] text-gray-800">
      {/* Navigation Bar */}
      <Navbar
        onOpenConnectModal={() => setIsConnectOpen(true)}
        connectedAccount={connectedAccount}
      />

      {/* Main Sections */}
      <main className="flex-1">
        <Hero onNotify={showToast} />
        <Featured />
        <Earn onNotify={showToast} />
        <Contact onNotify={showToast} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Web3 Wallet Connect Modal */}
      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        connectedAccount={connectedAccount}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Global Notification Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
