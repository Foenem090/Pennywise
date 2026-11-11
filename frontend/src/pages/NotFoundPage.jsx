import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowRight } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="w-full bg-[#f5f8ff] min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sm:p-10 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mt-2">Page Not Found</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          The page you are looking for does not exist or has been moved to another location.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center space-x-2 btn py-3.5 px-6 text-white font-semibold rounded-xl shadow-md transition-all"
          >
            <FiHome size={16} />
            <span>Return to Homepage</span>
          </Link>
          <Link
            to="/markets"
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
          >
            <span>Explore Crypto Markets</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

