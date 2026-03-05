// admin/src/components/common/DeleteConfirmationModal.jsx
import React from 'react';
import { X, AlertTriangle, Loader, Trash2, AlertCircle, Shield, Ban, Info } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  title, 
  message, 
  details, 
  onClose, 
  onConfirm,
  isLoading = false,
  itemName = '',
  severity = 'danger' // 'danger', 'warning', 'info'
}) => {
  const severityConfig = {
    danger: {
      gradient: 'from-rose-600 to-red-600',
      light: 'bg-rose-50',
      lighter: 'bg-rose-50/50',
      text: 'text-rose-600',
      textDark: 'text-rose-700',
      border: 'border-rose-200',
      borderLight: 'border-rose-100',
      icon: AlertTriangle,
      iconBg: 'bg-rose-100',
      button: 'bg-rose-600 hover:bg-rose-700',
      buttonLight: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
      ring: 'focus:ring-rose-500',
      shadow: 'shadow-rose-100'
    },
    warning: {
      gradient: 'from-amber-500 to-orange-500',
      light: 'bg-amber-50',
      lighter: 'bg-amber-50/50',
      text: 'text-amber-600',
      textDark: 'text-amber-700',
      border: 'border-amber-200',
      borderLight: 'border-amber-100',
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700',
      buttonLight: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
      ring: 'focus:ring-amber-500',
      shadow: 'shadow-amber-100'
    },
    info: {
      gradient: 'from-sky-500 to-blue-600',
      light: 'bg-sky-50',
      lighter: 'bg-sky-50/50',
      text: 'text-sky-600',
      textDark: 'text-sky-700',
      border: 'border-sky-200',
      borderLight: 'border-sky-100',
      icon: Info,
      iconBg: 'bg-sky-100',
      button: 'bg-sky-600 hover:bg-sky-700',
      buttonLight: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
      ring: 'focus:ring-sky-500',
      shadow: 'shadow-sky-100'
    }
  };

  const config = severityConfig[severity] || severityConfig.danger;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div 
          // className="fixed inset-0 transition-opacity bg-gray-900/40 backdrop-blur-sm z-(-500)" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Modern Gradient */}
          <div className={`relative px-6 py-5 bg-gradient-to-r ${config.gradient}`}>
            {/* Subtle Pattern Overlay */}
             <div className="absolute inset-0 opacity-20" 
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
                  }}
                />
                          
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {title || 'Confirm Delete'}
                  </h3>
                  {itemName && (
                    <p className="text-sm text-white/80 mt-0.5 font-medium">
                      {itemName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-all group disabled:opacity-50 hover:scale-110"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Icon Container */}
              <div className={`flex-shrink-0 w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center ring-8 ring-white`}>
                <Ban className={`h-6 w-6 ${config.text}`} />
              </div>
              
              <div className="flex-1">
                <p className="text-gray-900 font-semibold text-base mb-2">
                  {message || 'Are you sure you want to delete this item?'}
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  This action cannot be undone. All associated data will be permanently removed from the system.
                </p>

                {/* Details Card */}
                {details && (
                  <div className={`${config.light} border ${config.borderLight} rounded-xl p-4`}>
                    <div className="flex items-center mb-2">
                      <AlertCircle className={`h-4 w-4 ${config.text} mr-2`} />
                      <span className={`text-xs font-semibold uppercase tracking-wider ${config.textDark}`}>
                        Item Details
                      </span>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {details}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer with Modern Buttons */}
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center bg-white shadow-sm hover:shadow"
            >
              Cancel
            </button>
            
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 ${config.button} text-white rounded-xl hover:shadow-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md min-w-[110px] justify-center group`}
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default DeleteConfirmationModal;