// admin/src/api/products.js - PRODUCTS MODULE API
import { apiCall } from './apiClient';
import categoryAPI from './categories'; // Import category API for category-related operations

/**
 * Products Management API
 * Handles all product-related operations
 */
const productsAPI = {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Get all products with filtering and pagination
   * @param {Object} params - Query parameters (page, limit, search, category, etc.)
   */
  getAll: (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const safeParams = { ...defaultParams, ...params };
    Object.keys(safeParams).forEach(key => {
      if (safeParams[key] === undefined || safeParams[key] === null) {
        delete safeParams[key];
      }
    });

    if (import.meta.env?.DEV) {
      console.log('📤 Fetching products with params:', safeParams);
    }

    return apiCall('GET', '/products', null, { params: safeParams });
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   */
  getById: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching product by ID: ${id}`);
    }
    return apiCall('GET', `/products/${id}`);
  },

  /**
   * Get product by slug
   * @param {string} slug - Product slug
   */
  getBySlug: (slug) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching product by slug: ${slug}`);
    }
    return apiCall('GET', `/products/slug/${slug}`);
  },

  /**
   * Get product by SKU
   * @param {string} sku - Product SKU
   */
  getBySku: (sku) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching product by SKU: ${sku}`);
    }
    return apiCall('GET', `/products/sku/${encodeURIComponent(sku)}`);
  },

  /**
   * Create a new product
   * @param {FormData|Object} data - Product data (supports FormData for file uploads)
   */
  create: (data) => {
    const isFormData = data instanceof FormData;
    
    if (import.meta.env?.DEV) {
      console.log('📤 Creating new product with:', isFormData ? 'FormData' : 'JSON');
      if (isFormData) {
        for (let pair of data.entries()) {
          if (pair[0] !== 'images' && pair[0] !== 'files') {
            console.log(`  - ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
          }
        }
      }
    }
    
    const config = {};
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    return apiCall('POST', '/products', data, config);
  },

  /**
   * Update an existing product
   * @param {string} id - Product ID
   * @param {FormData|Object} data - Updated product data
   */
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating product ${id} with:`, isFormData ? 'FormData' : 'JSON');
    }
    
    const config = {};
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    return apiCall('PUT', `/products/${id}`, data, config);
  },

  /**
   * Delete a product (soft delete)
   * @param {string} id - Product ID
   * @param {Object} options - Delete options (reason, permanent)
   */
  delete: (id, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting product ${id}:`, options);
    }
    return apiCall('DELETE', `/products/${id}`, options);
  },

  /**
   * Restore a soft-deleted product
   * @param {string} id - Product ID
   */
  restore: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Restoring product ${id}`);
    }
    return apiCall('POST', `/products/${id}/restore`);
  },

  /**
   * Permanently delete a product
   * @param {string} id - Product ID
   */
  permanentDelete: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Permanently deleting product ${id}`);
    }
    return apiCall('DELETE', `/products/${id}/permanent`);
  },

  // ============================================
  // PRODUCT INVENTORY
  // ============================================

  /**
   * Get low stock products
   * @param {Object} params - Query parameters (threshold, page, limit)
   */
  getLowStock: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching low stock products:', params);
    }
    return apiCall('GET', '/products/low-stock', null, { params });
  },

  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {Object} data - Stock update data (quantity, operation, reason)
   */
  updateStock: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating stock for product ${id}:`, data);
    }
    return apiCall('PATCH', `/products/${id}/stock`, data);
  },

  /**
   * Bulk update stock
   * @param {Array} updates - Array of stock updates
   */
  bulkUpdateStock: (updates) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating stock:', updates);
    }
    return apiCall('POST', '/products/bulk/stock', { updates });
  },

  /**
   * Get stock history for a product
   * @param {string} id - Product ID
   * @param {Object} params - Query parameters
   */
  getStockHistory: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching stock history for product ${id}:`, params);
    }
    return apiCall('GET', `/products/${id}/stock-history`, null, { params });
  },

  // ============================================
  // PRODUCT VARIANTS
  // ============================================

  /**
   * Get product variants
   * @param {string} id - Product ID
   */
  getVariants: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching variants for product ${id}`);
    }
    return apiCall('GET', `/products/${id}/variants`);
  },

  /**
   * Add variant to product
   * @param {string} id - Product ID
   * @param {Object} data - Variant data
   */
  addVariant: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding variant to product ${id}:`, data);
    }
    return apiCall('POST', `/products/${id}/variants`, data);
  },

  /**
   * Update product variant
   * @param {string} id - Product ID
   * @param {string} variantId - Variant ID
   * @param {Object} data - Updated variant data
   */
  updateVariant: (id, variantId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating variant ${variantId} for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/variants/${variantId}`, data);
  },

  /**
   * Delete product variant
   * @param {string} id - Product ID
   * @param {string} variantId - Variant ID
   */
  deleteVariant: (id, variantId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting variant ${variantId} from product ${id}`);
    }
    return apiCall('DELETE', `/products/${id}/variants/${variantId}`);
  },

  // ============================================
  // PRODUCT IMAGES
  // ============================================

  /**
   * Upload product images
   * @param {string} id - Product ID
   * @param {FormData} formData - Form data with image files
   */
  uploadImages: (id, formData) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Uploading images for product ${id}`);
    }
    return apiCall('POST', `/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Update product image
   * @param {string} id - Product ID
   * @param {string} imageId - Image ID
   * @param {Object} data - Image data (alt, title, isPrimary)
   */
  updateImage: (id, imageId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating image ${imageId} for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/images/${imageId}`, data);
  },

  /**
   * Delete product image
   * @param {string} id - Product ID
   * @param {string} imageId - Image ID
   */
  deleteImage: (id, imageId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting image ${imageId} from product ${id}`);
    }
    return apiCall('DELETE', `/products/${id}/images/${imageId}`);
  },

  /**
   * Set primary image
   * @param {string} id - Product ID
   * @param {string} imageId - Image ID
   */
  setPrimaryImage: (id, imageId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Setting image ${imageId} as primary for product ${id}`);
    }
    return apiCall('PUT', `/products/${id}/images/${imageId}/primary`);
  },

  /**
   * Reorder images
   * @param {string} id - Product ID
   * @param {Array} imageIds - Array of image IDs in desired order
   */
  reorderImages: (id, imageIds) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Reordering images for product ${id}:`, imageIds);
    }
    return apiCall('POST', `/products/${id}/images/reorder`, { imageIds });
  },

  // ============================================
  // PRODUCT CATEGORIES - UPDATED TO USE CATEGORY API
  // ============================================

  /**
   * Get product categories (flat list)
   * @param {Object} params - Query parameters
   */
  getCategories: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching product categories:', params);
    }
    // Use the categories API to get all categories
    return categoryAPI.getAll(params);
  },

  /**
   * Get category tree structure
   * @param {Object} params - Parameters (parent, depth)
   */
  getCategoryTree: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching category tree:', params);
    }
    return categoryAPI.getTree(params);
  },

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   */
  getCategoryById: (categoryId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching category by ID: ${categoryId}`);
    }
    return categoryAPI.getById(categoryId);
  },

  /**
   * Get category by slug
   * @param {string} slug - Category slug
   */
  getCategoryBySlug: (slug) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching category by slug: ${slug}`);
    }
    return categoryAPI.getBySlug(slug);
  },

  /**
   * Get root categories (level 0)
   * @param {Object} params - Additional parameters
   */
  getRootCategories: (params = {}) => {
    return categoryAPI.getRootCategories(params);
  },

  /**
   * Get subcategories of a parent
   * @param {string} parentId - Parent category ID
   * @param {Object} params - Additional parameters
   */
  getSubcategories: (parentId, params = {}) => {
    return categoryAPI.getSubcategories(parentId, params);
  },

  /**
   * Assign categories to product
   * @param {string} id - Product ID
   * @param {Array} categoryIds - Array of category IDs
   */
  assignCategories: (id, categoryIds) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Assigning categories to product ${id}:`, categoryIds);
    }
    return apiCall('POST', `/products/${id}/categories`, { categoryIds });
  },

  /**
   * Remove category from product
   * @param {string} id - Product ID
   * @param {string} categoryId - Category ID
   */
  removeCategory: (id, categoryId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Removing category ${categoryId} from product ${id}`);
    }
    return apiCall('DELETE', `/products/${id}/categories/${categoryId}`);
  },

  // ============================================
  // PRODUCT REVIEWS
  // ============================================

  /**
   * Get product reviews
   * @param {string} id - Product ID
   * @param {Object} params - Query parameters
   */
  getReviews: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching reviews for product ${id}:`, params);
    }
    return apiCall('GET', `/products/${id}/reviews`, null, { params });
  },

  /**
   * Get review summary
   * @param {string} id - Product ID
   */
  getReviewSummary: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching review summary for product ${id}`);
    }
    return apiCall('GET', `/products/${id}/reviews/summary`);
  },

  /**
   * Moderate review
   * @param {string} id - Product ID
   * @param {string} reviewId - Review ID
   * @param {Object} data - Moderation data (status, reason)
   */
  moderateReview: (id, reviewId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Moderating review ${reviewId} for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/reviews/${reviewId}/moderate`, data);
  },

  // ============================================
  // PRODUCT PRICING
  // ============================================

  /**
   * Update product price
   * @param {string} id - Product ID
   * @param {Object} data - Price data (price, compareAtPrice, cost)
   */
  updatePrice: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating price for product ${id}:`, data);
    }
    return apiCall('PATCH', `/products/${id}/price`, data);
  },

  /**
   * Bulk update prices
   * @param {Object} data - Bulk price update data
   */
  bulkUpdatePrices: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating prices:', data);
    }
    return apiCall('POST', '/products/bulk/prices', data);
  },

  /**
   * Apply discount to product
   * @param {string} id - Product ID
   * @param {Object} data - Discount data (type, value, startDate, endDate)
   */
  applyDiscount: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Applying discount to product ${id}:`, data);
    }
    return apiCall('POST', `/products/${id}/discounts`, data);
  },

  /**
   * Remove discount from product
   * @param {string} id - Product ID
   * @param {string} discountId - Discount ID
   */
  removeDiscount: (id, discountId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Removing discount ${discountId} from product ${id}`);
    }
    return apiCall('DELETE', `/products/${id}/discounts/${discountId}`);
  },

  // ============================================
  // PRODUCT ATTRIBUTES
  // ============================================

  /**
   * Get product attributes
   * @param {string} id - Product ID
   */
  getAttributes: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching attributes for product ${id}`);
    }
    return apiCall('GET', `/products/${id}/attributes`);
  },

  /**
   * Update product attributes
   * @param {string} id - Product ID
   * @param {Object} data - Attributes data
   */
  updateAttributes: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating attributes for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/attributes`, data);
  },

  // ============================================
  // PRODUCT SEO
  // ============================================

  /**
   * Get product SEO
   * @param {string} id - Product ID
   */
  getSeo: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching SEO for product ${id}`);
    }
    return apiCall('GET', `/products/${id}/seo`);
  },

  /**
   * Update product SEO
   * @param {string} id - Product ID
   * @param {Object} data - SEO data
   */
  updateSeo: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating SEO for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/seo`, data);
  },

  // ============================================
  // PRODUCT SHIPPING
  // ============================================

  /**
   * Get product shipping
   * @param {string} id - Product ID
   */
  getShipping: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching shipping for product ${id}`);
    }
    return apiCall('GET', `/products/${id}/shipping`);
  },

  /**
   * Update product shipping
   * @param {string} id - Product ID
   * @param {Object} data - Shipping data
   */
  updateShipping: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating shipping for product ${id}:`, data);
    }
    return apiCall('PUT', `/products/${id}/shipping`, data);
  },

  // ============================================
  // PRODUCT ANALYTICS
  // ============================================

  /**
   * Get product analytics
   * @param {Object} params - Analytics parameters
   */
  getAnalytics: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching product analytics:', params);
    }
    return apiCall('GET', '/products/analytics', null, { params });
  },

  /**
   * Get product performance
   * @param {string} id - Product ID
   * @param {Object} params - Performance parameters
   */
  getPerformance: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching performance for product ${id}:`, params);
    }
    return apiCall('GET', `/products/${id}/performance`, null, { params });
  },

  /**
   * Get product views
   * @param {string} id - Product ID
   * @param {Object} params - Query parameters
   */
  getViews: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching views for product ${id}:`, params);
    }
    return apiCall('GET', `/products/${id}/views`, null, { params });
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update products
   * @param {Object} data - Bulk update data (ids, operation, data)
   */
  bulkUpdate: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating products:', data);
    }
    return apiCall('POST', '/products/bulk', data);
  },

  /**
   * Bulk delete products
   * @param {Array} ids - Array of product IDs
   * @param {Object} options - Delete options
   */
  bulkDelete: (ids, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk deleting products:', ids, options);
    }
    return apiCall('POST', '/products/bulk/delete', { ids, ...options });
  },

  /**
   * Bulk export products
   * @param {Object} params - Export parameters
   */
  bulkExport: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk exporting products:', params);
    }
    return apiCall('GET', '/products/export', null, { 
      params, 
      responseType: 'blob' 
    });
  },

  /**
   * Bulk import products
   * @param {FormData} formData - Form data with file
   */
  bulkImport: (formData) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk importing products');
    }
    return apiCall('POST', '/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Get bulk import status
   * @param {string} jobId - Import job ID
   */
  getImportStatus: (jobId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching import status for job ${jobId}`);
    }
    return apiCall('GET', `/products/import/${jobId}/status`);
  },

  // ============================================
  // FILTERS & SEARCH
  // ============================================

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   */
  search: (query, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Searching products: "${query}"`, params);
    }
    return productsAPI.getAll({ search: query, ...params });
  },

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Additional parameters
   */
  getByCategory: (categoryId, params = {}) => {
    return productsAPI.getAll({ category: categoryId, ...params });
  },

  /**
   * Get products by vendor
   * @param {string} vendorId - Vendor ID
   * @param {Object} params - Additional parameters
   */
  getByVendor: (vendorId, params = {}) => {
    return productsAPI.getAll({ vendor: vendorId, ...params });
  },

  /**
   * Get featured products
   * @param {Object} params - Additional parameters
   */
  getFeatured: (params = {}) => {
    return productsAPI.getAll({ isFeatured: true, ...params });
  },

  /**
   * Get new arrivals
   * @param {Object} params - Additional parameters
   */
  getNewArrivals: (params = {}) => {
    return productsAPI.getAll({ 
      sortBy: 'createdAt', 
      sortOrder: 'desc',
      ...params 
    });
  },

  /**
   * Get best selling products
   * @param {Object} params - Additional parameters
   */
  getBestSelling: (params = {}) => {
    return productsAPI.getAll({ 
      sortBy: 'totalSold', 
      sortOrder: 'desc',
      ...params 
    });
  },

  /**
   * Get on sale products
   * @param {Object} params - Additional parameters
   */
  getOnSale: (params = {}) => {
    return productsAPI.getAll({ 
      onSale: true,
      ...params 
    });
  },

  /**
   * Get products by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @param {Object} params - Additional parameters
   */
  getByPriceRange: (minPrice, maxPrice, params = {}) => {
    return productsAPI.getAll({ 
      minPrice, 
      maxPrice,
      ...params 
    });
  },

  /**
   * Get related products
   * @param {string} id - Product ID
   * @param {Object} params - Additional parameters
   */
  getRelated: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching related products for product ${id}:`, params);
    }
    return apiCall('GET', `/products/${id}/related`, null, { params });
  },

  // ============================================
  // PRODUCT DUPLICATION
  // ============================================

  /**
   * Duplicate product
   * @param {string} id - Product ID to duplicate
   * @param {Object} options - Duplication options (includeImages, includeVariants)
   */
  duplicate: (id, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Duplicating product ${id}:`, options);
    }
    return apiCall('POST', `/products/${id}/duplicate`, options);
  },

  // ============================================
  // PRODUCT APPROVAL (for vendors)
  // ============================================

  /**
   * Approve product
   * @param {string} id - Product ID
   * @param {Object} data - Approval data
   */
  approve: (id, data = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Approving product ${id}:`, data);
    }
    return apiCall('POST', `/products/${id}/approve`, data);
  },

  /**
   * Reject product
   * @param {string} id - Product ID
   * @param {Object} data - Rejection data (reason)
   */
  reject: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Rejecting product ${id}:`, data);
    }
    return apiCall('POST', `/products/${id}/reject`, data);
  },

  /**
   * Get pending approval products
   * @param {Object} params - Query parameters
   */
  getPendingApproval: (params = {}) => {
    return productsAPI.getAll({ status: 'pending', ...params });
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get dashboard product summary
   */
  getDashboardSummary: () => {
    return Promise.all([
      productsAPI.getAnalytics({ metrics: 'summary' }),
      productsAPI.getLowStock({ limit: 5 }),
      productsAPI.getPendingApproval({ limit: 5 })
    ]).then(([analytics, lowStock, pending]) => ({
      analytics: analytics.data,
      lowStock: lowStock.data,
      pendingApproval: pending.data
    }));
  },

  // admin/src/api/products.js - Add these methods

/**
 * Get inventory summary
 * @returns {Promise} - Inventory summary data
 */
getInventorySummary: () => {
  return apiCall('GET', '/products/inventory/summary');
},

/**
 * Get out of stock products
 * @param {Object} params - Query parameters
 */
getOutOfStock: (params = {}) => {
  return apiCall('GET', '/products/out-of-stock', null, { params });
},

/**
 * Get low stock products (alias for backward compatibility)
 * @param {Object} params - Query parameters
 */
getLowStock: (params = {}) => {
  return apiCall('GET', '/products/low-stock', null, { params });
},

/**
 * Get backorder products
 * @param {Object} params - Query parameters
 */
getBackorders: (params = {}) => {
  return apiCall('GET', '/products/backorders', null, { params });
},

  /**
   * Get complete product details with all relations
   * @param {string} id - Product ID
   */
  getFullDetails: (id) => {
    return Promise.all([
      productsAPI.getById(id),
      productsAPI.getVariants(id),
      productsAPI.getReviews(id, { limit: 5 }),
      productsAPI.getPerformance(id),
      productsAPI.getRelated(id, { limit: 5 })
    ]).then(([product, variants, reviews, performance, related]) => ({
      ...product.data,
      variants: variants.data,
      reviews: reviews.data,
      performance: performance.data,
      related: related.data
    }));
  }
};

export default productsAPI;