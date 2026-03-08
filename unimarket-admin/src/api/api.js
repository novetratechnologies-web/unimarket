// admin/src/api/index.js - MAIN API EXPORT (UPDATED)
import apiClient, { apiCall, tokenManager } from './apiClient';
import adminAPI from './admin';
import dashboardAPI from './dashboard';
import activityAPI from './activity';
import categoryAPI from './categories';
import ordersAPI from './orders';
import customersAPI from './customers';
import productsAPI from './products';
import notificationsAPI from './notifications'; // ✅ Import notifications API

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

  // ✅ Notifications API
  notifications: notificationsAPI,

  // Admin Modules
  admin: adminAPI,
  dashboard: dashboardAPI,
  activities: activityAPI,
  categories: categoryAPI,
  orders: ordersAPI,
  customers: customersAPI,
  products: productsAPI,

  // Vendor Management (Admin view)
  vendors: {
    all: (params) => api.get('/admin/vendors', { params }),
    get: (id) => api.get(`/admin/vendors/${id}`),
    update: (id, data) => api.put(`/admin/vendors/${id}`, data),
    verify: (id, status) => api.post(`/admin/vendors/${id}/verify`, { status }),
    payouts: (params) => api.get('/admin/vendors/payouts', { params }),
    processPayout: (id, data) => api.post(`/admin/vendors/${id}/payout`, data),
    approve: (id) => api.post(`/admin/vendors/${id}/approve`),
    suspend: (id, reason) => api.post(`/admin/vendors/${id}/suspend`, { reason }),
    getPayouts: (id, params) => api.get(`/admin/vendors/${id}/payouts`, { params }),
  },

  // User Management (Admin view)
  users: {
    all: (params) => api.get('/admin/users', { params }),
    getStats: (params) => api.get('/admin/users/stats', { params }),
    get: (id) => api.get(`/admin/users/${id}`),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
  },

  // Product Management (Admin view)
  products: {
    all: (params) => api.get('/admin/products', { params }),
    getStats: (params) => api.get('/admin/products/stats', { params }),
    get: (id) => api.get(`/admin/products/${id}`),
    approve: (id) => api.post(`/admin/products/${id}/approve`),
    reject: (id, reason) => api.post(`/admin/products/${id}/reject`, { reason }),
    delete: (id) => api.delete(`/admin/products/${id}`),
  },

  // Order Management (Admin view)
  orders: {
    all: (params) => api.get('/admin/orders', { params }),
    getStats: (params) => api.get('/admin/orders/stats', { params }),
    get: (id) => api.get(`/admin/orders/${id}`),
    updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
    refund: (id, data) => api.post(`/admin/orders/${id}/refund`, data),
  },

  // Settings Management
  settings: {
    get: () => api.get('/admin/settings'),
    update: (data) => api.put('/admin/settings', data),
    getEmail: () => api.get('/admin/settings/email'),
    updateEmail: (data) => api.put('/admin/settings/email', data),
    getPayment: () => api.get('/admin/settings/payment'),
    updatePayment: (data) => api.put('/admin/settings/payment', data),
  },

  // Audit Logs
  audit: {
    logs: (params) => api.get('/admin/audit-logs', { params }),
    get: (id) => api.get(`/admin/audit-logs/${id}`),
    export: (data) => api.post('/admin/audit-logs/export', data),
  },

  // Profile (Current Admin)
  profile: {
    get: () => api.get('/admin/auth/me'),
    update: (data) => api.put('/admin/manage/me', data),
    uploadAvatar: (formData) => api.post('/admin/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getActivity: (params) => api.get('/admin/profile/activity', { params }),
    getSecurity: () => api.get('/admin/profile/security'),
    getApiKeys: () => api.get('/admin/profile/api-keys'),
    revokeApiKey: (keyId) => api.delete(`/admin/profile/api-keys/${keyId}`),
    generateApiKey: (name) => api.post('/admin/profile/api-keys', { name }),
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