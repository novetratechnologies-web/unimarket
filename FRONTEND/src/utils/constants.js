// src/utils/constants.js
export const APP_CONSTANTS = {
  APP_NAME: 'UniMarket',
  APP_DESCRIPTION: 'Campus Marketplace for University Students',
  APP_URL: 'https://unimarket.com',
  
  // API Endpoints
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // Colors
  PRIMARY_COLOR: '#0d9488',
  SECONDARY_COLOR: '#0891b2',
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

export const HOME_SECTIONS = {
  HERO: 'hero',
  CATEGORIES: 'categories',
  LISTINGS: 'listings',
  HOW_IT_WORKS: 'how_it_works',
  UNIVERSITIES: 'universities',
  TESTIMONIALS: 'testimonials',
  CTA: 'cta'
};

export const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  EXPIRED: 'expired'
};

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};