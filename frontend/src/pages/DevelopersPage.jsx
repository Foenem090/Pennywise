import React, { useState } from 'react';
import { FiCode, FiCloud, FiShoppingCart, FiCpu, FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi';

const CODE_EXAMPLES = {
  curl: `curl -X GET "http://localhost:8000/api/v1/coins?limit=6" \\
     -H "Accept: application/json"`,
  python: `import httpx

client = httpx.Client(base_url="http://localhost:8000/api/v1")
response = client.get("/coins", params={"limit": 6})
coins = response.json()["coins"]
for coin in coins:
    print(f"{coin['name']}: \${coin['current_price']}")`,
  javascript: `const response = await fetch("http://localhost:8000/api/v1/coins?limit=6");
const data = await response.json();
console.log("Top Cryptocurrencies:", data.coins);`,
};

const DevelopersPage = () => {
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FiCode className="text-blue-600" />
            Penny Wise Developer Ecosystem
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Build on Institutional Crypto & IRA Infrastructure
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-4 leading-relaxed">
            Integrate real-time cryptocurrency market feeds, automated yield estimation, cold custody APIs, and merchant payment gateways into your applications.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn px-8 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Swagger API Docs</span>
              <FiExternalLink size={16} />
            </a>
            <a
              href="#api"
              className="px-6 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold rounded-xl shadow-sm transition-all"
            >
              API Reference
            </a>
          </div>
        </div>

        {/* 4 Pillars (Cloud, Commerce, Pro, API) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Cloud */}
          <div id="cloud" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5">
                <FiCloud size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Penny Wise Cloud</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Dedicated validator nodes, RPC endpoints with 99.99% SLA uptime, and automated multi-region staking relays.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-blue-600">
              Low-latency RPC Access &rarr;
            </div>
          </div>

          {/* Commerce */}
          <div id="commerce" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <FiShoppingCart size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Commerce Gateway</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Accept 30+ cryptocurrencies at merchant checkout with instant USD conversion and zero chargeback risks.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-emerald-600">
              E-Commerce SDKs &rarr;
            </div>
          </div>

          {/* Pro */}
          <div id="pro" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
                <FiCpu size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Institutional Pro</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                FIX protocol 4.4 and high-speed WebSockets for algorithmic rebalancing, OTC liquidity desk access, and custody audits.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-indigo-600">
              Institutional FIX Specs &rarr;
            </div>
          </div>

          {/* API */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5">
                <FiCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">REST API v1</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                FastAPI endpoints for market quotes, yield calculators, subscriber funnels, and real-time custodial health metrics.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-amber-600">
              OpenAPI Specification &rarr;
            </div>
          </div>

        </div>

        {/* Interactive Code Explorer */}
        <div id="api" className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl mb-16 border border-gray-800">
          
          {/* Code Window Header */}
          <div className="px-6 py-4 bg-gray-950 flex flex-wrap items-center justify-between border-b border-gray-800 gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-mono text-gray-400 ml-2">GET /api/v1/coins</span>
            </div>

            {/* Language Buttons */}
            <div className="flex items-center space-x-2">
              {['curl', 'python', 'javascript'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeLang === lang
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {lang}
                </button>
              ))}

              <button
                onClick={handleCopy}
                className="ml-2 p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Copy snippet"
              >
                {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="p-6 overflow-x-auto font-mono text-sm leading-relaxed text-emerald-400 bg-gray-900">
            <pre>{CODE_EXAMPLES[activeLang]}</pre>
          </div>

          {/* Sample JSON Output */}
          <div className="p-6 bg-gray-950 border-t border-gray-800">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Sample 200 OK Response:</p>
            <pre className="font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto">
{`{
  "coins": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "name": "Bitcoin",
      "current_price": 64250.0,
      "price_change_percentage_24h": 2.35,
      "market_cap": 1265000000000.0
    }
  ],
  "count": 1,
  "source": "coingecko",
  "cached": true
}`}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DevelopersPage;
