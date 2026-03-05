// components/admin/products/tabs/AdvancedTab.jsx
import React, { useState } from 'react';
import {
  FiPackage,
  FiGift,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiLock,
  FiCopy,
  FiShoppingBag,
  FiDownload,
  FiCalendar,
  FiClock,
  FiShield,
  FiRefreshCw,
  FiPercent,
  FiDollarSign,
  FiFileText,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiGlobe,
  FiTag,
  FiSettings,
  FiBriefcase
} from 'react-icons/fi';

const AdvancedTab = ({ formData, onInputChange, errors }) => {
  const [showWarranty, setShowWarranty] = useState(formData.warranty?.hasWarranty || false);
  const [showReturnPolicy, setShowReturnPolicy] = useState(true);
  const [showCustoms, setShowCustoms] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    bundle: formData.type === 'bundle',
    digital: formData.type === 'digital' || formData.type === 'giftcard',
    warranty: false,
    returns: false,
    tax: false,
    notes: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addBundleItem = () => {
    onInputChange('bundleItems', [
      ...(formData.bundleItems || []),
      {
        id: Date.now().toString(),
        product: '',
        quantity: 1,
        price: 0,
        discountType: 'fixed',
        discountValue: null,
        isOptional: false,
        minQuantity: 1,
        maxQuantity: null
      }
    ]);
  };

  const updateBundleItem = (index, field, value) => {
    const newItems = [...(formData.bundleItems || [])];
    newItems[index][field] = value;
    onInputChange('bundleItems', newItems);
  };

  const removeBundleItem = (index) => {
    const newItems = formData.bundleItems.filter((_, i) => i !== index);
    onInputChange('bundleItems', newItems);
  };

  const addAdminNote = () => {
    onInputChange('adminNotes', [
      ...(formData.adminNotes || []),
      {
        id: Date.now().toString(),
        note: '',
        isPrivate: true,
        category: 'general',
        createdAt: new Date().toISOString(),
        createdBy: 'Current User'
      }
    ]);
  };

  const updateAdminNote = (index, field, value) => {
    const newNotes = [...(formData.adminNotes || [])];
    newNotes[index][field] = value;
    onInputChange('adminNotes', newNotes);
  };

  const removeAdminNote = (index) => {
    const newNotes = formData.adminNotes.filter((_, i) => i !== index);
    onInputChange('adminNotes', newNotes);
  };

  const warrantyUnits = [
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' }
  ];

  const returnMethods = [
    { value: 'refund', label: 'Refund', icon: FiDollarSign },
    { value: 'store_credit', label: 'Store Credit', icon: FiGift },
    { value: 'exchange', label: 'Exchange', icon: FiRefreshCw }
  ];

  const taxClasses = [
    { value: 'standard', label: 'Standard' },
    { value: 'reduced', label: 'Reduced' },
    { value: 'zero', label: 'Zero' },
    { value: 'exempt', label: 'Exempt' }
  ];

  const noteCategories = [
    { value: 'general', label: 'General', icon: FiFileText },
    { value: 'quality', label: 'Quality', icon: FiCheckCircle },
    { value: 'inventory', label: 'Inventory', icon: FiPackage },
    { value: 'pricing', label: 'Pricing', icon: FiDollarSign },
    { value: 'compliance', label: 'Compliance', icon: FiShield }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiSettings className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Advanced Settings</h3>
            <p className="text-sm text-gray-600">
              Configure advanced product options based on the product type you selected.
            </p>
          </div>
        </div>
      </div>

      {/* Product Badges */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <FiTag className="w-5 h-5 text-indigo-600 mr-2" />
          Product Badges
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.isNew || false}
              onChange={(e) => onInputChange('isNew', e.target.checked)}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${formData.isNew ? 'bg-green-100' : 'bg-gray-200'}`}>
              <FiStar className={`w-4 h-4 ${formData.isNew ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">New</span>
            {formData.isNew && <FiCheckCircle className="ml-auto w-4 h-4 text-green-500" />}
          </label>

          <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.isTrending || false}
              onChange={(e) => onInputChange('isTrending', e.target.checked)}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${formData.isTrending ? 'bg-orange-100' : 'bg-gray-200'}`}>
              <FiTrendingUp className={`w-4 h-4 ${formData.isTrending ? 'text-orange-600' : 'text-gray-500'}`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">Trending</span>
            {formData.isTrending && <FiCheckCircle className="ml-auto w-4 h-4 text-green-500" />}
          </label>

          <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.isBestSeller || false}
              onChange={(e) => onInputChange('isBestSeller', e.target.checked)}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${formData.isBestSeller ? 'bg-yellow-100' : 'bg-gray-200'}`}>
              <FiAward className={`w-4 h-4 ${formData.isBestSeller ? 'text-yellow-600' : 'text-gray-500'}`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">Best Seller</span>
            {formData.isBestSeller && <FiCheckCircle className="ml-auto w-4 h-4 text-green-500" />}
          </label>

          <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.isExclusive || false}
              onChange={(e) => onInputChange('isExclusive', e.target.checked)}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${formData.isExclusive ? 'bg-purple-100' : 'bg-gray-200'}`}>
              <FiLock className={`w-4 h-4 ${formData.isExclusive ? 'text-purple-600' : 'text-gray-500'}`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">Exclusive</span>
            {formData.isExclusive && <FiCheckCircle className="ml-auto w-4 h-4 text-green-500" />}
          </label>
        </div>
      </div>

      {/* Bundle Configuration - Only show for bundle type */}
      {formData.type === 'bundle' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <button
            onClick={() => toggleSection('bundle')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiCopy className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Bundle Configuration</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                {formData.bundleItems?.length || 0} items
              </span>
            </div>
            {expandedSections.bundle ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.bundle && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label htmlFor="bundleType" className="block text-sm font-medium text-gray-700 mb-1">
                    Bundle Type
                  </label>
                  <select
                    id="bundleType"
                    value={formData.bundleType || 'fixed'}
                    onChange={(e) => onInputChange('bundleType', e.target.value)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  >
                    <option value="fixed">Fixed Bundle</option>
                    <option value="configurable">Configurable Bundle</option>
                    <option value="dynamic">Dynamic Bundle</option>
                  </select>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={addBundleItem}
                    className="inline-flex items-center px-4 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add Product to Bundle
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {(formData.bundleItems || []).map((item, index) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Bundle Item {index + 1}</h5>
                      <button
                        onClick={() => removeBundleItem(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Product
                        </label>
                        <div className="relative">
                          <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={item.product}
                            onChange={(e) => updateBundleItem(index, 'product', e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Search and select product..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateBundleItem(index, 'quantity', parseInt(e.target.value))}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Price
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateBundleItem(index, 'price', parseFloat(e.target.value))}
                            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Discount Type
                        </label>
                        <select
                          value={item.discountType}
                          onChange={(e) => updateBundleItem(index, 'discountType', e.target.value)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Discount Value
                        </label>
                        <div className="relative">
                          {item.discountType === 'percentage' ? (
                            <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          ) : (
                            <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          )}
                          <input
                            type="number"
                            min="0"
                            step={item.discountType === 'percentage' ? '1' : '0.01'}
                            value={item.discountValue || ''}
                            onChange={(e) => updateBundleItem(index, 'discountValue', parseFloat(e.target.value))}
                            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.isOptional || false}
                          onChange={(e) => updateBundleItem(index, 'isOptional', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Item is optional</span>
                      </label>

                      {item.isOptional && (
                        <>
                          <label className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Min:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.minQuantity || 1}
                              onChange={(e) => updateBundleItem(index, 'minQuantity', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </label>
                          <label className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Max:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.maxQuantity || ''}
                              onChange={(e) => updateBundleItem(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                              placeholder="∞"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {(formData.bundleItems || []).length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FiCopy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-2">No bundle items added</p>
                    <p className="text-xs text-gray-400">Click "Add Product to Bundle" to create your bundle</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Digital Product Configuration - Show for digital or giftcard types */}
      {(formData.type === 'digital' || formData.type === 'giftcard') && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <button
            onClick={() => toggleSection('digital')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <FiDownload className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">
                {formData.type === 'giftcard' ? 'Gift Card Settings' : 'Digital Product Settings'}
              </h4>
            </div>
            {expandedSections.digital ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.digital && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <label htmlFor="digitalFile" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'giftcard' ? 'Gift Card Template URL' : 'Digital File URL'}
                  </label>
                  <div className="relative">
                    <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      id="digitalFile"
                      value={formData.digitalFile?.url || ''}
                      onChange={(e) => onInputChange('digitalFile', {
                        ...formData.digitalFile,
                        url: e.target.value
                      })}
                      className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="downloadLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    Download Limit
                  </label>
                  <input
                    type="number"
                    id="downloadLimit"
                    min="0"
                    value={formData.digitalFile?.downloadLimit || 0}
                    onChange={(e) => onInputChange('digitalFile', {
                      ...formData.digitalFile,
                      downloadLimit: parseInt(e.target.value)
                    })}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">0 = unlimited downloads</p>
                </div>

                <div>
                  <label htmlFor="downloadExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Download Expiry (days)
                  </label>
                  <input
                    type="number"
                    id="downloadExpiry"
                    min="1"
                    value={formData.digitalFile?.downloadExpiry || 30}
                    onChange={(e) => onInputChange('digitalFile', {
                      ...formData.digitalFile,
                      downloadExpiry: parseInt(e.target.value)
                    })}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {formData.type !== 'giftcard' && (
                  <div>
                    <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700 mb-1">
                      License Type
                    </label>
                    <select
                      id="licenseType"
                      value={formData.digitalFile?.licenseType || 'single'}
                      onChange={(e) => onInputChange('digitalFile', {
                        ...formData.digitalFile,
                        licenseType: e.target.value
                      })}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="single">Single Use</option>
                      <option value="multi">Multi-User</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.digitalFile?.drm || false}
                      onChange={(e) => onInputChange('digitalFile', {
                        ...formData.digitalFile,
                        drm: e.target.checked
                      })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Enable DRM protection</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warranty */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          onClick={() => toggleSection('warranty')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiShield className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Warranty</h4>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={showWarranty}
              onClick={(e) => {
                e.stopPropagation();
                setShowWarranty(!showWarranty);
                onInputChange('warranty', {
                  ...formData.warranty,
                  hasWarranty: !showWarranty
                });
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-3 ${
                showWarranty ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  showWarranty ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            {expandedSections.warranty ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.warranty && showWarranty && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label htmlFor="warrantyPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Period
                </label>
                <input
                  type="number"
                  id="warrantyPeriod"
                  min="1"
                  value={formData.warranty?.period?.value || ''}
                  onChange={(e) => onInputChange('warranty', {
                    ...formData.warranty,
                    period: {
                      ...formData.warranty?.period,
                      value: parseInt(e.target.value)
                    }
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter period"
                />
              </div>

              <div>
                <label htmlFor="warrantyUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  id="warrantyUnit"
                  value={formData.warranty?.period?.unit || 'months'}
                  onChange={(e) => onInputChange('warranty', {
                    ...formData.warranty,
                    period: {
                      ...formData.warranty?.period,
                      unit: e.target.value
                    }
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {warrantyUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="warrantyDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Description
                </label>
                <textarea
                  id="warrantyDescription"
                  rows={3}
                  value={formData.warranty?.description || ''}
                  onChange={(e) => onInputChange('warranty', {
                    ...formData.warranty,
                    description: e.target.value
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe what the warranty covers..."
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="warrantyProvider" className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Provider
                </label>
                <input
                  type="text"
                  id="warrantyProvider"
                  value={formData.warranty?.provider || ''}
                  onChange={(e) => onInputChange('warranty', {
                    ...formData.warranty,
                    provider: e.target.value
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Manufacturer, Store"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Return Policy */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          onClick={() => toggleSection('returns')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiRefreshCw className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Return Policy</h4>
          </div>
          {expandedSections.returns ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.returns && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${formData.returnPolicy?.isReturnable ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <FiRefreshCw className={`w-4 h-4 ${formData.returnPolicy?.isReturnable ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <span className="ml-3 text-sm text-gray-700">Product is returnable</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.returnPolicy?.isReturnable !== false}
                  onClick={() => onInputChange('returnPolicy', {
                    ...formData.returnPolicy,
                    isReturnable: !formData.returnPolicy?.isReturnable
                  })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formData.returnPolicy?.isReturnable !== false ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      formData.returnPolicy?.isReturnable !== false ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {formData.returnPolicy?.isReturnable && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="returnPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                        Return Period (days)
                      </label>
                      <input
                        type="number"
                        id="returnPeriod"
                        min="1"
                        value={formData.returnPolicy?.returnPeriod || 30}
                        onChange={(e) => onInputChange('returnPolicy', {
                          ...formData.returnPolicy,
                          returnPeriod: parseInt(e.target.value)
                        })}
                        className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="restockingFee" className="block text-sm font-medium text-gray-700 mb-1">
                        Restocking Fee (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="restockingFee"
                          min="0"
                          max="100"
                          value={formData.returnPolicy?.restockingFee || 0}
                          onChange={(e) => onInputChange('returnPolicy', {
                            ...formData.returnPolicy,
                            restockingFee: parseFloat(e.target.value)
                          })}
                          className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="returnMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Return Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {returnMethods.map(method => (
                        <label
                          key={method.value}
                          className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${
                            formData.returnPolicy?.returnMethod === method.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="returnMethod"
                            value={method.value}
                            checked={formData.returnPolicy?.returnMethod === method.value}
                            onChange={(e) => onInputChange('returnPolicy', {
                              ...formData.returnPolicy,
                              returnMethod: e.target.value
                            })}
                            className="sr-only"
                          />
                          <method.icon className={`w-4 h-4 mr-2 ${
                            formData.returnPolicy?.returnMethod === method.value
                              ? 'text-indigo-600'
                              : 'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            formData.returnPolicy?.returnMethod === method.value
                              ? 'text-indigo-700'
                              : 'text-gray-600'
                          }`}>
                            {method.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="returnConditions" className="block text-sm font-medium text-gray-700 mb-1">
                      Return Conditions
                    </label>
                    <textarea
                      id="returnConditions"
                      rows={3}
                      value={formData.returnPolicy?.conditions || ''}
                      onChange={(e) => onInputChange('returnPolicy', {
                        ...formData.returnPolicy,
                        conditions: e.target.value
                      })}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe conditions for returns..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tax Settings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          onClick={() => toggleSection('tax')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiBriefcase className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Tax Settings</h4>
          </div>
          {expandedSections.tax ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.tax && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${formData.isTaxable ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <FiBriefcase className={`w-4 h-4 ${formData.isTaxable ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <span className="ml-3 text-sm text-gray-700">Product is taxable</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isTaxable}
                  onClick={() => onInputChange('isTaxable', !formData.isTaxable)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formData.isTaxable ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      formData.isTaxable ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {formData.isTaxable && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="taxClass" className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Class
                      </label>
                      <select
                        id="taxClass"
                        value={formData.taxClass || ''}
                        onChange={(e) => onInputChange('taxClass', e.target.value)}
                        className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select tax class</option>
                        {taxClasses.map(tc => (
                          <option key={tc.value} value={tc.value}>{tc.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Code
                      </label>
                      <input
                        type="text"
                        id="taxCode"
                        value={formData.taxCode || ''}
                        onChange={(e) => onInputChange('taxCode', e.target.value)}
                        className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., VAT-001"
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.taxIncluded || false}
                      onChange={(e) => onInputChange('taxIncluded', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Tax is included in price</span>
                  </label>

                  {/* Customs Information */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowCustoms(!showCustoms)}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <FiGlobe className="w-4 h-4 mr-2" />
                      Customs Information
                      {showCustoms ? (
                        <FiChevronUp className="ml-2 w-4 h-4" />
                      ) : (
                        <FiChevronDown className="ml-2 w-4 h-4" />
                      )}
                    </button>

                    {showCustoms && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="hsCode" className="block text-sm font-medium text-gray-700 mb-1">
                            HS Code
                          </label>
                          <input
                            type="text"
                            id="hsCode"
                            value={formData.customsInformation?.hsCode || ''}
                            onChange={(e) => onInputChange('customsInformation', {
                              ...formData.customsInformation,
                              hsCode: e.target.value
                            })}
                            className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 6109.10.00"
                          />
                        </div>

                        <div>
                          <label htmlFor="customsCountry" className="block text-sm font-medium text-gray-700 mb-1">
                            Country of Origin
                          </label>
                          <input
                            type="text"
                            id="customsCountry"
                            value={formData.customsInformation?.countryOfOrigin || ''}
                            onChange={(e) => onInputChange('customsInformation', {
                              ...formData.customsInformation,
                              countryOfOrigin: e.target.value
                            })}
                            className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., Kenya"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          onClick={() => toggleSection('notes')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiEdit3 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Admin Notes</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {formData.adminNotes?.length || 0} notes
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addAdminNote();
              }}
              className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg mr-2"
            >
              <FiPlus className="w-4 h-4" />
            </button>
            {expandedSections.notes ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.notes && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="mt-4 space-y-4">
              {(formData.adminNotes || []).map((note, index) => (
                <div key={note.id || index} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        value={note.note}
                        onChange={(e) => updateAdminNote(index, 'note', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter admin note..."
                      />
                    </div>
                    <button
                      onClick={() => removeAdminNote(index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <select
                        value={note.category || 'general'}
                        onChange={(e) => updateAdminNote(index, 'category', e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {noteCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={note.isPrivate !== false}
                          onChange={(e) => updateAdminNote(index, 'isPrivate', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600">Private</span>
                      </label>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <FiClock className="w-3 h-3 mr-1" />
                      {new Date(note.createdAt).toLocaleString()}
                      {note.createdBy && <span className="ml-2">by {note.createdBy}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {(formData.adminNotes || []).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FiEdit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">No admin notes yet</p>
                  <button
                    onClick={addAdminNote}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add First Note
                  </button>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => onInputChange('notes', e.target.value)}
                className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add any internal notes about this product (not visible to customers)"
                maxLength={1000}
              />
              <div className="mt-2 flex justify-end">
                <span className="text-xs text-gray-500">
                  {formData.notes?.length || 0}/1000 characters
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Advanced Settings Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.type === 'bundle' ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Bundle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.type === 'digital' || formData.type === 'giftcard' ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Digital</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.type === 'giftcard' ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Gift Card</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.warranty?.hasWarranty ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Warranty</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTab;