// admin/src/pages/inventory/components/InventoryCards.jsx
import React, { useState } from 'react';
import {
  FiEdit2,
  FiEye,
  FiTrash2,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiDollarSign,
  FiBox,
  FiUsers,
  FiTag,
  FiMoreVertical,
  FiCopy,
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryCards = ({
  products,
  selectedProducts,
  onSelectProduct,
  onView,
  onEdit,
  onDelete,
  onStockAdjust,
  onDuplicate,
  onRefresh
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Format currency in KES
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-KE').format(value || 0);
  };

  const getStockStatus = (product) => {
    const quantity = product.quantity || 0;
    const threshold = product.lowStockThreshold || 5;
    const reserved = product.reservedQuantity || 0;
    const available = quantity - reserved;

    if (quantity <= 0) {
      return {
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
        border: 'border-red-200',
        hover: 'hover:bg-red-50',
        icon: FiAlertCircle,
        severity: 'critical',
        progress: 0,
        description: 'No items available'
      };
    }
    if (quantity <= threshold) {
      return {
        label: 'Low Stock',
        color: 'bg-amber-100 text-amber-800',
        border: 'border-amber-200',
        hover: 'hover:bg-amber-50',
        icon: FiAlertCircle,
        severity: 'warning',
        progress: (quantity / threshold) * 100,
        description: `Below threshold of ${threshold}`
      };
    }
    if (product.allowBackorder) {
      return {
        label: 'Backorder',
        color: 'bg-purple-100 text-purple-800',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-50',
        icon: FiClock,
        severity: 'info',
        progress: 100,
        description: 'Available on backorder'
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      border: 'border-green-200',
      hover: 'hover:bg-green-50',
      icon: FiCheckCircle,
      severity: 'success',
      progress: 100,
      description: 'In stock and available'
    };
  };

  const getProgressColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-purple-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const calculateStockHealth = (product) => {
    const quantity = product.quantity || 0;
    const reserved = product.reservedQuantity || 0;
    const threshold = product.lowStockThreshold || 5;
    const available = quantity - reserved;
    
    if (quantity === 0) return 0;
    if (quantity <= threshold) return 30;
    if (available < threshold) return 60;
    return 100;
  };

  const toggleExpand = (productId) => {
    setExpandedCard(expandedCard === productId ? null : productId);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
  };

  if (products.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300"
      >
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiPackage className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Get started by adding your first product to the inventory
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const status = getStockStatus(product);
        const StatusIcon = status.icon;
        const available = (product.quantity || 0) - (product.reservedQuantity || 0);
        const value = (product.price || 0) * (product.quantity || 0);
        const cost = (product.cost || 0) * (product.quantity || 0);
        const profit = value - cost;
        const profitMargin = value > 0 ? (profit / value) * 100 : 0;
        const isExpanded = expandedCard === product._id;
        const stockHealth = calculateStockHealth(product);

        return (
          <motion.div
            key={product._id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className={`bg-white rounded-xl shadow-sm border-2 ${status.border} overflow-hidden hover:shadow-lg transition-all duration-300 ${
              selectedProducts.includes(product._id) ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => onSelectProduct(product._id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3 flex-shrink-0"
                  />
                  <div className="relative group">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {product.images?.[0]?.thumbnailUrl ? (
                        <img
                          src={product.images[0].thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiPackage className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    {product.vendor && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white">
                        <FiUsers className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === product._id ? null : product._id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    <AnimatePresence>
                      {showActions === product._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                        >
                          <button
                            onClick={() => {
                              onStockAdjust(product);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center"
                          >
                            <FiTrendingUp className="w-4 h-4 mr-2" />
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => {
                              onView(product);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center"
                          >
                            <FiEye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              onEdit(product._id);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
                          >
                            <FiEdit2 className="w-4 h-4 mr-2" />
                            Edit Product
                          </button>
                          {onDuplicate && (
                            <button
                              onClick={() => {
                                onDuplicate(product._id);
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center"
                            >
                              <FiCopy className="w-4 h-4 mr-2" />
                              Duplicate
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              onDelete(product._id);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              <div className="mt-3" onClick={() => toggleExpand(product._id)}>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono flex items-center">
                  <FiTag className="w-3 h-3 mr-1" />
                  SKU: {product.sku || 'N/A'}
                </p>
                {product.vendor && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <FiUsers className="w-3 h-3 mr-1" />
                    {product.vendor.vendorProfile?.storeName || 'Unknown Vendor'}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Progress Bar */}
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Stock Level</span>
                <span className="font-medium text-gray-700">{product.quantity || 0} units</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(status.severity)} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min((product.quantity || 0) / (product.lowStockThreshold || 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Main Stats */}
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Quantity</p>
                <p className={`text-lg font-semibold ${
                  product.quantity <= 0 ? 'text-red-600' :
                  product.quantity <= (product.lowStockThreshold || 5) ? 'text-amber-600' : 'text-gray-900'
                }`}>
                  {formatNumber(product.quantity)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Reserved</p>
                <p className="text-lg font-semibold text-gray-900">{formatNumber(product.reservedQuantity || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Available</p>
                <p className={`text-lg font-semibold ${available <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatNumber(available)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Threshold</p>
                <p className="text-lg font-semibold text-gray-900">{product.lowStockThreshold || 5}</p>
              </div>
            </div>

            {/* Price & Value */}
            <div className="px-4 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-3">
                <div className="flex items-center text-indigo-600 mb-1">
                  <FiDollarSign className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Price</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</p>
                {product.compareAtPrice && (
                  <p className="text-xs text-gray-500 line-through mt-1">
                    {formatCurrency(product.compareAtPrice)}
                  </p>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-3">
                <div className="flex items-center text-green-600 mb-1">
                  <FiBox className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Stock Value</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(value)}</p>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {/* Cost & Profit */}
                    {product.cost && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cost</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(product.cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Profit per unit</p>
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency((product.price || 0) - (product.cost || 0))}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Wholesale */}
                    {product.wholesalePrice && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Wholesale Price</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(product.wholesalePrice)}</p>
                        <p className="text-xs text-gray-500">Min quantity: {product.minimumWholesaleQuantity || 1}</p>
                      </div>
                    )}

                    {/* Stock Health */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Stock Health</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                            style={{ width: `${stockHealth}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{stockHealth}%</span>
                      </div>
                    </div>

                    {/* Backorder Info */}
                    {product.allowBackorder && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-700 flex items-center">
                          <FiClock className="w-3 h-3 mr-1" />
                          Backorder allowed
                        </p>
                        {product.backorderLimit > 0 && (
                          <p className="text-xs text-purple-600 mt-1">
                            Limit: {product.backorderLimit} units
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex justify-between items-center">
              <button
                onClick={() => toggleExpand(product._id)}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <FiInfo className="w-3 h-3 mr-1" />
                {isExpanded ? 'Show less' : 'Show details'}
              </button>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => onStockAdjust(product)}
                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors group relative"
                  title="Adjust Stock"
                >
                  <FiTrendingUp className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Adjust Stock
                  </span>
                </button>
                <button
                  onClick={() => onView(product)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors group relative"
                  title="View Details"
                >
                  <FiEye className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    View Details
                  </span>
                </button>
                <button
                  onClick={() => onEdit(product._id)}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors group relative"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Edit Product
                  </span>
                </button>
                <button
                  onClick={() => onDelete(product._id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors group relative"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Delete Product
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InventoryCards;