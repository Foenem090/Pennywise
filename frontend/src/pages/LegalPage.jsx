import React from 'react';
import { FiShield, FiFileText, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';

const LegalPage = () => {
  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiShield className="text-blue-600" />
            Compliance & Transparency
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Legal Disclosures & Fee Schedule
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Penny Wise operates under strict regulatory oversight, qualified custodial frameworks, and 100% transparent pricing.
          </p>
        </div>

        {/* Fee Schedule Section */}
        <div id="fees" className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <FiDollarSign size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Transparent Fee Schedule</h2>
              <p className="text-xs sm:text-sm text-gray-500">No hidden account maintenance or rollover costs.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase font-bold">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Penny Wise Fee</th>
                  <th className="py-3 px-4">Industry Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">Account Setup & Verification</td>
                  <td className="py-4 px-4 font-extrabold text-emerald-600">$0.00 (Free)</td>
                  <td className="py-4 px-4 text-gray-500">$50.00 – $250.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">401(k) / IRA Direct Rollover Assistance</td>
                  <td className="py-4 px-4 font-extrabold text-emerald-600">$0.00 (Free)</td>
                  <td className="py-4 px-4 text-gray-500">$100.00 – $300.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">Monthly Account Maintenance</td>
                  <td className="py-4 px-4 font-extrabold text-emerald-600">$0.00 / month</td>
                  <td className="py-4 px-4 text-gray-500">$20.00 / month</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">Trade Execution Fee</td>
                  <td className="py-4 px-4 font-bold text-gray-800">1.00% flat</td>
                  <td className="py-4 px-4 text-gray-500">1.50% – 2.50%</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">Annual Institutional Cold Custody</td>
                  <td className="py-4 px-4 font-bold text-gray-800">0.05% of assets</td>
                  <td className="py-4 px-4 text-gray-500">0.25% – 0.50%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Oversight */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FiFileText size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Regulatory Oversight & Compliance</h2>
              <p className="text-xs sm:text-sm text-gray-500">Qualified custodial and IRS legal frameworks.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed">
            <p>
              Penny Wise Financial Technologies, Inc. is a financial technology platform that partners with chartered, regulated state trust companies to provide qualified custodial administration for self-directed Individual Retirement Accounts under Section 408 of the Internal Revenue Code.
            </p>
            <p>
              Our custodial partners act as non-discretionary directed trustees. All client digital assets are titled in the name of the custodian for the benefit of the account holder (FBO structure) and remain bankruptcy-remote at all times.
            </p>
            <p>
              We comply with federal Bank Secrecy Act (BSA) and Anti-Money Laundering (AML) regulations, enforced through FinCEN registration and automated KYC/OFAC screening for all opened accounts.
            </p>
          </div>
        </div>

        {/* Risk Disclosures */}
        <div id="disclosures" className="bg-amber-50/60 border border-amber-200 rounded-3xl p-8 sm:p-12 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <FiAlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Cryptocurrency Risk Disclosures</h2>
              <p className="text-xs sm:text-sm text-amber-700">Important investment risk considerations.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-amber-950/80 leading-relaxed">
            <p>
              <strong>1. Market Volatility:</strong> Cryptocurrency investments are subject to high market risk and price volatility. The value of digital assets can fluctuate significantly in short periods, potentially resulting in substantial or complete capital loss.
            </p>
            <p>
              <strong>2. FDIC/SIPC Coverage:</strong> Cryptocurrencies and digital assets are not insured by the Federal Deposit Insurance Corporation (FDIC) or the Securities Investor Protection Corporation (SIPC). Only uninvested USD cash balances held at partner banks receive FDIC pass-through protection up to applicable limits.
            </p>
            <p>
              <strong>3. Non-Guaranteed Yield:</strong> Staking and yield rewards are variable and dependent on underlying blockchain network parameters, slashing risks, and prevailing market rates. Rewards are not guaranteed returns.
            </p>
            <p>
              <strong>4. Tax Consultation:</strong> Penny Wise does not provide formal tax, legal, or financial advice. Investors should consult their independent CPA or tax attorney prior to executing rollovers or IRA transactions.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LegalPage;

