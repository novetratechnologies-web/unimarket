// src/api/auth.js
import { apiCall } from './index';

const authAPI = {
  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Register a new user
   * @param {Object} userData
   * @returns {Promise} Registration result
   */
  register: (userData) => apiCall('POST', '/auth/register', userData),

  /**
   * Login user
   * @param {Object} credentials
   * @returns {Promise} Login result with tokens
   */
  login: (credentials) => apiCall('POST', '/auth/login', credentials),

  /**
   * Logout user
   * @param {Object} data - { refresh: refreshToken }
   * @returns {Promise} Logout result
   */
  logout: (data) => apiCall('POST', '/auth/logout', data),

  /**
   * Refresh access token
   * @param {Object} data - { refresh: refreshToken }
   * @returns {Promise} New tokens
   */
  refreshToken: (data) => apiCall('POST', '/auth/refresh', data),

  /**
   * Get current user
   * @returns {Promise} User data
   */
  getMe: () => apiCall('GET', '/auth/me'),

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  /**
   * Verify email with code
   * @param {Object} data
   */
  verifyEmail: (data) => apiCall('POST', '/auth/verify-email', data),

  /**
   * Resend verification code
   * @param {Object} data
   */
  resendVerification: (data) => apiCall('POST', '/auth/resend-verification', data),

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  /**
   * Request password reset
   * @param {Object} data
   */
  forgotPassword: (data) => apiCall('POST', '/auth/forgot-password', data),

  /**
   * Verify reset code
   * @param {Object} data
   */
  verifyResetCode: (data) => apiCall('POST', '/auth/verify-reset-code', data),

  /**
   * Resend reset code
   * @param {Object} data
   */
  resendResetCode: (data) => apiCall('POST', '/auth/resend-reset-code', data),

  /**
   * Reset password
   * @param {Object} data
   */
  resetPassword: (data) => apiCall('POST', '/auth/reset-password', data),

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  /**
   * Initiate Google OAuth login
   * @param {Object} params
   */
  googleLogin: (params) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    window.location.href = `${apiCall.getBaseURL?.() || '/api'}/auth/google${queryString}`;
  },

  /**
   * Complete Google profile
   * @param {Object} profileData
   */
  completeGoogleProfile: (profileData) => apiCall('POST', '/auth/complete-google-profile', profileData),

  // ============================================
  // CSRF TOKEN
  // ============================================

  /**
   * Get CSRF token
   */
  getCSRFToken: () => apiCall('GET', '/auth/csrf-token'),

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Check email availability
   * @param {Object} params
   */
  checkEmail: (params) => apiCall('GET', '/auth/check-email', null, { params }),

  /**
   * Health check
   */
  healthCheck: () => apiCall('GET', '/auth/health'),
};

export default authAPI;