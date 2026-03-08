// admin/src/api/admin.js - UPDATED (without dashboard)
import { apiCall } from './apiClient';

const adminAPI = {
  // Admin Management
  manage: {
    getAll: (params) => apiCall('GET', '/admin/manage', null, { params }),
    getById: (id) => apiCall('GET', `/admin/manage/${id}`),
    create: (data) => apiCall('POST', '/admin/manage', data),
    update: (id, data) => apiCall('PUT', `/admin/manage/${id}`, data),
    delete: (id, options) => apiCall('DELETE', `/admin/manage/${id}`, options),
    bulkUpdate: (data) => apiCall('POST', '/admin/manage/bulk', data),
  },

  // Auth
  auth: {
    login: (credentials) => apiCall('POST', '/admin/auth/login', credentials),
    logout: (sessionToken) => apiCall('POST', '/admin/auth/logout', { sessionToken }),
    refresh: (refreshToken) => apiCall('POST', '/admin/auth/refresh', { refreshToken }),
    getCurrent: () => apiCall('GET', '/admin/auth/me'),
    changePassword: (data) => apiCall('POST', '/admin/auth/change-password', data),
    setup2FA: () => apiCall('POST', '/admin/auth/2fa/setup'),
    enable2FA: (code) => apiCall('POST', '/admin/auth/2fa/enable', { code }),
    disable2FA: (password) => apiCall('POST', '/admin/auth/2fa/disable', { password }),
  },

  // Vendors (Admin view)
  vendors: {
    getAll: (params) => apiCall('GET', '/admin/vendors', null, { params }),
    getById: (id) => apiCall('GET', `/admin/vendors/${id}`),
    approve: (id) => apiCall('POST', `/admin/vendors/${id}/approve`),
    suspend: (id, reason) => apiCall('POST', `/admin/vendors/${id}/suspend`, { reason }),
    getPayouts: (id, params) => apiCall('GET', `/admin/vendors/${id}/payouts`, null, { params }),
    processPayout: (id, data) => apiCall('POST', `/admin/vendors/${id}/payouts`, data),
  },

  // Users (Admin view)
  users: {
    getAll: (params) => apiCall('GET', '/admin/users', null, { params }),
    getStats: (params) => apiCall('GET', '/admin/users/stats', null, { params }),
    getById: (id) => apiCall('GET', `/admin/users/${id}`),
    update: (id, data) => apiCall('PUT', `/admin/users/${id}`, data),
    delete: (id) => apiCall('DELETE', `/admin/users/${id}`),
  },

  // Products (Admin view)
  products: {
    getAll: (params) => apiCall('GET', '/admin/products', null, { params }),
    getStats: (params) => apiCall('GET', '/admin/products/stats', null, { params }),
    getById: (id) => apiCall('GET', `/admin/products/${id}`),
    approve: (id) => apiCall('POST', `/admin/products/${id}/approve`),
    reject: (id, reason) => apiCall('POST', `/admin/products/${id}/reject`, { reason }),
    delete: (id) => apiCall('DELETE', `/admin/products/${id}`),
  },

  // Orders (Admin view)
  orders: {
    getAll: (params) => apiCall('GET', '/admin/orders', null, { params }),
    getStats: (params) => apiCall('GET', '/admin/orders/stats', null, { params }),
    getById: (id) => apiCall('GET', `/admin/orders/${id}`),
    updateStatus: (id, status) => apiCall('PUT', `/admin/orders/${id}/status`, { status }),
    processRefund: (id, data) => apiCall('POST', `/admin/orders/${id}/refund`, data),
  },

  // Settings
  settings: {
    get: () => apiCall('GET', '/admin/settings'),
    update: (data) => apiCall('PUT', '/admin/settings', data),
    getEmail: () => apiCall('GET', '/admin/settings/email'),
    updateEmail: (data) => apiCall('PUT', '/admin/settings/email', data),
    getPayment: () => apiCall('GET', '/admin/settings/payment'),
    updatePayment: (data) => apiCall('PUT', '/admin/settings/payment', data),
  },

  // Audit Logs
  audit: {
    getLogs: (params) => apiCall('GET', '/admin/audit-logs', null, { params }),
    getById: (id) => apiCall('GET', `/admin/audit-logs/${id}`),
    export: (data) => apiCall('POST', '/admin/audit-logs/export', data),
  },

  // Profile (Current Admin)
  profile: {
    get: () => apiCall('GET', '/admin/auth/me'),
    update: (data) => apiCall('PUT', '/admin/manage/me', data),
    uploadAvatar: (formData) => apiCall('POST', '/admin/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getActivity: (params) => apiCall('GET', '/admin/profile/activity', null, { params }),
    getSecurity: () => apiCall('GET', '/admin/profile/security'),
    getApiKeys: () => apiCall('GET', '/admin/profile/api-keys'),
    revokeApiKey: (keyId) => apiCall('DELETE', `/admin/profile/api-keys/${keyId}`),
    generateApiKey: (name) => apiCall('POST', '/admin/profile/api-keys', { name }),
  },
};

export default adminAPI;