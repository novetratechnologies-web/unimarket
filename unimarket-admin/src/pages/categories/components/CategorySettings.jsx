// admin/src/pages/categories/components/CategorySettings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiToggleLeft, 
  FiEye, 
  FiStar, 
  FiMenu, 
  FiHome, 
  FiChevronDown,
  FiChevronUp,
  FiLayout,
  FiHash,
  FiShield,
  FiTruck,
  FiPercent,
  FiInfo,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiSliders,
  FiGrid,
  FiList,
  FiEyeOff,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiPackage,
  FiGlobe,
  FiUsers,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CategorySettings = ({ formData, onNestedInputChange, errors, showToast }) => {
  const [activeSection, setActiveSection] = useState('visibility');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  // Track unsaved changes
  useEffect(() => {
    const changes = {};
    if (formData.settings?.isActive !== undefined) changes.isActive = formData.settings.isActive;
    if (formData.settings?.isVisible !== undefined) changes.isVisible = formData.settings.isVisible;
    if (formData.settings?.isFeatured !== undefined) changes.isFeatured = formData.settings.isFeatured;
    setPendingChanges(changes);
  }, [formData.settings]);

  const sections = [
    { id: 'visibility', label: 'Visibility', icon: FiEye, color: 'blue' },
    { id: 'display', label: 'Display', icon: FiLayout, color: 'purple' },
    { id: 'menu', label: 'Menu', icon: FiMenu, color: 'green' },
    { id: 'products', label: 'Products', icon: FiPackage, color: 'orange' },
    { id: 'commission', label: 'Commission', icon: FiPercent, color: 'red' },
    { id: 'shipping', label: 'Shipping', icon: FiTruck, color: 'cyan' },
    { id: 'advanced', label: 'Advanced', icon: FiSliders, color: 'gray' }
  ];

  const getSectionIcon = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.icon || FiInfo;
  };

  const getSectionColor = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.color || 'gray';
  };

  const handleNumberChange = (section, field, value, min = 0, max = null) => {
    const numValue = parseInt(value) || 0;
    if (max !== null && numValue > max) {
      showToast?.(`Maximum value is ${max}`, { type: 'warning' });
      return;
    }
    if (numValue < min) {
      showToast?.(`Minimum value is ${min}`, { type: 'warning' });
      return;
    }
    onNestedInputChange(section, field, numValue);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center mb-2">
          <FiSliders className="w-6 h-6 mr-2" />
          Category Settings
        </h2>
        <p className="text-indigo-100">
          Configure how this category behaves and appears throughout your store
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <div className="flex items-center justify-between">
              <FiEye className="w-4 h-4 text-indigo-200" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                formData.settings?.isActive ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {formData.settings?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2">{formData.settings?.isActive ? '✓' : '✗'}</p>
            <p className="text-xs text-indigo-200">Status</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <div className="flex items-center justify-between">
              <FiStar className="w-4 h-4 text-indigo-200" />
              {formData.settings?.isFeatured && (
                <FiCheck className="w-3 h-3 text-green-300" />
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{formData.settings?.isFeatured ? 'Yes' : 'No'}</p>
            <p className="text-xs text-indigo-200">Featured</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <div className="flex items-center justify-between">
              <FiMenu className="w-4 h-4 text-indigo-200" />
            </div>
            <p className="text-2xl font-bold mt-2">{formData.settings?.menuPosition || 0}</p>
            <p className="text-xs text-indigo-200">Menu Position</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <div className="flex items-center justify-between">
              <FiPackage className="w-4 h-4 text-indigo-200" />
            </div>
            <p className="text-2xl font-bold mt-2">{formData.settings?.sortOrder || 0}</p>
            <p className="text-xs text-indigo-200">Sort Order</p>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const color = section.color;
            
            return (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(section.id)}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm flex items-center space-x-2
                  transition-all relative
                  ${isActive 
                    ? `bg-${color}-50 text-${color}-700 shadow-sm` 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? `text-${color}-600` : 'text-gray-400'}`} />
                <span>{section.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${color}-600`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Settings Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Visibility Settings */}
          {activeSection === 'visibility' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiEye className="w-5 h-5 mr-2 text-blue-600" />
                Visibility Settings
              </h3>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Active"
                  description="Category is active and can be used in the store"
                  checked={formData.settings?.isActive ?? true}
                  onChange={(val) => onNestedInputChange('settings', 'isActive', val)}
                  color="blue"
                  showToast={showToast}
                />
                <ToggleSwitch
                  label="Visible"
                  description="Category is visible to customers on the frontend"
                  checked={formData.settings?.isVisible ?? true}
                  onChange={(val) => onNestedInputChange('settings', 'isVisible', val)}
                  color="green"
                  showToast={showToast}
                />
                <ToggleSwitch
                  label="Featured"
                  description="Mark as featured category (appears in featured sections)"
                  checked={formData.settings?.isFeatured ?? false}
                  onChange={(val) => onNestedInputChange('settings', 'isFeatured', val)}
                  color="yellow"
                  showToast={showToast}
                />
                
                {/* Conditional visibility warnings */}
                {!formData.settings?.isActive && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                    <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-700">
                      This category is inactive. It won't be visible anywhere in the store until activated.
                    </p>
                  </div>
                )}
                
                {formData.settings?.isVisible === false && formData.settings?.isActive && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                    <FiInfo className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Category is hidden from customers but still active for internal use.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeSection === 'display' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiLayout className="w-5 h-5 mr-2 text-purple-600" />
                Display Settings
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.settings?.sortOrder || 0}
                      onChange={(e) => handleNumberChange('settings', 'sortOrder', e.target.value, 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      min="0"
                      step="1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <button
                        onClick={() => handleNumberChange('settings', 'sortOrder', (formData.settings?.sortOrder || 0) - 1, 0)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <FiChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNumberChange('settings', 'sortOrder', (formData.settings?.sortOrder || 0) + 1, 0)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <FiChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <FiInfo className="w-3 h-3 mr-1" />
                    Lower numbers appear first in listings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu Position
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.settings?.menuPosition || 0}
                      onChange={(e) => handleNumberChange('settings', 'menuPosition', e.target.value, 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      min="0"
                      step="1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <button
                        onClick={() => handleNumberChange('settings', 'menuPosition', (formData.settings?.menuPosition || 0) - 1, 0)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <FiChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNumberChange('settings', 'menuPosition', (formData.settings?.menuPosition || 0) + 1, 0)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <FiChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Position in navigation menus (higher numbers appear later)
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Column Count
                  </label>
                  <div className="flex items-center space-x-4">
                    {[2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => onNestedInputChange('settings', 'columnCount', num)}
                        className={`
                          px-4 py-2 rounded-xl border-2 transition-all flex items-center space-x-2
                          ${formData.settings?.columnCount === num
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300 text-gray-600'
                          }
                        `}
                      >
                        <FiGrid className="w-4 h-4" />
                        <span>{num} cols</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Number of columns to display in category grids
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Settings */}
          {activeSection === 'menu' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiMenu className="w-5 h-5 mr-2 text-green-600" />
                Menu Settings
              </h3>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Show in Navigation Menu"
                  description="Display this category in the main navigation menu"
                  checked={formData.settings?.showInMenu ?? true}
                  onChange={(val) => onNestedInputChange('settings', 'showInMenu', val)}
                  color="green"
                  showToast={showToast}
                />
                <ToggleSwitch
                  label="Show on Homepage"
                  description="Feature this category on the homepage"
                  checked={formData.settings?.showInHomepage ?? false}
                  onChange={(val) => onNestedInputChange('settings', 'showInHomepage', val)}
                  color="green"
                  showToast={showToast}
                />
                <ToggleSwitch
                  label="Show in Footer"
                  description="Display this category in the footer menu"
                  checked={formData.settings?.showInFooter ?? false}
                  onChange={(val) => onNestedInputChange('settings', 'showInFooter', val)}
                  color="green"
                  showToast={showToast}
                />
                <ToggleSwitch
                  label="Show in Sidebar"
                  description="Display this category in sidebar navigation"
                  checked={formData.settings?.showInSidebar ?? true}
                  onChange={(val) => onNestedInputChange('settings', 'showInSidebar', val)}
                  color="green"
                  showToast={showToast}
                />

                {/* Menu Preview */}
                {(formData.settings?.showInMenu || formData.settings?.showInSidebar) && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-3">Menu Preview</h4>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">Home</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-green-600 font-medium">{formData.name || 'Category'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Settings */}
          {activeSection === 'products' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiPackage className="w-5 h-5 mr-2 text-orange-600" />
                Product Settings
              </h3>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Show Product Count"
                  description="Display the number of products in this category"
                  checked={formData.settings?.showProductCount ?? true}
                  onChange={(val) => onNestedInputChange('settings', 'showProductCount', val)}
                  color="orange"
                  showToast={showToast}
                />

                {/* Product Preview */}
                {formData.settings?.showProductCount && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-800">Products in category:</span>
                      <span className="text-2xl font-bold text-orange-600">24</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-2">
                      This number updates automatically based on assigned products
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commission Settings */}
          {activeSection === 'commission' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiPercent className="w-5 h-5 mr-2 text-red-600" />
                Commission Settings
              </h3>
              
              <div className="space-y-6">
                <ToggleSwitch
                  label="Override Default Commission"
                  description="Use custom commission rates for this category"
                  checked={formData.commission?.override ?? false}
                  onChange={(val) => onNestedInputChange('commission', 'override', val)}
                  color="red"
                  showToast={showToast}
                />
                
                <AnimatePresence>
                  {formData.commission?.override && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Commission Rate
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={formData.commission?.rate || ''}
                                onChange={(e) => onNestedInputChange('commission', 'rate', e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0.00"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {formData.commission?.type === 'percentage' ? '%' : '$'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Commission Type
                            </label>
                            <select
                              value={formData.commission?.type || 'percentage'}
                              onChange={(e) => onNestedInputChange('commission', 'type', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount ($)</option>
                            </select>
                          </div>
                        </div>

                        {/* Commission Preview */}
                        {formData.commission?.rate && (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                            <p className="text-sm text-gray-600">
                              Commission on a $100 product:{' '}
                              <span className="font-bold text-red-600">
                                {formData.commission.type === 'percentage' 
                                  ? `$${(100 * formData.commission.rate / 100).toFixed(2)}`
                                  : `$${formData.commission.rate}`
                                }
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Default Commission Info */}
                {!formData.commission?.override && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center">
                      <FiInfo className="w-4 h-4 mr-2 text-gray-400" />
                      Using default store commission rate. Enable override to set custom rates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeSection === 'shipping' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTruck className="w-5 h-5 mr-2 text-cyan-600" />
                Shipping Settings
              </h3>
              
              <div className="space-y-6">
                <ToggleSwitch
                  label="Requires Shipping"
                  description="Products in this category need to be shipped"
                  checked={formData.shipping?.requiresShipping ?? true}
                  onChange={(val) => onNestedInputChange('shipping', 'requiresShipping', val)}
                  color="cyan"
                  showToast={showToast}
                />
                
                <ToggleSwitch
                  label="Free Shipping"
                  description="Offer free shipping for all products in this category"
                  checked={formData.shipping?.freeShipping ?? false}
                  onChange={(val) => onNestedInputChange('shipping', 'freeShipping', val)}
                  color="cyan"
                  showToast={showToast}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Shipping Cost
                  </label>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.shipping?.additionalCost || 0}
                      onChange={(e) => onNestedInputChange('shipping', 'additionalCost', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Extra shipping cost applied to products in this category
                  </p>
                </div>

                {/* Shipping Preview */}
                {formData.shipping?.requiresShipping && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                    <h4 className="text-sm font-medium text-cyan-800 mb-2">Shipping Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Free Shipping:</span>
                        <span className="font-medium text-cyan-900">
                          {formData.shipping?.freeShipping ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Additional Cost:</span>
                        <span className="font-medium text-cyan-900">
                          ${formData.shipping?.additionalCost || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeSection === 'advanced' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiSliders className="w-5 h-5 mr-2 text-gray-600" />
                Advanced Settings
              </h3>
              
              <div className="space-y-6">
                {/* Tax Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiShield className="w-4 h-4 mr-2 text-gray-500" />
                    Tax Configuration
                  </h4>
                  <div className="space-y-3">
                    <ToggleSwitch
                      label="Tax Exempt"
                      description="Products in this category are tax exempt"
                      checked={formData.tax?.exempt ?? false}
                      onChange={(val) => onNestedInputChange('tax', 'exempt', val)}
                      color="gray"
                      showToast={showToast}
                      size="sm"
                    />
                    
                    {!formData.tax?.exempt && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={formData.tax?.rate || ''}
                          onChange={(e) => onNestedInputChange('tax', 'rate', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cache Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiClock className="w-4 h-4 mr-2 text-gray-500" />
                    Cache Settings
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Cache TTL (seconds)
                      </label>
                      <select
                        value="3600"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="3600">1 hour</option>
                        <option value="7200">2 hours</option>
                        <option value="21600">6 hours</option>
                        <option value="86400">24 hours</option>
                      </select>
                    </div>
                    <button
                      onClick={() => showToast?.('Cache cleared for this category', { type: 'success' })}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Clear cache now
                    </button>
                  </div>
                </div>

                {/* Access Control */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiLock className="w-4 h-4 mr-2 text-gray-500" />
                    Access Control
                  </h4>
                  <div className="space-y-3">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue="public"
                    >
                      <option value="public">Public - Visible to everyone</option>
                      <option value="registered">Registered Users Only</option>
                      <option value="wholesale">Wholesale Customers Only</option>
                      <option value="private">Private - Admin Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Enhanced Toggle Switch Component
const ToggleSwitch = ({ label, description, checked, onChange, color = 'indigo', showToast, size = 'md' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizes = {
    sm: {
      switch: 'w-8 h-4',
      dot: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'w-10 h-6',
      dot: 'w-5 h-5',
      translate: 'translate-x-4'
    },
    lg: {
      switch: 'w-12 h-7',
      dot: 'w-6 h-6',
      translate: 'translate-x-5'
    }
  };

  const colors = {
    blue: { bg: 'bg-blue-600', ring: 'ring-blue-500' },
    green: { bg: 'bg-green-600', ring: 'ring-green-500' },
    yellow: { bg: 'bg-yellow-600', ring: 'ring-yellow-500' },
    red: { bg: 'bg-red-600', ring: 'ring-red-500' },
    purple: { bg: 'bg-purple-600', ring: 'ring-purple-500' },
    orange: { bg: 'bg-orange-600', ring: 'ring-orange-500' },
    cyan: { bg: 'bg-cyan-600', ring: 'ring-cyan-500' },
    gray: { bg: 'bg-gray-600', ring: 'ring-gray-500' },
    indigo: { bg: 'bg-indigo-600', ring: 'ring-indigo-500' }
  };

  const handleChange = (e) => {
    onChange(e.target.checked);
    showToast?.(`${label} ${e.target.checked ? 'enabled' : 'disabled'}`, { 
      type: 'info',
      duration: 2000 
    });
  };

  return (
    <motion.label 
      className="flex items-start space-x-3 cursor-pointer group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="relative inline-flex items-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
        />
        <div className={`
          ${sizes[size].switch} rounded-full peer 
          ${checked ? colors[color].bg : 'bg-gray-300'}
          peer-focus:ring-2 peer-focus:${colors[color].ring}
          transition-all duration-300 ease-in-out
          ${isHovered && !checked ? 'bg-gray-400' : ''}
        `}>
          <motion.div
            className={`
              absolute top-0.5 left-0.5 ${sizes[size].dot} bg-white rounded-full shadow-md
              transition-all duration-300 ease-in-out
            `}
            animate={{
              x: checked ? 20 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors flex items-center">
          {label}
          {checked ? (
            <FiCheck className="w-3 h-3 ml-2 text-green-600" />
          ) : (
            <FiX className="w-3 h-3 ml-2 text-gray-400" />
          )}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </motion.label>
  );
};

export default CategorySettings;