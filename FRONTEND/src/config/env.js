// src/config/env.js

// Simple Vite environment configuration
const config = {
  // Environment
  env: import.meta.env.VITE_ENV || 'prodduction',
  isDevelopment: (import.meta.env.VITE_ENV || 'development') === 'development',
  isProduction: (import.meta.env.VITE_ENV || 'development') === 'production',
  
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' || 'https://unimarket-vtx5.onrender.com/api',
    wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000' || 'https://unimarket-vtx5.onrender.com',
    timeout: 30000,
    maxRetries: 3,
  },
  
  // Application
  app: {
    name: import.meta.env.VITE_APP_NAME || 'UniMarket',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5173 || https://unimarket-vtx5.onrender.com',
  },
  
  // Authentication
  auth: {
    tokenKey: import.meta.env.VITE_TOKEN_KEY || 'authTokens',
    userKey: import.meta.env.VITE_USER_KEY || 'user',
    tokenRefreshThreshold: 300000, // 5 minutes
  },
  
  // Debug
  debug: {
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'debug',
    logRequests: import.meta.env.VITE_LOG_REQUESTS === 'true',
    logResponses: import.meta.env.VITE_LOG_RESPONSES === 'true',
  },
};

// Log in development
if (config.isDevelopment) {
  console.log('🎯 UniMarket Config:', {
    environment: config.env,
    apiURL: config.api.baseURL,
    clientURL: config.app.baseURL,
    tokenKey: config.auth.tokenKey,
  });
}

export default config;