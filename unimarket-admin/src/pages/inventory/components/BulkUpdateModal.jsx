// admin/src/pages/inventory/components/BulkUpdateModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSave, 
  FiRefreshCw, 
  FiDollarSign,
  FiBox,
  FiTag,
  FiPercent,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiSettings,
  FiCalendar,
  FiClock,
  FiUsers
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const BulkUpdateModal = ({ isOpen, onClose, onSubmit, selectedCount }) => {
  const [step, setStep] = useState(1); // 1: configure, 2: preview, 3: processing, 4: complete
  const [formData, setFormData] = useState({
    operation: 'update-price',
    price: '',
    compareAtPrice: '',
    priceAdjustment: {
      type: 'fixed',
      value: '',
      percentage: ''
    },
    quantity: '',
    operationType: 'set',
    status: '',
    vendor: '',
    category: '',
    collection: '',
    tags: [],
    tagInput: '',
    applyToVariants: false,
    applyToChildren: false,
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
    notifyCustomers: false
  });
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        operation: 'update-price',
        price: '',
        compareAtPrice: '',
        priceAdjustment: { type: 'fixed', value: '', percentage: '' },
        quantity: '',
        operationType: 'set',
        status: '',
        vendor: '',
        category: '',
        collection: '',
        tags: [],
        tagInput: '',
        applyToVariants: false,
        applyToChildren: false,
        scheduledDate: '',
        scheduledTime: '',
        reason: '',
        notifyCustomers: false
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePriceAdjustmentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      priceAdjustment: {
        ...prev.priceAdjustment,
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (formData.tagInput && !formData.tags.includes(formData.tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    switch (formData.operation) {
      case 'update-price':
        if (!formData.price && !formData.compareAtPrice && !formData.priceAdjustment.value) {
          newErrors.price = 'At least one price field is required';
        }
        break;
      case 'update-quantity':
        if (!formData.quantity) {
          newErrors.quantity = 'Quantity is required';
        }
        break;
      case 'update-status':
        if (!formData.status) {
          newErrors.status = 'Status is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    
    // Generate preview data
    setPreviewData({
      affectedProducts: selectedCount,
      changes: generateChangeSummary(),
      estimatedTime: '30 seconds',
      warnings: generateWarnings()
    });
    setStep(2);
  };

  const generateChangeSummary = () => {
    const summary = [];
    
    switch (formData.operation) {
      case 'update-price':
        if (formData.price) {
          summary.push(`Set price to KES ${parseFloat(formData.price).toLocaleString()}`);
        }
        if (formData.compareAtPrice) {
          summary.push(`Set compare at price to KES ${parseFloat(formData.compareAtPrice).toLocaleString()}`);
        }
        if (formData.priceAdjustment.value) {
          const type = formData.priceAdjustment.type === 'fixed' ? 'KES' : '%';
          summary.push(`${formData.priceAdjustment.type === 'fixed' ? 'Add' : 'Adjust by'} ${formData.priceAdjustment.value}${type}`);
        }
        break;
      case 'update-quantity':
        summary.push(`${formData.operationType} ${formData.quantity} units`);
        break;
      case 'update-status':
        summary.push(`Set status to "${formData.status}"`);
        break;
    }

    if (formData.reason) {
      summary.push(`Reason: ${formData.reason}`);
    }

    return summary;
  };

  const generateWarnings = () => {
    const warnings = [];
    
    if (formData.operation === 'update-price' && formData.price && formData.price < 0) {
      warnings.push('Price is negative. This might affect profitability.');
    }
    if (formData.operation === 'update-quantity' && formData.operationType === 'decrease' && formData.quantity > 100) {
      warnings.push('Large quantity decrease. This might affect stock availability.');
    }
    if (formData.applyToVariants) {
      warnings.push('Changes will also apply to all variants. This might create inconsistencies.');
    }

    return warnings;
  };

  const handleSubmit = async () => {
    setStep(3);
    setLoading(true);
    
    const data = {
      operation: formData.operation,
      data: {}
    };

    switch (formData.operation) {
      case 'update-price':
        data.data = {
          price: formData.price ? parseFloat(formData.price) : undefined,
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
          priceAdjustment: formData.priceAdjustment.value ? {
            type: formData.priceAdjustment.type,
            value: formData.priceAdjustment.type === 'percentage' 
              ? parseFloat(formData.priceAdjustment.percentage)
              : parseFloat(formData.priceAdjustment.value)
          } : undefined
        };
        break;
      case 'update-quantity':
        data.data = {
          quantity: parseInt(formData.quantity),
          operation: formData.operationType
        };
        break;
      case 'update-status':
        data.data = { status: formData.status };
        break;
    }

    // Add optional fields
    if (formData.applyToVariants) data.data.applyToVariants = true;
    if (formData.reason) data.data.reason = formData.reason;
    if (formData.scheduledDate) {
      data.data.scheduledFor = `${formData.scheduledDate}T${formData.scheduledTime || '00:00'}`;
    }

    try {
      await onSubmit(data);
      setStep(4);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${
              step === 4 ? 'from-green-500 to-green-600' : 'from-indigo-600 to-purple-600'
            } px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                    {step === 4 ? (
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <FiSettings className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {step === 1 && 'Bulk Update Products'}
                      {step === 2 && 'Review Changes'}
                      {step === 3 && 'Updating Products...'}
                      {step === 4 && 'Update Complete!'}
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                      {step === 1 && `Updating ${selectedCount} selected products`}
                      {step === 2 && `Ready to apply changes to ${selectedCount} products`}
                      {step === 3 && 'Please wait while we process your request'}
                      {step === 4 && 'Changes have been applied successfully'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={step === 3}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mt-4 flex items-center justify-between">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                      s <= step ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                    }`}>
                      {s < step ? (
                        <FiCheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{s}</span>
                      )}
                    </div>
                    {s < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        s < step ? 'bg-white' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {/* Step 1: Configure */}
              {step === 1 && (
                <form className="space-y-6">
                  {/* Operation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Operation Type
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'update-price', label: 'Update Price', icon: FiDollarSign, color: 'green' },
                        { value: 'update-quantity', label: 'Update Quantity', icon: FiBox, color: 'blue' },
                        { value: 'update-status', label: 'Update Status', icon: FiTag, color: 'purple' }
                      ].map(({ value, label, icon: Icon, color }) => (
                        <label
                          key={value}
                          className={`
                            flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.operation === value
                              ? `border-${color}-500 bg-${color}-50`
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="operation"
                            value={value}
                            checked={formData.operation === value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            formData.operation === value ? `bg-${color}-100` : 'bg-gray-200'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              formData.operation === value ? `text-${color}-600` : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              formData.operation === value ? `text-${color}-700` : 'text-gray-700'
                            }`}>
                              {label}
                            </p>
                          </div>
                          {formData.operation === value && (
                            <div className={`w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center`}>
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Fields */}
                  {formData.operation === 'update-price' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Price (KES)
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            name="price"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Enter new price"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                              errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors.price && (
                          <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Compare At Price (KES)
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            name="compareAtPrice"
                            min="0"
                            step="0.01"
                            value={formData.compareAtPrice}
                            onChange={handleChange}
                            placeholder="Enter compare at price"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Price Adjustment
                        </label>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handlePriceAdjustmentChange('type', 'fixed')}
                              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                formData.priceAdjustment.type === 'fixed'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Fixed Amount
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePriceAdjustmentChange('type', 'percentage')}
                              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                formData.priceAdjustment.type === 'percentage'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Percentage
                            </button>
                          </div>
                          
                          {formData.priceAdjustment.type === 'fixed' ? (
                            <div className="relative">
                              <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.priceAdjustment.value}
                                onChange={(e) => handlePriceAdjustmentChange('value', e.target.value)}
                                placeholder="Enter amount"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          ) : (
                            <div className="relative">
                              <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.priceAdjustment.percentage}
                                onChange={(e) => handlePriceAdjustmentChange('percentage', e.target.value)}
                                placeholder="Enter percentage"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity Fields */}
                  {formData.operation === 'update-quantity' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Operation
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'set', label: 'Set', icon: FiSettings, color: 'blue' },
                            { value: 'increase', label: 'Add', icon: FiTrendingUp, color: 'green' },
                            { value: 'decrease', label: 'Remove', icon: FiTrendingDown, color: 'red' }
                          ].map(option => (
                            <label
                              key={option.value}
                              className={`
                                flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all
                                ${formData.operationType === option.value
                                  ? `border-${option.color}-500 bg-${option.color}-50`
                                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name="operationType"
                                value={option.value}
                                checked={formData.operationType === option.value}
                                onChange={handleChange}
                                className="sr-only"
                              />
                              <option.icon className={`w-5 h-5 mb-1 ${
                                formData.operationType === option.value ? `text-${option.color}-600` : 'text-gray-500'
                              }`} />
                              <span className={`text-xs font-medium ${
                                formData.operationType === option.value ? `text-${option.color}-700` : 'text-gray-600'
                              }`}>
                                {option.label}
                              </span>
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
                          placeholder="Enter quantity"
                          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                            errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.quantity && (
                          <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Field */}
                  {formData.operation === 'update-status' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                          errors.status ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-xs text-red-600">{errors.status}</p>
                      )}
                    </div>
                  )}

                  {/* Advanced Options Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <FiSettings className="w-4 h-4 mr-1" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </button>

                  {/* Advanced Options */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Apply to Variants */}
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FiBox className="w-4 h-4 text-indigo-600 mr-2" />
                            <span className="text-sm text-gray-700">Apply to variants</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              name="applyToVariants"
                              checked={formData.applyToVariants}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div
                              onClick={() => handleChange({ target: { name: 'applyToVariants', checked: !formData.applyToVariants, type: 'checkbox' } })}
                              className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                                formData.applyToVariants ? 'bg-indigo-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                formData.applyToVariants ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`} />
                            </div>
                          </div>
                        </label>

                        {/* Schedule Update */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                            <FiCalendar className="w-4 h-4 mr-2" />
                            Schedule Update
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              name="scheduledDate"
                              value={formData.scheduledDate}
                              onChange={handleChange}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                              type="time"
                              name="scheduledTime"
                              value={formData.scheduledTime}
                              onChange={handleChange}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        {/* Notify Customers */}
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FiUsers className="w-4 h-4 text-indigo-600 mr-2" />
                            <span className="text-sm text-gray-700">Notify customers</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              name="notifyCustomers"
                              checked={formData.notifyCustomers}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div
                              onClick={() => handleChange({ target: { name: 'notifyCustomers', checked: !formData.notifyCustomers, type: 'checkbox' } })}
                              className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                                formData.notifyCustomers ? 'bg-indigo-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                formData.notifyCustomers ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`} />
                            </div>
                          </div>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="e.g., Seasonal price adjustment"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </form>
              )}

              {/* Step 2: Preview */}
              {step === 2 && previewData && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                    <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
                      <FiInfo className="w-4 h-4 mr-2" />
                      Changes Summary
                    </h4>
                    <ul className="space-y-2">
                      {generateChangeSummary().map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-indigo-700">
                          <FiCheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {previewData.warnings.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                      <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center">
                        <FiAlertCircle className="w-4 h-4 mr-2" />
                        Warnings
                      </h4>
                      <ul className="space-y-2">
                        {previewData.warnings.map((warning, index) => (
                          <li key={index} className="flex items-center text-sm text-amber-700">
                            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Update Details</h4>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs text-gray-500 mb-1">Products Affected</dt>
                        <dd className="text-lg font-bold text-gray-900">{selectedCount}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500 mb-1">Estimated Time</dt>
                        <dd className="text-lg font-bold text-gray-900">{previewData.estimatedTime}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Step 3: Processing */}
              {step === 3 && (
                <div className="py-12 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiSettings className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-6 mb-2">
                    Applying updates to {selectedCount} products...
                  </p>
                  <p className="text-xs text-gray-500">
                    This may take a few moments
                  </p>
                  <div className="mt-6 w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'linear' }}
                      className="h-full bg-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <div className="py-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Update Complete!</h4>
                  <p className="text-sm text-gray-500 mb-6">
                    Successfully updated {selectedCount} products
                  </p>
                  <div className="bg-green-50 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-green-600">Operation:</span>
                      <span className="font-medium text-green-900">
                        {formData.operation === 'update-price' && 'Price Update'}
                        {formData.operation === 'update-quantity' && 'Quantity Update'}
                        {formData.operation === 'update-status' && 'Status Update'}
                      </span>
                    </div>
                    {formData.reason && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Reason:</span>
                        <span className="font-medium text-green-900">{formData.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    ← Back to settings
                  </button>
                )}
                <div className={`flex space-x-3 ${step === 1 ? 'ml-auto' : ''}`}>
                  {step === 1 && (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePreview}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Review Changes
                      </button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center min-w-[120px] justify-center"
                      >
                        {loading ? (
                          <>
                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4 mr-2" />
                            Confirm Update
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {step === 4 && (
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
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default BulkUpdateModal;