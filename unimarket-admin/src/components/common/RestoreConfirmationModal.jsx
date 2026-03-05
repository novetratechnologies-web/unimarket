// admin/src/components/common/RestoreConfirmationModal.jsx
import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  Shield,
  Info,
  AlertTriangle
} from 'lucide-react';

const RestoreConfirmationModal = ({ 
  title = 'Restore Customer',
  message,
  details,
  onClose,
  onConfirm,
  itemName = '',
  showOptions = true
}) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    restoreOrders: true,
    restoreProfile: true,
    sendNotification: true,
    restoreAddresses: true,
    restorePaymentMethods: true,
    activateAccount: true
  });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(options);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
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
         <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
              }}
            />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  {itemName && (
                    <p className="text-sm text-white/80 mt-0.5">{itemName}</p>
                  )}
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

          <div className="p-6">
            {/* Success Alert */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Restore Information</h4>
                  <p className="text-xs text-green-700 mt-1">
                    {message || 'Restoring this item will recover all associated data and settings.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Card */}
            {details && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Item Details
                </h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {details}
                </pre>
              </div>
            )}

            {/* Restore Options */}
            {showOptions && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  Restore Options
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.restoreOrders}
                      onChange={() => handleOptionChange('restoreOrders')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Restore Orders</span>
                      <p className="text-xs text-gray-500">Recover all order history</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.restoreProfile}
                      onChange={() => handleOptionChange('restoreProfile')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Restore Profile</span>
                      <p className="text-xs text-gray-500">Recover profile data</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.restoreAddresses}
                      onChange={() => handleOptionChange('restoreAddresses')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Restore Addresses</span>
                      <p className="text-xs text-gray-500">Recover saved addresses</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.restorePaymentMethods}
                      onChange={() => handleOptionChange('restorePaymentMethods')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Restore Payments</span>
                      <p className="text-xs text-gray-500">Recover payment methods</p>
                    </div>
                  </label>
                </div>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.activateAccount}
                    onChange={() => handleOptionChange('activateAccount')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Activate Account</span>
                    <p className="text-xs text-gray-500">Set account status to active</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.sendNotification}
                    onChange={() => handleOptionChange('sendNotification')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Send Notification</span>
                    <p className="text-xs text-gray-500">Email customer about restoration</p>
                  </div>
                </label>
              </div>
            )}

            {/* Timeline Preview */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="text-sm font-medium text-blue-800 flex items-center mb-3">
                <Clock className="h-4 w-4 mr-2" />
                Expected Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-blue-700">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Profile restoration: Immediate
                </div>
                <div className="flex items-center text-xs text-blue-700">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Order recovery: Within 5 minutes
                </div>
                <div className="flex items-center text-xs text-blue-700">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Data synchronization: Within 10 minutes
                </div>
                <div className="flex items-center text-xs text-blue-700">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Email notification: Within 15 minutes
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  );
};

export default RestoreConfirmationModal;