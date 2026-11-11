import React from 'react';
import { FaFacebook, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <>
      {/* outermost div */}
      <footer className="w-full bg-slate-100 text-gray-700 py-12 md:py-16 px-6 border-t border-gray-200">
        {/* container */}
        <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-gray-300 pb-12">
          
          {/* col 1: Brand & Tagline */}
          <div className="col-span-2 md:col-span-1 flex flex-col space-y-3">
            <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 cursor-pointer">
              Penny <span className="text-[#1a6fca]">Wise</span>
            </a>
            <p className="text-sm text-gray-600 leading-relaxed">
              Empowering your crypto portfolio with institutional-grade retirement custody, real-time tracking, and passive rewards.
            </p>
          </div>

          {/* col 2: Navigation & Quick Links */}
          <div>
            <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Explore</h5>
            <div className="flex flex-col space-y-2.5 text-sm font-medium">
              <a href="/" className="hover:text-blue-600 transition-colors duration-200">Home</a>
              <a href="#featured" className="hover:text-blue-600 transition-colors duration-200">Featured Coins</a>
              <a href="#earn" className="hover:text-blue-600 transition-colors duration-200">Earn Rewards</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">Contact Us</a>
            </div>
          </div>

          {/* col 3: Support */}
          <div>
            <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Support</h5>
            <div className="flex flex-col space-y-2.5 text-sm font-medium">
              <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">Advisor Rollover</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">IRA Custody</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">Security & Insurance</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors duration-200">Help Center</a>
            </div>
          </div>

          {/* col 4: Company */}
          <div>
            <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Company</h5>
            <div className="flex flex-col space-y-2.5 text-sm font-medium">
              <a href="/" className="hover:text-blue-600 transition-colors duration-200">About Penny Wise</a>
              <a href="/" className="hover:text-blue-600 transition-colors duration-200">Fee Schedule</a>
              <a href="/" className="hover:text-blue-600 transition-colors duration-200">Compliance & Trust</a>
              <a href="/" className="hover:text-blue-600 transition-colors duration-200">Privacy Policy</a>
            </div>
          </div>

          {/* col 5: Social Links */}
          <div>
            <h5 className="font-bold text-gray-900 text-base mb-4 uppercase tracking-wider">Social</h5>
            <div className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 hover:text-blue-600 transition-colors duration-200"
              >
                <FaFacebook className="text-lg text-blue-600" />
                <span>Facebook</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 hover:text-blue-600 transition-colors duration-200"
              >
                <FaGithub className="text-lg text-gray-800" />
                <span>Github</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 hover:text-blue-600 transition-colors duration-200"
              >
                <FaLinkedin className="text-lg text-blue-700" />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 hover:text-blue-600 transition-colors duration-200"
              >
                <FaTwitter className="text-lg text-sky-500" />
                <span>Twitter / X</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar / Copyright */}
        <div className="max-w-[1240px] mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-4 sm:space-y-0">
          <p>&copy; {new Date().getFullYear()} Penny Wise, Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="/" className="hover:text-gray-800 transition-colors">Terms of Service</a>
            <a href="/" className="hover:text-gray-800 transition-colors">Privacy Policy</a>
            <a href="/" className="hover:text-gray-800 transition-colors">Disclosures</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
