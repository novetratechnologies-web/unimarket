// admin/src/pages/categories/CreateCategoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import { 
  FiFolder, 
  FiTrash2,
  FiSettings,
  FiImage,
  FiTag,
  FiRefreshCw,
  FiEye,
  FiArrowLeft,
  FiSave,
  FiX,
  FiGrid,
  FiInfo,
  FiHome,
  FiChevronRight
} from 'react-icons/fi';

// Import components
import CategoryForm from './components/CategoryForm';
import CategorySettings from './components/CategorySettings';
import CategorySEO from './components/CategorySEO';
import CategoryAttributes from './components/CategoryAttributes';
import CategoryMedia from './components/CategoryMedia';
import CategoryPreview from './components/CategoryPreview';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ErrorAlert from './components/ErrorAlert';
import SuccessToast from './components/SuccessToast';
import LoadingSpinner from '../../components/LoadingSkeleton';
import CategoryContent from './components/CategoryContent';
import { useToast, ToastContainer } from '../../components/Toast';

const CreateCategoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get category ID from URL for editing
  const { toasts, showToast, removeToast, success, error, warning, info } = useToast();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFiles, setImageFiles] = useState({
    image: null,
    banner: null,
    icon: null
  });
  const [imagePreviews, setImagePreviews] = useState({
    image: null,
    banner: null,
    icon: null
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // ============================================
  // CLEAN ATTRIBUTES FUNCTION
  // ============================================
  const cleanAttributes = useCallback((attributes) => {
    if (!Array.isArray(attributes)) return [];
    
    return attributes.map(attr => {
      const cleanAttr = {
        name: attr.name || '',
        slug: attr.slug || (attr.name ? attr.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : ''),
        type: attr.type || 'text',
        isRequired: Boolean(attr.isRequired),
        isFilterable: Boolean(attr.isFilterable),
        isSearchable: Boolean(attr.isSearchable),
        isComparable: Boolean(attr.isComparable),
        isVisible: Boolean(attr.isVisible),
        sortOrder: Number(attr.sortOrder) || 0
      };

      switch (attr.type) {
        case 'select':
        case 'multiselect':
          cleanAttr.options = Array.isArray(attr.options) ? attr.options.map(opt => ({
            value: opt.value || '',
            label: opt.label || opt.value || '',
            slug: opt.slug || (opt.value ? opt.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') : ''),
            sortOrder: Number(opt.sortOrder) || 0
          })) : [];
          cleanAttr.displayType = attr.displayType || (attr.type === 'multiselect' ? 'checkbox' : 'dropdown');
          break;
          
        case 'color':
          cleanAttr.options = Array.isArray(attr.options) ? attr.options.map(opt => ({
            value: opt.value || '',
            label: opt.label || opt.value || '',
            slug: opt.slug || (opt.value ? opt.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') : ''),
            color: opt.color || '#000000',
            sortOrder: Number(opt.sortOrder) || 0
          })) : [];
          cleanAttr.displayType = 'color_swatch';
          break;
          
        case 'size':
          cleanAttr.options = Array.isArray(attr.options) ? attr.options.map(opt => ({
            value: opt.value || '',
            label: opt.label || opt.value || '',
            slug: opt.slug || (opt.value ? opt.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') : ''),
            sortOrder: Number(opt.sortOrder) || 0
          })) : [];
          cleanAttr.displayType = 'size_swatch';
          break;
          
        case 'number':
        case 'range':
          cleanAttr.unit = attr.unit || '';
          cleanAttr.displayType = attr.type === 'range' ? 'range_slider' : 'number';
          cleanAttr.validation = {
            min: attr.validation?.min !== undefined && attr.validation?.min !== null ? Number(attr.validation.min) : null,
            max: attr.validation?.max !== undefined && attr.validation?.max !== null ? Number(attr.validation.max) : null
          };
          break;
          
        case 'text':
          cleanAttr.placeholder = attr.placeholder || '';
          cleanAttr.displayType = attr.displayType || 'text';
          cleanAttr.validation = {
            minLength: attr.validation?.minLength !== undefined && attr.validation?.minLength !== null ? Number(attr.validation.minLength) : null,
            maxLength: attr.validation?.maxLength !== undefined && attr.validation?.maxLength !== null ? Number(attr.validation.maxLength) : null,
            pattern: attr.validation?.pattern || ''
          };
          break;
          
        case 'boolean':
          cleanAttr.displayType = 'radio';
          break;
          
        case 'date':
          cleanAttr.displayType = 'date';
          break;
          
        default:
          cleanAttr.displayType = attr.displayType || 'text';
      }

      return cleanAttr;
    });
  }, []);

  // Form state matching backend schema
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: null,
    
    // Media
    image: null,
    banner: null,
    icon: 'fas fa-folder',
    iconImage: null,
    
    // SEO
    seo: {
      title: '',
      description: '',
      keywords: [],
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      schema: null
    },
    
    // Settings
    settings: {
      isActive: true,
      isVisible: true,
      isFeatured: false,
      showInMenu: true,
      showInHomepage: false,
      showInFooter: false,
      showInSidebar: true,
      showProductCount: true,
      sortOrder: 0,
      menuPosition: 0,
      columnCount: 4
    },
    
    attributes: [],
    priceRanges: [],
    badges: [],
    
    restrictions: {
      minPurchase: 0,
      maxPurchase: 0,
      allowedCustomerGroups: [],
      allowedVendors: [],
      allowedCountries: [],
      ageRestriction: { 
        minAge: 0, 
        message: '' 
      }
    },
    
    commission: {
      rate: null,
      type: 'percentage',
      override: false
    },
    
    tax: {
      class: null,
      rate: null,
      exempt: false
    },
    
    shipping: {
      class: null,
      requiresShipping: true,
      freeShipping: false,
      additionalCost: 0
    },
    
    tags: [],
    featuredProducts: [],
    relatedCategories: [],
    
    content: {
      header: '',
      footer: '',
      bannerText: '',
      bannerLink: '',
      customCss: '',
      customJs: ''
    }
  });

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: FiTag },
    { id: 'media', name: 'Media', icon: FiImage },
    { id: 'settings', name: 'Settings', icon: FiSettings },
    { id: 'attributes', name: 'Attributes', icon: FiGrid },
    { id: 'seo', name: 'SEO', icon: FiEye },
    { id: 'content', name: 'Content', icon: FiInfo },
    { id: 'preview', name: 'Preview', icon: FiEye }
  ];

  // Fetch categories for parent dropdown
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch category data if editing
  useEffect(() => {
    if (id) {
      fetchCategory(id);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getTree();
      const categoriesData = response?.data?.data || response?.data || response || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      error('Failed to load categories');
    }
  };

  const fetchCategory = async (categoryId) => {
    setLoading(true);
    try {
      const response = await api.categories.getById(categoryId);
      const categoryData = response?.data?.data || response?.data || response;
      
      setSelectedCategory(categoryData);
      
      const transformedData = {
        ...categoryData,
        parent: categoryData.parent?._id || categoryData.parent || null,
        settings: categoryData.settings || formData.settings,
        seo: categoryData.seo || formData.seo,
        attributes: categoryData.attributes || [],
        priceRanges: categoryData.priceRanges || [],
        badges: categoryData.badges || [],
        restrictions: categoryData.restrictions || formData.restrictions,
        commission: categoryData.commission || formData.commission,
        tax: categoryData.tax || formData.tax,
        shipping: categoryData.shipping || formData.shipping,
        content: categoryData.content || formData.content,
        featuredProducts: categoryData.featuredProducts || [],
        relatedCategories: categoryData.relatedCategories || [],
        tags: categoryData.tags || []
      };
      
      setFormData(transformedData);
      
      // Set image previews if they exist
      if (categoryData.image?.url) {
        setImagePreviews(prev => ({ ...prev, image: categoryData.image.url }));
      }
      if (categoryData.banner?.url) {
        setImagePreviews(prev => ({ ...prev, banner: categoryData.banner.url }));
      }
      if (categoryData.iconImage?.url) {
        setImagePreviews(prev => ({ ...prev, icon: categoryData.iconImage.url }));
      }
      
      success('Category loaded successfully');
    } catch (error) {
      console.error('Error fetching category:', error);
      error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    if (apiError) setApiError(null);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'name' && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        newData.slug = generateSlug(value);
      }
      
      return newData;
    });
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    if (apiError) setApiError(null);
  };

  const handleImageChange = (type, file) => {
    setImageFiles(prev => ({
      ...prev,
      [type]: file
    }));
    
    if (imagePreviews[type] && imagePreviews[type].startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviews[type]);
    }
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({
        ...prev,
        [type]: previewUrl
      }));
      
      setFormData(prev => {
        if (type === 'icon') {
          return {
            ...prev,
            iconPreview: previewUrl,
            icon: prev.icon
          };
        } else {
          return {
            ...prev,
            [type]: previewUrl
          };
        }
      });
    } else {
      setImagePreviews(prev => ({
        ...prev,
        [type]: null
      }));
      
      setFormData(prev => {
        if (type === 'icon') {
          return {
            ...prev,
            iconPreview: null,
            icon: 'fas fa-folder'
          };
        } else {
          return {
            ...prev,
            [type]: null
          };
        }
      });
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
    }
    
    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
  if (!validateForm()) {
    setActiveTab('basic');
    warning('Please fix the validation errors'); // This should work if warning is defined
    return;
  }

  setSaving(true);
  setErrors({});
  setApiError(null);
  
  try {
    const formDataToSend = new FormData();
    
    // ============================================
    // BASIC FIELDS
    // ============================================
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('slug', formData.slug.trim());
    formDataToSend.append('description', formData.description?.trim() || '');
    
    if (formData.parent && formData.parent !== 'null' && formData.parent !== '') {
      formDataToSend.append('parent', String(formData.parent));
    }
    
    formDataToSend.append('icon', formData.icon && typeof formData.icon === 'string' 
      ? formData.icon 
      : 'fas fa-folder'
    );

    // ============================================
    // SETTINGS
    // ============================================
    formDataToSend.append('settings[isActive]', String(formData.settings?.isActive ?? true));
    formDataToSend.append('settings[isVisible]', String(formData.settings?.isVisible ?? true));
    formDataToSend.append('settings[isFeatured]', String(formData.settings?.isFeatured ?? false));
    formDataToSend.append('settings[showInMenu]', String(formData.settings?.showInMenu ?? true));
    formDataToSend.append('settings[showInHomepage]', String(formData.settings?.showInHomepage ?? false));
    formDataToSend.append('settings[showInFooter]', String(formData.settings?.showInFooter ?? false));
    formDataToSend.append('settings[showInSidebar]', String(formData.settings?.showInSidebar ?? true));
    formDataToSend.append('settings[showProductCount]', String(formData.settings?.showProductCount ?? true));
    formDataToSend.append('settings[sortOrder]', String(formData.settings?.sortOrder || 0));
    formDataToSend.append('settings[menuPosition]', String(formData.settings?.menuPosition || 0));
    formDataToSend.append('settings[columnCount]', String(formData.settings?.columnCount || 4));

    // ============================================
    // SEO
    // ============================================
    formDataToSend.append('seo[title]', formData.seo?.title?.trim() || '');
    formDataToSend.append('seo[description]', formData.seo?.description?.trim() || '');
    formDataToSend.append('seo[ogTitle]', formData.seo?.ogTitle?.trim() || '');
    formDataToSend.append('seo[ogDescription]', formData.seo?.ogDescription?.trim() || '');
    formDataToSend.append('seo[ogImage]', formData.seo?.ogImage?.trim() || '');
    formDataToSend.append('seo[twitterCard]', formData.seo?.twitterCard || 'summary_large_image');
    formDataToSend.append('seo[robots]', formData.seo?.robots || 'index, follow');
    
    if (Array.isArray(formData.seo?.keywords)) {
      formData.seo.keywords.forEach((keyword, index) => {
        if (keyword?.trim()) {
          formDataToSend.append(`seo[keywords][${index}]`, keyword.trim());
        }
      });
    }

    // ============================================
    // TAGS
    // ============================================
    if (Array.isArray(formData.tags)) {
      formData.tags.forEach((tag, index) => {
        if (tag?.trim()) {
          formDataToSend.append(`tags[${index}]`, tag.trim());
        }
      });
    }

    // ============================================
    // COMPLEX FIELDS
    // ============================================
    const cleanedAttributes = cleanAttributes(formData.attributes);
    if (cleanedAttributes.length > 0) {
      formDataToSend.append('attributes', JSON.stringify(cleanedAttributes));
    }

    if (Array.isArray(formData.priceRanges) && formData.priceRanges.length > 0) {
      formDataToSend.append('priceRanges', JSON.stringify(formData.priceRanges));
    }

    if (Array.isArray(formData.badges) && formData.badges.length > 0) {
      formDataToSend.append('badges', JSON.stringify(formData.badges));
    }

    // ============================================
    // RESTRICTIONS
    // ============================================
    formDataToSend.append('restrictions[minPurchase]', String(formData.restrictions?.minPurchase || 0));
    formDataToSend.append('restrictions[maxPurchase]', String(formData.restrictions?.maxPurchase || 0));
    
    if (Array.isArray(formData.restrictions?.allowedCustomerGroups)) {
      formData.restrictions.allowedCustomerGroups.forEach((group, index) => {
        if (group) {
          formDataToSend.append(`restrictions[allowedCustomerGroups][${index}]`, group);
        }
      });
    }
    
    if (Array.isArray(formData.restrictions?.allowedVendors)) {
      formData.restrictions.allowedVendors.forEach((vendor, index) => {
        if (vendor) {
          formDataToSend.append(`restrictions[allowedVendors][${index}]`, vendor);
        }
      });
    }
    
    if (Array.isArray(formData.restrictions?.allowedCountries)) {
      formData.restrictions.allowedCountries.forEach((country, index) => {
        if (country) {
          formDataToSend.append(`restrictions[allowedCountries][${index}]`, country);
        }
      });
    }
    
    formDataToSend.append('restrictions[ageRestriction][minAge]', String(formData.restrictions?.ageRestriction?.minAge || 0));
    formDataToSend.append('restrictions[ageRestriction][message]', formData.restrictions?.ageRestriction?.message?.trim() || '');

    // ============================================
    // COMMISSION
    // ============================================
    if (formData.commission?.rate) {
      formDataToSend.append('commission[rate]', String(formData.commission.rate));
    }
    formDataToSend.append('commission[type]', formData.commission?.type || 'percentage');
    formDataToSend.append('commission[override]', String(formData.commission?.override || false));

    // ============================================
    // TAX
    // ============================================
    if (formData.tax?.class) {
      formDataToSend.append('tax[class]', formData.tax.class);
    }
    if (formData.tax?.rate) {
      formDataToSend.append('tax[rate]', String(formData.tax.rate));
    }
    formDataToSend.append('tax[exempt]', String(formData.tax?.exempt || false));

    // ============================================
    // SHIPPING
    // ============================================
    if (formData.shipping?.class) {
      formDataToSend.append('shipping[class]', formData.shipping.class);
    }
    formDataToSend.append('shipping[requiresShipping]', String(formData.shipping?.requiresShipping ?? true));
    formDataToSend.append('shipping[freeShipping]', String(formData.shipping?.freeShipping || false));
    formDataToSend.append('shipping[additionalCost]', String(formData.shipping?.additionalCost || 0));

    // ============================================
    // CONTENT
    // ============================================
    formDataToSend.append('content[header]', formData.content?.header?.trim() || '');
    formDataToSend.append('content[footer]', formData.content?.footer?.trim() || '');
    formDataToSend.append('content[bannerText]', formData.content?.bannerText?.trim() || '');
    formDataToSend.append('content[bannerLink]', formData.content?.bannerLink?.trim() || '');
    formDataToSend.append('content[customCss]', formData.content?.customCss?.trim() || '');
    formDataToSend.append('content[customJs]', formData.content?.customJs?.trim() || '');

    // ============================================
    // FEATURED PRODUCTS & RELATED CATEGORIES
    // ============================================
    if (Array.isArray(formData.featuredProducts) && formData.featuredProducts.length > 0) {
      formDataToSend.append('featuredProducts', JSON.stringify(formData.featuredProducts));
    }

    if (Array.isArray(formData.relatedCategories) && formData.relatedCategories.length > 0) {
      formDataToSend.append('relatedCategories', JSON.stringify(formData.relatedCategories));
    }

    // ============================================
    // IMAGE FILES
    // ============================================
    if (imageFiles.image) {
      formDataToSend.append('image', imageFiles.image);
    }
    
    if (imageFiles.banner) {
      formDataToSend.append('banner', imageFiles.banner);
    }
    
    if (imageFiles.icon) {
      formDataToSend.append('iconImage', imageFiles.icon);
    }

    let response;
    if (selectedCategory?._id) {
      response = await api.categories.update(selectedCategory._id, formDataToSend);
      success('Category updated successfully!');
    } else {
      response = await api.categories.create(formDataToSend);
      success('Category created successfully!');
    }

    if (response?.data?.success || response?.success) {
      setTimeout(() => {
        navigate('/products/categories');
      }, 1500);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    
    // FIXED: Proper error handling without using undefined error2
    if (error.data) {
      if (error.data.errors) {
        const fieldErrors = {};
        error.data.errors.forEach(err => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });
        setErrors(fieldErrors);
        
        // Use the toast function from props
        if (showToast) {
          showToast('Please check the form for errors', { type: 'warning' });
        }
      }
      
      if (error.data.message) {
        setApiError(error.data.message);
        // Use the toast function from props
        if (showToast) {
          showToast(error.data.message, { type: 'error' });
        }
      }
    } else {
      // Generic error message
      if (showToast) {
        showToast('An unexpected error occurred', { type: 'error' });
      }
    }
  } finally {
    setSaving(false);
  }
};

  const resetForm = () => {
    Object.values(imagePreviews).forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent: null,
      image: null,
      banner: null,
      icon: 'fas fa-folder',
      iconImage: null,
      seo: {
        title: '',
        description: '',
        keywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
        robots: 'index, follow',
        schema: null
      },
      settings: {
        isActive: true,
        isVisible: true,
        isFeatured: false,
        showInMenu: true,
        showInHomepage: false,
        showInFooter: false,
        showInSidebar: true,
        showProductCount: true,
        sortOrder: 0,
        menuPosition: 0,
        columnCount: 4
      },
      attributes: [],
      priceRanges: [],
      badges: [],
      restrictions: {
        minPurchase: 0,
        maxPurchase: 0,
        allowedCustomerGroups: [],
        allowedVendors: [],
        allowedCountries: [],
        ageRestriction: { minAge: 0, message: '' }
      },
      commission: {
        rate: null,
        type: 'percentage',
        override: false
      },
      tax: {
        class: null,
        rate: null,
        exempt: false
      },
      shipping: {
        class: null,
        requiresShipping: true,
        freeShipping: false,
        additionalCost: 0
      },
      content: {
        header: '',
        footer: '',
        bannerText: '',
        bannerLink: '',
        customCss: '',
        customJs: ''
      },
      tags: [],
      featuredProducts: [],
      relatedCategories: []
    });
    setSelectedCategory(null);
    setErrors({});
    setApiError(null);
    setImageFiles({ image: null, banner: null, icon: null });
    setImagePreviews({ image: null, banner: null, icon: null });
  };

  const handleDelete = async () => {
    try {
      setApiError(null);
      await api.categories.delete(selectedCategory._id);
      success('Category deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate('/products/categories');
      }, 1500);
    } catch (error) {
      console.error('Error deleting category:', error);
      
      let errorMessage = 'Failed to delete category.';
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 
                      'Cannot delete category with subcategories or products.';
      }
      
      setApiError(errorMessage);
      error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/products/categories')}
                className="p-2 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {selectedCategory ? 'Edit Category' : 'Create New Category'}
                </h1>
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 mt-0.5">
                  <FiHome className="w-3 h-3 mr-1" />
                  <span>Products</span>
                  <FiChevronRight className="w-3 h-3 mx-1" />
                  <button 
                    onClick={() => navigate('/products/categories')}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Categories
                  </button>
                  <FiChevronRight className="w-3 h-3 mx-1" />
                  <span className="text-indigo-600 font-medium">
                    {selectedCategory ? 'Edit' : 'Create'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiX className="w-4 h-4 inline mr-2" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors min-w-[100px] justify-center"
              >
                {saving ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    {selectedCategory ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {apiError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ErrorAlert 
            message={apiError} 
            onDismiss={() => setApiError(null)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px px-6 min-w-max" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-4 px-4 border-b-2 font-medium text-sm flex items-center whitespace-nowrap
                        transition-colors
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'basic' && (
                <CategoryForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onNestedInputChange={handleNestedInputChange}
                  categories={categories}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'media' && (
                <CategoryMedia
                  formData={formData}
                  onInputChange={handleInputChange}
                  onImageChange={handleImageChange}
                  imageFiles={imageFiles}
                  imagePreviews={imagePreviews}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'settings' && (
                <CategorySettings
                  formData={formData}
                  onNestedInputChange={handleNestedInputChange}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'attributes' && (
                <CategoryAttributes
                  formData={formData}
                  onInputChange={handleInputChange}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'seo' && (
                <CategorySEO
                  formData={formData}
                  onNestedInputChange={handleNestedInputChange}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'content' && (
                <CategoryContent
                  formData={formData}
                  onNestedInputChange={handleNestedInputChange}
                  errors={errors}
                  showToast={showToast}
                />
              )}

              {activeTab === 'preview' && (
                <CategoryPreview
                  formData={formData}
                  categories={categories}
                  imagePreviews={imagePreviews}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  {selectedCategory && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4 inline mr-2" />
                      Delete Category
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/products/categories')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors min-w-[140px] justify-center"
                  >
                    {saving ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4 mr-2" />
                        {selectedCategory ? 'Update Category' : 'Create Category'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        categoryName={selectedCategory?.name}
        categoryData={{
          productCount: selectedCategory?.stats?.productCount || 0,
          subcategoryCount: selectedCategory?.stats?.subcategoryCount || 0
        }}
        showToast={showToast}
      />
    </div>
  );
};

export default CreateCategoryPage;