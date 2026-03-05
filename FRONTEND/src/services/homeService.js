// src/services/homeService.js
import { api } from '../api';

export const homeService = {
  // Fetch homepage data
  getHomeData: async () => {
    try {
      const response = await api.get('/home');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Fetch categories for homepage
  getHomeCategories: async () => {
    try {
      const response = await api.get('/home/categories');
      return {
        success: true,
        categories: response.data.categories || []
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        categories: [],
        error: error.message
      };
    }
  },

  // Fetch featured listings
  getFeaturedListings: async (limit = 6) => {
    try {
      const response = await api.get(`/home/listings/featured?limit=${limit}`);
      return {
        success: true,
        listings: response.data.listings || [],
        stats: response.data.stats || {}
      };
    } catch (error) {
      console.error('Error fetching listings:', error);
      return {
        success: false,
        listings: [],
        stats: {},
        error: error.message
      };
    }
  },

  // Fetch university spotlight data
  getUniversitySpotlight: async () => {
    try {
      const response = await api.get('/home/universities/spotlight');
      return {
        success: true,
        universities: response.data.universities || []
      };
    } catch (error) {
      console.error('Error fetching universities:', error);
      return {
        success: false,
        universities: [],
        error: error.message
      };
    }
  },

  // Fetch testimonials
  getTestimonials: async () => {
    try {
      const response = await api.get('/home/testimonials');
      return {
        success: true,
        testimonials: response.data.testimonials || []
      };
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return {
        success: false,
        testimonials: [],
        error: error.message
      };
    }
  },

  // Quick search
  quickSearch: async (query) => {
    try {
      const response = await api.get(`/home/search/quick?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        results: response.data.results || []
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  },

  // Get homepage stats
  getHomeStats: async () => {
    try {
      const response = await api.get('/home/stats');
      return {
        success: true,
        stats: response.data.stats || {}
      };
    } catch (error) {
      return {
        success: false,
        stats: {},
        error: error.message
      };
    }
  }
};