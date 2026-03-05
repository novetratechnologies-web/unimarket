// admin/src/pages/inventory/components/ProductDetailModal.jsx
import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiTag,
  FiUsers,
  FiShoppingBag,
  FiCalendar,
  FiBarChart2,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiCopy,
  FiDownload,
  FiPrinter,
  FiStar,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiImage,
  FiVideo,
  FiFile,
  FiMapPin,
  FiTruck,
  FiShield,
  FiAward
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onStockAdjust,
  onDelete,
  onDuplicate,
  onExport,
  onPrint
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiEye },
    { id: 'inventory', name: 'Inventory', icon: FiPackage },
    { id: 'pricing', name: 'Pricing', icon: FiDollarSign },
    { id: 'media', name: 'Media', icon: FiImage },
    { id: 'variants', name: 'Variants', icon: FiGrid },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart2 },
    { id: 'shipping', name: 'Shipping', icon: FiTruck }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = () => {
    if (product.quantity <= 0) {
      return {
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
        icon: FiAlertCircle
      };
    }
    if (product.quantity <= (product.lowStockThreshold || 5)) {
      return {
        label: 'Low Stock',
        color: 'bg-amber-100 text-amber-800',
        icon: FiAlertCircle
      };
    }
    if (product.allowBackorder) {
      return {
        label: 'Backorder',
        color: 'bg-purple-100 text-purple-800',
        icon: FiClock
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      icon: FiCheckCircle
    };
  };

  const status = getStockStatus();
  const StatusIcon = status.icon;

  const overviewStats = [
    {
      label: 'Total Quantity',
      value: product.quantity || 0,
      icon: FiPackage,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    {
      label: 'Reserved',
      value: product.reservedQuantity || 0,
      icon: FiClock,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    },
    {
      label: 'Available',
      value: (product.quantity || 0) - (product.reservedQuantity || 0),
      icon: FiCheckCircle,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600'
    },
    {
      label: 'Price',
      value: formatCurrency(product.price),
      icon: FiDollarSign,
      color: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl w-full"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    {product.images?.[0]?.thumbnailUrl ? (
                      <img
                        src={product.images[0].thumbnailUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <FiPackage className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{product.name}</h2>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-xs text-white/80">SKU: {product.sku || 'N/A'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                {overviewStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mr-2`}>
                          <Icon className={`w-4 h-4 ${stat.text}`} />
                        </div>
                        <div>
                          <p className="text-xs text-white/80">{stat.label}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6 overflow-x-auto">
              <nav className="flex -mb-px space-x-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap
                        transition-colors
                        ${isActive
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Product ID</dt>
                          <dd className="text-xs font-mono text-gray-900">{product._id}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Slug</dt>
                          <dd className="text-xs text-gray-900">{product.slug || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Type</dt>
                          <dd className="text-xs text-gray-900 capitalize">{product.type || 'simple'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Status</dt>
                          <dd className="text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.status === 'active' ? 'bg-green-100 text-green-800' :
                              product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status}
                            </span>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Visibility</dt>
                          <dd className="text-xs text-gray-900 capitalize">{product.visibility || 'public'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Dates</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Created</dt>
                          <dd className="text-xs text-gray-900">{formatDate(product.createdAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Updated</dt>
                          <dd className="text-xs text-gray-900">{formatDate(product.updatedAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Published</dt>
                          <dd className="text-xs text-gray-900">{formatDate(product.publishedAt)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Description</h3>
                    <p className="text-sm text-gray-600">{product.description || 'No description provided.'}</p>
                    {product.shortDescription && (
                      <>
                        <h4 className="text-xs font-medium text-gray-700 mt-3 mb-2">Short Description</h4>
                        <p className="text-sm text-gray-600">{product.shortDescription}</p>
                      </>
                    )}
                  </div>

                  {/* Highlights */}
                  {product.highlights?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Highlights</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {product.highlights.map((highlight, index) => (
                          <li key={index} className="text-sm text-gray-600">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Specifications */}
                  {product.specifications?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Specifications</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        {product.specifications.map((spec, index) => (
                          <div key={index} className="flex justify-between border-b border-gray-200 pb-2">
                            <dt className="text-xs text-gray-500">{spec.name}</dt>
                            <dd className="text-xs text-gray-900">
                              {spec.value} {spec.unit}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Categories & Tags */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                      {product.categories?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.categories.map((cat, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg"
                            >
                              {cat.name || cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No categories assigned</p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                      {product.tags?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tags</p>
                      )}
                    </div>
                  </div>

                  {/* Brand & Manufacturer */}
                  {(product.brand || product.brandName || product.manufacturer?.name) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Brand & Manufacturer</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        {product.brand && (
                          <div>
                            <dt className="text-xs text-gray-500">Brand ID</dt>
                            <dd className="text-xs text-gray-900">{product.brand}</dd>
                          </div>
                        )}
                        {product.brandName && (
                          <div>
                            <dt className="text-xs text-gray-500">Brand Name</dt>
                            <dd className="text-xs text-gray-900">{product.brandName}</dd>
                          </div>
                        )}
                        {product.manufacturer?.name && (
                          <div>
                            <dt className="text-xs text-gray-500">Manufacturer</dt>
                            <dd className="text-xs text-gray-900">{product.manufacturer.name}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Stock Levels */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-600 mb-1">Quantity</p>
                      <p className="text-2xl font-bold text-blue-700">{product.quantity || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-xs text-amber-600 mb-1">Reserved</p>
                      <p className="text-2xl font-bold text-amber-700">{product.reservedQuantity || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-600 mb-1">Available</p>
                      <p className="text-2xl font-bold text-green-700">
                        {(product.quantity || 0) - (product.reservedQuantity || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-xs text-purple-600 mb-1">Threshold</p>
                      <p className="text-2xl font-bold text-purple-700">{product.lowStockThreshold || 5}</p>
                    </div>
                  </div>

                  {/* Stock Settings */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Settings</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs text-gray-500">Track Quantity</dt>
                        <dd className="text-sm text-gray-900">{product.trackQuantity ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Allow Backorder</dt>
                        <dd className="text-sm text-gray-900">{product.allowBackorder ? 'Yes' : 'No'}</dd>
                      </div>
                      {product.allowBackorder && (
                        <>
                          <div>
                            <dt className="text-xs text-gray-500">Backorder Limit</dt>
                            <dd className="text-sm text-gray-900">{product.backorderLimit || 0}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Backordered Qty</dt>
                            <dd className="text-sm text-gray-900">{product.backorderedQuantity || 0}</dd>
                          </div>
                        </>
                      )}
                      <div>
                        <dt className="text-xs text-gray-500">Inventory Method</dt>
                        <dd className="text-sm text-gray-900 capitalize">{product.inventoryTrackingMethod || 'continuous'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Safety Stock</dt>
                        <dd className="text-sm text-gray-900">{product.safetyStock || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Reorder Point</dt>
                        <dd className="text-sm text-gray-900">{product.reorderPoint || 'Not set'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Inventory Alerts */}
                  {product.inventoryAlerts && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Inventory Alerts</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs text-gray-500">Enabled</dt>
                          <dd className="text-sm text-gray-900">{product.inventoryAlerts.enabled ? 'Yes' : 'No'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Email Notifications</dt>
                          <dd className="text-sm text-gray-900">{product.inventoryAlerts.emailNotifications ? 'Yes' : 'No'}</dd>
                        </div>
                        {product.inventoryAlerts.thresholds?.length > 0 && (
                          <div className="col-span-2">
                            <dt className="text-xs text-gray-500">Alert Thresholds</dt>
                            <dd className="text-sm text-gray-900">
                              {product.inventoryAlerts.thresholds.join(', ')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Warehouses */}
                  {product.warehouses?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Warehouse Distribution</h3>
                      <div className="space-y-3">
                        {product.warehouses.map((wh, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {wh.warehouse?.name || `Warehouse ${index + 1}`}
                              </p>
                              {wh.location && (
                                <p className="text-xs text-gray-500">
                                  {wh.location.aisle && `Aisle ${wh.location.aisle}`}
                                  {wh.location.shelf && `, Shelf ${wh.location.shelf}`}
                                  {wh.location.bin && `, Bin ${wh.location.bin}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{wh.quantity || 0} units</p>
                              {wh.reservedQuantity > 0 && (
                                <p className="text-xs text-amber-600">{wh.reservedQuantity} reserved</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  {/* Price Overview */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-xs text-indigo-600 mb-1">Regular Price</p>
                      <p className="text-2xl font-bold text-indigo-700">{formatCurrency(product.price)}</p>
                    </div>
                    {product.compareAtPrice && (
                      <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-xs text-amber-600 mb-1">Compare at Price</p>
                        <p className="text-2xl font-bold text-amber-700">{formatCurrency(product.compareAtPrice)}</p>
                      </div>
                    )}
                    {product.cost && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-green-600 mb-1">Cost</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(product.cost)}</p>
                      </div>
                    )}
                  </div>

                  {/* Profit Margins */}
                  {(product.price && product.cost) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Profit</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(product.price - product.cost)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Margin</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(((product.price - product.cost) / product.price) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Wholesale */}
                  {product.wholesalePrice && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Wholesale</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs text-gray-500">Wholesale Price</dt>
                          <dd className="text-sm text-gray-900">{formatCurrency(product.wholesalePrice)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Min Quantity</dt>
                          <dd className="text-sm text-gray-900">{product.minimumWholesaleQuantity || 1}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Bulk Pricing */}
                  {product.bulkPricing?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Bulk Pricing</h3>
                      <div className="space-y-2">
                        {product.bulkPricing.map((tier, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <span className="text-sm text-gray-600">
                              {tier.quantity}+ units
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {tier.discountType === 'percentage' 
                                ? `${tier.price}% off`
                                : formatCurrency(tier.price)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Images */}
                  {product.images?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Images</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {product.images.map((image, index) => (
                          <div
                            key={index}
                            className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              selectedImage === index
                                ? 'border-indigo-500 shadow-lg'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => setSelectedImage(index)}
                          >
                            <img
                              src={image.thumbnailUrl || image.url}
                              alt={image.alt || `Product image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            {image.isPrimary && (
                              <span className="absolute top-2 left-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Selected Image Preview */}
                      {product.images[selectedImage] && (
                        <div className="mt-4">
                          <img
                            src={product.images[selectedImage].largeUrl || product.images[selectedImage].url}
                            alt={product.images[selectedImage].alt || 'Product image'}
                            className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                          />
                          <div className="mt-2 text-sm text-gray-500">
                            {product.images[selectedImage].alt && (
                              <p>Alt: {product.images[selectedImage].alt}</p>
                            )}
                            {product.images[selectedImage].title && (
                              <p>Title: {product.images[selectedImage].title}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Videos */}
                  {product.videos?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Videos</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {product.videos.map((video, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-24 h-24 rounded-lg object-cover"
                                  />
                                ) : (
                                  <FiVideo className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{video.title || 'Untitled'}</h4>
                                <p className="text-xs text-gray-500 mt-1">{video.platform}</p>
                                {video.duration && (
                                  <p className="text-xs text-gray-500 mt-1">Duration: {video.duration}s</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {product.documents?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {product.documents.map((doc, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 flex items-center">
                            <FiFile className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{doc.title || 'Untitled'}</h4>
                              <p className="text-xs text-gray-500">
                                {doc.fileType?.toUpperCase()} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                                {doc.pages && ` • ${doc.pages} pages`}
                              </p>
                            </div>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3D Model */}
                  {product.threeDModel?.url && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">3D Model</h3>
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <FiPackage className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">3D Model Available</p>
                          <p className="text-xs text-gray-500">Format: {product.threeDModel.format || 'Unknown'}</p>
                          {product.threeDModel.isAr && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full mt-1">
                              AR Enabled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div className="space-y-6">
                  {product.hasVariants ? (
                    <>
                      {/* Variant Attributes */}
                      {product.variantAttributes?.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Variant Options</h3>
                          <div className="space-y-3">
                            {product.variantAttributes.map((attr, index) => (
                              <div key={index} className="border-b border-gray-200 pb-3">
                                <p className="text-sm font-medium text-gray-900 mb-2">{attr.name}</p>
                                <div className="flex flex-wrap gap-2">
                                  {attr.values.map((value, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg"
                                    >
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variants List */}
                      {product.variants?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Variants ({product.variants.length})</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {product.variants.map((variant, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{variant.sku}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{variant.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(variant.price)}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`${
                                        variant.quantity <= 0 ? 'text-red-600' : 'text-gray-900'
                                      }`}>
                                        {variant.quantity || 0}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        variant.status === 'active' ? 'bg-green-100 text-green-800' :
                                        variant.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {variant.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FiGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">This product has no variants</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Sales Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-600 mb-1">Total Sold</p>
                      <p className="text-2xl font-bold text-blue-700">{product.sales?.totalQuantity || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-600 mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(product.sales?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-xs text-purple-600 mb-1">Orders</p>
                      <p className="text-2xl font-bold text-purple-700">{product.sales?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-xs text-amber-600 mb-1">Avg Price</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {formatCurrency(product.sales?.averagePrice || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-xs text-indigo-600 mb-1">Views</p>
                      <p className="text-2xl font-bold text-indigo-700">{product.engagement?.views || 0}</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-4">
                      <p className="text-xs text-pink-600 mb-1">Add to Cart</p>
                      <p className="text-2xl font-bold text-pink-700">{product.engagement?.addToCarts || 0}</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4">
                      <p className="text-xs text-cyan-600 mb-1">Wishlist</p>
                      <p className="text-2xl font-bold text-cyan-700">{product.engagement?.wishlistAdds || 0}</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4">
                      <p className="text-xs text-teal-600 mb-1">Shares</p>
                      <p className="text-2xl font-bold text-teal-700">{product.engagement?.shares || 0}</p>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {product.engagement?.views > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Conversion Rate</h3>
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${((product.engagement?.addToCarts || 0) / product.engagement?.views) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {(((product.engagement?.addToCarts || 0) / product.engagement?.views) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  {product.reviews && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Reviews</h3>
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(product.reviews.averageRating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {product.reviews.averageRating?.toFixed(1) || 0} ({product.reviews.totalReviews || 0} reviews)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center">
                            <span className="text-xs text-gray-500 w-8">{rating} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{
                                  width: `${((product.reviews.distribution?.[rating] || 0) / 
                                    (product.reviews.totalReviews || 1)) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12">
                              {product.reviews.distribution?.[rating] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  {/* Shipping Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Dimensions</h3>
                      <dl className="space-y-2">
                        {product.dimensions?.length && (
                          <div className="flex justify-between">
                            <dt className="text-xs text-gray-500">Length</dt>
                            <dd className="text-xs text-gray-900">{product.dimensions.length} {product.dimensions.unit}</dd>
                          </div>
                        )}
                        {product.dimensions?.width && (
                          <div className="flex justify-between">
                            <dt className="text-xs text-gray-500">Width</dt>
                            <dd className="text-xs text-gray-900">{product.dimensions.width} {product.dimensions.unit}</dd>
                          </div>
                        )}
                        {product.dimensions?.height && (
                          <div className="flex justify-between">
                            <dt className="text-xs text-gray-500">Height</dt>
                            <dd className="text-xs text-gray-900">{product.dimensions.height} {product.dimensions.unit}</dd>
                          </div>
                        )}
                        {product.weight && (
                          <div className="flex justify-between">
                            <dt className="text-xs text-gray-500">Weight</dt>
                            <dd className="text-xs text-gray-900">{product.weight} {product.weightUnit}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Shipping Settings</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Requires Shipping</dt>
                          <dd className="text-xs text-gray-900">{product.requiresShipping ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Free Shipping</dt>
                          <dd className="text-xs text-gray-900">{product.freeShipping ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Hazardous</dt>
                          <dd className="text-xs text-gray-900">{product.hazardous ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-xs text-gray-500">Perishable</dt>
                          <dd className="text-xs text-gray-900">{product.perishable ? 'Yes' : 'No'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Shipping Class */}
                  {product.shippingClass && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Shipping Class</h3>
                      <p className="text-sm text-gray-900">{product.shippingClass}</p>
                    </div>
                  )}

                  {/* Estimated Delivery */}
                  {product.estimatedDelivery && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Estimated Delivery</h3>
                      <p className="text-sm text-gray-900">
                        {product.estimatedDelivery.min} - {product.estimatedDelivery.max} {product.estimatedDelivery.unit}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(product._id)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <FiEdit2 className="w-4 h-4 mr-2" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => onStockAdjust(product)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FiPackage className="w-4 h-4 mr-2" />
                    Adjust Stock
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDuplicate?.(product._id)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onExport?.(product)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Export"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPrint?.(product)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Print"
                  >
                    <FiPrinter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                onClick={() => setShowDeleteConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDelete(product._id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ProductDetailModal;