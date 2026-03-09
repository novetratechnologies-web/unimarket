// src/api/categories.js
import { apiCall } from './index';

const categoriesAPI = {
  // ============================================
  // PUBLIC CATEGORY ENDPOINTS (No Auth Required)
  // ============================================

  /**
   * Get categories formatted for navigation menu (Main Categories with children)
   * Returns full hierarchical tree structure
   * @returns {Promise<Array>} Categories with nested children structure
   */
  getMenuCategories: () => apiCall('GET', '/categories/menu'),

  /**
   * Get complete category tree structure
   * @param {Object} params - Optional parameters
   * @param {string} params.root - Root category ID (optional)
   * @param {number} params.depth - Max depth to fetch (default: 3)
   * @returns {Promise<Array>} Complete hierarchical category tree
   */
  getCategoryTree: (params) => apiCall('GET', '/categories/tree', null, { params }),

  /**
   * Get categories to display on homepage
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of categories (default: 8)
   * @returns {Promise<Array>} Homepage categories
   */
  getHomepageCategories: (params) => apiCall('GET', '/categories/homepage', null, { params }),

  /**
   * Get most popular categories
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of categories (default: 10)
   * @returns {Promise<Array>} Popular categories
   */
  getPopularCategories: (params) => apiCall('GET', '/categories/popular', null, { params }),

  /**
   * Get breadcrumb trail for a category
   * @param {string} slug - Category slug
   * @returns {Promise<Array>} Breadcrumb trail
   */
  getBreadcrumb: (slug) => apiCall('GET', `/categories/breadcrumb/${slug}`),

  /**
   * Get single category by slug
   * @param {string} slug - Category slug
   * @param {Object} params - Optional parameters
   * @param {boolean} params.includeProducts - Include products (default: false)
   * @param {number} params.productLimit - Number of products to include
   * @returns {Promise<Object>} Category details with subcategories
   */
  getCategoryBySlug: (slug, params) => 
    apiCall('GET', `/categories/slug/${slug}`, null, { params }),

  /**
   * Get all categories with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.search - Search term
   * @param {string} params.parent - Filter by parent category ID
   * @param {number} params.level - Filter by category level
   * @param {boolean} params.isActive - Filter by active status
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - asc/desc
   * @returns {Promise<Object>} Paginated categories
   */
  getCategories: (params) => apiCall('GET', '/categories', null, { params }),

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @param {Object} params - Optional parameters
   * @param {boolean} params.includeProducts - Include products
   * @param {number} params.productLimit - Products limit
   * @returns {Promise<Object>} Category details
   */
  getCategoryById: (id, params) => 
    apiCall('GET', `/categories/${id}`, null, { params }),

  // ============================================
  // HIERARCHICAL NAVIGATION (Derived from menu data)
  // ============================================

  /**
   * Get main categories (Level 0 - Top level)
   * Note: This is derived from menu data
   * @returns {Promise<Array>} Main categories
   */
  getMainCategories: async () => {
    const menuData = await categoriesAPI.getMenuCategories();
    return menuData;
  },

  /**
   * Get subcategories for a specific category
   * @param {string} categoryId - Category ID or slug
   * @returns {Promise<Array>} Subcategories
   */
  getSubcategories: async (categoryId) => {
    // First get the category by ID/slug, then return its children
    const category = await categoriesAPI.getCategoryBySlug(categoryId);
    return category?.subcategories || [];
  },

  /**
   * Get category path from root to current
   * @param {string} slug - Category slug
   * @returns {Promise<Array>} Category path
   */
  getCategoryPath: async (slug) => {
    return await categoriesAPI.getBreadcrumb(slug);
  },

  // ============================================
  // CATEGORY FILTERS (Derived from category data)
  // ============================================

  /**
   * Get category attributes (from category data)
   * @param {string} slug - Category slug
   * @returns {Promise<Array>} Category attributes
   */
  getCategoryAttributes: async (slug) => {
    const category = await categoriesAPI.getCategoryBySlug(slug);
    return category?.attributes || [];
  },

  // ============================================
  // PRODUCT SEARCH BY CATEGORY
  // ============================================

  /**
   * Get products by category (requires products API)
   * Note: This should be implemented in your products API
   * @param {string} categorySlug - Category slug
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated products
   */
  getCategoryProducts: (categorySlug, params) => 
    apiCall('GET', '/products', null, { params: { category: categorySlug, ...params } }),

  // ============================================
  // CATEGORY STATS
  // ============================================

  /**
   * Get category statistics
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category stats
   */
  getCategoryStats: async (id) => {
    const category = await categoriesAPI.getCategoryById(id);
    return category?.stats || {};
  },

  /**
   * Get all categories with product counts
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Categories with counts
   */
  getCategoriesWithCounts: (params) => 
    apiCall('GET', '/categories', null, { params: { ...params, fields: 'name,slug,stats' } })
};

export default categoriesAPI;