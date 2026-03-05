// admin/src/pages/categories/components/ErrorAlert.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiAlertCircle, 
  FiX, 
  FiInfo, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiRefreshCw,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorAlert = ({ 
  message, 
  onDismiss, 
  autoDismiss = true, 
  duration = 5000,
  type = 'error',
  details = null,
  retry = null,
  showIcon = true,
  showDetails = false,
  className = ''
}) => {
  const [progress, setProgress] = useState(100);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Alert type configurations
  const alertTypes = {
    error: {
      icon: FiAlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600',
      hoverBg: 'hover:bg-red-100',
      focusRing: 'focus:ring-red-500',
      progress: 'bg-red-600'
    },
    warning: {
      icon: FiAlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      hoverBg: 'hover:bg-yellow-100',
      focusRing: 'focus:ring-yellow-500',
      progress: 'bg-yellow-600'
    },
    info: {
      icon: FiInfo,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100',
      focusRing: 'focus:ring-blue-500',
      progress: 'bg-blue-600'
    },
    success: {
      icon: FiCheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600',
      hoverBg: 'hover:bg-green-100',
      focusRing: 'focus:ring-green-500',
      progress: 'bg-green-600'
    }
  };

  const config = alertTypes[type] || alertTypes.error;
  const Icon = config.icon;

  // Progress bar for auto-dismiss
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          onDismiss();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [autoDismiss, duration, onDismiss]);

  // Handle copy to clipboard
  const handleCopy = () => {
    const textToCopy = details || message;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`relative rounded-xl border ${config.bg} ${config.border} overflow-hidden shadow-lg ${className}`}
      role="alert"
    >
      {/* Progress bar */}
      {autoDismiss && onDismiss && (
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 ${config.progress}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          {showIcon && (
            <motion.div 
              className="flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
            >
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </motion.div>
          )}

          {/* Content */}
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${config.text}`}>
              {message}
            </p>
            
            {/* Error Details (if provided) */}
            <AnimatePresence>
              {details && showDetails && expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className={`p-3 rounded-lg ${config.bg} border ${config.border} text-xs font-mono`}>
                    <pre className="whitespace-pre-wrap break-all text-gray-700">
                      {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex items-center space-x-1">
            {/* Details Toggle */}
            {details && showDetails && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpanded(!expanded)}
                className={`p-1.5 rounded-lg ${config.text} ${config.hoverBg} transition-colors`}
                title={expanded ? 'Hide details' : 'Show details'}
              >
                {expanded ? (
                  <FiChevronUp className="h-4 w-4" />
                ) : (
                  <FiChevronDown className="h-4 w-4" />
                )}
              </motion.button>
            )}

            {/* Copy Button */}
            {details && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={`p-1.5 rounded-lg ${config.text} ${config.hoverBg} transition-colors relative`}
                title="Copy error details"
              >
                {copied ? (
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <FiCopy className="h-4 w-4" />
                )}
              </motion.button>
            )}

            {/* Retry Button */}
            {retry && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={retry}
                className={`p-1.5 rounded-lg ${config.text} ${config.hoverBg} transition-colors`}
                title="Retry"
              >
                <FiRefreshCw className="h-4 w-4" />
              </motion.button>
            )}

            {/* Dismiss Button */}
            {onDismiss && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className={`p-1.5 rounded-lg ${config.text} ${config.hoverBg} transition-colors`}
                title="Dismiss"
              >
                <FiX className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Error Alert Container for multiple errors
export const ErrorAlertContainer = ({ errors, onDismiss, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {errors.map((error, index) => (
          <ErrorAlert
            key={error.id || index}
            message={error.message}
            type={error.type || 'error'}
            details={error.details}
            retry={error.retry}
            onDismiss={() => onDismiss(error.id || index)}
            autoDismiss={error.autoDismiss}
            duration={error.duration}
            showDetails={error.showDetails}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Error Toast for temporary notifications
export const ErrorToast = ({ 
  message, 
  type = 'error', 
  duration = 3000, 
  onClose,
  position = 'top-right' 
}) => {
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
      initial={{ opacity: 0, y: -20, x: position.includes('right') ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: position.includes('right') ? 20 : -20 }}
      className={`fixed ${positions[position]} z-50 min-w-[300px] max-w-md`}
    >
      <ErrorAlert
        message={message}
        type={type}
        autoDismiss={true}
        duration={duration}
        onDismiss={onClose}
        showDetails={false}
      />
    </motion.div>
  );
};

// Hook for managing error alerts
export const useErrorAlert = () => {
  const [errors, setErrors] = useState([]);

  const addError = (error) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newError = {
      id,
      message: error.message || error,
      type: error.type || 'error',
      details: error.details,
      retry: error.retry,
      autoDismiss: error.autoDismiss ?? true,
      duration: error.duration || 5000,
      showDetails: error.showDetails ?? true
    };
    setErrors(prev => [...prev, newError]);
    return id;
  };

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors
  };
};

// Example usage component
export const ErrorAlertExample = () => {
  const { errors, addError, removeError } = useErrorAlert();

  const showError = () => {
    addError({
      message: 'Failed to save category',
      type: 'error',
      details: {
        status: 400,
        errors: [
          { field: 'name', message: 'Name is required' },
          { field: 'slug', message: 'Slug must be unique' }
        ]
      },
      retry: () => console.log('Retrying...')
    });
  };

  const showWarning = () => {
    addError({
      message: 'Category name is too long',
      type: 'warning',
      details: 'Maximum length is 100 characters. Current length: 120',
      autoDismiss: false
    });
  };

  const showSuccess = () => {
    addError({
      message: 'Category saved successfully',
      type: 'success',
      duration: 3000
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={showError}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Show Error
        </button>
        <button
          onClick={showWarning}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Show Warning
        </button>
        <button
          onClick={showSuccess}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Show Success
        </button>
      </div>
      
      <ErrorAlertContainer 
        errors={errors} 
        onDismiss={removeError}
        className="max-w-md"
      />
    </div>
  );
};

export default ErrorAlert;