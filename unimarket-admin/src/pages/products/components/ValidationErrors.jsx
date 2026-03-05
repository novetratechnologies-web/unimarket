// components/admin/products/ValidationErrors.jsx
import React, { useState } from 'react';
import { 
  FiAlertCircle, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiInfo 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ValidationErrors = ({ errors, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  const errorList = Object.entries(errors).map(([field, message]) => ({
    field,
    message
  }));

  // Group errors by section/category
  const groupedErrors = errorList.reduce((acc, error) => {
    let section = 'other';
    
    if (error.field.startsWith('documents') || error.field.startsWith('videos') || error.field.startsWith('images')) {
      section = 'media';
    } else if (error.field.startsWith('seo')) {
      section = 'seo';
    } else if (error.field.startsWith('returnPolicy') || error.field.includes('warranty') || error.field.includes('bundle')) {
      section = 'advanced';
    } else if (error.field.includes('shipping') || error.field.includes('weight') || error.field.includes('dimensions')) {
      section = 'shipping';
    } else if (error.field.includes('price') || error.field.includes('cost') || error.field.includes('discount')) {
      section = 'pricing';
    } else if (error.field.includes('quantity') || error.field.includes('stock') || error.field.includes('inventory')) {
      section = 'inventory';
    } else if (error.field.includes('category') || error.field.includes('tag') || error.field.includes('attribute')) {
      section = 'categories';
    } else if (error.field.includes('name') || error.field.includes('slug') || error.field.includes('sku') || error.field.includes('vendor')) {
      section = 'basic';
    } else if (error.field.includes('description') || error.field.includes('specification')) {
      section = 'description';
    } else if (error.field.includes('variant')) {
      section = 'variants';
    }
    
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(error);
    return acc;
  }, {});

  const sectionNames = {
    basic: { name: 'Basic Information', icon: '📋', color: 'blue' },
    description: { name: 'Description', icon: '📝', color: 'green' },
    media: { name: 'Media', icon: '🖼️', color: 'purple' },
    pricing: { name: 'Pricing', icon: '💰', color: 'yellow' },
    inventory: { name: 'Inventory', icon: '📦', color: 'orange' },
    variants: { name: 'Variants', icon: '🔄', color: 'indigo' },
    categories: { name: 'Categories', icon: '🏷️', color: 'pink' },
    shipping: { name: 'Shipping', icon: '🚚', color: 'cyan' },
    seo: { name: 'SEO', icon: '🔍', color: 'teal' },
    advanced: { name: 'Advanced', icon: '⚙️', color: 'gray' },
    other: { name: 'Other', icon: '📌', color: 'slate' }
  };

  const getSectionColor = (section) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      pink: 'bg-pink-50 border-pink-200 text-pink-800',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800',
      teal: 'bg-teal-50 border-teal-200 text-teal-800',
      gray: 'bg-gray-50 border-gray-200 text-gray-800',
      slate: 'bg-slate-50 border-slate-200 text-slate-800'
    };
    return colors[sectionNames[section]?.color] || colors.slate;
  };

  const formatFieldName = (field) => {
    return field
      .replace(/\./g, ' › ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^(\d+)/, 'Item $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (errorList.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    >
      <div className="rounded-xl bg-white border border-red-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Validation Errors Found
                </h3>
                <p className="text-sm text-red-700">
                  Please fix the following {errorList.length} error(s) before saving
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {errorList.length} {errorList.length === 1 ? 'Error' : 'Errors'}
              </span>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  title="Dismiss"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Error List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 max-h-96 overflow-y-auto"
            >
              <div className="space-y-4">
                {Object.entries(groupedErrors).map(([section, errors]) => (
                  <div
                    key={section}
                    className={`rounded-lg border ${getSectionColor(section)} overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-75 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{sectionNames[section]?.icon || '📌'}</span>
                        <span className="font-medium">
                          {sectionNames[section]?.name || section.charAt(0).toUpperCase() + section.slice(1)}
                        </span>
                        <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">
                          {errors.length}
                        </span>
                      </div>
                      {expandedSections[section] ? (
                        <FiChevronUp className="w-4 h-4" />
                      ) : (
                        <FiChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections[section] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-inherit"
                        >
                          <ul className="divide-y divide-inherit">
                            {errors.map((error, index) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-4 py-3 text-sm hover:bg-opacity-50 transition-colors"
                              >
                                <div className="flex items-start">
                                  <span className="text-red-500 mr-2 mt-1">•</span>
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900">
                                      {formatFieldName(error.field)}:
                                    </span>
                                    <span className="text-gray-700 ml-1">{error.message}</span>
                                  </div>
                                </div>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Help Tip */}
              <div className="mt-4 flex items-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <FiInfo className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <p>
                  Errors are grouped by section. Click on each section to expand and see detailed error messages.
                  Fix these issues and try saving again.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        {isExpanded && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Back to top
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ValidationErrors;