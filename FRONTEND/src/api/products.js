// src/api/products.js
import { apiCall } from './index';

const productsAPI = {
  /**
   * Get all products
   * @param {Object} params
   */
  getAll: (params) => apiCall('GET', '/products', null, { params }),

  /**
   * Get product by ID
   * @param {string} id
   */
  getById: (id) => apiCall('GET', `/products/${id}`),

  /**
   * Get product by slug
   * @param {string} slug
   */
  getBySlug: (slug) => apiCall('GET', `/products/slug/${slug}`),

  /**
   * Get featured products
   * @param {Object} params
   */
  getFeatured: (params) => apiCall('GET', '/products/featured', null, { params }),

  /**
   * Get related products
   * @param {string} productId
   */
  getRelated: (productId) => apiCall('GET', `/products/${productId}/related`),

  /**
   * Search products
   * @param {Object} params
   */
  search: (params) => apiCall('GET', '/products/search', null, { params }),
};

export default productsAPI;