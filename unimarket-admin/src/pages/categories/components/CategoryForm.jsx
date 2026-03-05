// admin/src/pages/categories/components/CategoryForm.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FiInfo, 
  FiAlertCircle, 
  FiChevronDown, 
  FiX,
  FiCheck,
  FiHelpCircle,
  FiCopy,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiStar,
  FiTag,
  FiFolder,
  FiHome,
  FiGrid,
  FiShoppingBag,
  FiSmartphone,
  FiTv,
  FiHeadphones,
  FiCamera,
  FiTruck,
  FiTool,
  FiGift,
  FiBox,
  FiSearch,
  FiXCircle,
  FiPlus,
  FiHash
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryForm = ({ 
  formData, 
  onInputChange, 
  onNestedInputChange,
  categories, 
  errors,
  showToast 
}) => {
  const [showParentSelect, setShowParentSelect] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showIconPreview, setShowIconPreview] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [nameChars, setNameChars] = useState(0);
  const [descChars, setDescChars] = useState(0);
  
  const parentSelectRef = useRef(null);
  const nameInputRef = useRef(null);

  // Update character counts
  useEffect(() => {
    setNameChars(formData.name?.length || 0);
    setDescChars(formData.description?.length || 0);
  }, [formData.name, formData.description]);

  // Close parent select on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parentSelectRef.current && !parentSelectRef.current.contains(event.target)) {
        setShowParentSelect(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate slug from name
  const generateSlug = useCallback((text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }, []);

  // Handle name change with smart slug generation
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 100) {
      onInputChange('name', value);
      
      // Only auto-generate slug if it hasn't been manually edited
      if (!slugManuallyEdited) {
        const newSlug = generateSlug(value);
        onInputChange('slug', newSlug);
      }
    }
  };

  // Handle slug change with manual edit tracking
  const handleSlugChange = (e) => {
    const value = e.target.value;
    if (value.length <= 100) {
      onInputChange('slug', value);
      setSlugManuallyEdited(true);
    }
  };

  // Reset slug manual edit flag when form is cleared
  useEffect(() => {
    if (!formData.slug) {
      setSlugManuallyEdited(false);
    }
  }, [formData.slug]);

  // Flatten categories for parent select with proper indentation
  const flattenCategories = useCallback((cats, prefix = '', level = 0, path = []) => {
    let options = [];
    cats.forEach(cat => {
      // Don't include current category as its own parent
      if (formData._id && cat._id === formData._id) {
        return;
      }
      
      const currentPath = [...path, cat.name];
      
      options.push({
        _id: cat._id,
        name: prefix + cat.name,
        fullPath: currentPath.join(' > '),
        level,
        original: cat,
        hasChildren: cat.children && cat.children.length > 0,
        productCount: cat.stats?.productCount || 0,
        isActive: cat.settings?.isActive !== false,
        isFeatured: cat.settings?.isFeatured || false
      });
      
      if (cat.children && cat.children.length > 0) {
        options = options.concat(
          flattenCategories(cat.children, prefix + '── ', level + 1, currentPath)
        );
      }
    });
    return options;
  }, [formData._id]);

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories, flattenCategories]);
  
  // Filter parent options based on search
  const filteredParentOptions = useMemo(() => {
    if (!parentSearchTerm) return categoryOptions;
    return categoryOptions.filter(opt => 
      opt.name.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
      opt.fullPath.toLowerCase().includes(parentSearchTerm.toLowerCase())
    );
  }, [categoryOptions, parentSearchTerm]);
  
  // Find selected parent for display
  const selectedParent = useMemo(() => 
    formData.parent ? categoryOptions.find(opt => opt._id === formData.parent) : null,
    [formData.parent, categoryOptions]
  );

  // Icon categories with expanded options
  const iconGroups = useMemo(() => [
    {
      name: 'Common Icons',
      icons: [
        { value: 'fas fa-folder', label: 'Folder', icon: FiFolder, color: 'text-yellow-600' },
        { value: 'fas fa-folder-open', label: 'Open Folder', icon: FiFolder, color: 'text-yellow-600' },
        { value: 'fas fa-tag', label: 'Tag', icon: FiTag, color: 'text-blue-600' },
        { value: 'fas fa-box', label: 'Box', icon: FiBox, color: 'text-brown-600' },
        { value: 'fas fa-shopping-cart', label: 'Cart', icon: FiShoppingBag, color: 'text-green-600' },
        { value: 'fas fa-gift', label: 'Gift', icon: FiGift, color: 'text-red-600' },
        { value: 'fas fa-home', label: 'Home', icon: FiHome, color: 'text-indigo-600' },
        { value: 'fas fa-star', label: 'Featured', icon: FiStar, color: 'text-yellow-500' }
      ]
    },
    {
      name: 'Electronics',
      icons: [
        { value: 'fas fa-laptop', label: 'Laptop', icon: FiSmartphone, color: 'text-gray-700' },
        { value: 'fas fa-mobile-alt', label: 'Mobile', icon: FiSmartphone, color: 'text-gray-700' },
        { value: 'fas fa-tablet-alt', label: 'Tablet', icon: FiSmartphone, color: 'text-gray-700' },
        { value: 'fas fa-headphones', label: 'Headphones', icon: FiHeadphones, color: 'text-gray-700' },
        { value: 'fas fa-camera', label: 'Camera', icon: FiCamera, color: 'text-gray-700' },
        { value: 'fas fa-tv', label: 'TV', icon: FiTv, color: 'text-gray-700' }
      ]
    },
    {
      name: 'Clothing',
      icons: [
        { value: 'fas fa-tshirt', label: 'T-Shirt', icon: FiTag, color: 'text-purple-600' },
        { value: 'fas fa-shoe-prints', label: 'Shoes', icon: FiTag, color: 'text-purple-600' },
        { value: 'fas fa-hat-cowboy', label: 'Hat', icon: FiTag, color: 'text-purple-600' },
        { value: 'fas fa-ring', label: 'Jewelry', icon: FiTag, color: 'text-purple-600' }
      ]
    },
    {
      name: 'Home & Garden',
      icons: [
        { value: 'fas fa-couch', label: 'Furniture', icon: FiHome, color: 'text-amber-600' },
        { value: 'fas fa-bed', label: 'Bedding', icon: FiHome, color: 'text-amber-600' },
        { value: 'fas fa-utensils', label: 'Kitchen', icon: FiHome, color: 'text-amber-600' },
        { value: 'fas fa-tools', label: 'Tools', icon: FiTool, color: 'text-amber-600' },
        { value: 'fas fa-seedling', label: 'Garden', icon: FiHome, color: 'text-green-600' }
      ]
    },
    {
      name: 'Sports & Outdoors',
      icons: [
        { value: 'fas fa-futbol', label: 'Football', icon: FiTag, color: 'text-orange-600' },
        { value: 'fas fa-basketball-ball', label: 'Basketball', icon: FiTag, color: 'text-orange-600' },
        { value: 'fas fa-bicycle', label: 'Bicycle', icon: FiTruck, color: 'text-orange-600' },
        { value: 'fas fa-dumbbell', label: 'Gym', icon: FiTag, color: 'text-orange-600' }
      ]
    }
  ], []);

  // Generate tag suggestions based on category name and description
  useEffect(() => {
    if (formData.name || formData.description) {
      const words = new Set();
      
      // Extract words from name
      if (formData.name) {
        formData.name.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 2) words.add(word);
        });
      }
      
      // Extract words from description
      if (formData.description) {
        formData.description.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 3) words.add(word);
        });
      }
      
      setSuggestedTags(Array.from(words).slice(0, 5));
    } else {
      setSuggestedTags([]);
    }
  }, [formData.name, formData.description]);

  // Copy slug to clipboard
  const copySlug = useCallback(() => {
    navigator.clipboard.writeText(formData.slug || '').then(() => {
      setCopied(true);
      showToast?.('Slug copied to clipboard', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast?.('Failed to copy slug', { type: 'error' });
    });
  }, [formData.slug, showToast]);

  // Regenerate slug from name
  const regenerateSlug = useCallback(() => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      onInputChange('slug', newSlug);
      setSlugManuallyEdited(false);
      showToast?.('Slug regenerated from name', { type: 'info' });
    }
  }, [formData.name, generateSlug, onInputChange, showToast]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Category Name */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Category Name <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs px-2 py-1 rounded-full ${
            nameChars > 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {nameChars}/100
          </span>
        </div>
        <div className="relative">
          <input
            ref={nameInputRef}
            type="text"
            value={formData.name || ''}
            onChange={handleNameChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-indigo-200'
            }`}
            placeholder="e.g., Electronics, Clothing, Books"
            maxLength="100"
          />
          {formData.name && (
            <button
              onClick={() => {
                onInputChange('name', '');
                nameInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiXCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        {errors.name && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
          >
            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errors.name}
          </motion.p>
        )}
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          Use a clear, descriptive name that customers will understand
        </p>
      </motion.div>

      {/* Slug */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              slugManuallyEdited ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {slugManuallyEdited ? 'Manual' : 'Auto'}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center px-4 py-3 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-mono">
            /category/
          </span>
          <input
            type="text"
            value={formData.slug || ''}
            onChange={handleSlugChange}
            className={`flex-1 px-4 py-3 border-2 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono ${
              errors.slug ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-indigo-200'
            }`}
            placeholder="electronics"
            maxLength="100"
          />
          <div className="flex items-center ml-2 space-x-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={copySlug}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Copy slug"
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
            </motion.button>
            {!slugManuallyEdited && formData.name && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={regenerateSlug}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Regenerate slug"
              >
                <FiRefreshCw className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
        {errors.slug && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
          >
            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errors.slug}
          </motion.p>
        )}
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          URL-friendly version. Auto-generated from name if not manually edited.
        </p>
      </motion.div>

      {/* Parent Category */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
        ref={parentSelectRef}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Parent Category
        </label>
        <div className="relative">
          <motion.button
            whileHover={{ borderColor: '#6366f1' }}
            type="button"
            onClick={() => setShowParentSelect(!showParentSelect)}
            className="w-full px-4 py-3 text-left border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex items-center justify-between hover:border-indigo-200 transition-all"
          >
            <div className="flex items-center">
              {selectedParent ? (
                <>
                  <FiFolder className={`w-5 h-5 mr-3 ${
                    selectedParent.isActive ? 'text-indigo-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <span className="text-gray-900 font-medium">{selectedParent.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedParent.fullPath}</p>
                  </div>
                </>
              ) : (
                <>
                  <FiHome className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-gray-500">No parent (top level)</span>
                </>
              )}
            </div>
            <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showParentSelect ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showParentSelect && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-96 overflow-hidden"
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={parentSearchTerm}
                      onChange={(e) => setParentSearchTerm(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="overflow-y-auto max-h-60 p-2">
                  <motion.div
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => {
                      onInputChange('parent', null);
                      setShowParentSelect(false);
                      setParentSearchTerm('');
                    }}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg flex items-center mb-1"
                  >
                    <FiHome className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">No parent (top level)</span>
                  </motion.div>
                  
                  {filteredParentOptions.map(option => (
                    <motion.div
                      key={option._id}
                      whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
                      onClick={() => {
                        onInputChange('parent', option._id);
                        setShowParentSelect(false);
                        setParentSearchTerm('');
                      }}
                      className={`
                        px-3 py-2 cursor-pointer rounded-lg transition-all mb-1
                        ${formData.parent === option._id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <FiFolder className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            option.isActive ? 'text-indigo-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="text-gray-700 truncate" style={{ marginLeft: `${option.level * 16}px` }}>
                                {option.name}
                              </span>
                              {!option.isActive && (
                                <span className="ml-2 text-xs text-red-400 flex items-center">
                                  <FiEyeOff className="w-3 h-3 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </div>
                            {option.fullPath !== option.name && (
                              <p className="text-xs text-gray-400 truncate mt-0.5" style={{ marginLeft: `${option.level * 16 + 20}px` }}>
                                {option.fullPath}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {option.productCount > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {option.productCount} products
                            </span>
                          )}
                          {option.isFeatured && (
                            <FiStar className="w-4 h-4 text-yellow-500" title="Featured" />
                          )}
                          {option.hasChildren && (
                            <span className="text-xs text-indigo-600">Has subcategories</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredParentOptions.length === 0 && (
                    <div className="text-center py-8">
                      <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No categories found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          Select a parent category to create a subcategory
        </p>
      </motion.div>

      {/* Description */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Description
          </label>
          <span className={`text-xs px-2 py-1 rounded-full ${
            descChars > 900 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {descChars}/1000
          </span>
        </div>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onInputChange('description', e.target.value.slice(0, 1000))}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y hover:border-indigo-200"
          placeholder="Describe what products belong in this category..."
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            This description may be displayed on the category page
          </p>
          <div className="flex items-center space-x-1">
            <div className={`w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden`}>
              <div 
                className={`h-full transition-all duration-300 ${
                  descChars > 900 ? 'bg-yellow-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${(descChars / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Icon Selection */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            Icon
          </label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowIconPreview(!showIconPreview)}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center bg-indigo-50 px-3 py-1 rounded-lg"
          >
            <FiGrid className="w-4 h-4 mr-2" />
            {showIconPreview ? 'Hide gallery' : 'Browse icons'}
          </motion.button>
        </div>
        
        {/* Icon Preview */}
        <div className="mb-4 flex items-center space-x-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center text-indigo-600 text-3xl border-2 border-indigo-200">
            <i className={formData.icon || 'fas fa-folder'} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Current Icon</p>
            <p className="text-xs text-gray-500 font-mono mt-1">{formData.icon || 'fas fa-folder'}</p>
          </div>
        </div>

        <AnimatePresence>
          {showIconPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                {iconGroups.map(group => (
                  <div key={group.name} className="mb-6 last:mb-0">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {group.name}
                    </h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {group.icons.map(icon => {
                        const IconComponent = icon.icon;
                        const isSelected = formData.icon === icon.value;
                        return (
                          <motion.button
                            key={icon.value}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onInputChange('icon', icon.value)}
                            className={`
                              p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2
                              ${isSelected 
                                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                              }
                            `}
                          >
                            <IconComponent className={`w-6 h-6 ${icon.color}`} />
                            <span className="text-xs font-medium">{icon.label}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"
                              >
                                <FiCheck className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <select
          value={formData.icon || 'fas fa-folder'}
          onChange={(e) => onInputChange('icon', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-indigo-200"
        >
          {iconGroups.map(group => (
            <optgroup key={group.name} label={group.name}>
              {group.icons.map(icon => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          Choose an icon to represent this category in menus
        </p>
      </motion.div>

      {/* Tags */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tags
        </label>
        <TagInput
          tags={formData.tags || []}
          onChange={(tags) => onInputChange('tags', tags)}
          suggestedTags={suggestedTags}
          showToast={showToast}
        />
        
        {/* Suggested Tags */}
        <AnimatePresence>
          {suggestedTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <p className="text-xs text-gray-500 mb-2 flex items-center">
                <FiHash className="w-3 h-3 mr-1" />
                Suggested tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => (
                  <motion.button
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const currentTags = formData.tags || [];
                      if (!currentTags.includes(tag) && currentTags.length < 20) {
                        onInputChange('tags', [...currentTags, tag]);
                        showToast?.(`Tag "${tag}" added`, { type: 'success' });
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all border border-indigo-200 shadow-sm"
                  >
                    <FiPlus className="w-3 h-3 inline mr-1" />
                    {tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="mt-4 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          Add tags to help with searching and filtering. Press Enter or comma to add.
        </p>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Tag Input Component
const TagInput = ({ tags, onChange, suggestedTags = [], showToast }) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      const lastTag = tags[tags.length - 1];
      onChange(tags.slice(0, -1));
      showToast?.(`Tag "${lastTag}" removed`, { type: 'info' });
    }
  };

  const addTag = () => {
    const value = inputValue.trim().toLowerCase();
    if (value && !tags.includes(value) && tags.length < 20) {
      onChange([...tags, value]);
      setInputValue('');
      showToast?.(`Tag "${value}" added`, { type: 'success' });
    } else if (tags.length >= 20) {
      showToast?.('Maximum tag limit reached (20)', { type: 'warning' });
    } else if (tags.includes(value)) {
      showToast?.('Tag already exists', { type: 'warning' });
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
    showToast?.(`Tag "${tagToRemove}" removed`, { type: 'info' });
  };

  const clearAllTags = () => {
    if (tags.length > 0) {
      onChange([]);
      showToast?.('All tags cleared', { type: 'info' });
    }
  };

  return (
    <div className={`border-2 rounded-xl p-3 transition-all ${
      isFocused ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20' : 'border-gray-200 hover:border-indigo-200'
    }`}>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
        <AnimatePresence>
          {tags.map(tag => (
            <motion.span
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm shadow-md group"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-white/80 hover:text-white focus:outline-none transition-colors"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (inputValue) addTag();
            }}
            className="w-full px-4 py-2 border-0 focus:ring-0 text-sm bg-transparent"
            placeholder={tags.length < 20 ? "Type a tag and press Enter..." : "Maximum tags reached (20)"}
            disabled={tags.length >= 20}
          />
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addTag}
          disabled={!inputValue.trim() || tags.length >= 20}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          <FiPlus className="w-4 h-4" />
        </motion.button>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full ${
            tags.length >= 20 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {tags.length}/20 tags
          </span>
          {tags.length > 0 && (
            <button
              onClick={clearAllTags}
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              <FiXCircle className="w-3 h-3 mr-1" />
              Clear all
            </button>
          )}
        </div>
        
        {tags.length < 20 && (
          <span className="text-gray-400">
            {20 - tags.length} slots remaining
          </span>
        )}
      </div>
    </div>
  );
};

export default CategoryForm;