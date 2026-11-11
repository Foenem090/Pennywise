import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiArrowDown, FiSearch, FiX } from 'react-icons/fi';
import { apiService } from '../services/api';

const fallbackCoins = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 64250, price_change_percentage_24h: 2.35, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', market_cap: 1265000000000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3480, price_change_percentage_24h: -1.12, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', market_cap: 418000000000 },
  { id: 'solana', name: 'Solana', symbol: 'sol', current_price: 145, price_change_percentage_24h: 5.64, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', market_cap: 67000000000 },
  { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 580, price_change_percentage_24h: 0.85, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', market_cap: 89000000000 },
  { id: 'ripple', name: 'XRP', symbol: 'xrp', current_price: 0.58, price_change_percentage_24h: -0.45, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', market_cap: 32000000000 },
  { id: 'cardano', name: 'Cardano', symbol: 'ada', current_price: 0.38, price_change_percentage_24h: 1.20, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', market_cap: 13500000000 },
];

const Featured = () => {
  const [data, setData] = useState(fallbackCoins);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpanded, setShowExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiService
      .getCoins(6)
      .then((res) => {
        if (isMounted && res && res.coins && res.coins.length > 0) {
          setData(res.coins);
        }
      })
      .catch((error) => {
        console.warn('Using local fallback crypto data due to network/API status:', error?.message);
        if (isMounted) setData(fallbackCoins);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenExpanded = () => {
    setShowExpanded(true);
    setSearchQuery('');
    setSearchResults([]);
    // Load top 20 coins
    apiService
      .getCoins(20)
      .then((res) => {
        if (res && res.coins) {
          setSearchResults(res.coins);
        }
      })
      .catch(() => {
        setSearchResults(fallbackCoins);
      });
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      apiService
        .getCoins(20)
        .then((res) => setSearchResults(res.coins || fallbackCoins))
        .catch(() => setSearchResults(fallbackCoins));
      return;
    }

    setIsSearching(true);
    apiService
      .searchCoins(query, 16)
      .then((res) => {
        setSearchResults(res.coins || []);
      })
      .catch(() => {
        const filtered = fallbackCoins.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '$0.00';
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* outermost div with anchor ID */}
      <section id="featured" className="relative w-full bg-slate-200 -skew-y-2 py-20 my-10 overflow-hidden">
        {/* container */}
        <div className="max-w-[1240px] mx-auto px-4 skew-y-2 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* left column */}
          <div className="flex flex-col space-y-4 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Explore top cryptos like Bitcoin, Ethereum, and BNB
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Live market tracking, institutional security, and IRA-eligible cryptocurrency assets.
            </p>
            <div>
              <Link 
                to="/markets"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                See All Markets &rarr;
              </Link>
            </div>
          </div>

          {/* right column - mapped 6-coin grid or loading skeleton */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm animate-pulse space-y-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-20" />
                        <div className="h-3 bg-slate-100 rounded w-10" />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                      <div className="h-6 bg-slate-100 rounded w-12" />
                    </div>
                  </div>
                ))
              : data.map((coin) => {
                  const isNegative = (coin.price_change_percentage_24h || 0) < 0;

                  return (
                    <div
                      key={coin.id}
                      onClick={handleOpenExpanded}
                      className="flex flex-col justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
                    >
                      {/* Top: Icon + Name */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-10 h-10 object-contain rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h5 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-blue-600 transition-colors">
                            {coin.name}
                          </h5>
                          <span className="text-xs font-semibold text-gray-400 uppercase">
                            {coin.symbol}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Price + 24h Percentage */}
                      <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Price</p>
                          <p className="text-base font-bold text-gray-900">
                            {formatPrice(coin.current_price)}
                          </p>
                        </div>

                        {/* Percentage Indicator */}
                        <div
                          className={`flex items-center space-x-1 font-bold text-sm px-2 py-1 rounded-lg ${
                            isNegative
                              ? 'text-[#F6465D] bg-red-50'
                              : 'text-[#0ECB81] bg-emerald-50'
                          }`}
                        >
                          {isNegative ? (
                            <FiArrowDown size={16} />
                          ) : (
                            <FiArrowUpRight size={16} />
                          )}
                          <span>
                            {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>

        </div>
      </section>

      {/* Expanded Cryptocurrency Market Modal / Drawer */}
      {showExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Cryptocurrency Markets</h3>
                <p className="text-xs text-gray-500 mt-1">Live prices, 24h changes, and market caps</p>
              </div>
              <button
                onClick={() => setShowExpanded(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Close markets modal"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 px-6 bg-slate-50 border-b border-gray-100">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by coin name or symbol (e.g. Bitcoin, sol, ada)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Table / List */}
            <div className="overflow-y-auto flex-1 p-6">
              {isSearching ? (
                <div className="py-12 text-center text-sm text-gray-500">Searching markets...</div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No cryptocurrencies found matching "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((coin) => {
                    const isNeg = (coin.price_change_percentage_24h || 0) < 0;
                    return (
                      <div
                        key={coin.id}
                        className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-9 h-9 rounded-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{coin.name}</h4>
                            <span className="text-xs text-gray-400 uppercase font-semibold">
                              {coin.symbol}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">
                            {formatPrice(coin.current_price)}
                          </p>
                          <div
                            className={`inline-flex items-center space-x-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                              isNeg ? 'text-[#F6465D] bg-red-50' : 'text-[#0ECB81] bg-emerald-50'
                            }`}
                          >
                            {isNeg ? <FiArrowDown size={12} /> : <FiArrowUpRight size={12} />}
                            <span>{Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center text-xs text-gray-500">
              <span>Showing {searchResults.length} assets</span>
              <button
                onClick={() => setShowExpanded(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Featured;
