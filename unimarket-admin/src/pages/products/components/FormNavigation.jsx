// components/admin/products/FormNavigation.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiFileText, 
  FiImage, 
  FiDollarSign, 
  FiPackage, 
  FiCopy, 
  FiGrid, 
  FiTruck, 
  FiSearch, 
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX
} from 'react-icons/fi';

const FormNavigation = ({ tabs, activeTab, onTabChange, errors }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedTabs, setCompletedTabs] = useState([]);

  useEffect(() => {
    const completed = tabs.filter(tab => {
      const errorCount = getTabErrorCount(tab.id);
      return errorCount === 0;
    }).map(tab => tab.id);
    
    setCompletedTabs(completed);
  }, [errors, tabs]);

  const getTabErrorCount = (tabId) => {
    const tabErrorFields = {
      basic: ['name', 'vendor', 'sku', 'slug'],
      description: ['description', 'shortDescription'],
      pricing: ['price', 'compareAtPrice', 'cost'],
      inventory: ['quantity', 'lowStockThreshold', 'reorderPoint'],
      variants: ['variants'],
      media: ['images'],
      categories: ['categories', 'primaryCategory'],
      shipping: ['weight', 'dimensions', 'shippingClass'],
      seo: ['seo.title', 'seo.description', 'seo.keywords'],
      advanced: []
    };

    const fields = tabErrorFields[tabId] || [];
    return fields.filter(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return errors[parent]?.[child];
      }
      return errors[field];
    }).length;
  };

  const getTabStatus = (tabId) => {
    const errorCount = getTabErrorCount(tabId);
    const isActive = tabId === activeTab;
    const isCompleted = completedTabs.includes(tabId) && !isActive;

    if (errorCount > 0) return 'error';
    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    return 'pending';
  };

  const getTabIcon = (tabId) => {
    const status = getTabStatus(tabId);
    
    if (status === 'completed') {
      return FiCheckCircle;
    }
    if (status === 'error') {
      return FiAlertCircle;
    }
    
    const tab = tabs.find(t => t.id === tabId);
    return tab?.icon || FiFileText;
  };

  return (
    <>
      {/* Desktop Navigation - Improved spacing and alignment */}
      <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between" aria-label="Tabs">
            <div className="flex-1 flex space-x-1 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const errorCount = getTabErrorCount(tab.id);
                const Icon = getTabIcon(tab.id);
                const isActive = tab.id === activeTab;
                const status = getTabStatus(tab.id);
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      group relative flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${status === 'error' && !isActive ? 'text-red-600 hover:bg-red-50' : ''}
                      ${status === 'completed' && !isActive && !errorCount ? 'text-green-600 hover:bg-green-50' : ''}
                    `}
                    title={tab.description}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${
                      isActive ? 'text-indigo-600' : 
                      status === 'error' ? 'text-red-500' :
                      status === 'completed' ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span>{tab.name}</span>
                    
                    {errorCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        {errorCount}
                      </span>
                    )}
                    
                    {status === 'completed' && errorCount === 0 && !isActive && (
                      <FiCheckCircle className="ml-2 w-3.5 h-3.5 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Step {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
              </span>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation - Cleaner design */}
      <div className="lg:hidden sticky top-16 z-20 bg-white border-b border-gray-200">
        <div className="px-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div className="flex items-center">
              {(() => {
                const activeTabData = tabs.find(t => t.id === activeTab);
                const Icon = activeTabData?.icon || FiFileText;
                const errorCount = getTabErrorCount(activeTab);
                const status = getTabStatus(activeTab);
                
                return (
                  <>
                    <div className={`p-2 rounded-lg mr-3 ${
                      status === 'error' ? 'bg-red-100' :
                      status === 'completed' ? 'bg-green-100' :
                      'bg-indigo-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        status === 'error' ? 'text-red-600' :
                        status === 'completed' ? 'text-green-600' :
                        'text-indigo-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activeTabData?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {errorCount > 0 
                          ? `${errorCount} issue${errorCount > 1 ? 's' : ''} need attention` 
                          : 'Ready to go'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            {isMobileMenuOpen ? (
              <FiX className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute left-0 right-0 mt-1 mx-4 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-30">
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {tabs.map((tab) => {
                  const errorCount = getTabErrorCount(tab.id);
                  const Icon = getTabIcon(tab.id);
                  const isActive = tab.id === activeTab;
                  const status = getTabStatus(tab.id);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 transition-colors ${
                        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${
                        status === 'error' ? 'bg-red-100' :
                        status === 'completed' ? 'bg-green-100' :
                        isActive ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          status === 'error' ? 'text-red-600' :
                          status === 'completed' ? 'text-green-600' :
                          isActive ? 'text-indigo-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-indigo-700' : 'text-gray-700'
                        }`}>
                          {tab.name}
                        </p>
                        {tab.description && (
                          <p className="text-xs text-gray-500">{tab.description}</p>
                        )}
                      </div>
                      {errorCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          {errorCount}
                        </span>
                      )}
                      {status === 'completed' && errorCount === 0 && !isActive && (
                        <FiCheckCircle className="w-5 h-5 text-green-500 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 rounded-r-full"
            style={{ 
              width: `${((tabs.findIndex(t => t.id === activeTab) + 1) / tabs.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Quick Jump Dots - More subtle design */}
      <div className="hidden lg:flex items-center justify-center mt-4 space-x-3">
        {tabs.map((tab, index) => {
          const status = getTabStatus(tab.id);
          const isActive = tab.id === activeTab;
          
          return (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center justify-center transition-all duration-200`}
                title={`${tab.name} - ${tab.description}`}
              >
                <div className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${isActive ? 'w-3 h-3 bg-indigo-600' : 
                    status === 'completed' ? 'bg-green-500' :
                    status === 'error' ? 'bg-red-500' :
                    'bg-gray-300 hover:bg-gray-400'
                  }
                `} />
                
                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {tab.name}
                  {status === 'error' && ' (Has errors)'}
                  {status === 'completed' && ' (Completed)'}
                </span>
              </button>
              {index < tabs.length - 1 && (
                <div className="w-4 h-px bg-gray-200" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

export default FormNavigation;