// admin/src/components/orders/FilterPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  Check,
  ChevronDown,
  Filter
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const FilterPanel = ({ filters, onApply, onClear, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [datePreset, setDatePreset] = useState('custom');

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const orderStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'confirmed', label: 'Confirmed', color: 'indigo' },
    { value: 'shipped', label: 'Shipped', color: 'purple' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'purple' },
    { value: 'partially_refunded', label: 'Partially Refunded', color: 'orange' },
    { value: 'disputed', label: 'Disputed', color: 'rose' },
    { value: 'on_hold', label: 'On Hold', color: 'amber' },
    { value: 'failed', label: 'Failed', color: 'rose' },
    { value: 'abandoned', label: 'Abandoned', color: 'gray' }
  ];

  const paymentStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'authorized', label: 'Authorized', color: 'indigo' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'partially_paid', label: 'Partially Paid', color: 'orange' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'purple' },
    { value: 'partially_refunded', label: 'Partially Refunded', color: 'orange' },
    { value: 'disputed', label: 'Disputed', color: 'rose' },
    { value: 'chargeback', label: 'Chargeback', color: 'rose' }
  ];

  const fulfillmentStatuses = [
    { value: 'unfulfilled', label: 'Unfulfilled', color: 'gray' },
    { value: 'partially_fulfilled', label: 'Partially Fulfilled', color: 'orange' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'admin', label: 'Admin' },
    { value: 'api', label: 'API' },
    { value: 'pos', label: 'POS' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'social_media', label: 'Social Media' }
  ];

  const handleStatusToggle = (status) => {
    setLocalFilters(prev => {
      const current = prev.status || [];
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const handlePaymentStatusToggle = (status) => {
    setLocalFilters(prev => {
      const current = prev.paymentStatus || [];
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, paymentStatus: updated };
    });
  };

  const handleFulfillmentStatusToggle = (status) => {
    setLocalFilters(prev => {
      const current = prev.fulfillmentStatus || [];
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, fulfillmentStatus: updated };
    });
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end }
        }));
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      default:
        // custom - do nothing
        break;
    }
  };

  const handleClearAll = () => {
    setLocalFilters({
      search: '',
      status: [],
      paymentStatus: [],
      fulfillmentStatus: [],
      dateRange: { start: null, end: null },
      amountRange: { min: null, max: null },
      customer: '',
      vendor: '',
      tags: []
    });
    setDatePreset('custom');
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.paymentStatus?.length) count += localFilters.paymentStatus.length;
    if (localFilters.fulfillmentStatus?.length) count += localFilters.fulfillmentStatus.length;
    if (localFilters.dateRange?.start) count += 1;
    if (localFilters.amountRange?.min || localFilters.amountRange?.max) count += 1;
    if (localFilters.customer) count += 1;
    if (localFilters.vendor) count += 1;
    if (localFilters.tags?.length) count += localFilters.tags.length;
    return count;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Order Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-1 text-gray-500" />
              Order Status
            </label>
            <div className="flex flex-wrap gap-2">
              {orderStatuses.map((status) => {
                const isSelected = localFilters.status?.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusToggle(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-${status.color}-100 text-${status.color}-700 border-2 border-${status.color}-300`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
              Payment Status
            </label>
            <div className="flex flex-wrap gap-2">
              {paymentStatuses.map((status) => {
                const isSelected = localFilters.paymentStatus?.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => handlePaymentStatusToggle(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-${status.color}-100 text-${status.color}-700 border-2 border-${status.color}-300`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fulfillment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Truck className="h-4 w-4 mr-1 text-gray-500" />
              Fulfillment Status
            </label>
            <div className="flex flex-wrap gap-2">
              {fulfillmentStatuses.map((status) => {
                const isSelected = localFilters.fulfillmentStatus?.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => handleFulfillmentStatusToggle(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-${status.color}-100 text-${status.color}-700 border-2 border-${status.color}-300`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
              Date Range
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDatePreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      datePreset === preset
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {(datePreset === 'custom' || localFilters.dateRange?.start) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <DatePicker
                      selected={localFilters.dateRange?.start}
                      onChange={(date) => setLocalFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: date }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholderText="Select start date"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <DatePicker
                      selected={localFilters.dateRange?.end}
                      onChange={(date) => setLocalFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: date }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholderText="Select end date"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
              Order Amount
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.amountRange?.min || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, min: e.target.value ? parseFloat(e.target.value) : null }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.amountRange?.max || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, max: e.target.value ? parseFloat(e.target.value) : null }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1 text-gray-500" />
              Customer
            </label>
            <input
              type="text"
              placeholder="Search by customer name or email"
              value={localFilters.customer || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, customer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-1 text-gray-500" />
              Vendor
            </label>
            <input
              type="text"
              placeholder="Filter by vendor"
              value={localFilters.vendor || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-1 text-gray-500" />
              Tags
            </label>
            <input
              type="text"
              placeholder="Enter tags (comma-separated)"
              value={localFilters.tags?.join(', ') || ''}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Source</label>
            <select
              value={localFilters.source || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source.value} value={source.value}>{source.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          onClick={handleClearAll}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Clear All
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;