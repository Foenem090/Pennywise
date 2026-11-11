import React from 'react';
import { FiLock } from 'react-icons/fi';

const PrivacyPage = () => {
  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiLock className="text-blue-600" />
            Data Protection & Privacy
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Last Updated: November 2026 &bull; Effective immediately for all users
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h3>
            <p>
              When you open an account, request a consultation, or subscribe to Penny Wise platform updates, we collect personal identifying information necessary for financial regulatory compliance, including your name, email address, phone number, physical address, Social Security Number (for IRS tax reporting), and government-issued identification.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h3>
            <p>
              We utilize collected information solely to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-gray-600">
              <li>Establish and verify your self-directed Individual Retirement Account with our qualified trust custodians.</li>
              <li>Comply with federal Bank Secrecy Act (BSA) and Anti-Money Laundering (AML) requirements.</li>
              <li>Deliver automated IRA annual contribution and fair market valuation statements (IRS Form 5498).</li>
              <li>Communicate updates regarding your staking rewards, account balances, and security alerts.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">3. We Never Sell Your Data</h3>
            <p>
              Penny Wise will never sell, rent, or monetize your personal information or transaction history to third-party advertisers or data brokers. Information is shared strictly with qualified custodial banks, broker-dealers, and regulatory bodies as mandated by United States financial law.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">4. Cryptographic Security Standards</h3>
            <p>
              All data transmitted to Penny Wise is encrypted in transit using TLS 1.3 encryption and stored in encrypted databases using AES-256 standard encryption. Multi-factor authentication is required for all administrative access.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">5. Contact Our Data Protection Officer</h3>
            <p>
              If you have any questions regarding your data privacy or wish to request data verification under applicable state laws, please contact our compliance desk at{' '}
              <a href="mailto:privacy@pennywise.io" className="text-blue-600 font-semibold hover:underline">
                privacy@pennywise.io
              </a>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
