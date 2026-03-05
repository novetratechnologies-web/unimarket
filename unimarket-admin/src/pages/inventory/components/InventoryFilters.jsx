// admin/src/pages/inventory/components/InventoryFilters.jsx
import React from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

const InventoryFilters = ({ filters, onFilterChange, onReset, categories, vendors }) => {
  const stockStatusOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'pre_order', label: 'Pre-Order' },
    { value: 'backorder', label: 'Backorder' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' }
  ];

  const trackQuantityOptions = [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Tracked' },
    { value: 'false', label: 'Not Tracked' }
  ];

  const backorderOptions = [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Allowed' },
    { value: 'false', label: 'Not Allowed' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'quantity', label: 'Stock Quantity' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'sales.totalQuantity', label: 'Total Sold' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-gray-200"
    >
      <div className="p-4 space-y-4">
        {/* First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Stock Status
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => onFilterChange('stockStatus', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {stockStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Vendor
            </label>
            <select
              value={filters.vendor}
              onChange={(e) => onFilterChange('vendor', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.vendorProfile?.storeName || vendor.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row - Price & Quantity Ranges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min Price */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              placeholder="999999.99"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Min Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Min Quantity
            </label>
            <input
              type="number"
              min="0"
              value={filters.minQuantity}
              onChange={(e) => onFilterChange('minQuantity', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Max Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Max Quantity
            </label>
            <input
              type="number"
              min="0"
              value={filters.maxQuantity}
              onChange={(e) => onFilterChange('maxQuantity', e.target.value)}
              placeholder="999999"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Third Row - Checkboxes & Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => onFilterChange('lowStock', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Low Stock Only</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.outOfStock}
              onChange={(e) => onFilterChange('outOfStock', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Out of Stock Only</span>
          </label>

          <div>
            <select
              value={filters.trackQuantity}
              onChange={(e) => onFilterChange('trackQuantity', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {trackQuantityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.allowBackorder}
              onChange={(e) => onFilterChange('allowBackorder', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {backorderOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fourth Row - Sort & Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sort Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => onFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Created From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Created To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryFilters;