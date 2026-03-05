// admin/src/api/admin.js - FIXED ADMIN MODULE API
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

  // Dashboard
  dashboard: {
    getStats: (params) => apiCall('GET', '/admin/dashboard', null, { params }),
    getRevenue: (params) => apiCall('GET', '/admin/analytics/revenue', null, { params }),
  },

  // Vendors (Admin view)
  vendors: {
    getAll: (params) => apiCall('GET', '/admin/vendors', null, { params }),
  },

  // Settings
  settings: {
    get: () => apiCall('GET', '/admin/settings'),
    update: (data) => apiCall('PUT', '/admin/settings', data),
  },

  // Audit Logs
  audit: {
    getLogs: (params) => apiCall('GET', '/admin/audit-logs', null, { params }),
  },

  // Profile (Current Admin)
  profile: {
    get: () => apiCall('GET', '/admin/auth/me'),
    update: (data) => apiCall('PUT', '/admin/manage/me', data), // We'll need to add this route
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