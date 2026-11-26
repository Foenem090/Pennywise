import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiSearch, FiHelpCircle } from 'react-icons/fi';

const FAQ_DATA = [
  {
    id: 'rollover-401k-403b',
    category: 'rollovers',
    question: 'Can I rollover an existing 401(k) or 403(b) into a Crypto IRA?',
    answer:
      'Yes. If you have a 401(k) from a previous employer or an eligible active plan allowing in-service distributions, you can perform a direct trustee-to-trustee rollover with zero penalties or tax withholding. Penny Wise coordinates directly with your existing custodian.',
  },
  {
    id: 'traditional-vs-roth',
    category: 'rollovers',
    question: 'What is the difference between a Traditional Crypto IRA and a Roth Crypto IRA?',
    answer:
      'A Traditional Crypto IRA allows you to invest pre-tax dollars, lowering your taxable income today; taxes are deferred until you take qualified distributions in retirement. A Roth Crypto IRA is funded with post-tax dollars, but all future capital gains, staking rewards, and withdrawals are 100% tax-free after age 59½.',
  },
  {
    id: 'crypto-capital-gains-taxes',
    category: 'taxes',
    question: 'Do I have to pay capital gains taxes every time I trade crypto in my IRA?',
    answer:
      'No. All trades executed within your Penny Wise Self-Directed IRA are completely tax-deferred (Traditional) or tax-free (Roth). You do not need to report individual crypto trades on IRS Form 8949 each year, which dramatically simplifies your tax reporting.',
  },
  {
    id: 'annual-tax-forms',
    category: 'taxes',
    question: 'What tax forms will I receive at the end of the year?',
    answer:
      'You will receive IRS Form 5498 (reporting annual contributions and fair market valuation of your IRA) and Form 1099-R (only if you took a distribution or withdrawal during the tax year). All forms are prepared and filed by our qualified institutional custodian.',
  },
  {
    id: 'crypto-cold-storage-security',
    category: 'security',
    question: 'How are my cryptocurrency assets secured?',
    answer:
      'All assets are held in institutional-grade offline cold storage with multi-signature authorization. Private keys never touch internet-connected devices. Our custodian partners maintain $250M in comprehensive digital asset crime and cyber theft insurance.',
  },
  {
    id: 'fdic-insurance-coverage',
    category: 'security',
    question: 'Is Penny Wise FDIC insured?',
    answer:
      'Cryptocurrencies themselves are not covered by FDIC insurance (FDIC only protects cash deposits in chartered banks up to $250,000). However, uninvested USD cash balances in your IRA are held in FDIC-insured partner banks, and digital assets are covered under commercial crime insurance policies.',
  },
  {
    id: 'staking-yield-timing',
    category: 'earn',
    question: 'How are staking yields generated and when are rewards paid?',
    answer:
      'Staking yields are generated through native Proof-of-Stake network validation (such as Ethereum and Solana) and institutional lending protocols for stablecoins. Rewards accrue daily and are credited directly to your IRA account on the first calendar day of each month.',
  },
  {
    id: 'staking-lockup-periods',
    category: 'earn',
    question: 'Are there lockup periods on staking rewards?',
    answer:
      'No. Penny Wise operates flexible reward programs with no minimum holding periods. You can swap, rebalance, or withdraw your staked assets at any time without early unstaking penalties.',
  },
  {
    id: 'fee-structure-pricing',
    category: 'fees',
    question: 'What are the fees associated with Penny Wise?',
    answer:
      'We believe in transparent pricing: there are zero monthly account maintenance fees, zero rollover fees, and a transparent 1.0% trade execution fee. Qualified custodial asset storage is capped at 0.05% annually with no surprise charges.',
  },
];

const FaqPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIds, setOpenFaqIds] = useState(['rollover-401k-403b']); // First item open by default

  const toggleAccordion = (id) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiHelpCircle className="text-blue-600" aria-hidden="true" />
            Frequently Asked Questions
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Everything You Need to Know
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Clear answers about self-directed crypto IRAs, rollover rules, qualified custody, and staking yields.
          </p>

          {/* Search Box */}
          <div className="mt-8 relative max-w-lg mx-auto">
            <FiSearch className="absolute left-4 top-4 text-gray-400 text-lg" aria-hidden="true" />
            <input
              type="text"
              id="faq-search"
              aria-label="Search frequently asked questions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. 401k, taxes, fees)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'rollovers', label: 'Rollovers & 401(k)' },
            { id: 'taxes', label: 'Taxes & IRS' },
            { id: 'security', label: 'Security & Custody' },
            { id: 'earn', label: 'Yield & Staking' },
            { id: 'fees', label: 'Fees & Pricing' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4 mb-16">
          {filteredFaqs.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="bg-white p-10 sm:p-12 text-center rounded-3xl border border-gray-200 text-gray-600 shadow-sm"
            >
              <p className="text-gray-600 text-base">
                No questions found matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-5 py-2.5 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isOpen = openFaqIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    id={`faq-btn-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between space-x-4 cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <span className="font-bold text-gray-900 text-base sm:text-lg">
                      {item.question}
                    </span>
                    <span className="p-2 rounded-full bg-slate-100 text-gray-500 shrink-0" aria-hidden="true">
                      {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    hidden={!isOpen}
                    className={`px-6 pb-6 sm:px-7 sm:pb-7 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100 pt-4 animate-fade-in ${
                      !isOpen ? 'hidden' : ''
                    }`}
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Contact Help */}
        <div className="text-center bg-blue-50 border border-blue-100 rounded-3xl p-8 sm:p-10">
          <h3 className="text-xl font-bold text-gray-900">Still Have Questions?</h3>
          <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-md mx-auto">
            Our qualified IRA specialists are available to answer any questions about your specific retirement accounts.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to="/contact"
              className="btn px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Speak to an Advisor
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FaqPage;

