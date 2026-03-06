// src/api/index.js
const API_VERSION = '2.1.0'; // Increment this when you make changes!
console.log(`🚀 API Client v${API_VERSION} initialized`);

import axios from 'axios';
import { AUTH_KEYS } from '../constants/auth';

// ============================================
// 🔥 ENHANCED: Environment detection with fallbacks
// ============================================

// Log all environment variables at startup (only in development)
const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
if (isDevMode) {
  console.log('📋 Environment variables:', {
    VITE_ENV: import.meta.env.VITE_ENV,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV
  });
}

// ============================================
// ✅ Environment-based baseURL configuration
// ============================================
const VITE_ENV = import.meta.env.VITE_ENV;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const isDevelopment = VITE_ENV === 'development' || import.meta.env.DEV === true;
const isProduction = import.meta.env.PROD === true;

// Detect if we're on a live domain (production)
const isLiveDomain = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

console.log('🌍 Domain check:', {
  hostname: window.location.hostname,
  isLiveDomain,
  isDevelopment,
  isProduction
});

// ✅ Determine baseURL with multiple fallbacks
let baseURL;

if (isDevelopment && !isLiveDomain) {
  // Local development - use proxy
  baseURL = '/api';
  console.log('🏠 Using development proxy:', baseURL);
} else {
  // Production or live domain - use full URL
  baseURL = VITE_API_URL || 'https://unimarket-vtx5.onrender.com/api';
  console.log('🚀 Using production URL:', baseURL);
}

// Final safety check
if (!baseURL || (baseURL === '/api' && isLiveDomain)) {
  console.warn('⚠️ Production environment detected but using proxy - forcing production URL');
  baseURL = 'https://unimarket-vtx5.onrender.com/api';
}

// ============================================
// 🛡️ CSRF Token Management
// ============================================
let csrfToken = null;

const getCSRFToken = () => {
  if (csrfToken) return csrfToken;
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token' || name === 'XSRF-TOKEN') {
      csrfToken = value;
      return value;
    }
  }
  return null;
};

const setCSRFToken = (token) => {
  if (token) {
    csrfToken = token;
    document.cookie = `csrf_token=${token}; Path=/; SameSite=Strict${isProduction ? '; Secure' : ''}`;
  }
};

// ============================================
// 🔐 Token Management
// ============================================
const getToken = () => {
  if (isProduction || isLiveDomain) {
    // In production, try cookies first
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        return value;
      }
    }
  }
  
  // Fallback to sessionStorage
  const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.access;
    } catch {
      return null;
    }
  }
  return null;
};

// ============================================
// 🔄 Token Refresh Queue
// ============================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================
// 🌐 Axios Instance Creation
// ============================================
const apiClient = axios.create({
  baseURL: baseURL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': API_VERSION,
    'X-Client-Platform': 'web'
  },
  withCredentials: true, // Important for cookies
});

console.log('✅ API Client created with baseURL:', apiClient.defaults.baseURL);

// ============================================
// 🔍 Connection Test (only in non-production)
// ============================================
if (!isProduction) {
  apiClient.get('/health')
    .then(response => console.log('✅ API health check passed'))
    .catch(err => console.warn('⚠️ API health check failed:', err.message));
}

// ============================================
// 📤 Request Interceptor
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    // Log the FULL URL being called (only in development)
    if (isDevMode) {
      const fullURL = `${config.baseURL}${config.url}`;
      console.log(`🌐 REQUEST: ${config.method?.toUpperCase()} ${fullURL}`);
    }
    
    // Add CSRF token for mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
      const token = getCSRFToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }

    // Add authorization token if not a refresh request
    if (!config.headers['X-Refresh-Token']) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 📥 Response Interceptor
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    
    // Log in development
    if (isDevMode) {
      console.log(`📥 RESPONSE: ${response.config.url} (${duration}ms)`, {
        status: response.status,
        statusText: response.statusText
      });
    }
    
    // Store CSRF token if provided
    if (response.data?.csrfToken) {
      setCSRFToken(response.data.csrfToken);
    }
    
    // Add metadata to response
    response.duration = duration;
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Calculate duration even for errors
    const duration = Date.now() - (originalRequest?.metadata?.startTime || Date.now());
    
    // Enhanced error logging
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      fullUrl: originalRequest ? `${originalRequest.baseURL}${originalRequest.url}` : 'unknown',
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      duration: `${duration}ms`,
      message: error.message,
      code: error.code
    });

    // If error response has data, log it
    if (error.response?.data) {
      console.error('📦 Error data:', error.response.data);
    }

    // ==================== 404 Not Found ====================
    if (error.response?.status === 404) {
      console.warn('🔍 Endpoint not found:', originalRequest?.url);
      return Promise.reject({
        success: false,
        message: `API endpoint not found: ${originalRequest?.url}`,
        code: 'ENDPOINT_NOT_FOUND',
        status: 404,
        timestamp: new Date().toISOString()
      });
    }

// ==================== 401 Unauthorized - Token Refresh ====================
if (error.response?.status === 401 && 
    !originalRequest._retry && 
    !originalRequest.url.includes('/auth/login') && 
    !originalRequest.url.includes('/auth/register') &&
    !originalRequest.url.includes('/auth/refresh')) {
  
  if (isRefreshing) {
    // Queue this request while token refreshes
    try {
      const token = await new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  
  originalRequest._retry = true;
  isRefreshing = true;
  
  try {
    // Get refresh token
    let refreshTokenValue = null;
    
    if (isProduction || isLiveDomain) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refreshToken') {
          refreshTokenValue = value;
          break;
        }
      }
    } else {
      const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
      if (stored) {
        const parsed = JSON.parse(stored);
        refreshTokenValue = parsed.refresh;
      }
    }
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    // Attempt token refresh
    const response = await apiClient.post('/auth/refresh', 
      { refresh: refreshTokenValue },
      { 
        headers: { 'X-Refresh-Token': 'true' },
        _retry: true // Prevent infinite loop
      }
    );

    console.log('🔄 Refresh response:', response);

    // Handle multiple response structures
    let newTokens = null;

    // Structure 1: response.data.tokens
    if (response?.data?.tokens?.access && response?.data?.tokens?.refresh) {
      newTokens = response.data.tokens;
      console.log('✅ Structure 1: response.data.tokens');
    }
    // Structure 2: response.data (direct access/refresh)
    else if (response?.data?.access && response?.data?.refresh) {
      newTokens = {
        access: response.data.access,
        refresh: response.data.refresh
      };
      console.log('✅ Structure 2: response.data.access/refresh');
    }
    // Structure 3: response.tokens
    else if (response?.tokens?.access && response?.tokens?.refresh) {
      newTokens = response.tokens;
      console.log('✅ Structure 3: response.tokens');
    }
    // Structure 4: response (direct access/refresh)
    else if (response?.access && response?.refresh) {
      newTokens = {
        access: response.access,
        refresh: response.refresh
      };
      console.log('✅ Structure 4: response.access/refresh');
    }

    if (!newTokens) {
      console.error('❌ Could not extract tokens from response:', response);
      throw new Error('Invalid refresh response structure');
    }

    // 🔥 CRITICAL FIX: Store tokens and update headers
    const tokensWithMeta = {
      ...newTokens,
      storedAt: Date.now()
    };
    sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify(tokensWithMeta));
    
    // Update the default Authorization header for all future requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
    
    // 🔥 CRITICAL FIX: Update the original request's headers
    originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
    
    // Process queued requests with the new token
    processQueue(null, newTokens.access);
    
    // Retry original request
    return apiClient(originalRequest);
    
  } catch (refreshError) {
    console.error('❌ Token refresh failed:', refreshError);
    
    // Clear auth data
    sessionStorage.removeItem(AUTH_KEYS.TOKENS);
    sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
    
    // Clear cookies
    document.cookie = 'accessToken=; Max-Age=0; Path=/';
    document.cookie = 'refreshToken=; Max-Age=0; Path=/';
    document.cookie = 'csrf_token=; Max-Age=0; Path=/';
    
    // Notify app about auth expiry
    window.dispatchEvent(new CustomEvent('auth:expired', { 
      detail: { reason: 'refresh_failed' }
    }));
    
    // Process queue with error
    processQueue(refreshError, null);
    
    return Promise.reject({
      success: false,
      message: 'Your session has expired. Please login again.',
      code: 'SESSION_EXPIRED',
      status: 401
    });
  } finally {
    isRefreshing = false;
  }
}
    // ==================== 403 Forbidden / CSRF Error ====================
    if (error.response?.status === 403 || error.response?.status === 419) {
      console.warn('🛡️ CSRF token error or forbidden access');
      
      // Clear CSRF token
      csrfToken = null;
      
      // Notify app
      window.dispatchEvent(new CustomEvent('auth:csrf-error'));
      
      return Promise.reject({
        success: false,
        message: error.response?.data?.message || 'Access denied. Please refresh the page.',
        code: error.response?.data?.code || 'FORBIDDEN',
        status: error.response.status,
        requiresRefresh: true
      });
    }

    // ==================== 400 Bad Request ====================
    if (error.response?.status === 400) {
      return Promise.reject(error.response.data || {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        status: 400
      });
    }

    // ==================== 429 Too Many Requests ====================
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'] || 
                        error.response.data?.retryAfter || 60;
      
      return Promise.reject({
        success: false,
        message: error.response.data?.message || 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: parseInt(retryAfter),
        status: 429
      });
    }

    // ==================== 5xx Server Errors ====================
    if (error.response?.status && error.response.status >= 500) {
      return Promise.reject({
        success: false,
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: error.response.status,
        retryable: true
      });
    }

    // ==================== Network Errors ====================
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        success: false,
        message: 'Request timeout. Please check your connection.',
        code: 'TIMEOUT',
        retryable: true
      });
    }

    if (!error.response) {
      // Network error (no response)
      const isOnline = navigator.onLine;
      
      return Promise.reject({
        success: false,
        message: isOnline ? 'Network error. Please try again.' : 'You are offline. Please check your internet connection.',
        code: isOnline ? 'NETWORK_ERROR' : 'OFFLINE',
        retryable: isOnline
      });
    }

    // ==================== Default Error ====================
    return Promise.reject(error.response?.data || {
      success: false,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: error.response?.status || 500
    });
  }
);

// ============================================
// 📦 API Call Function
// ============================================
export const apiCall = async (method, endpoint, data = null, config = {}) => {
  try {
    const response = await apiClient.request({
      method,
      url: endpoint,
      data,
      ...config,
    });
    
    return response;
    
  } catch (error) {
    // Handle cancellation
    if (axios.isCancel(error)) {
      throw {
        success: false,
        message: 'Request cancelled',
        code: 'REQUEST_CANCELLED'
      };
    }
    
    // Re-throw processed error
    throw error;
  }
};

// ============================================
// 🎯 Convenience Methods
// ============================================
export const api = {
  // HTTP methods
  get: (endpoint, config = {}) => apiCall('GET', endpoint, null, config),
  post: (endpoint, data = {}, config = {}) => apiCall('POST', endpoint, data, config),
  put: (endpoint, data = {}, config = {}) => apiCall('PUT', endpoint, data, config),
  patch: (endpoint, data = {}, config = {}) => apiCall('PATCH', endpoint, data, config),
  delete: (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config),
  
  // Header management
  setHeader: (key, value) => {
    apiClient.defaults.headers.common[key] = value;
  },
  
  removeHeader: (key) => {
    delete apiClient.defaults.headers.common[key];
  },
  
  // CSRF token management
  getCSRFToken: getCSRFToken,
  refreshCSRFToken: async () => {
    try {
      const response = await apiClient.get('/auth/csrf-token');
      if (response?.csrfToken) {
        setCSRFToken(response.csrfToken);
        return response.csrfToken;
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
    return null;
  },
  
  // Utility methods
  getBaseURL: () => apiClient.defaults.baseURL,
  testConnection: () => apiCall('GET', '/health'),
  
  // Auth helpers
  isAuthenticated: () => {
    return !!getToken();
  },
  
  clearAuth: () => {
    sessionStorage.removeItem(AUTH_KEYS.TOKENS);
    sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
    document.cookie = 'accessToken=; Max-Age=0; Path=/';
    document.cookie = 'refreshToken=; Max-Age=0; Path=/';
    document.cookie = 'csrf_token=; Max-Age=0; Path=/';
    csrfToken = null;
  }
};

export default api;