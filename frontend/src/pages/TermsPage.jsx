import React from 'react';
import { FiFileText } from 'react-icons/fi';

const TermsPage = () => {
  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiFileText className="text-blue-600" />
            Terms of Service
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Last Updated: November 2026 &bull; Agreement for Platform Use
          </p>
        </div>

        {/* Terms Body */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h3>
            <p>
              By accessing the Penny Wise web application, utilizing our self-directed IRA onboarding services, or connecting a Web3 browser wallet, you agree to be bound by these Terms of Service and all incorporated disclosures.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Eligibility & Verification</h3>
            <p>
              You must be at least 18 years old and a legal resident of the United States or an approved jurisdiction to open a Crypto IRA. You agree to provide accurate, complete information during the KYC and custodial verification onboarding process.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Non-Custodial Technology & Directed Custody</h3>
            <p>
              Penny Wise provides software infrastructure connecting users to regulated, qualified trust custodians. Penny Wise is not a bank, broker-dealer, or registered investment advisor. All custody of cryptocurrency retirement assets is handled directly by licensed trust companies under your sole investment direction.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">4. Staking & Yield Disclosures</h3>
            <p>
              Staking rewards reflect underlying protocol parameters. Annual Percentage Yields (APY) fluctuate and are not guaranteed returns. Penny Wise is not liable for protocol-level network slashing or blockchain hard forks.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">5. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by applicable law, Penny Wise and its affiliates shall not be liable for indirect, incidental, or consequential damages resulting from digital asset market volatility or unauthorized access to your external self-custody wallet credentials.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
