// admin/src/api/dashboard.js
import { apiCall } from './apiClient';

const dashboardAPI = {
  // ============================================
  // MAIN DASHBOARD
  // ============================================
  
  /**
   * Get main dashboard statistics
   * @param {Object} params - Query parameters (period, startDate, endDate)
   */
  getStats: (params) => apiCall('GET', '/admin/dashboard', null, { params }),

  // ============================================
  // REVENUE ANALYTICS
  // ============================================
  
  /**
   * Get revenue analytics
   * @param {Object} params - Query parameters (interval, groupBy, startDate, endDate)
   */
  getRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue', null, { params }),
  
  /**
   * Get revenue breakdown by category
   * @param {Object} params - Query parameters
   */
  getRevenueByCategory: (params) => apiCall('GET', '/admin/dashboard/revenue/by-category', null, { params }),
  
  /**
   * Get revenue breakdown by vendor
   * @param {Object} params - Query parameters
   */
  getRevenueByVendor: (params) => apiCall('GET', '/admin/dashboard/revenue/by-vendor', null, { params }),
  
  /**
   * Get revenue breakdown by payment method
   * @param {Object} params - Query parameters
   */
  getRevenueByMethod: (params) => apiCall('GET', '/admin/dashboard/revenue/by-method', null, { params }),
  
  /**
   * Get hourly revenue breakdown
   * @param {Object} params - Query parameters
   */
  getHourlyRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue/hourly', null, { params }),
  
  /**
   * Get daily revenue breakdown
   * @param {Object} params - Query parameters
   */
  getDailyRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue/daily', null, { params }),
  
  /**
   * Get weekly revenue breakdown
   * @param {Object} params - Query parameters
   */
  getWeeklyRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue/weekly', null, { params }),
  
  /**
   * Get monthly revenue breakdown
   * @param {Object} params - Query parameters
   */
  getMonthlyRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue/monthly', null, { params }),
  
  /**
   * Get yearly revenue breakdown
   * @param {Object} params - Query parameters
   */
  getYearlyRevenue: (params) => apiCall('GET', '/admin/dashboard/revenue/yearly', null, { params }),

  // ============================================
  // SALES ANALYTICS
  // ============================================
  
  /**
   * Get sales analytics
   * @param {Object} params - Query parameters (type, limit, startDate, endDate)
   */
  getSales: (params) => apiCall('GET', '/admin/dashboard/sales', null, { params }),
  
  /**
   * Get sales overview
   * @param {Object} params - Query parameters
   */
  getSalesOverview: (params) => apiCall('GET', '/admin/dashboard/sales/overview', null, { params }),
  
  /**
   * Get sales by category
   * @param {Object} params - Query parameters
   */
  getSalesByCategory: (params) => apiCall('GET', '/admin/dashboard/sales/by-category', null, { params }),
  
  /**
   * Get sales by product (top selling products)
   * @param {Object} params - Query parameters
   */
  getSalesByProduct: (params) => apiCall('GET', '/admin/dashboard/sales/by-product', null, { params }),
  
  /**
   * Get sales by vendor
   * @param {Object} params - Query parameters
   */
  getSalesByVendor: (params) => apiCall('GET', '/admin/dashboard/sales/by-vendor', null, { params }),
  
  /**
   * Get hourly sales distribution
   * @param {Object} params - Query parameters
   */
  getSalesHourly: (params) => apiCall('GET', '/admin/dashboard/sales/hourly', null, { params }),
  
  /**
   * Get sales by day of week
   * @param {Object} params - Query parameters
   */
  getSalesByWeekday: (params) => apiCall('GET', '/admin/dashboard/sales/weekday', null, { params }),

  // ============================================
  // USER ANALYTICS
  // ============================================
  
  /**
   * Get user analytics
   * @param {Object} params - Query parameters (type, limit, startDate, endDate)
   */
  getUsers: (params) => apiCall('GET', '/admin/dashboard/users', null, { params }),
  
  /**
   * Get user overview statistics
   * @param {Object} params - Query parameters
   */
  getUsersOverview: (params) => apiCall('GET', '/admin/dashboard/users/overview', null, { params }),
  
  /**
   * Get user growth over time
   * @param {Object} params - Query parameters
   */
  getUserGrowth: (params) => apiCall('GET', '/admin/dashboard/users/growth', null, { params }),
  
  /**
   * Get user retention metrics
   * @param {Object} params - Query parameters
   */
  getUserRetention: (params) => apiCall('GET', '/admin/dashboard/users/retention', null, { params }),
  
  /**
   * Get user demographics
   * @param {Object} params - Query parameters
   */
  getUserDemographics: (params) => apiCall('GET', '/admin/dashboard/users/demographics', null, { params }),
  
  /**
   * Get user acquisition sources
   * @param {Object} params - Query parameters
   */
  getUserAcquisition: (params) => apiCall('GET', '/admin/dashboard/users/acquisition', null, { params }),

  // ============================================
  // PRODUCT ANALYTICS
  // ============================================
  
  /**
   * Get product analytics
   * @param {Object} params - Query parameters (type, limit, category, vendor)
   */
  getProducts: (params) => apiCall('GET', '/admin/dashboard/products', null, { params }),
  
  /**
   * Get product overview statistics
   * @param {Object} params - Query parameters
   */
  getProductsOverview: (params) => apiCall('GET', '/admin/dashboard/products/overview', null, { params }),
  
  /**
   * Get top performing products
   * @param {Object} params - Query parameters
   */
  getTopProducts: (params) => apiCall('GET', '/admin/dashboard/products/top', null, { params }),
  
  /**
   * Get trending products
   * @param {Object} params - Query parameters
   */
  getTrendingProducts: (params) => apiCall('GET', '/admin/dashboard/products/trending', null, { params }),
  
  /**
   * Get low stock alerts
   * @param {Object} params - Query parameters
   */
  getLowStock: (params) => apiCall('GET', '/admin/dashboard/products/low-stock', null, { params }),
  
  /**
   * Get product performance metrics
   * @param {Object} params - Query parameters
   */
  getProductPerformance: (params) => apiCall('GET', '/admin/dashboard/products/performance', null, { params }),

  // ============================================
  // VENDOR ANALYTICS
  // ============================================
  
  /**
   * Get vendor analytics
   * @param {Object} params - Query parameters (type, limit, status, verified)
   */
  getVendors: (params) => apiCall('GET', '/admin/dashboard/vendors', null, { params }),
  
  /**
   * Get vendor overview statistics
   * @param {Object} params - Query parameters
   */
  getVendorsOverview: (params) => apiCall('GET', '/admin/dashboard/vendors/overview', null, { params }),
  
  /**
   * Get top performing vendors
   * @param {Object} params - Query parameters
   */
  getTopVendors: (params) => apiCall('GET', '/admin/dashboard/vendors/top', null, { params }),
  
  /**
   * Get pending vendor approvals
   * @param {Object} params - Query parameters
   */
  getPendingVendors: (params) => apiCall('GET', '/admin/dashboard/vendors/pending', null, { params }),
  
  /**
   * Get vendor performance metrics
   * @param {Object} params - Query parameters
   */
  getVendorPerformance: (params) => apiCall('GET', '/admin/dashboard/vendors/performance', null, { params }),
  
  /**
   * Get vendor payout analytics
   * @param {Object} params - Query parameters
   */
  getVendorPayouts: (params) => apiCall('GET', '/admin/dashboard/vendors/payouts', null, { params }),

  // ============================================
  // ORDER ANALYTICS
  // ============================================
  
  /**
   * Get order analytics
   * @param {Object} params - Query parameters (type, limit, startDate, endDate)
   */
  getOrders: (params) => apiCall('GET', '/admin/dashboard/orders', null, { params }),
  
  /**
   * Get order overview statistics
   * @param {Object} params - Query parameters
   */
  getOrdersOverview: (params) => apiCall('GET', '/admin/dashboard/orders/overview', null, { params }),
  
  /**
   * Get order status distribution
   * @param {Object} params - Query parameters
   */
  getOrderStatus: (params) => apiCall('GET', '/admin/dashboard/orders/status', null, { params }),
  
  /**
   * Get order timeline
   * @param {Object} params - Query parameters
   */
  getOrderTimeline: (params) => apiCall('GET', '/admin/dashboard/orders/timeline', null, { params }),
  
  /**
   * Get order fulfillment metrics
   * @param {Object} params - Query parameters
   */
  getFulfillment: (params) => apiCall('GET', '/admin/dashboard/orders/fulfillment', null, { params }),
  
  /**
   * Get geographic order distribution
   * @param {Object} params - Query parameters
   */
  getGeographicOrders: (params) => apiCall('GET', '/admin/dashboard/orders/geographic', null, { params }),
  
  /**
   * Get recent orders list with pagination
   * @param {Object} params - Query parameters (limit, page, status, search, sortBy, sortOrder, startDate, endDate)
   */
  getRecentOrders: (params) => apiCall('GET', '/admin/dashboard/orders/recent', null, { params }),

  // ============================================
  // ACTIVITIES
  // ============================================
  
  /**
   * Get recent activities
   * @param {Object} params - Query parameters (limit)
   */
  getActivities: (params) => apiCall('GET', '/admin/dashboard/activities', null, { params }),
  
  /**
   * Get activity statistics
   * @param {Object} params - Query parameters
   */
  getActivityStats: (params) => apiCall('GET', '/admin/dashboard/activities/stats', null, { params }),

  // ============================================
  // DASHBOARD USERS
  // ============================================
  
  /**
   * Get users for dashboard
   * @param {Object} params - Query parameters (page, limit, sortBy, sortOrder)
   */
  getDashboardUsers: (params) => apiCall('GET', '/admin/dashboard/users', null, { params }),
  
  /**
   * Get user statistics for dashboard
   * @param {Object} params - Query parameters (timeRange)
   */
  getUserStats: (params) => apiCall('GET', '/admin/dashboard/users/stats', null, { params }),

  // ============================================
  // PERFORMANCE METRICS
  // ============================================
  
  /**
   * Get system performance metrics
   * @param {Object} params - Query parameters (type)
   */
  getPerformance: (params) => apiCall('GET', '/admin/dashboard/performance', null, { params }),
  
  /**
   * Get performance overview
   * @param {Object} params - Query parameters
   */
  getPerformanceOverview: (params) => apiCall('GET', '/admin/dashboard/performance/overview', null, { params }),
  
  /**
   * Get API performance metrics
   * @param {Object} params - Query parameters
   */
  getApiPerformance: (params) => apiCall('GET', '/admin/dashboard/performance/api', null, { params }),
  
  /**
   * Get database performance metrics
   * @param {Object} params - Query parameters
   */
  getDatabasePerformance: (params) => apiCall('GET', '/admin/dashboard/performance/database', null, { params }),
  
  /**
   * Get cache performance metrics
   * @param {Object} params - Query parameters
   */
  getCachePerformance: (params) => apiCall('GET', '/admin/dashboard/performance/cache', null, { params }),

  // ============================================
  // REAL-TIME METRICS
  // ============================================
  
  /**
   * Get real-time metrics
   * @param {Object} params - Query parameters (type)
   */
  getRealtime: (params) => apiCall('GET', '/admin/dashboard/realtime', null, { params }),
  
  /**
   * Get real-time overview
   * @param {Object} params - Query parameters
   */
  getRealtimeOverview: (params) => apiCall('GET', '/admin/dashboard/realtime/overview', null, { params }),
  
  /**
   * Get real-time visitor count
   * @param {Object} params - Query parameters
   */
  getRealtimeVisitors: (params) => apiCall('GET', '/admin/dashboard/realtime/visitors', null, { params }),
  
  /**
   * Get real-time orders
   * @param {Object} params - Query parameters
   */
  getRealtimeOrders: (params) => apiCall('GET', '/admin/dashboard/realtime/orders', null, { params }),
  
  /**
   * Get real-time traffic sources
   * @param {Object} params - Query parameters
   */
  getRealtimeTraffic: (params) => apiCall('GET', '/admin/dashboard/realtime/traffic', null, { params }),
  
  /**
   * Get real-time events
   * @param {Object} params - Query parameters
   */
  getRealtimeEvents: (params) => apiCall('GET', '/admin/dashboard/realtime/events', null, { params }),

  // ============================================
  // REPORTS
  // ============================================
  
  /**
   * Get list of available reports
   * @param {Object} params - Query parameters
   */
  getReports: (params) => apiCall('GET', '/admin/dashboard/reports', null, { params }),


  // ============================================
// CATEGORIES
// ============================================

/**
 * Get product categories for dashboard
 * @param {Object} params - Query parameters
 */
getCategories: (params) => apiCall('GET', '/admin/dashboard/categories', null, { params }),
  
  /**
   * Export report data
   * @param {Object} data - Report configuration (reportType, format, dateRange, filters)
   */
  exportReport: (data) => apiCall('POST', '/admin/dashboard/reports/export', data),
  
  /**
   * Generate sales report
   * @param {Object} params - Query parameters
   */
  getSalesReport: (params) => apiCall('GET', '/admin/dashboard/reports/sales', null, { params }),
  
  /**
   * Generate users report
   * @param {Object} params - Query parameters
   */
  getUsersReport: (params) => apiCall('GET', '/admin/dashboard/reports/users', null, { params }),
  
  /**
   * Generate inventory report
   * @param {Object} params - Query parameters
   */
  getInventoryReport: (params) => apiCall('GET', '/admin/dashboard/reports/inventory', null, { params }),
  
  /**
   * Generate vendors report
   * @param {Object} params - Query parameters
   */
  getVendorsReport: (params) => apiCall('GET', '/admin/dashboard/reports/vendors', null, { params }),
  
  /**
   * Generate orders report
   * @param {Object} params - Query parameters
   */
  getOrdersReport: (params) => apiCall('GET', '/admin/dashboard/reports/orders', null, { params }),
  
  /**
   * Generate products report
   * @param {Object} params - Query parameters
   */
  getProductsReport: (params) => apiCall('GET', '/admin/dashboard/reports/products', null, { params }),
  
  /**
   * Generate tax report
   * @param {Object} params - Query parameters
   */
  getTaxReport: (params) => apiCall('GET', '/admin/dashboard/reports/tax', null, { params }),
  
  /**
   * Generate commission report
   * @param {Object} params - Query parameters
   */
  getCommissionReport: (params) => apiCall('GET', '/admin/dashboard/reports/commission', null, { params }),
};

export default dashboardAPI;