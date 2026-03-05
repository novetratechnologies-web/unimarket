// src/constants/auth.js
export const AUTH_KEYS = {
  TOKENS: 'auth_tokens',
  USER_DATA: 'user_data',
  TOKEN_EXPIRY: 'token_expiry',
  CSRF_TOKEN: 'csrf_token',
  OAUTH_STATE: 'oauth_state'
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  GOOGLE_AUTH: '/auth/google',
  COMPLETE_PROFILE: '/auth/profile/complete-google',
  INVALIDATE_TOKEN: '/auth/invalidate-token'
};

export const TOKEN_CONFIG = {
  ACCESS_EXPIRY: 15 * 60, // 15 minutes in seconds (for cookies)
  REFRESH_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds (for cookies)
  REFRESH_THRESHOLD: 5 * 60 * 1000 // Refresh 5 minutes before expiry in milliseconds
};