import React, { useState, useEffect, useMemo } from 'react';
import { FaCalculator, FaCoins, FaLock, FaShieldAlt, FaPercent, FaCalendarCheck } from 'react-icons/fa';
import { apiService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';

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

const EarnPage = ({ onNotify, onOpenConnectModal }) => {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [depositAmount, setDepositAmount] = useState('10000');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiService
      .getCalculatorRates()
      .then((res) => {
        if (isMounted && res && res.rates) {
          setRates(res.rates);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const estimates = useMemo(() => {
    const num = parseFloat(depositAmount);
    const currentApy = rates[selectedAsset] || 5.0;

    if (isNaN(num) || num <= 0) {
      return { daily: 0, monthly: 0, yearly: 0, total: 0, apy: currentApy };
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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      if (onNotify) onNotify('Please enter a valid email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.subscribeNewsletter(email.trim());
      if (onNotify) onNotify(res.message || 'Subscribed to staking rewards alerts!', 'success');
      setEmail('');
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Subscription failed. Please try again.');
      if (onNotify) onNotify(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <FaCoins className="text-blue-600" />
            Tax-Advantaged Staking & Yield
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Earn Up to <span className="text-emerald-600">12% APY</span> on Crypto in Your IRA
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-4 leading-relaxed">
            Generate monthly compound yield with zero lockups, institutional cold custody, and 100% tax-free growth inside a Roth or Traditional IRA.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={onOpenConnectModal}
              className="btn px-8 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Start Earning Today
            </button>
            <a
              href="#calculator"
              className="px-6 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold rounded-xl shadow-sm hover:shadow transition-all"
            >
              Calculate Yield
            </a>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <FaPercent size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compounded Monthly</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yield accrues daily and automatically pays out to your wallet or IRA account on the 1st of every month without lockup penalties.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-50 text-xs font-semibold text-emerald-600">
              No Lockup Requirements &rarr;
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <FaShieldAlt size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Custodial Insurance</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Retirement deposits are custodied by qualified institutional trust companies with up to $250M in comprehensive digital asset crime insurance.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-50 text-xs font-semibold text-blue-600">
              Qualified Trust Security &rarr;
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <FaCalendarCheck size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% Tax-Advantaged</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Earnings held in self-directed Roth IRAs grow completely tax-free upon qualified withdrawal, saving you thousands in capital gains.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-50 text-xs font-semibold text-indigo-600">
              IRS Section 408 Compliant &rarr;
            </div>
          </div>
        </div>

        {/* Calculator Section */}
        <div id="calculator" className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <FaCalculator size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Live Yield & Return Calculator
              </h2>
              <p className="text-sm text-gray-500">
                Select your asset and deposit amount to project your compound retirement earnings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Choose Staking Asset
              </label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-300 font-semibold text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {Object.keys(rates).map((coin) => (
                  <option key={coin} value={coin}>
                    {coin} — {rates[coin]}% APY
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Deposit Balance (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-bold">$</span>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-gray-300 font-semibold text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl border border-gray-200 mb-6">
            <div className="p-4 bg-white rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase">Daily Earnings</p>
              <p className="text-lg font-bold text-gray-900 mt-1">${estimates.daily.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase">Monthly Earnings</p>
              <p className="text-lg font-bold text-blue-600 mt-1">${estimates.monthly.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase">1-Year Earnings</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">+${estimates.yearly.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-xs text-emerald-700 font-semibold uppercase">Projected 1Y Total</p>
              <p className="text-lg font-extrabold text-emerald-800 mt-1">${estimates.total.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center leading-normal">
            * Disclaimer: APY rates are variable and updated dynamically from verified staking networks. Historical performance is not indicative of future results.
          </p>
        </div>

        {/* Rates Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 mb-16">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Active APY Rates by Asset</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase font-bold">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Annual APY</th>
                  <th className="py-3 px-4">Payout Schedule</th>
                  <th className="py-3 px-4">Lockup</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {Object.keys(rates).map((coin) => (
                  <tr key={coin} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900">{coin}</td>
                    <td className="py-4 px-4 font-extrabold text-emerald-600 text-base">{rates[coin]}%</td>
                    <td className="py-4 px-4 text-gray-600">Daily Accrual, Monthly Payout</td>
                    <td className="py-4 px-4 text-gray-600">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                        <FaLock size={10} /> Flexible (None)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={onOpenConnectModal}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Stake Asset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">Stay Ahead of APY Rate Changes</h3>
            <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-lg">
              Get notified when new assets become available for tax-free IRA staking and receive monthly rate forecast reports.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              required
              disabled={isSubmitting}
              className="px-4 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white w-full sm:w-64 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {isSubmitting ? 'Subscribing...' : 'Notify Me'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default EarnPage;

