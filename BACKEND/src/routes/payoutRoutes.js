import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { auditLog } from '../middleware/audit.js';
import { cache, clearCache } from '../middleware/cache.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  // CRUD Operations
  createPayout,
  getPayouts,
  getPayoutById,
  getPayoutByNumber,
  updatePayout,
  deletePayout,
  restorePayout,
  
  // Approval Workflow
  approvePayout,
  rejectPayout,
  processPayout,
  completePayout,
  failPayout,
  
  // Vendor Operations
  getMyPayouts,
  requestPayout,
  
  // Bulk Operations
  bulkUpdatePayouts,
  exportPayouts,
  
  // Analytics
  getPayoutAnalytics,
  
  // Notes
  addPayoutNote,
  getPayoutTimeline
} from '../controllers/payout.controller.js';

import {
  // Payout Validation Schemas
  createPayoutSchema,
  updatePayoutSchema,
  approvePayoutSchema,
  rejectPayoutSchema,
  processPayoutSchema,
  completePayoutSchema,
  failPayoutSchema,
  requestPayoutSchema,
  bulkPayoutSchema,
  payoutExportSchema,
  payoutAnalyticsSchema,
  payoutNoteSchema,
  
  // Common Validation Schemas
  idParamSchema,
  paginationSchema,
  payoutNumberParamSchema
} from '../validations/payoutSchemas.js';

const router = express.Router();

// ============================================
// PAYOUT ANALYTICS ROUTES
// ============================================

/**
 * @route   GET /api/payouts/analytics
 * @desc    Get comprehensive payout analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics',
  protect,
  authorize('admin', 'super_admin'),
  permit('analytics.view', 'payouts.analytics'),
  validate(payoutAnalyticsSchema, 'query'),
  cache(600), // Cache for 10 minutes
  getPayoutAnalytics
);

/**
 * @route   GET /api/payouts/analytics/export
 * @desc    Export payout analytics report
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/export',
  protect,
  authorize('admin', 'super_admin'),
  permit('analytics.export', 'payouts.export'),
  validate(payoutExportSchema, 'query'),
  auditLog('export', 'payout_analytics'),
  exportPayouts
);

// ============================================
// VENDOR PAYOUT ROUTES
// ============================================

/**
 * @route   GET /api/payouts/my-payouts
 * @desc    Get current vendor's payouts
 * @access  Private (Vendor only)
 */
router.get(
  '/my-payouts',
  protect,
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(300), // Cache for 5 minutes
  getMyPayouts
);

/**
 * @route   POST /api/payouts/request
 * @desc    Request payout (Vendor only)
 * @access  Private (Vendor only)
 */
router.post(
  '/request',
  protect,
  authorize('vendor'),
  validate(requestPayoutSchema),
  auditLog('create', 'payout_request'),
  clearCache('payouts:*'),
  requestPayout
);

// ============================================
// PAYOUT CRUD ROUTES
// ============================================

/**
 * @route   POST /api/payouts
 * @desc    Create new payout
 * @access  Private (Admin/Vendor)
 */
router.post(
  '/',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.create'),
  validate(createPayoutSchema),
  auditLog('create', 'payout'),
  clearCache('payouts:*', 'analytics:*'),
  createPayout
);

/**
 * @route   GET /api/payouts
 * @desc    Get all payouts with filters
 * @access  Private (Admin/Vendor - filtered)
 */
router.get(
  '/',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.view'),
  validate(paginationSchema, 'query'),
  cache(120), // Cache for 2 minutes
  getPayouts
);

/**
 * @route   GET /api/payouts/:id
 * @desc    Get payout by ID
 * @access  Private (Admin/Vendor - authorized)
 */
router.get(
  '/:id',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.view'),
  validate(idParamSchema, 'params'),
  cache(300), // Cache for 5 minutes
  getPayoutById
);

/**
 * @route   GET /api/payouts/number/:payoutNumber
 * @desc    Get payout by payout number
 * @access  Private (Admin/Vendor - authorized)
 */
router.get(
  '/number/:payoutNumber',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.view'),
  validate(payoutNumberParamSchema, 'params'),
  cache(300), // Cache for 5 minutes
  getPayoutByNumber
);

/**
 * @route   PUT /api/payouts/:id
 * @desc    Update payout
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.edit'),
  validate(idParamSchema, 'params'),
  validate(updatePayoutSchema),
  auditLog('update', 'payout'),
  clearCache('payouts:*', 'analytics:*'),
  updatePayout
);

/**
 * @route   DELETE /api/payouts/:id
 * @desc    Delete payout (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.delete'),
  validate(idParamSchema, 'params'),
  auditLog('delete', 'payout', 'warning'),
  clearCache('payouts:*', 'analytics:*'),
  deletePayout
);

/**
 * @route   POST /api/payouts/:id/restore
 * @desc    Restore deleted payout
 * @access  Private (Admin only)
 */
router.post(
  '/:id/restore',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.edit'),
  validate(idParamSchema, 'params'),
  auditLog('update', 'payout'),
  clearCache('payouts:*'),
  restorePayout
);

// ============================================
// PAYOUT APPROVAL WORKFLOW ROUTES
// ============================================

/**
 * @route   POST /api/payouts/:id/approve
 * @desc    Approve payout
 * @access  Private (Admin only)
 */
router.post(
  '/:id/approve',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.approve'),
  validate(idParamSchema, 'params'),
  validate(approvePayoutSchema),
  auditLog('approve', 'payout'),
  clearCache('payouts:*', 'analytics:*'),
  approvePayout
);

/**
 * @route   POST /api/payouts/:id/reject
 * @desc    Reject payout
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reject',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.reject'),
  validate(idParamSchema, 'params'),
  validate(rejectPayoutSchema),
  auditLog('reject', 'payout', 'warning'),
  clearCache('payouts:*'),
  rejectPayout
);

/**
 * @route   POST /api/payouts/:id/process
 * @desc    Process payout
 * @access  Private (Admin only)
 */
router.post(
  '/:id/process',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.process'),
  validate(idParamSchema, 'params'),
  validate(processPayoutSchema),
  auditLog('update', 'payout_processing'),
  clearCache('payouts:*'),
  processPayout
);

/**
 * @route   POST /api/payouts/:id/complete
 * @desc    Complete payout
 * @access  Private (Admin/System)
 */
router.post(
  '/:id/complete',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.process'),
  validate(idParamSchema, 'params'),
  validate(completePayoutSchema),
  auditLog('update', 'payout_complete'),
  clearCache('payouts:*', 'analytics:*'),
  completePayout
);

/**
 * @route   POST /api/payouts/:id/fail
 * @desc    Mark payout as failed
 * @access  Private (Admin/System)
 */
router.post(
  '/:id/fail',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.process'),
  validate(idParamSchema, 'params'),
  validate(failPayoutSchema),
  auditLog('update', 'payout_failed', 'error'),
  clearCache('payouts:*'),
  failPayout
);

// ============================================
// BULK OPERATIONS ROUTES
// ============================================

/**
 * @route   POST /api/payouts/bulk
 * @desc    Bulk update payouts
 * @access  Private (Admin only)
 */
router.post(
  '/bulk',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.bulk'),
  validate(bulkPayoutSchema),
  auditLog('bulk_update', 'payout'),
  clearCache('payouts:*', 'analytics:*'),
  bulkUpdatePayouts
);

/**
 * @route   GET /api/payouts/bulk/export
 * @desc    Bulk export payouts
 * @access  Private (Admin only)
 */
router.get(
  '/bulk/export',
  protect,
  authorize('admin', 'super_admin'),
  permit('payouts.export'),
  validate(payoutExportSchema, 'query'),
  auditLog('export', 'payout'),
  exportPayouts
);

// ============================================
// PAYOUT NOTES & TIMELINE ROUTES
// ============================================

/**
 * @route   POST /api/payouts/:id/notes
 * @desc    Add note to payout
 * @access  Private (Admin/Vendor - authorized)
 */
router.post(
  '/:id/notes',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.notes'),
  validate(idParamSchema, 'params'),
  validate(payoutNoteSchema),
  auditLog('create', 'payout_note'),
  addPayoutNote
);

/**
 * @route   GET /api/payouts/:id/timeline
 * @desc    Get payout timeline
 * @access  Private (Admin/Vendor - authorized)
 */
router.get(
  '/:id/timeline',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('payouts.view'),
  validate(idParamSchema, 'params'),
  cache(120), // Cache for 2 minutes
  getPayoutTimeline
);

export default router;