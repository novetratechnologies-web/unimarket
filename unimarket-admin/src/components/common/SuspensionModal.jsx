// admin/src/components/common/SuspensionModal.jsx
import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  Clock,
  Calendar,
  Loader,
  Ban,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';

const SuspensionModal = ({ customer, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    duration: 7,
    notifyCustomer: true,
    suspendOrders: true,
    preventLogin: true,
    customMessage: ''
  });
  const [errors, setErrors] = useState({});

  const durationOptions = [
    { value: 1, label: '1 Day' },
    { value: 3, label: '3 Days' },
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' },
    { value: 730, label: '2 Years' },
    { value: 0, label: 'Permanent (Until Unsuspended)' }
  ];

  const reasonOptions = [
    'Violation of Terms of Service',
    'Suspicious Activity',
    'Payment Issues',
    'Abusive Behavior',
    'Spam Activity',
    'Fraudulent Activity',
    'Security Concern',
    'Multiple Failed Login Attempts',
    'Unauthorized Access Attempt',
    'Customer Request',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason) {
      newErrors.reason = 'Please select a reason for suspension';
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

  const getSuspensionEndDate = () => {
    if (formData.duration === 0) return 'Permanent';
    const date = new Date();
    date.setDate(date.getDate() + parseInt(formData.duration));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-red-600 to-red-700">
            <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
              }}
            />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Ban className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Suspend Customer</h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {customer?.firstName || ''} {customer?.lastName || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Warning Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Suspension Warning</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Suspending this customer will restrict their access to the platform. 
                      They will not be able to log in, place orders, or use any services.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{customer?.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="text-sm font-medium text-gray-900">{customer?.orderCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="text-sm font-medium text-gray-900">
                      KES {(customer?.totalSpent || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a reason</option>
                  {reasonOptions.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {formData.duration > 0 && (
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Account will be automatically unsuspended on {getSuspensionEndDate()}
                  </p>
                )}
                {formData.duration === 0 && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Permanent suspension requires manual unsuspension
                  </p>
                )}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message to Customer (Optional)
                </label>
                <textarea
                  name="customMessage"
                  value={formData.customMessage}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter a message explaining why they are being suspended..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will be included in the suspension email
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="notifyCustomer"
                    checked={formData.notifyCustomer}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Send email notification to customer</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="suspendOrders"
                    checked={formData.suspendOrders}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Cancel all pending orders</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="preventLogin"
                    checked={formData.preventLogin}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Force logout and invalidate all sessions</span>
                </label>
              </div>

              {/* Effects Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                  <Info className="h-4 w-4 mr-2" />
                  Suspension Effects
                </h4>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Customer will be immediately logged out
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    All active sessions will be terminated
                  </li>
                  {formData.suspendOrders && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Pending orders will be cancelled
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Cannot log in until suspension is lifted
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Cannot place new orders
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Customer data is preserved
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Suspending...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Customer
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

export default SuspensionModal;