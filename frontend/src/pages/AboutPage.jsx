import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiTrendingUp, FiAward, FiCheckCircle, FiUsers, FiLock } from 'react-icons/fi';

const AboutPage = () => {
  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiAward className="text-blue-600" />
            About Penny Wise
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Democratizing Tax-Free Wealth with Institutional Crypto IRAs
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-4 leading-relaxed">
            Founded in 2021, Penny Wise provides individual investors, high-net-worth clients, and retirement savers with institutional-grade access to digital assets inside tax-advantaged self-directed IRAs.
          </p>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-600">$1.2B+</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mt-1">Assets Under Custody</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">45,000+</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mt-1">Active IRA Savers</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600">99.99%</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mt-1">Historical Uptime</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-600">$250M</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mt-1">Custodial Insurance</p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Bridging Traditional Finance with the Decentralized Economy
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Traditional 401(k) plans and mutual funds often lock investors out of the fastest-growing asset class in history. Penny Wise changes that by giving you full autonomy over your retirement holdings.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Whether you are rolling over a 401(k) from a previous employer or making annual Roth IRA contributions, our technology eliminates IRS paperwork friction, coordinates directly with trust custodians, and provides multi-chain staking opportunities.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 text-sm text-gray-800 font-medium">
                <FiCheckCircle className="text-emerald-500 shrink-0" />
                <span>IRS Section 408 Self-Directed Custody Compliance</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-800 font-medium">
                <FiCheckCircle className="text-emerald-500 shrink-0" />
                <span>Institutional Cold-Storage Vaults with Multi-Sig Quorums</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-800 font-medium">
                <FiCheckCircle className="text-emerald-500 shrink-0" />
                <span>Full Rollover Support with Zero Hidden Rollover Surcharges</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Our Core Principles</h3>
            <div className="space-y-5">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                  <FiShield size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Uncompromised Security</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Your assets are held in segregated, offline trust accounts that are never co-mingled or loaned out without explicit authorization.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                  <FiTrendingUp size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Transparent Value</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    No hidden monthly account fees or liquidation penalties. What you see is what you keep.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                  <FiUsers size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Human Support</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Dedicated IRA rollover coordinators available by phone and email to guide your transfer every step of the way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section with Anchor */}
        <div id="security" className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-xl mb-16">
          <div className="max-w-2xl mb-8">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              Security Architecture
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold mt-3">
              Institutional Cold Custody You Can Trust
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              We partner with audited, regulated trust companies to deliver defense-in-depth asset protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <FiLock className="text-emerald-400 text-2xl mb-4" />
              <h4 className="font-bold text-base text-white">Air-Gapped Cold Vaults</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Private key shards are created in secure enclaves inside geographically dispersed decommissioned military bunkers.
              </p>
            </div>

            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <FiShield className="text-blue-400 text-2xl mb-4" />
              <h4 className="font-bold text-base text-white">Regulated Trust Custody</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Qualified custodian oversight ensures assets remain your property under bankruptcy-remote legal structures.
              </p>
            </div>

            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <FiAward className="text-amber-400 text-2xl mb-4" />
              <h4 className="font-bold text-base text-white">Comprehensive Insurance</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Up to $250M in commercial crime, employee theft, and cyber incident protection placed through Lloyd's of London syndicates.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white border border-gray-200 rounded-3xl p-10 sm:p-12 shadow-sm">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Ready to Take Control of Your Crypto Retirement?</h3>
          <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg mx-auto">
            Open a Self-Directed Crypto IRA in under 10 minutes or speak with our rollover specialists today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/contact"
              className="btn px-8 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Start Free Rollover
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
