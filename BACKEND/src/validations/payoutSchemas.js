import Joi from 'joi';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const payoutNumberParamSchema = Joi.object({
  payoutNumber: Joi.string().pattern(/^PO-\d{6}-\d{4}$/).required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid(
    'createdAt', 'updatedAt', 'paidAt', 'summary.netAmount', 'status'
  ).default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow('', null),
  status: Joi.string(),
  vendor: Joi.string().hex().length(24),
  periodStart: Joi.date().iso(),
  periodEnd: Joi.date().iso().min(Joi.ref('periodStart')),
  minAmount: Joi.number().min(0),
  maxAmount: Joi.number().min(0).greater(Joi.ref('minAmount')),
  paymentMethod: Joi.string().valid(
    'bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'wallet', 'other'
  )
});

// ============================================
// CREATE PAYOUT SCHEMA
// ============================================

export const createPayoutSchema = Joi.object({
  vendor: Joi.string().hex().length(24).when('$userRole', {
    is: 'admin',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  period: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    type: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'custom')
      .default('custom')
  }).required(),
  
  paymentMethod: Joi.object({
    type: Joi.string().valid(
      'bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'wallet', 'other'
    ).required(),
    label: Joi.string().allow('', null),
    description: Joi.string().max(500).allow('', null)
  }).optional(),
  
  scheduling: Joi.object({
    scheduledDate: Joi.date().iso().min('now').optional(),
    isRecurring: Joi.boolean().default(false),
    recurrencePattern: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly'),
      dayOfWeek: Joi.number().min(0).max(6),
      dayOfMonth: Joi.number().min(1).max(31)
    }).when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
  }).optional(),
  
  notes: Joi.string().max(1000).allow('', null),
  
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({})
});

// ============================================
// UPDATE PAYOUT SCHEMA
// ============================================

export const updatePayoutSchema = Joi.object({
  paymentMethod: Joi.object({
    type: Joi.string().valid(
      'bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'wallet', 'other'
    ),
    label: Joi.string().allow('', null),
    description: Joi.string().max(500).allow('', null)
  }).optional(),
  
  bankDetails: Joi.object({
    accountHolderName: Joi.string(),
    accountNumber: Joi.string(),
    bankName: Joi.string(),
    routingNumber: Joi.string(),
    swiftCode: Joi.string(),
    iban: Joi.string(),
    branchName: Joi.string(),
    branchCode: Joi.string(),
    country: Joi.string().length(2),
    currency: Joi.string().length(3).uppercase()
  }).optional(),
  
  paypalDetails: Joi.object({
    email: Joi.string().email(),
    transactionId: Joi.string(),
    payerId: Joi.string(),
    paymentId: Joi.string()
  }).optional(),
  
  stripeDetails: Joi.object({
    accountId: Joi.string(),
    transferId: Joi.string(),
    transferGroup: Joi.string(),
    destinationPaymentId: Joi.string()
  }).optional(),
  
  checkDetails: Joi.object({
    payeeName: Joi.string(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      postalCode: Joi.string(),
      country: Joi.string()
    }),
    checkNumber: Joi.string(),
    mailedAt: Joi.date().iso(),
    estimatedDelivery: Joi.date().iso()
  }).optional(),
  
  'scheduling.scheduledDate': Joi.date().iso().min('now').optional(),
  
  adjustments: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('credit', 'debit', 'correction', 'bonus', 'penalty', 'fee')
        .required(),
      reason: Joi.string().required().max(500),
      amount: Joi.number().required().min(0.01),
      description: Joi.string().max(500).allow('', null),
      reference: Joi.string().allow('', null),
      metadata: Joi.object().pattern(Joi.string(), Joi.any())
    })
  ).optional(),
  
  notes: Joi.array().items(
    Joi.object({
      note: Joi.string().required(),
      type: Joi.string().valid('info', 'warning', 'issue', 'resolution', 'other'),
      isPrivate: Joi.boolean()
    })
  ).optional(),
  
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
}).min(1);

// ============================================
// APPROVAL WORKFLOW SCHEMAS
// ============================================

export const approvePayoutSchema = Joi.object({
  notes: Joi.string().max(1000).allow('', null)
});

export const rejectPayoutSchema = Joi.object({
  reason: Joi.string().required().min(10).max(500),
  notes: Joi.string().max(1000).allow('', null)
});

export const processPayoutSchema = Joi.object({
  paymentMethod: Joi.object({
    type: Joi.string().valid(
      'bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'wallet', 'other'
    ).required(),
    label: Joi.string().allow('', null),
    description: Joi.string().max(500).allow('', null)
  }).optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

export const completePayoutSchema = Joi.object({
  transactionId: Joi.string().required(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

export const failPayoutSchema = Joi.object({
  reason: Joi.string().required().max(500),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

// ============================================
// VENDOR PAYOUT REQUEST SCHEMA
// ============================================

export const requestPayoutSchema = Joi.object({
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().min(Joi.ref('periodStart')).optional()
});

// ============================================
// BULK OPERATION SCHEMA
// ============================================

export const bulkPayoutSchema = Joi.object({
  payoutIds: Joi.array().items(
    Joi.string().hex().length(24)
  ).min(1).max(100).required(),
  action: Joi.string().valid(
    'approve', 'reject', 'process', 'schedule', 'delete'
  ).required(),
  data: Joi.object({
    scheduledDate: Joi.date().iso().when('action', {
      is: 'schedule',
      then: Joi.required()
    }),
    reason: Joi.string().max(500).when('action', {
      is: 'reject',
      then: Joi.required()
    }),
    note: Joi.string().max(500)
  }).default({})
});

// ============================================
// EXPORT SCHEMA
// ============================================

export const payoutExportSchema = Joi.object({
  format: Joi.string().valid('csv', 'excel', 'pdf', 'json').default('csv'),
  fields: Joi.string().optional(),
  status: Joi.string().valid(
    'draft', 'pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'
  ).optional(),
  vendor: Joi.string().hex().length(24).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
});

// ============================================
// ANALYTICS SCHEMA
// ============================================

export const payoutAnalyticsSchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '12m', 'custom').default('30d'),
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
// NOTE SCHEMA
// ============================================

export const payoutNoteSchema = Joi.object({
  note: Joi.string().required().min(3).max(1000),
  type: Joi.string().valid('info', 'warning', 'issue', 'resolution', 'other').default('info'),
  isPrivate: Joi.boolean().default(false),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string(),
      url: Joi.string().uri(),
      size: Joi.number().min(0)
    })
  ).optional()
});

export default {
  idParamSchema,
  payoutNumberParamSchema,
  paginationSchema,
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
  payoutNoteSchema
};