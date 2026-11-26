import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaWallet, FaCheckCircle, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';

const ConnectModal = ({ isOpen, onClose, connectedAccount, onConnect, onDisconnect }) => {
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture the triggering element before moving focus into the modal
    triggerRef.current = document.activeElement;

    // 2. Move focus into the modal once rendered
    const frameId = requestAnimationFrame(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    });

    // 3. Handle Escape key and Tab focus trap within modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);

      // 4. Restore focus to the original triggering element upon close
      if (triggerRef.current && typeof triggerRef.current.focus === 'function' && triggerRef.current.isConnected) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
          setStatusMessage({
            type: 'success',
            text: `Connected successfully to MetaMask (${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}).`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'No accounts selected or connection was rejected in your wallet.',
          });
        }
      } else {
        setStatusMessage({
          type: 'warning',
          text: 'MetaMask extension was not detected in this browser.',
          link: 'https://metamask.io/download/',
          linkText: 'Install MetaMask',
        });
      }
    } catch (err) {
      if (err.code === 4001) {
        setStatusMessage({
          type: 'error',
          text: 'Connection request was rejected in MetaMask.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'An error occurred while connecting to MetaMask.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoinbaseConnect = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const hasCoinbase =
        typeof window !== 'undefined' &&
        (window.coinbaseWalletExtension ||
          (window.ethereum && (window.ethereum.isCoinbaseWallet || window.ethereum.providers?.some(p => p.isCoinbaseWallet))));

      if (hasCoinbase) {
        const provider = window.coinbaseWalletExtension || window.ethereum;
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
          setStatusMessage({
            type: 'success',
            text: `Connected successfully to Coinbase Wallet (${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}).`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'No accounts selected or connection was rejected in Coinbase Wallet.',
          });
        }
      } else {
        setStatusMessage({
          type: 'warning',
          text: 'Coinbase Wallet extension was not detected in this browser.',
          link: 'https://www.coinbase.com/wallet',
          linkText: 'Get Coinbase Wallet',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to connect to Coinbase Wallet.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-wallet-modal-title"
        aria-describedby="connect-wallet-modal-desc"
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden border border-gray-100 animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl" aria-hidden="true">
              <FaWallet className="text-xl" aria-hidden="true" />
            </div>
            <div>
              <h3 id="connect-wallet-modal-title" className="text-lg font-bold text-gray-900">
                Connect Web3 Wallet
              </h3>
              <p id="connect-wallet-modal-desc" className="text-xs text-gray-500">
                Securely link your cryptocurrency account
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Close modal"
          >
            <FaTimes size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {connectedAccount ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
                <FaCheckCircle size={24} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Connected Wallet</p>
                <p className="font-mono text-base font-bold text-gray-900 mt-1">{formatAddress(connectedAccount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Ethereum Network</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onDisconnect();
                  setStatusMessage(null);
                }}
                className="w-full py-2.5 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect your browser wallet to verify your crypto IRA deposits and manage assets directly.
              </p>

              {/* MetaMask Option */}
              <button
                type="button"
                onClick={handleMetaMaskConnect}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xl select-none" aria-hidden="true">
                    🦊
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      MetaMask
                    </h4>
                    <p className="text-xs text-gray-500">Connect using browser extension</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                  &rarr;
                </span>
              </button>

              {/* Coinbase Wallet Option */}
              <button
                type="button"
                onClick={handleCoinbaseConnect}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl select-none" aria-hidden="true">
                    🔵
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      Coinbase Wallet
                    </h4>
                    <p className="text-xs text-gray-500">Connect via Coinbase browser extension</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                  &rarr;
                </span>
              </button>
            </div>
          )}

          {/* Status / Error feedback */}
          {statusMessage && (
            <div
              role={statusMessage.type === 'error' || statusMessage.type === 'warning' ? 'alert' : 'status'}
              aria-live={statusMessage.type === 'error' ? 'assertive' : 'polite'}
              className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 ${
                statusMessage.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}
            >
              <FaExclamationTriangle className="shrink-0 mt-0.5 text-sm" aria-hidden="true" />
              <div className="space-y-1">
                <p>{statusMessage.text}</p>
                {statusMessage.link && (
                  <a
                    href={statusMessage.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold underline text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <span>{statusMessage.linkText}</span>
                    <FaExternalLinkAlt size={10} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center leading-normal">
              🔒 Penny Wise will never ask for your private keys, seed phrase, or send transactions without your approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
