// admin/src/api/notifications.js
import { apiCall } from './apiClient';

/**
 * Notifications API module
 * Handles all notification-related API calls
 */
const notificationsAPI = {
  // ============================================
  // GET NOTIFICATIONS
  // ============================================

  /**
   * Get user notifications with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {boolean} params.unreadOnly - Filter unread only
   * @param {string} params.type - Filter by type
   * @param {string} params.priority - Filter by priority
   * @param {string} params.category - Filter by category
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   */
  getAll: (params) => apiCall('GET', '/notifications', null, { params }),

  /**
   * Get unread notifications count
   */
  getUnreadCount: () => apiCall('GET', '/notifications/unread-count'),

  /**
   * Get single notification by ID
   * @param {string} id - Notification ID
   */
  getById: (id) => apiCall('GET', `/notifications/${id}`),

  // ============================================
  // UPDATE NOTIFICATIONS
  // ============================================

  /**
   * Mark a single notification as read
   * @param {string} id - Notification ID
   */
  markAsRead: (id) => apiCall('PATCH', `/notifications/${id}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => apiCall('POST', '/notifications/mark-all-read'),

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} ids - Array of notification IDs
   */
  markMultipleAsRead: (ids) => apiCall('POST', '/notifications/mark-read', { ids }),

  /**
   * Archive a notification
   * @param {string} id - Notification ID
   */
  archive: (id) => apiCall('PATCH', `/notifications/${id}/archive`),

  /**
   * Restore an archived notification
   * @param {string} id - Notification ID
   */
  restore: (id) => apiCall('PATCH', `/notifications/${id}/restore`),

  // ============================================
  // DELETE NOTIFICATIONS
  // ============================================

  /**
   * Soft delete a notification
   * @param {string} id - Notification ID
   */
  delete: (id) => apiCall('DELETE', `/notifications/${id}`),

  /**
   * Permanently delete a notification
   * @param {string} id - Notification ID
   */
  permanentDelete: (id) => apiCall('DELETE', `/notifications/${id}/permanent`),

  /**
   * Clear all notifications (soft delete all)
   */
  clearAll: () => apiCall('DELETE', '/notifications/clear-all'),

  // ============================================
  // ADMIN ONLY
  // ============================================

  /**
   * Clean up old notifications based on retention policy
   * @param {Object} data - Cleanup options
   * @param {number} data.daysToKeep - Days to keep
   */
  cleanup: (data) => apiCall('POST', '/notifications/cleanup', data),

  /**
   * Get notification statistics (admin only)
   */
  getStats: () => apiCall('GET', '/notifications/stats'),

  // ============================================
  // DEVELOPMENT ONLY
  // ============================================

  /**
   * Send a test notification (development only)
   * @param {Object} data - Test notification data
   * @param {string} data.type - Notification type
   * @param {string} data.channel - Notification channel
   */
  sendTest: (data) => apiCall('POST', '/notifications/test', data),
};

export default notificationsAPI;