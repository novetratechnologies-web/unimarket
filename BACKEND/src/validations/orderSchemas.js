import Joi from 'joi';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const orderNumberParamSchema = Joi.object({
  orderNumber: Joi.string().pattern(/^INV-\d{6}-\d{4}$/).required()
});

export const trackingNumberParamSchema = Joi.object({
  trackingNumber: Joi.string().required()
});

// In orderSchemas.js - Update paginationSchema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid(
    'orderDate', 'createdAt', 'updatedAt', 'total', 'status'
  ).default('orderDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow('', null),
  status: Joi.alternatives().try(
    Joi.string().valid(
      'pending', 'processing', 'confirmed', 'shipped', 'delivered',
      'cancelled', 'refunded', 'partially_refunded', 'disputed',
      'on_hold', 'failed', 'abandoned'
    ),
    Joi.array().items(Joi.string().valid(
      'pending', 'processing', 'confirmed', 'shipped', 'delivered',
      'cancelled', 'refunded', 'partially_refunded', 'disputed',
      'on_hold', 'failed', 'abandoned'
    ))
  ),
  paymentStatus: Joi.alternatives().try(
    Joi.string().valid(
      'pending', 'processing', 'authorized', 'paid', 'partially_paid',
      'failed', 'refunded', 'partially_refunded', 'disputed', 'chargeback'
    ),
    Joi.array().items(Joi.string().valid(
      'pending', 'processing', 'authorized', 'paid', 'partially_paid',
      'failed', 'refunded', 'partially_refunded', 'disputed', 'chargeback'
    ))
  ),
  fulfillmentStatus: Joi.alternatives().try(
    Joi.string().valid(
      'unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled'
    ),
    Joi.array().items(Joi.string().valid(
      'unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled'
    ))
  ),
  vendor: Joi.string().hex().length(24),
  customer: Joi.string().hex().length(24),
  minTotal: Joi.number().min(0),
  maxTotal: Joi.number().min(0).greater(Joi.ref('minTotal')),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  tags: Joi.string(),
  source: Joi.string().valid(
    'website', 'mobile_app', 'admin', 'api', 'pos', 'marketplace', 'social_media'
  )
});
// ============================================
// CREATE ORDER SCHEMA
// ============================================

export const createOrderSchema = Joi.object({
  // Customer Information
  customer: Joi.string().hex().length(24),
  guestEmail: Joi.string().email().when('customer', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.required()
  }),
  guestDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  }).when('customer', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.optional()
  }),

  // Order Items
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().hex().length(24).required(),
      variant: Joi.object({
        _id: Joi.string().hex().length(24),
        sku: Joi.string(),
        price: Joi.number().min(0),
        options: Joi.array().items(
          Joi.object({
            name: Joi.string(),
            value: Joi.string()
          })
        )
      }).optional(),
      quantity: Joi.number().integer().min(1).required(),
      discount: Joi.number().min(0).default(0),
      tax: Joi.number().min(0).default(0),
      shipping: Joi.number().min(0).default(0)
    })
  ).min(1).required(),

  // Shipping Information
  shippingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    company: Joi.string().allow('', null),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
    countryCode: Joi.string().length(2).uppercase(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    email: Joi.string().email(),
    instructions: Joi.string().max(500).allow('', null),
    isResidential: Joi.boolean().default(true)
  }).required(),

  // Billing Information
  billingAddress: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    company: Joi.string().allow('', null),
    addressLine1: Joi.string(),
    addressLine2: Joi.string().allow('', null),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
    countryCode: Joi.string().length(2).uppercase(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    email: Joi.string().email()
  }).optional(),
  billingSameAsShipping: Joi.boolean().default(true),

  // Shipping Method
  shippingMethod: Joi.string().hex().length(24).optional(),
  shippingMethodName: Joi.string().optional(),

  // Payment
  paymentMethod: Joi.string().hex().length(24).optional(),
  paymentMethodName: Joi.string().optional(),
  paymentProvider: Joi.string().valid(
    'stripe', 'paypal', 'razorpay', 'cash', 'bank_transfer', 'wallet', 'other'
  ).default('stripe'),
  paymentIntent: Joi.object({
    id: Joi.string(),
    clientSecret: Joi.string()
  }).optional(),

  // Coupons & Discounts
  coupons: Joi.array().items(
    Joi.object({
      code: Joi.string().required(),
      discountAmount: Joi.number().min(0)
    })
  ).optional(),

  giftCards: Joi.array().items(
    Joi.object({
      code: Joi.string().required(),
      amount: Joi.number().min(0)
    })
  ).optional(),

  // Order Source
  source: Joi.string().valid(
    'website', 'mobile_app', 'admin', 'api', 'pos', 'marketplace', 'social_media'
  ).default('website'),
  sourceDetails: Joi.object({
    channel: Joi.string(),
    campaign: Joi.string(),
    source: Joi.string(),
    medium: Joi.string(),
    term: Joi.string(),
    content: Joi.string(),
    referrer: Joi.string(),
    landingPage: Joi.string(),
    utmParams: Joi.object().pattern(Joi.string(), Joi.string())
  }).optional(),

  // Customer Notes
  customerNotes: Joi.string().max(2000).allow('', null),

  // Currency
  currency: Joi.string().length(3).uppercase().default('USD'),

  // Metadata
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}),

  // Tags
  tags: Joi.array().items(Joi.string().trim().lowercase()).optional()
});

// ============================================
// UPDATE ORDER STATUS SCHEMA
// ============================================


export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'processing', 'confirmed', 'shipped', 'delivered',
    'cancelled', 'refunded', 'partially_refunded', 'disputed',
    'on_hold', 'failed', 'abandoned'
  ).required(),
  note: Joi.string().max(500).allow('', null),
  cancellation: Joi.object({
    reason: Joi.string(),
    reasonCode: Joi.string().valid(
      'customer_request', 'payment_failed', 'fraud', 'out_of_stock', 'other'
    ),
    notes: Joi.string().max(500)
  }).when('status', {
    is: 'cancelled',
    then: Joi.optional(),
    otherwise: Joi.optional() // Changed from forbidden() to optional()
  })
});

// ============================================
// UPDATE PAYMENT STATUS SCHEMA
// ============================================

export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'processing', 'authorized', 'paid', 'partially_paid',
    'failed', 'refunded', 'partially_refunded', 'disputed', 'chargeback'
  ).required(),
  transactionId: Joi.string().required(),
  provider: Joi.string().valid(
    'stripe', 'paypal', 'razorpay', 'cash', 'bank_transfer', 'wallet', 'other'
  ).required(),
  amount: Joi.number().min(0).required(),
  note: Joi.string().max(500).allow('', null)
});

// ============================================
// ADD TRACKING SCHEMA
// ============================================

// ============================================
// ADD TRACKING SCHEMA
// ============================================

export const addTrackingSchema = Joi.object({
  carrier: Joi.string().required(),
  trackingNumber: Joi.string().required(),
  trackingUrl: Joi.string().uri().optional(),
  status: Joi.string().valid(
    'pending', 'info_received', 'in_transit', 'out_for_delivery',
    'delivered', 'failed_attempt', 'exception', 'returned'
  ).default('pending'),
  estimatedDelivery: Joi.date().iso().optional(),
  shippedAt: Joi.date().iso().default(() => new Date()), // FIXED: Removed second argument and properly wrapped function
  vendorId: Joi.string().hex().length(24).optional(),
  events: Joi.array().items(
    Joi.object({
      date: Joi.date().iso().required(),
      status: Joi.string().required(),
      description: Joi.string().required(),
      location: Joi.string(),
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  ).optional()
});

// ============================================
// PROCESS REFUND SCHEMA
// ============================================

export const processRefundSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  reason: Joi.string().valid(
    'customer_request', 'damaged', 'defective', 'wrong_item',
    'not_as_described', 'shipping_delay', 'other'
  ).required(),
  reasonText: Joi.string().max(500).when('reason', {
    is: 'other',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  items: Joi.array().items(
    Joi.object({
      orderItem: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().min(1).required(),
      amount: Joi.number().min(0).required()
    })
  ).optional(),
  restockingFee: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().max(500).allow('', null),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

// ============================================
// BULK ORDER OPERATION SCHEMA
// ============================================

export const bulkOrderSchema = Joi.object({
  orderIds: Joi.array().items(
    Joi.string().hex().length(24)
  ).min(1).max(100).required(),
  action: Joi.string().valid(
    'update-status',
    'update-payment-status',
    'add-tags',
    'remove-tags',
    'delete'
  ).required(),
  data: Joi.object({
    status: Joi.string().when('action', {
      is: 'update-status',
      then: Joi.required()
    }),
    paymentStatus: Joi.string().when('action', {
      is: 'update-payment-status',
      then: Joi.required()
    }),
    tags: Joi.array().items(Joi.string()).when('action', {
      is: ['add-tags', 'remove-tags'],
      then: Joi.required()
    }),
    note: Joi.string().max(500),
    reason: Joi.string().max(500).when('action', {
      is: 'delete',
      then: Joi.required()
    })
  }).default({})
});

// ============================================
// ORDER ANALYTICS SCHEMA
// ============================================

export const orderAnalyticsSchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '12m', 'custom').default('30d'),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').default('day'),
  vendor: Joi.string().hex().length(24).optional(),
  startDate: Joi.date().iso().when('period', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).when('period', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// ============================================
// ORDER EXPORT SCHEMA
// ============================================

export const orderExportSchema = Joi.object({
  format: Joi.string().valid('csv', 'excel', 'pdf', 'json').default('csv'),
  fields: Joi.string().optional(),
  status: Joi.string().valid(
    'pending', 'processing', 'confirmed', 'shipped', 'delivered',
    'cancelled', 'refunded', 'partially_refunded'
  ).optional(),
  paymentStatus: Joi.string().valid(
    'pending', 'paid', 'partially_paid', 'refunded', 'failed'
  ).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  vendor: Joi.string().hex().length(24).optional()
});

// ============================================
// ORDER NOTE SCHEMA
// ============================================

export const orderNoteSchema = Joi.object({
  note: Joi.string().required().min(3).max(1000),
  type: Joi.string().valid('info', 'warning', 'issue', 'resolution', 'other').default('info'),
  isPrivate: Joi.boolean().default(true),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

// ============================================
// PAYMENT INTENT SCHEMA
// ============================================

export const paymentIntentSchema = Joi.object({
  amount: Joi.number().min(0.5).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  orderId: Joi.string().hex().length(24).optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

export default {
  idParamSchema,
  orderNumberParamSchema,
  trackingNumberParamSchema,
  paginationSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  addTrackingSchema,
  processRefundSchema,
  bulkOrderSchema,
  orderAnalyticsSchema,
  orderExportSchema,
  orderNoteSchema,
  paymentIntentSchema
};