// admin/src/components/common/BulkActionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  RefreshCw,
  Check,
  Users,
  UserCheck,
  UserX,
  Mail,
  Trash2,
  Archive,
  Download,
  Send,
  Ban,
  Clock,
  AlertCircle,
  Shield,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Settings,
  Copy,
  Eye,
  Edit
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Status configuration matching CustomersPage
const CUSTOMER_STATUS = {
  active: {
    label: 'Active',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    iconColor: 'text-green-600'
  },
  inactive: {
    label: 'Inactive',
    icon: UserX,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-600'
  },
  suspended: {
    label: 'Suspended',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    iconColor: 'text-red-600'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    iconColor: 'text-yellow-600'
  }
};

// Export formats
const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV (Excel)', icon: FileText, description: 'Comma-separated values' },
  { value: 'excel', label: 'Excel', icon: FileText, description: 'Microsoft Excel format' },
  { value: 'pdf', label: 'PDF', icon: FileText, description: 'PDF document' },
  { value: 'json', label: 'JSON', icon: FileText, description: 'Raw JSON data' }
];

// Email templates
const EMAIL_TEMPLATES = [
  { value: 'welcome', label: 'Welcome Email', description: 'Send welcome message to new customers' },
  { value: 'promotion', label: 'Promotional', description: 'Send promotional offers and discounts' },
  { value: 'newsletter', label: 'Newsletter', description: 'Send monthly newsletter' },
  { value: 'verification', label: 'Verification', description: 'Request email verification' },
  { value: 'custom', label: 'Custom Message', description: 'Write your own message' }
];

const BulkActionModal = ({ action, selectedCount, onClose, onConfirm }) => {
  const [status, setStatus] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendOptions, setSendOptions] = useState({
    sendCopy: false,
    schedule: false,
    scheduleDate: null
  });
  const { showToast } = useToast();

  // Reset state when action changes
  useEffect(() => {
    setStep(1);
    setStatus('');
    setConfirmText('');
    setSelectedFormat('');
    setSelectedTemplate('');
    setEmailSubject('');
    setEmailBody('');
    setSendOptions({
      sendCopy: false,
      schedule: false,
      scheduleDate: null
    });
  }, [action]);

  const getActionConfig = () => {
    switch (action) {
      case 'status':
        return {
          title: 'Update Status',
          icon: Settings,
          description: `Change status for ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'primary'
        };
      case 'delete':
        return {
          title: 'Delete Customers',
          icon: Trash2,
          description: `Permanently delete ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: true,
          confirmMessage: `Type "DELETE" to confirm`,
          color: 'red'
        };
      case 'email':
        return {
          title: 'Send Email',
          icon: Mail,
          description: `Send email to ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'blue',
          multiStep: true
        };
      case 'export':
        return {
          title: 'Export Customers',
          icon: Download,
          description: `Export ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'green',
          multiStep: true
        };
      case 'verify':
        return {
          title: 'Verify Customers',
          icon: CheckCircle,
          description: `Mark ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''} as verified`,
          confirmRequired: false,
          color: 'green'
        };
      case 'suspend':
        return {
          title: 'Suspend Customers',
          icon: Ban,
          description: `Suspend ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: true,
          confirmMessage: 'Type "SUSPEND" to confirm',
          color: 'red'
        };
      case 'activate':
        return {
          title: 'Activate Customers',
          icon: UserCheck,
          description: `Activate ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'green'
        };
      case 'archive':
        return {
          title: 'Archive Customers',
          icon: Archive,
          description: `Archive ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'gray'
        };
      default:
        return {
          title: 'Bulk Action',
          icon: Users,
          description: `Perform action on ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}`,
          confirmRequired: false,
          color: 'primary'
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  const getStatusIcon = (statusValue) => {
    const status = CUSTOMER_STATUS[statusValue];
    const StatusIcon = status?.icon || Users;
    return <StatusIcon className={`h-4 w-4 mr-2 ${status?.iconColor || 'text-gray-600'}`} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (config.confirmRequired) {
      const requiredText = action === 'suspend' ? 'SUSPEND' : 'DELETE';
      if (confirmText !== requiredText) {
        showToast(`Please type "${requiredText}" to confirm`, 'error');
        return;
      }
    }

    if (action === 'status' && !status) {
      showToast('Please select a status', 'error');
      return;
    }

    if (action === 'export' && !selectedFormat) {
      showToast('Please select an export format', 'error');
      return;
    }

    if (action === 'email' && step === 1) {
      setStep(2);
      return;
    }

    if (action === 'email' && step === 2) {
      if (!selectedTemplate) {
        showToast('Please select an email template', 'error');
        return;
      }
      if (selectedTemplate === 'custom' && (!emailSubject || !emailBody)) {
        showToast('Please enter email subject and body', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      
      const data = {
        ...(action === 'status' && { status }),
        ...(action === 'export' && { format: selectedFormat }),
        ...(action === 'email' && { 
          template: selectedTemplate,
          subject: emailSubject,
          body: emailBody,
          options: sendOptions
        })
      };

      await onConfirm(data);
      
      showToast(
        <div>
          <p className="font-medium">Action Successful</p>
          <p className="text-sm opacity-90">
            {action === 'delete' && `${selectedCount} customers deleted`}
            {action === 'status' && `${selectedCount} customers updated to ${status}`}
            {action === 'export' && `Export started for ${selectedCount} customers`}
            {action === 'email' && `Email campaign started for ${selectedCount} customers`}
          </p>
        </div>,
        'success'
      );
    } catch (error) {
      showToast(error.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const getHeaderGradient = () => {
    switch (config.color) {
      case 'red':
        return 'from-red-600 to-red-700';
      case 'green':
        return 'from-green-600 to-green-700';
      case 'blue':
        return 'from-blue-600 to-blue-700';
      case 'gray':
        return 'from-gray-600 to-gray-700';
      default:
        return 'from-primary-600 to-blue-600';
    }
  };

  const getButtonColor = () => {
    switch (config.color) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700';
      case 'green':
        return 'bg-green-600 hover:bg-green-700';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'gray':
        return 'bg-gray-600 hover:bg-gray-700';
      default:
        return 'bg-primary-600 hover:bg-primary-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div  onClick={onClose} />

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className={`px-6 py-4 bg-gradient-to-r ${getHeaderGradient()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                  {config.multiStep && (
                    <p className="text-xs text-white/80 mt-0.5">Step {step} of 2</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white/90 flex items-center">
              <Users className="h-4 w-4 mr-1.5" />
              {config.description}
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Step Indicator for multi-step actions */}
            {config.multiStep && (
              <div className="flex items-center justify-between mb-4">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      s === step 
                        ? 'bg-primary-600 text-white' 
                        : s < step 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {s < step ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s === 1 && <div className={`flex-1 h-1 mx-2 ${
                      step > 1 ? 'bg-green-500' : 'bg-gray-200'
                    }`} />}
                  </div>
                ))}
              </div>
            )}

            {/* Delete Confirmation */}
            {action === 'delete' && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Warning: Irreversible Action</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This action will permanently delete {selectedCount} customer
                        {selectedCount > 1 ? 's' : ''}. All associated data will be lost forever.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.confirmMessage}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Type "DELETE" in uppercase to confirm
                  </p>
                </div>
              </>
            )}

            {/* Suspend Confirmation */}
            {action === 'suspend' && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Account Suspension</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Suspended customers will not be able to log in or make purchases.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.confirmMessage}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SUSPEND"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </>
            )}

            {/* Status Update */}
            {action === 'status' && step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CUSTOMER_STATUS).map(([value, config]) => {
                    const StatusIcon = config.icon;
                    const isSelected = status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatus(value)}
                        className={`flex items-center p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? config.borderColor + ' ' + config.bgColor
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${config.bgColor} mr-3`}>
                          <StatusIcon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className={`h-4 w-4 ml-auto ${config.color}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Export - Step 1: Format Selection */}
            {action === 'export' && step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Export Format
                </label>
                <div className="space-y-3">
                  {EXPORT_FORMATS.map((format) => {
                    const FormatIcon = format.icon;
                    const isSelected = selectedFormat === format.value;
                    return (
                      <button
                        key={format.value}
                        type="button"
                        onClick={() => setSelectedFormat(format.value)}
                        className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-100' : 'bg-gray-100'} mr-3`}>
                          <FormatIcon className={`h-5 w-5 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                            {format.label}
                          </p>
                          <p className="text-xs text-gray-500">{format.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Email - Step 1: Template Selection */}
            {action === 'email' && step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Email Template
                </label>
                <div className="space-y-3">
                  {EMAIL_TEMPLATES.map((template) => {
                    const isSelected = selectedTemplate === template.value;
                    return (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() => setSelectedTemplate(template.value)}
                        className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'} mr-3`}>
                          <Mail className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                            {template.label}
                          </p>
                          <p className="text-xs text-gray-500">{template.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Email - Step 2: Compose */}
            {action === 'email' && step === 2 && (
              <div className="space-y-4">
                {selectedTemplate === 'custom' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Enter email subject"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows="5"
                        placeholder="Write your email content here..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      Using template: <span className="font-medium">{EMAIL_TEMPLATES.find(t => t.value === selectedTemplate)?.label}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      The email will be personalized for each recipient.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={sendOptions.sendCopy}
                      onChange={(e) => setSendOptions(prev => ({ ...prev, sendCopy: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Send me a copy</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={sendOptions.schedule}
                      onChange={(e) => setSendOptions(prev => ({ ...prev, schedule: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Schedule for later</span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Summary */}
            {selectedCount > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Selected customers:</span>
                  <span className="font-semibold text-gray-900">{selectedCount}</span>
                </div>
                {action === 'status' && status && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">New status:</span>
                    <span className="flex items-center font-medium">
                      {getStatusIcon(status)}
                      {CUSTOMER_STATUS[status]?.label}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={config.multiStep && step === 2 ? handleBack : onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {config.multiStep && step === 2 ? 'Back' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || (action === 'delete' && confirmText !== 'DELETE') || (action === 'suspend' && confirmText !== 'SUSPEND')}
                className={`px-6 py-2 ${getButtonColor()} text-white rounded-xl hover:opacity-90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm`}
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {config.multiStep && step === 1 ? (
                      <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {action === 'delete' ? 'Delete Permanently' : 'Confirm Action'}
                      </>
                    )}
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

export default BulkActionModal;