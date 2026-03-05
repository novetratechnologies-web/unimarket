import mongoose from 'mongoose';

// ============================================
// CONFIGURATION
// ============================================
const DASHBOARD_CONFIG = {
  ARRAY_LIMITS: {
    TOP_SELLING: 100,
    TOP_VENDORS: 50,
    TOP_CUSTOMERS: 50,
    TOP_PAGES: 50,
    BY_CATEGORY: 500,
    BY_PAYMENT_METHOD: 20,
    BY_HOUR: 24,
    BY_DAY_OF_WEEK: 7,
    BY_SOURCE: 50,
    BY_ENDPOINT: 100,
    TOP_REASONS: 20,
    BY_COUPON: 50,
    BY_DEPARTMENT: 20,
    MOST_ACTIVE_ADMINS: 20
  },
  TTL: {
    hourly: 1 * 60 * 60 * 1000,     // 1 hour
    daily: 24 * 60 * 60 * 1000,      // 1 day
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
    monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
    quarterly: 90 * 24 * 60 * 60 * 1000, // 90 days
    yearly: 365 * 24 * 60 * 60 * 1000 // 365 days
  },
  RETENTION: {
    hourly: 7,     // days
    daily: 90,     // days
    weekly: 365,   // days
    monthly: 730,  // days (2 years)
    quarterly: 1095, // days (3 years)
    yearly: 1825    // days (5 years)
  }
};

// ============================================
// HELPER SCHEMAS (Reusable components)
// ============================================

const MoneySchema = new mongoose.Schema({
  amount: { type: Number, default: 0, min: 0, required: true },
  currency: { type: String, default: 'USD', maxlength: 3 }
}, { _id: false });

const PeriodStatsSchema = new mongoose.Schema({
  value: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' }
}, { _id: false });

const TopItemSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  secondaryId: mongoose.Schema.Types.ObjectId,
  secondaryName: { type: String, trim: true, maxlength: 200 },
  metrics: {
    value: { type: Number, default: 0, min: 0 },
    count: { type: Number, default: 0, min: 0 },
    secondaryValue: { type: Number, default: 0, min: 0 }
  },
  rank: { type: Number, min: 1 },
  image: { type: String, maxlength: 500 }
}, { 
  _id: false,
  timestamps: false 
});

// ============================================
// MAIN DASHBOARD STATS SCHEMA
// ============================================
const dashboardStatsSchema = new mongoose.Schema({
  // ============================================
  // IDENTIFICATION
  // ============================================
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
    index: true
  },
  
  // ============================================
  // CORE METRICS (Always present, minimized)
  // ============================================
  core: {
    revenue: { type: Number, default: 0, min: 0, index: true },
    orders: { type: Number, default: 0, min: 0, index: true },
    customers: { type: Number, default: 0, min: 0 },
    products: { type: Number, default: 0, min: 0 },
    vendors: { type: Number, default: 0, min: 0 },
    aov: { type: Number, default: 0, min: 0 },
    conversion: { type: Number, default: 0, min: 0, max: 100 }
  },

  // ============================================
  // DETAILED METRICS (Conditional presence)
  // ============================================
  details: {
    // Only include if period is not too granular
    revenue: {
      type: {
        gross: { type: Number, default: 0, min: 0 },
        net: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        shipping: { type: Number, default: 0, min: 0 },
        discounts: { type: Number, default: 0, min: 0 },
        refunds: { type: Number, default: 0, min: 0 },
        commission: {
          total: { type: Number, default: 0, min: 0 },
          collected: { type: Number, default: 0, min: 0 },
          pending: { type: Number, default: 0, min: 0 },
          rate: { type: Number, default: 0, min: 0, max: 100 }
        }
      },
      default: () => ({})
    },
    
    orders: {
      type: {
        byStatus: {
          pending: { type: Number, default: 0, min: 0 },
          processing: { type: Number, default: 0, min: 0 },
          completed: { type: Number, default: 0, min: 0 },
          cancelled: { type: Number, default: 0, min: 0 },
          refunded: { type: Number, default: 0, min: 0 }
        },
        avgProcessingTime: { type: Number, default: 0, min: 0 }, // hours
        repeatRate: { type: Number, default: 0, min: 0, max: 100 }
      },
      default: () => ({})
    },
    
    customers: {
      type: {
        new: { type: Number, default: 0, min: 0 },
        active: { type: Number, default: 0, min: 0 },
        returning: { type: Number, default: 0, min: 0 },
        ltv: { type: Number, default: 0, min: 0 },
        retention: {
          d7: { type: Number, default: 0, min: 0, max: 100 },
          d30: { type: Number, default: 0, min: 0, max: 100 },
          d90: { type: Number, default: 0, min: 0, max: 100 }
        }
      },
      default: () => ({})
    }
  },

  // ============================================
  // DISTRIBUTIONS (Limited size arrays)
  // ============================================
  distributions: {
    paymentMethods: [{
      method: { 
        type: String, 
        enum: ['card', 'paypal', 'stripe', 'bank', 'cash', 'wallet', 'other'],
        required: true
      },
      amount: { type: Number, default: 0, min: 0 },
      count: { type: Number, default: 0, min: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }],
    
    hours: [{
      hour: { type: Number, min: 0, max: 23, required: true },
      amount: { type: Number, default: 0, min: 0 },
      orders: { type: Number, default: 0, min: 0 }
    }],
    
    days: [{
      day: { type: Number, min: 0, max: 6, required: true },
      amount: { type: Number, default: 0, min: 0 },
      orders: { type: Number, default: 0, min: 0 }
    }],
    
    sources: [{
      source: { type: String, required: true, maxlength: 100 },
      visitors: { type: Number, default: 0, min: 0 },
      conversion: { type: Number, default: 0, min: 0, max: 100 },
      revenue: { type: Number, default: 0, min: 0 }
    }],
    
    ratings: {
      '1': { type: Number, default: 0, min: 0 },
      '2': { type: Number, default: 0, min: 0 },
      '3': { type: Number, default: 0, min: 0 },
      '4': { type: Number, default: 0, min: 0 },
      '5': { type: Number, default: 0, min: 0 },
      average: { type: Number, default: 0, min: 0, max: 5 }
    }
  },

  // ============================================
  // TOP LISTS (Separate arrays with strict limits)
  // ============================================
  top: {
    products: {
      type: [TopItemSchema],
      validate: [
        (val) => val.length <= DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_SELLING,
        `Products array exceeds ${DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_SELLING} limit`
      ],
      default: []
    },
    
    vendors: {
      type: [TopItemSchema],
      validate: [
        (val) => val.length <= DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_VENDORS,
        `Vendors array exceeds ${DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_VENDORS} limit`
      ],
      default: []
    },
    
    customers: {
      type: [TopItemSchema],
      validate: [
        (val) => val.length <= DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_CUSTOMERS,
        `Customers array exceeds ${DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_CUSTOMERS} limit`
      ],
      default: []
    },
    
    pages: {
      type: [{
        url: { type: String, required: true, maxlength: 500 },
        title: { type: String, maxlength: 200 },
        views: { type: Number, default: 0, min: 0 },
        uniqueViews: { type: Number, default: 0, min: 0 }
      }],
      validate: [
        (val) => val.length <= DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_PAGES,
        `Pages array exceeds ${DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_PAGES} limit`
      ],
      default: []
    }
  },

  // ============================================
  // CATEGORY BREAKDOWNS
  // ============================================
  breakdowns: {
    categories: [{
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true, maxlength: 100 },
      count: { type: Number, default: 0, min: 0 },
      revenue: { type: Number, default: 0, min: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }],
    
    vendors: [{
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true, maxlength: 100 },
      products: { type: Number, default: 0, min: 0 },
      revenue: { type: Number, default: 0, min: 0 },
      orders: { type: Number, default: 0, min: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 }
    }]
  },

  // ============================================
  // TRENDS & COMPARISONS
  // ============================================
  trends: {
    revenue: { type: PeriodStatsSchema, default: () => ({}) },
    orders: { type: PeriodStatsSchema, default: () => ({}) },
    customers: { type: PeriodStatsSchema, default: () => ({}) },
    aov: { type: PeriodStatsSchema, default: () => ({}) }
  },

  // ============================================
  // GOALS PROGRESS
  // ============================================
  goals: {
    revenue: {
      target: { type: Number, default: 0, min: 0 },
      achieved: { type: Number, default: 0, min: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    orders: {
      target: { type: Number, default: 0, min: 0 },
      achieved: { type: Number, default: 0, min: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }
  },

  // ============================================
  // SYSTEM METRICS
  // ============================================
  system: {
    responseTime: {
      avg: { type: Number, default: 0, min: 0 },
      p95: { type: Number, default: 0, min: 0 },
      p99: { type: Number, default: 0, min: 0 }
    },
    errorRate: { type: Number, default: 0, min: 0, max: 100 },
    cacheHitRate: { type: Number, default: 0, min: 0, max: 100 }
  },

  // ============================================
  // METADATA
  // ============================================
  metadata: {
    generatedAt: { 
      type: Date, 
      default: Date.now,
      index: true 
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    cachedUntil: {
      type: Date,
      default: function() {
        return new Date(Date.now() + (DASHBOARD_CONFIG.TTL[this.period] || 3600000));
      },
      index: { expires: 0 } // TTL index - documents auto-delete
    },
    version: {
      type: Number,
      default: 2, // Start at version 2 for this production schema
      required: true,
      min: 1
    },
    schemaVersion: {
      type: Number,
      default: 1,
      required: true,
      min: 1
    },
    isComplete: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    processingTimeMs: {
      type: Number,
      min: 0
    },
    tags: [{
      type: String,
      maxlength: 50
    }],
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: process.env.NODE_ENV || 'development'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret._id;
      ret.id = doc._id;
      
      // Format dates
      if (ret.metadata?.generatedAt) {
        ret.metadata.generatedAt = ret.metadata.generatedAt.toISOString();
      }
      if (ret.metadata?.cachedUntil) {
        ret.metadata.cachedUntil = ret.metadata.cachedUntil.toISOString();
      }
      
      // Remove empty arrays/objects
      Object.keys(ret).forEach(key => {
        if (ret[key] && typeof ret[key] === 'object' && Object.keys(ret[key]).length === 0) {
          delete ret[key];
        }
        if (Array.isArray(ret[key]) && ret[key].length === 0) {
          delete ret[key];
        }
      });
      
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// ============================================
// INDEXES (Optimized for query patterns)
// ============================================

// Primary lookup pattern
dashboardStatsSchema.index({ 
  period: 1, 
  date: -1, 
  'metadata.isComplete': 1,
  'metadata.cachedUntil': 1 
});

// Latest stats query
dashboardStatsSchema.index({ 
  period: 1, 
  'metadata.generatedAt': -1,
  'metadata.isComplete': 1 
});

// Date range queries
dashboardStatsSchema.index({ 
  date: 1, 
  period: 1,
  'metadata.isComplete': 1 
});

// Core metrics queries
dashboardStatsSchema.index({ 
  period: 1, 
  'core.revenue': -1,
  date: -1 
});

// Cleanup operations
dashboardStatsSchema.index({ 
  'metadata.cachedUntil': 1 
}, { 
  expireAfterSeconds: 0,
  partialFilterExpression: {
    'metadata.cachedUntil': { $exists: true }
  }
});

// Vendor performance queries
dashboardStatsSchema.index({ 
  'breakdowns.vendors.id': 1,
  date: -1,
  period: 1 
});

// Product performance queries
dashboardStatsSchema.index({ 
  'top.products.id': 1,
  date: -1,
  period: 1 
});

// Compound index for dashboard aggregations
dashboardStatsSchema.index({
  period: 1,
  date: -1,
  'core.revenue': -1,
  'core.orders': -1
});

// ============================================
// VIRTUALS
// ============================================

dashboardStatsSchema.virtual('isExpired').get(function() {
  return this.metadata.cachedUntil < new Date();
});

dashboardStatsSchema.virtual('ageInSeconds').get(function() {
  return Math.floor((Date.now() - this.metadata.generatedAt) / 1000);
});

dashboardStatsSchema.virtual('completeness').get(function() {
  let score = 0;
  let total = 0;
  
  // Check core metrics
  if (this.core) score += 5;
  total += 5;
  
  // Check details presence based on period
  if (this.period !== 'hourly' && this.period !== 'daily') {
    if (this.details?.revenue) score += 2;
    if (this.details?.orders) score += 2;
    if (this.details?.customers) score += 1;
    total += 5;
  }
  
  // Check distributions
  if (this.distributions?.paymentMethods?.length) score += 2;
  if (this.distributions?.hours?.length) score += 2;
  total += 4;
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if stats are usable
 */
dashboardStatsSchema.methods.isUsable = function() {
  return this.metadata.isComplete === true && 
         this.metadata.cachedUntil > new Date() &&
         this.core?.revenue !== undefined;
};

/**
 * Extend cache TTL
 */
dashboardStatsSchema.methods.extendCache = async function(minutes = 30) {
  const extension = minutes * 60 * 1000;
  this.metadata.cachedUntil = new Date(this.metadata.cachedUntil.getTime() + extension);
  return this.save();
};

/**
 * Mark for regeneration
 */
dashboardStatsSchema.methods.markStale = async function(reason) {
  this.metadata.isComplete = false;
  this.metadata.tags = this.metadata.tags || [];
  this.metadata.tags.push('stale');
  this.metadata.tags.push(`stale-reason:${reason}`);
  this.metadata.version += 1;
  return this.save();
};

/**
 * Trim arrays to limits
 */
dashboardStatsSchema.methods.trimArrays = function() {
  // Products
  if (this.top.products?.length > DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_SELLING) {
    this.top.products = this.top.products.slice(0, DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_SELLING);
  }
  
  // Vendors
  if (this.top.vendors?.length > DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_VENDORS) {
    this.top.vendors = this.top.vendors.slice(0, DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_VENDORS);
  }
  
  // Customers
  if (this.top.customers?.length > DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_CUSTOMERS) {
    this.top.customers = this.top.customers.slice(0, DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_CUSTOMERS);
  }
  
  // Categories
  if (this.breakdowns.categories?.length > DASHBOARD_CONFIG.ARRAY_LIMITS.BY_CATEGORY) {
    this.breakdowns.categories = this.breakdowns.categories.slice(0, DASHBOARD_CONFIG.ARRAY_LIMITS.BY_CATEGORY);
  }
  
  // Payment methods - remove zero entries
  if (this.distributions.paymentMethods) {
    this.distributions.paymentMethods = this.distributions.paymentMethods
      .filter(m => m.amount > 0 || m.count > 0)
      .slice(0, DASHBOARD_CONFIG.ARRAY_LIMITS.BY_PAYMENT_METHOD);
  }
  
  // Hours - only include active hours
  if (this.distributions.hours) {
    this.distributions.hours = this.distributions.hours
      .filter(h => h.amount > 0 || h.orders > 0)
      .slice(0, 24);
  }
  
  return this;
};

/**
 * Calculate percentages
 */
dashboardStatsSchema.methods.calculatePercentages = function() {
  // Payment method percentages
  if (this.distributions.paymentMethods?.length) {
    const total = this.distributions.paymentMethods.reduce((sum, m) => sum + m.amount, 0);
    this.distributions.paymentMethods.forEach(m => {
      m.percentage = total > 0 ? (m.amount / total) * 100 : 0;
    });
  }
  
  // Category percentages
  if (this.breakdowns.categories?.length) {
    const total = this.breakdowns.categories.reduce((sum, c) => sum + c.revenue, 0);
    this.breakdowns.categories.forEach(c => {
      c.percentage = total > 0 ? (c.revenue / total) * 100 : 0;
    });
  }
  
  // Goal percentages
  if (this.goals?.revenue?.target > 0) {
    this.goals.revenue.percentage = (this.goals.revenue.achieved / this.goals.revenue.target) * 100;
  }
  
  if (this.goals?.orders?.target > 0) {
    this.goals.orders.percentage = (this.goals.orders.achieved / this.goals.orders.target) * 100;
  }
  
  return this;
};

/**
 * Validate data integrity
 */
dashboardStatsSchema.methods.validateIntegrity = function() {
  const errors = [];
  const warnings = [];
  
  // Check core metrics
  if (!this.core?.revenue && this.core?.revenue !== 0) {
    errors.push('Missing core revenue');
  }
  
  if (!this.core?.orders && this.core?.orders !== 0) {
    errors.push('Missing core orders');
  }
  
  // Validate date
  if (!this.date || isNaN(this.date.getTime())) {
    errors.push('Invalid date');
  }
  
  // Check array limits
  if (this.top.products?.length > DASHBOARD_CONFIG.ARRAY_LIMITS.TOP_SELLING) {
    warnings.push(`Products array exceeds limit: ${this.top.products.length}`);
  }
  
  // Validate revenue consistency if detailed data exists
  if (this.details?.revenue?.gross && this.distributions?.paymentMethods?.length) {
    const paymentTotal = this.distributions.paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentTotal - this.details.revenue.gross) > 0.01) {
      warnings.push(`Revenue mismatch: ${paymentTotal} vs ${this.details.revenue.gross}`);
    }
  }
  
  return { errors, warnings, isValid: errors.length === 0 };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get optimal TTL for period
 */
dashboardStatsSchema.statics.getTTL = function(period) {
  return DASHBOARD_CONFIG.TTL[period] || DASHBOARD_CONFIG.TTL.daily;
};

/**
 * Get retention period for cleanup
 */
dashboardStatsSchema.statics.getRetentionDays = function(period) {
  return DASHBOARD_CONFIG.RETENTION[period] || DASHBOARD_CONFIG.RETENTION.daily;
};

/**
 * Get latest valid stats
 */
dashboardStatsSchema.statics.getLatestValid = async function(period = 'daily', options = {}) {
  const query = {
    period,
    'metadata.isComplete': true,
    'metadata.cachedUntil': { $gt: new Date() }
  };
  
  if (options.date) {
    query.date = { $lte: options.date };
  }
  
  const stats = await this.findOne(query)
    .sort({ date: -1, 'metadata.generatedAt': -1 })
    .lean()
    .exec();
  
  if (!stats && options.fallback) {
    // Try to get any stats, even expired
    return this.findOne({ period, 'metadata.isComplete': true })
      .sort({ date: -1 })
      .lean()
      .exec();
  }
  
  return stats;
};

/**
 * Get stats for date range
 */
dashboardStatsSchema.statics.getRange = async function(startDate, endDate, period = 'daily') {
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }
  
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    period,
    'metadata.isComplete': true
  })
    .sort({ date: 1 })
    .lean()
    .exec();
};

/**
 * Aggregate stats for custom period
 */
dashboardStatsSchema.statics.aggregatePeriod = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        period: 'daily',
        'metadata.isComplete': true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$core.revenue' },
        totalOrders: { $sum: '$core.orders' },
        avgOrderValue: { $avg: '$core.aov' },
        avgConversion: { $avg: '$core.conversion' },
        maxCustomers: { $max: '$core.customers' },
        maxProducts: { $max: '$core.products' },
        maxVendors: { $max: '$core.vendors' },
        avgProcessingTime: { $avg: '$details.orders.avgProcessingTime' },
        avgRetentionD7: { $avg: '$details.customers.retention.d7' },
        avgRetentionD30: { $avg: '$details.customers.retention.d30' }
      }
    }
  ]);
  
  return result[0] || null;
};

/**
 * Get comparison with previous period
 */
dashboardStatsSchema.statics.compareWithPrevious = async function(currentDate, period = 'daily') {
  const previousDate = new Date(currentDate);
  
  switch(period) {
    case 'hourly':
      previousDate.setHours(previousDate.getHours() - 1);
      break;
    case 'daily':
      previousDate.setDate(previousDate.getDate() - 1);
      break;
    case 'weekly':
      previousDate.setDate(previousDate.getDate() - 7);
      break;
    case 'monthly':
      previousDate.setMonth(previousDate.getMonth() - 1);
      break;
    case 'quarterly':
      previousDate.setMonth(previousDate.getMonth() - 3);
      break;
    case 'yearly':
      previousDate.setFullYear(previousDate.getFullYear() - 1);
      break;
  }

  const [current, previous] = await Promise.all([
    this.findOne({ 
      date: currentDate, 
      period, 
      'metadata.isComplete': true 
    }).lean(),
    this.findOne({ 
      date: previousDate, 
      period, 
      'metadata.isComplete': true 
    }).lean()
  ]);

  if (!current) {
    return { current: null, previous, changes: null };
  }

  const calculateChange = (curr, prev) => {
    if (!prev || prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current,
    previous,
    changes: {
      revenue: calculateChange(current.core?.revenue, previous?.core?.revenue),
      orders: calculateChange(current.core?.orders, previous?.core?.orders),
      aov: calculateChange(current.core?.aov, previous?.core?.aov),
      customers: calculateChange(current.core?.customers, previous?.core?.customers)
    }
  };
};

/**
 * Clean up old stats based on retention policy
 */
dashboardStatsSchema.statics.cleanup = async function(options = {}) {
  const dryRun = options.dryRun || false;
  let totalDeleted = 0;
  const results = {};
  
  for (const period of ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']) {
    const retentionDays = options.retentionDays?.[period] || this.getRetentionDays(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const query = {
      period,
      date: { $lt: cutoffDate }
    };
    
    if (dryRun) {
      const count = await this.countDocuments(query);
      results[period] = count;
      totalDeleted += count;
    } else {
      const result = await this.deleteMany(query);
      results[period] = result.deletedCount;
      totalDeleted += result.deletedCount || 0;
    }
  }
  
  return { dryRun, totalDeleted, details: results };
};

/**
 * Create empty stats placeholder
 */
dashboardStatsSchema.statics.createPlaceholder = async function(date, period = 'daily', options = {}) {
  const stats = new this({
    date,
    period,
    core: { revenue: 0, orders: 0, customers: 0, products: 0, vendors: 0 },
    metadata: {
      generatedBy: options.generatedBy,
      isComplete: false,
      tags: ['placeholder'],
      environment: options.environment || process.env.NODE_ENV,
      cachedUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes cache
    }
  });
  
  return stats.save();
};

/**
 * Bulk insert/update stats
 */
dashboardStatsSchema.statics.bulkUpsert = async function(statsArray) {
  if (!statsArray.length) return [];
  
  const operations = statsArray.map(stats => ({
    updateOne: {
      filter: { 
        date: stats.date, 
        period: stats.period 
      },
      update: { $set: stats },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// ============================================
// QUERY HELPERS
// ============================================

dashboardStatsSchema.query.byPeriod = function(period) {
  return this.where('period').equals(period);
};

dashboardStatsSchema.query.complete = function() {
  return this.where('metadata.isComplete').equals(true);
};

dashboardStatsSchema.query.fresh = function() {
  return this.where('metadata.cachedUntil').gt(new Date());
};

dashboardStatsSchema.query.recent = function(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return this.where('date').gte(cutoff);
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

dashboardStatsSchema.pre('save', async function(next) {
  try {
    // Trim arrays to limits
    this.trimArrays();
    
    // Calculate percentages
    this.calculatePercentages();
    
    // Set core AOV if not set
    if (this.core && this.core.orders > 0 && this.core.revenue > 0) {
      this.core.aov = this.core.revenue / this.core.orders;
    }
    
    // Ensure metadata is properly set
    if (!this.metadata.generatedAt) {
      this.metadata.generatedAt = new Date();
    }
    
    if (!this.metadata.cachedUntil) {
      this.metadata.cachedUntil = new Date(Date.now() + this.constructor.getTTL(this.period));
    }
    
    // Increment version if document was complete
    if (this.isModified() && this.metadata.isComplete) {
      this.metadata.version += 1;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST-SAVE MIDDLEWARE
// ============================================

dashboardStatsSchema.post('save', function(doc) {
  // Log completion time
  if (doc.metadata.isComplete && !doc.metadata.processingTimeMs) {
    const processingTime = Date.now() - doc.metadata.generatedAt;
    doc.metadata.processingTimeMs = processingTime;
    doc.save().catch(err => console.error('Failed to update processing time:', err));
  }
});

// ============================================
// FACTORY METHODS
// ============================================

/**
 * Create from aggregation results with validation
 */
dashboardStatsSchema.statics.createFromData = async function(data, options = {}) {
  const { period = 'daily', generatedBy, validate = true } = options;
  
  const stats = new this({
    date: data.date || new Date(),
    period,
    core: {
      revenue: data.totalRevenue || 0,
      orders: data.totalOrders || 0,
      customers: data.totalCustomers || 0,
      products: data.totalProducts || 0,
      vendors: data.totalVendors || 0,
      conversion: data.conversionRate || 0
    },
    metadata: {
      generatedBy,
      isComplete: true,
      tags: options.tags || [],
      environment: options.environment || process.env.NODE_ENV
    }
  });
  
  // Add detailed data if provided
  if (data.details) {
    stats.details = data.details;
  }
  
  // Add distributions if provided
  if (data.distributions) {
    stats.distributions = data.distributions;
  }
  
  // Add top lists if provided
  if (data.top) {
    stats.top = data.top;
  }
  
  if (validate) {
    const { errors, isValid } = stats.validateIntegrity();
    if (!isValid) {
      throw new Error(`Invalid stats data: ${errors.join(', ')}`);
    }
  }
  
  return stats.save();
};

/**
 * Create daily snapshot
 */
dashboardStatsSchema.statics.createDailySnapshot = async function(date, generatedBy) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Aggregate from hourly stats
  const hourlyStats = await this.aggregate([
    {
      $match: {
        date: { $gte: startOfDay, $lte: endOfDay },
        period: 'hourly',
        'metadata.isComplete': true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$core.revenue' },
        totalOrders: { $sum: '$core.orders' },
        avgAOV: { $avg: '$core.aov' },
        avgConversion: { $avg: '$core.conversion' },
        maxCustomers: { $max: '$core.customers' },
        maxProducts: { $max: '$core.products' },
        maxVendors: { $max: '$core.vendors' },
        // Aggregate distributions
        paymentMethods: { $push: '$distributions.paymentMethods' },
        hours: { $push: '$distributions.hours' }
      }
    }
  ]);
  
  if (!hourlyStats.length) {
    return this.createPlaceholder(startOfDay, 'daily', { generatedBy });
  }
  
  const data = hourlyStats[0];
  
  // Merge distributions
  const mergedPaymentMethods = new Map();
  const mergedHours = new Map();
  
  data.paymentMethods?.flat().forEach(m => {
    if (!mergedPaymentMethods.has(m.method)) {
      mergedPaymentMethods.set(m.method, { amount: 0, count: 0 });
    }
    const current = mergedPaymentMethods.get(m.method);
    current.amount += m.amount || 0;
    current.count += m.count || 0;
  });
  
  data.hours?.flat().forEach(h => {
    if (!mergedHours.has(h.hour)) {
      mergedHours.set(h.hour, { amount: 0, orders: 0 });
    }
    const current = mergedHours.get(h.hour);
    current.amount += h.amount || 0;
    current.orders += h.orders || 0;
  });
  
  const dailyStats = new this({
    date: startOfDay,
    period: 'daily',
    core: {
      revenue: data.totalRevenue,
      orders: data.totalOrders,
      customers: data.maxCustomers,
      products: data.maxProducts,
      vendors: data.maxVendors,
      aov: data.avgAOV,
      conversion: data.avgConversion
    },
    distributions: {
      paymentMethods: Array.from(mergedPaymentMethods, ([method, data]) => ({ method, ...data })),
      hours: Array.from(mergedHours, ([hour, data]) => ({ hour, ...data }))
    },
    metadata: {
      generatedBy,
      isComplete: true,
      tags: ['snapshot', 'from-hourly']
    }
  });
  
  return dailyStats.save();
};

// ============================================
// EXPORT
// ============================================

const DashboardStats = mongoose.model('DashboardStats', dashboardStatsSchema);

export default DashboardStats;