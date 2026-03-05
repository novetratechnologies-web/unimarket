// admin/src/components/common/BulkActionModalEnhanced.jsx
import React, { useState } from 'react';
import {
  X,
  Users,
  AlertCircle,
  CheckCircle,
  Loader,
  UserCheck,
  UserX,
  Ban,
  Shield,
  Mail,
  Bell,
  Clock,
  Calendar,
  Tag,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Unlock,
  Key,
  KeyRound,
  Trash2,
  RotateCcw,
  Archive,
  ArchiveRestore,
  ArchiveX
} from 'lucide-react';

const BulkActionModalEnhanced = ({ 
  action,
  selectedCount = 0,
  onClose,
  onConfirm,
  showReason = false,
  showDuration = false,
  showTags = false,
  showFields = false
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: confirm, 2: options, 3: preview
  const [formData, setFormData] = useState({
    reason: '',
    duration: 7,
    status: 'active',
    tags: [],
    newTag: '',
    fields: [],
    notifyCustomers: true,
    sendEmail: true,
    addNote: true,
    note: '',
    previewData: null,
    confirmAction: false,
    backupFirst: true,
    schedule: false,
    scheduleDate: '',
    scheduleTime: '',
    priority: 'normal'
  });
  const [errors, setErrors] = useState({});

  const actionConfig = {
    activate: {
      icon: UserCheck,
      title: 'Bulk Activate',
      gradient: 'from-green-600 to-emerald-600',
      button: 'bg-green-600 hover:bg-green-700',
      lightBg: 'bg-green-50',
      lightBorder: 'border-green-200',
      text: 'text-green-600',
      message: `Activate ${selectedCount} selected accounts`,
      description: 'This will restore access for all selected customers.',
      iconBg: 'bg-green-100'
    },
    deactivate: {
      icon: UserX,
      title: 'Bulk Deactivate',
      gradient: 'from-yellow-600 to-amber-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      lightBg: 'bg-yellow-50',
      lightBorder: 'border-yellow-200',
      text: 'text-yellow-600',
      message: `Deactivate ${selectedCount} selected accounts`,
      description: 'This will prevent access for all selected customers.',
      iconBg: 'bg-yellow-100'
    },
    suspend: {
      icon: Ban,
      title: 'Bulk Suspend',
      gradient: 'from-red-600 to-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      lightBg: 'bg-red-50',
      lightBorder: 'border-red-200',
      text: 'text-red-600',
      message: `Suspend ${selectedCount} selected accounts`,
      description: 'Temporarily restrict access for all selected customers.',
      iconBg: 'bg-red-100'
    },
    verify: {
      icon: CheckCircle,
      title: 'Bulk Verify',
      gradient: 'from-blue-600 to-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      lightBg: 'bg-blue-50',
      lightBorder: 'border-blue-200',
      text: 'text-blue-600',
      message: `Verify ${selectedCount} selected accounts`,
      description: 'Mark all selected accounts as verified.',
      iconBg: 'bg-blue-100'
    },
    'soft-delete': {
      icon: Archive,
      title: 'Bulk Move to Trash',
      gradient: 'from-gray-600 to-gray-700',
      button: 'bg-gray-600 hover:bg-gray-700',
      lightBg: 'bg-gray-50',
      lightBorder: 'border-gray-200',
      text: 'text-gray-600',
      message: `Move ${selectedCount} accounts to trash`,
      description: 'Soft delete all selected accounts.',
      iconBg: 'bg-gray-100'
    },
    restore: {
      icon: RotateCcw,
      title: 'Bulk Restore',
      gradient: 'from-green-600 to-emerald-600',
      button: 'bg-green-600 hover:bg-green-700',
      lightBg: 'bg-green-50',
      lightBorder: 'border-green-200',
      text: 'text-green-600',
      message: `Restore ${selectedCount} accounts from trash`,
      description: 'Recover all selected accounts from trash.',
      iconBg: 'bg-green-100'
    },
    'permanent-delete': {
      icon: Trash2,
      title: 'Bulk Permanent Delete',
      gradient: 'from-red-600 to-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      lightBg: 'bg-red-50',
      lightBorder: 'border-red-200',
      text: 'text-red-600',
      message: `Permanently delete ${selectedCount} accounts`,
      description: 'This action cannot be undone!',
      iconBg: 'bg-red-100'
    }
  };

  const config = actionConfig[action] || actionConfig.activate;
  const Icon = config.icon;

  const durationOptions = [
    { value: 1, label: '1 Day' },
    { value: 3, label: '3 Days' },
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 0, label: 'Permanent (Until Unsuspended)' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: 'blue' },
    { value: 'normal', label: 'Normal Priority', color: 'green' },
    { value: 'high', label: 'High Priority', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const validateStep = () => {
    const newErrors = {};

    if (step === 2) {
      if (showReason && !formData.reason?.trim()) {
        newErrors.reason = 'Please provide a reason';
      }
      if (showDuration && !formData.duration) {
        newErrors.duration = 'Please select a duration';
      }
      if (formData.schedule && (!formData.scheduleDate || !formData.scheduleTime)) {
        newErrors.schedule = 'Please select schedule date and time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({
        ...formData,
        action
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && formData.newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: ''
        }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Pattern overlay component
  const PatternOverlay = () => (
    <div className="absolute inset-0 opacity-20" 
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
      }}
    />
  );

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Warning Alert */}
            <div className={`${config.lightBg} border ${config.lightBorder} rounded-xl p-5`}>
              <div className="flex">
                <div className={`flex-shrink-0 w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center mr-4`}>
                  <AlertTriangle className={`h-5 w-5 ${config.text}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-base font-semibold ${config.text} mb-1`}>Confirm Bulk Action</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{selectedCount}</p>
                <p className="text-xs text-gray-500 mt-1">customers selected</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">Action</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{config.title}</p>
                <p className="text-xs text-gray-500 mt-1">{config.message}</p>
              </div>
            </div>

            {/* Impact Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center mb-3">
                <Info className="h-4 w-4 mr-2" />
                Impact Preview
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  All <span className="font-semibold">{selectedCount}</span> selected customers will be affected
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  {action === 'permanent-delete' 
                    ? 'This action cannot be undone' 
                    : 'This action can be reversed if needed'}
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  Affected customers {formData.notifyCustomers ? 'will' : 'will not'} be notified
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  Changes will be logged for audit purposes
                </li>
              </ul>
            </div>

            {/* Backup Option */}
            <label className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                name="backupFirst"
                checked={formData.backupFirst}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Create backup before proceeding</span>
                <p className="text-xs text-gray-500 mt-1">Recommended for bulk operations to ensure data safety</p>
              </div>
            </label>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Reason Input */}
            {showReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Please provide a reason for this bulk action..."
                />
                {errors.reason && (
                  <p className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.reason}
                  </p>
                )}
              </div>
            )}

            {/* Duration Selection */}
            {showDuration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Duration <span className="text-red-500">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${
                    errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.duration && (
                  <p className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.duration}
                  </p>
                )}
              </div>
            )}

            {/* Tags Input */}
            {showTags && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium border border-primary-200"
                    >
                      <Tag className="h-3 w-3 mr-1.5" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 hover:text-primary-900 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    name="newTag"
                    value={formData.newTag}
                    onChange={handleInputChange}
                    onKeyDown={handleAddTag}
                    className="flex-1 min-w-[150px] outline-none text-sm bg-transparent px-2 py-1.5"
                    placeholder={formData.tags.length === 0 ? "Add tags (press Enter)" : ""}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Press Enter to add a tag
                </p>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-400"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Options */}
            <div className="border border-gray-200 rounded-xl p-5">
              <label className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="schedule"
                  checked={formData.schedule}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900">Schedule this action for later</span>
              </label>
              
              {formData.schedule && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      name="scheduleDate"
                      value={formData.scheduleDate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.schedule ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      name="scheduleTime"
                      value={formData.scheduleTime}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.schedule ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}
              {errors.schedule && (
                <p className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.schedule}
                </p>
              )}
            </div>

            {/* Notification Options */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                <Bell className="h-4 w-4 mr-2 text-gray-500" />
                Notification Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="notifyCustomers"
                    checked={formData.notifyCustomers}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Notify affected customers
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Send email notifications
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="addNote"
                    checked={formData.addNote}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Add internal note
                  </span>
                </label>

                {formData.addNote && (
                  <div className="mt-3 pl-7">
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Enter internal note..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-green-800 mb-1">Ready to Execute</h4>
                  <p className="text-sm text-green-700">
                    Please review the details below before confirming this bulk operation
                  </p>
                </div>
              </div>
            </div>

            {/* Action Summary */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Action Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Action:</span>
                  <span className="font-semibold text-gray-900">{config.title}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Affected Customers:</span>
                  <span className="font-semibold text-gray-900">{selectedCount}</span>
                </div>
                {formData.reason && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Reason:</span>
                    <span className="font-medium text-gray-900 max-w-[200px] truncate" title={formData.reason}>
                      {formData.reason}
                    </span>
                  </div>
                )}
                {formData.duration > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">
                      {durationOptions.find(d => d.value === formData.duration)?.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Priority:</span>
                  <span className={`font-medium ${
                    formData.priority === 'low' ? 'text-blue-600' :
                    formData.priority === 'normal' ? 'text-green-600' :
                    formData.priority === 'high' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {priorityOptions.find(p => p.value === formData.priority)?.label}
                  </span>
                </div>
                {formData.schedule && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Scheduled for:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(`${formData.scheduleDate}T${formData.scheduleTime}`).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Summary */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Notification Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className={`h-4 w-4 ${formData.notifyCustomers ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={`text-sm ${formData.notifyCustomers ? 'text-gray-700' : 'text-gray-400'}`}>
                    Notify customers
                  </span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className={`h-4 w-4 ${formData.sendEmail ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={`text-sm ${formData.sendEmail ? 'text-gray-700' : 'text-gray-400'}`}>
                    Send emails
                  </span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className={`h-4 w-4 ${formData.addNote ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={`text-sm ${formData.addNote ? 'text-gray-700' : 'text-gray-400'}`}>
                    Add internal note
                  </span>
                </div>
                {formData.backupFirst && (
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">Create backup</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Summary */}
            {formData.tags.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Tags to Add
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium border border-primary-200"
                    >
                      <Tag className="h-3 w-3 mr-1.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <label className="flex items-start space-x-4 p-5 bg-red-50 border border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
              <input
                type="checkbox"
                name="confirmAction"
                checked={formData.confirmAction}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-red-800">
                  I understand that this action {action === 'permanent-delete' ? 'cannot be undone' : 'may have significant impact'}
                </span>
                <p className="text-xs text-red-600 mt-1">
                  Please confirm that you want to proceed with this bulk operation affecting {selectedCount} customers
                </p>
              </div>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

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
          <div className={`relative px-6 py-5 bg-gradient-to-r ${config.gradient}`}>
            <PatternOverlay />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                  <p className="text-sm text-white/80 mt-1">
                    Step {step} of 3: {step === 1 ? 'Confirm' : step === 2 ? 'Options' : 'Preview'}
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

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6 relative z-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    s === step
                      ? 'bg-white text-gray-900 ring-4 ring-white/30'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white backdrop-blur-sm'
                  }`}>
                    {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-20 h-1 mx-2 rounded-full ${
                      s < step ? 'bg-green-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {getStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{selectedCount}</span> customer{selectedCount !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={loading || !formData.confirmAction}
                  className={`px-5 py-2.5 ${config.button} text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium disabled:opacity-50 flex items-center shadow-md min-w-[140px] justify-center`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Confirm & Execute
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModalEnhanced;