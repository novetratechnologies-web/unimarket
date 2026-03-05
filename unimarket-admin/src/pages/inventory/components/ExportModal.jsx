// admin/src/pages/inventory/components/ExportModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiDownload, 
  FiRefreshCw, 
  FiFileText, 
  FiFile, 
  FiImage, 
  FiTag, 
  FiBox, 
  FiDollarSign,
  FiCalendar,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ExportModal = ({ isOpen, onClose, onExport, selectedCount }) => {
  const [step, setStep] = useState(1); // 1: configure, 2: preview, 3: exporting, 4: complete
  const [formData, setFormData] = useState({
    format: 'csv',
    fields: 'all',
    includeVariants: true,
    includeImages: false,
    includeDeleted: false,
    includeArchived: false,
    dateFrom: '',
    dateTo: '',
    delimiter: 'comma',
    encoding: 'utf8',
    compression: 'none'
  });
  const [loading, setLoading] = useState(false);
  const [exportStats, setExportStats] = useState({
    totalRecords: selectedCount || 1250,
    estimatedSize: '2.5 MB',
    estimatedTime: '30 seconds'
  });
  const [customFields, setCustomFields] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        format: 'csv',
        fields: 'all',
        includeVariants: true,
        includeImages: false,
        includeDeleted: false,
        includeArchived: false,
        dateFrom: '',
        dateTo: '',
        delimiter: 'comma',
        encoding: 'utf8',
        compression: 'none'
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Update estimated size based on options
    if (name === 'includeImages' || name === 'includeVariants') {
      updateEstimates();
    }
  };

  const updateEstimates = () => {
    let size = 2.5; // Base size in MB
    if (formData.includeImages) size += 5;
    if (formData.includeVariants) size += 1.5;
    if (formData.includeDeleted) size += 0.5;
    if (formData.includeArchived) size += 0.5;
    
    setExportStats(prev => ({
      ...prev,
      estimatedSize: `${size.toFixed(1)} MB`,
      estimatedTime: `${Math.round(size * 12)} seconds`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep(3);
    setLoading(true);
    
    const options = {
      format: formData.format,
      fields: formData.fields === 'all' ? undefined : 
              formData.fields === 'custom' ? customFields : formData.fields.split(','),
      includeVariants: formData.includeVariants,
      includeImages: formData.includeImages,
      includeDeleted: formData.includeDeleted,
      includeArchived: formData.includeArchived,
      dateFrom: formData.dateFrom || undefined,
      dateTo: formData.dateTo || undefined,
      delimiter: formData.delimiter,
      encoding: formData.encoding,
      compression: formData.compression,
      ...(selectedCount > 0 && { ids: 'selected' })
    };

    try {
      await onExport(options);
      setStep(4);
    } catch (error) {
      console.error('Export failed:', error);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (format) => {
    switch (format) {
      case 'csv': return <FiFileText className="w-5 h-5" />;
      case 'excel': return <FiFile className="w-5 h-5" />;
      case 'json': return <FiFile className="w-5 h-5" />;
      default: return <FiDownload className="w-5 h-5" />;
    }
  };

  const getFileColor = (format) => {
    switch (format) {
      case 'csv': return 'text-green-600';
      case 'excel': return 'text-emerald-600';
      case 'json': return 'text-amber-600';
      default: return 'text-indigo-600';
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                    {step === 4 ? (
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      getFileIcon(formData.format)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {step === 1 && 'Export Inventory'}
                      {step === 2 && 'Review Export Settings'}
                      {step === 3 && 'Exporting Data...'}
                      {step === 4 && 'Export Complete!'}
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                      {step === 1 && selectedCount > 0 
                        ? `Exporting ${selectedCount} selected products`
                        : step === 1 && 'Export all products'
                      }
                      {step === 2 && `Ready to export ${exportStats.totalRecords} records`}
                      {step === 3 && 'Please wait while we generate your file'}
                      {step === 4 && 'Your file has been generated successfully'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
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
              {/* Step 1: Configure Export */}
              {step === 1 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'csv', label: 'CSV', icon: FiFileText, color: 'green' },
                        { value: 'excel', label: 'Excel', icon: FiFile, color: 'emerald' },
                        { value: 'json', label: 'JSON', icon: FiFile, color: 'amber' }
                      ].map(({ value, label, icon: Icon, color }) => (
                        <label
                          key={value}
                          className={`
                            relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.format === value
                              ? `border-${color}-500 bg-${color}-50`
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={value}
                            checked={formData.format === value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <Icon className={`w-6 h-6 mb-2 ${
                            formData.format === value ? `text-${color}-600` : 'text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            formData.format === value ? `text-${color}-700` : 'text-gray-600'
                          }`}>
                            {label}
                          </span>
                          {formData.format === value && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 bg-${color}-500 rounded-full flex items-center justify-center`}>
                              <FiCheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fields Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fields to Export
                    </label>
                    <select
                      name="fields"
                      value={formData.fields}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Fields</option>
                      <option value="basic">Basic Info (Name, SKU, Price, Quantity)</option>
                      <option value="inventory">Inventory Details (Stock, Cost, Value)</option>
                      <option value="pricing">Pricing Details (Price, Compare At, Cost)</option>
                      <option value="categorized">With Category & Vendor</option>
                      <option value="custom">Custom Selection</option>
                    </select>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Export Options</h4>
                    
                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                      <div className="flex items-center">
                        <FiBox className="w-4 h-4 text-indigo-600 mr-3" />
                        <span className="text-sm text-gray-700">Include Variants</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="includeVariants"
                          checked={formData.includeVariants}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          onClick={() => handleChange({ target: { name: 'includeVariants', checked: !formData.includeVariants, type: 'checkbox' } })}
                          className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                            formData.includeVariants ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            formData.includeVariants ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                      <div className="flex items-center">
                        <FiImage className="w-4 h-4 text-indigo-600 mr-3" />
                        <span className="text-sm text-gray-700">Include Image URLs</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="includeImages"
                          checked={formData.includeImages}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          onClick={() => handleChange({ target: { name: 'includeImages', checked: !formData.includeImages, type: 'checkbox' } })}
                          className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                            formData.includeImages ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            formData.includeImages ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors">
                      <div className="flex items-center">
                        <FiTag className="w-4 h-4 text-indigo-600 mr-3" />
                        <span className="text-sm text-gray-700">Include Deleted Products</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="includeDeleted"
                          checked={formData.includeDeleted}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          onClick={() => handleChange({ target: { name: 'includeDeleted', checked: !formData.includeDeleted, type: 'checkbox' } })}
                          className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                            formData.includeDeleted ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            formData.includeDeleted ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Date
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          name="dateFrom"
                          value={formData.dateFrom}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To Date
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          name="dateTo"
                          value={formData.dateTo}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

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
                        {/* Delimiter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delimiter
                          </label>
                          <select
                            name="delimiter"
                            value={formData.delimiter}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="comma">Comma ( , )</option>
                            <option value="semicolon">Semicolon ( ; )</option>
                            <option value="tab">Tab</option>
                            <option value="pipe">Pipe ( | )</option>
                          </select>
                        </div>

                        {/* Encoding */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Encoding
                          </label>
                          <select
                            name="encoding"
                            value={formData.encoding}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="utf8">UTF-8</option>
                            <option value="utf16">UTF-16</option>
                            <option value="ascii">ASCII</option>
                          </select>
                        </div>

                        {/* Compression */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Compression
                          </label>
                          <select
                            name="compression"
                            value={formData.compression}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="none">None</option>
                            <option value="zip">ZIP</option>
                            <option value="gzip">GZIP</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Export Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start">
                      <FiInfo className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Export Information:</strong>
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-blue-700">
                          <li>• Total records: {exportStats.totalRecords.toLocaleString()}</li>
                          <li>• Estimated file size: {exportStats.estimatedSize}</li>
                          <li>• Estimated time: {exportStats.estimatedTime}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Step 2: Preview */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                    <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
                      <FiCheckCircle className="w-4 h-4 mr-2" />
                      Export Summary
                    </h4>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs text-indigo-600 mb-1">Format</dt>
                        <dd className="text-sm font-medium text-indigo-900 capitalize">{formData.format}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-indigo-600 mb-1">Records</dt>
                        <dd className="text-sm font-medium text-indigo-900">{exportStats.totalRecords.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-indigo-600 mb-1">File Size</dt>
                        <dd className="text-sm font-medium text-indigo-900">{exportStats.estimatedSize}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-indigo-600 mb-1">Est. Time</dt>
                        <dd className="text-sm font-medium text-indigo-900">{exportStats.estimatedTime}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Options</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <FiBox className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Variants:</span>
                        <span className="ml-auto font-medium text-gray-900">
                          {formData.includeVariants ? 'Included' : 'Excluded'}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <FiImage className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Images:</span>
                        <span className="ml-auto font-medium text-gray-900">
                          {formData.includeImages ? 'Included' : 'Excluded'}
                        </span>
                      </li>
                      {formData.dateFrom && (
                        <li className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Date Range:</span>
                          <span className="ml-auto font-medium text-gray-900">
                            {formData.dateFrom} to {formData.dateTo || 'Present'}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 3: Exporting */}
              {step === 3 && (
                <div className="py-12 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiDownload className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-6 mb-2">
                    Generating your export file...
                  </p>
                  <p className="text-xs text-gray-500">
                    This may take a few moments
                  </p>
                  <div className="mt-6 w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <div className="py-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Export Complete!</h4>
                  <p className="text-sm text-gray-500 mb-6">
                    Your file has been generated and download should start automatically
                  </p>
                  <div className="bg-indigo-50 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-indigo-600">File name:</span>
                      <span className="font-medium text-indigo-900">
                        inventory-export-{new Date().toISOString().split('T')[0]}.{formData.format}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-600">Size:</span>
                      <span className="font-medium text-indigo-900">{exportStats.estimatedSize}</span>
                    </div>
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
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {step === 4 ? 'Done' : 'Cancel'}
                  </button>
                  
                  {step === 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Review & Export
                    </button>
                  )}
                  
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center min-w-[120px] justify-center"
                    >
                      {loading ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FiDownload className="w-4 h-4 mr-2" />
                          Export Now
                        </>
                      )}
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

export default ExportModal;