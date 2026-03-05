// admin/src/api/activity.js - ACTIVITY FEED API
import { apiCall } from './apiClient';

/**
 * Activity Feed API
 * Integrates with the backend ActivityLog model
 */
const activityAPI = {
  /**
   * Get all activities with filters
   * @param {Object} params - Query parameters
   * @returns {Promise} - Activities data
   */
  getAll: (params = {}) => apiCall('GET', '/admin/activities', null, { params }),

  /**
   * Get activity by ID
   * @param {string} id - Activity ID
   * @returns {Promise} - Activity details
   */
  getById: (id) => apiCall('GET', `/admin/activities/${id}`),

  /**
   * Get user activity timeline
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters (days, etc.)
   * @returns {Promise} - User activity timeline
   */
  getUserTimeline: (userId, params = {}) => 
    apiCall('GET', `/admin/activities/user/${userId}`, null, { params }),

  /**
   * Get activity statistics
   * @param {Object} params - Query parameters (days, interval)
   * @returns {Promise} - Activity statistics
   */
  getStatistics: (params = {}) => 
    apiCall('GET', '/admin/activities/statistics', null, { params }),

  /**
   * Export activities
   * @param {Object} params - Query parameters (format, filters)
   * @returns {Promise} - Exported data blob
   */
  export: (params = {}) => 
    apiCall('GET', '/admin/activities/export', null, { 
      params,
      responseType: 'blob' 
    }),

  /**
   * Get activity summary for dashboard
   * @param {Object} params - Query parameters (days)
   * @returns {Promise} - Activity summary
   */
  getSummary: (params = { days: 7 }) => 
    apiCall('GET', '/admin/activities/summary', null, { params }),

  /**
   * Get real-time activities (with long polling)
   * @param {number} since - Timestamp to get activities since
   * @returns {Promise} - New activities
   */
  getRealtime: (since) => 
    apiCall('GET', '/admin/activities/realtime', null, { params: { since } }),

  /**
   * Mark activities as read
   * @param {Array} activityIds - Array of activity IDs to mark as read
   * @returns {Promise} - Update result
   */
  markAsRead: (activityIds) => 
    apiCall('POST', '/admin/activities/mark-read', { activityIds }),

  /**
   * Mark all activities as read
   * @returns {Promise} - Update result
   */
  markAllAsRead: () => 
    apiCall('POST', '/admin/activities/mark-all-read'),

  /**
   * Get unread count
   * @returns {Promise} - Unread activities count
   */
  getUnreadCount: () => 
    apiCall('GET', '/admin/activities/unread-count'),

  /**
   * Clean old activities (admin only)
   * @param {Object} data - Cleanup configuration
   * @returns {Promise} - Cleanup result
   */
  cleanOld: (data) => 
    apiCall('POST', '/admin/activities/clean', data),

  /**
   * Get activity types (for filters)
   * @returns {Promise} - Available activity types
   */
  getTypes: () => 
    apiCall('GET', '/admin/activities/types'),

  /**
   * Get activity resources (for filters)
   * @returns {Promise} - Available resource types
   */
  getResources: () => 
    apiCall('GET', '/admin/activities/resources'),

  /**
   * Get activity severity levels
   * @returns {Promise} - Severity levels
   */
  getSeverities: () => 
    apiCall('GET', '/admin/activities/severities'),

  /**
   * Search activities
   * @param {string} query - Search query
   * @param {Object} params - Additional filters
   * @returns {Promise} - Search results
   */
  search: (query, params = {}) => 
    apiCall('GET', '/admin/activities/search', null, { 
      params: { q: query, ...params } 
    }),

  /**
   * Get activities by user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - User activities
   */
  getByUser: (userId, params = {}) => 
    apiCall('GET', `/admin/activities/user/${userId}`, null, { params }),

  /**
   * Get activities by resource
   * @param {string} resourceType - Resource type (order, product, etc.)
   * @param {string} resourceId - Resource ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - Resource activities
   */
  getByResource: (resourceType, resourceId, params = {}) => 
    apiCall('GET', `/admin/activities/resource/${resourceType}/${resourceId}`, null, { params }),

  /**
   * Get security events
   * @param {Object} params - Query parameters (days, severity)
   * @returns {Promise} - Security events
   */
  getSecurityEvents: (params = { days: 7, severity: ['warning', 'error', 'critical'] }) => 
    apiCall('GET', '/admin/activities/security', null, { params }),

  /**
   * Subscribe to real-time activities (WebSocket)
   * @param {Function} callback - Callback for new activities
   * @returns {Function} - Unsubscribe function
   */
  subscribe: (callback) => {
    // WebSocket implementation
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/activities`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }
};

export default activityAPI;