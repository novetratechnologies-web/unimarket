// src/api/index.js
import axios from 'axios';
import { createApiClient, configUtils } from './config.js';
import { 
  requestInterceptor, 
  requestErrorInterceptor,
  responseInterceptor,
  responseErrorInterceptor
} from './apiClient.js';
import { AUTH_KEYS } from '../constants/auth';

// ============================================
// 🌐 Import All API Modules (Customer Only)
// ============================================
import authAPI from './auth';           // Authentication (login/register)
import userAPI from './users.js';            // User's own account management
import productsAPI from './products';    // Product browsing
import ordersAPI from './orders';        // Order placement & tracking
import categoriesAPI from './categories'; // Category browsing
import notificationsAPI from './notifications'; // User notifications
import reviewsAPI from './reviews';       // Product reviews
import wishlistAPI from './wishlist';     // User's wishlist
import cartAPI from './cart';             // Shopping cart
import searchAPI from './search';          // Product search

// ============================================
// 🌐 Create API Client
// ============================================
const apiClient = createApiClient();

// ============================================
// 🔗 Attach Interceptors
// ============================================
apiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor(apiClient));

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
    
    throw error;
  }
};

// ============================================
// 🎯 Customer-Facing API Object
// ============================================
export const api = {
  // ============================================
  // AUTHENTICATION (Login/Register)
  // ============================================
  auth: authAPI,

  // ============================================
  // USER'S OWN ACCOUNT MANAGEMENT
  // ============================================
  user: userAPI,

  // ============================================
  // CUSTOMER FACING APIS
  // ============================================
  products: productsAPI,        // Browse products
  orders: ordersAPI,             // Place and track orders
  categories: categoriesAPI,     // Browse categories
  notifications: notificationsAPI, // User notifications
  reviews: reviewsAPI,           // Product reviews
  wishlist: wishlistAPI,         // User's wishlist
  cart: cartAPI,                 // Shopping cart
  search: searchAPI,              // Product search

  // ============================================
  // HTTP METHODS (Direct Access)
  // ============================================
  get: (endpoint, config = {}) => apiCall('GET', endpoint, null, config),
  post: (endpoint, data = {}, config = {}) => apiCall('POST', endpoint, data, config),
  put: (endpoint, data = {}, config = {}) => apiCall('PUT', endpoint, data, config),
  patch: (endpoint, data = {}, config = {}) => apiCall('PATCH', endpoint, data, config),
  delete: (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config),
  
  // ============================================
  // HEADER MANAGEMENT
  // ============================================
  setHeader: (key, value) => {
    apiClient.defaults.headers.common[key] = value;
  },
  
  removeHeader: (key) => {
    delete apiClient.defaults.headers.common[key];
  },
  
  // ============================================
  // CSRF TOKEN MANAGEMENT
  // ============================================
  getCSRFToken: () => import('./config.js').then(mod => mod.getCSRFToken()),
  
  refreshCSRFToken: async () => {
    try {
      const { getCSRFToken, setCSRFToken } = await import('./config.js');
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
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  getBaseURL: () => apiClient.defaults.baseURL,
  testConnection: () => apiCall('GET', '/health'),
  
  // ============================================
  // AUTH HELPERS
  // ============================================
  isAuthenticated: () => {
    return !!getToken();
  },
  
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_KEYS.TOKENS);
      sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
      document.cookie = 'accessToken=; Max-Age=0; Path=/';
      document.cookie = 'refreshToken=; Max-Age=0; Path=/';
      document.cookie = 'csrf_token=; Max-Age=0; Path=/';
    }
  },
  
  // ============================================
  // RAW INSTANCE ACCESS
  // ============================================
  getAxiosInstance: () => apiClient,
  
  // ============================================
  // ENVIRONMENT INFO
  // ============================================
  getEnvInfo: () => ({
    baseURL: apiClient.defaults.baseURL,
    version: configUtils.getApiVersion(),
    environment: configUtils.isProduction ? 'production' : 'development',
    isLiveDomain: configUtils.isLiveDomain,
    apiModules: [
      'auth', 'user', 'products', 'orders', 'categories', 
      'notifications', 'reviews', 'wishlist', 'cart', 'search'
    ]
  })
};

// ============================================
// 🔑 Helper function to get token (internal use)
// ============================================
function getToken() {
  if (typeof window === 'undefined') return null;
  
  if (configUtils.isProduction || configUtils.isLiveDomain) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        return value;
      }
    }
  }
  
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

export default api;