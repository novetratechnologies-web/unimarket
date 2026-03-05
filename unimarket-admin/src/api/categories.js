// admin/src/api/categories.js - CATEGORY MODULE API
import { apiCall } from './apiClient';

/**
 * Category Management API
 * Handles all category-related operations
 */
const categoryAPI = {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Get all categories with filtering and pagination
   * @param {Object} params - Query parameters (page, limit, search, parent, level, etc.)
   */
  getAll: (params = {}) => {
    // Set sensible defaults for admin view
    const defaultParams = {
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      includeInactive: true // Important for admin view
    };
    
    // Merge and clean params
    const safeParams = { ...defaultParams, ...params };
    Object.keys(safeParams).forEach(key => {
      if (safeParams[key] === undefined || safeParams[key] === null) {
        delete safeParams[key];
      }
    });

    if (import.meta.env?.DEV) {
      console.log('📤 Fetching categories with params:', safeParams);
    }
    
    return apiCall('GET', '/categories', null, { params: safeParams });
  },

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @param {Object} params - Optional query parameters (includeProducts, productLimit)
   */
  getById: (id, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching category by ID: ${id}`);
    }
    return apiCall('GET', `/categories/${id}`, null, { params });
  },

  /**
   * Get category by slug
   * @param {string} slug - Category slug
   * @param {Object} params - Optional query parameters
   */
  getBySlug: (slug, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching category by slug: ${slug}`);
    }
    return apiCall('GET', `/categories/slug/${slug}`, null, { params });
  },

  /**
   * Create a new category
   * @param {FormData|Object} data - Category data (supports FormData for file uploads)
   */
  create: (data) => {
    const isFormData = data instanceof FormData;
    
    if (import.meta.env?.DEV) {
      console.log('📤 Creating category with:', isFormData ? 'FormData' : 'JSON');
      if (isFormData) {
        for (let pair of data.entries()) {
          console.log(`  - ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
        }
      }
    }
    
    const config = {};
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    return apiCall('POST', '/categories', data, config);
  },

  /**
   * Update an existing category
   * @param {string} id - Category ID
   * @param {FormData|Object} data - Updated category data
   */
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating category ${id} with:`, isFormData ? 'FormData' : 'JSON');
      if (isFormData) {
        for (let pair of data.entries()) {
          console.log(`  - ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
        }
      }
    }
    
    const config = {};
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    return apiCall('PUT', `/categories/${id}`, data, config);
  },

  /**
   * Delete a category (soft delete)
   * @param {string} id - Category ID
   * @param {Object} options - Delete options (reassignTo, permanent)
   */
  delete: (id, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting category ${id}`, options);
    }
    return apiCall('DELETE', `/categories/${id}`, options);
  },

  /**
   * Restore a soft-deleted category
   * @param {string} id - Category ID
   */
  restore: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Restoring category ${id}`);
    }
    return apiCall('POST', `/categories/${id}/restore`);
  },

  // ============================================
  // CATEGORY STRUCTURE & NAVIGATION
  // ============================================

  /**
   * Get category tree structure
   * @param {Object} params - Parameters (parent, depth)
   */
  getTree: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching category tree', params);
    }
    return apiCall('GET', '/categories/tree', null, { params });
  },

  /**
   * Get categories formatted for navigation menu
   * @param {Object} params - Parameters (limit, depth)
   */
  getMenu: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching menu categories', params);
    }
    return apiCall('GET', '/categories/menu', null, { params });
  },

  /**
   * Get categories for homepage display
   * @param {number} limit - Number of categories to return
   */
  getHomepage: (limit = 8) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching homepage categories (limit: ${limit})`);
    }
    return apiCall('GET', '/categories/homepage', null, { params: { limit } });
  },

  /**
   * Get popular categories
   * @param {number} limit - Number of categories to return
   */
  getPopular: (limit = 10) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching popular categories (limit: ${limit})`);
    }
    return apiCall('GET', '/categories/popular', null, { params: { limit } });
  },

  /**
   * Get breadcrumb trail for a category
   * @param {string} slug - Category slug
   */
  getBreadcrumb: (slug) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching breadcrumb for slug: ${slug}`);
    }
    return apiCall('GET', `/categories/breadcrumb/${slug}`);
  },

  // ============================================
  // ATTRIBUTE MANAGEMENT
  // ============================================

  /**
   * Add attribute to category
   * @param {string} categoryId - Category ID
   * @param {Object} data - Attribute data
   */
  addAttribute: (categoryId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding attribute to category ${categoryId}`, data);
    }
    return apiCall('POST', `/categories/${categoryId}/attributes`, data);
  },

  /**
   * Update category attribute
   * @param {string} categoryId - Category ID
   * @param {string} attributeId - Attribute ID
   * @param {Object} data - Updated attribute data
   */
  updateAttribute: (categoryId, attributeId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating attribute ${attributeId} for category ${categoryId}`, data);
    }
    return apiCall('PUT', `/categories/${categoryId}/attributes/${attributeId}`, data);
  },

  /**
   * Delete category attribute
   * @param {string} categoryId - Category ID
   * @param {string} attributeId - Attribute ID
   */
  deleteAttribute: (categoryId, attributeId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting attribute ${attributeId} from category ${categoryId}`);
    }
    return apiCall('DELETE', `/categories/${categoryId}/attributes/${attributeId}`);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update categories
   * @param {Object} data - Bulk update data (ids, operation, data)
   */
  bulkUpdate: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating categories', data);
    }
    return apiCall('POST', '/categories/bulk', data);
  },

  /**
   * Export categories
   * @param {string} format - Export format (json, csv, excel)
   */
  export: (format = 'json') => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Exporting categories as ${format}`);
    }
    return apiCall('GET', '/categories/export', null, { 
      params: { format },
      responseType: 'blob'
    });
  },

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get category analytics
   * @param {Object} params - Analytics parameters (timeframe, groupBy)
   */
  getAnalytics: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching category analytics', params);
    }
    return apiCall('GET', '/categories/analytics', null, { params });
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get all categories including inactive (simplified)
   */
  getAllIncludingInactive: () => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching ALL categories (including inactive)');
    }
    return categoryAPI.getAll({ 
      limit: 1000, 
      includeInactive: true,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  },

  /**
   * Get active categories only (for public use)
   */
  getActive: (params = {}) => {
    return categoryAPI.getAll({ 
      ...params,
      includeInactive: false,
      isActive: true
    });
  },

  /**
   * Get featured categories
   */
  getFeatured: (params = {}) => {
    return categoryAPI.getAll({ 
      ...params,
      isFeatured: true,
      includeInactive: true
    });
  },

  /**
   * Get root categories (no parent)
   */
  getRootCategories: (params = {}) => {
    return categoryAPI.getAll({ 
      ...params,
      parent: 'null',
      includeInactive: true
    });
  },

  /**
   * Get subcategories of a parent
   * @param {string} parentId - Parent category ID
   */
  getSubcategories: (parentId, params = {}) => {
    return categoryAPI.getAll({ 
      ...params,
      parent: parentId,
      includeInactive: true
    });
  }
};

export default categoryAPI;