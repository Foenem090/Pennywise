import React, { useState, useEffect, useRef } from 'react';
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
  const searchDebounceRef = useRef(null);
  const latestQueryRef = useRef('');
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleOpenExpanded = (e) => {
    // Capture triggering card element for focus restoration upon close
    triggerRef.current = e?.currentTarget || document.activeElement;
    setShowExpanded(true);
    setSearchQuery('');
    latestQueryRef.current = '';
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setSearchResults([]);
    // Load top 20 coins
    apiService
      .getCoins(20)
      .then((res) => {
        if (!latestQueryRef.current.trim() && res && res.coins) {
          setSearchResults(res.coins);
        }
      })
      .catch(() => {
        if (!latestQueryRef.current.trim()) {
          setSearchResults(fallbackCoins);
        }
      });
  };

  useEffect(() => {
    if (!showExpanded) return;

    // 1. Place initial focus into search input once modal is rendered
    const frameId = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    // 2. Escape key dismissal and focus trap
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExpanded(false);
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);

      // 3. Restore focus to the exact card that opened the modal
      if (triggerRef.current && typeof triggerRef.current.focus === 'function' && triggerRef.current.isConnected) {
        triggerRef.current.focus();
      }
    };
  }, [showExpanded]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    latestQueryRef.current = query;

    // Cancel any pending debounced search
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query.trim()) {
      // Empty query: show top coins immediately, no debounce needed
      setIsSearching(false);
      apiService
        .getCoins(20)
        .then((res) => {
          if (!latestQueryRef.current.trim()) {
            setSearchResults(res.coins || fallbackCoins);
          }
        })
        .catch(() => {
          if (!latestQueryRef.current.trim()) {
            setSearchResults(fallbackCoins);
          }
        });
      return;
    }

    // Debounce: wait 350 ms after the user stops typing before firing the request.
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      const requestedQuery = query;
      apiService
        .searchCoins(requestedQuery, 16)
        .then((res) => {
          if (latestQueryRef.current === requestedQuery) {
            setSearchResults(res.coins || []);
          }
        })
        .catch(() => {
          if (latestQueryRef.current === requestedQuery) {
            const filtered = fallbackCoins.filter(
              (c) =>
                c.name.toLowerCase().includes(requestedQuery.toLowerCase()) ||
                c.symbol.toLowerCase().includes(requestedQuery.toLowerCase())
            );
            setSearchResults(filtered);
          }
        })
        .finally(() => {
          if (latestQueryRef.current === requestedQuery) {
            setIsSearching(false);
          }
        });
    }, 350);
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
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                See All Markets <span aria-hidden="true">&rarr;</span>
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
                    <button
                      key={coin.id}
                      type="button"
                      onClick={handleOpenExpanded}
                      aria-label={`View ${coin.name} (${coin.symbol.toUpperCase()}) market details`}
                      className="w-full text-left flex flex-col justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {/* Top: Icon + Name */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={coin.image}
                          alt=""
                          aria-hidden="true"
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
                      <div className="w-full flex justify-between items-end pt-2 border-t border-gray-50">
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
                            <FiArrowDown size={16} aria-hidden="true" />
                          ) : (
                            <FiArrowUpRight size={16} aria-hidden="true" />
                          )}
                          <span>
                            {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
          </div>

        </div>
      </section>

      {/* Expanded Cryptocurrency Market Modal / Drawer */}
      {showExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExpanded(false);
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-modal-title"
            aria-describedby="market-modal-desc"
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 id="market-modal-title" className="text-2xl font-bold text-gray-900">
                  Cryptocurrency Markets
                </h3>
                <p id="market-modal-desc" className="text-xs text-gray-500 mt-1">
                  Live prices, 24h changes, and market caps
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpanded(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Close markets modal"
              >
                <FiX size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 px-6 bg-slate-50 border-b border-gray-100 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={18} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="text"
                  id="market-modal-search"
                  aria-label="Search cryptocurrency markets by name or symbol"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by coin name or symbol (e.g. Bitcoin, sol, ada)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Table / List */}
            <div className="overflow-y-auto flex-1 p-6">
              {isSearching ? (
                <div role="status" aria-live="polite" className="py-12 text-center text-sm text-gray-500">
                  Searching markets...
                </div>
              ) : searchResults.length === 0 ? (
                <div role="status" aria-live="polite" className="py-12 text-center text-sm text-gray-500 space-y-3">
                  <p>No cryptocurrencies found matching &ldquo;{searchQuery}&rdquo;.</p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearch({ target: { value: '' } })}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Clear Search
                    </button>
                  )}
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
                            alt=""
                            aria-hidden="true"
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
                            {isNeg ? (
                              <FiArrowDown size={12} aria-hidden="true" />
                            ) : (
                              <FiArrowUpRight size={12} aria-hidden="true" />
                            )}
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
            <div className="p-4 px-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center text-xs text-gray-500 shrink-0">
              <span aria-live="polite" aria-atomic="true">
                Showing {searchResults.length} {searchResults.length === 1 ? 'asset' : 'assets'}
              </span>
              <button
                type="button"
                onClick={() => setShowExpanded(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
