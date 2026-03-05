// admin/src/pages/inventory/components/StockAdjustmentModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StockAdjustmentModal = ({ isOpen, onClose, onSubmit, product }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    operation: 'set',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [newStock, setNewStock] = useState(0);

  useEffect(() => {
    if (product) {
      setFormData(prev => ({ ...prev, productId: product._id }));
      setNewStock(product.quantity || 0);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Calculate new stock preview
    if (name === 'operation' || name === 'quantity') {
      const quantity = name === 'quantity' ? Number(value) : formData.quantity;
      const operation = name === 'operation' ? value : formData.operation;
      
      let newValue = product?.quantity || 0;
      if (operation === 'set') newValue = quantity;
      else if (operation === 'increase') newValue = product?.quantity + quantity;
      else if (operation === 'decrease') newValue = Math.max(0, product?.quantity - quantity);
      
      setNewStock(newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
          >
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Adjust Stock</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4">
              {product && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className="font-semibold text-gray-900">{product.quantity || 0}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'set', label: 'Set', color: 'blue' },
                      { value: 'increase', label: 'Add', color: 'green' },
                      { value: 'decrease', label: 'Remove', color: 'red' }
                    ].map(option => (
                      <label
                        key={option.value}
                        className={`
                          flex items-center justify-center px-4 py-2 border rounded-lg cursor-pointer transition-all
                          ${formData.operation === option.value
                            ? `bg-${option.color}-50 border-${option.color}-300 text-${option.color}-700`
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="operation"
                          value={option.value}
                          checked={formData.operation === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="e.g., Stock count, Return, Damaged"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-900">New Stock Level:</span>
                    <span className="text-xl font-bold text-indigo-600">{newStock}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Update Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default StockAdjustmentModal;