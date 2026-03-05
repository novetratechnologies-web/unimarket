// components/admin/products/tabs/ShippingTab.jsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
  FiTruck, 
  FiPackage, 
  FiMapPin, 
  FiClock, 
  FiDollarSign,
  FiAlertCircle,
  FiInfo,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiCalendar,
  FiFlag,
  FiBox,
  FiMaximize2,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiRefreshCw,
  FiHome,
  FiShoppingBag,
  FiAnchor,
  FiSun,
  FiCloud,
  FiUmbrella,
  FiCpu,
  FiZap,
  FiWind,
  FiDroplet
} from 'react-icons/fi';
import api from '../../../api/api';

const ShippingTab = ({ formData, onInputChange, errors }) => {
  const [shippingClasses, setShippingClasses] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedShipping, setShowAdvancedShipping] = useState(false);
  const [calculatedRates, setCalculatedRates] = useState([]);
  const [dimensions, setDimensions] = useState(formData.dimensions || {
    length: null,
    width: null,
    height: null,
    unit: 'cm'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate shipping rates when weight/dimensions change
    if (formData.requiresShipping && formData.weight) {
      calculateShippingRates();
    }
  }, [formData.weight, dimensions, formData.requiresShipping]);

  // Sync dimensions with form data
  useEffect(() => {
    onInputChange('dimensions', dimensions);
  }, [dimensions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch shipping classes
      try {
        const classesRes = await api.get('/admin/shipping-classes');
        const classesData = classesRes?.data?.data || classesRes?.data || [];
        setShippingClasses(classesData.map(c => ({
          value: c._id,
          label: c.name,
          description: c.description
        })));
      } catch (error) {
        console.log('Shipping classes endpoint not available');
        setShippingClasses([]);
      }

      // Fetch countries (mock data if endpoint doesn't exist)
      try {
        const countriesRes = await api.get('/admin/countries');
        const countriesData = countriesRes?.data?.data || countriesRes?.data || [];
        setCountries(countriesData.map(c => ({
          value: c.code,
          label: c.name,
          flag: c.flag
        })));
      } catch (error) {
        // Mock countries data
        setCountries([
          { value: 'US', label: 'United States', flag: '🇺🇸' },
          { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
          { value: 'KE', label: 'Kenya', flag: '🇰🇪' },
          { value: 'UG', label: 'Uganda', flag: '🇺🇬' },
          { value: 'TZ', label: 'Tanzania', flag: '🇹🇿' },
          { value: 'RW', label: 'Rwanda', flag: '🇷🇼' },
          { value: 'ET', label: 'Ethiopia', flag: '🇪🇹' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateShippingRates = () => {
    // Simulate shipping rate calculation based on weight
    const weight = formData.weight || 0;
    const volume = calculateVolume();
    
    const rates = [
      {
        method: 'Standard Shipping',
        carrier: 'Local Courier',
        cost: weight * 50,
        currency: formData.currency || 'USD',
        estimatedDays: { min: 2, max: 5 },
        trackingAvailable: true
      },
      {
        method: 'Express Shipping',
        carrier: 'Express Delivery',
        cost: weight * 100,
        currency: formData.currency || 'USD',
        estimatedDays: { min: 1, max: 2 },
        trackingAvailable: true
      },
      {
        method: 'Economy Shipping',
        carrier: 'Standard Mail',
        cost: weight * 30,
        currency: formData.currency || 'USD',
        estimatedDays: { min: 5, max: 10 },
        trackingAvailable: false
      }
    ];

    setCalculatedRates(rates);
  };

  const addShippingRate = () => {
    onInputChange('shippingRates', [
      ...(formData.shippingRates || []),
      {
        method: '',
        carrier: '',
        cost: 0,
        currency: formData.currency || 'USD',
        estimatedDays: { min: 1, max: 5 },
        locations: [],
        trackingAvailable: true
      }
    ]);
  };

  const updateShippingRate = (index, field, value) => {
    const newRates = [...(formData.shippingRates || [])];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newRates[index][parent] = {
        ...newRates[index][parent],
        [child]: value
      };
    } else {
      newRates[index][field] = value;
    }
    onInputChange('shippingRates', newRates);
  };

  const removeShippingRate = (index) => {
    const newRates = (formData.shippingRates || []).filter((_, i) => i !== index);
    onInputChange('shippingRates', newRates);
  };

  const updateDimension = (dimension, value) => {
    setDimensions(prev => ({
      ...prev,
      [dimension]: value ? parseFloat(value) : null
    }));
  };

  const calculateVolume = () => {
    const { length, width, height } = dimensions;
    if (length && width && height) {
      return (length * width * height).toFixed(2);
    }
    return null;
  };

  const calculateVolumetricWeight = () => {
    const volume = calculateVolume();
    if (volume) {
      // Standard volumetric weight calculation (5000 cm³/kg for courier)
      return (parseFloat(volume) / 5000).toFixed(2);
    }
    return null;
  };

  const formatCurrency = (amount) => {
    const currency = formData.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const weightUnits = [
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'lb', label: 'Pounds (lb)' },
    { value: 'oz', label: 'Ounces (oz)' }
  ];

  const dimensionUnits = [
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'mm', label: 'Millimeters (mm)' }
  ];

  const volumetricWeight = calculateVolumetricWeight();
  const volume = calculateVolume();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiTruck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Shipping & Delivery</h3>
            <p className="text-sm text-gray-600">
              Configure shipping options, dimensions, and delivery estimates for your product.
            </p>
          </div>
        </div>
      </div>

      {/* Requires Shipping Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${formData.requiresShipping ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              {formData.requiresShipping ? (
                <FiTruck className="w-5 h-5 text-indigo-600" />
              ) : (
                <FiBox className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="ml-3">
              <label htmlFor="requiresShipping" className="text-sm font-medium text-gray-700">
                This product requires shipping
              </label>
              <p className="text-xs text-gray-500">
                {formData.requiresShipping 
                  ? 'Physical product that needs to be shipped' 
                  : 'Digital product or service - no shipping needed'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formData.requiresShipping}
            onClick={() => onInputChange('requiresShipping', !formData.requiresShipping)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              formData.requiresShipping ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.requiresShipping ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {formData.requiresShipping && (
        <>
          {/* Weight & Dimensions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center">
                <FiAnchor className="w-5 h-5 text-indigo-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Weight & Dimensions</h4>
              </div>
            </div>

            <div className="p-6">
              {/* Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <div className="relative">
                    <FiAnchor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      id="weight"
                      min="0"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => onInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      className={`block w-full pl-10 pr-3 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 ${
                        errors?.weight ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter weight"
                    />
                  </div>
                  {errors?.weight && (
                    <p className="mt-1 text-xs text-red-600">{errors.weight}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      id="weightUnit"
                      value={formData.weightUnit || 'g'}
                      onChange={(e) => onInputChange('weightUnit', e.target.value)}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
                    >
                      {weightUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dimensions (L × W × H)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={dimensions.length || ''}
                      onChange={(e) => updateDimension('length', e.target.value)}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                      placeholder="Length"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={dimensions.width || ''}
                      onChange={(e) => updateDimension('width', e.target.value)}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={dimensions.height || ''}
                      onChange={(e) => updateDimension('height', e.target.value)}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                      placeholder="Height"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <select
                    value={dimensions.unit || 'cm'}
                    onChange={(e) => setDimensions(prev => ({ ...prev, unit: e.target.value }))}
                    className="block w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  >
                    {dimensionUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>

                  {volume && (
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">Volume:</span> {volume} {dimensions.unit}³
                    </div>
                  )}
                </div>
              </div>

              {/* Volumetric Weight */}
              {volumetricWeight && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <FiInfo className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">
                      Volumetric weight: {volumetricWeight} kg (for courier calculation)
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Chargeable weight will be the greater of actual weight and volumetric weight
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Class & Free Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Class */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <FiPackage className="w-5 h-5 text-indigo-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Shipping Class</h4>
              </div>

              <Select
                id="shippingClass"
                options={shippingClasses}
                isLoading={loading}
                value={shippingClasses.find(c => c.value === formData.shippingClass)}
                onChange={(selected) => onInputChange('shippingClass', selected?.value)}
                className="react-select"
                classNamePrefix="select"
                placeholder="Select shipping class..."
                isClearable
                formatOptionLabel={({ label, description }) => (
                  <div>
                    <div className="font-medium">{label}</div>
                    {description && <div className="text-xs text-gray-500">{description}</div>}
                  </div>
                )}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    padding: '2px',
                    borderColor: '#e5e7eb',
                    '&:hover': { borderColor: '#6366f1' }
                  })
                }}
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Shipping class determines rates and handling
              </p>
            </div>

            {/* Free Shipping */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Free Shipping</h4>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.freeShipping}
                  onClick={() => onInputChange('freeShipping', !formData.freeShipping)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formData.freeShipping ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.freeShipping ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {formData.freeShipping && (
                <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  Free shipping will be applied to this product
                </p>
              )}
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <FiClock className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Estimated Delivery Time</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedDelivery?.min || ''}
                  onChange={(e) => onInputChange('estimatedDelivery', {
                    ...formData.estimatedDelivery,
                    min: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedDelivery?.max || ''}
                  onChange={(e) => onInputChange('estimatedDelivery', {
                    ...formData.estimatedDelivery,
                    max: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <div className="relative">
                  <select
                    value={formData.estimatedDelivery?.unit || 'days'}
                    onChange={(e) => onInputChange('estimatedDelivery', {
                      ...formData.estimatedDelivery,
                      unit: e.target.value
                    })}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Shipping Rates */}
          {formData.weight > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiRefreshCw className="w-5 h-5 text-indigo-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-900">Calculated Shipping Rates</h4>
                  </div>
                  <button
                    onClick={calculateShippingRates}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Recalculate"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {calculatedRates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center">
                        <FiTruck className="w-5 h-5 text-indigo-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rate.method}</p>
                          <p className="text-xs text-gray-500">
                            {rate.estimatedDays.min}-{rate.estimatedDays.max} days • {rate.carrier}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(rate.cost)}</p>
                        {rate.trackingAvailable && (
                          <p className="text-xs text-green-600">Tracking available</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Shipping Rates */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiSettings className="w-5 h-5 text-indigo-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Custom Shipping Rates</h4>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Optional
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addShippingRate}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Rate
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {(formData.shippingRates || []).map((rate, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Shipping Rate {index + 1}</h5>
                      <button
                        onClick={() => removeShippingRate(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Method
                        </label>
                        <input
                          type="text"
                          value={rate.method || ''}
                          onChange={(e) => updateShippingRate(index, 'method', e.target.value)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Standard"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Carrier
                        </label>
                        <input
                          type="text"
                          value={rate.carrier || ''}
                          onChange={(e) => updateShippingRate(index, 'carrier', e.target.value)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., FedEx"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Cost
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rate.cost || 0}
                            onChange={(e) => updateShippingRate(index, 'cost', parseFloat(e.target.value))}
                            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Currency
                        </label>
                        <input
                          type="text"
                          value={rate.currency || formData.currency || 'USD'}
                          onChange={(e) => updateShippingRate(index, 'currency', e.target.value)}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="USD"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Min Days
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rate.estimatedDays?.min || 1}
                          onChange={(e) => updateShippingRate(index, 'estimatedDays.min', parseInt(e.target.value))}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Max Days
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rate.estimatedDays?.max || 5}
                          onChange={(e) => updateShippingRate(index, 'estimatedDays.max', parseInt(e.target.value))}
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={rate.trackingAvailable || false}
                            onChange={(e) => updateShippingRate(index, 'trackingAvailable', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-600">Tracking available</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Locations
                        </label>
                        <Select
                          isMulti
                          options={countries}
                          value={countries.filter(c => rate.locations?.includes(c.value))}
                          onChange={(selected) => updateShippingRate(index, 'locations', selected.map(s => s.value))}
                          className="react-select"
                          classNamePrefix="select"
                          placeholder="Select locations"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '0.5rem',
                              minHeight: '38px',
                              borderColor: '#e5e7eb'
                            })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(formData.shippingRates || []).length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FiTruck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">No custom shipping rates added</p>
                  <p className="text-xs text-gray-400">Add custom rates for specific shipping methods</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Special Handling */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowAdvancedShipping(!showAdvancedShipping)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Special Handling</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              Optional
            </span>
          </div>
          {showAdvancedShipping ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showAdvancedShipping && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="space-y-6 mt-4">
              {/* Hazardous Materials */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FiAlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                    <div>
                      <label htmlFor="hazardous" className="text-sm font-medium text-gray-700">
                        Hazardous Materials
                      </label>
                      <p className="text-xs text-gray-500">Product contains dangerous goods</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.hazardous}
                    onClick={() => onInputChange('hazardous', !formData.hazardous)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formData.hazardous ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.hazardous ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.hazardous && (
                  <div className="mt-4">
                    <label htmlFor="hazardousClass" className="block text-xs font-medium text-gray-600 mb-1">
                      Hazard Class
                    </label>
                    <input
                      type="text"
                      id="hazardousClass"
                      value={formData.hazardousClass || ''}
                      onChange={(e) => onInputChange('hazardousClass', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Flammable, Corrosive"
                    />
                  </div>
                )}
              </div>

              {/* Perishable */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FiSun className="w-5 h-5 text-yellow-500 mr-2" />
                    <div>
                      <label htmlFor="perishable" className="text-sm font-medium text-gray-700">
                        Perishable Item
                      </label>
                      <p className="text-xs text-gray-500">Product has limited shelf life</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.perishable}
                    onClick={() => onInputChange('perishable', !formData.perishable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formData.perishable ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.perishable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.perishable && (
                  <div className="mt-4">
                    <label htmlFor="expiryDate" className="block text-xs font-medium text-gray-600 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      id="expiryDate"
                      value={formData.expiryDate || ''}
                      onChange={(e) => onInputChange('expiryDate', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Country of Origin */}
              <div>
                <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Origin
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="countryOfOrigin"
                    value={formData.countryOfOrigin || ''}
                    onChange={(e) => onInputChange('countryOfOrigin', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country.value} value={country.value}>
                        {country.flag} {country.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center">
                  <FiInfo className="w-3 h-3 mr-1" />
                  Used for customs and duties calculation
                </p>
              </div>

              {/* Storage Requirements */}
              <div>
                <label htmlFor="storageRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Requirements
                </label>
                <input
                  type="text"
                  id="storageRequirements"
                  value={formData.storageRequirements || ''}
                  onChange={(e) => onInputChange('storageRequirements', e.target.value)}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  placeholder="e.g., Keep dry, temperature controlled"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shipping Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Shipping Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.requiresShipping ? 
                <FiCheckCircle className="w-6 h-6 mx-auto text-green-500" /> : 
                <FiXCircle className="w-6 h-6 mx-auto text-gray-400" />
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">Requires Shipping</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formData.weight || 0}</div>
            <div className="text-xs text-gray-500">Weight ({formData.weightUnit || 'g'})</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {(formData.shippingRates || []).length}
            </div>
            <div className="text-xs text-gray-500">Custom Rates</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formData.freeShipping ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Free Shipping</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingTab;