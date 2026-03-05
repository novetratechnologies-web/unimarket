// admin/src/api/customers.js - CUSTOMERS MODULE API
import { apiCall } from './apiClient';

/**
 * Customers Management API
 * Handles all customer-related operations
 */
const customersAPI = {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Get all customers with filtering and pagination
   * @param {Object} params - Query parameters (page, limit, search, status, etc.)
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
      console.log('📤 Fetching customers with params:', safeParams);
    }

    return apiCall('GET', '/admin/users', null, { params: safeParams });
  },

  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   */
  getById: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching customer by ID: ${id}`);
    }
    return apiCall('GET', `/admin/users/${id}`);
  },

  /**
   * Get customer by email
   * @param {string} email - Customer email
   */
  getByEmail: (email) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching customer by email: ${email}`);
    }
    return apiCall('GET', `/admin/users/email/${encodeURIComponent(email)}`);
  },

  /**
   * Create a new customer
   * @param {Object} data - Customer data
   */
  create: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Creating new customer:', data);
    }
    return apiCall('POST', '/admin/users', data);
  },

  /**
   * Update an existing customer
   * @param {string} id - Customer ID
   * @param {Object} data - Updated customer data
   */
  update: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating customer ${id}:`, data);
    }
    return apiCall('PUT', `/admin/users/${id}`, data);
  },

  /**
   * Delete a customer (soft delete)
   * @param {string} id - Customer ID
   * @param {Object} options - Delete options (reason, permanent)
   */
  delete: (id, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting customer ${id}:`, options);
    }
    return apiCall('DELETE', `/admin/users/${id}`, options);
  },

  /**
   * Restore a soft-deleted customer
   * @param {string} id - Customer ID
   */
  restore: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Restoring customer ${id}`);
    }
    return apiCall('POST', `/admin/users/${id}/restore`);
  },

  // ============================================
  // CUSTOMER STATS & ANALYTICS
  // ============================================

  /**
   * Get customer statistics
   * @param {Object} params - Stats parameters (timeframe, groupBy)
   */
  getStats: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching customer stats:', params);
    }
    return apiCall('GET', '/admin/users/stats', null, { params });
  },

  /**
   * Get customer analytics
   * @param {Object} params - Analytics parameters (period, metrics)
   */
  getAnalytics: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching customer analytics:', params);
    }
    return apiCall('GET', '/admin/users/analytics', null, { params });
  },

  /**
   * Get customer growth chart data
   * @param {Object} params - Chart parameters (period, interval)
   */
  getGrowthChart: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching customer growth chart:', params);
    }
    return apiCall('GET', '/admin/users/charts/growth', null, { params });
  },

  // ============================================
  // CUSTOMER ORDERS
  // ============================================

  /**
   * Get customer orders
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters (page, limit, status)
   */
  getOrders: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching orders for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/orders`, null, { params });
  },

  /**
   * Get customer order summary
   * @param {string} customerId - Customer ID
   */
  getOrderSummary: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching order summary for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/orders/summary`);
  },

  /**
   * Get customer recent orders
   * @param {string} customerId - Customer ID
   * @param {number} limit - Number of orders to return
   */
  getRecentOrders: (customerId, limit = 5) => {
    return customersAPI.getOrders(customerId, { 
      limit, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });
  },

  // ============================================
  // CUSTOMER ADDRESSES
  // ============================================

  /**
   * Get customer addresses
   * @param {string} customerId - Customer ID
   */
  getAddresses: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching addresses for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/addresses`);
  },

  /**
   * Add customer address
   * @param {string} customerId - Customer ID
   * @param {Object} data - Address data
   */
  addAddress: (customerId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding address for customer ${customerId}:`, data);
    }
    return apiCall('POST', `/admin/users/${customerId}/addresses`, data);
  },

  /**
   * Update customer address
   * @param {string} customerId - Customer ID
   * @param {string} addressId - Address ID
   * @param {Object} data - Updated address data
   */
  updateAddress: (customerId, addressId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating address ${addressId} for customer ${customerId}:`, data);
    }
    return apiCall('PUT', `/admin/users/${customerId}/addresses/${addressId}`, data);
  },

  /**
   * Delete customer address
   * @param {string} customerId - Customer ID
   * @param {string} addressId - Address ID
   */
  deleteAddress: (customerId, addressId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting address ${addressId} for customer ${customerId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/addresses/${addressId}`);
  },

  /**
   * Set default address
   * @param {string} customerId - Customer ID
   * @param {string} addressId - Address ID
   */
  setDefaultAddress: (customerId, addressId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Setting default address ${addressId} for customer ${customerId}`);
    }
    return apiCall('PUT', `/admin/users/${customerId}/addresses/${addressId}/default`);
  },

  // ============================================
  // CUSTOMER PAYMENT METHODS
  // ============================================

  /**
   * Get customer payment methods
   * @param {string} customerId - Customer ID
   */
  getPaymentMethods: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching payment methods for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/payment-methods`);
  },

  /**
   * Add payment method
   * @param {string} customerId - Customer ID
   * @param {Object} data - Payment method data
   */
  addPaymentMethod: (customerId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding payment method for customer ${customerId}:`, data);
    }
    return apiCall('POST', `/admin/users/${customerId}/payment-methods`, data);
  },

  /**
   * Delete payment method
   * @param {string} customerId - Customer ID
   * @param {string} methodId - Payment method ID
   */
  deletePaymentMethod: (customerId, methodId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting payment method ${methodId} for customer ${customerId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/payment-methods/${methodId}`);
  },

  /**
   * Set default payment method
   * @param {string} customerId - Customer ID
   * @param {string} methodId - Payment method ID
   */
  setDefaultPaymentMethod: (customerId, methodId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Setting default payment method ${methodId} for customer ${customerId}`);
    }
    return apiCall('PUT', `/admin/users/${customerId}/payment-methods/${methodId}/default`);
  },

  // ============================================
  // CUSTOMER WISHLIST
  // ============================================

  /**
   * Get customer wishlist
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getWishlist: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching wishlist for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/wishlist`, null, { params });
  },

  /**
   * Add product to wishlist
   * @param {string} customerId - Customer ID
   * @param {string} productId - Product ID
   */
  addToWishlist: (customerId, productId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding product ${productId} to wishlist for customer ${customerId}`);
    }
    return apiCall('POST', `/admin/users/${customerId}/wishlist`, { productId });
  },

  /**
   * Remove from wishlist
   * @param {string} customerId - Customer ID
   * @param {string} productId - Product ID
   */
  removeFromWishlist: (customerId, productId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Removing product ${productId} from wishlist for customer ${customerId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/wishlist/${productId}`);
  },

  /**
   * Check if product is in wishlist
   * @param {string} customerId - Customer ID
   * @param {string} productId - Product ID
   */
  isInWishlist: (customerId, productId) => {
    return apiCall('GET', `/admin/users/${customerId}/wishlist/check/${productId}`);
  },

  // ============================================
  // CUSTOMER REVIEWS
  // ============================================

  /**
   * Get customer reviews
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getReviews: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching reviews for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/reviews`, null, { params });
  },

  /**
   * Get customer review summary
   * @param {string} customerId - Customer ID
   */
  getReviewSummary: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching review summary for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/reviews/summary`);
  },

  // ============================================
  // CUSTOMER ACTIVITY
  // ============================================

  /**
   * Get customer activity log
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getActivity: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching activity for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/activity`, null, { params });
  },

  /**
   * Get customer login history
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getLoginHistory: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching login history for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/login-history`, null, { params });
  },

  /**
   * Get customer last login
   * @param {string} customerId - Customer ID
   */
  getLastLogin: (customerId) => {
    return apiCall('GET', `/admin/users/${customerId}/last-login`);
  },

  // ============================================
  // CUSTOMER SEGMENTS & GROUPS
  // ============================================

  /**
   * Get customer segments
   * @param {Object} params - Query parameters
   */
  getSegments: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching customer segments:', params);
    }
    return apiCall('GET', '/admin/users/segments', null, { params });
  },

  /**
   * Create customer segment
   * @param {Object} data - Segment data
   */
  createSegment: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Creating customer segment:', data);
    }
    return apiCall('POST', '/admin/users/segments', data);
  },

  /**
   * Update customer segment
   * @param {string} segmentId - Segment ID
   * @param {Object} data - Updated segment data
   */
  updateSegment: (segmentId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating segment ${segmentId}:`, data);
    }
    return apiCall('PUT', `/admin/users/segments/${segmentId}`, data);
  },

  /**
   * Delete customer segment
   * @param {string} segmentId - Segment ID
   */
  deleteSegment: (segmentId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting segment ${segmentId}`);
    }
    return apiCall('DELETE', `/admin/users/segments/${segmentId}`);
  },

  /**
   * Assign customer to segment
   * @param {string} customerId - Customer ID
   * @param {string} segmentId - Segment ID
   */
  assignToSegment: (customerId, segmentId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Assigning customer ${customerId} to segment ${segmentId}`);
    }
    return apiCall('POST', `/admin/users/${customerId}/segments/${segmentId}`);
  },

  /**
   * Remove customer from segment
   * @param {string} customerId - Customer ID
   * @param {string} segmentId - Segment ID
   */
  removeFromSegment: (customerId, segmentId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Removing customer ${customerId} from segment ${segmentId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/segments/${segmentId}`);
  },

  // ============================================
  // CUSTOMER NOTES
  // ============================================

  /**
   * Get customer notes
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getNotes: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching notes for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/notes`, null, { params });
  },

  /**
   * Add customer note
   * @param {string} customerId - Customer ID
   * @param {Object} data - Note data (content, type, isPrivate)
   */
  addNote: (customerId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding note for customer ${customerId}:`, data);
    }
    return apiCall('POST', `/admin/users/${customerId}/notes`, data);
  },

  /**
   * Update customer note
   * @param {string} customerId - Customer ID
   * @param {string} noteId - Note ID
   * @param {Object} data - Updated note data
   */
  updateNote: (customerId, noteId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating note ${noteId} for customer ${customerId}:`, data);
    }
    return apiCall('PUT', `/admin/users/${customerId}/notes/${noteId}`, data);
  },

  /**
   * Delete customer note
   * @param {string} customerId - Customer ID
   * @param {string} noteId - Note ID
   */
  deleteNote: (customerId, noteId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting note ${noteId} for customer ${customerId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/notes/${noteId}`);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update customers
   * @param {Object} data - Bulk update data (ids, operation, data)
   */
  bulkUpdate: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating customers:', data);
    }
    return apiCall('POST', '/admin/users/bulk', data);
  },

  /**
   * Bulk delete customers
   * @param {Array} ids - Array of customer IDs
   * @param {Object} options - Delete options
   */
  bulkDelete: (ids, options = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk deleting customers:', ids, options);
    }
    return apiCall('POST', '/admin/users/bulk/delete', { ids, ...options });
  },

  /**
   * Bulk export customers
   * @param {Object} params - Export parameters
   */
  bulkExport: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk exporting customers:', params);
    }
    return apiCall('GET', '/admin/users/export', null, { 
      params, 
      responseType: 'blob' 
    });
  },

  /**
   * Bulk import customers
   * @param {FormData} formData - Form data with file
   */
  bulkImport: (formData) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk importing customers');
    }
    return apiCall('POST', '/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // ============================================
  // FILTERS & SEARCH
  // ============================================

  /**
   * Search customers
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   */
  search: (query, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Searching customers: "${query}"`, params);
    }
    return customersAPI.getAll({ search: query, ...params });
  },

  /**
   * Get customers by status
   * @param {string} status - Customer status
   * @param {Object} params - Additional parameters
   */
  getByStatus: (status, params = {}) => {
    return customersAPI.getAll({ status, ...params });
  },

  /**
   * Get customers by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} params - Additional parameters
   */
  getByDateRange: (startDate, endDate, params = {}) => {
    return customersAPI.getAll({ 
      createdAfter: startDate.toISOString(), 
      createdBefore: endDate.toISOString(),
      ...params 
    });
  },

  /**
   * Get recent customers
   * @param {number} limit - Number of customers to return
   */
  getRecent: (limit = 10) => {
    return customersAPI.getAll({ 
      limit, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });
  },

  /**
   * Get active customers
   * @param {Object} params - Additional parameters
   */
  getActive: (params = {}) => {
    return customersAPI.getAll({ status: 'active', ...params });
  },

  /**
   * Get inactive customers
   * @param {Object} params - Additional parameters
   */
  getInactive: (params = {}) => {
    return customersAPI.getAll({ status: 'inactive', ...params });
  },

  /**
   * Get verified customers
   * @param {Object} params - Additional parameters
   */
  getVerified: (params = {}) => {
    return customersAPI.getAll({ isVerified: true, ...params });
  },

  /**
   * Get unverified customers
   * @param {Object} params - Additional parameters
   */
  getUnverified: (params = {}) => {
    return customersAPI.getAll({ isVerified: false, ...params });
  },

  /**
   * Get customers with abandoned carts
   * @param {Object} params - Additional parameters
   */
  getAbandonedCarts: (params = {}) => {
    return customersAPI.getAll({ hasAbandonedCart: true, ...params });
  },

  // ============================================
  // CUSTOMER COMMUNICATION
  // ============================================

  /**
   * Send email to customer
   * @param {string} customerId - Customer ID
   * @param {Object} data - Email data (subject, message, template)
   */
  sendEmail: (customerId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Sending email to customer ${customerId}:`, data);
    }
    return apiCall('POST', `/admin/users/${customerId}/send-email`, data);
  },

  /**
   * Send SMS to customer
   * @param {string} customerId - Customer ID
   * @param {Object} data - SMS data (message)
   */
  sendSMS: (customerId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Sending SMS to customer ${customerId}:`, data);
    }
    return apiCall('POST', `/admin/users/${customerId}/send-sms`, data);
  },

  /**
   * Get customer communication history
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getCommunicationHistory: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching communication history for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/admin/users/${customerId}/communications`, null, { params });
  },

  // ============================================
  // CUSTOMER IMPERSONATION
  // ============================================

  /**
   * Get login token for customer (admin impersonation)
   * @param {string} customerId - Customer ID
   */
  getLoginToken: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Getting login token for customer ${customerId}`);
    }
    return apiCall('POST', `/admin/users/${customerId}/login-token`);
  },

  /**
   * Stop impersonating customer
   */
  stopImpersonating: () => {
    if (import.meta.env?.DEV) {
      console.log('📤 Stopping customer impersonation');
    }
    return apiCall('POST', '/admin/users/stop-impersonating');
  },

  // ============================================
  // CUSTOMER TAGS
  // ============================================

  /**
   * Get customer tags
   * @param {string} customerId - Customer ID
   */
  getTags: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching tags for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/tags`);
  },

  /**
   * Add tag to customer
   * @param {string} customerId - Customer ID
   * @param {string} tag - Tag name
   */
  addTag: (customerId, tag) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding tag "${tag}" to customer ${customerId}`);
    }
    return apiCall('POST', `/admin/users/${customerId}/tags`, { tag });
  },

  /**
   * Remove tag from customer
   * @param {string} customerId - Customer ID
   * @param {string} tag - Tag name
   */
  removeTag: (customerId, tag) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Removing tag "${tag}" from customer ${customerId}`);
    }
    return apiCall('DELETE', `/admin/users/${customerId}/tags/${encodeURIComponent(tag)}`);
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get customer dashboard summary
   */
  getDashboardSummary: () => {
    return customersAPI.getStats({ 
      metrics: ['total', 'new', 'active', 'churned']
    });
  },

  /**
   * Get customer profile complete with all related data
   * @param {string} customerId - Customer ID
   */
  getFullProfile: (customerId) => {
    return Promise.all([
      customersAPI.getById(customerId),
      customersAPI.getOrderSummary(customerId),
      customersAPI.getAddresses(customerId),
      customersAPI.getPaymentMethods(customerId),
      customersAPI.getWishlist(customerId, { limit: 5 }),
      customersAPI.getRecentOrders(customerId, 5),
      customersAPI.getReviewSummary(customerId),
      customersAPI.getActivity(customerId, { limit: 10 })
    ]).then(([
      customer,
      orderSummary,
      addresses,
      paymentMethods,
      wishlist,
      recentOrders,
      reviewSummary,
      recentActivity
    ]) => ({
      ...customer.data,
      orderSummary: orderSummary.data,
      addresses: addresses.data,
      paymentMethods: paymentMethods.data,
      wishlist: wishlist.data,
      recentOrders: recentOrders.data,
      reviewSummary: reviewSummary.data,
      recentActivity: recentActivity.data
    }));
  },

  /**
   * Export customer data for GDPR compliance
   * @param {string} customerId - Customer ID
   */
  exportPersonalData: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Exporting personal data for customer ${customerId}`);
    }
    return apiCall('GET', `/admin/users/${customerId}/export-data`, null, { 
      responseType: 'blob' 
    });
  },

  /**
   * Anonymize customer data (GDPR right to be forgotten)
   * @param {string} customerId - Customer ID
   */
  anonymizeData: (customerId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Anonymizing data for customer ${customerId}`);
    }
    return apiCall('POST', `/admin/users/${customerId}/anonymize`);
  }
};

export default customersAPI;