// admin/src/pages/inventory/components/InventoryTable.jsx
import React, { useState } from 'react';
import {
  FiEdit2,
  FiEye,
  FiTrash2,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMoreVertical,
  FiChevronDown,
  FiTrendingUp,
  FiRefreshCw,
  FiDollarSign,
  FiBox,
  FiTag,
  FiUsers,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiUpload,
  FiSettings,
  FiCopy,
  FiArchive,
  FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryTable = ({
  products,
  selectedProducts,
  onSelectAll,
  onSelectProduct,
  onView,
  onEdit,
  onDelete,
  onStockAdjust,
  onBulkUpdate,
  onBulkDelete,
  onExport,
  loading = false
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [showActions, setShowActions] = useState(null);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
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
        icon: FiAlertCircle,
        progress: 0,
        severity: 'critical'
      };
    }
    if (quantity <= threshold) {
      return {
        label: 'Low Stock',
        color: 'bg-amber-100 text-amber-800',
        border: 'border-amber-200',
        icon: FiAlertCircle,
        progress: (quantity / threshold) * 100,
        severity: 'warning'
      };
    }
    if (product.allowBackorder) {
      return {
        label: 'Backorder',
        color: 'bg-purple-100 text-purple-800',
        border: 'border-purple-200',
        icon: FiClock,
        progress: 100,
        severity: 'info'
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      border: 'border-green-200',
      icon: FiCheckCircle,
      progress: 100,
      severity: 'success'
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

  const toggleRowExpand = (productId) => {
    setExpandedRow(expandedRow === productId ? null : productId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <FiRefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-indigo-900">
              {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onBulkUpdate?.('price')}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
            >
              <FiDollarSign className="w-3 h-3 mr-1" />
              Update Price
            </button>
            <button
              onClick={() => onBulkUpdate?.('quantity')}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
            >
              <FiBox className="w-3 h-3 mr-1" />
              Update Stock
            </button>
            <button
              onClick={() => onBulkUpdate?.('status')}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
            >
              <FiTag className="w-3 h-3 mr-1" />
              Update Status
            </button>
            <button
              onClick={onBulkDelete}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors flex items-center"
            >
              <FiTrash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
            <button
              onClick={() => onExport?.('selected')}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <FiDownload className="w-3 h-3 mr-1" />
              Export
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const status = getStockStatus(product);
              const StatusIcon = status.icon;
              const available = (product.quantity || 0) - (product.reservedQuantity || 0);
              const value = (product.price || 0) * (product.quantity || 0);
              const isExpanded = expandedRow === product._id;

              return (
                <React.Fragment key={product._id}>
                  <tr 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedProducts.includes(product._id) ? 'bg-indigo-50/50' : ''
                    }`}
                    onClick={() => toggleRowExpand(product._id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => onSelectProduct(product._id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          {product.images?.[0]?.thumbnailUrl ? (
                            <img
                              src={product.images[0].thumbnailUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <FiPackage className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {product._id.slice(-8)}
                          </div>
                          {product.vendor && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <FiUsers className="w-3 h-3 mr-1" />
                              {product.vendor.vendorProfile?.storeName || 'Unknown Vendor'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {product.sku || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          product.quantity <= 0 ? 'text-red-600' :
                          product.quantity <= (product.lowStockThreshold || 5) ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {formatNumber(product.quantity)}
                        </span>
                        {product.quantity > 0 && (
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor(status.severity)} rounded-full`}
                              style={{ width: `${Math.min((product.quantity / (product.lowStockThreshold || 5)) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatNumber(product.reservedQuantity || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        available <= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatNumber(available)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatCurrency(value)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{product.lowStockThreshold || 5}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onStockAdjust(product)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors relative group"
                          title="Adjust Stock"
                        >
                          <FiTrendingUp className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Adjust Stock
                          </span>
                        </button>
                        <button
                          onClick={() => onView(product)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors relative group"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            View Details
                          </span>
                        </button>
                        <button
                          onClick={() => onEdit(product._id)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors relative group"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Edit Product
                          </span>
                        </button>
                        <button
                          onClick={() => onDelete(product._id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors relative group"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Delete Product
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <tr>
                        <td colSpan="11" className="px-6 py-4 bg-gray-50">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-4 gap-4"
                          >
                            {/* Product Details */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Product Details
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Created</dt>
                                  <dd className="text-gray-900">
                                    {new Date(product.createdAt).toLocaleDateString()}
                                  </dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Updated</dt>
                                  <dd className="text-gray-900">
                                    {new Date(product.updatedAt).toLocaleDateString()}
                                  </dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Status</dt>
                                  <dd className="text-gray-900 capitalize">{product.status}</dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Type</dt>
                                  <dd className="text-gray-900 capitalize">{product.type}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Inventory Details */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Inventory Details
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Track Quantity</dt>
                                  <dd className="text-gray-900">
                                    {product.trackQuantity ? 'Yes' : 'No'}
                                  </dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Backorder</dt>
                                  <dd className="text-gray-900">
                                    {product.allowBackorder ? 'Allowed' : 'Not Allowed'}
                                  </dd>
                                </div>
                                {product.allowBackorder && (
                                  <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Backorder Limit</dt>
                                    <dd className="text-gray-900">{product.backorderLimit || 'Unlimited'}</dd>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Reorder Point</dt>
                                  <dd className="text-gray-900">{product.reorderPoint || 'Not set'}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Pricing Details */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Pricing Details
                              </h4>
                              <dl className="space-y-2">
                                {product.cost && (
                                  <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Cost</dt>
                                    <dd className="text-gray-900">{formatCurrency(product.cost)}</dd>
                                  </div>
                                )}
                                {product.wholesalePrice && (
                                  <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Wholesale</dt>
                                    <dd className="text-gray-900">{formatCurrency(product.wholesalePrice)}</dd>
                                  </div>
                                )}
                                {product.cost && product.price && (
                                  <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Profit</dt>
                                    <dd className="text-green-600 font-medium">
                                      {formatCurrency(product.price - product.cost)}
                                    </dd>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <dt className="text-gray-500">Currency</dt>
                                  <dd className="text-gray-900">{product.currency || 'USD'}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Quick Actions
                              </h4>
                              <div className="space-y-2">
                                <button
                                  onClick={() => onStockAdjust(product)}
                                  className="w-full px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center"
                                >
                                  <FiTrendingUp className="w-3 h-3 mr-2" />
                                  Adjust Stock
                                </button>
                                <button
                                  onClick={() => onEdit(product._id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                                >
                                  <FiEdit2 className="w-3 h-3 mr-2" />
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => onDelete(product._id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                                >
                                  <FiTrash2 className="w-3 h-3 mr-2" />
                                  Delete Product
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-sm text-gray-500 mb-6">
            Get started by adding your first product to the inventory
          </p>
          <button
            onClick={() => window.location.href = '/products/create'}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <FiPackage className="w-4 h-4 mr-2" />
            Add New Product
          </button>
        </div>
      )}

      {/* Table Footer */}
      {products.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {products.length} of {products.length} products
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onExport?.('all')}
                className="flex items-center hover:text-indigo-600 transition-colors"
              >
                <FiDownload className="w-4 h-4 mr-1" />
                Export All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;