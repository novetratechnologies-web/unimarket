import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { auditLog } from '../middleware/audit.js';
import { cache, clearCache } from '../middleware/cache.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  // CRUD Operations
  createCommission,
  getCommissions,
  getCommissionById,
  getCommissionByCode,
  updateCommission,
  deleteCommission,
  restoreCommission,
  
  // Approval Workflow
  approveCommission,
  rejectCommission,
  
  // Calculation & Application
  calculateCommission,
  applyCommission,
  
  // Vendor Operations
  getMyCommissions,
  getVendorCommissionSummary,
  
  // Bulk Operations
  bulkUpdateCommissions,
  exportCommissions,
  
  // Analytics
  getCommissionAnalytics
} from '../controllers/commission.controller.js';

import {
  // Commission Validation Schemas
  createCommissionSchema,
  updateCommissionSchema,
  approveCommissionSchema,
  rejectCommissionSchema,
  calculateCommissionSchema,
  applyCommissionSchema,
  bulkCommissionSchema,
  commissionExportSchema,
  commissionAnalyticsSchema,
  
  // Common Validation Schemas
  idParamSchema,
  codeParamSchema,
  paginationSchema,
  vendorIdParamSchema
} from '../validations/commissionSchemas.js';

const router = express.Router();

// ============================================
// PUBLIC/OPEN COMMISSION ROUTES
// ============================================

/**
 * @route   POST /api/commissions/calculate
 * @desc    Calculate commission for an order
 * @access  Public (Rate Limited)
 */
router.post(
  '/calculate',
  rateLimiter({ windowMs: 60 * 1000, max: 60 }),
  validate(calculateCommissionSchema),
  calculateCommission
);

// ============================================
// PROTECTED COMMISSION ROUTES
// ============================================

/**
 * @route   GET /api/commissions
 * @desc    Get all commissions
 * @access  Private (Admin/Vendor - filtered)
 */
router.get(
  '/',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('commissions.view'),
  validate(paginationSchema, 'query'),
  cache(300), // Cache for 5 minutes
  getCommissions
);

/**
 * @route   GET /api/commissions/analytics
 * @desc    Get commission analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics',
  protect,
  authorize('admin', 'super_admin'),
  permit('analytics.view', 'commissions.analytics'),
  validate(commissionAnalyticsSchema, 'query'),
  cache(600), // Cache for 10 minutes
  getCommissionAnalytics
);

/**
 * @route   GET /api/commissions/my-commissions
 * @desc    Get current vendor's commissions
 * @access  Private (Vendor only)
 */
router.get(
  '/my-commissions',
  protect,
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(300), // Cache for 5 minutes
  getMyCommissions
);

/**
 * @route   GET /api/commissions/vendor/:vendorId/summary
 * @desc    Get vendor commission summary
 * @access  Private (Admin/Vendor - authorized)
 */
router.get(
  '/vendor/:vendorId/summary',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('commissions.view'),
  validate(vendorIdParamSchema, 'params'),
  cache(300), // Cache for 5 minutes
  getVendorCommissionSummary
);

/**
 * @route   GET /api/commissions/code/:code
 * @desc    Get commission by code
 * @access  Private (Admin only)
 */
router.get(
  '/code/:code',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.view'),
  validate(codeParamSchema, 'params'),
  cache(300), // Cache for 5 minutes
  getCommissionByCode
);

/**
 * @route   GET /api/commissions/:id
 * @desc    Get commission by ID
 * @access  Private (Admin/Vendor - authorized)
 */
router.get(
  '/:id',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('commissions.view'),
  validate(idParamSchema, 'params'),
  cache(300), // Cache for 5 minutes
  getCommissionById
);

// ============================================
// ADMIN-ONLY COMMISSION ROUTES
// ============================================

/**
 * @route   POST /api/commissions
 * @desc    Create new commission
 * @access  Private (Admin only)
 */
router.post(
  '/',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.create'),
  validate(createCommissionSchema),
  auditLog('create', 'commission'),
  clearCache('commissions:*'),
  createCommission
);

/**
 * @route   PUT /api/commissions/:id
 * @desc    Update commission
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.edit'),
  validate(idParamSchema, 'params'),
  validate(updateCommissionSchema),
  auditLog('update', 'commission'),
  clearCache('commissions:*'),
  updateCommission
);

/**
 * @route   DELETE /api/commissions/:id
 * @desc    Delete commission (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.delete'),
  validate(idParamSchema, 'params'),
  auditLog('delete', 'commission', 'warning'),
  clearCache('commissions:*'),
  deleteCommission
);

/**
 * @route   POST /api/commissions/:id/restore
 * @desc    Restore deleted commission
 * @access  Private (Admin only)
 */
router.post(
  '/:id/restore',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.edit'),
  validate(idParamSchema, 'params'),
  auditLog('update', 'commission'),
  clearCache('commissions:*'),
  restoreCommission
);

// ============================================
// COMMISSION APPROVAL ROUTES
// ============================================

/**
 * @route   POST /api/commissions/:id/approve
 * @desc    Approve commission
 * @access  Private (Admin only)
 */
router.post(
  '/:id/approve',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.approve'),
  validate(idParamSchema, 'params'),
  validate(approveCommissionSchema),
  auditLog('approve', 'commission'),
  clearCache('commissions:*'),
  approveCommission
);

/**
 * @route   POST /api/commissions/:id/reject
 * @desc    Reject commission
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reject',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.reject'),
  validate(idParamSchema, 'params'),
  validate(rejectCommissionSchema),
  auditLog('reject', 'commission', 'warning'),
  clearCache('commissions:*'),
  rejectCommission
);

// ============================================
// COMMISSION APPLICATION ROUTES
// ============================================

/**
 * @route   POST /api/commissions/apply
 * @desc    Apply commission to order
 * @access  Private (System/Admin only)
 */
router.post(
  '/apply',
  protect,
  authorize('admin', 'super_admin', 'system'),
  permit('commissions.apply'),
  validate(applyCommissionSchema),
  auditLog('update', 'commission_application'),
  clearCache('commissions:*'),
  applyCommission
);

// ============================================
// BULK OPERATIONS ROUTES
// ============================================

/**
 * @route   POST /api/commissions/bulk
 * @desc    Bulk update commissions
 * @access  Private (Admin only)
 */
router.post(
  '/bulk',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.bulk'),
  validate(bulkCommissionSchema),
  auditLog('bulk_update', 'commission'),
  clearCache('commissions:*'),
  bulkUpdateCommissions
);

/**
 * @route   GET /api/commissions/bulk/export
 * @desc    Export commissions
 * @access  Private (Admin only)
 */
router.get(
  '/bulk/export',
  protect,
  authorize('admin', 'super_admin'),
  permit('commissions.export'),
  validate(commissionExportSchema, 'query'),
  auditLog('export', 'commission'),
  exportCommissions
);

export default router;