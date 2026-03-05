// components/admin/products/tabs/PricingTab.jsx
import React, { useState } from 'react';
import { 
  FiDollarSign, 
  FiPercent, 
  FiTrendingUp, 
  FiTrendingDown,
  FiInfo,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiShoppingBag,
  FiBarChart2,
  FiCreditCard,
  FiSettings,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';

const PricingTab = ({ formData, onInputChange, errors }) => {
  const [showBulkPricing, setShowBulkPricing] = useState(false);
  const [showVolumeDiscounts, setShowVolumeDiscounts] = useState(false);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  const addBulkPrice = () => {
    onInputChange('bulkPricing', [
      ...formData.bulkPricing,
      { quantity: 1, price: 0, discountType: 'fixed' }
    ]);
  };

  const updateBulkPrice = (index, field, value) => {
    const newBulkPrices = [...formData.bulkPricing];
    newBulkPrices[index] = { ...newBulkPrices[index], [field]: value };
    onInputChange('bulkPricing', newBulkPrices);
  };

  const removeBulkPrice = (index) => {
    const newBulkPrices = formData.bulkPricing.filter((_, i) => i !== index);
    onInputChange('bulkPricing', newBulkPrices);
  };

  const addVolumeDiscount = () => {
    onInputChange('volumeDiscounts', [
      ...formData.volumeDiscounts,
      { minQuantity: 1, maxQuantity: null, discountPercentage: 0, discountAmount: null }
    ]);
  };

  const updateVolumeDiscount = (index, field, value) => {
    const newDiscounts = [...formData.volumeDiscounts];
    newDiscounts[index] = { ...newDiscounts[index], [field]: value };
    onInputChange('volumeDiscounts', newDiscounts);
  };

  const removeVolumeDiscount = (index) => {
    const newDiscounts = formData.volumeDiscounts.filter((_, i) => i !== index);
    onInputChange('volumeDiscounts', newDiscounts);
  };

  const currencies = [
    { value: 'KES', label: 'KES (KSh)', symbol: 'KSh', flag: '🇰🇪' },
    { value: 'USD', label: 'USD ($)', symbol: '$', flag: '🇺🇸' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€', flag: '🇪🇺' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£', flag: '🇬🇧' },
    { value: 'JPY', label: 'JPY (¥)', symbol: '¥', flag: '🇯🇵' },
    { value: 'CNY', label: 'CNY (¥)', symbol: '¥', flag: '🇨🇳' }
  ];

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    
    const currency = currencies.find(c => c.value === formData.currency) || currencies[0];
    
    if (formData.currency === 'KES') {
      return `KSh ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency
    }).format(value);
  };

  const calculateProfit = () => {
    if (formData.cost && formData.price) {
      const profit = formData.price - formData.cost;
      const margin = (profit / formData.price) * 100;
      return { profit, margin };
    }
    return null;
  };

  const profit = calculateProfit();

  const getProfitColor = () => {
    if (!profit) return 'text-gray-400';
    if (profit.margin >= 50) return 'text-green-600';
    if (profit.margin >= 30) return 'text-blue-600';
    if (profit.margin >= 20) return 'text-yellow-600';
    if (profit.margin >= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiDollarSign className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Pricing</h3>
            <p className="text-sm text-gray-600">
              Set your product prices, configure discounts, and manage profit margins. All prices are in Kenyan Shillings (KES) by default.
            </p>
          </div>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiCreditCard className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Currency</h4>
          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
            Default: KES
          </span>
        </div>
        
        <div className="relative">
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => onInputChange('currency', e.target.value)}
            className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
          >
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.flag} {currency.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regular Price */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiTag className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Regular Price</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
              Required
            </span>
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">
                  {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                </span>
              </div>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => onInputChange('price', parseFloat(e.target.value))}
                className={`block w-full pl-14 pr-4 py-3 text-lg font-semibold border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.price 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.price}
              </p>
            )}
          </div>
        </div>

        {/* Compare at Price (Sale Price) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiTrendingDown className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Compare at Price</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
              Optional
            </span>
          </div>
          
          <div>
            <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (for sales)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">
                  {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                </span>
              </div>
              <input
                type="number"
                id="compareAtPrice"
                min="0"
                step="0.01"
                value={formData.compareAtPrice || ''}
                onChange={(e) => onInputChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
                className={`block w-full pl-14 pr-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.compareAtPrice 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.compareAtPrice && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.compareAtPrice}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Original price shown crossed out (must be higher than regular price)
            </p>
          </div>
        </div>
      </div>

      {/* Discount Preview */}
      {formData.compareAtPrice && formData.compareAtPrice > formData.price && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-green-800">Customer savings</span>
                <p className="text-xs text-green-600">Based on compare at price</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(formData.compareAtPrice - formData.price)}
              </span>
              <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-full">
                {Math.round(((formData.compareAtPrice - formData.price) / formData.compareAtPrice) * 100)}% OFF
              </span>
            </div>
          </div>
          <div className="mt-3 h-2 bg-green-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${(formData.price / formData.compareAtPrice) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Cost & Profit Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiBarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Cost & Profit Analysis</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              Internal
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Price */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (what you paid)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">
                    {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                  </span>
                </div>
                <input
                  type="number"
                  id="cost"
                  min="0"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => onInputChange('cost', e.target.value ? parseFloat(e.target.value) : null)}
                  className="block w-full pl-14 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Wholesale Price */}
            <div>
              <label htmlFor="wholesalePrice" className="block text-sm font-medium text-gray-700 mb-1">
                Wholesale Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">
                    {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                  </span>
                </div>
                <input
                  type="number"
                  id="wholesalePrice"
                  min="0"
                  step="0.01"
                  value={formData.wholesalePrice || ''}
                  onChange={(e) => onInputChange('wholesalePrice', e.target.value ? parseFloat(e.target.value) : null)}
                  className="block w-full pl-14 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Profit Display */}
          {profit && (
            <div className={`mt-6 p-6 rounded-xl border ${getProfitColor().replace('text', 'bg').replace('600', '50')} bg-opacity-20`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Profit per unit</span>
                  <span className={`text-2xl font-bold ${getProfitColor()}`}>
                    {formatCurrency(profit.profit)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Profit margin</span>
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold ${getProfitColor()}`}>
                      {profit.margin.toFixed(1)}%
                    </span>
                    {profit.margin >= 50 && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        High margin
                      </span>
                    )}
                    {profit.margin < 10 && profit.margin > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        Low margin
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">ROI</span>
                  <span className={`text-2xl font-bold ${getProfitColor()}`}>
                    {((profit.profit / (formData.cost || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    profit.margin >= 50 ? 'bg-green-500' :
                    profit.margin >= 30 ? 'bg-blue-500' :
                    profit.margin >= 20 ? 'bg-yellow-500' :
                    profit.margin >= 10 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(profit.margin, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Minimum Wholesale Quantity */}
          <div className="mt-6">
            <label htmlFor="minimumWholesaleQuantity" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Wholesale Quantity
            </label>
            <input
              type="number"
              id="minimumWholesaleQuantity"
              min="1"
              value={formData.minimumWholesaleQuantity}
              onChange={(e) => onInputChange('minimumWholesaleQuantity', parseInt(e.target.value))}
              className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Minimum quantity for wholesale pricing
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowBulkPricing(!showBulkPricing)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiShoppingBag className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Bulk Pricing</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              Optional
            </span>
          </div>
          {showBulkPricing ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showBulkPricing && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 my-4">
              Configure quantity-based pricing tiers for bulk purchases.
            </p>

            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={addBulkPrice}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Pricing Tier
              </button>
            </div>

            <div className="space-y-4">
              {formData.bulkPricing.map((tier, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => updateBulkPrice(index, 'quantity', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Min qty"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={tier.discountType}
                        onChange={(e) => updateBulkPrice(index, 'discountType', e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="fixed">Fixed Price</option>
                        <option value="percentage">Percentage Off</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {tier.discountType === 'percentage' ? 'Discount %' : 'Price'}
                      </label>
                      <div className="relative">
                        {tier.discountType !== 'percentage' && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">
                              {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                            </span>
                          </div>
                        )}
                        <input
                          type="number"
                          min="0"
                          step={tier.discountType === 'percentage' ? '1' : '0.01'}
                          value={tier.price}
                          onChange={(e) => updateBulkPrice(index, 'price', parseFloat(e.target.value))}
                          className={`block w-full ${tier.discountType !== 'percentage' ? 'pl-10' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder={tier.discountType === 'percentage' ? 'Discount %' : 'Price'}
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBulkPrice(index)}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {tier.discountType === 'percentage' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Final price: {formatCurrency(formData.price * (1 - tier.price / 100))}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {formData.bulkPricing.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No bulk pricing tiers configured</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Pricing Tier" to create quantity discounts</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Volume Discounts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowVolumeDiscounts(!showVolumeDiscounts)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiPercent className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Volume Discounts</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              Optional
            </span>
          </div>
          {showVolumeDiscounts ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showVolumeDiscounts && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 my-4">
              Set up automatic discounts based on order volume.
            </p>

            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={addVolumeDiscount}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Volume Discount
              </button>
            </div>

            <div className="space-y-4">
              {formData.volumeDiscounts.map((discount, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={discount.minQuantity}
                        onChange={(e) => updateVolumeDiscount(index, 'minQuantity', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Min"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Max Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={discount.maxQuantity || ''}
                        onChange={(e) => updateVolumeDiscount(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Max (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Discount %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={discount.discountPercentage || ''}
                          onChange={(e) => updateVolumeDiscount(index, 'discountPercentage', e.target.value ? parseFloat(e.target.value) : null)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="% off"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Fixed Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">
                            {currencies.find(c => c.value === formData.currency)?.symbol || 'KSh'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount.discountAmount || ''}
                          onChange={(e) => updateVolumeDiscount(index, 'discountAmount', e.target.value ? parseFloat(e.target.value) : null)}
                          className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Amount"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeVolumeDiscount(index)}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {discount.discountPercentage && (
                    <p className="mt-2 text-xs text-gray-500">
                      Final price: {formatCurrency(formData.price * (1 - discount.discountPercentage / 100))}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {formData.volumeDiscounts.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FiPercent className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No volume discounts configured</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Volume Discount" to create automatic discounts</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Pricing Settings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiSettings className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Advanced Pricing</h4>
          </div>
          {showAdvancedPricing ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showAdvancedPricing && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Tax Settings */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTaxable}
                    onChange={(e) => onInputChange('isTaxable', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Product is taxable</span>
                </label>
              </div>

              {/* Price Includes Tax */}
              {formData.isTaxable && (
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxIncluded}
                      onChange={(e) => onInputChange('taxIncluded', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Price includes tax</span>
                  </label>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Additional pricing settings and tax configuration
            </p>
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiBarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Price Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-500">Regular Price</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(formData.price)}</p>
          </div>
          {formData.compareAtPrice && (
            <div>
              <span className="text-xs text-gray-500">Compare at</span>
              <p className="text-lg font-semibold text-gray-400 line-through">{formatCurrency(formData.compareAtPrice)}</p>
            </div>
          )}
          {formData.cost && (
            <div>
              <span className="text-xs text-gray-500">Cost</span>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(formData.cost)}</p>
            </div>
          )}
          {profit && (
            <div>
              <span className="text-xs text-gray-500">Profit</span>
              <p className={`text-lg font-semibold ${getProfitColor()}`}>{formatCurrency(profit.profit)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingTab;