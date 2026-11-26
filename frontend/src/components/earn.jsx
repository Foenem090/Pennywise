import React, { useState, useEffect, useMemo } from 'react';
import img from '../assets/trade.png';
import { apiService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';
import { FaCalculator } from 'react-icons/fa';

const DEFAULT_RATES = {
  USDC: 12.0,
  USDT: 11.5,
  SOL: 7.8,
  ETH: 5.2,
  BNB: 4.8,
  BTC: 3.5,
  ADA: 3.2,
  XRP: 3.0,
};

const Earn = ({ onNotify }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculator State
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [depositAmount, setDepositAmount] = useState('5000');

  // Fetch live rates from backend on mount
  useEffect(() => {
    let isMounted = true;
    apiService
      .getCalculatorRates()
      .then((res) => {
        if (isMounted && res && res.rates) {
          setRates(res.rates);
        }
      })
      .catch(() => {
        // Keeps DEFAULT_RATES
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute estimates directly during render
  const estimates = useMemo(() => {
    const num = parseFloat(depositAmount);
    const currentApy = rates[selectedAsset] || 5.0;

    if (isNaN(num) || num <= 0) {
      return {
        daily: 0,
        monthly: 0,
        yearly: 0,
        total: 0,
        apy: currentApy,
      };
    }

    const yearly = num * (currentApy / 100);
    const monthly = yearly / 12;
    const daily = yearly / 365;

    return {
      daily: parseFloat(daily.toFixed(2)),
      monthly: parseFloat(monthly.toFixed(2)),
      yearly: parseFloat(yearly.toFixed(2)),
      total: parseFloat((num + yearly).toFixed(2)),
      apy: currentApy,
    };
  }, [selectedAsset, depositAmount, rates]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      if (onNotify) onNotify('Please enter a valid email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.subscribeNewsletter(email.trim());
      if (onNotify) {
        onNotify(response.message || 'Subscribed successfully to Earn rewards updates!', 'success');
      }
      setEmail('');
    } catch (err) {
      const errorMsg = extractApiErrorMessage(
        err,
        'Unable to subscribe right now. Please try again later.'
      );
      if (onNotify) onNotify(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* outermost div with anchor ID */}
      <section id="earn" className="w-full bg-white py-16 md:py-24">
        {/* container */}
        <div className="max-w-[1240px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* left image container */}
          <div className="flex justify-center items-center">
            <img
              src={img}
              className="w-full max-w-[320px] sm:max-w-[400px] h-auto object-contain transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer drop-shadow-xl"
              alt="Trade and Earn Crypto"
            />
          </div>

          {/* right content container */}
          <div className="flex flex-col space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Earn passive income with crypto
            </h2>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
              Earn up to <span className="font-bold text-emerald-600">12% annual rewards</span> on 30+ digital assets.
              Simply hold your assets in your IRA or Penny Wise account to automatically earn rewards at the end of each month—with
              no lockups and no limits.
            </p>

            {/* email subscription form */}
            <div className="pt-2">
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto md:mx-0"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  aria-label="Email address for earn alerts"
                  disabled={isSubmitting}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800 placeholder-gray-400 shadow-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Learn More'}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Interactive APY Earnings Calculator Widget */}
        <div className="max-w-[1000px] mx-auto mt-16 px-4">
          <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">

            {/* Widget Title */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <FaCalculator size={20} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Interactive Yield Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Estimate your annualized compound returns based on active APY reward rates.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Asset Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Crypto Asset
                </label>
                <div className="relative">
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 font-semibold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {Object.keys(rates).map((coin) => (
                      <option key={coin} value={coin}>
                        {coin} — {rates[coin]}% APY
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deposit Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Deposit Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-8 pr-4 py-3 bg-white rounded-xl border border-gray-300 font-semibold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-gray-200">
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Daily Returns</span>
                <p className="text-xl font-extrabold text-gray-900 mt-1">
                  ${estimates.daily.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Monthly Returns</span>
                <p className="text-xl font-extrabold text-blue-600 mt-1">
                  ${estimates.monthly.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-xs text-emerald-700 font-semibold uppercase">Yearly Returns ({estimates.apy}% APY)</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">
                  +${estimates.yearly.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center sm:text-left leading-normal">
                * Note: Estimated returns are calculated for illustrative purposes based on current APY rates and are not guaranteed. Market rates and underlying crypto asset values fluctuate.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Earn;
