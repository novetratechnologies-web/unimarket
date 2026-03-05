// src/api/index.js
const API_VERSION = '2.0.0'; // Increment this when you make changes!
console.log(`🚀 API Client v${API_VERSION} initialized`);

// src/api/index.js - COMPLETELY FIXED VERSION
import axios from 'axios';
import { AUTH_KEYS } from '../constants/auth';

const isDevelopment = import.meta.env.VITE_ENV === 'development';
const baseURL = isDevelopment ? '/api' : import.meta.env.VITE_API_URL;
const isProduction = process.env.NODE_ENV === 'production';

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

const apiClient = axios.create({
  baseURL: '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: isProduction,
});

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
  if (isProduction) {
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
      console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ FIXED: Response interceptor with SINGLE error path
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_LOG_RESPONSES === 'true') {
      console.log(`📥 [API] ${response.config.url}`, response.status);
    }
    
    // Check for CSRF token in response
    if (response.data?.csrfToken) {
      document.cookie = `csrf_token=${response.data.csrfToken}; Path=/; SameSite=Strict`;
    }
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ [API Error]', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
    });

    // ✅ FIX 1: Handle 404 errors immediately - NO RETRY!
    if (error.response?.status === 404) {
      return Promise.reject({
        success: false,
        message: `API endpoint not found: ${originalRequest?.url}`,
        code: 'ENDPOINT_NOT_FOUND',
        status: 404
      });
    }

    // ✅ FIX 2: Handle 401 only for token refresh (skip login/register)
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
        if (isProduction) {
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
            
            if (isProduction) {
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
    
    // ✅ FIX 3: Handle 403/419 (CSRF errors)
    if (error.response?.status === 403 || error.response?.status === 419) {
      window.dispatchEvent(new Event('auth-expired'));
      return Promise.reject({
        success: false,
        message: 'Authentication expired',
        code: 'AUTH_EXPIRED',
        status: error.response.status
      });
    }

    // ✅ FIX 4: Handle validation errors (400)
    if (error.response?.status === 400) {
      return Promise.reject(error.response.data || {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }

    // ✅ FIX 5: Handle rate limiting (429)
    if (error.response?.status === 429) {
      return Promise.reject(error.response.data || {
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMITED'
      });
    }

    // ✅ FIX 6: Handle server errors (500)
    if (error.response?.status >= 500) {
      return Promise.reject({
        success: false,
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: error.response.status
      });
    }
    
    // ✅ FIX 7: Handle network errors
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
    
    // ✅ FIX 8: Default error - return response data if available
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    
    // ✅ FIX 9: Final fallback - single rejection
    return Promise.reject({
      success: false,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    });
  }
);

// SIMPLIFIED API call function
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
    
    // Already processed by interceptor - just rethrow
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
};

export default api;