// src/api/categories.js
import { apiCall } from './index';

const categoriesAPI = {
  // ============================================
  // PUBLIC CATEGORY ENDPOINTS (No Auth Required)
  // ============================================

  /**
   * Get categories formatted for navigation menu
   * @returns {Promise<Array>} Categories with children structure
   */
  getMenuCategories: () => apiCall('GET', '/categories/menu'),

  /**
   * Get complete category tree structure
   * @returns {Promise<Array>} Hierarchical category tree
   */
  getCategoryTree: () => apiCall('GET', '/categories/tree'),

  /**
   * Get categories to display on homepage
   * @returns {Promise<Array>} Featured/homepage categories
   */
  getHomepageCategories: () => apiCall('GET', '/categories/homepage'),

  /**
   * Get most popular categories
   * @param {Object} params - Query parameters (limit, etc.)
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
   * @returns {Promise<Object>} Category details
   */
  getCategoryBySlug: (slug) => apiCall('GET', `/categories/slug/${slug}`),

  /**
   * Get all categories with filtering and pagination
   * @param {Object} params - Query parameters (page, limit, sort, etc.)
   * @returns {Promise<Object>} Paginated categories
   */
  getCategories: (params) => apiCall('GET', '/categories', null, { params }),

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category details
   */
  getCategoryById: (id) => apiCall('GET', `/categories/${id}`),

  // ============================================
  // PRODUCT SEARCH BY CATEGORY
  // ============================================

  /**
   * Get products by category
   * @param {string} categoryId - Category ID or slug
   * @param {Object} params - Query parameters (page, limit, sort, filters)
   * @returns {Promise<Object>} Paginated products
   */
  getCategoryProducts: (categoryId, params) => 
    apiCall('GET', `/categories/${categoryId}/products`, null, { params }),

  /**
   * Get subcategories for a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Subcategories
   */
  getSubcategories: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/subcategories`),

  // ============================================
  // CATEGORY FILTERS & ATTRIBUTES
  // ============================================

  /**
   * Get available filters for a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Filter options (price ranges, brands, attributes)
   */
  getCategoryFilters: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/filters`),

  /**
   * Get category attributes
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Category attributes
   */
  getCategoryAttributes: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/attributes`),

  // ============================================
  // CATEGORY NAVIGATION
  // ============================================

  /**
   * Get category path from root to leaf
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Category path
   */
  getCategoryPath: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/path`),

  /**
   * Get sibling categories
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Sibling categories
   */
  getSiblingCategories: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/siblings`),

  /**
   * Get featured categories
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Featured categories
   */
  getFeaturedCategories: (params) => 
    apiCall('GET', '/categories/featured', null, { params }),

  // ============================================
  // CATEGORY STATS (Public)
  // ============================================

  /**
   * Get category statistics (product count, etc.)
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Category stats
   */
  getCategoryStats: (categoryId) => 
    apiCall('GET', `/categories/${categoryId}/stats`),

  /**
   * Get all categories with product counts
   * @returns {Promise<Array>} Categories with counts
   */
  getCategoriesWithCounts: () => 
    apiCall('GET', '/categories/with-counts'),
};

export default categoriesAPI;