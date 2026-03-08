// src/api/interceptors.js
import { 
  getToken, 
  getRefreshToken, 
  isRefreshing, 
  failedQueue, 
  processQueue, 
  setRefreshing,
  getCSRFToken,
  setCSRFToken,
  generateClientId,
  configUtils
} from './config.js';
import { AUTH_KEYS } from '../constants/auth.js';
import { addDeviceHeaders } from '../utils/headers.js';

// ============================================
// 📤 Request Interceptor
// ============================================
export const requestInterceptor = (config) => {
  // Add request timestamp for debugging
  config.metadata = { startTime: Date.now() };
  
  // Log the FULL URL being called (only in development)
  if (configUtils.isDevMode) {
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

  // Add device headers
  config = addDeviceHeaders(config);
  
  // Add client ID header
  config.headers['X-Client-ID'] = generateClientId();
  
  // Add screen size for better fingerprinting
  if (typeof window !== 'undefined') {
    config.headers['X-Screen-Size'] = `${window.screen.width}x${window.screen.height}`;
  }

  return config;
};

export const requestErrorInterceptor = (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
};

// ============================================
// 📥 Response Interceptor
// ============================================
export const responseInterceptor = (response) => {
  // Calculate request duration
  const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
  
  // Log in development
  if (configUtils.isDevMode) {
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
};

// ============================================
// 🔄 Response Error Interceptor
// ============================================
export const responseErrorInterceptor = (apiClient) => async (error) => {
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
    setRefreshing(true);
    
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', 
        { refresh: refreshTokenValue },
        { 
          headers: { 'X-Refresh-Token': 'true' },
          _retry: true
        }
      );

      console.log('🔄 Refresh response:', response);

      let newTokens = null;

      // Handle multiple response structures
      if (response?.data?.tokens?.access && response?.data?.tokens?.refresh) {
        newTokens = response.data.tokens;
      } else if (response?.data?.access && response?.data?.refresh) {
        newTokens = {
          access: response.data.access,
          refresh: response.data.refresh
        };
      } else if (response?.tokens?.access && response?.tokens?.refresh) {
        newTokens = response.tokens;
      } else if (response?.access && response?.refresh) {
        newTokens = {
          access: response.access,
          refresh: response.refresh
        };
      }

      if (!newTokens) {
        console.error('❌ Could not extract tokens from response:', response);
        throw new Error('Invalid refresh response structure');
      }

      // Store tokens
      const tokensWithMeta = {
        ...newTokens,
        storedAt: Date.now()
      };
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify(tokensWithMeta));
      }
      
      // Update the default Authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
      originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
      
      // Process queued requests
      failedQueue.forEach(prom => prom.resolve(newTokens.access));
      failedQueue.length = 0;
      
      return apiClient(originalRequest);
      
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      
      // Clear auth data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(AUTH_KEYS.TOKENS);
        sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
        document.cookie = 'accessToken=; Max-Age=0; Path=/';
        document.cookie = 'refreshToken=; Max-Age=0; Path=/';
        document.cookie = 'csrf_token=; Max-Age=0; Path=/';
      }
      
      // Notify app about auth expiry
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired', { 
          detail: { reason: 'refresh_failed' }
        }));
      }
      
      // Process queue with error
      failedQueue.forEach(prom => prom.reject(refreshError));
      failedQueue.length = 0;
      
      return Promise.reject({
        success: false,
        message: 'Your session has expired. Please login again.',
        code: 'SESSION_EXPIRED',
        status: 401
      });
    } finally {
      setRefreshing(false);
    }
  }

  // ==================== 403 Forbidden / CSRF Error ====================
  if (error.response?.status === 403 || error.response?.status === 419) {
    console.warn('🛡️ CSRF token error or forbidden access');
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:csrf-error'));
    }
    
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
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
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
};