// admin/src/components/common/ExportModal.jsx
import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileJson,
  File,
  Calendar,
  Filter,
  CheckCircle,
  Loader,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
  Clock,
  Globe,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Table,
  Sheet,
  FileSpreadsheet,
  FileCog,
  FileDigit,
  FileCode,
  Mail,
  Bell,
  Tag,
} from 'lucide-react';

const ExportModal = ({ 
  selectedCount = 0,
  filters = {},
  onClose,
  onExport,
  availableFields = []
}) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [delimiter, setDelimiter] = useState('comma');
  const [dateFormat, setDateFormat] = useState('iso');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [compression, setCompression] = useState('none');
  const [selectedFields, setSelectedFields] = useState(
    availableFields.slice(0, 10).map(f => f.key)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileName, setFileName] = useState(`export-${new Date().toISOString().split('T')[0]}`);
  const [emailNotification, setEmailNotification] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [scheduleExport, setScheduleExport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('once');
  const [includeFilters, setIncludeFilters] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: File, color: 'green', description: 'Comma-separated values' },
    { value: 'json', label: 'JSON', icon: FileJson, color: 'yellow', description: 'JSON format' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'emerald', description: 'Excel spreadsheet' },
    { value: 'pdf', label: 'PDF', icon: FileText, color: 'red', description: 'PDF document' }
  ];

  const delimiterOptions = [
    { value: 'comma', label: 'Comma (,)' },
    { value: 'semicolon', label: 'Semicolon (;)' },
    { value: 'tab', label: 'Tab' },
    { value: 'pipe', label: 'Pipe (|)' }
  ];

  const dateFormatOptions = [
    { value: 'iso', label: 'ISO (YYYY-MM-DD)' },
    { value: 'us', label: 'US (MM/DD/YYYY)' },
    { value: 'eu', label: 'European (DD/MM/YYYY)' },
    { value: 'timestamp', label: 'Unix Timestamp' }
  ];

  const compressionOptions = [
    { value: 'none', label: 'None' },
    { value: 'zip', label: 'ZIP' },
    { value: 'gzip', label: 'GZIP' }
  ];

  const frequencyOptions = [
    { value: 'once', label: 'Once (now)' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (selectedFields.length === 0) {
      newErrors.fields = 'Please select at least one field to export';
    }

    if (emailNotification && !emailAddress) {
      newErrors.email = 'Email address is required for notification';
    } else if (emailNotification && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.email = 'Invalid email format';
    }

    if (passwordProtect && !password) {
      newErrors.password = 'Password is required for protected files';
    } else if (passwordProtect && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExport = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onExport(format, {
        fields: selectedFields,
        includeHeaders,
        delimiter: delimiterOptions.find(d => d.value === delimiter)?.label || ',',
        dateFormat,
        includeTimestamps,
        compression,
        fileName,
        emailNotification: emailNotification ? emailAddress : null,
        schedule: scheduleExport ? scheduleFrequency : null,
        includeFilters,
        passwordProtect: passwordProtect ? password : null
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldKey) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields.map(f => f.key));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  // Pattern overlay component
  const PatternOverlay = () => (
    <div className="absolute inset-0 opacity-20" 
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
      }}
    />
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700">
            <PatternOverlay />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Export Data</h3>
                  <p className="text-sm text-white/80 mt-1">
                    {selectedCount > 0 
                      ? `Exporting ${selectedCount} selected customers`
                      : 'Export all customers'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 relative z-10">
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">Total Records</p>
                <p className="text-sm font-semibold text-white">
                  {selectedCount > 0 ? selectedCount : 'All'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">Fields</p>
                <p className="text-sm font-semibold text-white">{selectedFields.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">Format</p>
                <p className="text-sm font-semibold text-white uppercase">{format}</p>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Export Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Export Summary</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {selectedCount > 0 
                      ? `You are about to export ${selectedCount} specific customers. `
                      : 'You are about to export all customers. '
                    }
                    The export will include <span className="font-semibold">{selectedFields.length}</span> fields and be formatted as <span className="font-semibold uppercase">{format}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-4 gap-3">
                {formatOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = format === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormat(option.value)}
                      className={`p-4 border-2 rounded-xl transition-all hover:scale-105 ${
                        isSelected
                          ? `border-${option.color}-600 bg-${option.color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-7 w-7 mx-auto mb-2 ${
                        isSelected ? `text-${option.color}-600` : 'text-gray-500'
                      }`} />
                      <p className={`text-xs font-medium ${
                        isSelected ? `text-${option.color}-600` : 'text-gray-600'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Fields to Export
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={selectAllFields}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-xs text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllFields}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              {errors.fields && (
                <p className="mb-2 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.fields}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-white">
                {availableFields.map(field => (
                  <label
                    key={field.key}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Selected <span className="font-medium text-gray-700">{selectedFields.length}</span> of {availableFields.length} fields
              </p>
            </div>

            {/* File Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter file name"
                />
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-2.5 rounded-lg">
                  .{format}
                </span>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="font-medium">Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-auto" />
              )}
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                {/* CSV Options */}
                {format === 'csv' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delimiter
                    </label>
                    <select
                      value={delimiter}
                      onChange={(e) => setDelimiter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    >
                      {delimiterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {dateFormatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Compression */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression
                  </label>
                  <select
                    value={compression}
                    onChange={(e) => setCompression(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {compressionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Options */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Include headers
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeTimestamps}
                      onChange={(e) => setIncludeTimestamps(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Include timestamps
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeFilters}
                      onChange={(e) => setIncludeFilters(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Include filter criteria in export
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={passwordProtect}
                      onChange={(e) => setPasswordProtect(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Password protect file
                    </span>
                  </label>

                  {passwordProtect && (
                    <div className="mt-3 pl-7">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.password}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Notification */}
            <div className="mb-6 p-5 border border-gray-200 rounded-xl">
              <label className="flex items-center space-x-3 mb-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  Email notification when complete
                </span>
              </label>
              
              {emailNotification && (
                <div className="mt-3">
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Schedule Export */}
            <div className="mb-6 p-5 border border-gray-200 rounded-xl">
              <label className="flex items-center space-x-3 mb-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={scheduleExport}
                  onChange={(e) => setScheduleExport(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  Schedule recurring export
                </span>
              </label>
              
              {scheduleExport && (
                <div className="mt-3">
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    First export will run immediately, then on the schedule
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Est. size: <span className="font-medium text-gray-900">~{(selectedFields.length * 100).toLocaleString()} KB</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center shadow-md min-w-[100px] justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2 text-black" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;