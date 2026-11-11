import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiHelpCircle, FiFileText, FiShield, FiDollarSign, FiUserCheck, FiMessageSquare } from 'react-icons/fi';

const SUPPORT_TOPICS = [
  {
    icon: <FiUserCheck className="text-blue-600 text-2xl" />,
    title: 'Account Opening & KYC',
    description: 'ID verification, accredited investor status, and multi-signature authorization setup.',
    articles: [
      'What documents are needed to open a Crypto IRA?',
      'How long does IRS custodial verification take?',
      'Setting up Hardware Security Keys (YubiKey) & 2FA',
    ],
  },
  {
    icon: <FiFileText className="text-emerald-600 text-2xl" />,
    title: 'IRA Rollovers & 401(k) Transfers',
    description: 'Tax-free custodian-to-custodian transfers, direct rollovers, and 60-day rule exemptions.',
    articles: [
      'Step-by-step 401(k) rollover checklist',
      'Direct vs. Indirect rollover tax implications',
      'Transferring from Fidelity, Vanguard, or Schwab',
    ],
  },
  {
    icon: <FiShield className="text-indigo-600 text-2xl" />,
    title: 'Custody & Cold Storage Security',
    description: 'Institutional storage, SOC 2 Type II compliance, and $250M crime insurance policies.',
    articles: [
      'Where are my private keys custodied?',
      'Understanding offline cold storage and multi-sig',
      'What happens if Penny Wise undergoes restructuring?',
    ],
  },
  {
    icon: <FiDollarSign className="text-amber-600 text-2xl" />,
    title: 'Yield, Staking & Returns',
    description: 'Compound staking rewards, yield payout dates, and supported proof-of-stake networks.',
    articles: [
      'How is monthly staking yield calculated?',
      'Are staking returns taxable inside a Roth IRA?',
      'How to enable or disable automatic compounding',
    ],
  },
];

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = SUPPORT_TOPICS.filter((topic) => {
    const q = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q) ||
      topic.articles.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiHelpCircle className="text-blue-600" />
            Penny Wise Help Center
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            How Can We Assist You?
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Find answers to frequently asked custodial questions, rollover instructions, and platform security standards.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <FiSearch className="absolute left-4 top-4 text-gray-400 text-lg" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles, tax forms, rollover guides..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Knowledge Base Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredTopics.map((topic, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100">{topic.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{topic.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{topic.description}</p>
                </div>
              </div>

              <ul className="space-y-3 mt-6 border-t border-gray-50 pt-5">
                {topic.articles.map((art, aIdx) => (
                  <li key={aIdx} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {art}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      &rarr;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Live Support Banner */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl shrink-0">
              <FiMessageSquare size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Need Personalized Assistance?</h3>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Our licensed retirement specialists and rollover coordinators are available Mon-Fri 8am-8pm EST.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link
              to="/contact"
              className="btn px-6 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Contact Support
            </Link>
            <Link
              to="/faq"
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-gray-800 font-semibold rounded-xl transition-colors"
            >
              Browse FAQ
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportPage;

