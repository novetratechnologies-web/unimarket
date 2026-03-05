// components/admin/products/SaveButtons.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  FiEye, 
  FiSave, 
  FiSend, 
  FiClock, 
  FiCalendar,
  FiChevronDown,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiGlobe,
  FiCopy,
  FiLock,
  FiUsers,
  FiArchive,
  FiXCircle,
  FiLoader
} from 'react-icons/fi';

const SaveButtons = ({ 
  onSaveDraft, 
  onSavePublish, 
  onPreview, 
  onSchedule, 
  saving,
  publishStatus: externalPublishStatus,
  errors = {} 
}) => {
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [localPublishStatus, setLocalPublishStatus] = useState('draft');
  const dropdownRef = useRef(null);
  const publishDropdownRef = useRef(null);

  // Use external publish status if provided, otherwise use local
  const publishStatus = externalPublishStatus || localPublishStatus;

  // Check if there are any errors
  const hasErrors = Object.keys(errors).length > 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }
      if (publishDropdownRef.current && !publishDropdownRef.current.contains(event.target)) {
        setShowPublishOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchedule = () => {
    if (scheduleDate && scheduleTime) {
      const scheduledDateTime = `${scheduleDate}T${scheduleTime}`;
      onSchedule?.(scheduledDateTime);
      setShowScheduleModal(false);
      setLocalPublishStatus('scheduled');
      setShowSaveOptions(false);
    }
  };

  const handlePublishNow = () => {
    onSavePublish();
    setLocalPublishStatus('published');
    setShowPublishOptions(false);
  };

  const handleSaveDraft = () => {
    onSaveDraft();
    setLocalPublishStatus('draft');
    setShowSaveOptions(false);
  };

  const getStatusIcon = () => {
    if (hasErrors) return FiAlertCircle;
    switch (publishStatus) {
      case 'published':
        return FiCheckCircle;
      case 'scheduled':
        return FiClock;
      case 'error':
        return FiAlertCircle;
      default:
        return FiFileText;
    }
  };

  const getStatusColor = () => {
    if (hasErrors) return 'text-red-600 bg-red-50 border-red-200';
    switch (publishStatus) {
      case 'published':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    if (hasErrors) return 'Has Errors';
    switch (publishStatus) {
      case 'published':
        return 'Published';
      case 'scheduled':
        return 'Scheduled';
      case 'error':
        return 'Error';
      default:
        return 'Draft';
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Status Badge */}
        <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full border ${getStatusColor()}`}>
          <StatusIcon className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-medium">{getStatusText()}</span>
          {hasErrors && (
            <span className="ml-2 text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full">
              {Object.keys(errors).length}
            </span>
          )}
        </div>

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 group"
          title="Preview product"
        >
          <FiEye className="w-5 h-5 mr-2 text-gray-400 group-hover:text-gray-600" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
        >
          {saving ? (
            <>
              <FiLoader className="animate-spin w-5 h-5 mr-2 text-gray-500" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5 mr-2 text-gray-400 group-hover:text-gray-600" />
              <span className="hidden sm:inline">Save Draft</span>
            </>
          )}
        </button>

        {/* Publish Button with Options */}
        <div className="relative" ref={publishDropdownRef}>
          <button
            type="button"
            onClick={() => setShowPublishOptions(!showPublishOptions)}
            disabled={saving || hasErrors}
            className={`inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 group ${
              (saving || hasErrors) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiSend className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Publish</span>
            <FiChevronDown className={`ml-2 w-4 h-4 transition-transform duration-200 ${showPublishOptions ? 'rotate-180' : ''}`} />
          </button>

          {showPublishOptions && (
            <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 animate-slideDown">
              <div className="py-2">
                <button
                  onClick={handlePublishNow}
                  disabled={hasErrors}
                  className={`group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors ${
                    hasErrors ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={hasErrors ? 'Fix validation errors before publishing' : ''}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200">
                    <FiGlobe className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Publish Now</p>
                    <p className="text-xs text-gray-500">Make product live immediately</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowScheduleModal(true);
                    setShowPublishOptions(false);
                  }}
                  disabled={hasErrors}
                  className={`group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors ${
                    hasErrors ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={hasErrors ? 'Fix validation errors before scheduling' : ''}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                    <FiCalendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Schedule for Later</p>
                    <p className="text-xs text-gray-500">Set a future publish date</p>
                  </div>
                </button>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    setShowSaveOptions(!showSaveOptions);
                    setShowPublishOptions(false);
                  }}
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200">
                    <FiArchive className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">More Options</p>
                    <p className="text-xs text-gray-500">Additional save options</p>
                  </div>
                  <FiChevronDown className="ml-auto w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* More Options Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowSaveOptions(!showSaveOptions)}
            className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            title="More options"
          >
            <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${showSaveOptions ? 'rotate-180' : ''}`} />
          </button>

          {showSaveOptions && (
            <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 animate-slideDown">
              <div className="py-2">
                <button
                  onClick={() => {
                    // Handle save as private
                    setShowSaveOptions(false);
                  }}
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200">
                    <FiLock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Save as Private</p>
                    <p className="text-xs text-gray-500">Only visible to admins</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Handle save for review
                    setShowSaveOptions(false);
                  }}
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-yellow-200">
                    <FiUsers className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Submit for Review</p>
                    <p className="text-xs text-gray-500">Send for approval</p>
                  </div>
                </button>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    // Handle duplicate
                    setShowSaveOptions(false);
                  }}
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-200">
                    <FiCopy className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Save as Copy</p>
                    <p className="text-xs text-gray-500">Duplicate this product</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Handle archive
                    setShowSaveOptions(false);
                  }}
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 w-full text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200">
                    <FiArchive className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Archive</p>
                    <p className="text-xs text-gray-500">Move to archives</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FiCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Publication</h3>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    id="scheduleDate"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Time
                  </label>
                  <input
                    type="time"
                    id="scheduleTime"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                {scheduleDate && scheduleTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Product will be published on{' '}
                      <span className="font-semibold">
                        {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={!scheduleDate || !scheduleTime}
                  className="px-4 py-2 bg-indigo-600 text-sm font-medium rounded-lg text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SaveButtons;