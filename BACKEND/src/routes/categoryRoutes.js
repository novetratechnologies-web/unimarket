// routes/categoryRoutes.js
import express from 'express';
import categoryController from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../utils/upload.js';
import { apiLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { cache as cacheMiddleware } from '../middleware/cache.js';
import {
  idParamSchema,
  slugParamSchema,
  paginationSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryAttributeSchema,
  categoryTranslationSchema,
  bulkCategorySchema,
  categoryExportSchema,
  categoryAnalyticsSchema
} from '../validations/categoryValidators.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================



/**
 * @route   GET /api/categories/tree
 * @desc    Get complete category tree structure
 * @access  Public
 */
router.get(
  '/tree',
  cacheMiddleware(600),
  categoryController.getCategoryTree
);

/**
 * @route   GET /api/categories/homepage
 * @desc    Get categories to display on homepage
 * @access  Public
 */
router.get(
  '/homepage',
  cacheMiddleware(1800),
  categoryController.getHomepageCategories
);

/**
 * @route   GET /api/categories/popular
 * @desc    Get most popular categories
 * @access  Public
 */
router.get(
  '/popular',
  cacheMiddleware(3600),
  categoryController.getPopularCategories
);

/**
 * @route   GET /api/categories/breadcrumb/*
 * @desc    Get breadcrumb trail for a category
 * @access  Public
 */
/**
 * @route   GET /api/categories/breadcrumb/*slug
 * @desc    Get breadcrumb trail for a category
 * @access  Public
 */
router.get(
  '/breadcrumb/*slug',
  cacheMiddleware(300),
  categoryController.getBreadcrumb
);

/**
 * @route   GET /api/categories/slug/*slug
 * @desc    Get single category by slug
 * @access  Public
 */
router.get(
  '/slug/*slug',
  cacheMiddleware(300),
  categoryController.getCategoryBySlug
);
// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// ✅ MOVE THIS UP - All routes BELOW this point require authentication
router.use(protect);
router.use(apiLimiter);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  🔴 NOW PROTECTED - Requires authentication
 * 
 * IMPORTANT: This route must come AFTER router.use(protect)
 * If you want it to be public, move it BEFORE router.use(protect)
 */
router.get(
  '/',
  validate(paginationSchema, 'query'),
  cacheMiddleware(300),
  categoryController.getCategories
);


router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  cacheMiddleware(300),
  categoryController.getCategoryById
);

// ============================================
// CATEGORY ATTRIBUTE ROUTES
// ============================================

/**
 * @route   POST /api/categories/:id/attributes
 * @desc    Add a new attribute to category
 * @access  Private (Admin only)
 */
router.post(
  '/:id/attributes',
  authorize('admin', 'super_admin'),
  validate(idParamSchema, 'params'),
  validate(categoryAttributeSchema, 'body'),
  categoryController.addAttribute
);

/**
 * @route   PUT /api/categories/:id/attributes/:attributeId
 * @desc    Update a category attribute
 * @access  Private (Admin only)
 */
router.put(
  '/:id/attributes/:attributeId',
  authorize('admin', 'super_admin'),
  validate(idParamSchema, 'params'),
  validate(categoryAttributeSchema, 'body'),
  categoryController.updateAttribute
);

/**
 * @route   DELETE /api/categories/:id/attributes/:attributeId
 * @desc    Delete a category attribute
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/attributes/:attributeId',
  authorize('admin', 'super_admin'),
  validate(idParamSchema, 'params'),
  categoryController.deleteAttribute
);

// ============================================
// ADMIN ONLY ROUTES (Stricter Rate Limiting)
// ============================================

// Apply admin rate limiter to all admin routes
router.use(authorize('admin', 'super_admin'));
router.use(adminLimiter);

// ============================================
// CATEGORY CRUD OPERATIONS
// ============================================

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'icon', maxCount: 1 },      // For Font Awesome icon string
    { name: 'iconImage', maxCount: 1 }   // For custom icon image uploads
  ]),
  validate(createCategorySchema, 'body'),
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update an existing category
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'icon', maxCount: 1 },      // For Font Awesome icon string
    { name: 'iconImage', maxCount: 1 }   // For custom icon image uploads
  ]),
  validate(updateCategorySchema, 'body'),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category (soft delete by default)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  categoryController.deleteCategory
);

/**
 * @route   POST /api/categories/:id/restore
 * @desc    Restore a soft-deleted category
 * @access  Private (Admin only)
 */
router.post(
  '/:id/restore',
  validate(idParamSchema, 'params'),
  categoryController.restoreCategory
);

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @route   POST /api/categories/bulk
 * @desc    Bulk update categories
 * @access  Private (Admin only)
 */
router.post(
  '/bulk',
  validate(bulkCategorySchema, 'body'),
  categoryController.bulkUpdateCategories
);

/**
 * @route   GET /api/categories/export
 * @desc    Export categories in various formats
 * @access  Private (Admin only)
 */
router.get(
  '/export',
  validate(categoryExportSchema, 'query'),
  categoryController.exportCategories
);

// ============================================
// CATEGORY ANALYTICS
// ============================================

/**
 * @route   GET /api/categories/analytics
 * @desc    Get comprehensive category analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics',
  validate(categoryAnalyticsSchema, 'query'),
  cacheMiddleware(900),
  categoryController.getCategoryAnalytics
);

// ============================================
// ERROR HANDLING
// ============================================

router.use((error, req, res, next) => {
  console.error('Category route error:', error);
  
  // Handle multer errors specifically
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: `Unexpected field: ${error.field}. Allowed fields are: image, banner, icon, iconImage`,
      error: 'UNEXPECTED_FIELD'
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default router;