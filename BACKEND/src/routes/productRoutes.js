// FILE: routes/productRoutes.js
import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { auditLog, auditMiddleware } from '../middleware/audit.js';
import { cache, clearCache, conditionalCache } from '../middleware/cache.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { upload, handleUploadError } from '../utils/upload.js';
import { sanitizeMongo } from '../middleware/sanitize.js';
import { paginate } from '../middleware/paginate.js';
import { filter } from '../middleware/filter.js';
import { enrichResponse } from '../middleware/enrich.js';
import { webhook } from '../middleware/webhook.js';
import Joi from 'joi';

import {
    // AI Search & Recommendations
    searchProducts,
    getRecommendations,
    
    // CRUD Operations
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    
    // Bulk Operations
    bulkImportProducts,
    bulkExportProducts,
    
    // Inventory Management
    updateInventory,
    getInventorySummary,
    
    // Approval Workflow
    approveProduct,
    rejectProduct,
    requestProductChanges,
    
    // Analytics
    getAnalytics
} from '../controllers/productController.js';

// ✅ Import validation schemas from productSchemas.js
import {
    idParamSchema,
    slugParamSchema,
    paginationSchema,
    searchSchema,
    createProductSchema,
    updateProductSchema,
    inventoryUpdateSchema,
    productExportSchema,
    productApprovalSchema,
    productRejectionSchema,
    productChangesSchema,
    productAnalyticsSchema
} from '../validations/productSchemas.js';

// Simple inline validations for params/query that aren't in schemas file
const validation = {
    // Recommendations query validation
    recommendations: Joi.object({
        limit: Joi.number().integer().min(1).max(20).default(10),
        type: Joi.string().valid('personalized', 'similar', 'trending', 'recently-viewed', 'frequently-bought').default('personalized'),
        context: Joi.string().default('homepage')
    }),
    
    // Bulk import validation
    bulkImport: Joi.object({
        format: Joi.string().valid('csv', 'excel', 'json').default('csv'),
        updateExisting: Joi.boolean().default(false),
        skipValidation: Joi.boolean().default(false)
    }),
    
    // Delete validation
    deleteProduct: Joi.object({ 
        reason: Joi.string().max(500).optional(), 
        permanent: Joi.boolean().default(false) 
    })
};

const router = express.Router();

// ============================================
// PUBLIC ROUTES (Rate Limited)
// ============================================

/**
 * @route   GET /api/products/search
 * @desc    Advanced product search with AI
 * @access  Public
 */
router.get(
    '/search',
    rateLimiter({ windowMs: 60 * 1000, max: 30 }),
    validateQuery(searchSchema),
    sanitizeMongo('query'),
    conditionalCache(300), // 5 minutes cache
    enrichResponse(),
    searchProducts
);

/**
 * @route   GET /api/products/recommendations
 * @desc    Get personalized product recommendations
 * @access  Public/Private
 */
router.get(
    '/recommendations',
    rateLimiter({ windowMs: 60 * 1000, max: 30 }),
    validateQuery(validation.recommendations),
    conditionalCache(600), // 10 minutes cache
    getRecommendations
);

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering
 * @access  Public
 */
router.get(
    '/',
    rateLimiter({ windowMs: 60 * 1000, max: 100 }),
    validateQuery(paginationSchema),
    sanitizeMongo('query'),
    paginate(),
    filter(),
    conditionalCache(60), // 1 minute cache
    getProducts
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get(
    '/slug/:slug',
    rateLimiter({ windowMs: 60 * 1000, max: 60 }),
    validate(slugParamSchema, 'params'),
    sanitizeMongo('params'),
    conditionalCache(300), // 5 minutes cache
    getProduct
);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Apply authentication middleware to all routes below
router.use(protect);

// ============================================
// INVENTORY MANAGEMENT ROUTES - MOVED UP!
// ============================================

/**
 * @route   GET /api/products/inventory/summary
 * @desc    Get inventory summary
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/inventory/summary',
    authorize('admin', 'super_admin', 'vendor'),
    permit('inventory.view'),
    conditionalCache(300), // 5 minutes cache
    getInventorySummary
);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/low-stock',
    authorize('admin', 'super_admin', 'vendor'),
    permit('inventory.view'),
    validateQuery(paginationSchema),
    conditionalCache(300), // 5 minutes cache
    async (req, res, next) => {
        // Add low stock filter
        req.query.lowStock = true;
        next();
    },
    getProducts
);

/**
 * @route   GET /api/products/out-of-stock
 * @desc    Get out of stock products
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/out-of-stock',
    authorize('admin', 'super_admin', 'vendor'),
    permit('inventory.view'),
    validateQuery(paginationSchema),
    conditionalCache(300), // 5 minutes cache
    async (req, res, next) => {
        // Add out of stock filter
        req.query.outOfStock = true;
        next();
    },
    getProducts
);

/**
 * @route   GET /api/products/backorders
 * @desc    Get products on backorder
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/backorders',
    authorize('admin', 'super_admin', 'vendor'),
    permit('inventory.view'),
    validateQuery(paginationSchema),
    conditionalCache(300), // 5 minutes cache
    async (req, res, next) => {
        // Add backorder filter
        req.query.allowBackorder = true;
        req.query.minQuantity = 0;
        next();
    },
    getProducts
);

/**
 * @route   PUT /api/products/:id/inventory
 * @desc    Update product inventory
 * @access  Private (Admin/Vendor)
 */
router.put(
    '/:id/inventory',
    authorize('admin', 'super_admin', 'vendor'),
    permit('inventory.edit'),
    validate(idParamSchema, 'params'),
    validate(inventoryUpdateSchema), // ✅ Using imported schema
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('update', 'inventory', 'warning')(req, res, next),
    (req, res, next) => webhook('inventory.updated')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'inventory:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    updateInventory
);

// ============================================
// CRUD OPERATIONS
// ============================================

const parseFormDataJson = (req, res, next) => {
    if (req.body && req.body.data && typeof req.body.data === 'string') {
        try {
            const parsedData = JSON.parse(req.body.data);
            
            const files = req.files;
            req.body = parsedData;
            req.files = files; // Keep files attached
            
        } catch (parseError) {

            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data in FormData',
                error: 'INVALID_JSON'
            });
        }
    }
    next();
};

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin/Vendor)
 */
router.post(
    '/',
    authorize('admin', 'super_admin', 'vendor'),
    permit('products.create'),
    upload.array('images', 10),
    handleUploadError,
    (req, res, next) => {
        next();
    },
    parseFormDataJson,
    validate(createProductSchema),
    sanitizeMongo('body'),
    auditMiddleware('create', 'product'),
    (req, res, next) => webhook('product.created')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'search:*', 'recommendations:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    createProduct
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID - MOVED DOWN!
 * @access  Private (Now protected since it's after router.use(protect))
 */
router.get(
    '/:id',
    authorize('admin', 'super_admin', 'vendor'), // Added authorization
    validate(idParamSchema, 'params'),
    sanitizeMongo('params'),
    conditionalCache(300), // 5 minutes cache
    getProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin/Vendor)
 */
router.put(
    '/:id',
    authorize('admin', 'super_admin', 'vendor'),
    permit('products.edit'),
    validate(idParamSchema, 'params'),
    upload.array('newImages', 5),
    handleUploadError,
    validate(updateProductSchema),
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('update', 'product')(req, res, next),
    (req, res, next) => webhook('product.updated')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'search:*', 'recommendations:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin/Vendor)
 */
router.delete(
    '/:id',
    authorize('admin', 'super_admin', 'vendor'),
    permit('products.delete'),
    validate(idParamSchema, 'params'),
    validate(validation.deleteProduct),
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('delete', 'product', 'warning')(req, res, next),
    (req, res, next) => webhook('product.deleted')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'search:*', 'recommendations:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    deleteProduct
);

// ============================================
// BULK OPERATIONS ROUTES
// ============================================

/**
 * @route   POST /api/products/bulk/import
 * @desc    Bulk import products
 * @access  Private (Admin/Vendor)
 */
router.post(
    '/bulk/import',
    authorize('admin', 'super_admin', 'vendor'),
    permit('products.import'),
    upload.single('file'),
    handleUploadError,
    validate(validation.bulkImport),
    (req, res, next) => auditMiddleware('import', 'product')(req, res, next),
    (req, res, next) => webhook('products.imported')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'search:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    bulkImportProducts
);

/**
 * @route   GET /api/products/bulk/export
 * @desc    Bulk export products
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/bulk/export',
    authorize('admin', 'super_admin', 'vendor'),
    permit('products.export'),
    validateQuery(productExportSchema),
    (req, res, next) => auditMiddleware('export', 'product')(req, res, next),
    bulkExportProducts
);

// ============================================
// APPROVAL WORKFLOW ROUTES (Admin Only)
// ============================================

/**
 * @route   POST /api/products/:id/approve
 * @desc    Approve product
 * @access  Private (Admin)
 */
router.post(
    '/:id/approve',
    authorize('admin', 'super_admin'),
    permit('products.approve'),
    validate(idParamSchema, 'params'),
    validate(productApprovalSchema),
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('approve', 'product')(req, res, next),
    (req, res, next) => webhook('product.approved')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*', 'search:*', 'recommendations:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    approveProduct
);

/**
 * @route   POST /api/products/:id/reject
 * @desc    Reject product
 * @access  Private (Admin)
 */
router.post(
    '/:id/reject',
    authorize('admin', 'super_admin'),
    permit('products.reject'),
    validate(idParamSchema, 'params'),
    validate(productRejectionSchema),
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('reject', 'product', 'warning')(req, res, next),
    (req, res, next) => webhook('product.rejected')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    rejectProduct
);

/**
 * @route   POST /api/products/:id/request-changes
 * @desc    Request changes for product
 * @access  Private (Admin)
 */
router.post(
    '/:id/request-changes',
    authorize('admin', 'super_admin'),
    permit('products.edit'),
    validate(idParamSchema, 'params'),
    validate(productChangesSchema),
    sanitizeMongo('body'),
    (req, res, next) => auditMiddleware('request_changes', 'product')(req, res, next),
    (req, res, next) => webhook('product.changes.requested')(req, res, next),
    async (req, res, next) => {
        try {
            await clearCache('products:*');
            next();
        } catch (error) {
            console.error('Cache clear error:', error);
            next();
        }
    },
    requestProductChanges
);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * @route   GET /api/products/analytics
 * @desc    Get product analytics
 * @access  Private (Admin/Vendor)
 */
router.get(
    '/analytics',
    authorize('admin', 'super_admin', 'vendor'),
    permit('analytics.view'),
    validateQuery(productAnalyticsSchema),
    conditionalCache(1800), // 30 minutes cache
    getAnalytics
);

// ============================================
// VENDOR-SPECIFIC ROUTES
// ============================================

/**
 * @route   GET /api/products/vendor/mine
 * @desc    Get current vendor's products
 * @access  Private (Vendor)
 */
router.get(
    '/vendor/mine',
    authorize('vendor'),
    validateQuery(paginationSchema),
    conditionalCache(120), // 2 minutes cache
    (req, res, next) => {
        req.query.vendor = req.user._id;
        next();
    },
    getProducts
);

/**
 * @route   GET /api/products/vendor/pending
 * @desc    Get vendor's pending products
 * @access  Private (Vendor)
 */
router.get(
    '/vendor/pending',
    authorize('vendor'),
    validateQuery(paginationSchema),
    (req, res, next) => {
        req.query.vendor = req.user._id;
        req.query.status = 'pending';
        next();
    },
    getProducts
);

// ============================================
// ADMIN-SPECIFIC ROUTES
// ============================================

/**
 * @route   GET /api/products/admin/pending
 * @desc    Get all pending products
 * @access  Private (Admin)
 */
router.get(
    '/admin/pending',
    authorize('admin', 'super_admin'),
    permit('products.approve'),
    validateQuery(paginationSchema),
    (req, res, next) => {
        req.query.status = 'pending';
        next();
    },
    getProducts
);

/**
 * @route   GET /api/products/admin/rejected
 * @desc    Get all rejected products
 * @access  Private (Admin)
 */
router.get(
    '/admin/rejected',
    authorize('admin', 'super_admin'),
    permit('products.view'),
    validateQuery(paginationSchema),
    (req, res, next) => {
        req.query.status = 'rejected';
        next();
    },
    getProducts
);

/**
 * @route   GET /api/products/admin/featured
 * @desc    Get featured products
 * @access  Private (Admin)
 */
router.get(
    '/admin/featured',
    authorize('admin', 'super_admin'),
    permit('products.feature'),
    validateQuery(paginationSchema),
    (req, res, next) => {
        req.query.featured = true;
        next();
    },
    getProducts
);

// ============================================
// WEBHOOK HANDLER (External Services)
// ============================================

/**
 * @route   POST /api/products/webhook
 * @desc    Handle incoming webhooks
 * @access  Public (with secret)
 */
router.post(
    '/webhook',
    rateLimiter({ windowMs: 60 * 1000, max: 10 }),
    express.raw({ type: 'application/json' }),
    (req, res) => {
        // Placeholder for webhook handler
        res.status(200).json({ success: true, message: 'Webhook received' });
    }
);

// ============================================
// ERROR HANDLING & FALLBACKS
// ============================================

// Catch-all for undefined routes
router.use('/*path', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// ============================================
// EXPORT ROUTER
// ============================================

export default router;