// src/api/orders.js
import { apiCall } from './index';

const ordersAPI = {
  /**
   * Create order
   * @param {Object} orderData
   */
  create: (orderData) => apiCall('POST', '/orders', orderData),

  /**
   * Get order by ID
   * @param {string} id
   */
  getById: (id) => apiCall('GET', `/orders/${id}`),

  /**
   * Track order
   * @param {string} orderNumber
   */
  track: (orderNumber) => apiCall('GET', `/orders/track/${orderNumber}`),

  /**
   * Calculate shipping
   * @param {Object} data
   */
  calculateShipping: (data) => apiCall('POST', '/orders/calculate-shipping', data),

  /**
   * Apply coupon
   * @param {string} code
   */
  applyCoupon: (code) => apiCall('POST', '/orders/apply-coupon', { code }),
};

export default ordersAPI;