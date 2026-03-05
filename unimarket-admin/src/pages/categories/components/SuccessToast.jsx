// admin/src/pages/categories/components/SuccessToast.jsx
import React, { useEffect } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';

const SuccessToast = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiCheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-green-800">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex text-green-600 hover:text-green-800 focus:outline-none"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast;