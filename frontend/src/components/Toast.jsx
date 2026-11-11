import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <FaCheckCircle className="text-emerald-500 shrink-0 text-lg" />,
    error: <FaExclamationCircle className="text-rose-500 shrink-0 text-lg" />,
    info: <FaInfoCircle className="text-blue-500 shrink-0 text-lg" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] animate-fade-in">
      <div className={`flex items-start justify-between p-4 rounded-xl border shadow-lg ${bgStyles[type] || bgStyles.info}`}>
        <div className="flex items-start space-x-3">
          <div className="pt-0.5">{icons[type] || icons.info}</div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close notification"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
