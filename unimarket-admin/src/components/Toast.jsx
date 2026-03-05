// admin/src/components/Toast.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiX,
  FiAlertTriangle 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
};

const Toast = ({ 
  message, 
  type = 'success', 
  duration = 5000, 
  onClose,
  position = 'top-right'
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, onClose]);

  const icons = {
    success: <FiCheckCircle className="w-5 h-5 text-green-500" />,
    error: <FiAlertCircle className="w-5 h-5 text-red-500" />,
    warning: <FiAlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <FiInfo className="w-5 h-5 text-blue-500" />
  };

  const colors = {
    success: 'border-green-500 bg-green-50',
    error: 'border-red-500 bg-red-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50'
  };

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`fixed ${positions[position]} z-500000 min-w-[320px] max-w-md`}
    >
      <div className={`relative rounded-lg border-l-4 shadow-lg ${colors[type]} overflow-hidden`}>
        <div className="flex items-start p-4">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {type === 'success' && 'Success!'}
              {type === 'error' && 'Error!'}
              {type === 'warning' && 'Warning!'}
              {type === 'info' && 'Info'}
            </p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div 
          className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

// Toast Container
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <AnimatePresence>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const toast = {
      id,
      message,
      type: options.type || 'success',
      duration: options.duration || 5000,
      position: options.position || 'top-right'
    };

    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  };

  const error = (message, options = {}) => {
    return showToast(message, { ...options, type: 'error' });
  };

  const warning = (message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  };

  const info = (message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  };

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

export default Toast;