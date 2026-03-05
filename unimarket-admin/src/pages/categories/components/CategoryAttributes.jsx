// admin/src/pages/categories/components/CategoryAttributes.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMove,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiSettings,
  FiFilter,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiX,
  FiCheck,
  FiHelpCircle,
  FiGrid,
  FiList,
  FiSliders,
  FiTag,
  FiDroplet,
  FiCalendar,
  FiHash,
  FiType,
  FiToggleLeft,
  FiStar,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const CategoryAttributes = ({ formData, onInputChange, errors, showToast }) => {
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [expandedAttributes, setExpandedAttributes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const attributeTypes = useMemo(() => [
    { value: 'text', label: 'Text', icon: FiType, color: 'blue', description: 'Single line text input' },
    { value: 'number', label: 'Number', icon: FiHash, color: 'green', description: 'Numeric values' },
    { value: 'boolean', label: 'Boolean', icon: FiToggleLeft, color: 'purple', description: 'Yes/No or True/False' },
    { value: 'date', label: 'Date', icon: FiCalendar, color: 'orange', description: 'Date picker' },
    { value: 'select', label: 'Single Select', icon: FiList, color: 'red', description: 'Choose one option' },
    { value: 'multiselect', label: 'Multi Select', icon: FiGrid, color: 'pink', description: 'Choose multiple options' },
    { value: 'color', label: 'Color', icon: FiDroplet, color: 'indigo', description: 'Color picker with swatches' },
    { value: 'size', label: 'Size', icon: FiDroplet, color: 'teal', description: 'Size selector with swatches' },
    { value: 'range', label: 'Range', icon: FiSliders, color: 'cyan', description: 'Slider for range values' }
  ], []);

  const getAttributeIcon = (type) => {
    const found = attributeTypes.find(t => t.value === type);
    return found ? found.icon : FiTag;
  };

  const getAttributeColor = (type) => {
    const found = attributeTypes.find(t => t.value === type);
    return found ? found.color : 'gray';
  };

  const [newAttribute, setNewAttribute] = useState({
    name: '',
    slug: '',
    type: 'text',
    options: [],
    unit: '',
    placeholder: '',
    isRequired: false,
    isFilterable: true,
    isSearchable: true,
    isComparable: false,
    isVisible: true,
    sortOrder: 0,
    validation: {
      min: null,
      max: null,
      pattern: '',
      minLength: null,
      maxLength: null
    },
    displayType: 'dropdown',
    description: ''
  });

  // Filter attributes based on search and type
  const filteredAttributes = useMemo(() => {
    return formData.attributes.filter(attr => {
      const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          attr.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || attr.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [formData.attributes, searchTerm, filterType]);

  const toggleAttribute = (attributeId) => {
    setExpandedAttributes(prev =>
      prev.includes(attributeId)
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    );
  };

  const handleAddAttribute = () => {
    if (!newAttribute.name.trim()) {
      showToast?.('Attribute name is required', { type: 'error' });
      return;
    }

    // Generate slug
    const slug = newAttribute.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');

    // Check for duplicate name
    if (formData.attributes.some(attr => attr.name.toLowerCase() === newAttribute.name.toLowerCase())) {
      showToast?.('An attribute with this name already exists', { type: 'error' });
      return;
    }

    const attribute = {
      ...newAttribute,
      _id: Date.now().toString(),
      slug,
      sortOrder: formData.attributes.length
    };

    onInputChange('attributes', [...formData.attributes, attribute]);
    showToast?.('Attribute added successfully', { type: 'success' });
    
    resetNewAttribute();
    setShowAttributeForm(false);
  };

  const handleUpdateAttribute = () => {
    if (!editingAttribute) return;
    
    // Check for duplicate name (excluding current attribute)
    if (formData.attributes.some(attr => 
      attr._id !== editingAttribute._id && 
      attr.name.toLowerCase() === editingAttribute.name.toLowerCase()
    )) {
      showToast?.('An attribute with this name already exists', { type: 'error' });
      return;
    }
    
    const updatedAttributes = formData.attributes.map(attr =>
      attr._id === editingAttribute._id ? editingAttribute : attr
    );
    
    onInputChange('attributes', updatedAttributes);
    showToast?.('Attribute updated successfully', { type: 'success' });
    setEditingAttribute(null);
  };

  const handleDeleteAttribute = (attributeId) => {
    if (window.confirm('Are you sure you want to delete this attribute? This action cannot be undone.')) {
      const filteredAttributes = formData.attributes.filter(attr => attr._id !== attributeId);
      onInputChange('attributes', filteredAttributes);
      showToast?.('Attribute deleted successfully', { type: 'info' });
    }
  };

  const handleDuplicateAttribute = (attribute) => {
    const duplicate = {
      ...attribute,
      _id: Date.now().toString(),
      name: `${attribute.name} (Copy)`,
      slug: `${attribute.slug}_copy`,
      sortOrder: formData.attributes.length
    };
    onInputChange('attributes', [...formData.attributes, duplicate]);
    showToast?.('Attribute duplicated successfully', { type: 'success' });
  };

  const handleAddOption = (attribute, option) => {
    const newOption = {
      value: option.value,
      label: option.label || option.value,
      slug: option.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      sortOrder: attribute.options?.length || 0,
      ...(option.color && { color: option.color })
    };

    const updatedOptions = [...(attribute.options || []), newOption];
    
    if (editingAttribute) {
      setEditingAttribute({ ...editingAttribute, options: updatedOptions });
    } else {
      setNewAttribute({ ...newAttribute, options: updatedOptions });
    }
    showToast?.('Option added', { type: 'success' });
  };

  const handleRemoveOption = (attribute, optionIndex) => {
    const updatedOptions = attribute.options.filter((_, index) => index !== optionIndex);
    
    if (editingAttribute) {
      setEditingAttribute({ ...editingAttribute, options: updatedOptions });
    } else {
      setNewAttribute({ ...newAttribute, options: updatedOptions });
    }
    showToast?.('Option removed', { type: 'info' });
  };

  const moveAttribute = (index, direction) => {
    const newAttributes = [...formData.attributes];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newAttributes.length) return;
    
    [newAttributes[index], newAttributes[newIndex]] = [newAttributes[newIndex], newAttributes[index]];
    
    // Update sortOrder
    newAttributes.forEach((attr, i) => {
      attr.sortOrder = i;
    });
    
    onInputChange('attributes', newAttributes);
    showToast?.('Attribute reordered', { type: 'info' });
  };

  const resetNewAttribute = () => {
    setNewAttribute({
      name: '',
      slug: '',
      type: 'text',
      options: [],
      unit: '',
      placeholder: '',
      isRequired: false,
      isFilterable: true,
      isSearchable: true,
      isComparable: false,
      isVisible: true,
      sortOrder: 0,
      validation: {
        min: null,
        max: null,
        pattern: '',
        minLength: null,
        maxLength: null
      },
      displayType: 'dropdown',
      description: ''
    });
  };

  const getTypeStats = useCallback(() => {
    const stats = {};
    formData.attributes.forEach(attr => {
      stats[attr.type] = (stats[attr.type] || 0) + 1;
    });
    return stats;
  }, [formData.attributes]);

  const typeStats = getTypeStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Category Attributes</h2>
            <p className="text-indigo-100 mt-1">
              Define attributes that products in this category can have
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAttributeForm(true)}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center text-sm font-medium shadow-lg"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Attribute
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <p className="text-indigo-100 text-xs">Total Attributes</p>
            <p className="text-2xl font-bold">{formData.attributes.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <p className="text-indigo-100 text-xs">Filterable</p>
            <p className="text-2xl font-bold">
              {formData.attributes.filter(a => a.isFilterable).length}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <p className="text-indigo-100 text-xs">Required</p>
            <p className="text-2xl font-bold">
              {formData.attributes.filter(a => a.isRequired).length}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
            <p className="text-indigo-100 text-xs">With Options</p>
            <p className="text-2xl font-bold">
              {formData.attributes.filter(a => a.options?.length > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search attributes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            {attributeTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} {typeStats[type.value] ? `(${typeStats[type.value]})` : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Attributes List/Grid */}
      {filteredAttributes.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
          <AnimatePresence>
            {filteredAttributes.map((attribute, index) => {
              const TypeIcon = getAttributeIcon(attribute.type);
              const color = getAttributeColor(attribute.type);
              const isExpanded = expandedAttributes.includes(attribute._id);

              return viewMode === 'grid' ? (
                <motion.div
                  key={attribute._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                          <TypeIcon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{attribute.name}</h4>
                          <p className="text-xs text-gray-500">
                            {attributeTypes.find(t => t.value === attribute.type)?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingAttribute(attribute)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateAttribute(attribute)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttribute(attribute._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {attribute.isFilterable && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                          <FiFilter className="w-3 h-3 mr-1" />
                          Filterable
                        </span>
                      )}
                      {attribute.isSearchable && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                          <FiSearch className="w-3 h-3 mr-1" />
                          Searchable
                        </span>
                      )}
                      {attribute.isRequired && (
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                          <FiAlertCircle className="w-3 h-3 mr-1" />
                          Required
                        </span>
                      )}
                      {!attribute.isVisible && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          <FiEyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </span>
                      )}
                    </div>

                    {attribute.options?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">
                          {attribute.options.length} options
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {attribute.options.slice(0, 3).map((opt, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {opt.label || opt.value}
                              {opt.color && (
                                <span
                                  className="inline-block w-2 h-2 rounded-full ml-1"
                                  style={{ backgroundColor: opt.color }}
                                />
                              )}
                            </span>
                          ))}
                          {attribute.options.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{attribute.options.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={attribute._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all"
                >
                  {/* List View Header */}
                  <div
                    onClick={() => toggleAttribute(attribute._id)}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-gray-100 hover:to-gray-50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveAttribute(index, 'up');
                          }}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          disabled={index === 0}
                        >
                          <FiChevronUp className={`w-4 h-4 ${index === 0 ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveAttribute(index, 'down');
                          }}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          disabled={index === formData.attributes.length - 1}
                        >
                          <FiChevronDown className={`w-4 h-4 ${index === formData.attributes.length - 1 ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                      </div>

                      <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                        <TypeIcon className={`w-5 h-5 text-${color}-600`} />
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900">{attribute.name}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {attributeTypes.find(t => t.value === attribute.type)?.label}
                          </span>
                          {attribute.unit && (
                            <span className="text-xs text-gray-400">Unit: {attribute.unit}</span>
                          )}
                          {attribute.options?.length > 0 && (
                            <span className="text-xs text-gray-400">
                              {attribute.options.length} options
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Status Badges */}
                      <div className="flex items-center space-x-2">
                        {attribute.isFilterable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center">
                            <FiFilter className="w-3 h-3 mr-1" />
                            Filter
                          </span>
                        )}
                        {attribute.isRequired && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAttribute(attribute);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateAttribute(attribute);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttribute(attribute._id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 bg-gray-50/50"
                      >
                        <div className="p-4">
                          <AttributeDetails attribute={attribute} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300"
        >
          <FiSettings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attributes found</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || filterType !== 'all' 
              ? 'No attributes match your search criteria. Try adjusting your filters.'
              : 'Add attributes to help customers filter and find products in this category.'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowAttributeForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 inline-flex items-center text-sm font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              Add Your First Attribute
            </button>
          )}
        </motion.div>
      )}

      {/* Add/Edit Attribute Modal */}
      <AnimatePresence>
        {(showAttributeForm || editingAttribute) && (
          <AttributeFormModal
            attribute={editingAttribute || newAttribute}
            isEditing={!!editingAttribute}
            onClose={() => {
              setShowAttributeForm(false);
              setEditingAttribute(null);
              resetNewAttribute();
            }}
            onSave={editingAttribute ? handleUpdateAttribute : handleAddAttribute}
            onChange={editingAttribute ? setEditingAttribute : setNewAttribute}
            attributeTypes={attributeTypes}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Attribute Details Component
const AttributeDetails = ({ attribute }) => {
  const color = attribute.type === 'color' ? 'indigo' : 'gray';
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Slug</p>
        <p className="font-mono text-sm text-gray-900 break-all">{attribute.slug}</p>
      </div>
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Display Type</p>
        <p className="text-sm text-gray-900 capitalize flex items-center">
          {attribute.displayType}
          {attribute.displayType === 'color_swatch' && (
            <span className="ml-2 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
          )}
        </p>
      </div>
      {attribute.unit && (
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Unit</p>
          <p className="text-sm text-gray-900 font-mono">{attribute.unit}</p>
        </div>
      )}
      {attribute.placeholder && (
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Placeholder</p>
          <p className="text-sm text-gray-900 italic">"{attribute.placeholder}"</p>
        </div>
      )}
      {attribute.description && (
        <div className="col-span-3 bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700">{attribute.description}</p>
        </div>
      )}
      {attribute.validation && (attribute.validation.min !== null || 
        attribute.validation.max !== null || 
        attribute.validation.pattern || 
        attribute.validation.minLength || 
        attribute.validation.maxLength) && (
        <div className="col-span-3 bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Validation Rules
          </p>
          <div className="flex flex-wrap gap-2">
            {attribute.validation.min !== null && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Min: {attribute.validation.min}
              </span>
            )}
            {attribute.validation.max !== null && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Max: {attribute.validation.max}
              </span>
            )}
            {attribute.validation.minLength && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Min Length: {attribute.validation.minLength}
              </span>
            )}
            {attribute.validation.maxLength && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                Max Length: {attribute.validation.maxLength}
              </span>
            )}
            {attribute.validation.pattern && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                Pattern: {attribute.validation.pattern}
              </span>
            )}
          </div>
        </div>
      )}
      {attribute.options?.length > 0 && (
        <div className="col-span-3 bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Options ({attribute.options.length})</p>
          <div className="flex flex-wrap gap-2">
            {attribute.options.map((option, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
              >
                {option.label || option.value}
                {option.color && (
                  <span
                    className="inline-block w-4 h-4 rounded-full ml-2"
                    style={{ backgroundColor: option.color }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Attribute Form Modal
const AttributeFormModal = ({
  attribute,
  isEditing,
  onClose,
  onSave,
  onChange,
  attributeTypes,
  onAddOption,
  onRemoveOption,
  showToast
}) => {
  const [newOption, setNewOption] = useState({ value: '', label: '', color: '#000000' });
  const [activeTab, setActiveTab] = useState('basic');
  const [validation, setValidation] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!attribute.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (attribute.type === 'select' || attribute.type === 'multiselect' || 
        attribute.type === 'color' || attribute.type === 'size') {
      if (!attribute.options?.length) {
        errors.options = 'At least one option is required';
      }
    }
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    } else {
      showToast?.('Please fill in all required fields', { type: 'error' });
    }
  };

  const handleAddOption = () => {
    if (!newOption.value.trim()) {
      showToast?.('Option value is required', { type: 'error' });
      return;
    }
    onAddOption(attribute, newOption);
    setNewOption({ value: '', label: '', color: '#000000' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit Attribute' : 'Create New Attribute'}
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  {isEditing ? 'Modify the attribute details below' : 'Define a new attribute for products in this category'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 bg-gray-50">
            <nav className="flex -mb-px space-x-6">
              {[
                { id: 'basic', label: 'Basic Info', icon: FiSettings },
                { id: 'options', label: 'Options & Values', icon: FiList },
                { id: 'settings', label: 'Advanced Settings', icon: FiSliders }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 border-b-2 font-medium text-sm flex items-center space-x-2
                      transition-all
                      ${isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attribute Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={attribute.name}
                    onChange={(e) => onChange({ ...attribute, name: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      validation.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="e.g., Color, Size, Material"
                  />
                  {validation.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {validation.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={attribute.description || ''}
                    onChange={(e) => onChange({ ...attribute, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Brief description of this attribute..."
                  />
                </div>

                {/* Type and Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attribute Type
                    </label>
                    <select
                      value={attribute.type}
                      onChange={(e) => onChange({ ...attribute, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      {attributeTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Type
                    </label>
                    <select
                      value={attribute.displayType}
                      onChange={(e) => onChange({ ...attribute, displayType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="dropdown">Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkboxes</option>
                      <option value="color_swatch">Color Swatches</option>
                      <option value="size_swatch">Size Swatches</option>
                      <option value="range_slider">Range Slider</option>
                    </select>
                  </div>
                </div>

                {/* Unit and Placeholder */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit (optional)
                    </label>
                    <input
                      type="text"
                      value={attribute.unit || ''}
                      onChange={(e) => onChange({ ...attribute, unit: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="e.g., cm, kg, ml"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder (optional)
                    </label>
                    <input
                      type="text"
                      value={attribute.placeholder || ''}
                      onChange={(e) => onChange({ ...attribute, placeholder: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="e.g., Select a color..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'options' && (
              <div className="space-y-6">
                {(attribute.type === 'select' || 
                  attribute.type === 'multiselect' || 
                  attribute.type === 'color' || 
                  attribute.type === 'size') && (
                  <>
                    {/* Add Option Form */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Option</h4>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          placeholder="Option value"
                          value={newOption.value}
                          onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Display label (optional)"
                          value={newOption.label}
                          onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {attribute.type === 'color' && (
                          <input
                            type="color"
                            value={newOption.color}
                            onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                            className="w-16 h-12 p-1 border-2 border-gray-200 rounded-xl"
                          />
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddOption}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center shadow-lg"
                        >
                          <FiPlus className="w-5 h-5 mr-2" />
                          Add
                        </motion.button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Defined Options ({attribute.options?.length || 0})
                      </h4>
                      {attribute.options?.length > 0 ? (
                        <div className="space-y-2">
                          <AnimatePresence>
                            {attribute.options.map((option, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                              >
                                <div className="flex items-center space-x-4">
                                  <FiMove className="text-gray-400 cursor-move" />
                                  <div>
                                    <span className="font-medium text-gray-900">{option.value}</span>
                                    {option.label && option.label !== option.value && (
                                      <span className="ml-2 text-sm text-gray-500">→ {option.label}</span>
                                    )}
                                  </div>
                                  {option.color && (
                                    <span
                                      className="inline-block w-6 h-6 rounded-full border-2 border-white shadow-md"
                                      style={{ backgroundColor: option.color }}
                                    />
                                  )}
                                </div>
                                <button
                                  onClick={() => onRemoveOption(attribute, index)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <FiList className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No options added yet</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {attribute.type === 'range' && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Range Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Minimum Value</label>
                        <input
                          type="number"
                          value={attribute.validation?.min || ''}
                          onChange={(e) => onChange({
                            ...attribute,
                            validation: { ...attribute.validation, min: e.target.value ? Number(e.target.value) : null }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Maximum Value</label>
                        <input
                          type="number"
                          value={attribute.validation?.max || ''}
                          onChange={(e) => onChange({
                            ...attribute,
                            validation: { ...attribute.validation, max: e.target.value ? Number(e.target.value) : null }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Behavior Settings */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Behavior Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-200 transition-all">
                      <input
                        type="checkbox"
                        checked={attribute.isRequired}
                        onChange={(e) => onChange({ ...attribute, isRequired: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Required field</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-200 transition-all">
                      <input
                        type="checkbox"
                        checked={attribute.isFilterable}
                        onChange={(e) => onChange({ ...attribute, isFilterable: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Use for filtering</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-200 transition-all">
                      <input
                        type="checkbox"
                        checked={attribute.isSearchable}
                        onChange={(e) => onChange({ ...attribute, isSearchable: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Searchable</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-200 transition-all">
                      <input
                        type="checkbox"
                        checked={attribute.isComparable}
                        onChange={(e) => onChange({ ...attribute, isComparable: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Allow comparison</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-200 transition-all">
                      <input
                        type="checkbox"
                        checked={attribute.isVisible}
                        onChange={(e) => onChange({ ...attribute, isVisible: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Visible on product page</span>
                    </label>
                  </div>
                </div>

                {/* Validation Rules */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Validation Rules</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Min Length</label>
                      <input
                        type="number"
                        value={attribute.validation?.minLength || ''}
                        onChange={(e) => onChange({
                          ...attribute,
                          validation: { ...attribute.validation, minLength: e.target.value ? Number(e.target.value) : null }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Max Length</label>
                      <input
                        type="number"
                        value={attribute.validation?.maxLength || ''}
                        onChange={(e) => onChange({
                          ...attribute,
                          validation: { ...attribute.validation, maxLength: e.target.value ? Number(e.target.value) : null }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="255"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-2">Pattern (Regex)</label>
                      <input
                        type="text"
                        value={attribute.validation?.pattern || ''}
                        onChange={(e) => onChange({
                          ...attribute,
                          validation: { ...attribute.validation, pattern: e.target.value }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        placeholder="^[A-Za-z0-9]+$"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Regular expression pattern for validation (e.g., ^[A-Z]+$ for uppercase only)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              {isEditing ? 'Update Attribute' : 'Create Attribute'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CategoryAttributes;