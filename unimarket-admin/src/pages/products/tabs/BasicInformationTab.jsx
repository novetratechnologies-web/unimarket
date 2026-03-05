// components/admin/products/tabs/BasicInformationTab.jsx
import React, { useState } from 'react';
import { 
  FiPackage, 
  FiTag, 
  FiType, 
  FiHash, 
  FiGrid, 
  FiBookmark,
  FiEye,
  FiClock,
  FiStar,
  FiInfo,
  FiChevronDown,
  FiLink,
  FiCalendar,
  FiCheck,
  FiCreditCard,
  FiCode,
  FiBox,
  FiCopy,
  FiDatabase,
  FiTrendingUp,
  FiAward,
  FiGlobe,
  FiShoppingBag,
  FiSun,
  FiAlertCircle,
  FiUser,
  FiDownload,
  FiGift,
  FiShield,
  FiCheckCircle,
  FiLoader
} from 'react-icons/fi';

const BasicInformationTab = ({ formData, onInputChange, errors, currentUser, vendorInfo }) => {
  const [showIdentifiers, setShowIdentifiers] = useState(false);

  const generateSlugFromName = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      onInputChange('slug', slug);
    }
  };

  // Schema-aligned product types
  const productTypes = [
    { 
      value: 'simple', 
      label: 'Simple Product', 
      icon: FiPackage, 
      description: 'A single product with no variations',
      requires: [] // No additional requirements
    },
    { 
      value: 'variable', 
      label: 'Variable Product', 
      icon: FiCopy, 
      description: 'Multiple variations like size, color',
      requires: ['variantAttributes', 'variants'],
      warning: 'You need to configure variants in the Variants tab'
    },
    { 
      value: 'grouped', 
      label: 'Grouped Product', 
      icon: FiGrid, 
      description: 'A collection of related products',
      requires: ['groupedProducts'],
      warning: 'You need to add products to this group in the Advanced tab'
    },
    { 
      value: 'bundle', 
      label: 'Bundle', 
      icon: FiShoppingBag, 
      description: 'Multiple products sold together',
      requires: ['bundleItems'],
      warning: 'You need to configure bundle items in the Advanced tab'
    },
    { 
      value: 'digital', 
      label: 'Digital Product', 
      icon: FiDatabase, 
      description: 'Downloads, licenses, or digital goods',
      requires: ['digitalFile'],
      warning: 'You need to configure digital file settings in the Advanced tab'
    },
    { 
      value: 'service', 
      label: 'Service', 
      icon: FiUser, 
      description: 'Booking or service-based products',
      requires: []
    },
    { 
      value: 'subscription', 
      label: 'Subscription', 
      icon: FiClock, 
      description: 'Recurring payment products',
      requires: ['subscription'],
      warning: 'You need to configure subscription settings in the Advanced tab'
    }
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: FiEye, description: 'Visible to everyone' },
    { value: 'private', label: 'Private', icon: FiEye, description: 'Visible only to logged-in users' },
    { value: 'hidden', label: 'Hidden', icon: FiEye, description: 'Not visible in catalog (direct link only)' },
    { value: 'password', label: 'Password Protected', icon: FiEye, description: 'Access requires password' }
  ];

  // Handle type change and update related flags according to schema
  const handleTypeChange = (typeValue) => {
    const selectedType = productTypes.find(t => t.value === typeValue);
    if (selectedType) {
      // Update the type
      onInputChange('type', typeValue);
      
      // Set schema fields based on type
      onInputChange('hasVariants', typeValue === 'variable');
      onInputChange('isBundle', typeValue === 'bundle');
      onInputChange('isDigital', typeValue === 'digital');
      
      // Clear type-specific fields when switching away
      if (typeValue !== 'variable') {
        onInputChange('variantAttributes', []);
        onInputChange('variants', []);
      }
      
      if (typeValue !== 'bundle') {
        onInputChange('bundleItems', []);
        onInputChange('bundleType', 'fixed');
      }
      
      if (typeValue !== 'digital' && typeValue !== 'giftcard') {
        onInputChange('digitalFile', null);
        onInputChange('isDigital', false);
      }
      
      if (typeValue !== 'giftcard') {
        onInputChange('isGiftCard', false);
      }
      
      if (typeValue !== 'grouped') {
        onInputChange('groupedProducts', []);
      }
      
      if (typeValue !== 'subscription') {
        onInputChange('subscription', null);
      }
    }
  };

  // Get the selected product type
  const selectedProductType = productTypes.find(t => t.value === formData.type) || productTypes[0];

  // Check if required fields for this type are filled
  const hasRequiredFields = () => {
    if (!selectedProductType.requires) return true;
    
    return selectedProductType.requires.every(field => {
      if (field === 'variantAttributes') return formData.variantAttributes?.length > 0;
      if (field === 'variants') return formData.variants?.length > 0;
      if (field === 'bundleItems') return formData.bundleItems?.length > 0;
      if (field === 'groupedProducts') return formData.groupedProducts?.length > 0;
      if (field === 'digitalFile') return formData.digitalFile?.url;
      if (field === 'subscription') return formData.subscription?.enabled;
      return !!formData[field];
    });
  };

  // Get vendor display name
  const getVendorDisplayName = () => {
    if (vendorInfo?.name) {
      return vendorInfo.name;
    }
    if (currentUser?.storeName) {
      return currentUser.storeName;
    }
    if (currentUser?.email) {
      return currentUser.email;
    }
    return 'Vendor';
  };

  // Get vendor role display
  const getVendorRoleDisplay = () => {
    if (vendorInfo?.role) {
      return vendorInfo.role === 'admin' ? 'Administrator' : 'Vendor';
    }
    if (currentUser?.role) {
      return currentUser.role === 'admin' ? 'Administrator' : 'Vendor';
    }
    return 'Vendor';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiPackage className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
            <p className="text-sm text-gray-600">
              Start by providing the essential details about your product. This information helps customers find and identify your product.
            </p>
          </div>
        </div>
      </div>

      {/* Product Name - Required Field */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiTag className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Product Identity</h4>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={(e) => onInputChange('name', e.target.value)}
                className={`block w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors?.name 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="e.g., Classic Cotton T-Shirt"
                maxLength="200"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FiInfo className={`w-4 h-4 ${errors?.name ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
            </div>
            {errors?.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {(formData.name || '').length}/200 characters
              </span>
              <div className="flex items-center space-x-2">
                <span className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      (formData.name || '').length > 180 ? 'bg-yellow-500' : 
                      (formData.name || '').length > 0 ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                    style={{ width: `${Math.min(((formData.name || '').length / 200) * 100, 100)}%` }}
                  />
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {(formData.name || '').length > 180 ? 'Limit almost reached' : 'Good'}
                </span>
              </div>
            </div>
          </div>

          {/* Slug - Required, auto-generated if not provided */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-xl shadow-sm">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /product/
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => onInputChange('slug', e.target.value)}
                  className={`block w-full px-4 py-3 text-sm border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 ${
                    errors?.slug ? 'border-red-300 bg-red-50' : ''
                  }`}
                  placeholder="classic-cotton-t-shirt"
                />
                <button
                  type="button"
                  onClick={generateSlugFromName}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  title="Generate from product name"
                >
                  <FiLink className="w-3 h-3 inline mr-1" />
                  Generate
                </button>
              </div>
            </div>
            {errors?.slug && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.slug}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              URL-friendly version of the name. Auto-generated from product name if not provided.
            </p>
          </div>
        </div>
      </div>

      {/* Product Type - Required Field */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiType className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Product Type</h4>
          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
            Required
          </span>
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Select Product Type
          </label>
          <div className="relative">
            <select
              id="type"
              value={formData.type || 'simple'}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={`block w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white ${
                errors?.type ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {productTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors?.type && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.type}
            </p>
          )}
          
          {/* Type-specific info card */}
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-start">
              {selectedProductType.icon && (
                <selectedProductType.icon className="w-6 h-6 text-indigo-600 mr-3 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">{selectedProductType.label}</p>
                <p className="text-sm text-indigo-700 mt-1">{selectedProductType.description}</p>
                
                {/* Type-specific warnings/requirements */}
                {selectedProductType.warning && !hasRequiredFields() && (
                  <div className="mt-3 flex items-start bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <FiAlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800">Additional Configuration Required</p>
                      <p className="text-xs text-yellow-700 mt-1">{selectedProductType.warning}</p>
                    </div>
                  </div>
                )}
                
                {/* Schema field indicators */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selectedProductType.value === 'variable' && (
                    <>
                      <div className="flex items-center text-xs text-gray-600">
                        <span className={`w-2 h-2 rounded-full mr-2 ${formData.variantAttributes?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Attributes: {formData.variantAttributes?.length || 0}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <span className={`w-2 h-2 rounded-full mr-2 ${formData.variants?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Variants: {formData.variants?.length || 0}
                      </div>
                    </>
                  )}
                  {selectedProductType.value === 'bundle' && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className={`w-2 h-2 rounded-full mr-2 ${formData.bundleItems?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Bundle Items: {formData.bundleItems?.length || 0}
                    </div>
                  )}
                  {selectedProductType.value === 'digital' && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className={`w-2 h-2 rounded-full mr-2 ${formData.digitalFile?.url ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Digital File: {formData.digitalFile?.url ? 'Configured' : 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor/Owner Info - Read Only - Auto-populated */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiUser className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Product Vendor</h4>
        </div>
        
        <div className="space-y-3">
          {formData.vendor ? (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {getVendorDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getVendorRoleDisplay()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  Auto-assigned
                </div>
              </div>
              
              {/* Hidden field to show vendor ID is set */}
              <input type="hidden" name="vendor" value={formData.vendor || ''} />
              
              {currentUser?.role === 'vendor' ? (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 flex items-center">
                    <FiInfo className="w-3 h-3 mr-1 flex-shrink-0" />
                    Your product will be sent for admin approval before being published.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-800 flex items-center">
                    <FiCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    As an admin, your products are published immediately.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
              <FiLoader className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Loading vendor information...</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Identifiers - Optional Fields */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIdentifiers(!showIdentifiers)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center">
            <FiHash className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Product Identifiers</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
              Optional
            </span>
          </div>
          <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            showIdentifiers ? 'rotate-180' : ''
          }`} />
        </button>

        {showIdentifiers && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 mt-4">
              Add identification codes to help with inventory management and marketplace integration.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* SKU */}
              <div className="space-y-1">
                <label htmlFor="sku" className="block text-xs font-medium text-gray-600">
                  SKU <span className="text-gray-400">(Stock Keeping Unit)</span>
                </label>
                <div className="relative">
                  <FiBox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => onInputChange('sku', e.target.value.toUpperCase())}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="SKU-001"
                    maxLength="100"
                  />
                </div>
                {errors?.sku && (
                  <p className="mt-1 text-xs text-red-600">{errors.sku}</p>
                )}
              </div>

              {/* Barcode */}
              <div className="space-y-1">
                <label htmlFor="barcode" className="block text-xs font-medium text-gray-600">
                  Barcode
                </label>
                <div className="relative">
                  <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="barcode"
                    value={formData.barcode || ''}
                    onChange={(e) => onInputChange('barcode', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="123456789012"
                  />
                </div>
              </div>

              {/* GTIN */}
              <div className="space-y-1">
                <label htmlFor="gtin" className="block text-xs font-medium text-gray-600">
                  GTIN
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="gtin"
                    value={formData.gtin || ''}
                    onChange={(e) => onInputChange('gtin', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="Global Trade Item Number"
                  />
                </div>
              </div>

              {/* MPN */}
              <div className="space-y-1">
                <label htmlFor="mpn" className="block text-xs font-medium text-gray-600">
                  MPN
                </label>
                <div className="relative">
                  <FiTrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="mpn"
                    value={formData.mpn || ''}
                    onChange={(e) => onInputChange('mpn', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="Manufacturer Part Number"
                  />
                </div>
              </div>

              {/* ISBN */}
              <div className="space-y-1">
                <label htmlFor="isbn" className="block text-xs font-medium text-gray-600">
                  ISBN
                </label>
                <div className="relative">
                  <FiAward className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="isbn"
                    value={formData.isbn || ''}
                    onChange={(e) => onInputChange('isbn', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="International Standard Book Number"
                  />
                </div>
              </div>

              {/* UPC */}
              <div className="space-y-1">
                <label htmlFor="upc" className="block text-xs font-medium text-gray-600">
                  UPC
                </label>
                <div className="relative">
                  <FiCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="upc"
                    value={formData.upc || ''}
                    onChange={(e) => onInputChange('upc', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="Universal Product Code"
                  />
                </div>
              </div>

              {/* EAN */}
              <div className="space-y-1">
                <label htmlFor="ean" className="block text-xs font-medium text-gray-600">
                  EAN
                </label>
                <div className="relative">
                  <FiDatabase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="ean"
                    value={formData.ean || ''}
                    onChange={(e) => onInputChange('ean', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                    placeholder="European Article Number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visibility & Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visibility */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiSun className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Visibility</h4>
          </div>

          <div className="space-y-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.visibility === option.value;
              
              return (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => onInputChange('visibility', e.target.value)}
                    className="sr-only"
                  />
                  <Icon className={`w-5 h-5 mr-3 ${
                    isSelected ? 'text-indigo-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                  {isSelected && (
                    <FiCheck className="ml-auto w-5 h-5 text-indigo-600" />
                  )}
                </label>
              );
            })}
          </div>

          {/* Featured Toggle */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center">
                <FiStar className={`w-5 h-5 mr-3 ${
                  formData.featured ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  <p className="text-xs text-gray-500">Highlight this product in your store</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.featured || false}
                onClick={() => onInputChange('featured', !formData.featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.featured ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.featured ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiCalendar className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Scheduling</h4>
          </div>

          <div className="space-y-4">
            {/* Scheduled Publish Date */}
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Publish Date
              </label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  value={formData.scheduledAt || ''}
                  onChange={(e) => onInputChange('scheduledAt', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Product will automatically publish on this date
              </p>
            </div>

            {/* Unpublish Date */}
            <div>
              <label htmlFor="unpublishAt" className="block text-sm font-medium text-gray-700 mb-1">
                Unpublish Date
              </label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  id="unpublishAt"
                  value={formData.unpublishAt || ''}
                  onChange={(e) => onInputChange('unpublishAt', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Product will automatically unpublish on this date
              </p>
            </div>

            {/* Quick Schedule Options */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 7);
                  onInputChange('scheduledAt', date.toISOString().slice(0, 16));
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Publish in 7 days
              </button>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 30);
                  onInputChange('scheduledAt', date.toISOString().slice(0, 16));
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Publish in 30 days
              </button>
              <button
                type="button"
                onClick={() => {
                  onInputChange('scheduledAt', null);
                  onInputChange('unpublishAt', null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Progress Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiInfo className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm text-gray-700">Required Fields</span>
          </div>
          <span className="text-sm font-medium text-indigo-700">
            {[
              formData.name && 'name',
              formData.slug && 'slug',
              formData.price > 0 && 'price',
              formData.type && 'type',
              formData.vendor && 'vendor'
            ].filter(Boolean).length}/5 completed
          </span>
        </div>
        <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ 
              width: `${([formData.name, formData.slug, formData.price > 0, formData.type, formData.vendor]
                .filter(Boolean).length / 5) * 100}%` 
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          * Product Name, Slug, Price, Type, and Vendor are required
        </p>
      </div>
    </div>
  );
};

export default BasicInformationTab;