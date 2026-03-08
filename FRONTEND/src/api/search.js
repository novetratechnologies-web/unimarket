// src/api/search.js
import { apiCall } from './index';

const searchAPI = {
  // ============================================
  // SEARCH - Product search
  // ============================================

  /**
   * Search products
   * @param {Object} params
   * @param {string} params.q - Search query
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.sort - Sort field
   * @param {string} params.order - Sort order (asc/desc)
   * @param {string} params.category - Category filter
   * @param {number} params.minPrice - Minimum price
   * @param {number} params.maxPrice - Maximum price
   * @param {Array} params.tags - Tag filters
   * @param {number} params.rating - Minimum rating
   * @returns {Promise} Search results
   */
  products: (params) => apiCall('GET', '/search/products', null, { params }),

  /**
   * Get search suggestions (autocomplete)
   * @param {string} query - Partial search query
   * @param {number} limit - Number of suggestions
   * @returns {Promise} Search suggestions
   */
  suggestions: (query, limit = 5) => 
    apiCall('GET', '/search/suggestions', null, { params: { q: query, limit } }),

  /**
   * Get popular search terms
   * @param {number} limit - Number of terms
   * @returns {Promise} Popular searches
   */
  popular: (limit = 10) => 
    apiCall('GET', '/search/popular', null, { params: { limit } }),

  /**
   * Get recent searches (for authenticated users)
   * @param {number} limit - Number of recent searches
   * @returns {Promise} Recent searches
   */
  recent: (limit = 10) => 
    apiCall('GET', '/search/recent', null, { params: { limit } }),

  /**
   * Clear recent searches
   * @returns {Promise} Clear result
   */
  clearRecent: () => apiCall('DELETE', '/search/recent'),

  /**
   * Advanced search with filters
   * @param {Object} filters - Advanced filter object
   * @returns {Promise} Filtered results
   */
  advanced: (filters) => apiCall('POST', '/search/advanced', filters),

  /**
   * Search by category
   * @param {string} categorySlug - Category slug
   * @param {Object} params - Additional search params
   * @returns {Promise} Category search results
   */
  byCategory: (categorySlug, params) => 
    apiCall('GET', `/search/category/${categorySlug}`, null, { params }),

  /**
   * Search by tag
   * @param {string} tag - Tag name
   * @param {Object} params - Additional search params
   * @returns {Promise} Tag search results
   */
  byTag: (tag, params) => 
    apiCall('GET', `/search/tag/${tag}`, null, { params }),

  /**
   * Search by vendor
   * @param {string} vendorId - Vendor ID
   * @param {Object} params - Additional search params
   * @returns {Promise} Vendor products
   */
  byVendor: (vendorId, params) => 
    apiCall('GET', `/search/vendor/${vendorId}`, null, { params }),

  /**
   * Get search filters (available categories, price ranges, etc.)
   * @param {Object} params - Current search context
   * @returns {Promise} Available filters
   */
  getFilters: (params) => apiCall('GET', '/search/filters', null, { params }),

  /**
   * Get search count (total results for query)
   * @param {Object} params - Search params
   * @returns {Promise} Result count
   */
  getCount: (params) => apiCall('GET', '/search/count', null, { params }),

  /**
   * Search with spell correction
   * @param {string} query - Search query
   * @returns {Promise} Results with "did you mean" suggestions
   */
  withSpellCheck: (query) => 
    apiCall('GET', '/search/spell-check', null, { params: { q: query } }),

  /**
   * Voice search
   * @param {Blob} audioData - Voice recording
   * @returns {Promise} Search results from voice
   */
  voice: (audioData) => {
    const formData = new FormData();
    formData.append('audio', audioData);
    return apiCall('POST', '/search/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Image search
   * @param {File} imageFile - Image file
   * @returns {Promise} Visually similar products
   */
  byImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return apiCall('POST', '/search/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Get search analytics (popular categories, trends)
   * @returns {Promise} Search analytics
   */
  getAnalytics: () => apiCall('GET', '/search/analytics'),
};

export default searchAPI;