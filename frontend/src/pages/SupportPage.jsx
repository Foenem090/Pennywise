import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiHelpCircle,
  FiFileText,
  FiShield,
  FiDollarSign,
  FiUserCheck,
  FiMessageSquare,
  FiChevronDown,
} from 'react-icons/fi';

const SUPPORT_TOPICS = [
  {
    icon: <FiUserCheck className="text-blue-600 text-2xl" />,
    title: 'Account Opening & KYC',
    description: 'ID verification, accredited investor status, and multi-signature authorization setup.',
    articles: [
      {
        id: 'kyc-documents',
        title: 'What documents are needed to open a Crypto IRA?',
        type: 'accordion',
        plainText:
          'Required documentation depends on your custodial partner and account structure. Please contact our onboarding team to obtain the current checklist of required onboarding documents.',
        content: (
          <p>
            Required documentation depends on your custodial partner and account structure. Please{' '}
            <Link
              to="/contact"
              className="text-blue-600 font-semibold underline hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              contact our onboarding team
            </Link>{' '}
            to obtain the current checklist of required onboarding documents.
          </p>
        ),
      },
      {
        id: 'verification-timeline',
        title: 'How long does IRS custodial verification take?',
        type: 'accordion',
        plainText:
          'Verification timelines vary by custodial partner and application volume. Please contact our support team for current processing timelines.',
        content: (
          <p>
            Verification timelines vary by custodial partner and application volume. Please{' '}
            <Link
              to="/contact"
              className="text-blue-600 font-semibold underline hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              contact our support team
            </Link>{' '}
            for current processing timelines.
          </p>
        ),
      },
      {
        id: 'security-keys-2fa',
        title: 'Setting up Hardware Security Keys (YubiKey) & 2FA',
        type: 'accordion',
        plainText:
          'Security key and multi-factor authentication setup is coordinated through your custodian. Penny Wise does not provide a self-service security portal in this application; please contact our support team for current setup guidance.',
        content: (
          <p>
            Security key and multi-factor authentication setup is coordinated through your custodian. Penny Wise does not provide a self-service security portal in this application; please{' '}
            <Link
              to="/contact"
              className="text-blue-600 font-semibold underline hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              contact our support team
            </Link>{' '}
            for current setup guidance.
          </p>
        ),
      },
    ],
  },
  {
    icon: <FiFileText className="text-emerald-600 text-2xl" />,
    title: 'IRA Rollovers & 401(k) Transfers',
    description: 'Tax-free custodian-to-custodian transfers, direct rollovers, and 60-day rule exemptions.',
    articles: [
      {
        id: 'rollover-checklist',
        title: 'Step-by-step 401(k) rollover checklist',
        type: 'link',
        to: '/contact',
      },
      {
        id: 'rollover-tax-implications',
        title: 'Direct vs. Indirect rollover tax implications',
        type: 'accordion',
        plainText:
          'A direct rollover transfers funds directly from your existing 401(k) custodian to your Penny Wise IRA custodian without you ever taking possession of the money. This method involves zero taxes, zero penalties, and zero IRS withholding. In an indirect rollover, your previous plan issues a check payable to you (often withholding 20% for mandatory federal income taxes). You have 60 days from receipt to deposit the full 100% into your new IRA; failing to do so triggers ordinary income taxes plus a 10% early withdrawal penalty if under 59½.',
        content: (
          <p>
            A direct rollover transfers funds directly from your existing 401(k) custodian to your Penny Wise IRA custodian without you ever taking possession of the money. This method involves zero taxes, zero penalties, and zero IRS withholding. In an indirect rollover, your previous plan issues a check payable to you (often withholding 20% for mandatory federal income taxes). You have 60 days from receipt to deposit the full 100% into your new IRA; failing to do so triggers ordinary income taxes plus a 10% early withdrawal penalty if under 59½.
          </p>
        ),
      },
      {
        id: 'brokerage-transfers',
        title: 'Transferring from Fidelity, Vanguard, or Schwab',
        type: 'link',
        to: '/contact',
      },
    ],
  },
  {
    icon: <FiShield className="text-indigo-600 text-2xl" />,
    title: 'Custody & Cold Storage Security',
    description: 'Institutional storage, SOC 2 Type II compliance, and $250M crime insurance policies.',
    articles: [
      {
        id: 'private-keys-custody',
        title: 'Where are my private keys custodied?',
        type: 'accordion',
        plainText:
          '100% of client digital assets are custodied with chartered trust companies and qualified institutional custodians. Private keys are generated and stored in multi-signature, air-gapped cold storage vaults located in geographically distributed, military-grade facilities. Penny Wise never stores private keys on internet-connected servers, and multi-party computation (MPC) quorums prevent single-point-of-failure risks.',
        content: (
          <p>
            100% of client digital assets are custodied with chartered trust companies and qualified institutional custodians. Private keys are generated and stored in multi-signature, air-gapped cold storage vaults located in geographically distributed, military-grade facilities. Penny Wise never stores private keys on internet-connected servers, and multi-party computation (MPC) quorums prevent single-point-of-failure risks.
          </p>
        ),
      },
      {
        id: 'cold-storage-multisig',
        title: 'Understanding offline cold storage and multi-sig',
        type: 'link',
        to: '/about#security',
      },
      {
        id: 'restructuring-protections',
        title: 'What happens if Penny Wise undergoes restructuring?',
        type: 'accordion',
        plainText:
          "Client assets are held in trust accounts established For Benefit Of (FBO) each client by qualified custodial partners. Under standard trust custody legal structures, digital assets remain client property and are held off balance sheet, meaning they cannot be claimed by general corporate creditors in the event of platform insolvency or restructuring.",
        content: (
          <p>
            Client assets are held in trust accounts established For Benefit Of (FBO) each client by qualified custodial partners. Under standard trust custody legal structures, digital assets remain client property and are held off balance sheet, meaning they cannot be claimed by general corporate creditors in the event of platform insolvency or restructuring.
          </p>
        ),
      },
    ],
  },
  {
    icon: <FiDollarSign className="text-amber-600 text-2xl" />,
    title: 'Yield, Staking & Returns',
    description: 'Compound staking rewards, yield payout dates, and supported proof-of-stake networks.',
    articles: [
      {
        id: 'yield-calculation',
        title: 'How is monthly staking yield calculated?',
        type: 'accordion',
        plainText:
          'Staking rewards accrue daily based on the active annualized protocol reward rate (APY divided by 365) and are credited to client IRA balances on the 1st of every calendar month. Staking rewards automatically compound into the principal balance unless directed otherwise.',
        content: (
          <p>
            Staking rewards accrue daily based on the active annualized protocol reward rate (APY divided by 365) and are credited to client IRA balances on the 1st of every calendar month. Staking rewards automatically compound into the principal balance unless directed otherwise.
          </p>
        ),
      },
      {
        id: 'roth-staking-taxes',
        title: 'Are staking returns taxable inside a Roth IRA?',
        type: 'accordion',
        plainText:
          'No. All staking rewards, staking yields, and capital gains generated inside a Roth IRA grow tax-free. Under IRS Section 408A rules, qualified distributions taken after age 59½ (provided the account has been open for at least 5 years) are completely exempt from federal and state income taxes.',
        content: (
          <p>
            No. All staking rewards, staking yields, and capital gains generated inside a Roth IRA grow tax-free. Under IRS Section 408A rules, qualified distributions taken after age 59½ (provided the account has been open for at least 5 years) are completely exempt from federal and state income taxes.
          </p>
        ),
      },
      {
        id: 'automatic-compounding',
        title: 'How to enable or disable automatic compounding',
        type: 'accordion',
        plainText:
          'Compounding preferences and reward distribution options are managed through your custodian rather than a self-service toggle. Please contact our support team to discuss or update your account preferences.',
        content: (
          <p>
            Compounding preferences and reward distribution options are managed through your custodian rather than a self-service toggle. Please{' '}
            <Link
              to="/contact"
              className="text-blue-600 font-semibold underline hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              contact our support team
            </Link>{' '}
            to discuss or update your account preferences.
          </p>
        ),
      },
    ],
  },
];

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openArticleIds, setOpenArticleIds] = useState(() => new Set());

  const toggleArticle = (id) => {
    setOpenArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredTopics = SUPPORT_TOPICS.map((topic) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return topic;

    const topicMatches =
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q);

    const matchingArticles = topic.articles.filter((art) => {
      if (topicMatches) return true;
      const titleMatches = art.title.toLowerCase().includes(q);
      const textMatches =
        typeof art.plainText === 'string' &&
        art.plainText.toLowerCase().includes(q);
      return titleMatches || textMatches;
    });

    return {
      ...topic,
      articles: matchingArticles,
    };
  }).filter((topic) => topic.articles.length > 0);

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiHelpCircle className="text-blue-600" aria-hidden="true" />
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
            <FiSearch className="absolute left-4 top-4 text-gray-500 text-lg" aria-hidden="true" />
            <input
              type="text"
              id="support-search"
              aria-label="Search help articles, tax forms, and rollover guides"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles, tax forms, rollover guides..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Knowledge Base Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredTopics.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="col-span-1 md:col-span-2 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm text-center"
            >
              <p className="text-gray-600 text-base">
                No help topics found matching &ldquo;{searchQuery}&rdquo;.
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
            filteredTopics.map((topic, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 shrink-0" aria-hidden="true">
                      {topic.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{topic.title}</h2>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{topic.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mt-6 border-t border-gray-100 pt-5">
                    {topic.articles.map((art) => {
                      if (art.type === 'link') {
                        return (
                          <li key={art.id} className="border-b border-gray-50 last:border-b-0 pb-2.5 last:pb-0">
                            <Link
                              to={art.to}
                              className="w-full flex items-center justify-between group py-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-colors"
                            >
                              <span>{art.title}</span>
                              <span
                                className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-2 shrink-0"
                                aria-hidden="true"
                              >
                                &rarr;
                              </span>
                            </Link>
                          </li>
                        );
                      }

                      const isOpen = openArticleIds.has(art.id);
                      return (
                        <li key={art.id} className="border-b border-gray-50 last:border-b-0 pb-2.5 last:pb-0">
                          <button
                            type="button"
                            onClick={() => toggleArticle(art.id)}
                            aria-expanded={isOpen}
                            aria-controls={`article-content-${art.id}`}
                            id={`article-btn-${art.id}`}
                            className="w-full flex items-center justify-between group py-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>{art.title}</span>
                            <FiChevronDown
                              className={`text-gray-600 group-hover:text-blue-600 transition-transform duration-200 ml-2 shrink-0 ${
                                isOpen ? 'rotate-180 text-blue-600' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                          <div
                            id={`article-content-${art.id}`}
                            role="region"
                            aria-labelledby={`article-btn-${art.id}`}
                            hidden={!isOpen}
                            className={`mt-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed pl-3.5 pr-2 py-2.5 bg-slate-50/80 rounded-xl border-l-4 border-blue-500 animate-fade-in ${
                              !isOpen ? 'hidden' : ''
                            }`}
                          >
                            {art.content}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Support Banner */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl shrink-0" aria-hidden="true">
              <FiMessageSquare size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Need Personalized Assistance?</h2>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Our licensed retirement specialists and rollover coordinators are available Mon-Fri 8am-8pm EST.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link
              to="/contact"
              className="btn px-6 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
            >
              Contact Support
            </Link>
            <Link
              to="/faq"
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-gray-800 font-semibold rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
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
