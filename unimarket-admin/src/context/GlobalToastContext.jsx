// admin/src/context/GlobalToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GlobalToastContext = createContext(null);

export const useGlobalToast = () => {
  const context = useContext(GlobalToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within GlobalToastProvider');
  }
  return context;
};

// Toast Component
const Toast = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration > 0 && !isPaused) {
      const interval = 100;
      const step = (interval / toast.duration) * 100;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - step;
          if (newProgress <= 0) {
            clearInterval(timer);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [toast.duration, isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[toast.type] || '•';
  };

  const getTypeStyles = () => {
    const styles = {
      success: 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-gray-800',
      error: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-950/30 dark:to-gray-800',
      warning: 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950/30 dark:to-gray-800',
      info: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-800'
    };
    return styles[toast.type] || styles.info;
  };

  const getIconStyles = () => {
    const styles = {
      success: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
      error: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
      warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
      info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
    };
    return styles[toast.type] || styles.info;
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  const enterAnimations = {
    'top-left': 'animate-slide-in-left',
    'top-right': 'animate-slide-in-right',
    'bottom-left': 'animate-slide-in-left',
    'bottom-right': 'animate-slide-in-right',
    'top-center': 'animate-slide-in-down',
    'bottom-center': 'animate-slide-in-up'
  };

  return (
    <div
      className={`
        fixed ${positionClasses[toast.position] || 'top-4 right-4'}
        w-80 max-w-[calc(100vw-2rem)] 
        rounded-lg shadow-lg 
        ${getTypeStyles()}
        ${isExiting ? 'animate-slide-out' : enterAnimations[toast.position] || 'animate-slide-in-right'}
        transition-all duration-300
        pointer-events-auto
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center 
          text-lg flex-shrink-0
          ${getIconStyles()}
        `}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 break-words">
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-full 
                     text-gray-400 hover:text-gray-600 dark:text-gray-500 
                     dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-gray-400 dark:bg-gray-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  // Group toasts by position
  const groupedToasts = toasts.reduce((groups, toast) => {
    const position = toast.position || 'top-right';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(toast);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className="relative h-full">
          {positionToasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Provider Component
export const GlobalToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
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
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  // Promise-based toast
  const promise = useCallback((promise, messages = {}) => {
    const id = showToast(messages.pending || 'Loading...', {
      type: 'info',
      duration: 0,
      position: 'top-right'
    });

    promise
      .then(() => {
        removeToast(id);
        showToast(messages.success || 'Operation completed', {
          type: 'success'
        });
      })
      .catch((error) => {
        removeToast(id);
        showToast(messages.error || error?.message || 'Operation failed', {
          type: 'error'
        });
      });

    return promise;
  }, [showToast, removeToast]);

  return (
    <GlobalToastContext.Provider 
      value={{ 
        showToast, 
        removeToast, 
        clearAllToasts,
        success, 
        error, 
        warning, 
        info,
        promise 
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </GlobalToastContext.Provider>
  );
};