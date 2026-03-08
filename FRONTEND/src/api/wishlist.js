// src/api/wishlist.js
import { apiCall } from './index';

const wishlistAPI = {
  // ============================================
  // WISHLIST - User's saved items
  // ============================================

  /**
   * Get user's wishlist
   * @param {Object} params - Pagination params
   * @returns {Promise} Wishlist items
   */
  getWishlist: (params) => apiCall('GET', '/wishlist', null, { params }),

  /**
   * Check if product is in wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} Boolean indicating if in wishlist
   */
  isInWishlist: (productId) => apiCall('GET', `/wishlist/check/${productId}`),

  /**
   * Get wishlist count
   * @returns {Promise} Number of items in wishlist
   */
  getCount: () => apiCall('GET', '/wishlist/count'),

  /**
   * Add product to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} Added item
   */
  addItem: (productId) => apiCall('POST', '/wishlist/items', { productId }),

  /**
   * Remove item from wishlist
   * @param {string} itemId - Wishlist item ID or product ID
   * @returns {Promise} Removal result
   */
  removeItem: (itemId) => apiCall('DELETE', `/wishlist/items/${itemId}`),

  /**
   * Remove multiple items from wishlist
   * @param {Array} itemIds - Array of item IDs
   * @returns {Promise} Bulk removal result
   */
  removeMultiple: (itemIds) => apiCall('POST', '/wishlist/items/remove-multiple', { itemIds }),

  /**
   * Move item to cart
   * @param {string} itemId - Wishlist item ID
   * @param {Object} options - Options (quantity, etc.)
   * @returns {Promise} Move result with updated cart and wishlist
   */
  moveToCart: (itemId, options = {}) => 
    apiCall('POST', `/wishlist/items/${itemId}/move-to-cart`, options),

  /**
   * Move all items to cart
   * @returns {Promise} Move result with updated cart and empty wishlist
   */
  moveAllToCart: () => apiCall('POST', '/wishlist/move-all-to-cart'),

  /**
   * Clear entire wishlist
   * @returns {Promise} Clear result
   */
  clearWishlist: () => apiCall('DELETE', '/wishlist'),

  /**
   * Share wishlist
   * @param {Object} shareData - Sharing options (email, etc.)
   * @returns {Promise} Share result
   */
  share: (shareData) => apiCall('POST', '/wishlist/share', shareData),

  /**
   * Get public wishlist by share ID
   * @param {string} shareId - Share ID
   * @returns {Promise} Public wishlist data
   */
  getPublicWishlist: (shareId) => apiCall('GET', `/wishlist/shared/${shareId}`),

  /**
   * Add note to wishlist item
   * @param {string} itemId - Wishlist item ID
   * @param {string} note - Note text
   * @returns {Promise} Updated item
   */
  addNote: (itemId, note) => apiCall('POST', `/wishlist/items/${itemId}/note`, { note }),

  /**
   * Update item priority
   * @param {string} itemId - Wishlist item ID
   * @param {string} priority - Priority (high, medium, low)
   * @returns {Promise} Updated item
   */
  updatePriority: (itemId, priority) => 
    apiCall('PUT', `/wishlist/items/${itemId}/priority`, { priority }),

  /**
   * Get wishlist statistics
   * @returns {Promise} Wishlist stats (total value, count, etc.)
   */
  getStats: () => apiCall('GET', '/wishlist/stats'),
};

export default wishlistAPI;