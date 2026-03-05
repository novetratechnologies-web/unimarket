// admin/src/api/index.js - MAIN API EXPORT
import apiClient, { apiCall, tokenManager } from './apiClient';
import adminAPI from './admin';
import activityAPI from './activity';
import categoryAPI from './categories';
import ordersAPI from './orders';
import customersAPI from './customers';
import productsAPI from './products'; // Import the new products module

// ============================================
// COMBINED API EXPORT
// ============================================
export const api = {
  // HTTP Methods (from apiClient)
  get: (endpoint, config = {}) => apiCall('GET', endpoint, null, config),
  post: (endpoint, data = {}, config = {}) => apiCall('POST', endpoint, data, config),
  put: (endpoint, data = {}, config = {}) => apiCall('PUT', endpoint, data, config),
  patch: (endpoint, data = {}, config = {}) => apiCall('PATCH', endpoint, data, config),
  delete: (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config),

  // Auth
  auth: {
    login: (credentials) => api.post('/admin/auth/login', credentials),
    logout: () => api.post('/admin/auth/logout'),
    me: () => api.get('/admin/auth/me'),
    refresh: () => api.post('/admin/auth/refresh'),
  },

  // Notifications API
  notifications: {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    getById: (id) => api.get(`/notifications/${id}`),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.post('/notifications/mark-all-read'),
    markMultipleAsRead: (ids) => api.post('/notifications/mark-read', { ids }),
    archive: (id) => api.patch(`/notifications/${id}/archive`),
    restore: (id) => api.patch(`/notifications/${id}/restore`),
    delete: (id) => api.delete(`/notifications/${id}`),
    permanentDelete: (id) => api.delete(`/notifications/${id}/permanent`),
    clearAll: () => api.delete('/notifications/clear-all'),
    getStats: () => api.get('/notifications/stats'),
    cleanup: (daysToKeep) => api.post('/notifications/cleanup', { daysToKeep }),
    sendTest: (data) => api.post('/notifications/test', data)
  },

  // Admin Modules
  admin: adminAPI,
  activities: activityAPI,
  categories: categoryAPI,
  orders: ordersAPI,
  customers: customersAPI,
  
  // ✅ PRODUCTS MODULE - Now separated
  products: productsAPI,

  // Vendor Management
  vendors: {
    all: (params) => api.get('/admin/vendors', { params }),
    get: (id) => api.get(`/admin/vendors/${id}`),
    update: (id, data) => api.put(`/admin/vendors/${id}`, data),
    verify: (id, status) => api.post(`/admin/vendors/${id}/verify`, { status }),
    payouts: (params) => api.get('/admin/vendors/payouts', { params }),
    processPayout: (id, data) => api.post(`/admin/vendors/${id}/payout`, data),
  },

  // Payout Management
  payouts: {
    getAll: (params) => api.get('/payouts', { params }),
    getById: (id) => api.get(`/payouts/${id}`),
    getByNumber: (number) => api.get(`/payouts/number/${number}`),
    create: (data) => api.post('/payouts', data),
    approve: (id, data) => api.post(`/payouts/${id}/approve`, data),
    reject: (id, data) => api.post(`/payouts/${id}/reject`, data),
    process: (id, data) => api.post(`/payouts/${id}/process`, data),
    complete: (id, data) => api.post(`/payouts/${id}/complete`, data),
    fail: (id, data) => api.post(`/payouts/${id}/fail`, data),
    getMyPayouts: (params) => api.get('/payouts/my-payouts', { params }),
    request: (data) => api.post('/payouts/request', data),
    analytics: (params) => api.get('/payouts/analytics', { params }),
  },

  // Commission Management
  commissions: {
    getAll: (params) => api.get('/commissions', { params }),
    getById: (id) => api.get(`/commissions/${id}`),
    getByCode: (code) => api.get(`/commissions/code/${code}`),
    create: (data) => api.post('/commissions', data),
    update: (id, data) => api.put(`/commissions/${id}`, data),
    delete: (id) => api.delete(`/commissions/${id}`),
    approve: (id) => api.post(`/commissions/${id}/approve`),
    reject: (id, reason) => api.post(`/commissions/${id}/reject`, { reason }),
    apply: (data) => api.post('/commissions/apply', data),
    getMyCommissions: (params) => api.get('/commissions/my-commissions', { params }),
    getVendorSummary: (vendorId) => api.get(`/commissions/vendor/${vendorId}/summary`),
    analytics: (params) => api.get('/commissions/analytics', { params }),
  },

  // Token Manager
  token: tokenManager,

  // Auth Helpers
  clearAuth: () => {
    tokenManager.clearTokens();
    tokenManager.clearUser();
  },

  isAuthenticated: () => !!tokenManager.getAccessToken(),

  getCurrentUser: () => tokenManager.getUser()
};

export default api;