// src/api/user.js
import { apiCall } from './index';

const userAPI = {
  // ============================================
  // USER PROFILE (Own account)
  // ============================================

  /**
   * Get current user's profile
   * @returns {Promise} Current user data
   */
  getProfile: () => apiCall('GET', '/user/profile'),

  /**
   * Update current user's profile
   * @param {Object} profileData
   * @param {string} profileData.firstName - First name
   * @param {string} profileData.lastName - Last name
   * @param {string} profileData.phone - Phone number
   * @param {string} profileData.avatar - Avatar image
   * @returns {Promise} Updated profile
   */
  updateProfile: (profileData) => apiCall('PUT', '/user/profile', profileData),

  /**
   * Change password
   * @param {Object} passwordData
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise} Password change result
   */
  changePassword: (passwordData) => apiCall('POST', '/user/change-password', passwordData),

  /**
   * Delete/Deactivate own account
   * @param {Object} data
   * @param {string} data.password - Password confirmation
   * @returns {Promise} Account deletion result
   */
  deleteAccount: (data) => apiCall('DELETE', '/user/account', data),

  // ============================================
  // USER'S ORDERS
  // ============================================

  /**
   * Get current user's orders
   * @param {Object} params - Pagination params
   * @returns {Promise} List of user's orders
   */
  getOrders: (params) => apiCall('GET', '/user/orders', null, { params }),

  /**
   * Get single order details
   * @param {string} orderId - Order ID
   * @returns {Promise} Order details
   */
  getOrderById: (orderId) => apiCall('GET', `/user/orders/${orderId}`),

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @returns {Promise} Cancellation result
   */
  cancelOrder: (orderId) => apiCall('POST', `/user/orders/${orderId}/cancel`),

  /**
   * Track order
   * @param {string} orderId - Order ID
   * @returns {Promise} Tracking information
   */
  trackOrder: (orderId) => apiCall('GET', `/user/orders/${orderId}/track`),

  /**
   * Request order return/refund
   * @param {string} orderId - Order ID
   * @param {Object} returnData - Return details
   * @returns {Promise} Return request result
   */
  requestReturn: (orderId, returnData) => apiCall('POST', `/user/orders/${orderId}/return`, returnData),

  // ============================================
  // USER'S WISHLIST
  // ============================================

  /**
   * Get user's wishlist
   * @returns {Promise} Wishlist items
   */
  getWishlist: () => apiCall('GET', '/user/wishlist'),

  /**
   * Add item to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} Updated wishlist
   */
  addToWishlist: (productId) => apiCall('POST', '/user/wishlist', { productId }),

  /**
   * Remove item from wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} Updated wishlist
   */
  removeFromWishlist: (productId) => apiCall('DELETE', `/user/wishlist/${productId}`),

  /**
   * Clear wishlist
   * @returns {Promise} Clear result
   */
  clearWishlist: () => apiCall('DELETE', '/user/wishlist'),

  /**
   * Move wishlist item to cart
   * @param {string} productId - Product ID
   * @returns {Promise} Move result
   */
  moveToCart: (productId) => apiCall('POST', `/user/wishlist/${productId}/move-to-cart`),

  // ============================================
  // USER'S CART
  // ============================================

  /**
   * Get user's cart
   * @returns {Promise} Cart items
   */
  getCart: () => apiCall('GET', '/user/cart'),

  /**
   * Add item to cart
   * @param {Object} cartItem
   * @param {string} cartItem.productId - Product ID
   * @param {number} cartItem.quantity - Quantity
   * @returns {Promise} Updated cart
   */
  addToCart: (cartItem) => apiCall('POST', '/user/cart', cartItem),

  /**
   * Update cart item quantity
   * @param {string} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise} Updated cart
   */
  updateCartItem: (itemId, quantity) => apiCall('PUT', `/user/cart/${itemId}`, { quantity }),

  /**
   * Remove item from cart
   * @param {string} itemId - Cart item ID
   * @returns {Promise} Updated cart
   */
  removeFromCart: (itemId) => apiCall('DELETE', `/user/cart/${itemId}`),

  /**
   * Clear cart
   * @returns {Promise} Clear result
   */
  clearCart: () => apiCall('DELETE', '/user/cart'),

  /**
   * Apply coupon to cart
   * @param {string} couponCode - Coupon code
   * @returns {Promise} Updated cart with discount
   */
  applyCoupon: (couponCode) => apiCall('POST', '/user/cart/apply-coupon', { couponCode }),

  /**
   * Remove coupon from cart
   * @returns {Promise} Updated cart
   */
  removeCoupon: () => apiCall('DELETE', '/user/cart/remove-coupon'),

  // ============================================
  // USER'S REVIEWS
  // ============================================

  /**
   * Get user's product reviews
   * @param {Object} params - Pagination params
   * @returns {Promise} User's reviews
   */
  getReviews: (params) => apiCall('GET', '/user/reviews', null, { params }),

  /**
   * Add a product review
   * @param {Object} reviewData
   * @param {string} reviewData.productId - Product ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {Array} reviewData.images - Review images
   * @returns {Promise} Created review
   */
  addReview: (reviewData) => apiCall('POST', '/user/reviews', reviewData),

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise} Updated review
   */
  updateReview: (reviewId, reviewData) => apiCall('PUT', `/user/reviews/${reviewId}`, reviewData),

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @returns {Promise} Deletion result
   */
  deleteReview: (reviewId) => apiCall('DELETE', `/user/reviews/${reviewId}`),

  // ============================================
  // USER'S ADDRESSES
  // ============================================

  /**
   * Get user's saved addresses
   * @returns {Promise} List of addresses
   */
  getAddresses: () => apiCall('GET', '/user/addresses'),

  /**
   * Add new address
   * @param {Object} addressData
   * @returns {Promise} Created address
   */
  addAddress: (addressData) => apiCall('POST', '/user/addresses', addressData),

  /**
   * Update address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address
   * @returns {Promise} Updated address
   */
  updateAddress: (addressId, addressData) => apiCall('PUT', `/user/addresses/${addressId}`, addressData),

  /**
   * Delete address
   * @param {string} addressId - Address ID
   * @returns {Promise} Deletion result
   */
  deleteAddress: (addressId) => apiCall('DELETE', `/user/addresses/${addressId}`),

  /**
   * Set default address
   * @param {string} addressId - Address ID
   * @returns {Promise} Update result
   */
  setDefaultAddress: (addressId) => apiCall('POST', `/user/addresses/${addressId}/default`),

  // ============================================
  // USER'S PAYMENT METHODS
  // ============================================

  /**
   * Get user's saved payment methods
   * @returns {Promise} List of payment methods
   */
  getPaymentMethods: () => apiCall('GET', '/user/payment-methods'),

  /**
   * Add new payment method
   * @param {Object} paymentData
   * @returns {Promise} Created payment method
   */
  addPaymentMethod: (paymentData) => apiCall('POST', '/user/payment-methods', paymentData),

  /**
   * Delete payment method
   * @param {string} methodId - Payment method ID
   * @returns {Promise} Deletion result
   */
  deletePaymentMethod: (methodId) => apiCall('DELETE', `/user/payment-methods/${methodId}`),

  /**
   * Set default payment method
   * @param {string} methodId - Payment method ID
   * @returns {Promise} Update result
   */
  setDefaultPaymentMethod: (methodId) => apiCall('POST', `/user/payment-methods/${methodId}/default`),

  // ============================================
  // USER'S NOTIFICATIONS
  // ============================================

  /**
   * Get user's notifications
   * @param {Object} params - Pagination params
   * @returns {Promise} List of notifications
   */
  getNotifications: (params) => apiCall('GET', '/user/notifications', null, { params }),

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Update result
   */
  markNotificationRead: (notificationId) => apiCall('POST', `/user/notifications/${notificationId}/read`),

  /**
   * Mark all notifications as read
   * @returns {Promise} Update result
   */
  markAllNotificationsRead: () => apiCall('POST', '/user/notifications/read-all'),

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Deletion result
   */
  deleteNotification: (notificationId) => apiCall('DELETE', `/user/notifications/${notificationId}`),

  /**
   * Get unread notification count
   * @returns {Promise} Unread count
   */
  getUnreadCount: () => apiCall('GET', '/user/notifications/unread-count'),

  // ============================================
  // USER'S STATS & ACTIVITY
  // ============================================

  /**
   * Get user's dashboard/stats
   * @returns {Promise} User statistics
   */
  getDashboard: () => apiCall('GET', '/user/dashboard'),

  /**
   * Get user's recent activity
   * @param {Object} params - Pagination params
   * @returns {Promise} Recent activity
   */
  getActivity: (params) => apiCall('GET', '/user/activity', null, { params }),

  /**
   * Get user's order statistics
   * @returns {Promise} Order stats
   */
  getOrderStats: () => apiCall('GET', '/user/order-stats'),

  /**
   * Get user's spending summary
   * @param {Object} params - Time range params
   * @returns {Promise} Spending summary
   */
  getSpendingSummary: (params) => apiCall('GET', '/user/spending-summary', null, { params }),

  // ============================================
  // USER'S PREFERENCES
  // ============================================

  /**
   * Get user preferences
   * @returns {Promise} User preferences
   */
  getPreferences: () => apiCall('GET', '/user/preferences'),

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences object
   * @returns {Promise} Updated preferences
   */
  updatePreferences: (preferences) => apiCall('PUT', '/user/preferences', preferences),

  /**
   * Update notification preferences
   * @param {Object} notificationPrefs - Notification settings
   * @returns {Promise} Updated preferences
   */
  updateNotificationPreferences: (notificationPrefs) => 
    apiCall('PUT', '/user/preferences/notifications', notificationPrefs),

  /**
   * Update privacy settings
   * @param {Object} privacySettings - Privacy settings
   * @returns {Promise} Updated settings
   */
  updatePrivacySettings: (privacySettings) => 
    apiCall('PUT', '/user/preferences/privacy', privacySettings),

  // ============================================
  // USER'S DOWNLOADS (for digital products)
  // ============================================

  /**
   * Get user's digital downloads
   * @param {Object} params - Pagination params
   * @returns {Promise} List of downloads
   */
  getDownloads: (params) => apiCall('GET', '/user/downloads', null, { params }),

  /**
   * Download a file
   * @param {string} downloadId - Download ID
   * @returns {Promise} Download URL or file
   */
  downloadFile: (downloadId) => apiCall('GET', `/user/downloads/${downloadId}/file`),

  // ============================================
  // USER'S SUPPORT TICKETS
  // ============================================

  /**
   * Get user's support tickets
   * @param {Object} params - Pagination params
   * @returns {Promise} List of tickets
   */
  getTickets: (params) => apiCall('GET', '/user/tickets', null, { params }),

  /**
   * Create support ticket
   * @param {Object} ticketData - Ticket details
   * @returns {Promise} Created ticket
   */
  createTicket: (ticketData) => apiCall('POST', '/user/tickets', ticketData),

  /**
   * Get ticket messages
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Ticket messages
   */
  getTicketMessages: (ticketId) => apiCall('GET', `/user/tickets/${ticketId}/messages`),

  /**
   * Reply to ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} message - Reply message
   * @returns {Promise} Updated ticket
   */
  replyToTicket: (ticketId, message) => apiCall('POST', `/user/tickets/${ticketId}/reply`, { message }),

  /**
   * Close ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Closed ticket
   */
  closeTicket: (ticketId) => apiCall('POST', `/user/tickets/${ticketId}/close`),
};

export default userAPI;