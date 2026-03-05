// components/admin/products/CreateProductPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiFileText, 
  FiImage, 
  FiDollarSign, 
  FiPackage, 
  FiCopy, 
  FiGrid, 
  FiTruck, 
  FiSearch, 
  FiSettings,
  FiChevronRight,
  FiChevronLeft,
  FiEye,
  FiSave,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiUpload,
  FiVideo,
  FiFile,
  FiTrash2,
  FiStar,
  FiRefreshCw,
  FiUserCheck,
  FiShield
} from 'react-icons/fi';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

import BasicInformationTab from './tabs/BasicInformationTab';
import DescriptionTab from './tabs/DescriptionTab';
import PricingTab from './tabs/PricingTab';
import InventoryTab from './tabs/InventoryTab';
import VariantsTab from './tabs/VariantsTab';
import MediaTab from './tabs/MediaTab';
import CategorizationTab from './tabs/CategorizationTab';
import ShippingTab from './tabs/ShippingTab';
import SEOTab from './tabs/SEOTab';
import AdvancedTab from './tabs/AdvancedTab';
import ProductPreview from './components/ProductPreview';
import FormNavigation from './components/FormNavigation';
import SaveButtons from './components/SaveButtons';
import ValidationErrors from './components/ValidationErrors';
import { useGlobalToast } from '../../context/GlobalToastContext';

// Utility function to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Generate slug from text
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Allowed currencies from schema
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'KES'];

// Helper function to format field names for display
const formatFieldName = (field) => {
  return field
    .replace(/\./g, ' › ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^(\d+)/, 'Item $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
};

const CreateProductPage = () => {
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  
  // Get user from auth context
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [vendorInfo, setVendorInfo] = useState(null);
  
  // Form state aligned with backend schema
  const [formData, setFormData] = useState({
    // ============================================
    // BASIC INFORMATION
    // ============================================
    name: '',
    slug: '',
    sku: '',
    barcode: '',
    gtin: '',
    mpn: '',
    isbn: '',
    upc: '',
    ean: '',
    
    // ============================================
    // OWNERSHIP & PERMISSIONS - Auto-populated from auth
    // ============================================
    vendor: '', // Will be set from auth context
    
    // ============================================
    // DESCRIPTION & CONTENT
    // ============================================
    description: '',
    shortDescription: '',
    highlights: [],
    specifications: [],
    
    // ============================================
    // PRICING & CURRENCY
    // ============================================
    currency: 'USD',
    price: 0,
    compareAtPrice: null,
    cost: null,
    wholesalePrice: null,
    minimumWholesaleQuantity: 1,
    bulkPricing: [],
    volumeDiscounts: [],
    
    // ============================================
    // INVENTORY & STOCK MANAGEMENT
    // ============================================
    quantity: 0,
    lowStockThreshold: 5,
    trackQuantity: true,
    allowBackorder: false,
    backorderLimit: 0,
    backorderLeadTime: null,
    inventoryTrackingMethod: 'continuous',
    reorderPoint: null,
    reorderQuantity: null,
    safetyStock: 0,
    maximumStock: null,
    inventoryAlerts: {
      enabled: true,
      thresholds: [5, 10],
      emailNotifications: true
    },
    stockStatusDisplay: 'in_stock',
    preOrderAvailability: null,
    
    // ============================================
    // WAREHOUSE & LOCATION
    // ============================================
    warehouses: [],
    defaultWarehouse: null,
    
    // ============================================
    // VARIANTS
    // ============================================
    hasVariants: false,
    variantAttributes: [],
    variants: [],
    
    // ============================================
    // MEDIA & ASSETS
    // ============================================
    images: [],
    videos: [],
    documents: [],
    threeDModel: null,
    augmentedReality: null,
    
    // ============================================
    // CATEGORIZATION & TAXONOMY
    // ============================================
    categories: [],
    primaryCategory: null,
    collections: [],
    tags: [],
    attributes: [],
    type: 'simple',
    productType: null,
    
    // ============================================
    // SHIPPING & DELIVERY
    // ============================================
    weight: null,
    weightUnit: 'g',
    dimensions: {
      length: null,
      width: null,
      height: null,
      unit: 'cm'
    },
    requiresShipping: true,
    freeShipping: false,
    shippingClass: null,
    hazardous: false,
    perishable: false,
    
    // ============================================
    // TAX & DUTIES
    // ============================================
    isTaxable: true,
    taxClass: null,
    taxCode: null,
    taxIncluded: false,
    customsInformation: null,
    
    // ============================================
    // SEO & METADATA
    // ============================================
    seo: {
      title: '',
      description: '',
      keywords: [],
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image'
    },
    
    // ============================================
    // STATUS & VISIBILITY
    // ============================================
    status: 'draft',
    visibility: 'public',
    featured: false,
    scheduledAt: null,
    unpublishAt: null,
    
    // ============================================
    // BRAND & MANUFACTURER
    // ============================================
    brand: null,
    brandName: null,
    manufacturer: {},
    countryOfOrigin: '',
    
    // ============================================
    // BUNDLES & KITS
    // ============================================
    isBundle: false,
    bundleType: 'fixed',
    bundleItems: [],
    
    // ============================================
    // DIGITAL PRODUCT
    // ============================================
    isDigital: false,
    digitalFile: null,
    
    // ============================================
    // WARRANTY
    // ============================================
    warranty: null,
    
    // ============================================
    // RETURNS
    // ============================================
    returnPolicy: {
      isReturnable: true,
      returnPeriod: 30,
      restockingFee: 0
    },
    
    // ============================================
    // METADATA & AUDIT
    // ============================================
    notes: '',
    adminNotes: [],
    
    // ============================================
    // TIMESTAMPS
    // ============================================
    lastUpdatedAt: new Date().toISOString()
  });

  

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: FiFileText, description: 'Product details & identifiers', required: ['name', 'price'] },
    { id: 'description', name: 'Description', icon: FiFileText, description: 'Product description & specs', required: ['description'] },
    { id: 'media', name: 'Media', icon: FiImage, description: 'Images & videos', required: [] },
    { id: 'pricing', name: 'Pricing', icon: FiDollarSign, description: 'Price & discount settings', required: ['price'] },
    { id: 'inventory', name: 'Inventory', icon: FiPackage, description: 'Stock & warehouse', required: [] },
    { id: 'variants', name: 'Variants', icon: FiCopy, description: 'Product variations', required: [] },
    { id: 'categories', name: 'Categories', icon: FiGrid, description: 'Organization & tags', required: [] },
    { id: 'shipping', name: 'Shipping', icon: FiTruck, description: 'Delivery & dimensions', required: [] },
    { id: 'seo', name: 'SEO', icon: FiSearch, description: 'Search optimization', required: [] },
    { id: 'advanced', name: 'Advanced', icon: FiSettings, description: 'Additional settings', required: [] }
  ];

// ============================================
// AUTO-ASSIGN VENDOR FROM AUTH CONTEXT - FIXED
// ============================================
useEffect(() => {
  // Guard clauses to prevent unnecessary runs
  if (!currentUser) {
    return;
  }

  // If vendor is already set and valid, don't run again
  if (formData.vendor && /^[0-9a-fA-F]{24}$/.test(formData.vendor)) {
    return;
  }

  console.log('👤 Current user from auth context:', currentUser);
  
  // Check all possible vendor ID sources
  const possibleVendorIds = [
    { field: '_id', value: currentUser._id },
    { field: 'id', value: currentUser.id },
    { field: 'vendorId', value: currentUser.vendorId },
    { field: 'vendorProfile._id', value: currentUser.vendorProfile?._id },
    { field: 'vendorProfile.id', value: currentUser.vendorProfile?.id },
    { field: 'vendorProfile.vendorId', value: currentUser.vendorProfile?.vendorId }
  ].filter(item => item.value);

  // Try to find a valid MongoDB ObjectId (24 hex chars)
  let vendorId = null;
  let vendorSource = null;
  
  for (const { field, value } of possibleVendorIds) {
    if (value && /^[0-9a-fA-F]{24}$/.test(value)) {
      vendorId = value;
      vendorSource = field;
      break;
    }
  }

  if (vendorId) {
    const vendorDisplayName = currentUser.storeName || 
                              currentUser.vendorProfile?.storeName || 
                              currentUser.email || 
                              'Vendor';
    
    console.log(`✅ Valid vendor ID found in ${vendorSource}:`, vendorId);
    
    setFormData(prev => ({
      ...prev,
      vendor: vendorId
    }));
    
    setVendorInfo({
      id: vendorId,
      name: vendorDisplayName,
      role: currentUser.role,
      storeName: currentUser.storeName || currentUser.vendorProfile?.storeName,
      email: currentUser.email,
      vendorSource
    });
  } else {
    setErrors(prev => ({
      ...prev,
      vendor: 'Could not determine valid vendor ID from user profile. Please contact support.'
    }));
    
    // Show a toast for immediate feedback
    showToast('Vendor ID format invalid. Check console for details.', { type: 'error' });
  }
}, [
  // Use primitive values instead of objects to prevent infinite loops
  currentUser?._id,
  currentUser?.id,
  currentUser?.vendorId,
  currentUser?.role,
  currentUser?.email,
  currentUser?.storeName,
  currentUser?.vendorProfile?._id,
  currentUser?.vendorProfile?.storeName,
  formData.vendor, // Include this to check if vendor is already set
  showToast
]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate slug from name
      if (field === 'name' && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        newData.slug = generateSlug(value);
      }
      
      // Handle product type changes
      if (field === 'type') {
        newData.hasVariants = value === 'variable';
        newData.isBundle = value === 'bundle';
        newData.isDigital = value === 'digital';
        
        // Clear irrelevant fields
        if (value !== 'variable') {
          newData.variantAttributes = [];
          newData.variants = [];
        }
        if (value !== 'bundle') {
          newData.bundleItems = [];
        }
        if (value !== 'digital') {
          newData.digitalFile = null;
        }
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateTab = useCallback((tabId) => {
    const tabErrors = {};

    switch (tabId) {
      case 'basic':
        if (!formData.name?.trim()) {
          tabErrors.name = 'Product name is required';
        } else if (formData.name.length < 3) {
          tabErrors.name = 'Product name must be at least 3 characters';
        } else if (formData.name.length > 200) {
          tabErrors.name = 'Product name cannot exceed 200 characters';
        }
        if (!formData.type) {
          tabErrors.type = 'Product type is required';
        }
        break;
      case 'description':
        if (!formData.description?.trim()) {
          tabErrors.description = 'Description is required';
        } else if (formData.description.length > 5000) {
          tabErrors.description = 'Description cannot exceed 5000 characters';
        }
        break;
      case 'pricing':
        if (!formData.price || formData.price <= 0) {
          tabErrors.price = 'Price must be greater than 0';
        }
        if (formData.compareAtPrice && formData.compareAtPrice <= formData.price) {
          tabErrors.compareAtPrice = 'Compare at price must be greater than regular price';
        }
        if (formData.currency && !ALLOWED_CURRENCIES.includes(formData.currency)) {
          tabErrors.currency = `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`;
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, ...tabErrors }));
    return Object.keys(tabErrors).length === 0;
  }, [formData]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Product name cannot exceed 200 characters';
    }

    // Vendor validation using auth context data
    if (!formData.vendor) {
      newErrors.vendor = 'Vendor information not loaded. Please refresh the page.';
    } else if (!isValidObjectId(formData.vendor)) {
      newErrors.vendor = 'Invalid vendor ID format';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.compareAtPrice && formData.compareAtPrice <= formData.price) {
      newErrors.compareAtPrice = 'Compare at price must be greater than regular price';
    }

    if (!formData.type) {
      newErrors.type = 'Product type is required';
    }

    // Currency validation
    if (formData.currency && !ALLOWED_CURRENCIES.includes(formData.currency)) {
      newErrors.currency = `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`;
    }

    // Variable product validation
    if (formData.type === 'variable') {
      if (!formData.variantAttributes || formData.variantAttributes.length === 0) {
        newErrors.variantAttributes = 'Variable products need at least one attribute';
      }
      if (!formData.variants || formData.variants.length === 0) {
        newErrors.variants = 'Variable products need at least one variant';
      }
    }

    // Bundle product validation
    if (formData.type === 'bundle') {
      if (!formData.bundleItems || formData.bundleItems.length === 0) {
        newErrors.bundleItems = 'Bundle products need at least one item';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveAndNext = useCallback(() => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (validateTab(activeTab)) {
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSave('draft');
      }
    }
  }, [activeTab, tabs, validateTab]);

const prepareProductData = () => {

  const removeTempFields = (obj, fieldsToRemove = ['id', '_file', 'tempId']) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => removeTempFields(item, fieldsToRemove));
    }
    
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (!fieldsToRemove.includes(key)) {
        if (obj[key] && typeof obj[key] === 'object') {
          cleaned[key] = removeTempFields(obj[key], fieldsToRemove);
        } else {
          cleaned[key] = obj[key];
        }
      }
    });
    return cleaned;
  };

  // Clean images - keep only fields that exist in schema
  const cleanImages = (formData.images || []).map(img => {
    if (img._file) {
      // This will be handled by FormData, don't include in JSON
      return null;
    }
    const cleaned = { ...img };
    delete cleaned._file;
    delete cleaned.id;
    delete cleaned.tempId;
    return cleaned;
  }).filter(Boolean);

  // ✅ FIXED: Clean variants - remove null values
  const cleanVariants = (formData.variants || []).map(variant => {
    const cleaned = { ...variant };
    delete cleaned._id;
    delete cleaned.id;
    delete cleaned.tempId;
    
    // Fix SKU to be alphanumeric only
    if (cleaned.sku) {
      cleaned.sku = cleaned.sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else if (formData.sku) {
      cleaned.sku = `${formData.sku}${Math.random().toString(36).substring(7).toUpperCase()}`;
    }
    
    // ✅ CRITICAL: Remove null values from optional fields
    if (cleaned.cost === null || cleaned.cost === undefined) {
      delete cleaned.cost;
    }
    
    if (cleaned.wholesalePrice === null || cleaned.wholesalePrice === undefined) {
      delete cleaned.wholesalePrice;
    }
    
    if (cleaned.image === null || cleaned.image === undefined) {
      delete cleaned.image;
    }
    
    if (cleaned.weight === null || cleaned.weight === undefined) {
      delete cleaned.weight;
    }
    
    if (cleaned.compareAtPrice === null || cleaned.compareAtPrice === undefined) {
      delete cleaned.compareAtPrice;
    }
    
    // Clean options
    if (cleaned.options) {
      cleaned.options = cleaned.options.map(opt => {
        const { id, ...cleanOpt } = opt;
        return cleanOpt;
      });
    }
    
    // Handle dimensions - remove null values
    if (cleaned.dimensions) {
      if (cleaned.dimensions.length === null || cleaned.dimensions.length === undefined) {
        delete cleaned.dimensions.length;
      }
      if (cleaned.dimensions.width === null || cleaned.dimensions.width === undefined) {
        delete cleaned.dimensions.width;
      }
      if (cleaned.dimensions.height === null || cleaned.dimensions.height === undefined) {
        delete cleaned.dimensions.height;
      }
      
      // If no dimensions left, remove the whole dimensions object
      if (Object.keys(cleaned.dimensions).filter(key => key !== 'unit').length === 0) {
        delete cleaned.dimensions;
      }
    }
    
    return cleaned;
  });

  // Clean other arrays
  const cleanVariantAttributes = (formData.variantAttributes || []).map(attr => {
    const { id, ...cleanAttr } = attr;
    return cleanAttr;
  });

  const cleanSpecifications = (formData.specifications || []).map(spec => {
    const { id, ...cleanSpec } = spec;
    return cleanSpec;
  });

  const cleanBundleItems = (formData.bundleItems || []).map(item => {
    const { id, ...cleanItem } = item;
    return cleanItem;
  });

  const cleanAttributes = (formData.attributes || []).map(attr => {
    const { id, ...cleanAttr } = attr;
    return cleanAttr;
  });

  // Build product data
  const productData = {
    name: formData.name,
    slug: formData.slug || generateSlug(formData.name),
    ...(formData.sku && { sku: formData.sku }),
    ...(formData.barcode && { barcode: formData.barcode }),
    ...(formData.gtin && { gtin: formData.gtin }),
    ...(formData.mpn && { mpn: formData.mpn }),
    ...(formData.isbn && { isbn: formData.isbn }),
    ...(formData.upc && { upc: formData.upc }),
    ...(formData.ean && { ean: formData.ean }),

    // ✅ CRITICAL: Add createdBy and updatedBy (required by schema)
    createdBy: formData.vendor,
    updatedBy: formData.vendor,

    // Vendor from auth context
    vendor: formData.vendor,

    description: formData.description,
    ...(formData.shortDescription && { shortDescription: formData.shortDescription }),
    ...(formData.highlights?.length && { highlights: formData.highlights.filter(Boolean) }),
    ...(cleanSpecifications.length && { specifications: cleanSpecifications }),

    currency: formData.currency || 'USD',
    price: Number(formData.price),
    ...(formData.compareAtPrice && { compareAtPrice: Number(formData.compareAtPrice) }),
    ...(formData.cost && { cost: Number(formData.cost) }),
    ...(formData.wholesalePrice && { wholesalePrice: Number(formData.wholesalePrice) }),
    minimumWholesaleQuantity: Number(formData.minimumWholesaleQuantity) || 1,
    ...(formData.bulkPricing?.length && { bulkPricing: formData.bulkPricing }),
    ...(formData.volumeDiscounts?.length && { volumeDiscounts: formData.volumeDiscounts }),

    quantity: Number(formData.quantity) || 0,
    lowStockThreshold: Number(formData.lowStockThreshold) || 5,
    trackQuantity: formData.trackQuantity !== false,
    allowBackorder: formData.allowBackorder || false,
    backorderLimit: Number(formData.backorderLimit) || 0,
    ...(formData.backorderLeadTime && { backorderLeadTime: Number(formData.backorderLeadTime) }),
    inventoryTrackingMethod: formData.inventoryTrackingMethod || 'continuous',
    ...(formData.reorderPoint && { reorderPoint: Number(formData.reorderPoint) }),
    ...(formData.reorderQuantity && { reorderQuantity: Number(formData.reorderQuantity) }),
    safetyStock: Number(formData.safetyStock) || 0,
    ...(formData.maximumStock && { maximumStock: Number(formData.maximumStock) }),
    inventoryAlerts: formData.inventoryAlerts || { 
      enabled: true, 
      thresholds: [5, 10], 
      emailNotifications: true 
    },
    stockStatusDisplay: formData.stockStatusDisplay || 'in_stock',
    ...(formData.preOrderAvailability && { preOrderAvailability: formData.preOrderAvailability }),

    ...(formData.warehouses?.length && { warehouses: formData.warehouses }),
    ...(formData.defaultWarehouse && { defaultWarehouse: formData.defaultWarehouse }),

    hasVariants: formData.type === 'variable',
    ...(cleanVariantAttributes.length && { variantAttributes: cleanVariantAttributes }),
    ...(cleanVariants.length && { variants: cleanVariants }),

    ...(cleanImages.length && { images: cleanImages }),
    ...(formData.videos?.length && { videos: formData.videos }),
    ...(formData.documents?.length && { documents: formData.documents }),
    ...(formData.threeDModel && { threeDModel: formData.threeDModel }),
    ...(formData.augmentedReality && { augmentedReality: formData.augmentedReality }),

    ...(formData.categories?.length && { categories: formData.categories }),
    ...(formData.primaryCategory && { primaryCategory: formData.primaryCategory }),
    ...(formData.collections?.length && { collections: formData.collections }),
    ...(formData.tags?.length && { tags: formData.tags }),
    ...(cleanAttributes.length && { attributes: cleanAttributes }),
    type: formData.type || 'simple',
    ...(formData.productType && { productType: formData.productType }),

    ...(formData.brand && isValidObjectId(formData.brand) 
      ? { brand: formData.brand }
      : formData.brand && { brandName: formData.brand }
    ),
    ...(Object.keys(formData.manufacturer).length > 0 && { manufacturer: formData.manufacturer }),
    ...(formData.countryOfOrigin && { countryOfOrigin: formData.countryOfOrigin }),

    ...(formData.weight && { weight: Number(formData.weight) }),
    weightUnit: formData.weightUnit || 'g',
    dimensions: (formData.dimensions?.length || formData.dimensions?.width || formData.dimensions?.height) 
      ? {
          ...(formData.dimensions.length && { length: Number(formData.dimensions.length) }),
          ...(formData.dimensions.width && { width: Number(formData.dimensions.width) }),
          ...(formData.dimensions.height && { height: Number(formData.dimensions.height) }),
          unit: formData.dimensions.unit || 'cm'
        }
      : undefined,

    requiresShipping: formData.requiresShipping !== false,
    freeShipping: formData.freeShipping || false,
    ...(formData.shippingClass && { shippingClass: formData.shippingClass }),
    hazardous: formData.hazardous || false,
    perishable: formData.perishable || false,

    isTaxable: formData.isTaxable !== false,
    ...(formData.taxClass && { taxClass: formData.taxClass }),
    ...(formData.taxCode && { taxCode: formData.taxCode }),
    taxIncluded: formData.taxIncluded || false,
    ...(formData.customsInformation && { customsInformation: formData.customsInformation }),

    // SEO - Only include fields that have values
    seo: {
      ...(formData.seo?.title && { title: formData.seo.title }),
      ...(formData.seo?.description && { description: formData.seo.description }),
      ...(formData.seo?.keywords?.length && { keywords: formData.seo.keywords }),
      ...(formData.seo?.ogTitle && { ogTitle: formData.seo.ogTitle }),
      ...(formData.seo?.ogDescription && { ogDescription: formData.seo.ogDescription }),
      ...(formData.seo?.ogImage && { ogImage: formData.seo.ogImage }),
      ...(formData.seo?.twitterCard && { twitterCard: formData.seo.twitterCard }),
      ...(formData.seo?.twitterTitle && { twitterTitle: formData.seo.twitterTitle }),
      ...(formData.seo?.twitterDescription && { twitterDescription: formData.seo.twitterDescription }),
      ...(formData.seo?.twitterImage && { twitterImage: formData.seo.twitterImage }),
      ...(formData.seo?.canonical && { canonical: formData.seo.canonical }),
      ...(formData.seo?.robots && { robots: formData.seo.robots })
    },

    status: formData.status || 'draft',
    visibility: formData.visibility || 'public',
    featured: formData.featured || false,
    ...(formData.scheduledAt && { scheduledAt: formData.scheduledAt }),
    ...(formData.unpublishAt && { unpublishAt: formData.unpublishAt }),

    // Badges
    ...(formData.isNew && { isNew: true }),
    ...(formData.isTrending && { isTrending: true }),
    ...(formData.isBestSeller && { isBestSeller: true }),
    ...(formData.isExclusive && { isExclusive: true }),
    ...(formData.isGiftCard && { isGiftCard: true }),

    isBundle: formData.type === 'bundle',
    ...(formData.type === 'bundle' && formData.bundleType && { bundleType: formData.bundleType }),
    ...(cleanBundleItems.length && { bundleItems: cleanBundleItems }),

    isDigital: formData.type === 'digital',
    ...(formData.type === 'digital' && formData.digitalFile && { digitalFile: formData.digitalFile }),

    ...(formData.warranty?.hasWarranty && { warranty: formData.warranty }),

    returnPolicy: formData.returnPolicy || {
      isReturnable: true,
      returnPeriod: 30,
      restockingFee: 0
    },

    ...(formData.notes && { notes: formData.notes }),
    ...(formData.adminNotes?.length && { adminNotes: formData.adminNotes }),

    lastUpdatedAt: new Date().toISOString()
  };

  // Remove undefined, null, and empty arrays
  Object.keys(productData).forEach(key => {
    if (productData[key] === undefined || productData[key] === null) {
      delete productData[key];
    }
    if (Array.isArray(productData[key]) && productData[key].length === 0) {
      delete productData[key];
    }
    // Remove empty objects
    if (typeof productData[key] === 'object' && productData[key] !== null && Object.keys(productData[key]).length === 0) {
      delete productData[key];
    }
  });

  return productData;
};


const handleSave = async (status = 'draft') => {
  if (!validateForm()) {
    document.getElementById('error-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const errorFields = Object.keys(errors);
    if (errorFields.includes('vendor')) {
      setActiveTab('basic');
    } else if (errorFields.includes('name') || errorFields.includes('type')) {
      setActiveTab('basic');
    } else if (errorFields.includes('price') || errorFields.includes('compareAtPrice') || errorFields.includes('currency')) {
      setActiveTab('pricing');
    } else if (errorFields.includes('description')) {
      setActiveTab('description');
    } else if (errorFields.includes('variantAttributes') || errorFields.includes('variants')) {
      setActiveTab('variants');
    } else if (errorFields.includes('bundleItems')) {
      setActiveTab('advanced');
    }
    
    showToast('Please fix the validation errors before saving', { type: 'error' });
    return;
  }

  setSaving(true);
  try {
    const productData = prepareProductData();
    productData.status = status;
    
    console.log('📤 Sending product data:', JSON.stringify(productData, null, 2));

    const imageFiles = (formData.images || [])
      .filter(img => img._file instanceof File)
      .map(img => img._file);
    
    const hasFileUploads = imageFiles.length > 0;

    let response;
    
    if (hasFileUploads) {
      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(productData));
      
      imageFiles.forEach((file, index) => {
        formDataToSend.append('images', file);
      });
      
      (formData.videos || [])
        .filter(video => video._file instanceof File)
        .forEach((video) => {
          formDataToSend.append('videos', video._file);
        });
      
      (formData.documents || [])
        .filter(doc => doc._file instanceof File)
        .forEach((doc) => {
          formDataToSend.append('documents', doc._file);
        });
      
      response = await api.products.create(formDataToSend);
    } else {
      response = await api.products.create(productData);
    }

    

console.log('📥 Product created response:', response);
console.log('🔍 Response status:', response?.status);
console.log('🔍 Response data type:', typeof response?.data);
console.log('🔍 Response data:', JSON.stringify(response?.data, null, 2));
console.log('🔍 Response data.success:', response?.data?.success);
console.log('🔍 Response.success:', response?.success);
console.log('🔍 Response keys:', Object.keys(response || {}));
console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));

// Check what we're actually getting
if (response?.success === true) {
  console.log('✅ Success condition met!');
  
  const message = currentUser?.role === 'vendor' 
    ? 'Product created and sent for approval!' 
    : status === 'active' 
      ? 'Product published successfully!' 
      : 'Product saved as draft!';
  
  // Also show the actual success toast
  setTimeout(() => {
    showToast(message, { type: 'success' });
  }, 500);
  
  // Clear any existing errors
  setErrors({});
  
  // Wait a moment for the toast to be seen before redirecting
  setTimeout(() => {
    if (currentUser?.role === 'vendor') {
      navigate('/vendor/products');
    } else {
      navigate('/admin/products');
    }
  }, 3000);
  
  return; // Exit early on success
} else {
  console.log('❌ Response.success is not true. Value:', response?.success);
  console.log('❌ Response structure:', response);
  throw new Error(response?.message || 'Failed to create product');
}


  } catch (error) {
    console.error('❌ Error saving product:', error);
    
    // Handle validation errors from backend
    if (error.response?.data?.errors) {
      const backendErrors = error.response.data.errors;
      
      // Format errors for display
      const formattedErrors = {};
      const errorGroups = {};
      
      // Process each error and group by tab
      Object.entries(backendErrors).forEach(([field, message]) => {
        formattedErrors[field] = message;
        
        // Determine which tab this field belongs to
        if (field.startsWith('documents') || field.startsWith('videos') || field.startsWith('images') || field.includes('Model') || field.includes('AR')) {
          if (!errorGroups.media) errorGroups.media = [];
          errorGroups.media.push({ field, message });
        } else if (field.startsWith('seo')) {
          if (!errorGroups.seo) errorGroups.seo = [];
          errorGroups.seo.push({ field, message });
        } else if (field.startsWith('returnPolicy') || field.startsWith('warranty') || field.includes('bundle') || field.includes('digital')) {
          if (!errorGroups.advanced) errorGroups.advanced = [];
          errorGroups.advanced.push({ field, message });
        } else if (field.includes('shipping') || field.includes('weight') || field.includes('dimensions')) {
          if (!errorGroups.shipping) errorGroups.shipping = [];
          errorGroups.shipping.push({ field, message });
        } else if (field.includes('price') || field.includes('cost') || field.includes('discount')) {
          if (!errorGroups.pricing) errorGroups.pricing = [];
          errorGroups.pricing.push({ field, message });
        } else if (field.includes('quantity') || field.includes('stock') || field.includes('inventory')) {
          if (!errorGroups.inventory) errorGroups.inventory = [];
          errorGroups.inventory.push({ field, message });
        } else if (field.includes('category') || field.includes('tag') || field.includes('attribute')) {
          if (!errorGroups.categories) errorGroups.categories = [];
          errorGroups.categories.push({ field, message });
        } else if (field.includes('name') || field.includes('slug') || field.includes('sku') || field.includes('vendor')) {
          if (!errorGroups.basic) errorGroups.basic = [];
          errorGroups.basic.push({ field, message });
        } else if (field.includes('description') || field.includes('specification')) {
          if (!errorGroups.description) errorGroups.description = [];
          errorGroups.description.push({ field, message });
        } else if (field.includes('variant')) {
          if (!errorGroups.variants) errorGroups.variants = [];
          errorGroups.variants.push({ field, message });
        }
      });
      
      // Update form errors state
      setErrors(formattedErrors);
      
      // Create a beautiful toast with grouped errors
      const toastContent = (
        <div className="w-full max-w-md">
          <div className="flex items-start mb-3">
            <FiAlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Validation Failed</h4>
              <p className="text-sm text-gray-600">Please fix the following errors:</p>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {Object.entries(errorGroups).map(([tab, errors]) => (
              <div key={tab} className="border-l-3 border-red-200 pl-3">
                <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Tab
                </h5>
                <ul className="space-y-1.5">
                  {errors.slice(0, 3).map((err, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="flex-1">
                        <span className="font-medium text-gray-700">{formatFieldName(err.field)}:</span> {err.message}
                      </span>
                    </li>
                  ))}
                  {errors.length > 3 && (
                    <li className="text-xs text-gray-500 italic">
                      + {errors.length - 3} more errors in this section
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Check the highlighted fields for more details
            </p>
          </div>
        </div>
      );
      
      showToast(toastContent, { 
        type: 'error', 
        duration: 8000,
        position: 'top-center'
      });
      
      // Automatically switch to the tab with the first error
      const firstErrorField = Object.keys(backendErrors)[0];
      if (firstErrorField) {
        if (firstErrorField.startsWith('documents') || firstErrorField.startsWith('videos') || firstErrorField.startsWith('images')) {
          setActiveTab('media');
        } else if (firstErrorField.startsWith('seo')) {
          setActiveTab('seo');
        } else if (firstErrorField.startsWith('returnPolicy') || firstErrorField.includes('bundle')) {
          setActiveTab('advanced');
        } else if (firstErrorField.includes('shipping') || firstErrorField.includes('weight')) {
          setActiveTab('shipping');
        } else if (firstErrorField.includes('price') || firstErrorField.includes('cost')) {
          setActiveTab('pricing');
        } else if (firstErrorField.includes('quantity') || firstErrorField.includes('stock')) {
          setActiveTab('inventory');
        } else if (firstErrorField.includes('category')) {
          setActiveTab('categories');
        } else if (firstErrorField.includes('name') || firstErrorField.includes('slug') || firstErrorField.includes('vendor')) {
          setActiveTab('basic');
        } else if (firstErrorField.includes('description')) {
          setActiveTab('description');
        } else if (firstErrorField.includes('variant')) {
          setActiveTab('variants');
        }
      }
      
    } else if (error.response?.data?.message) {
      showToast(error.response.data.message, { type: 'error' });
    } else if (error.message) {
      showToast(error.message, { type: 'error' });
    } else {
      showToast('An unexpected error occurred', { type: 'error' });
    }
  } finally {
    setSaving(false);
  }
};



  const getTabCompletionStatus = useCallback(() => {
    const status = {};
    tabs.forEach(tab => {
      if (tab.required) {
        const completed = tab.required.every(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return formData[parent]?.[child];
          }
          return formData[field];
        });
        status[tab.id] = completed;
      }
    });
    return status;
  }, [formData, tabs]);

  const tabCompletion = getTabCompletionStatus();

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasChanges = Object.keys(formData).some(key => {
        const value = formData[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return value !== '' && value !== 0 && value !== null && value !== false;
      });
      
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to create products.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error if vendor couldn't be assigned
  if (!formData.vendor && errors.vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Assignment Failed</h2>
          <p className="text-gray-600 mb-6">{errors.vendor}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-20 gap-4">
            <div className="flex items-center">
              <button
                onClick={() => {
                  const hasChanges = Object.keys(formData).some(key => {
                    const value = formData[key];
                    if (Array.isArray(value)) return value.length > 0;
                    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
                    return value !== '' && value !== 0 && value !== null && value !== false;
                  });
                  
                  if (hasChanges) {
                    if (window.confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
                      navigate('/admin/products');
                    }
                  } else {
                    navigate('/admin/products');
                  }
                }}
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 mr-4"
                aria-label="Go back"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create New Product
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Fill in the details to add a new product to your catalog
                </p>
              </div>
            </div>
    
            
            <SaveButtons
              onSaveDraft={() => handleSave('draft')}
              onSavePublish={() => handleSave('active')}
              onPreview={() => setShowPreview(!showPreview)}
              saving={saving}
              showPreview={showPreview}
              errors={errors}
            />
          </div>
        </div>
      </div>

      {/* Vendor Info Banner - Shows auto-assigned vendor from auth */}
      {vendorInfo && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-green-700">
                <FiUserCheck className="w-4 h-4 mr-2" />
                Creating product as vendor: <span className="font-semibold mx-1">{vendorInfo.name}</span>
                {vendorInfo.role === 'admin' && (
                  <span className="ml-2 flex items-center text-xs bg-green-200 px-2 py-0.5 rounded-full">
                    <FiShield className="w-3 h-3 mr-1" />
                    Admin with vendor profile
                  </span>
                )}
              </div>
              <div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                Auto-assigned from auth ✓
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Selector */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-[72px] z-20">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between py-3 px-4 text-left"
        >
          <div className="flex items-center">
            <span className="font-medium text-gray-900">
              {tabs.find(t => t.id === activeTab)?.name}
            </span>
            {tabCompletion[activeTab] && (
              <FiCheckCircle className="w-4 h-4 text-green-500 ml-2" />
            )}
          </div>
          <FiChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isMobileMenuOpen ? 'rotate-90' : ''
          }`} />
        </button>
        
        {isMobileMenuOpen && (
          <div className="pb-3 px-4 space-y-1 max-h-96 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              const errorCount = Object.keys(errors).filter(key => 
                tab.required?.includes(key) || 
                (tab.id === 'basic' && ['name', 'type', 'vendor'].includes(key))
              ).length;
              const isCompleted = tabCompletion[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </div>
                  <div className="flex items-center">
                    {isCompleted && !errorCount && (
                      <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    )}
                    {errorCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                        {errorCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Navigation - Desktop */}
      <div className="hidden lg:block sticky top-20 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FormNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            errors={errors}
            completionStatus={tabCompletion}
          />
        </div>
      </div>

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && Object.keys(errors).filter(k => k !== 'vendor').length > 0 && (
        <div id="error-summary" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <ValidationErrors 
            errors={Object.fromEntries(
              Object.entries(errors).filter(([key]) => key !== 'vendor')
            )} 
            onDismiss={() => {
              const { vendor, ...rest } = errors;
              setErrors(rest);
            }} 
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Form */}
          <div className={`flex-1 transition-all duration-300 ${
            showPreview ? 'lg:w-2/3' : 'lg:w-full'
          }`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
              {/* Tab Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {(() => {
                      const Icon = tabs.find(t => t.id === activeTab)?.icon;
                      return Icon && <Icon className="w-6 h-6 text-indigo-600 mr-3" />;
                    })()}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {tabs.find(t => t.id === activeTab)?.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {tabs.find(t => t.id === activeTab)?.description}
                      </p>
                    </div>
                  </div>
                  {tabCompletion[activeTab] && (
                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <FiCheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">Complete</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'basic' && (
                  <BasicInformationTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                    currentUser={currentUser}
                    vendorInfo={vendorInfo}
                  />
                )}

                {activeTab === 'description' && (
                  <DescriptionTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'media' && (
                  <MediaTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                  />
                )}

                {activeTab === 'pricing' && (
                  <PricingTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'inventory' && (
                  <InventoryTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'variants' && (
                  <VariantsTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'categories' && (
                  <CategorizationTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'shipping' && (
                  <ShippingTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'seo' && (
                  <SEOTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {activeTab === 'advanced' && (
                  <AdvancedTab
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}
              </div>

              {/* Form Actions */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIndex = tabs.findIndex(tab => tab.id === activeTab) - 1;
                      if (prevIndex >= 0) {
                        setActiveTab(tabs[prevIndex].id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    disabled={activeTab === tabs[0].id}
                    className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center ${
                      activeTab === tabs[0].id
                        ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <FiChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </button>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <FiRefreshCw className="animate-spin w-5 h-5 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-5 h-5 mr-2" />
                          Save Draft
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                    >
                      {activeTab === tabs[tabs.length - 1].id ? (
                        saving ? (
                          <>
                            <FiRefreshCw className="animate-spin w-5 h-5 mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Product'
                        )
                      ) : (
                        <>
                          Save & Next
                          <FiChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className={`${
              showPreview ? 'lg:w-1/3' : 'lg:w-0'
            } transition-all duration-300`}>
              <div className="sticky top-28">
                <ProductPreview
                  formData={formData}
                  onClose={() => setShowPreview(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
          style={{ 
            width: `${((tabs.findIndex(t => t.id === activeTab) + 1) / tabs.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default CreateProductPage;