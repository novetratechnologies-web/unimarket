// admin/src/pages/inventory/components/DeleteConfirmationModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiAlertTriangle, 
  FiTrash2, 
  FiRefreshCw,
  FiInfo,
  FiPackage,
  FiCopy,
  FiClock,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiHelpCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'single',
  product = null,
  selectedCount = 0,
  selectedProducts = [],
  loading = false,
  error = null
}) => {
  const [reason, setReason] = useState('');
  const [step, setStep] = useState(1); // 1: confirm, 2: processing, 3: complete
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'permanent'
  const [affectedStats, setAffectedStats] = useState({
    variants: 0,
    images: 0,
    inventory: 0,
    value: 0
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setStep(1);
      setDeleteType('soft');
    }
  }, [isOpen]);

  // Calculate affected stats when product changes
  useEffect(() => {
    if (type === 'single' && product) {
      const variants = product.variants?.length || 0;
      const images = product.images?.length || 0;
      const inventory = product.quantity || 0;
      const value = (product.price || 0) * inventory;

      setAffectedStats({ variants, images, inventory, value });
    } else if (type === 'bulk' && selectedProducts.length > 0) {
      // Calculate totals for bulk delete
      const totals = selectedProducts.reduce((acc, p) => ({
        variants: acc.variants + (p.variants?.length || 0),
        images: acc.images + (p.images?.length || 0),
        inventory: acc.inventory + (p.quantity || 0),
        value: acc.value + ((p.price || 0) * (p.quantity || 0))
      }), { variants: 0, images: 0, inventory: 0, value: 0 });

      setAffectedStats(totals);
    }
  }, [product, selectedProducts, type]);

  const handleConfirm = async () => {
    setStep(2);
    try {
      await onConfirm({ reason, permanent: deleteType === 'permanent' });
      setStep(3);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setStep(1);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const getTitle = () => {
    if (step === 2) return 'Deleting...';
    if (step === 3) return 'Delete Complete';
    if (type === 'single') return 'Delete Product';
    return `Delete ${selectedCount} Products`;
  };

  const getMessage = () => {
    if (step === 2) return 'Please wait while we process your request';
    if (step === 3) return 'Items have been successfully deleted';
    if (type === 'single' && product) {
      return `Are you sure you want to delete "${product.name}"?`;
    }
    return `Are you sure you want to delete ${selectedCount} products?`;
  };

  const getWarningMessage = () => {
    if (type === 'single' && product) {
      if (product.quantity > 0) {
        return `This product has ${product.quantity} items in stock worth ${formatCurrency(affectedStats.value)}.`;
      }
      if (product.variants?.length > 0) {
        return `This product has ${product.variants.length} variants that will also be deleted.`;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] overflow-y-auto">
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
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${
              step === 3 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
            } px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                    {step === 3 ? (
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <FiAlertTriangle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
                    <p className="text-sm text-white/80 mt-1">{getMessage()}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={step === 2}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Progress Steps */}
              {step > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                        s <= step ? 'bg-white text-red-600' : 'bg-white/20 text-white'
                      }`}>
                        {s < step ? (
                          <FiCheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{s}</span>
                        )}
                      </div>
                      {s < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          s < step ? 'bg-white' : 'bg-white/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {step === 1 && (
                <>
                  {/* Warning Message */}
                  {getWarningMessage() && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                      <FiInfo className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">{getWarningMessage()}</p>
                    </div>
                  )}

                  {/* Affected Items Summary */}
                  {(affectedStats.variants > 0 || affectedStats.images > 0 || affectedStats.inventory > 0) && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        This will also delete:
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {affectedStats.variants > 0 && (
                          <div className="flex items-center text-sm">
                            <FiCopy className="w-4 h-4 text-purple-500 mr-2" />
                            <span className="text-gray-600">{affectedStats.variants} variants</span>
                          </div>
                        )}
                        {affectedStats.images > 0 && (
                          <div className="flex items-center text-sm">
                            <FiPackage className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-gray-600">{affectedStats.images} images</span>
                          </div>
                        )}
                        {affectedStats.inventory > 0 && (
                          <div className="flex items-center text-sm">
                            <FiClock className="w-4 h-4 text-amber-500 mr-2" />
                            <span className="text-gray-600">{affectedStats.inventory} units in stock</span>
                          </div>
                        )}
                        {affectedStats.value > 0 && (
                          <div className="flex items-center text-sm">
                            <FiDollarSign className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-gray-600">Worth {formatCurrency(affectedStats.value)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delete Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Delete Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeleteType('soft')}
                        className={`p-3 border rounded-xl text-left transition-all ${
                          deleteType === 'soft'
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <FiTrash2 className={`w-4 h-4 mr-2 ${
                            deleteType === 'soft' ? 'text-red-600' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            deleteType === 'soft' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            Soft Delete
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Move to trash. Can be restored later.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteType('permanent')}
                        className={`p-3 border rounded-xl text-left transition-all ${
                          deleteType === 'permanent'
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <FiAlertCircle className={`w-4 h-4 mr-2 ${
                            deleteType === 'permanent' ? 'text-red-600' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            deleteType === 'permanent' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            Permanent Delete
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Permanently remove. Cannot be undone.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Reason Input */}
                  <div className="mb-4">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Discontinued, Out of stock, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      disabled={loading}
                    />
                  </div>

                  {/* Stats for bulk delete */}
                  {type === 'bulk' && selectedCount > 0 && (
                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
                        <FiInfo className="w-4 h-4 mr-2" />
                        Bulk Delete Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-indigo-600 mb-1">Products</p>
                          <p className="text-lg font-bold text-indigo-900">{selectedCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 mb-1">Total Value</p>
                          <p className="text-lg font-bold text-indigo-900">{formatCurrency(affectedStats.value)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 mb-1">Total Stock</p>
                          <p className="text-lg font-bold text-indigo-900">{affectedStats.inventory} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 mb-1">Variants</p>
                          <p className="text-lg font-bold text-indigo-900">{affectedStats.variants}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Processing */}
              {step === 2 && (
                <div className="py-8 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiTrash2 className="w-8 h-8 text-red-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-6 mb-2">
                    Deleting {type === 'single' ? 'product' : 'products'}...
                  </p>
                  <p className="text-xs text-gray-500">
                    Please wait while we process your request
                  </p>
                  <div className="mt-6 w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'linear' }}
                      className="h-full bg-red-600 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Complete */}
              {step === 3 && (
                <div className="py-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Successfully Deleted!</h4>
                  <p className="text-sm text-gray-500 mb-6">
                    {type === 'single' 
                      ? `"${product?.name}" has been deleted.`
                      : `${selectedCount} products have been deleted.`
                    }
                  </p>
                  <div className="bg-green-50 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-green-600">Delete type:</span>
                      <span className="font-medium text-green-900 capitalize">{deleteType}</span>
                    </div>
                    {reason && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Reason:</span>
                        <span className="font-medium text-green-900">{reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && step === 1 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <FiAlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                {step === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
                    >
                      {loading ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Confirm Delete
                        </>
                      )}
                    </button>
                  </>
                )}
                {step === 3 && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;