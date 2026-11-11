import React, { useState } from 'react';
import { FaBars, FaTimes, FaWallet } from 'react-icons/fa';

const Navbar = ({ onOpenConnectModal, connectedAccount }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 left-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 h-[80px] flex justify-between items-center">
        {/* Brand Logo */}
        <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 cursor-pointer">
          Penny <span className="text-[#1a6fca]">Wise</span>  
        </a>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center space-x-8 font-medium text-gray-700">
          <li>
            <a href="/" className="hover:text-blue-600 transition-colors duration-200">
              Home
            </a>
          </li>
          <li>
            <a href="#featured" className="hover:text-blue-600 transition-colors duration-200">
              Featured
            </a>
          </li>
          <li>
            <a href="#earn" className="hover:text-blue-600 transition-colors duration-200">
              Earn
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">
              Contact
            </a>
          </li>
        </ul>

        {/* Action Button (Desktop) */}
        <div className="hidden md:flex items-center">
          {connectedAccount ? (
            <button
              onClick={onOpenConnectModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatAddress(connectedAccount)}</span>
            </button>
          ) : (
            <button
              onClick={onOpenConnectModal}
              className="btn inline-flex items-center space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <FaWallet className="text-sm" />
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* Hamburger Icon (Mobile/Tablet) */}
        <div 
          className="md:hidden z-20 cursor-pointer text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={handleClick}
          aria-label="Toggle Navigation"
        >
          {open ? <FaTimes size={22} /> : <FaBars size={22} />}
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`fixed inset-x-0 top-[80px] bg-white border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out md:hidden ${
            open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <ul className="flex flex-col p-6 space-y-4 text-center font-semibold text-gray-800 text-lg">
            <li>
              <a href="/" onClick={closeMenu} className="block py-2 hover:text-blue-600 transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#featured" onClick={closeMenu} className="block py-2 hover:text-blue-600 transition-colors">
                Featured
              </a>
            </li>
            <li>
              <a href="#earn" onClick={closeMenu} className="block py-2 hover:text-blue-600 transition-colors">
                Earn
              </a>
            </li>
            <li>
              <a href="#contact" onClick={closeMenu} className="block py-2 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </li>
            <li className="pt-2">
              {connectedAccount ? (
                <button 
                  onClick={() => {
                    closeMenu();
                    onOpenConnectModal();
                  }}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{formatAddress(connectedAccount)}</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    closeMenu();
                    onOpenConnectModal();
                  }}
                  className="btn w-full inline-flex items-center justify-center space-x-2"
                >
                  <FaWallet className="text-sm" />
                  <span>Connect</span>
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
