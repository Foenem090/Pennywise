import React, { useState } from 'react';
import heroimg from '../assets/bgImg.jpg';
import { apiService } from '../services/api';

const Hero = ({ onNotify }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      if (onNotify) onNotify('Please enter a valid email address.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.subscribeNewsletter(email.trim());
      if (onNotify) {
        onNotify(response.message || 'Thank you for subscribing!', 'success');
      }
      setEmail('');
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        'Unable to complete subscription. Please verify your connection and try again.';
      if (onNotify) onNotify(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* outermost div */}
      <div className="max-w-[1240px] m-auto px-4 py-12 md:py-20">
        {/* container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mx-2 sm:mx-8 my-auto justify-center items-center p-4">
          {/* left side */}
          <div className="flex flex-col justify-center space-y-4 text-center md:text-left">
            <p className="text-[#1a6fca] font-semibold tracking-wide text-sm sm:text-base uppercase">
              Buy & Sell Crypto 24/7 using your Retirement account
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight py-0">
              Invest in Cryptocurrency with Your IRA
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto md:mx-0">
              Buy, sell and store hundreds of cryptocurrencies with institutional cold-storage security and zero hidden fees.
            </p>
            {/* input form */}
            <div className="pt-2">
              <form 
                onSubmit={handleSubmit} 
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0"
              >
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800 placeholder-gray-400 shadow-sm transition-all"
                  placeholder="Enter your e-mail..." 
                  disabled={isLoading}
                  required
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Sending...' : 'Learn More'}
                </button>
              </form>
            </div>
          </div>

          {/* right side */}
          <div className="w-full flex justify-center items-center sm:p-4 mt-6 md:mt-0">
            <img 
              src={heroimg}
              className="w-full max-w-[480px] md:max-w-full h-auto rounded-2xl shadow-2xl object-cover transform hover:scale-[1.02] transition-transform duration-300"
              alt="Cryptocurrency IRA Management" 
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
