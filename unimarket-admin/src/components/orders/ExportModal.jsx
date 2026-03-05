// admin/src/components/orders/ExportModal.jsx
import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  File,
  Calendar,
  Settings,
  Check,
  RefreshCw,
  Database
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const ExportModal = ({ selectedOrders, filters, onClose, onExport }) => {
  const [format, setFormat] = useState('csv');
  const [fields, setFields] = useState({
    orderNumber: true,
    orderDate: true,
    customerName: true,
    customerEmail: true,
    subtotal: true,
    discountTotal: true,
    shippingTotal: true,
    taxTotal: true,
    total: true,
    paymentStatus: true,
    fulfillmentStatus: true,
    status: true,
    items: false,
    shippingAddress: false,
    billingAddress: false,
    paymentMethod: false,
    trackingNumber: false
  });
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [fileName, setFileName] = useState(`orders-export-${new Date().toISOString().split('T')[0]}`);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const { showToast } = useToast();

  const formats = [
    { id: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { id: 'pdf', label: 'PDF', icon: File, description: 'PDF document' },
    { id: 'json', label: 'JSON', icon: FileJson, description: 'JSON data format' }
  ];

  const fieldGroups = [
    {
      name: 'Order Information',
      fields: ['orderNumber', 'orderDate', 'status']
    },
    {
      name: 'Customer Information',
      fields: ['customerName', 'customerEmail', 'shippingAddress', 'billingAddress']
    },
    {
      name: 'Financial Information',
      fields: ['subtotal', 'discountTotal', 'shippingTotal', 'taxTotal', 'total', 'paymentStatus', 'paymentMethod']
    },
    {
      name: 'Fulfillment Information',
      fields: ['fulfillmentStatus', 'trackingNumber', 'items']
    }
  ];

  const handleSelectAll = () => {
    const newFields = {};
    Object.keys(fields).forEach(key => {
      newFields[key] = true;
    });
    setFields(newFields);
  };

  const handleDeselectAll = () => {
    const newFields = {};
    Object.keys(fields).forEach(key => {
      newFields[key] = false;
    });
    setFields(newFields);
  };

  const handleGeneratePreview = async () => {
    try {
      setLoading(true);
      
      const params = {
        format: 'json',
        limit: 5,
        ...(selectedOrders.length > 0 ? { orderIds: selectedOrders.join(',') } : filters),
        fields: Object.keys(fields).filter(key => fields[key]).join(',')
      };

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const response = await api.orders.export(params);
      setPreview(response.data || response);
    } catch (error) {
      showToast(error.message || 'Failed to generate preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const params = {
        format,
        ...(selectedOrders.length > 0 ? { orderIds: selectedOrders.join(',') } : filters),
        fields: Object.keys(fields).filter(key => fields[key]).join(','),
        includeHeaders
      };

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      let response;
      
      if (format === 'csv') {
        response = await api.orders.export({ ...params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (format === 'excel') {
        response = await api.orders.export({ ...params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (format === 'pdf') {
        response = await api.orders.export({ ...params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        response = await api.orders.export(params);
        const dataStr = JSON.stringify(response, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${fileName}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }

      showToast(`Orders exported as ${format.toUpperCase()}`, 'success');
      onExport(format, { fileName, fields, dateRange });
      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to export orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Export Orders</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white text-opacity-90">
              {selectedOrders.length > 0 
                ? `Export ${selectedOrders.length} selected orders`
                : 'Export all orders matching current filters'}
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formats.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`p-4 border rounded-xl text-left transition-all ${
                          format === f.id
                            ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600 ring-opacity-20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${
                          format === f.id ? 'text-primary-600' : 'text-gray-600'
                        }`} />
                        <p className={`font-medium ${
                          format === f.id ? 'text-primary-700' : 'text-gray-900'
                        }`}>{f.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{f.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Date Range
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dateRange"
                        value="all"
                        checked={dateRange === 'all'}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">All orders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dateRange"
                        value="today"
                        checked={dateRange === 'today'}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Today</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dateRange"
                        value="week"
                        checked={dateRange === 'week'}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">This week</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dateRange"
                        value="month"
                        checked={dateRange === 'month'}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">This month</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dateRange"
                        value="custom"
                        checked={dateRange === 'custom'}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Custom</span>
                    </label>
                  </div>

                  {dateRange === 'custom' && (
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Fields to Export
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fieldGroups.map((group) => (
                    <div key={group.name} className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {group.name}
                      </h4>
                      {group.fields.map((field) => (
                        <label key={field} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fields[field]}
                            onChange={(e) => setFields(prev => ({
                              ...prev,
                              [field]: e.target.checked
                            }))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Options
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include column headers</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Preview (First 5 rows)
                  </label>
                  <button
                    onClick={handleGeneratePreview}
                    disabled={loading}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Preview'
                    )}
                  </button>
                </div>

                {preview && (
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(preview, null, 2)}
                    </pre>
                  </div>
                )}

                {!preview && !loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Click "Generate Preview" to see a sample of your export
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;