// admin/src/api/apiClient.js - AXIOS CONFIGURATION - FIXED VERSION
import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================
const isDevelopment = import.meta.env.VITE_ENV === 'development' || !import.meta.env.PROD;
// Use full URL in development for CORS, relative path in production
const API_BASE = isDevelopment ? 'http://localhost:5000/api' : (import.meta.env.VITE_API_URL || '/api');

// Token keys - PREFIX with 'admin_' to avoid conflicts with user app
export const TOKEN_KEYS = {
  ACCESS: 'admin_access_token',
  REFRESH: 'admin_refresh_token',
  USER: 'admin_user_data'
};

// ============================================
// TOKEN MANAGER
// ============================================
export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEYS.ACCESS),
  getRefreshToken: () => localStorage.getItem(TOKEN_KEYS.REFRESH),
  
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },
  
  getUser: () => {
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  
  setUser: (user) => {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },
  
  clearUser: () => {
    localStorage.removeItem(TOKEN_KEYS.USER);
  }
};

// ============================================
// AXIOS INSTANCE
// ============================================
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ALWAYS true for cookies
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Parse and clean params to remove undefined values
    if (config.params) {
      // Convert limit and page to numbers
      if (config.params.limit !== undefined) {
        config.params.limit = parseInt(config.params.limit) || 20;
      }
      if (config.params.page !== undefined) {
        config.params.page = parseInt(config.params.page) || 1;
      }
      
      // Remove undefined values
      Object.keys(config.params).forEach(key => {
        if (config.params[key] === undefined || config.params[key] === null || config.params[key] === '') {
          delete config.params[key];
        }
      });
    }
    
    // Add request ID for debugging
    config.headers['X-Request-ID'] = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Log request in development
    if (isDevelopment) {
      console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        headers: {
          authorization: token ? 'Bearer [PRESENT]' : 'none',
          contentType: config.headers['Content-Type']
        }
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE TRANSFORMER
// ============================================
const transformResponseData = (data) => {
  // If data already has the expected structure with pagination
  if (data && typeof data === 'object') {
    // Case 1: Standard API response with data and pagination
    if (data.data !== undefined && data.pagination !== undefined) {
      return {
        data: data.data,
        pagination: data.pagination,
        success: data.success !== undefined ? data.success : true,
        message: data.message || ''
      };
    }
    
    // Case 2: Response with data but no pagination
    if (data.data !== undefined && Array.isArray(data.data)) {
      return {
        data: data.data,
        pagination: data.pagination || {
          page: 1,
          limit: data.data.length,
          total: data.data.length,
          pages: 1
        },
        success: data.success !== undefined ? data.success : true,
        message: data.message || ''
      };
    }
    
    // Case 3: Response is an array (direct data)
    if (Array.isArray(data)) {
      return {
        data: data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          pages: 1
        },
        success: true,
        message: ''
      };
    }
    
    // Case 4: Response has activities property (for activity API)
    if (data.activities && Array.isArray(data.activities)) {
      return {
        data: data.activities,
        pagination: data.pagination || {
          page: 1,
          limit: data.activities.length,
          total: data.activities.length,
          pages: 1
        },
        success: data.success !== undefined ? data.success : true,
        message: data.message || ''
      };
    }
    
    // Case 5: Response has results property
    if (data.results && Array.isArray(data.results)) {
      return {
        data: data.results,
        pagination: data.pagination || {
          page: 1,
          limit: data.results.length,
          total: data.results.length,
          pages: 1
        },
        success: data.success !== undefined ? data.success : true,
        message: data.message || ''
      };
    }
  }
  
  // Return as-is if no transformation needed
  return data;
};

// ============================================
// RESPONSE INTERCEPTOR - FIXED
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (isDevelopment) {
      console.log(`📡 API Response: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
      
      // Log pagination info if available
      if (response.data && response.data.pagination) {
        console.log(`📊 Pagination: Page ${response.data.pagination.page} of ${response.data.pagination.pages}, Total: ${response.data.pagination.total}`);
      }
    }
    
    // Transform the response data to a consistent format
    const transformedData = transformResponseData(response.data);
    
    // Return transformed data
    return transformedData;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error in development
    if (isDevelopment) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        params: error.config?.params
      });
    }
    
    // Don't retry 404s
    if (error.response?.status === 404) {
      return Promise.reject({
        success: false,
        message: 'API endpoint not found',
        code: 'NOT_FOUND',
        data: null
      });
    }
    
    // Handle 401 - Token refresh
// In the response interceptor, right before the refresh attempt
if (error.response?.status === 401 && !originalRequest._retry && 
    !originalRequest.url.includes('/auth/refresh')) {
  
  console.log('🔄 Token expired, attempting refresh...');
  
  // Log what tokens we have
  const currentAccessToken = tokenManager.getAccessToken();
  const currentRefreshToken = tokenManager.getRefreshToken();
  console.log('📍 Current access token present:', !!currentAccessToken);
  console.log('📍 Current refresh token present:', !!currentRefreshToken);
  console.log('📍 Refresh token (first 20 chars):', currentRefreshToken?.substring(0, 20) + '...');
  
  originalRequest._retry = true;
  
  try {
    // Log the refresh request
    console.log('📤 Sending refresh request to:', `${API_BASE}/admin/auth/refresh`);
    
    const refreshResponse = await axios.post(
      `${API_BASE}/admin/auth/refresh`,
      { refreshToken: currentRefreshToken }, // Send the token in body
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('🔄 Refresh response:', refreshResponse.data);
    // ... rest of code
  } catch (refreshError) {
    console.error('❌ Refresh error details:', {
      status: refreshError.response?.status,
      data: refreshError.response?.data,
      message: refreshError.message
    });
    // ... error handling
  }
}
    // For all other errors, reject with formatted error
    const errorResponse = {
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      data: error.response?.data || null,
      status: error.response?.status
    };
    
    return Promise.reject(errorResponse);
  }
);

// ============================================
// API CALL FUNCTION - FIXED
// ============================================
export const apiCall = async (method, endpoint, data = null, config = {}) => {
  try {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Ensure params are cleaned
    if (config.params) {
      // Parse numeric params
      if (config.params.limit !== undefined) {
        config.params.limit = parseInt(config.params.limit) || 20;
      }
      if (config.params.page !== undefined) {
        config.params.page = parseInt(config.params.page) || 1;
      }
      
      // Remove undefined or empty values
      Object.keys(config.params).forEach(key => {
        if (config.params[key] === undefined || config.params[key] === null || config.params[key] === '') {
          delete config.params[key];
        }
      });
    }
    
    const response = await apiClient.request({
      method,
      url,
      data,
      ...config
    });
    
    // ✅ Return the full response (already transformed by interceptor)
    return response;
  } catch (error) {
    throw error;
  }
};



// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a clean params object with only defined values
 * @param {Object} params - Raw params object
 * @returns {Object} - Clean params object
 */
export const cleanParams = (params) => {
  const cleaned = {};
  
  if (!params) return cleaned;
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    
    // Skip undefined, null, or empty strings
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Parse numeric strings
    if (key === 'page' || key === 'limit') {
      cleaned[key] = parseInt(value) || (key === 'page' ? 1 : 20);
    } else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

/**
 * Check if a response has pagination data
 * @param {Object} response - API response
 * @returns {boolean} - True if response has pagination
 */
export const hasPagination = (response) => {
  return response && response.pagination && typeof response.pagination === 'object';
};

/**
 * Extract data from response (handles both paginated and non-paginated responses)
 * @param {Object} response - API response
 * @returns {Array} - Extracted data array
 */
export const extractData = (response) => {
  if (!response) return [];
  
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  if (Array.isArray(response)) {
    return response;
  }
  
  return [];
};

export default apiClient;