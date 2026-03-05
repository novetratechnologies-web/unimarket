// admin/src/pages/inventory/components/ImportModal.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiX, 
  FiUpload, 
  FiRefreshCw, 
  FiDownload, 
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: preview, 4: importing
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    updateExisting: true,
    skipValidation: false,
    createVariants: true,
    updateInventory: true,
    sendNotifications: true,
    dryRun: false
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStep(1);
      setPreviewData(null);
      setError(null);
    }
  }, [isOpen]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError(null);
      
      // Parse file for preview
      try {
        const preview = await parseFileForPreview(selectedFile);
        setPreviewData(preview);
        setStep(2);
      } catch (err) {
        setError('Failed to parse file. Please check the format.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    onDropRejected: (rejections) => {
      if (rejections[0]?.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else {
        setError('Invalid file format. Please use CSV, Excel, or JSON.');
      }
    }
  });

  const parseFileForPreview = async (file) => {
    // Simulate parsing for preview
    return {
      fileName: file.name,
      fileSize: file.size,
      rowCount: 10, // This would be actual count from file
      headers: ['name', 'sku', 'price', 'quantity', 'description', 'category', 'vendor', 'status'],
      sample: [
        {
          name: 'Sample Product 1',
          sku: 'SKU-001',
          price: '2,500.00',
          quantity: '100',
          status: 'active'
        },
        {
          name: 'Sample Product 2',
          sku: 'SKU-002',
          price: '5,000.00',
          quantity: '50',
          status: 'active'
        }
      ]
    };
  };

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setOptions(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setStep(3);
    setLoading(true);
    
    try {
      await onImport(file, options);
      setStep(4);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Import failed');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create sample CSV template with KES currency
    const headers = [
      'name',
      'sku',
      'price (KES)',
      'compare_at_price (KES)',
      'cost (KES)',
      'quantity',
      'description',
      'category_id',
      'vendor_id',
      'status',
      'tags'
    ].join(',');
    
    const sampleRow = [
      'Sample Product',
      'SKU-001',
      '2500.00',
      '3000.00',
      '1500.00',
      '100',
      'Product description',
      'cat_123',
      'ven_123',
      'active',
      'tag1,tag2,tag3'
    ].join(',');
    
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'import-template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadSampleFile = (format) => {
    if (format === 'excel') {
      // Would generate Excel file
      downloadTemplate(); // For now, just download CSV
    } else {
      downloadTemplate();
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
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                    {step === 4 ? (
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <FiUpload className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {step === 1 && 'Import Products'}
                      {step === 2 && 'Review Import Data'}
                      {step === 3 && 'Importing Products...'}
                      {step === 4 && 'Import Complete!'}
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                      {step === 1 && 'Upload your product data file'}
                      {step === 2 && `Ready to import ${previewData?.rowCount || 0} products`}
                      {step === 3 && 'Please wait while we process your data'}
                      {step === 4 && 'Your products have been imported successfully'}
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
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <FiAlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Upload */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Template Download */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <FiHelpCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Need a template?</p>
                        <p className="text-xs text-indigo-700 mt-1">
                          Download our template to see the required format
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadSampleFile('csv')}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <FiFile className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="ml-3 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FiX className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiUpload className="w-8 h-8 text-indigo-500" />
                        </div>
                        <p className="text-base font-medium text-gray-700">
                          {isDragActive ? 'Drop file here' : 'Drag & drop or click to browse'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Supports CSV, Excel, JSON (max 10MB)
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          All monetary values should be in KES (Kenyan Shillings)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Format Guide */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiInfo className="w-4 h-4 mr-2 text-indigo-600" />
                      Format Guide
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-medium text-gray-600 mb-2">Required Fields:</p>
                        <ul className="space-y-1 text-gray-500">
                          <li>• name - Product name</li>
                          <li>• sku - Unique SKU</li>
                          <li>• price - Price in KES</li>
                          <li>• quantity - Stock quantity</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-2">Optional Fields:</p>
                        <ul className="space-y-1 text-gray-500">
                          <li>• compare_at_price - Original price</li>
                          <li>• cost - Cost in KES</li>
                          <li>• description - Product description</li>
                          <li>• category_id - Category ID</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              {step === 2 && previewData && (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiFile className="w-5 h-5 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-indigo-900">{previewData.fileName}</span>
                      </div>
                      <span className="text-xs text-indigo-600">
                        {(previewData.fileSize / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Data Preview</h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {previewData.headers.slice(0, 6).map((header, i) => (
                              <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.sample.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-xs text-gray-900">{row.name}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.sku}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">KES {row.price}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.quantity}</td>
                              <td className="px-4 py-2 text-xs text-gray-500">-</td>
                              <td className="px-4 py-2 text-xs text-gray-900 capitalize">{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 2 of {previewData.rowCount} rows
                    </p>
                  </div>

                  {/* Import Options */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Import Options</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="updateExisting"
                          checked={options.updateExisting}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Update Existing</span>
                          <p className="text-xs text-gray-500">Update products with matching SKU</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="createVariants"
                          checked={options.createVariants}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Create Variants</span>
                          <p className="text-xs text-gray-500">Auto-generate product variants</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="updateInventory"
                          checked={options.updateInventory}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Update Inventory</span>
                          <p className="text-xs text-gray-500">Update stock quantities</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="sendNotifications"
                          checked={options.sendNotifications}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Send Notifications</span>
                          <p className="text-xs text-gray-500">Notify vendors about updates</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="dryRun"
                          checked={options.dryRun}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Dry Run</span>
                          <p className="text-xs text-gray-500">Validate without importing</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="skipValidation"
                          checked={options.skipValidation}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Skip Validation</span>
                          <p className="text-xs text-gray-500 text-red-600">Not recommended</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start">
                      <FiCheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Ready to import</p>
                        <p className="text-xs text-green-600 mt-1">
                          {previewData.rowCount} products will be imported. 
                          {options.updateExisting ? ' Existing products will be updated.' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Importing */}
              {step === 3 && (
                <div className="py-12 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiUpload className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-6 mb-2">
                    Importing your products...
                  </p>
                  <p className="text-xs text-gray-500">
                    This may take a few moments depending on file size
                  </p>
                </div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h4>
                  <p className="text-sm text-gray-500 mb-6">
                    Successfully imported {previewData?.rowCount || 0} products
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">New products:</span>
                      <span className="font-medium text-green-600">8</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Updated products:</span>
                      <span className="font-medium text-amber-600">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">0</span>
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
                    ← Back to upload
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
                  
                  {step === 1 && file && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Review Data
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
                          Importing...
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4 mr-2" />
                          Start Import
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

export default ImportModal;