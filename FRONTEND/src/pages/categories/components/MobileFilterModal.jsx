// components/category/MobileFilterModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const MobileFilterModal = ({
  isOpen,
  onClose,
  priceRange,
  priceRangeLimits,
  onPriceChange,
  filterOptions,
  selectedFilters,
  onFilterChange,
  brands,
  conditions,
  sortBy,
  onSortChange
}) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brand: true,
    condition: true,
    sort: true,
    ...Object.keys(filterOptions).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5 text-teal-600" />
                  Filters & Sort
                  {activeFilterCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-600 text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort Options */}
                <div className="border-b border-gray-100 pb-4">
                  <button
                    onClick={() => toggleSection('sort')}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <h4 className="font-medium text-gray-900">Sort By</h4>
                    {expandedSections.sort ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.sort && (
                    <div className="space-y-2">
                      {['popular', 'newest', 'price-low', 'price-high', 'rating'].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            value={option}
                            checked={sortBy === option}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="w-4 h-4 rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {option.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="border-b border-gray-100 pb-4">
                  <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <h4 className="font-medium text-gray-900">Price Range</h4>
                    {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.price && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => onPriceChange('min', e.target.value)}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => onPriceChange('max', e.target.value)}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Filter */}
                {brands.length > 0 && (
                  <div className="border-b border-gray-100 pb-4">
                    <button
                      onClick={() => toggleSection('brand')}
                      className="flex items-center justify-between w-full mb-3"
                    >
                      <h4 className="font-medium text-gray-900">Brand</h4>
                      {expandedSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {expandedSections.brand && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                          <label key={brand.name} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mobile-brand"
                              checked={selectedFilters.brand === brand.name}
                              onChange={() => onFilterChange('brand', brand.name)}
                              className="w-4 h-4 rounded-full border-gray-300 text-teal-600"
                            />
                            <span className="text-sm text-gray-700 flex-1">{brand.name}</span>
                            <span className="text-xs text-gray-400">({brand.count})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Condition Filter */}
                {conditions.length > 0 && (
                  <div className="border-b border-gray-100 pb-4">
                    <button
                      onClick={() => toggleSection('condition')}
                      className="flex items-center justify-between w-full mb-3"
                    >
                      <h4 className="font-medium text-gray-900">Condition</h4>
                      {expandedSections.condition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {expandedSections.condition && (
                      <div className="space-y-2">
                        {conditions.map((condition) => (
                          <label key={condition.name} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mobile-condition"
                              checked={selectedFilters.condition === condition.name}
                              onChange={() => onFilterChange('condition', condition.name)}
                              className="w-4 h-4 rounded-full border-gray-300 text-teal-600"
                            />
                            <span className="text-sm text-gray-700 flex-1">{condition.name}</span>
                            <span className="text-xs text-gray-400">({condition.count})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Attribute Filters */}
                {Object.entries(filterOptions).map(([filterName, options]) => (
                  <div key={filterName} className="border-b border-gray-100 pb-4">
                    <button
                      onClick={() => toggleSection(filterName)}
                      className="flex items-center justify-between w-full mb-3"
                    >
                      <h4 className="font-medium text-gray-900 capitalize">{filterName}</h4>
                      {expandedSections[filterName] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {expandedSections[filterName] && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {options.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFilters[filterName] === option.value}
                              onChange={() => onFilterChange(filterName, option.value)}
                              className="w-4 h-4 rounded border-gray-300 text-teal-600"
                            />
                            <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                            <span className="text-xs text-gray-400">({option.count || 0})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Apply Button */}
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileFilterModal;