import React, { useState } from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaPaperPlane } from 'react-icons/fa';
import { apiService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';

const ContactPage = ({ onNotify }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accountType: 'Traditional IRA',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setStatusMsg({ type: 'error', text: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setStatusMsg({ type: 'error', text: 'Please include a message describing your inquiry (at least 10 characters).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: `[Account Type: ${formData.accountType}] [Phone: ${formData.phone || 'N/A'}] ${formData.message.trim()}`,
      };

      const res = await apiService.submitContact(payload);
      const successText = res.message || 'Your inquiry has been routed to an IRA specialist. We will contact you within 24 hours.';
      setStatusMsg({ type: 'success', text: successText });
      if (onNotify) onNotify(successText, 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        accountType: 'Traditional IRA',
        message: '',
      });
    } catch (err) {
      const errorText = extractApiErrorMessage(
        err,
        'Unable to send inquiry at this time. Please check your connection or contact us directly.'
      );
      setStatusMsg({ type: 'error', text: errorText });
      if (onNotify) onNotify(errorText, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#f5f8ff] min-h-screen py-10 md:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#1a6fca] font-semibold text-sm sm:text-base uppercase tracking-wider mb-2">
            Contact Penny Wise
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Speak With an IRA Rollover Specialist
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Our qualified retirement advisors are available to guide you through 401(k) rollovers, tax-deferred transfers, and cold custody setups.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          
          {/* Direct Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Phone Support */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <FaPhoneAlt size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Toll-Free Phone</h4>
                <p className="text-sm text-gray-500 mt-0.5">Direct line to compliance & onboarding.</p>
                <a href="tel:18007366994" className="text-base font-bold text-blue-600 hover:underline mt-2 inline-block">
                  1-800-736-6994 (800-PENNY-WISE)
                </a>
              </div>
            </div>

            {/* Email Support */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                <FaEnvelope size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Advisor Email</h4>
                <p className="text-sm text-gray-500 mt-0.5">Written estimates, fee schedules & transfer guides.</p>
                <a href="mailto:support@pennywise.io" className="text-base font-bold text-emerald-600 hover:underline mt-2 inline-block">
                  support@pennywise.io
                </a>
              </div>
            </div>

            {/* Hours & Response Guarantee */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                <FaClock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Hours of Operation</h4>
                <p className="text-sm text-gray-600 mt-1">Monday – Friday: 8:00 AM – 8:00 PM EST</p>
                <p className="text-sm text-gray-600">Saturday: 9:00 AM – 4:00 PM EST</p>
                <p className="text-xs font-semibold text-emerald-600 mt-2">Guaranteed response &lt; 24 business hours</p>
              </div>
            </div>

            {/* Headquarters */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start space-x-4">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                <FaMapMarkerAlt size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Corporate Headquarters</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Penny Wise Financial Technologies, Inc.<br />
                  100 Financial Center Blvd, Suite 1400<br />
                  New York, NY 10005
                </p>
              </div>
            </div>

          </div>

          {/* Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Request an IRA Rollover Consultation</h3>
            <p className="text-sm text-gray-500 mb-8">
              Fill out the details below. Our qualified retirement team will prepare a custom transfer analysis for you.
            </p>

            {statusMsg && (
              <div
                className={`p-4 mb-6 rounded-2xl text-sm font-semibold border ${
                  statusMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Account / Rollover Type
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Traditional IRA">Traditional IRA Rollover</option>
                    <option value="Roth IRA">Roth IRA (Tax-Free Growth)</option>
                    <option value="401(k) Rollover">401(k) / 403(b) Direct Transfer</option>
                    <option value="SEP IRA">SEP IRA (Self-Employed)</option>
                    <option value="General Custody">Standard Crypto Custody / Staking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Message or Specific Inquiries *
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Share details regarding your current custodian, approximate balance, or specific coins you wish to hold..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
                >
                  <FaPaperPlane size={14} />
                  <span>{isSubmitting ? 'Submitting inquiry...' : 'Submit Consultation Request'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;
