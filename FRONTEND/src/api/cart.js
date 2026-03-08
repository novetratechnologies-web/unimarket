// src/api/cart.js
import { apiCall } from './index';

const cartAPI = {
  // ============================================
  // CART - User's shopping cart
  // ============================================

  /**
   * Get current cart
   * @returns {Promise} Cart with items
   */
  getCart: () => apiCall('GET', '/cart'),

  /**
   * Get cart summary (count, subtotal)
   * @returns {Promise} Cart summary
   */
  getSummary: () => apiCall('GET', '/cart/summary'),

  /**
   * Add item to cart
   * @param {Object} item
   * @param {string} item.productId - Product ID
   * @param {number} item.quantity - Quantity (default: 1)
   * @param {Object} item.options - Product options (size, color, etc.)
   * @returns {Promise} Updated cart
   */
  addItem: (item) => apiCall('POST', '/cart/items', item),

  /**
   * Update cart item quantity
   * @param {string} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise} Updated cart
   */
  updateItemQuantity: (itemId, quantity) => 
    apiCall('PUT', `/cart/items/${itemId}`, { quantity }),

  /**
   * Remove item from cart
   * @param {string} itemId - Cart item ID
   * @returns {Promise} Updated cart
   */
  removeItem: (itemId) => apiCall('DELETE', `/cart/items/${itemId}`),

  /**
   * Remove multiple items from cart
   * @param {Array} itemIds - Array of item IDs
   * @returns {Promise} Updated cart
   */
  removeMultiple: (itemIds) => apiCall('POST', '/cart/items/remove-multiple', { itemIds }),

  /**
   * Clear entire cart
   * @returns {Promise} Empty cart
   */
  clearCart: () => apiCall('DELETE', '/cart'),

  // ============================================
  // COUPON & DISCOUNTS
  // ============================================

  /**
   * Apply coupon to cart
   * @param {string} code - Coupon code
   * @returns {Promise} Updated cart with discount
   */
  applyCoupon: (code) => apiCall('POST', '/cart/apply-coupon', { code }),

  /**
   * Remove coupon from cart
   * @returns {Promise} Updated cart without discount
   */
  removeCoupon: () => apiCall('DELETE', '/cart/coupon'),

  /**
   * Validate coupon
   * @param {string} code - Coupon code
   * @returns {Promise} Coupon validity and discount
   */
  validateCoupon: (code) => apiCall('POST', '/cart/validate-coupon', { code }),

  // ============================================
  // SHIPPING & TAX
  // ============================================

  /**
   * Estimate shipping cost
   * @param {Object} address - Shipping address
   * @returns {Promise} Shipping estimate
   */
  estimateShipping: (address) => apiCall('POST', '/cart/estimate-shipping', address),

  /**
   * Set shipping method
   * @param {string} methodId - Shipping method ID
   * @returns {Promise} Updated cart with shipping
   */
  setShippingMethod: (methodId) => apiCall('POST', '/cart/shipping-method', { methodId }),

  /**
   * Get available shipping methods
   * @param {Object} address - Shipping address
   * @returns {Promise} Available shipping methods
   */
  getShippingMethods: (address) => apiCall('POST', '/cart/shipping-methods', address),

  /**
   * Calculate tax
   * @param {Object} address - Tax address
   * @returns {Promise} Tax calculation
   */
  calculateTax: (address) => apiCall('POST', '/cart/calculate-tax', address),

  // ============================================
  // CART MANAGEMENT
  // ============================================

  /**
   * Save cart for later
   * @returns {Promise} Saved cart
   */
  saveForLater: () => apiCall('POST', '/cart/save'),

  /**
   * Restore saved cart
   * @returns {Promise} Restored cart
   */
  restoreSaved: () => apiCall('POST', '/cart/restore'),

  /**
   * Merge guest cart with user cart (after login)
   * @param {Object} guestCart - Guest cart data
   * @returns {Promise} Merged cart
   */
  mergeCart: (guestCart) => apiCall('POST', '/cart/merge', guestCart),

  /**
   * Get cart total
   * @returns {Promise} Cart total breakdown
   */
  getTotal: () => apiCall('GET', '/cart/total'),

  /**
   * Check if item is in cart
   * @param {string} productId - Product ID
   * @returns {Promise} Cart item if exists
   */
  isInCart: (productId) => apiCall('GET', `/cart/check/${productId}`),

  /**
   * Bulk add items to cart
   * @param {Array} items - Array of items to add
   * @returns {Promise} Updated cart
   */
  bulkAdd: (items) => apiCall('POST', '/cart/bulk', { items }),

  /**
   * Update multiple cart items at once
   * @param {Array} updates - Array of item updates
   * @returns {Promise} Updated cart
   */
  bulkUpdate: (updates) => apiCall('PUT', '/cart/bulk', { updates }),

  // ============================================
  // CHECKOUT PREPARATION
  // ============================================

  /**
   * Prepare cart for checkout
   * @returns {Promise} Checkout-ready cart
   */
  prepareCheckout: () => apiCall('POST', '/cart/prepare-checkout'),

  /**
   * Validate cart before checkout
   * @returns {Promise} Validation result
   */
  validateCheckout: () => apiCall('POST', '/cart/validate-checkout'),

  /**
   * Get cart for checkout
   * @returns {Promise} Checkout cart data
   */
  getCheckoutCart: () => apiCall('GET', '/cart/checkout'),
};

export default cartAPI;