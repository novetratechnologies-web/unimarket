import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  // 🔥 FIX: Handle both authenticated and unauthenticated users
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel', // Dynamic reference based on userModel field
    index: true
  },
  userModel: {
    type: String,
    enum: ['User', 'Admin', 'Vendor', 'AdminVendor', null],
    default: null
  },
  
  // 🔥 ADD: For unauthenticated actions (public routes)
  anonymousId: {
    type: String,
    index: true,
    sparse: true // Only index when present
  },
  
  // 🔥 ADD: User email for quick lookup (denormalized)
  userEmail: {
    type: String,
    index: true,
    lowercase: true
  },
  
  // 🔥 ADD: User role at time of action
  userRole: {
    type: String,
    enum: ['user', 'admin', 'vendor', 'super_admin', 'guest', 'system'],
    default: 'guest'
  },
  
  // Action Details - 🔥 ENHANCED with ALL possible actions
action: {
    type: String,
    required: true,
    enum: [
      // Auth actions
      'login', 'logout', 'login_failed', 'register', 'verify_email', 
      'forgot_password', 'reset_password', 'refresh_token',
      
      // CRUD actions - INCLUDING 'view' and 'read'
      'create', 'read', 'view', 'update', 'delete', 
      'bulk_create', 'bulk_update', 'bulk_delete',
      
      // 🔥 NEW DELETE TYPES - ADDED HERE
      'delete_soft', 'delete_permanent',
      
      // Order actions
      'order_created', 'order_updated', 'order_viewed', 'order_shipped', 
      'order_delivered', 'order_cancelled', 'order_refunded', 'order_fulfilled',
      
      // Product actions
      'product_created', 'product_updated', 'product_viewed', 'product_deleted',
      'product_publish', 'product_unpublish', 'inventory_update', 'price_update',
      'low_stock',
      
      // User actions
      'user_created', 'user_updated', 'user_viewed', 'user_deleted',
      'user_suspended', 'user_activated',
      
      // Admin/Vendor actions
      'vendor_approved', 'vendor_rejected', 'vendor_suspended',
      'vendor_activated', 'vendor_created', 'vendor_updated', 'vendor_viewed',
      'role_changed', 'permission_changed',
      
      // Admin actions
      'export', 'import', 'approve', 'reject', 'suspend', 'activate', 
      'payout', 'refund', 'cancel', 'bulk_operation',
      
      // Payment actions
      'payment_received', 'payment_failed', 'payout_processed', 'refund_processed',
      'payment_viewed', 'transaction_created',
      
      // Security actions
      'password_change', '2fa_setup', '2fa_enable', '2fa_disable',
      'permission_change', 'role_change', 'api_key_generate', 'api_key_revoke',
      
      // Vendor actions
      'product_publish', 'product_unpublish', 'inventory_update',
      'price_update', 'order_fulfill', 'order_cancel',
      
      // System actions
      'system_start', 'system_shutdown', 'backup', 'restore',
      'config_change', 'maintenance_mode', 'system_alert', 'settings_updated',
      'backup_created',
      
      // Page/View actions
      'page_view', 'dashboard_view', 'report_view', 'profile_view',
      
      // API actions
      'api_call', 'api_success', 'api_error',
      
      // Category actions
      'category_created', 'category_updated', 'category_viewed', 'category_deleted',
      
      // Discount actions
      'discount_created', 'discount_updated', 'discount_viewed', 'discount_deleted',
      'discount_applied',
      
      // Report actions
      'report_generated', 'report_viewed', 'report_exported',
      
      // Notification actions
      'notification_sent', 'notification_viewed', 'notification_clicked',
      
      // Generic fallbacks
      'accessed', 'viewed', 'fetched', 'loaded', 'initiated', 'completed', 'failed'
    ]
  },
  
  // Resource - 🔥 ENHANCED with ALL possible resource types (including plurals)
  resourceType: {
    type: String,
    required: true,
    enum: [
      // Core resources (singular)
      'user', 'admin', 'vendor', 'product', 'order', 'category', 
      'discount', 'payout', 'setting', 'review', 'collection',
      'document', 'address', 'bank_details', 'commission',
      'permission', 'role', 'api_key', 'webhook', 'notification',
      'template', 'report', 'analytics', 'backup', 'log',
      'inventory', 'shipment', 'payment', 'transaction', 'refund',
      'invoice', 'receipt', 'quote', 'wishlist', 'cart',
      
      // Page resources
      'dashboard', 'profile', 'settings', 'reports', 'analytics',
      'orders_page', 'products_page', 'users_page', 'vendors_page',
      'categories_page', 'discounts_page',
      
      // API resources
      'api_endpoint', 'webhook_endpoint', 'endpoint',
      
      // PLURAL FORMS - CRITICAL FOR YOUR ERROR
      'users', 'orders', 'products', 'vendors', 'categories',
      'payments', 'payouts', 'transactions', 'refunds',
      'discounts', 'reviews', 'collections', 'documents',
      'addresses', 'bank_details', 'commissions', 'permissions',
      'roles', 'api_keys', 'webhooks', 'notifications',
      'templates', 'reports', 'analytics_data', 'backups', 'logs',
      'inventory_items', 'shipments',
      
      // System resources
      'system', 'config', 'cache', 'session',
      
      // Generic
      'resource', 'data', 'file', 'image'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceType'
  },
  
  // 🔥 ADD: Resource identifier as string (for non-ObjectId resources)
  resourceIdentifier: {
    type: String,
    index: true,
    sparse: true
  },
  
  // Resource name/description for non-ID resources
  resourceName: {
    type: String,
    index: true,
    sparse: true
  },
  
  // Changes - 🔥 KEEP as is
  beforeData: mongoose.Schema.Types.Mixed,
  afterData: mongoose.Schema.Types.Mixed,
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // Context - 🔥 ENHANCED
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending', 'warning', 'info'],
    default: 'success'
  },
  errorMessage: String,
  errorCode: String,
  errorStack: String, // Store for debugging in dev
  
  // Request Metadata - 🔥 ENHANCED
  ipAddress: {
    type: String,
    index: true
  },
  userAgent: String,
  sessionId: String,
  requestId: {
    type: String,
    index: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'VIEW']
  },
  endpoint: String,
  queryParams: mongoose.Schema.Types.Mixed,
  responseTime: Number, // in milliseconds
  
  // Location (if available)
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    region: String,
    postalCode: String
  },
  
  // Security
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical', 'debug', 'verbose'],
    default: 'info'
  },
  
  // 🔥 ADD: Compliance tracking
  compliance: {
    gdpr: Boolean, // Was this action GDPR relevant?
    sensitive: Boolean, // Did it involve sensitive data?
    retention: Date, // When can this log be deleted
    legal: Boolean, // Is this log required for legal reasons?
    audit: Boolean // Should this be included in audit reports?
  },
  
  // 🔥 ADD: Audit trail for compliance
  auditId: String, // Link to related audit record
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityLog',
    index: true
  }, // For linking related activities
  
  // Additional Data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  strict: false, // Allow additional fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
activityLogSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// ==================== INDEXES ====================
// Existing indexes - keep these
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });

// 🔥 ADD: New indexes for better querying
activityLogSchema.index({ userEmail: 1, createdAt: -1 });
activityLogSchema.index({ userRole: 1, createdAt: -1 });
activityLogSchema.index({ requestId: 1 }, { unique: true, sparse: true });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });
activityLogSchema.index({ 'compliance.retention': 1 }, { expireAfterSeconds: 0 });
activityLogSchema.index({ anonymousId: 1, createdAt: -1 });
activityLogSchema.index({ endpoint: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ errorCode: 1, createdAt: -1 });
activityLogSchema.index({ method: 1, createdAt: -1 });
activityLogSchema.index({ resourceName: 1 });
activityLogSchema.index({ parentId: 1 });

// Compound indexes for common queries
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, status: 1, createdAt: -1 });

// ==================== STATIC METHODS ====================

/** 🔥 Clean old logs with different policies per severity */
activityLogSchema.statics.cleanOldLogs = async function(config = {}) {
  const {
    criticalRetention = 365 * 10, // 10 years
    errorRetention = 365, // 1 year
    warningRetention = 180, // 6 months
    infoRetention = 90, // 3 months
    debugRetention = 30, // 1 month
    verboseRetention = 7 // 1 week
  } = config;

  const now = new Date();
  const results = {};

  // Delete by severity with different retention periods
  for (const [severity, days] of Object.entries({
    critical: criticalRetention,
    error: errorRetention,
    warning: warningRetention,
    info: infoRetention,
    debug: debugRetention,
    verbose: verboseRetention
  })) {
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    results[severity] = await this.deleteMany({
      severity,
      createdAt: { $lt: cutoffDate }
    });
  }

  return results;
};

/** 🔥 Get user activity summary */
activityLogSchema.statics.getUserActivitySummary = async function(userId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        $or: [
          { user: new mongoose.Types.ObjectId(userId) },
          { userEmail: userId }
        ],
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        statuses: {
          $push: {
            status: '$_id.status',
            severity: '$_id.severity',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ]);
};

/** 🔥 Get security events */
activityLogSchema.statics.getSecurityEvents = async function(options = {}) {
  const {
    days = 7,
    severity = ['warning', 'error', 'critical'],
    actions = ['login_failed', 'password_change', '2fa_setup', '2fa_disable', 'api_key_generate', 'api_key_revoke', 'permission_change', 'role_change'],
    limit = 100
  } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const query = {
    createdAt: { $gte: cutoffDate },
    $or: [
      { severity: { $in: Array.isArray(severity) ? severity : [severity] } },
      { action: { $in: Array.isArray(actions) ? actions : [actions] } }
    ]
  };

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'email firstName lastName role');
};

/** 🔥 Get resource activity timeline */
activityLogSchema.statics.getResourceTimeline = async function(resourceType, resourceId, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    resourceType,
    resourceId,
    createdAt: { $gte: cutoffDate }
  })
    .sort({ createdAt: -1 })
    .populate('user', 'email firstName lastName');
};

// ==================== INSTANCE METHODS ====================

/** 🔥 Format for API response */
activityLogSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Remove sensitive or large fields
  delete obj.__v;
  delete obj.beforeData;
  delete obj.afterData;
  delete obj.errorStack;
  delete obj.metadata?.headers?.authorization;
  delete obj.metadata?.headers?.cookie;
  
  // Add virtuals
  obj.timeAgo = this.timeAgo;
  
  // Don't send changes array if it's too large
  if (obj.changes && obj.changes.length > 10) {
    obj.changes = obj.changes.slice(0, 10);
    obj.changesTruncated = true;
  }
  
  return obj;
};

/** 🔥 Check if log is expired */
activityLogSchema.methods.isExpired = function(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return this.createdAt < cutoffDate;
};

/** 🔥 Link to another activity */
activityLogSchema.methods.linkTo = function(parentActivityId) {
  this.parentId = parentActivityId;
  return this.save();
};

// ==================== MIDDLEWARE ====================

/** 🔥 Pre-save middleware */
activityLogSchema.pre('save', function(next) {
  // Set compliance flags
  if (!this.compliance) {
    this.compliance = {};
  }
  
  // Mark as GDPR relevant if involves user data
  const sensitiveResources = ['user', 'admin', 'vendor', 'bank_details', 'document', 'address', 'payment'];
  this.compliance.gdpr = sensitiveResources.includes(this.resourceType);
  
  // Mark as sensitive if involves passwords, tokens, etc.
  const sensitiveActions = ['password_change', 'login', '2fa_setup', 'api_key_generate', 'login_failed', 'reset_password'];
  this.compliance.sensitive = sensitiveActions.includes(this.action);
  
  // Mark for legal retention if critical or involves legal data
  const legalActions = ['delete', 'suspend', 'ban', 'payout', 'refund', 'commission'];
  this.compliance.legal = this.severity === 'critical' || legalActions.includes(this.action);
  
  // Set retention date
  if (!this.compliance.retention) {
    let retentionDays = 90; // Default
    
    if (this.compliance.legal || this.severity === 'critical') {
      retentionDays = 3650; // 10 years
    } else if (this.severity === 'error') {
      retentionDays = 365; // 1 year
    } else if (this.severity === 'warning') {
      retentionDays = 180; // 6 months
    } else if (this.severity === 'debug' || this.severity === 'verbose') {
      retentionDays = 30; // 1 month
    }
    
    this.compliance.retention = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  }
  
  // Ensure description exists
  if (!this.description) {
    this.description = `${this.action} ${this.resourceType}`;
    if (this.resourceIdentifier) {
      this.description += ` ${this.resourceIdentifier}`;
    }
  }
  
  next();
});

// Create the model
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;