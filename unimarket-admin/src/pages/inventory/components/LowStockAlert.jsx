// admin/src/pages/inventory/components/LowStockAlert.jsx
import React, { useState, useEffect } from 'react';
import {
  FiAlertCircle,
  FiX,
  FiChevronRight,
  FiPackage,
  FiTrendingUp,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const LowStockAlert = ({
  alerts = [],
  onViewProduct,
  onAdjustStock,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleRefresh = async () => {
    setLoading(true);
    if (onRefresh) {
      await onRefresh();
    }
    setLastUpdated(new Date());
    setLoading(false);
  };

  const getAlertColor = (product) => {
    const quantity = product.quantity || 0;
    const threshold = product.lowStockThreshold || 5;
    
    if (quantity === 0) return 'bg-red-50 border-red-200 text-red-800';
    if (quantity <= threshold / 2) return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  };

  const getAlertIcon = (product) => {
    const quantity = product.quantity || 0;
    const threshold = product.lowStockThreshold || 5;
    
    if (quantity === 0) return '🔴';
    if (quantity <= threshold / 2) return '🟠';
    return '🟡';
  };

  const getUrgencyLevel = (product) => {
    const quantity = product.quantity || 0;
    const threshold = product.lowStockThreshold || 5;
    
    if (quantity === 0) return 'Critical';
    if (quantity <= Math.ceil(threshold * 0.3)) return 'High';
    if (quantity <= Math.ceil(threshold * 0.6)) return 'Medium';
    return 'Low';
  };

  const getUrgencyColor = (product) => {
    const quantity = product.quantity || 0;
    const threshold = product.lowStockThreshold || 5;
    
    if (quantity === 0) return 'text-red-600 bg-red-100';
    if (quantity <= Math.ceil(threshold * 0.3)) return 'text-orange-600 bg-orange-100';
    if (quantity <= Math.ceil(threshold * 0.6)) return 'text-amber-600 bg-amber-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  if (!isOpen || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 right-4 z-40 w-96 max-w-full"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <FiAlertCircle className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-red-600 text-xs rounded-full flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white ml-2">Low Stock Alerts</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getAlertColor(alert)}`}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 mr-3">
                    <span className="text-xl">{getAlertIcon(alert)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {alert.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          SKU: {alert.sku || 'N/A'}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getUrgencyColor(alert)}`}>
                        {getUrgencyLevel(alert)}
                      </span>
                    </div>

                    {/* Stock Progress */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Current Stock</span>
                        <span className={`font-medium ${
                          alert.quantity === 0 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {alert.quantity || 0} / {alert.lowStockThreshold || 5}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            alert.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              ((alert.quantity || 0) / (alert.lowStockThreshold || 5)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {alert.vendor && (
                          <span className="text-xs text-gray-500">
                            Vendor: {alert.vendor.vendorProfile?.storeName || alert.vendor.email}
                          </span>
                        )}
                        {alert.reservedQuantity > 0 && (
                          <span className="text-xs text-blue-600">
                            Reserved: {alert.reservedQuantity}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onAdjustStock(alert)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Adjust Stock"
                        >
                          <FiTrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewProduct(alert)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Product"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Reorder Recommendation */}
                    {alert.quantity === 0 && (
                      <div className="mt-3 p-2 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-800 flex items-center">
                          <FiAlertCircle className="w-3 h-3 mr-1" />
                          Out of stock - Reorder immediately
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={() => window.location.href = '/inventory?filter=low-stock'}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <FiChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Minimized State Toggle (when closed) */}
      {!isOpen && alerts.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          <div className="relative">
            <FiAlertCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-xs rounded-full flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          </div>
        </motion.button>
      )}
    </motion.div>
  );
};

export default LowStockAlert;