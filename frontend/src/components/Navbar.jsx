import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes, FaWallet } from 'react-icons/fa';

const Navbar = ({ onOpenConnectModal, connectedAccount }) => {
  const [open, setOpen] = useState(false);
  const hamburgerRef = useRef(null);

  const handleClick = () => {
    setOpen(!open);
  };

  const closeMenu = () => {
    setOpen(false);
    hamburgerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-200 text-sm font-semibold rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block py-2.5 transition-colors text-base font-semibold rounded-xl px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isActive ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-800 hover:text-blue-600'
    }`;

  return (
    <nav className="sticky top-0 left-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 h-[80px] flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} className="text-2xl font-extrabold tracking-tight text-gray-900 cursor-pointer rounded-lg px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Penny <span className="text-[#1a6fca]">Wise</span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center space-x-8 font-medium">
          <li>
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/markets" className={navLinkClass}>
              Markets
            </NavLink>
          </li>
          <li>
            <NavLink to="/earn" className={navLinkClass}>
              Earn
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
          </li>
        </ul>

        {/* Action Button (Desktop) */}
        <div className="hidden lg:flex items-center">
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
              className="btn inline-flex items-center space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <FaWallet className="text-sm" />
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* Hamburger Icon (Mobile/Tablet) */}
        <button
          ref={hamburgerRef}
          type="button"
          className="lg:hidden z-20 cursor-pointer text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onClick={handleClick}
          aria-label={open ? 'Close main navigation' : 'Open main navigation'}
          aria-expanded={open}
          aria-controls="mobile-navigation-menu"
        >
          {open ? <FaTimes size={22} aria-hidden="true" /> : <FaBars size={22} aria-hidden="true" />}
        </button>

        {/* Mobile Dropdown Menu */}
        <div
          id="mobile-navigation-menu"
          aria-label="Mobile Navigation"
          className={`fixed inset-x-0 top-[80px] bg-white border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out lg:hidden ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
        >
          <ul className="flex flex-col p-6 space-y-2 text-center text-lg">
            <li>
              <NavLink to="/" end onClick={closeMenu} className={mobileNavLinkClass}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/markets" onClick={closeMenu} className={mobileNavLinkClass}>
                Markets
              </NavLink>
            </li>
            <li>
              <NavLink to="/earn" onClick={closeMenu} className={mobileNavLinkClass}>
                Earn & Staking
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={closeMenu} className={mobileNavLinkClass}>
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" onClick={closeMenu} className={mobileNavLinkClass}>
                Contact
              </NavLink>
            </li>
            <li className="pt-3">
              {connectedAccount ? (
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenConnectModal();
                  }}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
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
                  className="btn w-full inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FaWallet className="text-sm" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </li>
          </ul>
        </div>
        {/* Mobile backdrop — closes menu when tapping outside the drawer */}
        {open && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
