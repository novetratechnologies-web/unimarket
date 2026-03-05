// routes/orderRoutes.js
import express from 'express';
import { protect, authorize, permit } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { auditMiddleware } from '../middleware/audit.js';
import { cache, clearCache } from '../middleware/cache.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import orderController from '../controllers/order.controller.js';

import {
  // Order Validation Schemas
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  addTrackingSchema,
  processRefundSchema,
  bulkOrderSchema,
  orderAnalyticsSchema,
  orderExportSchema,
  orderNoteSchema,
  paymentIntentSchema,
  
  // Common Validation Schemas
  idParamSchema,
  paginationSchema,
  orderNumberParamSchema,
  trackingNumberParamSchema
} from '../validations/orderSchemas.js';

const router = express.Router();




// ============================================
// SAFE HANDLER WRAPPER
// ============================================
const safeHandler = (fn) => {
  if (typeof fn !== 'function') {
    console.error(`❌ ERROR: Handler is not a function:`, fn);
    return (req, res) => {
      res.status(500).json({
        success: false,
        message: 'Handler not properly configured',
        error: 'HANDLER_ERROR'
      });
    };
  }
  return fn;
};

// ============================================
// ORDER ANALYTICS ROUTES
// ============================================

/**
 * @route   GET /api/orders/analytics
 * @desc    Get comprehensive order analytics
 * @access  Private (Admin)
 */
router.get(
  '/analytics',
  protect,
  authorize('admin', 'super_admin'),
  permit('analytics.view', 'orders.analytics'),
  validate(orderAnalyticsSchema, 'query'),
  cache(600),
  auditMiddleware('view', 'order_analytics'),
  safeHandler(orderController.getOrderAnalytics)
);

/**
 * @route   GET /api/orders/analytics/export
 * @desc    Export order analytics report
 * @access  Private (Admin)
 */
router.get(
  '/analytics/export',
  protect,
  authorize('admin', 'super_admin'),
  permit('analytics.export', 'orders.export'),
  validate(orderExportSchema, 'query'),
  auditMiddleware('export', 'order_analytics'),
  safeHandler(orderController.exportOrders)
);

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * @route   POST /api/orders/payment-intent
 * @desc    Create Stripe payment intent
 * @access  Public
 */
router.post(
  '/payment-intent',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  validate(paymentIntentSchema),
  safeHandler(orderController.createPaymentIntent)
);

/**
 * @route   POST /api/orders/webhook/stripe
 * @desc    Stripe webhook handler
 * @access  Public (Webhook)
 */
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  safeHandler(orderController.stripeWebhook)
);

// ============================================
// CUSTOMER ORDER ROUTES
// ============================================

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get current customer's orders
 * @access  Private (Customer)
 */
router.get(
  '/my-orders',
  protect,
  authorize('customer'),
  validate(paginationSchema, 'query'),
  cache(120),
  auditMiddleware('view', 'my_orders'),
  safeHandler(orderController.getMyOrders)
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order (Customer only)
 * @access  Private (Customer)
 */
router.post(
  '/:id/cancel',
  protect,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  auditMiddleware('cancel', 'order'),
  clearCache('orders:*'),
  safeHandler(orderController.cancelMyOrder)
);

// ============================================
// VENDOR ORDER ROUTES
// ============================================

/**
 * @route   GET /api/orders/vendor
 * @desc    Get vendor's orders
 * @access  Private (Vendor)
 */
router.get(
  '/vendor',
  protect,
  authorize('vendor'),
  validate(paginationSchema, 'query'),
  cache(120),
  auditMiddleware('view', 'vendor_orders'),
  safeHandler(orderController.getVendorOrders)
);

/**
 * @route   PUT /api/orders/vendor/:id/status
 * @desc    Update vendor-specific order status
 * @access  Private (Vendor)
 */
router.put(
  '/vendor/:id/status',
  protect,
  authorize('vendor'),
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  auditMiddleware('update', 'vendor_order_status'),
  clearCache('orders:*'),
  safeHandler(orderController.updateVendorOrderStatus)
);

// ============================================
// ORDER CRUD ROUTES
// ============================================

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Public (Guest) / Private (Customer)
 */
router.post(
  '/',
  rateLimiter({ windowMs: 60 * 1000, max: 20 }),
  validate(createOrderSchema),
  auditMiddleware('create', 'order'),
  clearCache('orders:*', 'products:*'),
  safeHandler(orderController.createOrder)
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters
 * @access  Private (Admin/Vendor)
 */
router.get(
  '/',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('orders.view'),
  validate(paginationSchema, 'query'),
  cache(60),
  auditMiddleware('view', 'orders'),
  safeHandler(orderController.getOrders)
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
router.get(
  '/:id',
  protect,
  authorize('admin', 'super_admin', 'vendor', 'customer'),
  permit('orders.view'),
  validate(idParamSchema, 'params'),
  cache(300),
  auditMiddleware('view', 'order'),
  safeHandler(orderController.getOrderById)
);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Public (with email verification)
 */
router.get(
  '/number/:orderNumber',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  validate(orderNumberParamSchema, 'params'),
  cache(300),
  safeHandler(orderController.getOrderByNumber)
);

// ============================================
// ORDER STATUS MANAGEMENT ROUTES
// ============================================

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin/Vendor - authorized)
 */
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('orders.edit'),
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  auditMiddleware('update', 'order_status'),
  clearCache('orders:*', 'analytics:*'),
  safeHandler(orderController.updateOrderStatus)
);

/**
 * @route   PUT /api/orders/:id/payment
 * @desc    Update payment status
 * @access  Private (Admin/System)
 */
router.put(
  '/:id/payment',
  protect,
  authorize('admin', 'super_admin'),
  permit('orders.payment'),
  validate(idParamSchema, 'params'),
  validate(updatePaymentStatusSchema),
  auditMiddleware('update', 'payment_status'),
  clearCache('orders:*', 'analytics:*'),
  safeHandler(orderController.updatePaymentStatus)
);

// ============================================
// ORDER TRACKING ROUTES
// ============================================

/**
 * @route   POST /api/orders/:id/tracking
 * @desc    Add tracking information
 * @access  Private (Vendor/Admin)
 */
router.post(
  '/:id/tracking',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('orders.tracking'),
  validate(idParamSchema, 'params'),
  validate(addTrackingSchema),
  auditMiddleware('update', 'order_tracking'),
  clearCache('orders:*'),
  safeHandler(orderController.addTracking)
);

/**
 * @route   PUT /api/orders/tracking/:trackingNumber
 * @desc    Update tracking information (webhook)
 * @access  Private (System/Webhook)
 */
router.put(
  '/tracking/:trackingNumber',
  validate(trackingNumberParamSchema, 'params'),
  safeHandler(orderController.updateTracking)
);

// ============================================
// ORDER REFUND ROUTES
// ============================================

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Process refund
 * @access  Private (Admin/Vendor - authorized)
 */
router.post(
  '/:id/refund',
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('orders.refund'),
  validate(idParamSchema, 'params'),
  validate(processRefundSchema),
  auditMiddleware('refund', 'order'),
  clearCache('orders:*', 'analytics:*'),
  safeHandler(orderController.processRefund)
);

/**
 * @route   GET /api/orders/:id/refunds
 * @desc    Get refund history
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
router.get(
  '/:id/refunds',
  protect,
  authorize('admin', 'super_admin', 'vendor', 'customer'),
  permit('orders.view'),
  validate(idParamSchema, 'params'),
  cache(120),
  auditMiddleware('view', 'refunds'),
  safeHandler(orderController.getRefunds)
);

// ============================================
// BULK OPERATIONS ROUTES
// ============================================

/**
 * @route   POST /api/orders/bulk
 * @desc    Bulk update orders
 * @access  Private (Admin only)
 */
router.post(
  '/bulk',
  protect,
  authorize('admin', 'super_admin'),
  permit('orders.bulk'),
  validate(bulkOrderSchema),
  auditMiddleware('bulk_update', 'orders'),
  clearCache('orders:*', 'analytics:*'),
  safeHandler(orderController.bulkUpdateOrders)
);

/**
 * @route   GET /api/orders/bulk/export
 * @desc    Bulk export orders
 * @access  Private (Admin only)
 */
router.get(
  '/bulk/export',
  protect,
  authorize('admin', 'super_admin'),
  permit('orders.export'),
  validate(orderExportSchema, 'query'),
  auditMiddleware('export', 'orders'),
  safeHandler(orderController.exportOrders)
);

// ============================================
// ORDER NOTES & TIMELINE ROUTES
// ============================================

/**
 * @route   POST /api/orders/:id/notes
 * @desc    Add admin note to order
 * @access  Private (Admin only)
 */
router.post(
  '/:id/notes',
  protect,
  authorize('admin', 'super_admin'),
  permit('orders.notes'),
  validate(idParamSchema, 'params'),
  validate(orderNoteSchema),
  auditMiddleware('create', 'order_note'),
  safeHandler(orderController.addAdminNote)
);

/**
 * @route   GET /api/orders/:id/timeline
 * @desc    Get order timeline
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
router.get(
  '/:id/timeline',
  protect,
  authorize('admin', 'super_admin', 'vendor', 'customer'),
  permit('orders.view'),
  validate(idParamSchema, 'params'),
  cache(60),
  auditMiddleware('view', 'order_timeline'),
  safeHandler(orderController.getOrderTimeline)
);


// Add this right after the route definition to debug
router.get(
  '/',
  (req, res, next) => {
    next();
  },
  protect,
  authorize('admin', 'super_admin', 'vendor'),
  permit('orders.view'),
  validate(paginationSchema, 'query'),
  cache(60),
  auditMiddleware('view', 'orders'),
  safeHandler(orderController.getOrders)
);

export default router;