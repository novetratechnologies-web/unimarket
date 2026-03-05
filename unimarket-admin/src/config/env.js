// ============================================
// config/env.js
// ============================================

// Environment variables for Vite - Server running on port 5000
export const env = {
  // API Configuration - Server on port 5000
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws',
  
  // App Configuration
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Admin Dashboard',
  
  // Feature Flags
  ENABLE_REALTIME: import.meta.env.VITE_ENABLE_REALTIME === 'true' || true,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || true,
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true' || true,
  
  // Auth Configuration
  AUTH_TOKEN_KEY: import.meta.env.VITE_AUTH_TOKEN_KEY || 'accessToken',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken',
  
  // Feature Flags
  FEATURES: {
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === 'true' || true,
    exportData: import.meta.env.VITE_FEATURE_EXPORT === 'true' || true,
    advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true' || false,
  },
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '10'),
  MAX_PAGE_SIZE: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100'),
  
  // Cache durations (in milliseconds)
  CACHE_DURATIONS: {
    STATS: parseInt(import.meta.env.VITE_CACHE_STATS || '300000'), // 5 minutes
    PRODUCTS: parseInt(import.meta.env.VITE_CACHE_PRODUCTS || '600000'), // 10 minutes
    ORDERS: parseInt(import.meta.env.VITE_CACHE_ORDERS || '300000'), // 5 minutes
  },
  
  // Debug mode
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || true, // Enable for development
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Helper to check if we're in development
export const isDev = () => env.isDevelopment;

// Helper to check if we're in production
export const isProd = () => env.isProduction;

// Helper to log only in development
export const devLog = (...args) => {
  if (env.DEBUG || env.isDevelopment) {
    console.log('[DEV]', ...args);
  }
};

// Helper to get API URL with proper formatting
export const getApiUrl = (path = '') => {
  const base = env.API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
};

// Helper to get WebSocket URL
export const getWsUrl = (path = '') => {
  const base = env.WS_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
};

// Helper to check server connectivity
export const checkServerConnection = async () => {
  try {
    const response = await fetch(`${env.API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Server connection failed:', error);
    return false;
  }
};

export default env;