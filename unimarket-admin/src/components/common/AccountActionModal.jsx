// admin/src/components/common/AccountActionModal.jsx
import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserX,
  Shield,
  AlertCircle,
  Loader,
  CheckCircle,
  Mail,
  Bell,
  Clock,
  Info,
  AlertTriangle,
  Ban,
  FileText
} from 'lucide-react';

const AccountActionModal = ({ 
  title,
  message,
  details,
  onClose,
  onConfirm,
  actionType = 'activate',
  showReason = false,
  showDuration = false,
  itemName = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    duration: 7,
    notifyCustomer: true,
    sendEmail: true,
    addNote: true,
    note: ''
  });
  const [errors, setErrors] = useState({});

  const actionConfig = {
    activate: {
      icon: UserCheck,
      gradient: 'from-green-600 to-emerald-600',
      button: 'bg-green-600 hover:bg-green-700',
      lightBg: 'bg-green-50',
      lightBorder: 'border-green-200',
      text: 'text-green-600',
      message: 'This will restore full access to the account.',
      iconBg: 'bg-green-100'
    },
    deactivate: {
      icon: UserX,
      gradient: 'from-yellow-600 to-amber-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      lightBg: 'bg-yellow-50',
      lightBorder: 'border-yellow-200',
      text: 'text-yellow-600',
      message: 'This will prevent the user from logging in.',
      iconBg: 'bg-yellow-100'
    },
    verify: {
      icon: CheckCircle,
      gradient: 'from-blue-600 to-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      lightBg: 'bg-blue-50',
      lightBorder: 'border-blue-200',
      text: 'text-blue-600',
      message: 'This will mark the account as verified.',
      iconBg: 'bg-blue-100'
    },
    unverify: {
      icon: AlertCircle,
      gradient: 'from-gray-600 to-gray-700',
      button: 'bg-gray-600 hover:bg-gray-700',
      lightBg: 'bg-gray-50',
      lightBorder: 'border-gray-200',
      text: 'text-gray-600',
      message: 'This will remove verification status.',
      iconBg: 'bg-gray-100'
    },
    lock: {
      icon: Shield,
      gradient: 'from-red-600 to-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      lightBg: 'bg-red-50',
      lightBorder: 'border-red-200',
      text: 'text-red-600',
      message: 'This will temporarily lock the account.',
      iconBg: 'bg-red-100'
    },
    unlock: {
      icon: Ban,
      gradient: 'from-green-600 to-emerald-600',
      button: 'bg-green-600 hover:bg-green-700',
      lightBg: 'bg-green-50',
      lightBorder: 'border-green-200',
      text: 'text-green-600',
      message: 'This will unlock the account.',
      iconBg: 'bg-green-100'
    }
  };

  const config = actionConfig[actionType] || actionConfig.activate;
  const Icon = config.icon;

  const durationOptions = [
    { value: 1, label: '1 Hour' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' },
    { value: 48, label: '48 Hours' },
    { value: 72, label: '3 Days' },
    { value: 168, label: '7 Days' },
    { value: 0, label: 'Until Manual Unlock' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (showReason && !formData.reason?.trim()) {
      newErrors.reason = 'Please provide a reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onConfirm(formData);
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

        {/* Modal - Centered with proper size */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className={`relative px-6 py-5 bg-gradient-to-r ${config.gradient}`}>
            <PatternOverlay />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  {itemName && (
                    <p className="text-sm text-white/80 mt-1">{itemName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[calc(80vh-200px)] overflow-y-auto">
              {/* Info Alert */}
              <div className={`${config.lightBg} border ${config.lightBorder} rounded-xl p-4 mb-6`}>
                <div className="flex">
                  <div className={`flex-shrink-0 w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center mr-3`}>
                    <Info className={`h-4 w-4 ${config.text}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${config.text} mb-1`}>
                      {message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Account`}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {config.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Card */}
              {details && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Account Details
                  </h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-gray-100">
                    {details}
                  </pre>
                </div>
              )}

              {/* Reason Input */}
              {showReason && (
                <div className="mb-6">
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
                    placeholder="Please provide a reason for this action..."
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-gray-500" />
                  Notification Options
                </h4>
                
                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="notifyCustomer"
                      checked={formData.notifyCustomer}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Notify customer about this action
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="sendEmail"
                      checked={formData.sendEmail}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Send email confirmation
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="addNote"
                      checked={formData.addNote}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
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

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 ${config.button} text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium disabled:opacity-50 flex items-center shadow-md min-w-[100px] justify-center`}
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4 mr-2" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountActionModal;