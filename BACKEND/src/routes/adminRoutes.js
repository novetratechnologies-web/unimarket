// routes/admin.routes.js - ADMIN ROUTES (without dashboard)
import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { auditMiddleware } from '../middleware/audit.js';
import { cache } from '../middleware/cache.js';
import { upload } from '../utils/upload.js';

// Admin Controllers
import {
  // Auth
  adminLogin,
  adminLogout,
  refreshAccessToken,
  getCurrentAdmin,
  changePassword,
  setupTwoFactorAuth,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  
  // Admin Management
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  bulkUpdateAdmins,
  
  // Vendor Management (Summary)
  getVendorsSummary,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  
  // Audit Logs
  getAuditLogs
} from '../controllers/admin.controller.js';

// Vendor Controllers
import {
  // Auth
  vendorLogin,
  vendorRegister,
  verifyVendorEmail,
  vendorLogout,
  
  // Profile
  getVendorProfile,
  updateVendorProfile,
  addStoreAddress,
  updateSocialMedia,
  updateBankDetails,
  
  // Products
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  
  // Orders
  getVendorOrders,
  getVendorOrder,
  updateOrderStatus,
  processRefund,
  
  // Payouts
  getPayoutHistory,
  getEarningsSummary,
  
  // Dashboard
  getVendorDashboard,
  
  // Documents
  uploadDocuments,
  getVerificationStatus
} from '../controllers/vendor.controller.js';

// Validation Schemas
import {
  // Admin validation
  adminLoginSchema,
  adminCreateSchema,
  adminUpdateSchema,
  passwordChangeSchema,
  twoFactorSchema,
  
  // Vendor validation
  vendorLoginSchema,
  vendorRegisterSchema,
  vendorProfileSchema,
  productCreateSchema,
  productUpdateSchema,
  orderStatusSchema,
  refundSchema,
  bankDetailsSchema,
  addressSchema,
  
  // Common validation
  paginationSchema,
  idParamSchema,
  bulkActionSchema
} from '../validations/schemas.js';

const router = express.Router();

// ============================================
// RATE LIMITERS
// ============================================

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100
});

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || '1.0.0'
  });
});

// ============================================
// ADMIN ROUTES
// ============================================

const adminRouter = express.Router();

// ============================================
// PUBLIC ADMIN ROUTES (NO AUTHENTICATION REQUIRED)
// ============================================

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin Login
 * @access  Public
 */
adminRouter.post(
  '/auth/login',
  authLimiter,
  validate(adminLoginSchema),
  adminLogin
);

/**
 * @route   POST /api/admin/auth/refresh
 * @desc    Refresh Access Token
 * @access  Public
 */
adminRouter.post(
  '/auth/refresh',
  refreshAccessToken
);

// ============================================
// PROTECTED ADMIN ROUTES (AUTHENTICATION REQUIRED)
// ============================================

// Apply protect middleware to all routes after this point
adminRouter.use(protect);

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Admin Logout
 * @access  Private (Admin)
 */
adminRouter.post(
  '/auth/logout',
  authorize('admin', 'super_admin'),
  adminLogout
);

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get Current Admin
 * @access  Private (Admin)
 */
adminRouter.get(
  '/auth/me',
  authorize('admin', 'super_admin'),
  cache(300),
  getCurrentAdmin
);

/**
 * @route   POST /api/admin/auth/change-password
 * @desc    Change Password
 * @access  Private (Admin)
 */
adminRouter.post(
  '/auth/change-password',
  authorize('admin', 'super_admin'),
  validate(passwordChangeSchema),
  changePassword
);

/**
 * @route   POST /api/admin/auth/2fa/setup
 * @desc    Setup 2FA
 * @access  Private (Admin)
 */
adminRouter.post(
  '/auth/2fa/setup',
  authorize('admin', 'super_admin'),
  setupTwoFactorAuth
);

/**
 * @route   POST /api/admin/auth/2fa/enable
 * @desc    Enable 2FA
 * @access  Private (Admin)
 */
adminRouter.post(
  '/auth/2fa/enable',
  authorize('admin', 'super_admin'),
  validate(twoFactorSchema),
  enableTwoFactorAuth
);

/**
 * @route   POST /api/admin/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private (Admin)
 */
adminRouter.post(
  '/auth/2fa/disable',
  authorize('admin', 'super_admin'),
  validate(passwordChangeSchema),
  disableTwoFactorAuth
);

// ============================================
// ADMIN MANAGEMENT ROUTES
// ============================================

/**
 * @route   POST /api/admin/manage
 * @desc    Create New Admin
 * @access  Private (Super Admin only)
 */
adminRouter.post(
  '/manage',
  authorize('super_admin'),
  validate(adminCreateSchema),
  auditMiddleware('create', 'admin'),
  createAdmin
);

/**
 * @route   GET /api/admin/manage
 * @desc    Get All Admins
 * @access  Private (Super Admin only)
 */
adminRouter.get(
  '/manage',
  authorize('super_admin'),
  validate(paginationSchema, 'query'),
  cache(600),
  getAllAdmins
);

/**
 * @route   GET /api/admin/manage/:id
 * @desc    Get Admin by ID
 * @access  Private (Super Admin only)
 */
adminRouter.get(
  '/manage/:id',
  authorize('super_admin'),
  validate(idParamSchema, 'params'),
  cache(300),
  getAdminById
);

/**
 * @route   PUT /api/admin/manage/:id
 * @desc    Update Admin
 * @access  Private (Super Admin only)
 */
adminRouter.put(
  '/manage/:id',
  authorize('super_admin'),
  validate(idParamSchema, 'params'),
  validate(adminUpdateSchema),
  auditMiddleware('update', 'admin'),
  updateAdmin
);

/**
 * @route   DELETE /api/admin/manage/:id
 * @desc    Delete/Deactivate Admin
 * @access  Private (Super Admin only)
 */
adminRouter.delete(
  '/manage/:id',
  authorize('super_admin'),
  validate(idParamSchema, 'params'),
  auditMiddleware('delete', 'admin'),
  deleteAdmin
);

/**
 * @route   POST /api/admin/manage/bulk
 * @desc    Bulk Update Admins
 * @access  Private (Super Admin only)
 */
adminRouter.post(
  '/manage/bulk',
  authorize('super_admin'),
  validate(bulkActionSchema),
  auditMiddleware('bulk_update', 'admin'),
  bulkUpdateAdmins
);

// ============================================
// ADMIN VENDOR MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/admin/vendors
 * @desc    Get Vendors Summary
 * @access  Private (Admin)
 */
adminRouter.get(
  '/vendors',
  authorize('admin', 'super_admin'),
  permit('vendors.view'),
  validate(paginationSchema, 'query'),
  cache(300),
  getVendorsSummary
);

// ============================================
// ADMIN SYSTEM SETTINGS ROUTES
// ============================================

/**
 * @route   GET /api/admin/settings
 * @desc    Get System Settings
 * @access  Private (Super Admin only)
 */
adminRouter.get(
  '/settings',
  authorize('super_admin'),
  permit('settings.view'),
  cache(600),
  getSystemSettings
);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update System Settings
 * @access  Private (Super Admin only)
 */
adminRouter.put(
  '/settings',
  authorize('super_admin'),
  permit('settings.edit'),
  auditMiddleware('update', 'settings'),
  updateSystemSettings
);

// ============================================
// ADMIN AUDIT LOGS ROUTES
// ============================================

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get Audit Logs
 * @access  Private (Super Admin only)
 */
adminRouter.get(
  '/audit-logs',
  authorize('super_admin'),
  permit('audit.trail'),
  validate(paginationSchema, 'query'),
  cache(120),
  getAuditLogs
);

// Mount admin routes
router.use('/', apiLimiter, adminRouter);

// ============================================
// VENDOR ROUTES
// ============================================

const vendorRouter = express.Router();

// ============================================
// PUBLIC VENDOR ROUTES (NO AUTHENTICATION REQUIRED)
// ============================================

/**
 * @route   POST /api/vendor/auth/login
 * @desc    Vendor Login
 * @access  Public
 */
vendorRouter.post(
  '/auth/login',
  authLimiter,
  validate(vendorLoginSchema),
  vendorLogin
);

/**
 * @route   POST /api/vendor/auth/register
 * @desc    Vendor Registration
 * @access  Public
 */
vendorRouter.post(
  '/auth/register',
  authLimiter,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  validate(vendorRegisterSchema),
  vendorRegister
);

/**
 * @route   GET /api/vendor/auth/verify-email/:token
 * @desc    Verify Vendor Email
 * @access  Public
 */
vendorRouter.get(
  '/auth/verify-email/:token',
  verifyVendorEmail
);

// ============================================
// PROTECTED VENDOR ROUTES (AUTHENTICATION REQUIRED)
// ============================================

// Apply protect middleware to all routes after this point
vendorRouter.use(protect);

/**
 * @route   POST /api/vendor/auth/logout
 * @desc    Vendor Logout
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/auth/logout',
  authorize('vendor'),
  vendorLogout
);

// ============================================
// VENDOR PROFILE ROUTES
// ============================================

/**
 * @route   GET /api/vendor/profile
 * @desc    Get Vendor Profile
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/profile',
  authorize('vendor'),
  cache(300),
  getVendorProfile
);

/**
 * @route   PUT /api/vendor/profile
 * @desc    Update Vendor Profile
 * @access  Private (Vendor)
 */
vendorRouter.put(
  '/profile',
  authorize('vendor'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  validate(vendorProfileSchema),
  auditMiddleware('update', 'vendor'),
  updateVendorProfile
);

/**
 * @route   POST /api/vendor/profile/address
 * @desc    Add Store Address
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/profile/address',
  authorize('vendor'),
  validate(addressSchema),
  auditMiddleware('create', 'address'),
  addStoreAddress
);

/**
 * @route   PUT /api/vendor/profile/social
 * @desc    Update Social Media Links
 * @access  Private (Vendor)
 */
vendorRouter.put(
  '/profile/social',
  authorize('vendor'),
  updateSocialMedia
);

/**
 * @route   PUT /api/vendor/profile/bank
 * @desc    Update Bank Details
 * @access  Private (Vendor)
 */
vendorRouter.put(
  '/profile/bank',
  authorize('vendor'),
  validate(bankDetailsSchema),
  auditMiddleware('update', 'bank_details'),
  updateBankDetails
);

// ============================================
// VENDOR PRODUCT ROUTES
// ============================================

/**
 * @route   POST /api/vendor/products
 * @desc    Create Product
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/products',
  authorize('vendor'),
  upload.array('images', 10),
  validate(productCreateSchema),
  auditMiddleware('create', 'product'),
  createProduct
);

/**
 * @route   GET /api/vendor/products
 * @desc    Get Vendor Products
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/products',
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(120),
  getVendorProducts
);

/**
 * @route   PUT /api/vendor/products/:id
 * @desc    Update Product
 * @access  Private (Vendor)
 */
vendorRouter.put(
  '/products/:id',
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  upload.array('newImages', 5),
  validate(productUpdateSchema),
  auditMiddleware('update', 'product'),
  updateProduct
);

/**
 * @route   DELETE /api/vendor/products/:id
 * @desc    Delete Product
 * @access  Private (Vendor)
 */
vendorRouter.delete(
  '/products/:id',
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  auditMiddleware('delete', 'product'),
  deleteProduct
);

/**
 * @route   POST /api/vendor/products/bulk
 * @desc    Bulk Update Products
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/products/bulk',
  authorize('vendor'),
  validate(bulkActionSchema),
  auditMiddleware('bulk_update', 'product'),
  bulkUpdateProducts
);

// ============================================
// VENDOR ORDER ROUTES
// ============================================

/**
 * @route   GET /api/vendor/orders
 * @desc    Get Vendor Orders
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/orders',
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(60),
  getVendorOrders
);

/**
 * @route   GET /api/vendor/orders/:id
 * @desc    Get Single Order
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/orders/:id',
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  cache(120),
  getVendorOrder
);

/**
 * @route   PUT /api/vendor/orders/:id/status
 * @desc    Update Order Status
 * @access  Private (Vendor)
 */
vendorRouter.put(
  '/orders/:id/status',
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  validate(orderStatusSchema),
  auditMiddleware('update', 'order'),
  updateOrderStatus
);

/**
 * @route   POST /api/vendor/orders/:id/refund
 * @desc    Process Refund
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/orders/:id/refund',
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  validate(refundSchema),
  auditMiddleware('refund', 'order'),
  processRefund
);

// ============================================
// VENDOR PAYOUT ROUTES
// ============================================

/**
 * @route   GET /api/vendor/payouts
 * @desc    Get Payout History
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/payouts',
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(300),
  getPayoutHistory
);

/**
 * @route   GET /api/vendor/earnings
 * @desc    Get Earnings Summary
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/earnings',
  authorize('vendor'),
  cache(300),
  getEarningsSummary
);

// ============================================
// VENDOR DASHBOARD ROUTES
// ============================================

/**
 * @route   GET /api/vendor/dashboard
 * @desc    Get Vendor Dashboard Stats
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/dashboard',
  authorize('vendor'),
  cache(120),
  getVendorDashboard
);

// ============================================
// VENDOR DOCUMENT ROUTES
// ============================================

/**
 * @route   POST /api/vendor/documents
 * @desc    Upload Verification Documents
 * @access  Private (Vendor)
 */
vendorRouter.post(
  '/documents',
  authorize('vendor'),
  upload.array('documents', 5),
  auditMiddleware('create', 'document'),
  uploadDocuments
);

/**
 * @route   GET /api/vendor/verification-status
 * @desc    Get Verification Status
 * @access  Private (Vendor)
 */
vendorRouter.get(
  '/verification-status',
  authorize('vendor'),
  cache(600),
  getVerificationStatus
);

// Mount vendor routes
router.use('/vendor', apiLimiter, vendorRouter);

// ============================================
// COMMON/OPEN ROUTES
// ============================================

const openRouter = express.Router();

import Category from '../models/Category.cjs';
import Product from '../models/Product.js';

/**
 * @route   GET /api/categories
 * @desc    Get Public Categories
 * @access  Public
 */
openRouter.get(
  '/categories',
  cache(3600),
  async (req, res) => {
    try {
      const categories = await Category.find({ isActive: true })
        .select('name slug description image')
        .sort('sortOrder');
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }
);

/**
 * @route   GET /api/products/featured
 * @desc    Get Featured Products
 * @access  Public
 */
openRouter.get(
  '/products/featured',
  cache(1800),
  async (req, res) => {
    try {
      const products = await Product.find({ 
        isFeatured: true, 
        status: 'active',
        isDeleted: false 
      })
        .limit(10)
        .select('name slug price images averageRating totalSales vendor')
        .populate('vendor', 'vendorProfile.storeName vendorProfile.storeSlug');
      
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch featured products' });
    }
  }
);

// Mount open routes
router.use('/public', openRouter);

// ============================================
// API DOCUMENTATION
// ============================================

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin & Vendor API',
    version: process.env.API_VERSION || '1.0.0',
    documentation: `${process.env.API_DOCS_URL || '/api-docs'}`,
    endpoints: {
      admin: {
        base: '/api/admin',
        auth: ['POST /auth/login', 'POST /auth/logout', 'POST /auth/refresh', 'GET /auth/me'],
        management: ['GET /manage', 'POST /manage', 'PUT /manage/:id', 'DELETE /manage/:id'],
        vendors: ['GET /vendors'],
        settings: ['GET /settings', 'PUT /settings'],
        audit: ['GET /audit-logs']
      },
      vendor: {
        base: '/api/vendor',
        auth: ['POST /auth/login', 'POST /auth/register', 'POST /auth/logout', 'GET /auth/verify-email/:token'],
        profile: ['GET /profile', 'PUT /profile', 'POST /profile/address', 'PUT /profile/bank'],
        products: ['GET /products', 'POST /products', 'PUT /products/:id', 'DELETE /products/:id', 'POST /products/bulk'],
        orders: ['GET /orders', 'GET /orders/:id', 'PUT /orders/:id/status', 'POST /orders/:id/refund'],
        payouts: ['GET /payouts', 'GET /earnings'],
        dashboard: ['GET /dashboard'],
        documents: ['POST /documents', 'GET /verification-status']
      },
      public: {
        base: '/api/public',
        endpoints: ['GET /categories', 'GET /products/featured']
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 404 HANDLER
// ============================================

router.use('/*path', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND'
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

router.use((err, req, res, next) => {
  console.error('❌ Route Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'UNAUTHORIZED'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
      error: 'FORBIDDEN'
    });
  }
  
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'UPLOAD_ERROR'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_ERROR'
  });
});

export default router; 
export { vendorRouter };