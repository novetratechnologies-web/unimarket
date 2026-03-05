// components/admin/products/tabs/VariantsTab.jsx
import React, { useState, useEffect } from 'react';
import {
  FiCopy,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiPackage,
  FiStar,
  FiGrid,
  FiList,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiAlertCircle,
  FiInfo,
  FiArrowLeft
} from 'react-icons/fi';

// Schema-aligned valid attribute names
const VALID_ATTRIBUTE_NAMES = [
  'size', 'color', 'material', 'style', 'pattern', 
  'length', 'width', 'height', 'weight', 'capacity', 
  'flavor', 'scent', 'finish', 'edition', 'other'
];

// Schema-aligned display types
const VALID_DISPLAY_TYPES = ['text', 'color_swatch', 'image_swatch', 'button'];

// Schema-aligned status values
const VALID_STATUSES = ['active', 'inactive', 'discontinued'];

// Schema-aligned weight units
const VALID_WEIGHT_UNITS = ['g', 'kg', 'lb', 'oz'];

// Schema-aligned dimension units
const VALID_DIMENSION_UNITS = ['cm', 'in', 'mm'];

const VariantsTab = ({ formData, onInputChange, errors }) => {
  const [editingVariant, setEditingVariant] = useState(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [expandedAttributes, setExpandedAttributes] = useState([]);
  const [variantViewMode, setVariantViewMode] = useState('table');
  const [showVariantWarning, setShowVariantWarning] = useState(false);

  // Check if product type supports variants
  useEffect(() => {
    const supportsVariants = formData.type === 'variable';
    if (formData.hasVariants && !supportsVariants) {
      onInputChange('hasVariants', false);
      setShowVariantWarning(true);
    } else {
      setShowVariantWarning(false);
    }
  }, [formData.type, formData.hasVariants]);

  // Validate attribute name against schema
  const validateAttributeName = (name) => {
    return VALID_ATTRIBUTE_NAMES.includes(name);
  };

  // Validate SKU format (alphanumeric only)
  const validateSku = (sku) => {
    return /^[a-zA-Z0-9]+$/.test(sku);
  };

  // Clean SKU to alphanumeric only
  const cleanSku = (sku) => {
    return sku ? sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
  };

  // ✅ FIXED: Removed id field and added validation
  const addVariantAttribute = () => {
    onInputChange('variantAttributes', [
      ...(formData.variantAttributes || []),
      {
        name: '',
        values: [''],
        displayType: 'text',
        swatchValues: []
      }
    ]);
  };

  const updateVariantAttribute = (index, field, value) => {
    const newAttributes = [...(formData.variantAttributes || [])];
    
    // Validate field values against schema
    if (field === 'name' && value && !VALID_ATTRIBUTE_NAMES.includes(value)) {
      // Allow custom value but show warning
      newAttributes[index][field] = 'other';
    } else {
      newAttributes[index][field] = value;
    }
    
    // If name changes and has swatchValues, update them
    if (field === 'name' && newAttributes[index].swatchValues?.length > 0) {
      newAttributes[index].swatchValues = newAttributes[index].swatchValues.map(swatch => ({
        ...swatch,
        value: swatch.value
      }));
    }
    
    onInputChange('variantAttributes', newAttributes);
  };

  const removeVariantAttribute = (index) => {
    const newAttributes = formData.variantAttributes.filter((_, i) => i !== index);
    onInputChange('variantAttributes', newAttributes);
    
    // Also remove any generated variants based on this attribute
    if (formData.variants?.length > 0) {
      onInputChange('variants', []);
    }
  };

  const addAttributeValue = (attrIndex) => {
    const newAttributes = [...(formData.variantAttributes || [])];
    newAttributes[attrIndex].values.push('');
    onInputChange('variantAttributes', newAttributes);
  };

  const updateAttributeValue = (attrIndex, valueIndex, value) => {
    const newAttributes = [...(formData.variantAttributes || [])];
    newAttributes[attrIndex].values[valueIndex] = value;
    
    // Update corresponding swatch value if exists
    if (newAttributes[attrIndex].swatchValues?.[valueIndex]) {
      newAttributes[attrIndex].swatchValues[valueIndex].value = value;
    }
    
    onInputChange('variantAttributes', newAttributes);
  };

  const removeAttributeValue = (attrIndex, valueIndex) => {
    const newAttributes = [...(formData.variantAttributes || [])];
    newAttributes[attrIndex].values = newAttributes[attrIndex].values.filter((_, i) => i !== valueIndex);
    
    // Remove corresponding swatch value
    if (newAttributes[attrIndex].swatchValues?.length > 0) {
      newAttributes[attrIndex].swatchValues = newAttributes[attrIndex].swatchValues.filter((_, i) => i !== valueIndex);
    }
    
    onInputChange('variantAttributes', newAttributes);
  };

  const toggleAttributeExpand = (index) => {
    setExpandedAttributes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const generateCombinations = (attributes) => {
    const combinations = [];
    const attributeValues = attributes.map(attr => attr.values.filter(v => v.trim() !== ''));
    
    const generate = (current, depth) => {
      if (depth === attributeValues.length) {
        combinations.push([...current]);
        return;
      }
      
      for (const value of attributeValues[depth]) {
        generate([...current, value], depth + 1);
      }
    };
    
    generate([], 0);
    return combinations;
  };

  // ✅ FIXED: Removed _id field and added proper validation
  const generateVariants = () => {
    if (!formData.variantAttributes || formData.variantAttributes.length === 0) {
      alert('Please add at least one variant option');
      return;
    }

    // Validate that all attributes have at least one value
    const hasEmptyValues = formData.variantAttributes.some(attr => 
      attr.values.filter(v => v.trim() !== '').length === 0
    );
    
    if (hasEmptyValues) {
      alert('Please add at least one value for each variant option');
      return;
    }

    // Validate that all attributes have names
    const hasUnnamedAttributes = formData.variantAttributes.some(attr => !attr.name);
    if (hasUnnamedAttributes) {
      alert('Please select a name for each variant option');
      return;
    }

    const combinations = generateCombinations(formData.variantAttributes);
    
    const newVariants = combinations.map((combo, index) => {
      const options = combo.map((value, i) => ({
        name: formData.variantAttributes[i].name,
        value: value
      }));

      const variantName = options.map(opt => opt.value).join(' / ');
      const cleanSkuPrefix = formData.sku ? cleanSku(formData.sku) : 'VAR';
      
      return {
        // ✅ NO _id field - let MongoDB generate it
        sku: `${cleanSkuPrefix}${String(index + 1).padStart(3, '0')}`,
        name: variantName,
        price: Number(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
        cost: formData.cost ? Number(formData.cost) : null,
        wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : null,
        quantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        trackQuantity: true,
        allowBackorder: formData.allowBackorder || false,
        backorderLimit: Number(formData.backorderLimit) || 0,
        options: options,
        attributes: options.reduce((acc, opt) => ({ ...acc, [opt.name]: opt.value }), {}),
        isDefault: index === 0,
        status: 'active',
        image: null,
        images: [],
        weight: formData.weight ? Number(formData.weight) : null,
        weightUnit: formData.weightUnit || 'g',
        dimensions: {
          ...(formData.dimensions?.length && { length: Number(formData.dimensions.length) }),
          ...(formData.dimensions?.width && { width: Number(formData.dimensions.width) }),
          ...(formData.dimensions?.height && { height: Number(formData.dimensions.height) }),
          unit: formData.dimensions?.unit || 'cm'
        },
        metadata: {}
      };
    });

    onInputChange('variants', newVariants);
    onInputChange('hasVariants', true);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...(formData.variants || [])];
    
    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newVariants[index][parent] = {
        ...newVariants[index][parent],
        [child]: value
      };
    } else {
      // Validate field values
      if (field === 'sku') {
        // Ensure SKU is alphanumeric
        newVariants[index][field] = cleanSku(value);
      } else if (field === 'price' || field === 'compareAtPrice' || field === 'cost' || field === 'wholesalePrice') {
        // Ensure numeric fields are numbers or null
        newVariants[index][field] = value ? Number(value) : null;
      } else if (field === 'quantity' || field === 'reservedQuantity' || field === 'backorderLimit') {
        // Ensure integer fields are integers
        newVariants[index][field] = value ? parseInt(value) : 0;
      } else if (field === 'status') {
        // Ensure status is valid
        if (VALID_STATUSES.includes(value)) {
          newVariants[index][field] = value;
        }
      } else if (field === 'weight') {
        newVariants[index][field] = value ? Number(value) : null;
      } else if (field === 'weightUnit') {
        if (VALID_WEIGHT_UNITS.includes(value)) {
          newVariants[index][field] = value;
        }
      } else {
        newVariants[index][field] = value;
      }
    }
    
    onInputChange('variants', newVariants);
  };

  const removeVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    onInputChange('variants', newVariants);
    
    // If no variants left, set hasVariants to false
    if (newVariants.length === 0) {
      onInputChange('hasVariants', false);
    }
  };

  const setDefaultVariant = (index) => {
    const newVariants = formData.variants.map((v, i) => ({
      ...v,
      isDefault: i === index
    }));
    onInputChange('variants', newVariants);
  };

  const bulkUpdateVariants = (field, value) => {
    const newVariants = formData.variants.map(v => {
      let newValue = value;
      
      // Validate and transform values
      if (field === 'price' || field === 'compareAtPrice' || field === 'cost' || field === 'wholesalePrice') {
        newValue = value ? Number(value) : null;
      } else if (field === 'quantity' || field === 'reservedQuantity') {
        newValue = value ? parseInt(value) : 0;
      } else if (field === 'status') {
        if (!VALID_STATUSES.includes(value)) return v;
      } else if (field === 'weight') {
        newValue = value ? Number(value) : null;
      } else if (field === 'weightUnit') {
        if (!VALID_WEIGHT_UNITS.includes(value)) return v;
      }
      
      return {
        ...v,
        [field]: newValue
      };
    });
    onInputChange('variants', newVariants);
  };

  // ✅ FIXED: Removed _id field from duplicated variant
  const duplicateVariant = (index) => {
    const variantToDuplicate = formData.variants[index];
    const cleanSkuPrefix = variantToDuplicate.sku.replace(/[0-9]+$/, '');
    const newSku = `${cleanSkuPrefix}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const newVariant = {
      ...variantToDuplicate,
      // ✅ NO _id field
      sku: newSku,
      name: `${variantToDuplicate.name} (Copy)`,
      isDefault: false,
      quantity: 0,
      reservedQuantity: 0
    };
    const newVariants = [...formData.variants, newVariant];
    onInputChange('variants', newVariants);
  };

  // Calculate variant statistics
  const totalStock = formData.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
  const activeVariants = formData.variants?.filter(v => v.status === 'active').length || 0;
  const minPrice = formData.variants?.length ? Math.min(...formData.variants.map(v => v.price)) : 0;
  const maxPrice = formData.variants?.length ? Math.max(...formData.variants.map(v => v.price)) : 0;

  // Check if product type is variable
  const isVariableProduct = formData.type === 'variable';

  // If not a variable product, show message to change type
  if (!isVariableProduct) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-start">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
              <FiCopy className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Product Variants</h3>
              <p className="text-sm text-gray-600">
                Create variations of your product like size, color, or material.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h4 className="text-lg font-medium text-yellow-800 mb-2">Variants Not Available</h4>
          <p className="text-sm text-yellow-700 max-w-md mx-auto mb-6">
            This product is set as a <span className="font-semibold">{formData.type || 'simple'}</span> product. 
            Variants are only available for <span className="font-semibold">Variable Products</span>.
          </p>
          <button
            onClick={() => {
              // Navigate to basic tab and change type
              const basicTab = document.querySelector('[data-tab="basic"]');
              if (basicTab) basicTab.click();
            }}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Go to Basic Info to change product type
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiCopy className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Product Variants</h3>
            <p className="text-sm text-gray-600">
              Create variations of your product like size, color, or material. Each variant can have its own price, SKU, and inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Variant Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiInfo className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Variable product configuration
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">{formData.variantAttributes?.length || 0}</span>
              <span className="text-blue-600 ml-1">options</span>
            </div>
            <div className="text-sm">
              <span className="text-blue-600 font-medium">{formData.variants?.length || 0}</span>
              <span className="text-blue-600 ml-1">variants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Attributes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiSettings className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Variant Options</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {formData.variantAttributes?.length || 0} options
              </span>
            </div>
            <button
              type="button"
              onClick={addVariantAttribute}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Option
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {(formData.variantAttributes || []).map((attr, attrIndex) => (
              <div key={attrIndex} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => toggleAttributeExpand(attrIndex)}
                      className="p-1 mr-2 hover:bg-gray-100 rounded"
                    >
                      {expandedAttributes.includes(attrIndex) ? (
                        <FiChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Option Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={attr.name}
                        onChange={(e) => updateVariantAttribute(attrIndex, 'name', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          attr.name && !VALID_ATTRIBUTE_NAMES.includes(attr.name) ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select option</option>
                        {VALID_ATTRIBUTE_NAMES.map(name => (
                          <option key={name} value={name}>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </option>
                        ))}
                      </select>
                      {attr.name && !VALID_ATTRIBUTE_NAMES.includes(attr.name) && (
                        <p className="mt-1 text-xs text-yellow-600">
                          Custom attribute name. This will be stored as "other" in the database.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeVariantAttribute(attrIndex)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg ml-2"
                    title="Remove option"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                {expandedAttributes.includes(attrIndex) && (
                  <>
                    {/* Values */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Values <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {attr.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateAttributeValue(attrIndex, valueIndex, e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder={`Enter ${attr.name || 'option'} value`}
                              required
                            />
                            {attr.values.length > 1 && (
                              <button
                                onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => addAttributeValue(attrIndex)}
                        className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <FiPlus className="w-4 h-4 mr-1" />
                        Add another value
                      </button>
                    </div>

                    {/* Display Type */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Type
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {VALID_DISPLAY_TYPES.map((type) => (
                          <label key={type} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`displayType-${attrIndex}`}
                              value={type}
                              checked={attr.displayType === type}
                              onChange={(e) => updateVariantAttribute(attrIndex, 'displayType', e.target.value)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Swatch Values */}
                    {(attr.displayType === 'color_swatch' || attr.displayType === 'image_swatch') && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {attr.displayType === 'color_swatch' ? 'Color Swatches' : 'Image Swatches'}
                        </label>
                        <div className="space-y-3">
                          {attr.values.filter(v => v.trim()).map((value, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600 w-24 truncate">{value}:</span>
                              {attr.displayType === 'color_swatch' ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="color"
                                    value={attr.swatchValues?.[idx]?.color || '#000000'}
                                    onChange={(e) => {
                                      const newSwatches = [...(attr.swatchValues || [])];
                                      newSwatches[idx] = { value, color: e.target.value };
                                      updateVariantAttribute(attrIndex, 'swatchValues', newSwatches);
                                    }}
                                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-500">
                                    {attr.swatchValues?.[idx]?.color || '#000000'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="url"
                                    value={attr.swatchValues?.[idx]?.image || ''}
                                    onChange={(e) => {
                                      const newSwatches = [...(attr.swatchValues || [])];
                                      newSwatches[idx] = { value, image: e.target.value };
                                      updateVariantAttribute(attrIndex, 'swatchValues', newSwatches);
                                    }}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="https://example.com/image.jpg"
                                  />
                                  {attr.swatchValues?.[idx]?.image && (
                                    <img
                                      src={attr.swatchValues[idx].image}
                                      alt={value}
                                      className="w-8 h-8 rounded object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/32?text=Error';
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {(formData.variantAttributes || []).length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={generateVariants}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <FiCpu className="w-5 h-5 mr-2" />
                Generate Variants
              </button>
            </div>
          )}

          {(formData.variantAttributes || []).length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiCopy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No variant options configured</p>
              <p className="text-xs text-gray-400">Click "Add Option" to create variant attributes like size or color</p>
            </div>
          )}
        </div>
      </div>

      {/* Variants List */}
      {(formData.variants || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiGrid className="w-5 h-5 text-indigo-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">
                  Generated Variants
                </h4>
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                  {formData.variants.length} variants
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setVariantViewMode('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      variantViewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Table view"
                  >
                    <FiList className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setVariantViewMode('cards')}
                    className={`p-2 rounded-lg transition-colors ${
                      variantViewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Cards view"
                  >
                    <FiGrid className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBulkUpdate(!showBulkUpdate)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    showBulkUpdate 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bulk Update
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Update Panel */}
          {showBulkUpdate && (
            <div className="bg-indigo-50 border-b border-indigo-200 p-4">
              <h5 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
                <FiSettings className="w-4 h-4 mr-2" />
                Bulk Update Variants
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    onChange={(e) => bulkUpdateVariants('price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Set all prices"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    onChange={(e) => bulkUpdateVariants('quantity', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Set all quantities"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    SKU Prefix
                  </label>
                  <input
                    type="text"
                    onChange={(e) => {
                      const prefix = cleanSku(e.target.value);
                      const newVariants = formData.variants.map((v, i) => ({
                        ...v,
                        sku: `${prefix}${String(i + 1).padStart(3, '0')}`
                      }));
                      onInputChange('variants', newVariants);
                    }}
                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SKU prefix (alphanumeric)"
                  />
                  <p className="mt-1 text-xs text-indigo-600">
                    Only letters and numbers allowed
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    Status
                  </label>
                  <select
                    onChange={(e) => bulkUpdateVariants('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Bulk set status</option>
                    {VALID_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Variants Display */}
          <div className="p-6">
            {variantViewMode === 'table' ? (
              // Table View
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.variants.map((variant, index) => (
                      <tr 
                        key={index} 
                        className={`${editingVariant === index ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                          <div className="text-xs text-gray-500">
                            {variant.options?.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingVariant === index ? (
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, 'sku', cleanSku(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                              placeholder="Alphanumeric only"
                            />
                          ) : (
                            <span className="text-sm text-gray-600 font-mono">{variant.sku}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingVariant === index ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${variant.price?.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingVariant === index ? (
                            <input
                              type="number"
                              min="0"
                              value={variant.quantity}
                              onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className={`text-sm ${
                              variant.quantity <= 0 ? 'text-red-600' : 
                              variant.quantity <= (variant.lowStockThreshold || 5) ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {variant.quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingVariant === index ? (
                            <select
                              value={variant.status}
                              onChange={(e) => updateVariant(index, 'status', e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            >
                              {VALID_STATUSES.map(status => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              variant.status === 'active' ? 'bg-green-100 text-green-800' :
                              variant.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {variant.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="radio"
                            name="defaultVariant"
                            checked={variant.isDefault}
                            onChange={() => setDefaultVariant(index)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {editingVariant === index ? (
                              <button
                                onClick={() => setEditingVariant(null)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <FiSave className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingVariant(index)}
                                className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => duplicateVariant(index)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Duplicate"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeVariant(index)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Cards View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${
                      variant.isDefault ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{variant.name}</h5>
                        <p className="text-xs text-gray-500 font-mono">{variant.sku}</p>
                        <div className="mt-1 text-xs text-gray-500">
                          {variant.options?.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
                        </div>
                      </div>
                      {variant.isDefault && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full flex items-center">
                          <FiStar className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium text-gray-900">${variant.price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${
                          variant.quantity <= 0 ? 'text-red-600' : 
                          variant.quantity <= (variant.lowStockThreshold || 5) ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {variant.quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          variant.status === 'active' ? 'bg-green-100 text-green-800' :
                          variant.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {variant.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setEditingVariant(editingVariant === index ? null : index)}
                        className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateVariant(index)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeVariant(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      {!variant.isDefault && (
                        <button
                          onClick={() => setDefaultVariant(index)}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Set as default"
                        >
                          <FiStar className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variant Summary */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-gray-500">Total Stock</span>
                <p className="text-xl font-bold text-gray-900">{totalStock}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Price Range</span>
                <p className="text-xl font-bold text-gray-900">
                  ${minPrice} - ${maxPrice}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Active Variants</span>
                <p className="text-xl font-bold text-gray-900">{activeVariants}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Default Variant</span>
                <p className="text-xl font-bold text-gray-900">
                  {formData.variants.find(v => v.isDefault)?.name || 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No variants message */}
      {formData.variants?.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCopy className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No variants generated</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Configure variant options above and click "Generate Variants" to create product variations.
          </p>
          {(formData.variantAttributes || []).length === 0 && (
            <button
              onClick={addVariantAttribute}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add First Option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantsTab;