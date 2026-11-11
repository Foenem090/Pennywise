import React, { useState } from 'react';
import { FaEnvelope, FaClock, FaShieldAlt, FaPaperPlane } from 'react-icons/fa';
import { apiService } from '../services/api';

const Contact = ({ onNotify }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Basic validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setFeedback({ type: 'error', text: 'Please write a message with at least 10 characters.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.submitContact(formData);
      setFeedback({
        type: 'success',
        text: response.message || 'Thank you for your message! Our team will respond within 24 hours.',
      });
      if (onNotify) {
        onNotify(response.message || 'Message sent successfully!', 'success');
      }
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        'Unable to send your message right now. Please check your connection and try again.';
      setFeedback({ type: 'error', text: errorMsg });
      if (onNotify) {
        onNotify(errorMsg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="w-full bg-slate-50 py-16 md:py-24 border-t border-gray-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2">
            Get In Touch
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Speak With an IRA & Crypto Specialist
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Have questions about rolling over a 401(k), tax-deferred crypto custody, or passive rewards? We're here to help.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <FaEnvelope size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Dedicated IRA Support</h4>
                <p className="text-sm text-gray-500 mt-0.5">Direct line to our compliance & rollover advisors.</p>
                <a href="mailto:support@pennywise.io" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-block">
                  support@pennywise.io
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <FaClock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Rapid Response Time</h4>
                <p className="text-sm text-gray-500 mt-0.5">Guaranteed advisor response in under 24 business hours.</p>
                <p className="text-xs font-semibold text-emerald-600 mt-2">Mon - Fri: 8:00 AM – 8:00 PM EST</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <FaShieldAlt size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Institutional Custody</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  100% cold-storage qualified custodian coverage on all self-directed retirement balances.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-3 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Send Us a Direct Message</h3>

            {feedback && (
              <div
                className={`p-4 mb-6 rounded-xl text-sm font-medium border ${
                  feedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800 text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  How can we help? *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your IRA rollover plans or portfolio goals..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-800 text-sm transition-all resize-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
                >
                  <FaPaperPlane size={14} />
                  <span>{isSubmitting ? 'Sending inquiry...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Contact;

