// components/admin/products/tabs/CategorizationTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { 
  FiFolder, 
  FiTag, 
  FiLayers, 
  FiBookmark,
  FiPlus,
  FiStar,
  FiTrash2,
  FiChevronRight,
  FiChevronDown,
  FiHome,
  FiFilter,
  FiSearch,
  FiInfo,
  FiCheck,
  FiX,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../../../api/api';

const CategorizationTab = ({ formData, onInputChange, errors }) => {
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState(null);
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('tree');
  const [categoryPath, setCategoryPath] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const tree = buildCategoryTree(categories);
      setCategoryTree(tree);
      
      const map = {};
      categories.forEach(cat => {
        map[cat._id] = cat;
      });
      setCategoryMap(map);
    }
  }, [categories]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    
    try {
      // ✅ FIXED: Use the products API to get categories WITHOUT problematic params
      const categoriesRes = await api.products.getCategories({ 
        limit: 1000
        // Removed sortBy and sortOrder to avoid potential parameter issues
      });
      
      console.log('Categories response:', categoriesRes);
      
      // Process categories - handle different response structures
      let categoriesData = [];
      
      if (categoriesRes?.data?.data && Array.isArray(categoriesRes.data.data)) {
        categoriesData = categoriesRes.data.data;
      } else if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
        categoriesData = categoriesRes.data;
      } else if (Array.isArray(categoriesRes)) {
        categoriesData = categoriesRes;
      } else if (categoriesRes?.data?.categories && Array.isArray(categoriesRes.data.categories)) {
        categoriesData = categoriesRes.data.categories;
      }
      
      console.log('Processed categories:', categoriesData);
      setCategories(categoriesData);

      // Try to fetch collections, but don't fail if endpoint doesn't exist
      try {
        const collectionsRes = await api.get('/admin/collections');
        let collectionsData = [];
        if (collectionsRes?.data?.data) {
          collectionsData = collectionsRes.data.data;
        } else if (collectionsRes?.data) {
          collectionsData = Array.isArray(collectionsRes.data) ? collectionsRes.data : [];
        }
        setCollections(collectionsData.map(c => ({
          value: c._id,
          label: c.name
        })));
      } catch (collectionsError) {
        console.log('Collections endpoint not available, using empty array');
        setCollections([]);
      }

      // Fetch products for brands and attributes - with error handling
      try {
        const productsRes = await api.products.getAll({ limit: 1000 });
        
        let productsData = [];
        if (productsRes?.data?.data) {
          productsData = productsRes.data.data;
        } else if (productsRes?.data) {
          productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
        } else if (Array.isArray(productsRes)) {
          productsData = productsRes;
        }

        // Extract unique brands
        const uniqueBrands = [...new Set(productsData
          .filter(p => p.brand && typeof p.brand === 'string' && p.brand.trim() !== '')
          .map(p => p.brand)
        )];
        
        setBrandOptions(uniqueBrands.map(brand => ({
          value: brand,
          label: brand
        })));

        // Extract unique attribute names
        const attributeNames = new Set();
        productsData.forEach(product => {
          if (product.attributes && Array.isArray(product.attributes)) {
            product.attributes.forEach(attr => {
              if (attr.name && typeof attr.name === 'string') {
                attributeNames.add(attr.name);
              }
            });
          }
        });
        
        setAttributeOptions(Array.from(attributeNames).map(name => ({
          name,
          type: 'text',
          group: 'General'
        })));
      } catch (productsError) {
        console.log('Error fetching products for brands/attributes:', productsError);
        // Don't fail the whole component, just use empty arrays
        setBrandOptions([]);
        setAttributeOptions([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Provide a user-friendly error message
      if (error.response?.status === 400) {
        setFetchError('Invalid request parameters. Please check your API configuration.');
      } else if (error.response?.status === 401) {
        setFetchError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setFetchError('You do not have permission to view categories.');
      } else if (error.response?.status === 404) {
        setFetchError('Categories endpoint not found. Please check your API URL.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setFetchError('Request timeout. Please check your network connection.');
      } else {
        setFetchError(error.message || 'Failed to load data');
      }
      
      // Try a fallback request with minimal parameters
      try {
        console.log('Trying fallback category request...');
        // Use the raw API call with minimal params
        const fallbackRes = await api.get('/categories?limit=100');
        console.log('Fallback response:', fallbackRes);
        
        let fallbackData = [];
        if (fallbackRes?.data?.data) {
          fallbackData = fallbackRes.data.data;
        } else if (fallbackRes?.data) {
          fallbackData = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        }
        
        if (fallbackData.length > 0) {
          setCategories(fallbackData);
          setFetchError(null); // Clear error if fallback works
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (categories, parentId = null, level = 0) => {
    return categories
      .filter(cat => cat.parent === parentId || (parentId === null && !cat.parent))
      .map(cat => ({
        ...cat,
        level,
        children: buildCategoryTree(categories, cat._id, level + 1)
      }));
  };

  // Get main categories (level 0)
  const mainCategories = categories.filter(cat => !cat.parent);

  // Get subcategories based on selected main category
  const subCategories = selectedMainCategory 
    ? categories.filter(cat => cat.parent === selectedMainCategory)
    : [];

  // Get sub-subcategories based on selected sub category
  const subSubCategories = selectedSubCategory 
    ? categories.filter(cat => cat.parent === selectedSubCategory)
    : [];

  const handleMainCategoryChange = (categoryId) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory(null);
    setSelectedSubSubCategory(null);
    
    // Update form data with the selected category
    const currentCategories = formData.categories || [];
    if (categoryId && !currentCategories.includes(categoryId)) {
      onInputChange('categories', [...currentCategories, categoryId]);
    }
    
    // Update category path
    const mainCat = categories.find(c => c._id === categoryId);
    setCategoryPath(mainCat ? [mainCat] : []);
  };

  const handleSubCategoryChange = (categoryId) => {
    setSelectedSubCategory(categoryId);
    setSelectedSubSubCategory(null);
    
    const currentCategories = formData.categories || [];
    if (categoryId && !currentCategories.includes(categoryId)) {
      onInputChange('categories', [...currentCategories, categoryId]);
    }
    
    const subCat = categories.find(c => c._id === categoryId);
    setCategoryPath([...categoryPath.slice(0, 1), subCat]);
  };

  const handleSubSubCategoryChange = (categoryId) => {
    setSelectedSubSubCategory(categoryId);
    
    const currentCategories = formData.categories || [];
    if (categoryId && !currentCategories.includes(categoryId)) {
      onInputChange('categories', [...currentCategories, categoryId]);
    }
    
    const subSubCat = categories.find(c => c._id === categoryId);
    setCategoryPath([...categoryPath.slice(0, 2), subSubCat]);
  };

  const removeCategory = (categoryId) => {
    const newCategories = (formData.categories || []).filter(id => id !== categoryId);
    onInputChange('categories', newCategories);
    
    if (categoryId === selectedMainCategory) {
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
      setSelectedSubSubCategory(null);
      setCategoryPath([]);
    } else if (categoryId === selectedSubCategory) {
      setSelectedSubCategory(null);
      setSelectedSubSubCategory(null);
      setCategoryPath(categoryPath.slice(0, 1));
    } else if (categoryId === selectedSubSubCategory) {
      setSelectedSubSubCategory(null);
      setCategoryPath(categoryPath.slice(0, 2));
    }
  };

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category._id} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
            formData.categories?.includes(category._id)
              ? 'bg-indigo-50 border border-indigo-200'
              : 'hover:bg-gray-50 border border-transparent'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center flex-1">
            {category.children?.length > 0 && (
              <button
                onClick={() => toggleCategoryExpanded(category._id)}
                className="p-1 mr-1 hover:bg-gray-200 rounded"
                type="button"
              >
                {expandedCategories.includes(category._id) ? (
                  <FiChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <FiChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            <FiFolder className={`w-4 h-4 mr-2 ${
              formData.categories?.includes(category._id) ? 'text-indigo-600' : 'text-gray-400'
            }`} />
            <span className={`text-sm ${
              formData.categories?.includes(category._id) ? 'font-medium text-indigo-700' : 'text-gray-700'
            }`}>
              {category.name}
            </span>
          </div>
          
          {!formData.categories?.includes(category._id) ? (
            <button
              onClick={() => {
                const newCategories = [...(formData.categories || []), category._id];
                onInputChange('categories', newCategories);
              }}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              title="Add category"
              type="button"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => removeCategory(category._id)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove category"
              type="button"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {expandedCategories.includes(category._id) && category.children?.length > 0 && (
          <div className="ml-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const addAttribute = () => {
    const newAttributes = [...(formData.attributes || [])];
    newAttributes.push({
      id: Date.now().toString(),
      name: '',
      value: '',
      type: 'text',
      isFilterable: false,
      isSearchable: true,
      isComparable: false,
      group: 'General'
    });
    onInputChange('attributes', newAttributes);
  };

  const updateAttribute = (index, field, value) => {
    const newAttributes = [...(formData.attributes || [])];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    onInputChange('attributes', newAttributes);
  };

  const removeAttribute = (index) => {
    const newAttributes = (formData.attributes || []).filter((_, i) => i !== index);
    onInputChange('attributes', newAttributes);
  };

  const handleTagChange = (newTags) => {
    onInputChange('tags', newTags.map(tag => tag.value));
  };

  const currentBrand = formData.brand ? { value: formData.brand, label: formData.brand } : null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiLayers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Categorization</h3>
            <p className="text-sm text-gray-600">
              Organize your product by selecting categories, collections, tags, and attributes to make it easy for customers to find.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600">{fetchError}</p>
            <button
              onClick={fetchData}
              className="ml-auto px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiFolder className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Category Hierarchy</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {formData.categories?.length || 0} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'tree' ? 'select' : 'tree')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'tree' ? 'Switch to select view' : 'Switch to tree view'}
                type="button"
              >
                {viewMode === 'tree' ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <FiRefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading categories...</p>
            </div>
          ) : viewMode === 'tree' ? (
            // Tree View
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {categoryTree.length > 0 ? (
                renderCategoryTree(categoryTree)
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No categories found</p>
                </div>
              )}
            </div>
          ) : (
            // Hierarchical Select View
            <div className="space-y-4">
              {/* Category Path */}
              {categoryPath.length > 0 && (
                <div className="flex items-center space-x-2 text-sm bg-gray-50 p-3 rounded-lg">
                  <FiHome className="w-4 h-4 text-gray-400" />
                  {categoryPath.map((cat, index) => (
                    <React.Fragment key={cat._id}>
                      {index > 0 && <FiChevronRight className="w-4 h-4 text-gray-400" />}
                      <span className="text-gray-700">{cat.name}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Main Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Category
                </label>
                <select
                  value={selectedMainCategory || ''}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                >
                  <option value="">Select main category</option>
                  {mainCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub Category */}
              {selectedMainCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    value={selectedSubCategory || ''}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  >
                    <option value="">Select sub category</option>
                    {subCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub Sub Category */}
              {selectedSubCategory && subSubCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Sub Category
                  </label>
                  <select
                    value={selectedSubSubCategory || ''}
                    onChange={(e) => handleSubSubCategoryChange(e.target.value)}
                    className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                  >
                    <option value="">Select sub sub category</option>
                    {subSubCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Selected Categories */}
          {formData.categories?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Selected Categories:</p>
              <div className="flex flex-wrap gap-2">
                {formData.categories.map(catId => {
                  const category = categoryMap[catId];
                  return category ? (
                    <div
                      key={catId}
                      className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm border border-indigo-200"
                    >
                      <FiFolder className="w-3 h-3 mr-1" />
                      <span>{category.name}</span>
                      <button
                        onClick={() => removeCategory(catId)}
                        className="ml-2 text-indigo-400 hover:text-indigo-600"
                        type="button"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Category */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiStar className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Primary Category</h4>
          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
            Recommended
          </span>
        </div>

        <div>
          <select
            value={formData.primaryCategory || ''}
            onChange={(e) => onInputChange('primaryCategory', e.target.value)}
            className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select primary category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {'—'.repeat(cat.level || 0)} {cat.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Main category for navigation and breadcrumbs
          </p>
        </div>
      </div>

      {/* Collections & Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiGrid className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Collections</h4>
          </div>

          <Select
            isMulti
            options={collections}
            isLoading={loading}
            value={collections.filter(c => formData.collections?.includes(c.value))}
            onChange={(selected) => onInputChange('collections', selected.map(s => s.value))}
            className="react-select"
            classNamePrefix="select"
            placeholder="Add to collections..."
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: '0.75rem',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': { borderColor: '#6366f1' }
              })
            }}
          />
          <p className="mt-2 text-xs text-gray-500">
            Add product to marketing collections
          </p>
        </div>

        {/* Brand - CREATABLE */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <FiBookmark className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Brand</h4>
          </div>

          <CreatableSelect
            options={brandOptions}
            isLoading={loading}
            value={currentBrand}
            onChange={(selected) => onInputChange('brand', selected?.value || '')}
            className="react-select"
            classNamePrefix="select"
            placeholder="Select or type brand..."
            isClearable
            formatCreateLabel={(inputValue) => `Create brand "${inputValue}"`}
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: '0.75rem',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': { borderColor: '#6366f1' }
              })
            }}
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Type to create a new brand or select existing
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center mb-4">
          <FiTag className="w-5 h-5 text-indigo-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Tags</h4>
        </div>

        <CreatableSelect
          isMulti
          value={(formData.tags || []).map(tag => ({ value: tag, label: tag }))}
          onChange={handleTagChange}
          className="react-select"
          classNamePrefix="select"
          placeholder="Add tags..."
          formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
          styles={{
            control: (base) => ({
              ...base,
              borderRadius: '0.75rem',
              padding: '2px',
              borderColor: '#e5e7eb',
              '&:hover': { borderColor: '#6366f1' }
            })
          }}
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FiInfo className="w-3 h-3 mr-1" />
          Enter tags to help customers find your product
        </p>
      </div>

      {/* Attributes - CREATABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiFilter className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Product Attributes</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                Optional
              </span>
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Attribute
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {(formData.attributes || []).map((attr, index) => (
              <div key={attr.id || index} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h5 className="text-sm font-medium text-gray-900">
                    Attribute {index + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Attribute Name - CREATABLE */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Name
                    </label>
                    <CreatableSelect
                      options={attributeOptions.map(opt => ({ 
                        value: opt.name, 
                        label: opt.name 
                      }))}
                      value={attr.name ? { value: attr.name, label: attr.name } : null}
                      onChange={(selected) => updateAttribute(index, 'name', selected?.value || '')}
                      placeholder="e.g., Material"
                      className="react-select"
                      classNamePrefix="select"
                      isClearable
                      formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '0.5rem',
                          minHeight: '38px',
                          borderColor: '#e5e7eb'
                        })
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={attr.value || ''}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Cotton"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Type
                    </label>
                    <select
                      value={attr.type || 'text'}
                      onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes/No</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Group
                    </label>
                    <input
                      type="text"
                      value={attr.group || ''}
                      onChange={(e) => updateAttribute(index, 'group', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Dimensions"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={attr.isFilterable || false}
                      onChange={(e) => updateAttribute(index, 'isFilterable', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Use in filters</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={attr.isSearchable !== false}
                      onChange={(e) => updateAttribute(index, 'isSearchable', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Searchable</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={attr.isComparable || false}
                      onChange={(e) => updateAttribute(index, 'isComparable', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Comparable</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {(formData.attributes || []).length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiFilter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No attributes added yet</p>
              <p className="text-xs text-gray-400">Add attributes to provide more product details and filtering options</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiCheck className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Categorization Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.categories?.length || 0}</div>
            <div className="text-xs text-gray-500">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.collections?.length || 0}</div>
            <div className="text-xs text-gray-500">Collections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.tags?.length || 0}</div>
            <div className="text-xs text-gray-500">Tags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.attributes?.length || 0}</div>
            <div className="text-xs text-gray-500">Attributes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorizationTab;