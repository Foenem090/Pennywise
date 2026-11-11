import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/footer';
import ConnectModal from './components/ConnectModal';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Markets from './pages/Markets';
import EarnPage from './pages/EarnPage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import FaqPage from './pages/FaqPage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

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
      {/* Scroll restore on route transition */}
      <ScrollToTop />

      {/* Global Navigation Bar */}
      <Navbar
        onOpenConnectModal={() => setIsConnectOpen(true)}
        connectedAccount={connectedAccount}
      />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onNotify={showToast} />} />
          <Route
            path="/markets"
            element={<Markets onOpenConnectModal={() => setIsConnectOpen(true)} />}
          />
          <Route
            path="/earn"
            element={
              <EarnPage
                onNotify={showToast}
                onOpenConnectModal={() => setIsConnectOpen(true)}
              />
            }
          />
          <Route path="/contact" element={<ContactPage onNotify={showToast} />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Web3 Browser Wallet Connect Modal */}
      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        connectedAccount={connectedAccount}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Notification Toast Feedback */}
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
