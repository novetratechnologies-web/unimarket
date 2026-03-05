// src/api/index.js
const API_VERSION = '2.0.0'; // Increment this when you make changes!
console.log(`🚀 API Client v${API_VERSION} initialized`);

import axios from 'axios';
import { AUTH_KEYS } from '../constants/auth';

// ============================================
// 🔥 ENHANCED: Environment detection with fallbacks
// ============================================

// Log all environment variables at startup
console.log('📋 All import.meta.env:', import.meta.env);

const VITE_ENV = import.meta.env.VITE_ENV;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const MODE = import.meta.env.MODE;
const PROD = import.meta.env.PROD;
const DEV = import.meta.env.DEV;

console.log('🔍 Environment Variables:', {
  VITE_ENV,
  VITE_API_URL,
  MODE,
  PROD,
  DEV,
  'process.env.NODE_ENV': process.env.NODE_ENV
});

// ============================================
// ✅ FIXED: Environment-based baseURL configuration
// ============================================
const isDevelopment = VITE_ENV === 'development' || DEV === true;
const isProduction = PROD === true || process.env.NODE_ENV === 'production';

// ✅ CRITICAL FIX: Force production URL if we're on the live domain
const isLiveDomain = window.location.hostname.includes('unimatket.store') || 
                     window.location.hostname.includes('vercel.app');

console.log('🌍 Domain check:', {
  hostname: window.location.hostname,
  isLiveDomain
});

// ✅ CORRECT: Use environment variable with multiple fallbacks
let baseURL;

if (isDevelopment && !isLiveDomain) {
  // Local development
  baseURL = '/api';
  console.log('🏠 Using development proxy:', baseURL);
} else {
  // Production or live domain - use the full URL
  baseURL = VITE_API_URL || 'https://unimarket-vtx5.onrender.com/api';
  console.log('🚀 Using production URL:', baseURL);
}

// Final safety check - ensure we have a valid URL
if (!baseURL || baseURL === '/api' && isLiveDomain) {
  console.warn('⚠️ Possible misconfiguration - forcing production URL');
  baseURL = 'https://unimarket-vtx5.onrender.com/api';
}

console.log('🔧 Environment Summary:', { 
  isDevelopment, 
  isProduction,
  isLiveDomain,
  VITE_ENV,
  VITE_API_URL,
  finalBaseURL: baseURL
});

// Request queue for token refresh
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
// ✅ FIXED: Use baseURL variable instead of hardcoded '/api'
// ============================================
const apiClient = axios.create({
  baseURL: baseURL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always true for cross-origin requests
});

console.log('✅ API Client created with baseURL:', apiClient.defaults.baseURL);

// Test the connection
if (!isDevelopment) {
  console.log('🔄 Testing connection to:', baseURL);
  fetch(`${baseURL}/health`)
    .then(res => res.json())
    .then(data => console.log('✅ Health check passed:', data))
    .catch(err => console.error('❌ Health check failed:', err.message));
}

// Get CSRF token
const getCSRFToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token' || name === 'XSRF-TOKEN') {
      return value;
    }
  }
  return null;
};

// Get token from secure storage
const getToken = () => {
  if (!isDevelopment || isLiveDomain) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        return value;
      }
    }
    return null;
  } else {
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
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log the FULL URL being called
    const fullURL = `${config.baseURL}${config.url}`;
    console.log(`🌐 REQUEST: ${config.method?.toUpperCase()} ${fullURL}`);
    
    // Add CSRF token for mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add authorization token if not a refresh request
    if (!config.headers['X-Refresh-Token']) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log in development
    if (import.meta.env.VITE_LOG_REQUESTS === 'true') {
      console.log(`📤 [API] ${config.method?.toUpperCase()} ${fullURL}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_LOG_RESPONSES === 'true') {
      console.log(`📥 [API] ${response.config.url}`, response.status);
    }
    
    // Check for CSRF token in response
    if (response.data?.csrfToken) {
      document.cookie = `csrf_token=${response.data.csrfToken}; Path=/; SameSite=Strict${!isDevelopment ? '; Secure' : ''}`;
    }
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ [API Error]', {
      url: originalRequest?.url,
      fullUrl: originalRequest ? `${originalRequest.baseURL}${originalRequest.url}` : 'unknown',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Handle 404 errors - special logging for debugging
    if (error.response?.status === 404) {
      console.error('🔍 404 Debug:', {
        attemptedURL: originalRequest ? `${originalRequest.baseURL}${originalRequest.url}` : 'unknown',
        baseURL: originalRequest?.baseURL,
        url: originalRequest?.url,
        method: originalRequest?.method
      });
      
      return Promise.reject({
        success: false,
        message: `API endpoint not found: ${originalRequest?.url}`,
        code: 'ENDPOINT_NOT_FOUND',
        status: 404
      });
    }

    // Handle 401 for token refresh
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/login') && 
        !originalRequest.url.includes('/auth/register')) {
      
      if (isRefreshing) {
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
        let refreshToken;
        if (!isDevelopment || isLiveDomain) {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'refreshToken') {
              refreshToken = value;
              break;
            }
          }
        } else {
          const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
          if (stored) {
            const parsed = JSON.parse(stored);
            refreshToken = parsed.refresh;
          }
        }
        
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', 
            { refresh: refreshToken },
            { headers: { 'X-Refresh-Token': 'true' } }
          );
          
          if (response?.data?.tokens) {
            const tokens = response.data.tokens;
            
            if (!isDevelopment || isLiveDomain) {
              document.cookie = `accessToken=${tokens.access}; Secure; HttpOnly; SameSite=Strict; path=/`;
              document.cookie = `refreshToken=${tokens.refresh}; Secure; HttpOnly; SameSite=Strict; path=/`;
            } else {
              sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify(tokens));
            }
            
            originalRequest.headers['Authorization'] = `Bearer ${tokens.access}`;
            processQueue(null, tokens.access);
            
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth and redirect
        sessionStorage.removeItem(AUTH_KEYS.TOKENS);
        sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
        document.cookie = 'accessToken=; Max-Age=0; Path=/';
        document.cookie = 'refreshToken=; Max-Age=0; Path=/';
        window.dispatchEvent(new Event('auth-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 403/419 (CSRF errors)
    if (error.response?.status === 403 || error.response?.status === 419) {
      window.dispatchEvent(new Event('auth-expired'));
      return Promise.reject({
        success: false,
        message: 'Authentication expired',
        code: 'AUTH_EXPIRED',
        status: error.response.status
      });
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      return Promise.reject(error.response.data || {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      return Promise.reject(error.response.data || {
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMITED'
      });
    }

    // Handle server errors (500)
    if (error.response?.status >= 500) {
      return Promise.reject({
        success: false,
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: error.response.status
      });
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        success: false,
        message: 'Request timeout',
        code: 'TIMEOUT'
      });
    }

    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      });
    }
    
    // Default error
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    
    return Promise.reject({
      success: false,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    });
  }
);

// API call function
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
    if (axios.isCancel(error)) {
      throw {
        success: false,
        message: 'Request cancelled',
        code: 'REQUEST_CANCELLED'
      };
    }
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (endpoint, config = {}) => apiCall('GET', endpoint, null, config),
  post: (endpoint, data = {}, config = {}) => apiCall('POST', endpoint, data, config),
  put: (endpoint, data = {}, config = {}) => apiCall('PUT', endpoint, data, config),
  patch: (endpoint, data = {}, config = {}) => apiCall('PATCH', endpoint, data, config),
  delete: (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config),
  
  setHeader: (key, value) => {
    apiClient.defaults.headers.common[key] = value;
  },
  
  removeHeader: (key) => {
    delete apiClient.defaults.headers.common[key];
  },
  
  // Helper to get current baseURL
  getBaseURL: () => apiClient.defaults.baseURL,
  
  // Helper to test connection
  testConnection: () => apiCall('GET', '/health'),
};

export default api;