// src/api/notifications.js
import { apiCall } from './index';

const notificationsAPI = {
  // ============================================
  // NOTIFICATIONS - User's own notifications
  // ============================================

  /**
   * Get user's notifications
   * @param {Object} params - Pagination params (page, limit)
   * @returns {Promise} List of notifications
   */
  getAll: (params) => apiCall('GET', '/notifications', null, { params }),

  /**
   * Get unread notification count
   * @returns {Promise} Unread count
   */
  getUnreadCount: () => apiCall('GET', '/notifications/unread-count'),

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @returns {Promise} Updated notification
   */
  markAsRead: (id) => apiCall('POST', `/notifications/${id}/read`),

  /**
   * Mark all notifications as read
   * @returns {Promise} Success status
   */
  markAllAsRead: () => apiCall('POST', '/notifications/read-all'),

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @returns {Promise} Deletion status
   */
  delete: (id) => apiCall('DELETE', `/notifications/${id}`),

  /**
   * Get notification preferences
   * @returns {Promise} User's notification settings
   */
  getPreferences: () => apiCall('GET', '/notifications/preferences'),

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification settings
   * @returns {Promise} Updated preferences
   */
  updatePreferences: (preferences) => apiCall('PUT', '/notifications/preferences', preferences),

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription object
   * @returns {Promise} Subscription result
   */
  subscribe: (subscription) => apiCall('POST', '/notifications/subscribe', subscription),

  /**
   * Unsubscribe from push notifications
   * @returns {Promise} Unsubscribe result
   */
  unsubscribe: () => apiCall('DELETE', '/notifications/subscribe'),
};

export default notificationsAPI;