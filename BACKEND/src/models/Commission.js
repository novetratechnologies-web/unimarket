import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  // ============================================
  // COMMISSION IDENTIFICATION
  // ============================================
  name: {
    type: String,
    required: [true, 'Commission name is required'],
    trim: true,
    maxlength: [100, 'Commission name cannot exceed 100 characters'],
    index: true
  },
  
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // ============================================
  // COMMISSION TYPE & SCOPE
  // ============================================
  type: {
    type: String,
    enum: [
      'percentage',      // Percentage of product price
      'fixed',          // Fixed amount per sale
      'tiered',         // Tiered based on sales volume
      'category',       // Category-specific rate
      'product',        // Product-specific rate
      'vendor',         // Vendor-specific rate
      'global',         // Global default rate
      'promotional',    // Promotional/discounted rate
      'subscription'    // Subscription-based commission
    ],
    required: true,
    index: true
  },
  
  scope: {
    type: String,
    enum: [
      'global',        // Applies to all vendors/products
      'vendor',        // Applies to specific vendor
      'category',      // Applies to specific category
      'product',       // Applies to specific product
      'collection',    // Applies to specific collection
      'brand'         // Applies to specific brand
    ],
    required: true,
    index: true
  },
  
  // ============================================
  // COMMISSION RATES
  // ============================================
  rate: {
    type: Number,
    required: function() {
      return !this.isTiered && this.type !== 'tiered';
    },
    min: 0,
    max: 100,
    set: v => parseFloat(v.toFixed(2)),
    validate: {
      validator: function(v) {
        if (this.type === 'percentage' && v > 100) return false;
        if (this.type === 'fixed' && v < 0) return false;
        return true;
      },
      message: 'Invalid commission rate'
    }
  },
  
  currency: {
    type: String,
    uppercase: true,
    default: 'USD',
    validate: {
      validator: function(v) {
        return this.type === 'fixed' ? !!v : true;
      },
      message: 'Currency is required for fixed commission'
    }
  },
  
  // ============================================
  // TIERED COMMISSION STRUCTURE
  // ============================================
  isTiered: {
    type: Boolean,
    default: false
  },
  
  tiers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    
    // Tier criteria
    criteria: {
      type: {
        type: String,
        enum: [
          'sales_amount',     // Based on total sales amount
          'order_count',      // Based on number of orders
          'product_count',    // Based on number of products sold
          'revenue',         // Based on vendor revenue
          'custom'           // Custom criteria
        ],
        required: true
      },
      operator: {
        type: String,
        enum: ['gte', 'gt', 'lte', 'lt', 'eq', 'between'],
        default: 'gte'
      },
      minValue: Number,
      maxValue: Number,
      unit: String,
      customField: String
    },
    
    // Commission for this tier
    commission: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      amount: {
        type: Number,
        min: 0
      }
    },
    
    // Tier benefits
    benefits: [{
      type: String,
      description: String,
      value: mongoose.Schema.Types.Mixed
    }],
    
    sortOrder: {
      type: Number,
      default: 0
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ============================================
  // APPLICABLE ENTITIES
  // ============================================
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor',
    required: function() {
      return this.scope === 'vendor';
    },
    index: true
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() {
      return this.scope === 'category';
    },
    index: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() {
      return this.scope === 'product';
    },
    index: true
  },
  
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: function() {
      return this.scope === 'collection';
    },
    index: true
  },
  
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: function() {
      return this.scope === 'brand';
    },
    index: true
  },
  
  // ============================================
  // EXCLUSIONS & EXCEPTIONS
  // ============================================
  exclusions: {
    vendors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    }],
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    collections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection'
    }],
    brands: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    }],
    tags: [String]
  },
  
  overrides: [{
    entity: {
      type: {
        type: String,
        enum: ['vendor', 'category', 'product', 'collection', 'brand'],
        required: true
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'overrides.entity.type'
      }
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    effectiveFrom: Date,
    effectiveTo: Date,
    reason: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============================================
  // COMMISSION RULES & CONDITIONS
  // ============================================
  rules: [{
    name: String,
    condition: {
      field: String,
      operator: {
        type: String,
        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'contains'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed,
      value2: mongoose.Schema.Types.Mixed // For between operator
    },
    action: {
      type: {
        type: String,
        enum: ['adjust_rate', 'apply_fixed', 'waive', 'cap'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed,
      description: String
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ============================================
  // VOLUME DISCOUNTS
  // ============================================
  volumeDiscounts: [{
    name: String,
    threshold: {
      type: {
        type: String,
        enum: ['sales_amount', 'order_count', 'product_count'],
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 0
      },
      period: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
        default: 'monthly'
      }
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 0
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ============================================
  // EFFECTIVE PERIOD
  // ============================================
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  effectiveTo: {
    type: Date,
    index: true,
    validate: {
      validator: function(v) {
        return !v || v > this.effectiveFrom;
      },
      message: 'Effective to date must be after effective from date'
    }
  },
  
  isPermanent: {
    type: Boolean,
    default: false
  },
  
  // ============================================
  // SCHEDULING
  // ============================================
  scheduling: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    recurrence: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'none'],
        default: 'none'
      },
      interval: {
        type: Number,
        min: 1,
        default: 1
      },
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      daysOfMonth: [{
        type: Number,
        min: 1,
        max: 31
      }],
      monthsOfYear: [{
        type: Number,
        min: 1,
        max: 12
      }],
      endDate: Date,
      occurrences: Number
    }
  },
  
  // ============================================
  // STATUS & PRIORITY
  // ============================================
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isStackable: {
    type: Boolean,
    default: false,
    description: 'Can this commission be combined with other commissions'
  },
  
  stackPriority: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // ============================================
  // CALCULATION METHOD
  // ============================================
  calculationMethod: {
    type: String,
    enum: [
      'on_order_total',        // Commission on total order amount
      'on_product_price',      // Commission on product price
      'on_profit',           // Commission on profit margin
      'on_shipping',         // Commission on shipping
      'on_tax',            // Commission on tax
      'custom'            // Custom calculation logic
    ],
    default: 'on_product_price'
  },
  
  calculationBasis: {
    type: String,
    enum: [
      'before_discount',     // Before any discounts
      'after_discount',      // After discounts
      'before_tax',         // Before tax
      'after_tax',         // After tax
      'before_shipping',    // Before shipping
      'after_shipping'      // After shipping
    ],
    default: 'after_discount'
  },
  
  // ============================================
  // MINIMUM & MAXIMUM
  // ============================================
  minimum: {
    amount: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly']
    },
    period: Date
  },
  
  maximum: {
    amount: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['per_order', 'per_item', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime']
    },
    period: Date,
    currentAmount: {
      type: Number,
      default: 0
    },
    lastResetAt: Date
  },
  
  // ============================================
  // APPLICABLE PRODUCT TYPES
  // ============================================
  applicableProductTypes: [{
    type: String,
    enum: [
      'physical',      // Physical products
      'digital',       // Digital products
      'service',       // Services
      'subscription',  // Subscription products
      'bundle',        // Product bundles
      'gift_card'      // Gift cards
    ]
  }],
  
  // ============================================
  // APPLICABLE ORDER TYPES
  // ============================================
  applicableOrderTypes: [{
    type: String,
    enum: [
      'regular',       // Regular orders
      'wholesale',     // Wholesale orders
      'bulk',         // Bulk orders
      'subscription',  // Subscription orders
      'reorder'       // Reorder
    ],
    default: ['regular']
  }],
  
  // ============================================
  // CUSTOMER TIERS
  // ============================================
  customerTiers: [{
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      required: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    adjustment: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      value: Number
    }
  }],
  
  // ============================================
  // GEOGRAPHIC RESTRICTIONS
  // ============================================
  geographic: {
    countries: [{
      type: String,
      uppercase: true,
      minlength: 2,
      maxlength: 2
    }],
    regions: [String],
    excludeCountries: [{
      type: String,
      uppercase: true,
      minlength: 2,
      maxlength: 2
    }],
    excludeRegions: [String],
    currencies: [{
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3
    }]
  },
  
  // ============================================
  // PERFORMANCE METRICS
  // ============================================
  performance: {
    totalApplied: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCommission: {
      type: Number,
      default: 0,
      min: 0
    },
    averageCommission: {
      type: Number,
      default: 0,
      min: 0
    },
    lastAppliedAt: Date,
    lastAppliedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    applicationHistory: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      orderNumber: String,
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      amount: Number,
      rate: Number,
      commission: Number,
      appliedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // ============================================
  // APPROVAL WORKFLOW
  // ============================================
  approval: {
    required: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    requestedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    rejectedAt: Date,
    rejectionReason: String,
    changesRequested: [{
      field: String,
      message: String,
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notes: String
  },
  
  // ============================================
  // AUDIT & METADATA
  // ============================================
  version: {
    type: Number,
    default: 1
  },
  
  previousVersions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    updatedAt: Date,
    reason: String
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  
  approvedAt: Date,
  
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  
  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
    select: false
  },
  
  // ============================================
  // SOFT DELETE
  // ============================================
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: Date,
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  
  deleteReason: String
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.previousVersions;
      delete ret.notes;
      delete ret.performance.applicationHistory;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    getters: true
  }
});

// ============================================
// INDEXES
// ============================================

// Primary indexes
commissionSchema.index({ code: 1 }, { unique: true });
commissionSchema.index({ type: 1, scope: 1, isActive: 1 });
commissionSchema.index({ vendor: 1, isActive: 1, priority: -1 });
commissionSchema.index({ category: 1, isActive: 1, priority: -1 });
commissionSchema.index({ product: 1, isActive: 1, priority: -1 });

// Date range indexes
commissionSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
commissionSchema.index({ 'scheduling.startDate': 1, 'scheduling.endDate': 1 });

// Status indexes
commissionSchema.index({ isDefault: 1, isActive: 1 });
commissionSchema.index({ 'approval.status': 1, createdAt: -1 });

// Compound indexes for common queries
commissionSchema.index({ scope: 1, 'vendor': 1, isActive: 1 });
commissionSchema.index({ scope: 1, 'category': 1, isActive: 1 });
commissionSchema.index({ isActive: 1, effectiveFrom: -1, priority: -1 });

// Partial indexes
commissionSchema.index({ effectiveTo: 1 }, {
  partialFilterExpression: {
    effectiveTo: { $exists: true },
    isPermanent: false
  }
});

// ============================================
// VIRTUALS
// ============================================

/**
 * Is currently active
 */
commissionSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  
  if (this.isScheduled) {
    if (this.scheduling.startDate && this.scheduling.startDate > now) return false;
    if (this.scheduling.endDate && this.scheduling.endDate < now) return false;
  }
  
  if (this.effectiveFrom > now) return false;
  if (!this.isPermanent && this.effectiveTo && this.effectiveTo < now) return false;
  
  return this.isActive && !this.isDeleted && this.approval.status === 'approved';
});

/**
 * Formatted rate
 */
commissionSchema.virtual('formattedRate').get(function() {
  if (this.type === 'percentage') {
    return `${this.rate}%`;
  } else if (this.type === 'fixed') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD'
    }).format(this.rate);
  }
  return this.rate.toString();
});

/**
 * Days until effective
 */
commissionSchema.virtual('daysUntilEffective').get(function() {
  const now = new Date();
  if (this.effectiveFrom > now) {
    return Math.ceil((this.effectiveFrom - now) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

/**
 * Days until expiry
 */
commissionSchema.virtual('daysUntilExpiry').get(function() {
  if (this.isPermanent || !this.effectiveTo) return null;
  const now = new Date();
  if (this.effectiveTo > now) {
    return Math.ceil((this.effectiveTo - now) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

/**
 * Is expiring soon
 */
commissionSchema.virtual('isExpiringSoon').get(function() {
  if (this.isPermanent || !this.effectiveTo) return false;
  const days = this.daysUntilExpiry;
  return days !== null && days <= 30 && days > 0;
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Generate code before save
 */
commissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    let prefix = '';
    
    switch (this.scope) {
      case 'global':
        prefix = 'GLOBAL';
        break;
      case 'vendor':
        prefix = 'VENDOR';
        break;
      case 'category':
        prefix = 'CAT';
        break;
      case 'product':
        prefix = 'PROD';
        break;
      case 'collection':
        prefix = 'COLL';
        break;
      case 'brand':
        prefix = 'BRND';
        break;
      default:
        prefix = 'COMM';
    }
    
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.code = `${prefix}-${timestamp}${random}`;
  }
  
  // Validate tiers
  if (this.isTiered && (!this.tiers || this.tiers.length === 0)) {
    const error = new Error('Tiered commission must have at least one tier');
    error.code = 'TIERS_REQUIRED';
    return next(error);
  }
  
  // Validate scope-specific requirements
  if (this.scope === 'vendor' && !this.vendor) {
    const error = new Error('Vendor is required for vendor-specific commission');
    error.code = 'VENDOR_REQUIRED';
    return next(error);
  }
  
  if (this.scope === 'category' && !this.category) {
    const error = new Error('Category is required for category-specific commission');
    error.code = 'CATEGORY_REQUIRED';
    return next(error);
  }
  
  if (this.scope === 'product' && !this.product) {
    const error = new Error('Product is required for product-specific commission');
    error.code = 'PRODUCT_REQUIRED';
    return next(error);
  }
  
  // Ensure only one default commission per scope
  if (this.isDefault && this.isActive) {
    await this.constructor.updateMany(
      {
        scope: this.scope,
        ...(this.scope === 'vendor' && { vendor: this.vendor }),
        ...(this.scope === 'category' && { category: this.category }),
        ...(this.scope === 'product' && { product: this.product }),
        _id: { $ne: this._id },
        isDeleted: false
      },
      { $set: { isDefault: false } }
    );
  }
  
  this.updatedAt = new Date();
  next();
});

/**
 * Validate effective dates
 */
commissionSchema.pre('save', function(next) {
  if (this.scheduling.isScheduled) {
    if (!this.scheduling.startDate) {
      const error = new Error('Start date is required for scheduled commission');
      error.code = 'START_DATE_REQUIRED';
      return next(error);
    }
    
    if (this.scheduling.recurrence.type !== 'none' && !this.scheduling.endDate) {
      const error = new Error('End date is required for recurring commission');
      error.code = 'END_DATE_REQUIRED';
      return next(error);
    }
  }
  
  next();
});

// ============================================
// PRE-FIND MIDDLEWARE
// ============================================

/**
 * Exclude deleted commissions by default
 */
commissionSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

/**
 * Only show approved commissions by default for non-admin
 */
commissionSchema.pre('find', function(next) {
  const query = this.getQuery();
  if (!query.includePending && !query.includeRejected) {
    this.where({ 'approval.status': 'approved' });
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate commission for an order item
 */
commissionSchema.methods.calculate = async function(amount, options = {}) {
  const {
    quantity = 1,
    customerTier = null,
    date = new Date(),
    applyVolumeDiscount = true,
    applyRules = true
  } = options;
  
  let commissionAmount = 0;
  let appliedRate = this.rate;
  let appliedTier = null;
  
  // Check if commission is applicable
  if (!this.isCurrentlyActive) {
    return { commission: 0, rate: 0, tier: null, rules: [] };
  }
  
  // Apply tiered commission
  if (this.isTiered && this.tiers && this.tiers.length > 0) {
    const applicableTiers = this.tiers
      .filter(t => t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Find matching tier based on vendor performance
    // This is simplified - actual implementation would fetch vendor stats
    const vendorStats = options.vendorStats || { totalSales: 0, orderCount: 0 };
    
    for (const tier of applicableTiers) {
      let matches = false;
      
      switch (tier.criteria.type) {
        case 'sales_amount':
          if (tier.criteria.operator === 'gte' && vendorStats.totalSales >= tier.criteria.minValue) matches = true;
          if (tier.criteria.operator === 'between' && 
              vendorStats.totalSales >= tier.criteria.minValue && 
              vendorStats.totalSales <= tier.criteria.maxValue) matches = true;
          break;
        case 'order_count':
          if (tier.criteria.operator === 'gte' && vendorStats.orderCount >= tier.criteria.minValue) matches = true;
          break;
      }
      
      if (matches) {
        appliedTier = tier;
        if (tier.commission.type === 'percentage') {
          appliedRate = tier.commission.rate;
        } else {
          commissionAmount = tier.commission.amount * quantity;
        }
        break;
      }
    }
  }
  
  // Calculate base commission
  if (commissionAmount === 0) {
    if (this.type === 'percentage' || this.calculationMethod === 'on_product_price') {
      commissionAmount = (amount * appliedRate) / 100;
    } else if (this.type === 'fixed') {
      commissionAmount = appliedRate * quantity;
    }
  }
  
  // Apply customer tier adjustment
  if (customerTier && this.customerTiers && this.customerTiers.length > 0) {
    const tierConfig = this.customerTiers.find(t => t.tier === customerTier);
    if (tierConfig) {
      if (tierConfig.adjustment.type === 'percentage') {
        commissionAmount = commissionAmount * (1 + tierConfig.adjustment.value / 100);
      } else {
        commissionAmount += tierConfig.adjustment.value;
      }
    }
  }
  
  // Apply volume discount
  if (applyVolumeDiscount && this.volumeDiscounts && this.volumeDiscounts.length > 0) {
    // Implementation depends on vendor's volume tracking
  }
  
  // Apply rules
  const appliedRules = [];
  if (applyRules && this.rules && this.rules.length > 0) {
    const activeRules = this.rules
      .filter(r => r.isActive)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of activeRules) {
      // Rule evaluation logic
      // This is simplified - would need actual condition evaluation
      appliedRules.push(rule);
    }
  }
  
  // Apply minimum/maximum constraints
  if (this.minimum.amount && commissionAmount < this.minimum.amount) {
    commissionAmount = this.minimum.amount;
  }
  
  if (this.maximum.amount) {
    // Check period limits
    if (this.maximum.type && this.maximum.period) {
      // Reset counter if period has passed
      if (this.maximum.lastResetAt) {
        const now = new Date();
        let shouldReset = false;
        
        switch (this.maximum.type) {
          case 'daily':
            shouldReset = now.toDateString() !== this.maximum.lastResetAt.toDateString();
            break;
          case 'weekly':
            // Check if week changed
            break;
          case 'monthly':
            shouldReset = now.getMonth() !== this.maximum.lastResetAt.getMonth() ||
                         now.getFullYear() !== this.maximum.lastResetAt.getFullYear();
            break;
        }
        
        if (shouldReset) {
          this.maximum.currentAmount = 0;
          this.maximum.lastResetAt = now;
        }
      }
    }
    
    const remainingAmount = this.maximum.amount - (this.maximum.currentAmount || 0);
    if (commissionAmount > remainingAmount) {
      commissionAmount = Math.max(0, remainingAmount);
    }
    
    // Update current amount
    this.maximum.currentAmount = (this.maximum.currentAmount || 0) + commissionAmount;
    this.maximum.lastResetAt = new Date();
  }
  
  // Round to 2 decimal places
  commissionAmount = Math.round(commissionAmount * 100) / 100;
  
  return {
    commission: commissionAmount,
    rate: appliedRate,
    tier: appliedTier,
    rules: appliedRules
  };
};

/**
 * Apply commission to an order
 */
commissionSchema.methods.apply = async function(order, vendorId, productId, amount) {
  const calculation = await this.calculate(amount);
  
  // Record application
  this.performance.totalApplied += 1;
  this.performance.totalCommission += calculation.commission;
  this.performance.averageCommission = this.performance.totalCommission / this.performance.totalApplied;
  this.performance.lastAppliedAt = new Date();
  this.performance.lastAppliedOrder = order._id;
  
  this.performance.applicationHistory.push({
    orderId: order._id,
    orderNumber: order.orderNumber,
    vendorId,
    productId,
    amount,
    rate: calculation.rate,
    commission: calculation.commission,
    appliedAt: new Date()
  });
  
  // Keep only last 100 applications
  if (this.performance.applicationHistory.length > 100) {
    this.performance.applicationHistory = this.performance.applicationHistory.slice(-100);
  }
  
  await this.save();
  
  return calculation;
};

/**
 * Create version snapshot
 */
commissionSchema.methods.createVersion = async function(updatedBy, reason = 'Update') {
  const versionData = this.toObject();
  delete versionData._id;
  delete versionData.__v;
  delete versionData.previousVersions;
  delete versionData.performance.applicationHistory;
  
  this.previousVersions.push({
    version: this.version,
    data: versionData,
    updatedBy,
    updatedAt: new Date(),
    reason
  });
  
  // Keep only last 10 versions
  if (this.previousVersions.length > 10) {
    this.previousVersions = this.previousVersions.slice(-10);
  }
  
  this.version += 1;
  return this.save();
};

/**
 * Approve commission
 */
commissionSchema.methods.approve = async function(approvedBy, notes = '') {
  this.approval.status = 'approved';
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.notes = notes;
  this.isActive = true;
  
  return this.save();
};

/**
 * Reject commission
 */
commissionSchema.methods.reject = async function(rejectedBy, reason) {
  this.approval.status = 'rejected';
  this.approval.rejectedBy = rejectedBy;
  this.approval.rejectedAt = new Date();
  this.approval.rejectionReason = reason;
  this.isActive = false;
  
  return this.save();
};

/**
 * Soft delete
 */
commissionSchema.methods.softDelete = async function(deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  this.isActive = false;
  
  return this.save();
};

/**
 * Restore soft deleted commission
 */
commissionSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deleteReason = null;
  this.isActive = true;
  
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get applicable commission for vendor/product
 */
commissionSchema.statics.getApplicableCommission = async function(entity, entityType, options = {}) {
  const {
    date = new Date(),
    includeInactive = false,
    priority = true
  } = options;
  
  const query = {
    isDeleted: false,
    isActive: includeInactive ? { $in: [true, false] } : true,
    'approval.status': 'approved',
    effectiveFrom: { $lte: date },
    $or: [
      { isPermanent: true },
      { effectiveTo: { $gte: date } }
    ]
  };
  
  // Add scope-specific conditions
  if (entityType === 'vendor') {
    query.$or = [
      { scope: 'global' },
      { scope: 'vendor', vendor: entity },
      { scope: 'category', category: { $in: options.categories || [] } },
      { scope: 'product', product: { $in: options.products || [] } }
    ];
  } else if (entityType === 'product') {
    query.$or = [
      { scope: 'global' },
      { scope: 'product', product: entity },
      { scope: 'category', category: { $in: options.categories || [] } },
      { scope: 'vendor', vendor: options.vendor }
    ];
  }
  
  // Apply exclusions
  if (entityType === 'vendor') {
    query['exclusions.vendors'] = { $ne: entity };
  }
  
  let commissions = await this.find(query);
  
  // Filter by applicable product/order types
  if (options.productType) {
    commissions = commissions.filter(c => 
      !c.applicableProductTypes || 
      c.applicableProductTypes.length === 0 ||
      c.applicableProductTypes.includes(options.productType)
    );
  }
  
  if (options.orderType) {
    commissions = commissions.filter(c => 
      !c.applicableOrderTypes || 
      c.applicableOrderTypes.length === 0 ||
      c.applicableOrderTypes.includes(options.orderType)
    );
  }
  
  // Filter by geographic restrictions
  if (options.country) {
    commissions = commissions.filter(c => {
      if (c.geographic.countries && c.geographic.countries.length > 0) {
        return c.geographic.countries.includes(options.country);
      }
      if (c.geographic.excludeCountries && c.geographic.excludeCountries.length > 0) {
        return !c.geographic.excludeCountries.includes(options.country);
      }
      return true;
    });
  }
  
  // Sort by priority and specificity
  if (priority) {
    commissions.sort((a, b) => {
      // Default commissions come last
      if (a.isDefault && !b.isDefault) return 1;
      if (!a.isDefault && b.isDefault) return -1;
      
      // Higher priority first
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // More specific scope first
      const scopeOrder = { product: 1, vendor: 2, category: 3, collection: 4, brand: 5, global: 6 };
      if (scopeOrder[a.scope] !== scopeOrder[b.scope]) {
        return scopeOrder[a.scope] - scopeOrder[b.scope];
      }
      
      return 0;
    });
  }
  
  return commissions;
};

/**
 * Get default commission
 */
commissionSchema.statics.getDefaultCommission = async function(scope = 'global') {
  return this.findOne({
    scope,
    isDefault: true,
    isActive: true,
    isDeleted: false,
    'approval.status': 'approved',
    effectiveFrom: { $lte: new Date() },
    $or: [
      { isPermanent: true },
      { effectiveTo: { $gte: new Date() } }
    ]
  });
};

/**
 * Get vendor commission summary
 */
commissionSchema.statics.getVendorSummary = async function(vendorId, startDate, endDate) {
  const match = {
    'performance.applicationHistory.vendorId': vendorId,
    'performance.applicationHistory.appliedAt': {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $unwind: '$performance.applicationHistory' },
    { $match: match },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$performance.applicationHistory.commission' },
        totalOrders: { $sum: 1 },
        averageCommission: { $avg: '$performance.applicationHistory.commission' },
        totalAmount: { $sum: '$performance.applicationHistory.amount' },
        effectiveRate: {
          $avg: {
            $multiply: [
              { $divide: ['$performance.applicationHistory.commission', '$performance.applicationHistory.amount'] },
              100
            ]
          }
        }
      }
    }
  ]);
};

/**
 * Get expiring commissions
 */
commissionSchema.statics.getExpiringCommissions = async function(daysThreshold = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysThreshold);
  
  return this.find({
    isDeleted: false,
    isActive: true,
    isPermanent: false,
    effectiveTo: {
      $gte: new Date(),
      $lte: expiryDate
    },
    'approval.status': 'approved'
  }).populate('vendor', 'vendorProfile.storeName email');
};

/**
 * Clean up old commission applications
 */
commissionSchema.statics.cleanupHistory = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.updateMany(
    {},
    {
      $pull: {
        'performance.applicationHistory': {
          appliedAt: { $lt: cutoffDate }
        }
      }
    }
  );
};

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission;