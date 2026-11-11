import React, { useState, useEffect } from 'react';
import { FiSearch, FiArrowUpRight, FiArrowDown, FiTrendingUp, FiActivity, FiShield } from 'react-icons/fi';
import { apiService } from '../services/api';

const fallbackCoins = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 64250, price_change_percentage_24h: 2.35, market_cap: 1265000000000, high_24h: 65100, low_24h: 63400, total_volume: 28400000000, market_cap_rank: 1, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3480, price_change_percentage_24h: -1.12, market_cap: 418000000000, high_24h: 3550, low_24h: 3420, total_volume: 16200000000, market_cap_rank: 2, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana', name: 'Solana', symbol: 'sol', current_price: 145, price_change_percentage_24h: 5.64, market_cap: 67000000000, high_24h: 149, low_24h: 139.5, total_volume: 4100000000, market_cap_rank: 5, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 580, price_change_percentage_24h: 0.85, market_cap: 89000000000, high_24h: 589, low_24h: 574, total_volume: 1200000000, market_cap_rank: 4, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'ripple', name: 'XRP', symbol: 'xrp', current_price: 0.58, price_change_percentage_24h: -0.45, market_cap: 32000000000, high_24h: 0.60, low_24h: 0.57, total_volume: 1100000000, market_cap_rank: 7, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'cardano', name: 'Cardano', symbol: 'ada', current_price: 0.38, price_change_percentage_24h: 1.20, market_cap: 13500000000, high_24h: 0.39, low_24h: 0.37, total_volume: 420000000, market_cap_rank: 10, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'doge', current_price: 0.12, price_change_percentage_24h: 3.82, market_cap: 17800000000, high_24h: 0.13, low_24h: 0.11, total_volume: 980000000, market_cap_rank: 8, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'avax', current_price: 28.5, price_change_percentage_24h: -2.15, market_cap: 11200000000, high_24h: 29.8, low_24h: 27.9, total_volume: 350000000, market_cap_rank: 12, image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
];

const Markets = ({ onOpenConnectModal }) => {
  const [coins, setCoins] = useState(fallbackCoins);
  const [filteredCoins, setFilteredCoins] = useState(fallbackCoins);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let isMounted = true;
    apiService
      .getCoins(50)
      .then((res) => {
        if (isMounted && res && res.coins && res.coins.length > 0) {
          setCoins(res.coins);
          setFilteredCoins(res.coins);
        }
      })
      .catch((err) => {
        console.warn('Using local coin data on Markets page:', err?.message);
        if (isMounted) {
          setCoins(fallbackCoins);
          setFilteredCoins(fallbackCoins);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(q, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyFilters(searchQuery, tab);
  };

  const applyFilters = (query, tab) => {
    let list = [...coins];

    if (query.trim()) {
      const qLower = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(qLower) ||
          c.symbol.toLowerCase().includes(qLower)
      );
    }

    if (tab === 'gainers') {
      list = list.filter((c) => (c.price_change_percentage_24h || 0) > 0);
      list.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    } else if (tab === 'losers') {
      list = list.filter((c) => (c.price_change_percentage_24h || 0) < 0);
      list.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
    } else if (tab === 'stablecoins') {
      const stables = ['usdc', 'usdt', 'dai', 'busd', 'fdusd'];
      list = list.filter((c) => stables.includes(c.symbol.toLowerCase()));
    }

    setFilteredCoins(list);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '$0.00';
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLargeNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start gap-2">
              <FiActivity className="text-blue-600" />
              Live Cryptocurrency Markets
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              IRA-Eligible Digital Assets
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mt-2 max-w-xl">
              Track live pricing, 24-hour volume, and market capitalizations for qualified retirement account custody.
            </p>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={onOpenConnectModal}
              className="btn px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Deposit Crypto
            </button>
          </div>
        </div>

        {/* Market Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FiTrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">24h Market Status</p>
              <h4 className="text-lg font-bold text-gray-900">Active Trading</h4>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">Real-time CoinGecko Feed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FiShield size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Qualified Custody</p>
              <h4 className="text-lg font-bold text-gray-900">100% Cold Storage</h4>
              <p className="text-xs text-gray-500 mt-0.5">SOC 2 Type II Certified</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiActivity size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Supported Currencies</p>
              <h4 className="text-lg font-bold text-gray-900">{coins.length}+ Assets</h4>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">Instant IRA Rollover</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Coins' },
              { id: 'gainers', label: 'Top Gainers' },
              { id: 'losers', label: 'Top Losers' },
              { id: 'stablecoins', label: 'Stablecoins' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search coin or symbol..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

        </div>

        {/* Markets Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-6 text-center w-12">#</th>
                  <th className="py-4 px-6">Asset</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">24h Change</th>
                  <th className="py-4 px-6 hidden sm:table-cell">24h Range</th>
                  <th className="py-4 px-6 hidden md:table-cell">24h Volume</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Market Cap</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6 text-center"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                      <td className="py-4 px-6 hidden sm:table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                      <td className="py-4 px-6 hidden md:table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                      <td className="py-4 px-6 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-8 w-16 bg-gray-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredCoins.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                      No cryptocurrencies match your search for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredCoins.map((coin, index) => {
                    const isNeg = (coin.price_change_percentage_24h || 0) < 0;

                    return (
                      <tr key={coin.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-6 text-center text-xs text-gray-400 font-bold">
                          {coin.market_cap_rank || index + 1}
                        </td>

                        {/* Name + Symbol */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img
                              src={coin.image}
                              alt={coin.name}
                              className="w-8 h-8 object-contain rounded-full"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div>
                              <p className="font-bold text-gray-900">{coin.name}</p>
                              <span className="text-xs font-semibold text-gray-400 uppercase">
                                {coin.symbol}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Current Price */}
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {formatPrice(coin.current_price)}
                        </td>

                        {/* 24h Percentage */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isNeg ? 'text-[#F6465D] bg-red-50' : 'text-[#0ECB81] bg-emerald-50'
                            }`}
                          >
                            {isNeg ? <FiArrowDown size={14} /> : <FiArrowUpRight size={14} />}
                            <span>{Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</span>
                          </span>
                        </td>

                        {/* 24h Range */}
                        <td className="py-4 px-6 text-xs text-gray-500 hidden sm:table-cell">
                          {formatPrice(coin.low_24h || coin.current_price * 0.98)} - {formatPrice(coin.high_24h || coin.current_price * 1.02)}
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-6 text-xs font-medium text-gray-600 hidden md:table-cell">
                          {formatLargeNumber(coin.total_volume)}
                        </td>

                        {/* Market Cap */}
                        <td className="py-4 px-6 text-xs font-medium text-gray-600 hidden lg:table-cell">
                          {formatLargeNumber(coin.market_cap)}
                        </td>

                        {/* CTA Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={onOpenConnectModal}
                            className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            Invest in IRA
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Markets;

