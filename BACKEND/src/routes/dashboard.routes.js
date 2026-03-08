// routes/admin/dashboard.routes.js
import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { cache } from '../middleware/cache.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

import {
  getDashboardStats,
  getRevenueAnalytics,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getVendorAnalytics,
  getOrderAnalytics,
  getPerformanceMetrics,
  getRealTimeMetrics,
  getReports,
  exportReport,
  getRecentOrders,
  getActivityStats,
  getUserStats,
  getDashboardUsers,
  getDashboardCategories,
  getRecentActivities
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Specific rate limiter for dashboard (stricter)
const dashboardLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Increased from 30 to 60 requests per minute
  message: 'Too many dashboard requests'
});

// All dashboard routes require authentication
router.use(protect);
router.use(authorize('admin', 'super_admin'));
router.use(dashboardLimiter);

// ============================================
// MAIN DASHBOARD STATS
// ============================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get main dashboard statistics
 * @access  Private (Admin)
 */
router.get('/',
  permit('view_analytics', 'dashboard.view'),
  cache(300), // 5 minutes cache
  getDashboardStats
);

// ============================================
// PRODUCT CATEGORIES
// ============================================

// ============================================
// CATEGORIES
// ============================================

/**
 * @route   GET /api/admin/dashboard/categories
 * @desc    Get product categories for dashboard
 * @access  Private (Admin)
 * @query   {number} limit - number of categories (default: 10)
 * @query   {string} sortBy - sort field (productCount, totalRevenue, name)
 * @query   {string} sortOrder - asc/desc (default: desc)
 */
router.get('/categories',
  permit('products.view'),
  cache(1800),
  getDashboardCategories 
);

// ============================================
// REVENUE ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/revenue
 * @desc    Get revenue analytics with optional grouping
 * @access  Private (Admin)
 * @query   {string} interval - hourly/daily/weekly/monthly/yearly
 * @query   {string} groupBy - overall/category/vendor/paymentMethod
 * @query   {string} startDate - start date
 * @query   {string} endDate - end date
 */
router.get('/revenue',
  permit('view_analytics', 'reports.generate'),
  cache(600), // 10 minutes cache
  getRevenueAnalytics
);

/**
 * @route   GET /api/admin/dashboard/revenue/by-category
 * @desc    Get revenue breakdown by category
 * @access  Private (Admin)
 */
router.get('/revenue/by-category',
  permit('view_analytics'),
  cache(1200),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, groupBy: 'category' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/by-vendor
 * @desc    Get revenue breakdown by vendor
 * @access  Private (Admin)
 */
router.get('/revenue/by-vendor',
  permit('view_analytics', 'vendors.view'),
  cache(1200),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, groupBy: 'vendor' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/by-method
 * @desc    Get revenue breakdown by payment method
 * @access  Private (Admin)
 */
router.get('/revenue/by-method',
  permit('view_analytics'),
  cache(1200),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, groupBy: 'paymentMethod' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/daily
 * @desc    Get daily revenue breakdown
 * @access  Private (Admin)
 */
router.get('/revenue/daily',
  permit('view_analytics'),
  cache(600),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, interval: 'daily' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/weekly
 * @desc    Get weekly revenue breakdown
 * @access  Private (Admin)
 */
router.get('/revenue/weekly',
  permit('view_analytics'),
  cache(900),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, interval: 'weekly' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/monthly
 * @desc    Get monthly revenue breakdown
 * @access  Private (Admin)
 */
router.get('/revenue/monthly',
  permit('view_analytics'),
  cache(1200),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, interval: 'monthly' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/yearly
 * @desc    Get yearly revenue breakdown
 * @access  Private (Admin)
 */
router.get('/revenue/yearly',
  permit('view_analytics'),
  cache(3600),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, interval: 'yearly' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/revenue/hourly
 * @desc    Get hourly revenue breakdown
 * @access  Private (Admin)
 */
router.get('/revenue/hourly',
  permit('view_analytics'),
  cache(300),
  (req, res) => getRevenueAnalytics({ ...req, query: { ...req.query, interval: 'hourly' } }, res)
);

// ============================================
// SALES ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/sales
 * @desc    Get sales analytics
 * @access  Private (Admin)
 * @query   {string} type - overview/category/product/vendor/hourly/weekday
 * @query   {number} limit - number of results
 * @query   {string} startDate - start date
 * @query   {string} endDate - end date
 */
router.get('/sales',
  permit('view_analytics'),
  cache(600),
  getSalesAnalytics
);

/**
 * @route   GET /api/admin/dashboard/sales/overview
 * @desc    Get sales overview
 * @access  Private (Admin)
 */
router.get('/sales/overview',
  permit('view_analytics'),
  cache(600),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/sales/by-category
 * @desc    Get sales by category
 * @access  Private (Admin)
 */
router.get('/sales/by-category',
  permit('view_analytics'),
  cache(1200),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'category' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/sales/by-product
 * @desc    Get top selling products
 * @access  Private (Admin)
 */
router.get('/sales/by-product',
  permit('view_analytics', 'products.view'),
  cache(600),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'product' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/sales/by-vendor
 * @desc    Get sales by vendor
 * @access  Private (Admin)
 */
router.get('/sales/by-vendor',
  permit('view_analytics', 'vendors.view'),
  cache(1200),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'vendor' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/sales/hourly
 * @desc    Get hourly sales distribution
 * @access  Private (Admin)
 */
router.get('/sales/hourly',
  permit('view_analytics'),
  cache(600),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'hourly' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/sales/weekday
 * @desc    Get sales by day of week
 * @access  Private (Admin)
 */
router.get('/sales/weekday',
  permit('view_analytics'),
  cache(1200),
  (req, res) => getSalesAnalytics({ ...req, query: { ...req.query, type: 'weekday' } }, res)
);

// ============================================
// USER ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/users
 * @desc    Get user analytics
 * @access  Private (Admin)
 * @query   {string} type - overview/demographics/retention/acquisition
 * @query   {number} limit - number of results
 * @query   {string} startDate - start date
 * @query   {string} endDate - end date
 */
router.get('/users',
  permit('view_analytics', 'users.view'),
  cache(600),
  getUserAnalytics
);

/**
 * @route   GET /api/admin/dashboard/users/overview
 * @desc    Get user overview statistics
 * @access  Private (Admin)
 */
router.get('/users/overview',
  permit('view_analytics', 'users.view'),
  cache(600),
  (req, res) => getUserAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/users/growth
 * @desc    Get user growth over time
 * @access  Private (Admin)
 */
router.get('/users/growth',
  permit('view_analytics', 'users.view'),
  cache(1200),
  (req, res) => getUserAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/users/retention
 * @desc    Get user retention metrics
 * @access  Private (Admin)
 */
router.get('/users/retention',
  permit('view_analytics', 'users.view'),
  cache(3600),
  (req, res) => getUserAnalytics({ ...req, query: { ...req.query, type: 'retention' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/users/demographics
 * @desc    Get user demographics
 * @access  Private (Admin)
 */
router.get('/users/demographics',
  permit('view_analytics', 'users.view'),
  cache(3600),
  (req, res) => getUserAnalytics({ ...req, query: { ...req.query, type: 'demographics' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/users/acquisition
 * @desc    Get user acquisition sources
 * @access  Private (Admin)
 */
router.get('/users/acquisition',
  permit('view_analytics', 'users.view'),
  cache(3600),
  (req, res) => getUserAnalytics({ ...req, query: { ...req.query, type: 'acquisition' } }, res)
);

// ============================================
// PRODUCT ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/products
 * @desc    Get product analytics
 * @access  Private (Admin)
 * @query   {string} type - overview/top/trending/low_stock/performance
 * @query   {number} limit - number of results
 * @query   {string} category - filter by category
 * @query   {string} vendor - filter by vendor
 */
router.get('/products',
  permit('view_analytics', 'products.view'),
  cache(600),
  getProductAnalytics
);

/**
 * @route   GET /api/admin/dashboard/products/overview
 * @desc    Get product overview statistics
 * @access  Private (Admin)
 */
router.get('/products/overview',
  permit('view_analytics', 'products.view'),
  cache(600),
  (req, res) => getProductAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/products/top
 * @desc    Get top performing products
 * @access  Private (Admin)
 */
router.get('/products/top',
  permit('view_analytics', 'products.view'),
  cache(600),
  (req, res) => getProductAnalytics({ ...req, query: { ...req.query, type: 'top' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/products/trending
 * @desc    Get trending products
 * @access  Private (Admin)
 */
router.get('/products/trending',
  permit('view_analytics', 'products.view'),
  cache(300),
  (req, res) => getProductAnalytics({ ...req, query: { ...req.query, type: 'trending' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/products/low-stock
 * @desc    Get low stock alerts
 * @access  Private (Admin)
 */
router.get('/products/low-stock',
  permit('view_analytics', 'products.view'),
  cache(300),
  (req, res) => getProductAnalytics({ ...req, query: { ...req.query, type: 'low_stock' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/products/performance
 * @desc    Get product performance metrics
 * @access  Private (Admin)
 */
router.get('/products/performance',
  permit('view_analytics', 'products.view'),
  cache(1200),
  (req, res) => getProductAnalytics({ ...req, query: { ...req.query, type: 'performance' } }, res)
);

// ============================================
// ACTIVITIES
// ============================================

/**
 * @route   GET /api/admin/dashboard/activities
 * @desc    Get recent activities
 * @access  Private (Admin)
 */
router.get('/activities',
  permit('view_analytics'),
  cache(60),
  getRecentActivities
);

/**
 * @route   GET /api/admin/dashboard/activities/stats
 * @desc    Get activity statistics
 * @access  Private (Admin)
 */
router.get('/activities/stats',
  permit('view_analytics'),
  cache(300),
  getActivityStats
);

// ============================================
// USERS (Dashboard version)
// ============================================

/**
 * @route   GET /api/admin/dashboard/users
 * @desc    Get users for dashboard
 * @access  Private (Admin)
 */
router.get('/users',
  permit('users.view'),
  cache(300),
  getDashboardUsers
);

/**
 * @route   GET /api/admin/dashboard/users/stats
 * @desc    Get user statistics for dashboard
 * @access  Private (Admin)
 */
router.get('/users/stats',
  permit('users.view'),
  cache(600),
  getUserStats
);

// ============================================
// VENDOR ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/vendors
 * @desc    Get vendor analytics
 * @access  Private (Admin)
 * @query   {string} type - overview/top/performance/payouts
 * @query   {number} limit - number of results
 * @query   {string} status - filter by status
 * @query   {string} verified - filter by verification status
 */
router.get('/vendors',
  permit('view_analytics', 'vendors.view'),
  cache(600),
  getVendorAnalytics
);

/**
 * @route   GET /api/admin/dashboard/vendors/overview
 * @desc    Get vendor overview statistics
 * @access  Private (Admin)
 */
router.get('/vendors/overview',
  permit('view_analytics', 'vendors.view'),
  cache(600),
  (req, res) => getVendorAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/vendors/top
 * @desc    Get top performing vendors
 * @access  Private (Admin)
 */
router.get('/vendors/top',
  permit('view_analytics', 'vendors.view'),
  cache(1200),
  (req, res) => getVendorAnalytics({ ...req, query: { ...req.query, type: 'top' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/vendors/pending
 * @desc    Get pending vendor approvals
 * @access  Private (Admin)
 */
router.get('/vendors/pending',
  permit('view_analytics', 'vendors.view'),
  cache(300),
  (req, res) => getVendorAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/vendors/performance
 * @desc    Get vendor performance metrics
 * @access  Private (Admin)
 */
router.get('/vendors/performance',
  permit('view_analytics', 'vendors.view'),
  cache(1200),
  (req, res) => getVendorAnalytics({ ...req, query: { ...req.query, type: 'performance' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/vendors/payouts
 * @desc    Get vendor payout analytics
 * @access  Private (Admin)
 */
router.get('/vendors/payouts',
  permit('view_analytics', 'vendors.view', 'payouts.view'),
  cache(1800),
  (req, res) => getVendorAnalytics({ ...req, query: { ...req.query, type: 'payouts' } }, res)
);

// ============================================
// ORDER ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/orders
 * @desc    Get order analytics
 * @access  Private (Admin)
 * @query   {string} type - overview/timeline/fulfillment/geographic
 * @query   {number} limit - number of results
 * @query   {string} startDate - start date
 * @query   {string} endDate - end date
 */
router.get('/orders',
  permit('view_analytics', 'orders.view'),
  cache(300),
  getOrderAnalytics
);

/**
 * @route   GET /api/admin/dashboard/orders/overview
 * @desc    Get order overview statistics
 * @access  Private (Admin)
 */
router.get('/orders/overview',
  permit('view_analytics', 'orders.view'),
  cache(300),
  (req, res) => getOrderAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/orders/status
 * @desc    Get order status distribution
 * @access  Private (Admin)
 */
router.get('/orders/status',
  permit('view_analytics', 'orders.view'),
  cache(600),
  (req, res) => getOrderAnalytics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/orders/timeline
 * @desc    Get order timeline
 * @access  Private (Admin)
 */
router.get('/orders/timeline',
  permit('view_analytics', 'orders.view'),
  cache(600),
  (req, res) => getOrderAnalytics({ ...req, query: { ...req.query, type: 'timeline' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/orders/fulfillment
 * @desc    Get order fulfillment metrics
 * @access  Private (Admin)
 */
router.get('/orders/fulfillment',
  permit('view_analytics', 'orders.view'),
  cache(600),
  (req, res) => getOrderAnalytics({ ...req, query: { ...req.query, type: 'fulfillment' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/orders/geographic
 * @desc    Get geographic order distribution
 * @access  Private (Admin)
 */
router.get('/orders/geographic',
  permit('view_analytics', 'orders.view'),
  cache(3600),
  (req, res) => getOrderAnalytics({ ...req, query: { ...req.query, type: 'geographic' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/orders/recent
 * @desc    Get recent orders list with pagination
 * @access  Private (Admin)
 * @query   {number} limit - number of orders (default: 10)
 * @query   {number} page - page number (default: 1)
 * @query   {string} status - filter by status (comma-separated)
 * @query   {string} search - search by order number or customer
 * @query   {string} sortBy - sort field (default: createdAt)
 * @query   {string} sortOrder - asc/desc (default: desc)
 * @query   {string} startDate - start date
 * @query   {string} endDate - end date
 */
router.get('/orders/recent',
  permit('orders.view'),
  cache(60),
  getRecentOrders
);

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/performance
 * @desc    Get system performance metrics
 * @access  Private (Admin)
 * @query   {string} type - overview/api/database
 */
router.get('/performance',
  permit('view_analytics'),
  cache(300),
  getPerformanceMetrics
);

/**
 * @route   GET /api/admin/dashboard/performance/overview
 * @desc    Get performance overview
 * @access  Private (Admin)
 */
router.get('/performance/overview',
  permit('view_analytics'),
  cache(300),
  (req, res) => getPerformanceMetrics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/performance/api
 * @desc    Get API performance metrics
 * @access  Private (Admin)
 */
router.get('/performance/api',
  permit('view_analytics'),
  cache(300),
  (req, res) => getPerformanceMetrics({ ...req, query: { ...req.query, type: 'api' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/performance/database
 * @desc    Get database performance metrics
 * @access  Private (Admin)
 */
router.get('/performance/database',
  permit('view_analytics'),
  cache(600),
  (req, res) => getPerformanceMetrics({ ...req, query: { ...req.query, type: 'database' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/performance/cache
 * @desc    Get cache performance metrics
 * @access  Private (Admin)
 */
router.get('/performance/cache',
  permit('view_analytics'),
  cache(600),
  (req, res) => getPerformanceMetrics({ ...req, query: { ...req.query, type: 'cache' } }, res)
);

// ============================================
// REAL-TIME METRICS
// ============================================

/**
 * @route   GET /api/admin/dashboard/realtime
 * @desc    Get real-time metrics
 * @access  Private (Admin)
 * @query   {string} type - overview/visitors/orders/traffic/events
 */
router.get('/realtime',
  permit('view_analytics'),
  cache(30),
  getRealTimeMetrics
);

/**
 * @route   GET /api/admin/dashboard/realtime/overview
 * @desc    Get real-time overview
 * @access  Private (Admin)
 */
router.get('/realtime/overview',
  permit('view_analytics'),
  cache(30),
  (req, res) => getRealTimeMetrics({ ...req, query: { ...req.query, type: 'overview' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/realtime/visitors
 * @desc    Get real-time visitor count
 * @access  Private (Admin)
 */
router.get('/realtime/visitors',
  permit('view_analytics'),
  cache(30),
  (req, res) => getRealTimeMetrics({ ...req, query: { ...req.query, type: 'visitors' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/realtime/orders
 * @desc    Get real-time orders
 * @access  Private (Admin)
 */
router.get('/realtime/orders',
  permit('view_analytics', 'orders.view'),
  cache(30),
  (req, res) => getRealTimeMetrics({ ...req, query: { ...req.query, type: 'orders' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/realtime/traffic
 * @desc    Get real-time traffic sources
 * @access  Private (Admin)
 */
router.get('/realtime/traffic',
  permit('view_analytics'),
  cache(60),
  (req, res) => getRealTimeMetrics({ ...req, query: { ...req.query, type: 'traffic' } }, res)
);

/**
 * @route   GET /api/admin/dashboard/realtime/events
 * @desc    Get real-time events
 * @access  Private (Admin)
 */
router.get('/realtime/events',
  permit('view_analytics'),
  cache(30),
  (req, res) => getRealTimeMetrics({ ...req, query: { ...req.query, type: 'events' } }, res)
);

// ============================================
// REPORTS
// ============================================

/**
 * @route   GET /api/admin/dashboard/reports
 * @desc    Get list of available reports
 * @access  Private (Admin)
 */
router.get('/reports',
  permit('reports.generate'),
  cache(3600),
  getReports
);

/**
 * @route   POST /api/admin/dashboard/reports/export
 * @desc    Export report data
 * @access  Private (Admin)
 * @body    {string} reportType - sales/users/inventory/vendors/orders/products
 * @body    {string} format - csv/pdf/excel (default: csv)
 * @body    {object} dateRange - startDate and endDate
 * @body    {object} filters - additional filters
 */
router.post('/reports/export',
  permit('reports.generate', 'reports.export'),
  exportReport
);

/**
 * @route   GET /api/admin/dashboard/reports/sales
 * @desc    Generate sales report
 * @access  Private (Admin)
 */
router.get('/reports/sales',
  permit('reports.generate'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'sales',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/users
 * @desc    Generate users report
 * @access  Private (Admin)
 */
router.get('/reports/users',
  permit('reports.generate', 'users.view'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'users',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/inventory
 * @desc    Generate inventory report
 * @access  Private (Admin)
 */
router.get('/reports/inventory',
  permit('reports.generate', 'products.view'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'inventory',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/vendors
 * @desc    Generate vendors report
 * @access  Private (Admin)
 */
router.get('/reports/vendors',
  permit('reports.generate', 'vendors.view'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'vendors',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/orders
 * @desc    Generate orders report
 * @access  Private (Admin)
 */
router.get('/reports/orders',
  permit('reports.generate', 'orders.view'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'orders',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/products
 * @desc    Generate products report
 * @access  Private (Admin)
 */
router.get('/reports/products',
  permit('reports.generate', 'products.view'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'products',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/tax
 * @desc    Generate tax report
 * @access  Private (Admin)
 */
router.get('/reports/tax',
  permit('reports.generate'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'tax',
      format: req.query.format || 'csv'
    } 
  }, res)
);

/**
 * @route   GET /api/admin/dashboard/reports/commission
 * @desc    Generate commission report
 * @access  Private (Admin)
 */
router.get('/reports/commission',
  permit('reports.generate'),
  (req, res) => exportReport({ 
    ...req, 
    body: { 
      ...req.query, 
      reportType: 'commission',
      format: req.query.format || 'csv'
    } 
  }, res)
);

export default router;