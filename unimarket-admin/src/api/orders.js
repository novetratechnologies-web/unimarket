// admin/src/api/orders.js - ORDERS MODULE API
import { apiCall } from './apiClient';

/**
 * Orders Management API
 * Handles all order-related operations
 */
const ordersAPI = {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Get all orders with filtering and pagination
   * @param {Object} params - Query parameters (page, limit, status, date range, etc.)
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
      console.log('📤 Fetching orders with params:', safeParams);
    }

    return apiCall('GET', '/orders', null, { params: safeParams });
  },

  /**
   * Get order by ID
   * @param {string} id - Order ID
   */
  getById: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching order by ID: ${id}`);
    }
    return apiCall('GET', `/orders/${id}`);
  },

  /**
   * Get order by order number
   * @param {string} orderNumber - Order number
   */
  getByNumber: (orderNumber) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching order by number: ${orderNumber}`);
    }
    return apiCall('GET', `/orders/number/${orderNumber}`);
  },

  /**
   * Create a new order
   * @param {Object} data - Order data
   */
  create: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Creating new order:', data);
    }
    return apiCall('POST', '/orders', data);
  },

  /**
   * Update an order
   * @param {string} id - Order ID
   * @param {Object} data - Updated order data
   */
  update: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating order ${id}:`, data);
    }
    return apiCall('PUT', `/orders/${id}`, data);
  },

  /**
   * Delete an order (soft delete)
   * @param {string} id - Order ID
   */
  delete: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting order ${id}`);
    }
    return apiCall('DELETE', `/orders/${id}`);
  },

  // ============================================
  // ORDER STATUS MANAGEMENT
  // ============================================

  /**
   * Update order status
   * @param {string} id - Order ID
   * @param {Object} data - Status update data (status, note, notifyCustomer)
   */
  updateStatus: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating order ${id} status:`, data);
    }
    return apiCall('PUT', `/orders/${id}/status`, data);
  },

  /**
   * Update payment status
   * @param {string} id - Order ID
   * @param {Object} data - Payment update data
   */
  updatePayment: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating order ${id} payment:`, data);
    }
    return apiCall('PUT', `/orders/${id}/payment`, data);
  },

  /**
   * Cancel an order
   * @param {string} id - Order ID
   * @param {string} reason - Cancellation reason
   */
  cancel: (id, reason) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Cancelling order ${id}:`, reason);
    }
    return apiCall('POST', `/orders/${id}/cancel`, { reason });
  },

  // ============================================
  // USER-SPECIFIC ORDERS
  // ============================================

  /**
   * Get current user's orders
   * @param {Object} params - Query parameters
   */
  getMyOrders: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching my orders:', params);
    }
    return apiCall('GET', '/orders/my-orders', null, { params });
  },

  /**
   * Get vendor's orders
   * @param {Object} params - Query parameters
   */
  getVendorOrders: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching vendor orders:', params);
    }
    return apiCall('GET', '/orders/vendor', null, { params });
  },

  /**
   * Get customer's orders (admin only)
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   */
  getCustomerOrders: (customerId, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching orders for customer ${customerId}:`, params);
    }
    return apiCall('GET', `/orders/customer/${customerId}`, null, { params });
  },

  // ============================================
  // SHIPPING & TRACKING
  // ============================================

  /**
   * Add tracking information to order
   * @param {string} id - Order ID
   * @param {Object} data - Tracking data (carrier, trackingNumber, url)
   */
  addTracking: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding tracking to order ${id}:`, data);
    }
    return apiCall('POST', `/orders/${id}/tracking`, data);
  },

  /**
   * Update tracking information
   * @param {string} id - Order ID
   * @param {string} trackingId - Tracking ID
   * @param {Object} data - Updated tracking data
   */
  updateTracking: (id, trackingId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating tracking ${trackingId} for order ${id}:`, data);
    }
    return apiCall('PUT', `/orders/${id}/tracking/${trackingId}`, data);
  },

  /**
   * Get shipping labels
   * @param {string} id - Order ID
   */
  getShippingLabels: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching shipping labels for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/shipping-labels`, null, { responseType: 'blob' });
  },

  // ============================================
  // REFUNDS & RETURNS
  // ============================================

  /**
   * Process refund for order
   * @param {string} id - Order ID
   * @param {Object} data - Refund data (items, amount, reason)
   */
  processRefund: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Processing refund for order ${id}:`, data);
    }
    return apiCall('POST', `/orders/${id}/refund`, data);
  },

  /**
   * Get refunds for order
   * @param {string} id - Order ID
   */
  getRefunds: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching refunds for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/refunds`);
  },

  /**
   * Process return request
   * @param {string} id - Order ID
   * @param {Object} data - Return data
   */
  processReturn: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Processing return for order ${id}:`, data);
    }
    return apiCall('POST', `/orders/${id}/return`, data);
  },

  // ============================================
  // NOTES & COMMUNICATION
  // ============================================

  /**
   * Add note to order
   * @param {string} id - Order ID
   * @param {Object} data - Note data (content, type, isPrivate)
   */
  addNote: (id, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Adding note to order ${id}:`, data);
    }
    return apiCall('POST', `/orders/${id}/notes`, data);
  },

  /**
   * Update order note
   * @param {string} id - Order ID
   * @param {string} noteId - Note ID
   * @param {Object} data - Updated note data
   */
  updateNote: (id, noteId, data) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Updating note ${noteId} for order ${id}:`, data);
    }
    return apiCall('PUT', `/orders/${id}/notes/${noteId}`, data);
  },

  /**
   * Delete order note
   * @param {string} id - Order ID
   * @param {string} noteId - Note ID
   */
  deleteNote: (id, noteId) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Deleting note ${noteId} from order ${id}`);
    }
    return apiCall('DELETE', `/orders/${id}/notes/${noteId}`);
  },

  /**
   * Get order timeline/activity
   * @param {string} id - Order ID
   */
  getTimeline: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching timeline for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/timeline`);
  },

  // ============================================
  // INVOICES & DOCUMENTS
  // ============================================

  /**
   * Generate invoice for order
   * @param {string} id - Order ID
   */
  generateInvoice: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Generating invoice for order ${id}`);
    }
    return apiCall('POST', `/orders/${id}/invoice`);
  },

  /**
   * Get invoice for order
   * @param {string} id - Order ID
   */
  getInvoice: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching invoice for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/invoice`, null, { responseType: 'blob' });
  },

  /**
   * Get packing slip
   * @param {string} id - Order ID
   */
  getPackingSlip: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching packing slip for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/packing-slip`, null, { responseType: 'blob' });
  },

  // ============================================
  // ANALYTICS & REPORTS
  // ============================================

  /**
   * Get order analytics
   * @param {Object} params - Analytics parameters (timeframe, groupBy)
   */
  getAnalytics: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching order analytics:', params);
    }
    return apiCall('GET', '/orders/analytics', null, { params });
  },

  /**
   * Export order analytics
   * @param {Object} params - Export parameters
   */
  exportAnalytics: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Exporting order analytics:', params);
    }
    return apiCall('GET', '/orders/analytics/export', null, { 
      params, 
      responseType: 'blob' 
    });
  },

  /**
   * Get order statistics
   * @param {Object} params - Statistics parameters
   */
  getStats: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Fetching order statistics:', params);
    }
    return apiCall('GET', '/orders/stats', null, { params });
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update orders
   * @param {Object} data - Bulk update data (ids, operation, data)
   */
  bulkUpdate: (data) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk updating orders:', data);
    }
    return apiCall('POST', '/orders/bulk', data);
  },

  /**
   * Bulk export orders
   * @param {Object} params - Export parameters
   */
  bulkExport: (params = {}) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk exporting orders:', params);
    }
    return apiCall('GET', '/orders/bulk/export', null, { 
      params, 
      responseType: 'blob' 
    });
  },

  /**
   * Bulk delete orders
   * @param {Array} ids - Array of order IDs to delete
   */
  bulkDelete: (ids) => {
    if (import.meta.env?.DEV) {
      console.log('📤 Bulk deleting orders:', ids);
    }
    return apiCall('POST', '/orders/bulk/delete', { ids });
  },

  // ============================================
  // FILTERS & SEARCH
  // ============================================

  /**
   * Search orders
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   */
  search: (query, params = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Searching orders: "${query}"`, params);
    }
    return ordersAPI.getAll({ search: query, ...params });
  },

  /**
   * Get orders by status
   * @param {string} status - Order status
   * @param {Object} params - Additional parameters
   */
  getByStatus: (status, params = {}) => {
    return ordersAPI.getAll({ status, ...params });
  },

  /**
   * Get orders by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} params - Additional parameters
   */
  getByDateRange: (startDate, endDate, params = {}) => {
    return ordersAPI.getAll({ 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      ...params 
    });
  },

  /**
   * Get recent orders
   * @param {number} limit - Number of orders to return
   */
  getRecent: (limit = 10) => {
    return ordersAPI.getAll({ 
      limit, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });
  },

  /**
   * Get orders requiring attention
   * @param {Object} params - Additional parameters
   */
  getRequiringAttention: (params = {}) => {
    return ordersAPI.getAll({ 
      status: ['pending', 'payment_failed', 'cancellation_requested'],
      ...params 
    });
  },

  // ============================================
  // PAYMENT OPERATIONS
  // ============================================

  /**
   * Capture payment for order
   * @param {string} id - Order ID
   * @param {Object} data - Capture data
   */
  capturePayment: (id, data = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Capturing payment for order ${id}:`, data);
    }
    return apiCall('POST', `/orders/${id}/capture-payment`, data);
  },

  /**
   * Void payment for order
   * @param {string} id - Order ID
   * @param {string} reason - Void reason
   */
  voidPayment: (id, reason) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Voiding payment for order ${id}:`, reason);
    }
    return apiCall('POST', `/orders/${id}/void-payment`, { reason });
  },

  /**
   * Get payment details
   * @param {string} id - Order ID
   */
  getPaymentDetails: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Fetching payment details for order ${id}`);
    }
    return apiCall('GET', `/orders/${id}/payment-details`);
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get order summary for dashboard
   */
  getDashboardSummary: () => {
    return ordersAPI.getStats({ 
      groupBy: 'status',
      timeframe: 'today'
    });
  },

  /**
   * Get orders for printing
   * @param {Array} ids - Order IDs to print
   */
  getForPrinting: (ids) => {
    return ordersAPI.bulkExport({ 
      ids: ids.join(','),
      format: 'pdf'
    });
  },

  /**
   * Duplicate order
   * @param {string} id - Order ID to duplicate
   */
  duplicate: (id) => {
    if (import.meta.env?.DEV) {
      console.log(`📤 Duplicating order ${id}`);
    }
    return apiCall('POST', `/orders/${id}/duplicate`);
  }
};

export default ordersAPI;