import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="w-full bg-slate-100 text-gray-700 py-12 md:py-16 px-6 border-t border-gray-200">
      <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-gray-300 pb-12">
        
        {/* col 1: Brand & Tagline */}
        <div className="col-span-2 md:col-span-1 flex flex-col space-y-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900 cursor-pointer">
            Penny <span className="text-[#1a6fca]">Wise</span>
          </Link>
          <p className="text-sm text-gray-600 leading-relaxed">
            Empowering your crypto portfolio with institutional-grade retirement custody, real-time tracking, and passive rewards.
          </p>
        </div>

        {/* col 2: Navigation & Quick Links */}
        <div>
          <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Explore</h5>
          <div className="flex flex-col space-y-2.5 text-sm font-medium">
            <Link to="/" className="hover:text-blue-600 transition-colors duration-200">Home</Link>
            <Link to="/markets" className="hover:text-blue-600 transition-colors duration-200">Crypto Markets</Link>
            <Link to="/earn" className="hover:text-blue-600 transition-colors duration-200">Earn & Staking</Link>
            <Link to="/faq" className="hover:text-blue-600 transition-colors duration-200">FAQ & Guides</Link>
          </div>
        </div>

        {/* col 3: Support */}
        <div>
          <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Support</h5>
          <div className="flex flex-col space-y-2.5 text-sm font-medium">
            <Link to="/support" className="hover:text-blue-600 transition-colors duration-200">Help Center</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors duration-200">Advisor Rollover</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors duration-200">Contact Us</Link>
            <Link to="/legal#disclosures" className="hover:text-blue-600 transition-colors duration-200">Security & Insurance</Link>
          </div>
        </div>

        {/* col 4: Company */}
        <div>
          <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Company</h5>
          <div className="flex flex-col space-y-2.5 text-sm font-medium">
            <Link to="/about" className="hover:text-blue-600 transition-colors duration-200">About Penny Wise</Link>
            <Link to="/about#security" className="hover:text-blue-600 transition-colors duration-200">Security Architecture</Link>
            <Link to="/legal#fees" className="hover:text-blue-600 transition-colors duration-200">Fee Schedule</Link>
            <Link to="/legal" className="hover:text-blue-600 transition-colors duration-200">Legal Disclosures</Link>
          </div>
        </div>

      </div>

      {/* Bottom Bar / Copyright */}
      <div className="max-w-[1240px] mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-4 sm:space-y-0">
        <p>&copy; {new Date().getFullYear()} Penny Wise Financial Technologies, Inc. All rights reserved.</p>
        
        {/* Social Links */}
        <div className="flex space-x-5 text-base text-gray-600">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
            aria-label="Facebook"
          >
            <FaFacebook />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-700 transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-500 transition-colors"
            aria-label="Twitter / X"
          >
            <FaTwitter />
          </a>
        </div>

        {/* Legal Links */}
        <div className="flex space-x-6">
          <Link to="/terms" className="hover:text-gray-800 transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-gray-800 transition-colors">Privacy Policy</Link>
          <Link to="/legal" className="hover:text-gray-800 transition-colors">Disclosures</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
