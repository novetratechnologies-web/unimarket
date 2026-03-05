// admin/src/pages/inventory/components/InventoryAlertsPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  FiBell,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
  FiChevronRight,
  FiPackage,
  FiTrendingUp,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiDollarSign,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiMail,
  FiBellOff,
  FiSettings
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryAlertsPanel = ({
  isOpen = true,
  onClose,
  alerts = [],
  onViewProduct,
  onAdjustStock,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onDismissAll,
  onSettings,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    info: true
  });

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

  // Group alerts by severity
  const groupedAlerts = {
    critical: alerts.filter(a => 
      (a.severity === 'critical' || a.type === 'out_of_stock' || (a.quantity || 0) === 0) &&
      (filter === 'all' || a.type === filter)
    ),
    warning: alerts.filter(a => 
      (a.severity === 'warning' || a.type === 'low_stock' || 
       (a.quantity > 0 && a.quantity <= (a.threshold || 5))) &&
      (filter === 'all' || a.type === filter)
    ),
    info: alerts.filter(a => 
      (a.severity === 'info' || a.type === 'backorder' || a.type === 'pre_order') &&
      (filter === 'all' || a.type === filter)
    )
  };

  // Filter by search term
  const filterBySearch = (alerts) => {
    if (!searchTerm) return alerts;
    return alerts.filter(alert => 
      alert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAlerts = {
    critical: filterBySearch(groupedAlerts.critical),
    warning: filterBySearch(groupedAlerts.warning),
    info: filterBySearch(groupedAlerts.info)
  };

  const totalAlerts = Object.values(filteredAlerts).reduce((sum, arr) => sum + arr.length, 0);

  const getAlertIcon = (alert) => {
    switch (alert.severity || alert.type) {
      case 'critical':
      case 'out_of_stock':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
      case 'low_stock':
        return <FiAlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      case 'backorder':
      case 'pre_order':
        return <FiInfo className="w-5 h-5 text-blue-500" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (alert) => {
    switch (alert.severity || alert.type) {
      case 'critical':
      case 'out_of_stock':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          hover: 'hover:bg-red-100'
        };
      case 'warning':
      case 'low_stock':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          hover: 'hover:bg-amber-100'
        };
      case 'info':
      case 'backorder':
      case 'pre_order':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          hover: 'hover:bg-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          hover: 'hover:bg-gray-100'
        };
    }
  };

  const getUrgencyLevel = (alert) => {
    if (alert.severity === 'critical' || (alert.quantity || 0) === 0) return 'Critical';
    if (alert.severity === 'warning' || alert.quantity <= Math.ceil((alert.threshold || 5) * 0.3)) return 'High';
    if (alert.quantity <= Math.ceil((alert.threshold || 5) * 0.6)) return 'Medium';
    return 'Low';
  };

  const getUrgencyColor = (alert) => {
    const urgency = getUrgencyLevel(alert);
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderAlertSection = (title, alerts, sectionKey, icon, defaultExpanded = true) => {
    if (alerts.length === 0) return null;

    const sectionColors = {
      critical: 'border-red-200 bg-red-50',
      warning: 'border-amber-200 bg-amber-50',
      info: 'border-blue-200 bg-blue-50'
    };

    return (
      <div className={`mb-4 rounded-lg border ${sectionColors[sectionKey]} overflow-hidden`}>
        {/* Section Header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full px-4 py-3 flex items-center justify-between ${sectionColors[sectionKey]} hover:bg-opacity-80 transition-colors`}
        >
          <div className="flex items-center">
            {icon}
            <span className="text-sm font-medium ml-2">{title}</span>
            <span className="ml-2 px-2 py-0.5 text-xs bg-white rounded-full">
              {alerts.length}
            </span>
          </div>
          <motion.div
            animate={{ rotate: expandedSections[sectionKey] ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronRight className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Section Content */}
        <AnimatePresence>
          {expandedSections[sectionKey] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {alerts.map((alert, index) => {
                const colors = getAlertColor(alert);
                return (
                  <motion.div
                    key={alert._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border-t ${colors.border} ${colors.bg} ${colors.hover} transition-colors cursor-pointer`}
                    onClick={() => setSelectedAlert(selectedAlert === alert._id ? null : alert._id)}
                  >
                    <div className="flex items-start">
                      {/* Icon */}
                      <div className="flex-shrink-0 mr-3">
                        {getAlertIcon(alert)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-1">
                              {alert.name}
                            </h5>
                            <p className="text-xs text-gray-500 mb-2">
                              SKU: {alert.sku || 'N/A'}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getUrgencyColor(alert)}`}>
                            {getUrgencyLevel(alert)}
                          </span>
                        </div>

                        {/* Progress Bar for Stock */}
                        {alert.quantity !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600">Stock Level</span>
                              <span className={colors.text}>
                                {alert.quantity || 0} / {alert.threshold || 5}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  alert.severity === 'critical' || alert.quantity === 0
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    ((alert.quantity || 0) / (alert.threshold || 5)) * 100,
                                    100
                                  )}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {alert.vendor && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Vendor:</span>{' '}
                              {alert.vendor.vendorProfile?.storeName || alert.vendor.email}
                            </div>
                          )}
                          {alert.reservedQuantity > 0 && (
                            <div className="text-xs text-blue-600">
                              <span className="font-medium">Reserved:</span> {alert.reservedQuantity}
                            </div>
                          )}
                          {alert.backorderLimit > 0 && (
                            <div className="text-xs text-purple-600">
                              <span className="font-medium">Backorder:</span> {alert.backorderedQuantity || 0}/{alert.backorderLimit}
                            </div>
                          )}
                          {alert.price && (
                            <div className="text-xs text-green-600">
                              <span className="font-medium">Price:</span> ${alert.price}
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedAlert === alert._id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Product ID</p>
                                  <p className="text-xs font-mono text-gray-900">{alert._id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Category</p>
                                  <p className="text-xs text-gray-900">
                                    {alert.category?.name || 'Uncategorized'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                                  <p className="text-xs text-gray-900">
                                    {new Date(alert.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Total Sold</p>
                                  <p className="text-xs text-gray-900">
                                    {alert.sales?.totalQuantity || 0} units
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdjustStock(alert);
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Adjust Stock"
                            >
                              <FiTrendingUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProduct(alert);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View Product"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead?.(alert._id);
                              }}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                              title="Mark as Read"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismiss?.(alert._id);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Dismiss"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTime(alert.createdAt || alert.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            <FiBell className="w-6 h-6 text-white" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-white ml-3">Inventory Alerts</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="backorder">Backorder</option>
              <option value="pre_order">Pre-Order</option>
            </select>
            <button
              onClick={() => setFilter('all')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear Filter"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mark All as Read"
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onDismissAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dismiss All"
            >
              <FiBellOff className="w-4 h-4" />
            </button>
            <button
              onClick={onSettings}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Alert Settings"
            >
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <span className="text-xs text-red-600">Critical</span>
            <p className="text-lg font-bold text-red-700">{filteredAlerts.critical.length}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <span className="text-xs text-amber-600">Warning</span>
            <p className="text-lg font-bold text-amber-700">{filteredAlerts.warning.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <span className="text-xs text-blue-600">Info</span>
            <p className="text-lg font-bold text-blue-700">{filteredAlerts.info.length}</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalAlerts === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-xs text-gray-500">No inventory alerts at this time</p>
            </div>
          </div>
        ) : (
          <>
            {renderAlertSection(
              'Critical Alerts',
              filteredAlerts.critical,
              'critical',
              <FiAlertCircle className="w-4 h-4 text-red-500" />
            )}
            {renderAlertSection(
              'Warnings',
              filteredAlerts.warning,
              'warning',
              <FiAlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            {renderAlertSection(
              'Information',
              filteredAlerts.info,
              'info',
              <FiInfo className="w-4 h-4 text-blue-500" />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <FiClock className="w-3 h-3 mr-1" />
            <span>Updated {formatTime(lastUpdated)}</span>
          </div>
          <div className="flex items-center">
            <FiShoppingBag className="w-3 h-3 mr-1" />
            <span>{alerts.length} total alerts</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryAlertsPanel;