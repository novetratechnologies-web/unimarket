// src/api/config.js
import axios from 'axios';
import { addDeviceHeaders } from '../utils/headers';

const API_VERSION = '2.1.0'; // Increment this when you make changes!
console.log(`🚀 API Client v${API_VERSION} initialized`);

// ============================================
// 🔥 ENVIRONMENT DETECTION
// ============================================
const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
const VITE_ENV = import.meta.env.VITE_ENV;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const isDevelopment = VITE_ENV === 'development' || import.meta.env.DEV === true;
const isProduction = import.meta.env.PROD === true;

// Detect if we're on a live domain
const isLiveDomain = typeof window !== 'undefined' && 
                     window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

console.log('🌍 Domain check:', {
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  isLiveDomain,
  isDevelopment,
  isProduction
});

// ============================================
// ✅ BASE URL CONFIGURATION
// ============================================
let baseURL;

if (isDevelopment && !isLiveDomain) {
  baseURL = '/api';
  console.log('🏠 Using development proxy:', baseURL);
} else {
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

export const getCSRFToken = () => {
  if (csrfToken) return csrfToken;
  
  if (typeof document === 'undefined') return null;
  
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

export const setCSRFToken = (token) => {
  if (token && typeof document !== 'undefined') {
    csrfToken = token;
    document.cookie = `csrf_token=${token}; Path=/; SameSite=Strict${isProduction ? '; Secure' : ''}`;
  }
};

// ============================================
// 🔐 Token Management
// ============================================
import { AUTH_KEYS } from '../constants/auth';

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  
  if (isProduction || isLiveDomain) {
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
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  
  if (isProduction || isLiveDomain) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refreshToken') {
        return value;
      }
    }
  }
  
  const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.refresh;
    } catch {
      return null;
    }
  }
  return null;
};

// ============================================
// 🔄 Token Refresh Queue
// ============================================
export let isRefreshing = false;
export let failedQueue = [];

export const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setRefreshing = (value) => {
  isRefreshing = value;
};

// ============================================
// 🆔 Client ID Generation
// ============================================
export const generateClientId = () => {
  if (typeof window === 'undefined') return 'server';
  
  let clientId = localStorage.getItem('client_id');
  if (!clientId) {
    clientId = crypto.randomUUID ? crypto.randomUUID() : 
               Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('client_id', clientId);
  }
  return clientId;
};

// ============================================
// 🌐 Axios Instance Creation
// ============================================
export const createApiClient = () => {
  const client = axios.create({
    baseURL: baseURL,
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': API_VERSION,
      'X-Client-Platform': 'web'
    },
    withCredentials: true,
  });

  console.log('✅ API Client created with baseURL:', client.defaults.baseURL);

  // Connection test (only in non-production)
  if (!isProduction && typeof window !== 'undefined') {
    client.get('/health')
      .then(response => console.log('✅ API health check passed'))
      .catch(err => console.warn('⚠️ API health check failed:', err.message));
  }

  return client;
};

// ============================================
// 🛠️ Utility Functions
// ============================================
export const configUtils = {
  isDevMode,
  isDevelopment,
  isProduction,
  isLiveDomain,
  getBaseURL: () => baseURL,
  getApiVersion: () => API_VERSION
};