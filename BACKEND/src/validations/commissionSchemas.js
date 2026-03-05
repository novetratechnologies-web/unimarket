import Joi from 'joi';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const codeParamSchema = Joi.object({
  code: Joi.string().pattern(/^[A-Z]+-\d{9}$/).required()
});

export const vendorIdParamSchema = Joi.object({
  vendorId: Joi.string().hex().length(24).required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid(
    'name', 'code', 'rate', 'priority', 'effectiveFrom',
    'effectiveTo', 'createdAt', 'updatedAt',
    'performance.totalCommission', 'performance.totalApplied'
  ).default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow('', null),
  scope: Joi.string().valid('global', 'vendor', 'category', 'product', 'collection', 'brand'),
  type: Joi.string().valid('percentage', 'fixed', 'tiered', 'category', 'product', 'vendor', 'global', 'promotional', 'subscription'),
  vendor: Joi.string().hex().length(24),
  category: Joi.string().hex().length(24),
  product: Joi.string().hex().length(24),
  isActive: Joi.boolean(),
  isDefault: Joi.boolean(),
  isTiered: Joi.boolean(),
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected', 'changes_requested'),
  minRate: Joi.number().min(0).max(100),
  maxRate: Joi.number().min(0).max(100).greater(Joi.ref('minRate')),
  effectiveFrom: Joi.date().iso(),
  effectiveTo: Joi.date().iso(),
  includeInactive: Joi.boolean().default(false),
  includePending: Joi.boolean().default(false)
});

// ============================================
// CREATE COMMISSION SCHEMA
// ============================================

export const createCommissionSchema = Joi.object({
  name: Joi.string().required().min(3).max(100).trim(),
  
  description: Joi.string().max(500).allow('', null),
  
  type: Joi.string().valid(
    'percentage', 'fixed', 'tiered', 'category', 
    'product', 'vendor', 'global', 'promotional', 'subscription'
  ).required(),
  
  scope: Joi.string().valid(
    'global', 'vendor', 'category', 'product', 'collection', 'brand'
  ).required(),
  
  rate: Joi.number().min(0).max(100).when('type', {
    is: Joi.string().valid('percentage', 'category', 'product', 'vendor', 'global', 'promotional'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  currency: Joi.string().length(3).uppercase().when('type', {
    is: 'fixed',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  isTiered: Joi.boolean().default(false),
  
  tiers: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow('', null),
      criteria: Joi.object({
        type: Joi.string().valid(
          'sales_amount', 'order_count', 'product_count', 'revenue', 'custom'
        ).required(),
        operator: Joi.string().valid('gte', 'gt', 'lte', 'lt', 'eq', 'between').default('gte'),
        minValue: Joi.number().min(0),
        maxValue: Joi.number().min(0),
        unit: Joi.string(),
        customField: Joi.string()
      }).required(),
      commission: Joi.object({
        type: Joi.string().valid('percentage', 'fixed').required(),
        rate: Joi.number().min(0).max(100),
        amount: Joi.number().min(0)
      }).required(),
      benefits: Joi.array().items(
        Joi.object({
          type: Joi.string(),
          description: Joi.string(),
          value: Joi.any()
        })
      ),
      sortOrder: Joi.number().integer().min(0).default(0),
      isActive: Joi.boolean().default(true)
    })
  ).when('isTiered', {
    is: true,
    then: Joi.required().min(1),
    otherwise: Joi.forbidden()
  }),
  
  vendor: Joi.string().hex().length(24).when('scope', {
    is: 'vendor',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  category: Joi.string().hex().length(24).when('scope', {
    is: 'category',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  product: Joi.string().hex().length(24).when('scope', {
    is: 'product',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  collection: Joi.string().hex().length(24).when('scope', {
    is: 'collection',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  brand: Joi.string().hex().length(24).when('scope', {
    is: 'brand',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  exclusions: Joi.object({
    vendors: Joi.array().items(Joi.string().hex().length(24)),
    categories: Joi.array().items(Joi.string().hex().length(24)),
    products: Joi.array().items(Joi.string().hex().length(24)),
    collections: Joi.array().items(Joi.string().hex().length(24)),
    brands: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().items(Joi.string())
  }).optional(),
  
  overrides: Joi.array().items(
    Joi.object({
      entity: Joi.object({
        type: Joi.string().valid('vendor', 'category', 'product', 'collection', 'brand').required(),
        id: Joi.string().hex().length(24).required()
      }),
      rate: Joi.number().required().min(0).max(100),
      type: Joi.string().valid('percentage', 'fixed').default('percentage'),
      effectiveFrom: Joi.date().iso(),
      effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')),
      reason: Joi.string().max(500)
    })
  ).optional(),
  
  effectiveFrom: Joi.date().iso().default(Date.now, 'now'),
  
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null),
  
  isPermanent: Joi.boolean().default(false),
  
  priority: Joi.number().integer().min(0).max(100).default(0),
  
  isActive: Joi.boolean().default(true),
  
  isDefault: Joi.boolean().default(false),
  
  isStackable: Joi.boolean().default(false),
  
  stackPriority: Joi.number().integer().min(0).max(100).default(0),
  
  calculationMethod: Joi.string().valid(
    'on_order_total', 'on_product_price', 'on_profit', 'on_shipping', 'on_tax', 'custom'
  ).default('on_product_price'),
  
  calculationBasis: Joi.string().valid(
    'before_discount', 'after_discount', 'before_tax', 'after_tax', 'before_shipping', 'after_shipping'
  ).default('after_discount'),
  
  minimum: Joi.object({
    amount: Joi.number().min(0),
    type: Joi.string().valid('per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly'),
    period: Joi.date().iso()
  }).optional(),
  
  maximum: Joi.object({
    amount: Joi.number().min(0),
    type: Joi.string().valid('per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime'),
    period: Joi.date().iso()
  }).optional(),
  
  rules: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      condition: Joi.object({
        field: Joi.string().required(),
        operator: Joi.string().valid('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'contains').required(),
        value: Joi.any().required(),
        value2: Joi.any()
      }).required(),
      action: Joi.object({
        type: Joi.string().valid('adjust_rate', 'apply_fixed', 'waive', 'cap').required(),
        value: Joi.any(),
        description: Joi.string()
      }).required(),
      priority: Joi.number().integer().min(0).max(100).default(0),
      isActive: Joi.boolean().default(true)
    })
  ).optional(),
  
  volumeDiscounts: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      threshold: Joi.object({
        type: Joi.string().valid('sales_amount', 'order_count', 'product_count').required(),
        value: Joi.number().min(0).required(),
        period: Joi.string().valid('monthly', 'quarterly', 'yearly', 'lifetime').default('monthly')
      }).required(),
      discount: Joi.object({
        type: Joi.string().valid('percentage', 'fixed').required(),
        value: Joi.number().min(0).required()
      }).required(),
      isActive: Joi.boolean().default(true)
    })
  ).optional(),
  
  customerTiers: Joi.array().items(
    Joi.object({
      tier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum', 'diamond').required(),
      rate: Joi.number().min(0).max(100).required(),
      adjustment: Joi.object({
        type: Joi.string().valid('percentage', 'fixed').default('percentage'),
        value: Joi.number().required()
      })
    })
  ).optional(),
  
  geographic: Joi.object({
    countries: Joi.array().items(Joi.string().length(2).uppercase()),
    regions: Joi.array().items(Joi.string()),
    excludeCountries: Joi.array().items(Joi.string().length(2).uppercase()),
    excludeRegions: Joi.array().items(Joi.string()),
    currencies: Joi.array().items(Joi.string().length(3).uppercase())
  }).optional(),
  
  applicableProductTypes: Joi.array().items(
    Joi.string().valid('physical', 'digital', 'service', 'subscription', 'bundle', 'gift_card')
  ),
  
  applicableOrderTypes: Joi.array().items(
    Joi.string().valid('regular', 'wholesale', 'bulk', 'subscription', 'reorder')
  ).default(['regular']),
  
  scheduling: Joi.object({
    isScheduled: Joi.boolean().default(false),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    recurrence: Joi.object({
      type: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'none').default('none'),
      interval: Joi.number().integer().min(1).default(1),
      daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
      daysOfMonth: Joi.array().items(Joi.number().min(1).max(31)),
      monthsOfYear: Joi.array().items(Joi.number().min(1).max(12)),
      endDate: Joi.date().iso(),
      occurrences: Joi.number().integer().min(1)
    }).when('isScheduled', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
  }).optional(),
  
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({}),
  
  tags: Joi.array().items(Joi.string().trim().lowercase()),
  
  notes: Joi.string().max(2000).allow('', null)
});

// ============================================
// UPDATE COMMISSION SCHEMA
// ============================================

export const updateCommissionSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim(),
  description: Joi.string().max(500).allow('', null),
  rate: Joi.number().min(0).max(100),
  currency: Joi.string().length(3).uppercase(),
  isTiered: Joi.boolean(),
  tiers: Joi.array().items(
    Joi.object({
      _id: Joi.string().hex().length(24).optional(),
      name: Joi.string(),
      description: Joi.string().allow('', null),
      criteria: Joi.object({
        type: Joi.string().valid('sales_amount', 'order_count', 'product_count', 'revenue', 'custom'),
        operator: Joi.string().valid('gte', 'gt', 'lte', 'lt', 'eq', 'between'),
        minValue: Joi.number().min(0),
        maxValue: Joi.number().min(0),
        unit: Joi.string(),
        customField: Joi.string()
      }),
      commission: Joi.object({
        type: Joi.string().valid('percentage', 'fixed'),
        rate: Joi.number().min(0).max(100),
        amount: Joi.number().min(0)
      }),
      benefits: Joi.array().items(
        Joi.object({
          type: Joi.string(),
          description: Joi.string(),
          value: Joi.any()
        })
      ),
      sortOrder: Joi.number().integer().min(0),
      isActive: Joi.boolean()
    })
  ),
  exclusions: Joi.object({
    vendors: Joi.array().items(Joi.string().hex().length(24)),
    categories: Joi.array().items(Joi.string().hex().length(24)),
    products: Joi.array().items(Joi.string().hex().length(24)),
    collections: Joi.array().items(Joi.string().hex().length(24)),
    brands: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().items(Joi.string())
  }),
  overrides: Joi.array().items(
    Joi.object({
      _id: Joi.string().hex().length(24).optional(),
      entity: Joi.object({
        type: Joi.string().valid('vendor', 'category', 'product', 'collection', 'brand'),
        id: Joi.string().hex().length(24)
      }),
      rate: Joi.number().min(0).max(100),
      type: Joi.string().valid('percentage', 'fixed'),
      effectiveFrom: Joi.date().iso(),
      effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')),
      reason: Joi.string().max(500)
    })
  ),
  effectiveFrom: Joi.date().iso(),
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null),
  isPermanent: Joi.boolean(),
  priority: Joi.number().integer().min(0).max(100),
  isActive: Joi.boolean(),
  isDefault: Joi.boolean(),
  isStackable: Joi.boolean(),
  stackPriority: Joi.number().integer().min(0).max(100),
  calculationMethod: Joi.string().valid('on_order_total', 'on_product_price', 'on_profit', 'on_shipping', 'on_tax', 'custom'),
  calculationBasis: Joi.string().valid('before_discount', 'after_discount', 'before_tax', 'after_tax', 'before_shipping', 'after_shipping'),
  minimum: Joi.object({
    amount: Joi.number().min(0),
    type: Joi.string().valid('per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly'),
    period: Joi.date().iso()
  }),
  maximum: Joi.object({
    amount: Joi.number().min(0),
    type: Joi.string().valid('per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime'),
    period: Joi.date().iso()
  }),
  rules: Joi.array().items(
    Joi.object({
      _id: Joi.string().hex().length(24).optional(),
      name: Joi.string(),
      condition: Joi.object({
        field: Joi.string(),
        operator: Joi.string().valid('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'contains'),
        value: Joi.any(),
        value2: Joi.any()
      }),
      action: Joi.object({
        type: Joi.string().valid('adjust_rate', 'apply_fixed', 'waive', 'cap'),
        value: Joi.any(),
        description: Joi.string()
      }),
      priority: Joi.number().integer().min(0).max(100),
      isActive: Joi.boolean()
    })
  ),
  volumeDiscounts: Joi.array().items(
    Joi.object({
      _id: Joi.string().hex().length(24).optional(),
      name: Joi.string(),
      threshold: Joi.object({
        type: Joi.string().valid('sales_amount', 'order_count', 'product_count'),
        value: Joi.number().min(0),
        period: Joi.string().valid('monthly', 'quarterly', 'yearly', 'lifetime')
      }),
      discount: Joi.object({
        type: Joi.string().valid('percentage', 'fixed'),
        value: Joi.number().min(0)
      }),
      isActive: Joi.boolean()
    })
  ),
  customerTiers: Joi.array().items(
    Joi.object({
      _id: Joi.string().hex().length(24).optional(),
      tier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum', 'diamond'),
      rate: Joi.number().min(0).max(100),
      adjustment: Joi.object({
        type: Joi.string().valid('percentage', 'fixed'),
        value: Joi.number()
      })
    })
  ),
  geographic: Joi.object({
    countries: Joi.array().items(Joi.string().length(2).uppercase()),
    regions: Joi.array().items(Joi.string()),
    excludeCountries: Joi.array().items(Joi.string().length(2).uppercase()),
    excludeRegions: Joi.array().items(Joi.string()),
    currencies: Joi.array().items(Joi.string().length(3).uppercase())
  }),
  applicableProductTypes: Joi.array().items(
    Joi.string().valid('physical', 'digital', 'service', 'subscription', 'bundle', 'gift_card')
  ),
  applicableOrderTypes: Joi.array().items(
    Joi.string().valid('regular', 'wholesale', 'bulk', 'subscription', 'reorder')
  ),
  scheduling: Joi.object({
    isScheduled: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    recurrence: Joi.object({
      type: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'none'),
      interval: Joi.number().integer().min(1),
      daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
      daysOfMonth: Joi.array().items(Joi.number().min(1).max(31)),
      monthsOfYear: Joi.array().items(Joi.number().min(1).max(12)),
      endDate: Joi.date().iso(),
      occurrences: Joi.number().integer().min(1)
    })
  }),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()),
  tags: Joi.array().items(Joi.string().trim().lowercase()),
  notes: Joi.string().max(2000).allow('', null)
}).min(1);

// ============================================
// APPROVAL WORKFLOW SCHEMAS
// ============================================

export const approveCommissionSchema = Joi.object({
  notes: Joi.string().max(1000).allow('', null)
});

export const rejectCommissionSchema = Joi.object({
  reason: Joi.string().required().min(10).max(500),
  notes: Joi.string().max(1000).allow('', null)
});

// ============================================
// CALCULATION & APPLICATION SCHEMAS
// ============================================

export const calculateCommissionSchema = Joi.object({
  amount: Joi.number().required().min(0).precision(2),
  vendorId: Joi.string().hex().length(24).required(),
  productId: Joi.string().hex().length(24).optional(),
  quantity: Joi.number().integer().min(1).default(1),
  customerTier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum', 'diamond').optional(),
  orderType: Joi.string().valid('regular', 'wholesale', 'bulk', 'subscription', 'reorder').default('regular'),
  productType: Joi.string().valid('physical', 'digital', 'service', 'subscription', 'bundle', 'gift_card').default('physical'),
  country: Joi.string().length(2).uppercase().optional()
});

export const applyCommissionSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  vendorId: Joi.string().hex().length(24).required(),
  productId: Joi.string().hex().length(24).optional(),
  amount: Joi.number().required().min(0).precision(2),
  quantity: Joi.number().integer().min(1).default(1)
});

// ============================================
// BULK OPERATION SCHEMA
// ============================================

export const bulkCommissionSchema = Joi.object({
  commissionIds: Joi.array().items(
    Joi.string().hex().length(24)
  ).min(1).max(100).required(),
  action: Joi.string().valid(
    'activate', 'deactivate', 'extend', 'update-rate', 'update-priority', 'delete'
  ).required(),
  data: Joi.object({
    effectiveTo: Joi.date().iso().when('action', {
      is: 'extend',
      then: Joi.required()
    }),
    rate: Joi.number().min(0).max(100).when('action', {
      is: 'update-rate',
      then: Joi.required()
    }),
    priority: Joi.number().integer().min(0).max(100).when('action', {
      is: 'update-priority',
      then: Joi.required()
    }),
    reason: Joi.string().max(500).when('action', {
      is: 'delete',
      then: Joi.required()
    })
  }).default({})
});

// ============================================
// EXPORT SCHEMA
// ============================================

export const commissionExportSchema = Joi.object({
  format: Joi.string().valid('csv', 'excel', 'pdf', 'json').default('csv'),
  fields: Joi.string().optional(),
  scope: Joi.string().valid('global', 'vendor', 'category', 'product', 'collection', 'brand'),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'changes_requested'),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
});

// ============================================
// ANALYTICS SCHEMA
// ============================================

export const commissionAnalyticsSchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '12m', 'custom').default('30d'),
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

export default {
  idParamSchema,
  codeParamSchema,
  vendorIdParamSchema,
  paginationSchema,
  createCommissionSchema,
  updateCommissionSchema,
  approveCommissionSchema,
  rejectCommissionSchema,
  calculateCommissionSchema,
  applyCommissionSchema,
  bulkCommissionSchema,
  commissionExportSchema,
  commissionAnalyticsSchema
};