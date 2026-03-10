// components/category/FilterSidebar.jsx
import React, { useState } from 'react';
import { Filter, Grid, Package, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';

// Format price in Kenyan Shillings
const formatKES = (price) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('KES', 'KSh');
};

const FilterSidebar = ({
  priceRange,
  priceRangeLimits,
  onPriceChange,
  filterOptions,
  selectedFilters,
  onFilterChange,
  brands,
  conditions,
  subcategories,
  onSubcategoryClick,
  onClearFilters,
  categoryIcons
}) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brand: true,
    condition: true,
    subcategories: true,
    ...Object.keys(filterOptions).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  // Calculate slider positions as percentages
  const minPercent = ((priceRange.min - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100;
  const maxPercent = ((priceRange.max - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100;

  return (
    <div className="sticky top-24 space-y-6">
      {/* Filter Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-600" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-600 text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Price Range Filter - Enhanced for KES */}
        <div className="mb-6 border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              Price Range (KES)
            </h4>
            {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.price && (
            <div className="space-y-4">
              {/* Price Inputs with KES */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => onPriceChange('min', e.target.value)}
                    placeholder="Min"
                    className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => onPriceChange('max', e.target.value)}
                    placeholder="Max"
                    className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Enhanced Dual Range Slider */}
              <div className="relative pt-6 pb-2">
                {/* Slider track */}
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full absolute"
                    style={{ 
                      left: `${minPercent}%`, 
                      width: `${maxPercent - minPercent}%` 
                    }}
                  ></div>
                </div>
                
                {/* Min slider */}
                <input
                  type="range"
                  min={priceRangeLimits.min}
                  max={priceRangeLimits.max}
                  value={priceRange.min}
                  onChange={(e) => onPriceChange('min', e.target.value)}
                  className="absolute w-full top-4 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  style={{ zIndex: 3 }}
                />
                
                {/* Max slider */}
                <input
                  type="range"
                  min={priceRangeLimits.min}
                  max={priceRangeLimits.max}
                  value={priceRange.max}
                  onChange={(e) => onPriceChange('max', e.target.value)}
                  className="absolute w-full top-4 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  style={{ zIndex: 4 }}
                />
              </div>
              
              {/* Price Range Display */}
              <div className="flex items-center justify-between bg-teal-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Min Price</p>
                  <p className="text-sm font-semibold text-teal-700">{formatKES(priceRange.min)}</p>
                </div>
                <div className="text-gray-300">—</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Max Price</p>
                  <p className="text-sm font-semibold text-teal-700">{formatKES(priceRange.max)}</p>
                </div>
              </div>

              {/* Quick price ranges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[500, 1000, 2000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      onPriceChange('min', priceRangeLimits.min);
                      onPriceChange('max', amount);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-teal-100 rounded-lg text-xs text-gray-700 hover:text-teal-700 transition-colors"
                  >
                    Under {formatKES(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div className="mb-6 border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection('brand')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="text-sm font-medium text-gray-700">Brand</h4>
              {expandedSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSections.brand && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {brands.map((brand) => (
                  <label key={brand.name} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedFilters.brand === brand.name}
                      onChange={() => onFilterChange('brand', brand.name)}
                      className="w-4 h-4 rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-teal-600 transition-colors flex-1">
                      {brand.name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {brand.count}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Condition Filter */}
        {conditions.length > 0 && (
          <div className="mb-6 border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection('condition')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="text-sm font-medium text-gray-700">Condition</h4>
              {expandedSections.condition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSections.condition && (
              <div className="space-y-2">
                {conditions.map((condition) => (
                  <label key={condition.name} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="condition"
                      checked={selectedFilters.condition === condition.name}
                      onChange={() => onFilterChange('condition', condition.name)}
                      className="w-4 h-4 rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-teal-600 transition-colors flex-1">
                      {condition.name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {condition.count}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Attribute Filters */}
        {Object.entries(filterOptions).map(([filterName, options]) => (
          <div key={filterName} className="mb-6 border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection(filterName)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="text-sm font-medium text-gray-700 capitalize">{filterName}</h4>
              {expandedSections[filterName] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSections[filterName] && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {options.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedFilters[filterName] === option.value}
                      onChange={() => onFilterChange(filterName, option.value)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-teal-600 transition-colors flex-1">
                      {option.label}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {option.count || 0}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subcategories */}
      {subcategories?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={() => toggleSection('subcategories')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Grid className="w-5 h-5 text-teal-600" />
              Subcategories
            </h3>
            {expandedSections.subcategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.subcategories && (
            <div className="space-y-2">
              {subcategories.map((sub) => (
                <button
                  key={sub._id}
                  onClick={() => onSubcategoryClick(sub.slug)}
                  className="w-full flex items-center justify-between p-3 hover:bg-teal-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      {categoryIcons[sub.name?.toLowerCase()] || <Package className="w-4 h-4 text-gray-600" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600">
                      {sub.name}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                    {sub.stats?.productCount || 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;