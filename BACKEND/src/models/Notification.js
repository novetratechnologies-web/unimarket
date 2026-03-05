// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // ============================================
  // RECIPIENT HANDLING (Enhanced)
  // ============================================
  // Single recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    index: true
  },
  recipientModel: {
    type: String,
    enum: ['User', 'AdminVendor', 'Vendor', 'Admin'],
    required: function() { return !!this.recipient; }
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'super_admin', 'vendor', 'customer', 'all'],
    index: true
  },
  
  // Multiple recipients (for broadcasts)
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel'
  }],
  
  // Channel targeting
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push', 'webhook', 'slack'],
    default: ['in_app']
  }],

  // ============================================
  // NOTIFICATION CONTENT (Enhanced)
  // ============================================
  type: {
    type: String,
    enum: [
      // Order notifications
      'order_created', 'order_updated', 'order_shipped', 'order_delivered',
      'order_cancelled', 'order_refunded', 'order_fulfilled',
      
      // Payment notifications
      'payment_received', 'payment_failed', 'payment_refunded',
      'payout_processed', 'payout_failed', 'payout_pending',
      
      // Product notifications
      'product_created', 'product_updated', 'product_deleted',
      'product_low_stock', 'product_out_of_stock', 'product_approved',
      'product_rejected', 'product_reported',
      
      // Vendor notifications
      'vendor_registered', 'vendor_approved', 'vendor_rejected',
      'vendor_suspended', 'vendor_reactivated', 'vendor_payout',
      
      // User notifications
      'user_registered', 'user_verified', 'user_suspended',
      'user_reactivated', 'user_deleted', 'password_changed',
      
      // Review notifications
      'review_submitted', 'review_approved', 'review_rejected',
      'review_reported',
      
      // System notifications
      'system_alert', 'system_maintenance', 'system_update',
      'security_alert', 'backup_completed', 'backup_failed',
      
      // Support notifications
      'support_ticket_created', 'support_ticket_updated',
      'support_ticket_resolved', 'support_ticket_escalated',
      
      // Marketing notifications
      'promotion', 'announcement', 'newsletter'
    ],
    required: true,
    index: true
  },
  
  // Category for grouping
  category: {
    type: String,
    enum: ['order', 'payment', 'product', 'vendor', 'user', 'system', 'security', 'marketing'],
    required: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Rich content
  richContent: {
    html: String,
    markdown: String,
    actions: [{
      label: String,
      action: String,
      url: String,
      method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      data: mongoose.Schema.Types.Mixed
    }]
  },

  // ============================================
  // DATA & CONTEXT (Enhanced)
  // ============================================
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related entities
  relatedTo: {
    entityType: {
      type: String,
      enum: ['order', 'product', 'user', 'vendor', 'payment', 'payout', 'review']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.entityType'
    },
    summary: String
  },

  // ============================================
  // DELIVERY & PRESENTATION (Enhanced)
  // ============================================
  link: String,
  
  icon: {
    type: String,
    default: 'bell'
  },
  
  color: {
    type: String,
    enum: ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'gray'],
    default: 'blue'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent', 'critical'],
    default: 'normal'
  },

  // ============================================
  // STATUS TRACKING (Enhanced)
  // ============================================
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: Date,
  
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Delivery tracking
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  
  lastDeliveryAttempt: Date,
  
  deliveryError: String,
  
  // Read receipts for multiple channels
  readReceipts: [{
    channel: String,
    readAt: Date,
    ip: String,
    userAgent: String
  }],

  // ============================================
  // GROUPING & BATCHING (New)
  // ============================================
  groupId: {
    type: String,
    index: true
  },
  
  groupSummary: {
    count: { type: Number, default: 1 },
    latest: Date,
    summary: String
  },

  // ============================================
  // EXPIRATION & RETENTION (Enhanced)
  // ============================================
  expiresAt: {
    type: Date,
    default: function() {
      // Set default expiry based on priority
      const expiryMap = {
        'urgent': 7,
        'high': 14,
        'normal': 30,
        'low': 60,
        'critical': 90
      };
      const days = expiryMap[this.priority] || 30;
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    }
  },

  // ============================================
  // METADATA (Enhanced)
  // ============================================
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Source tracking
  source: {
    type: {
      type: String,
      enum: ['system', 'user', 'vendor', 'admin', 'api', 'cron']
    },
    id: mongoose.Schema.Types.ObjectId,
    description: String
  },

  // ============================================
  // WEBHOOK & INTEGRATION (New)
  // ============================================
  webhookSent: {
    type: Boolean,
    default: false
  },
  
  webhookResponse: {
    statusCode: Number,
    body: String,
    sentAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// INDEXES (Optimized)
// ============================================
// Primary lookup indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });

// Filtering indexes
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, status: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });

// Cleanup indexes
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Grouping index
notificationSchema.index({ groupId: 1 });

// ============================================
// VIRTUALS
// ============================================
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return this.createdAt.toLocaleDateString();
});

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// ============================================
// INSTANCE METHODS
// ============================================
notificationSchema.methods.markAsRead = async function(userId, channel = 'in_app') {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  
  this.readReceipts.push({
    channel,
    readAt: new Date(),
    ip: userId?.ip,
    userAgent: userId?.userAgent
  });
  
  return this.save();
};

notificationSchema.methods.markAsDelivered = async function() {
  if (this.status === 'pending') {
    this.status = 'delivered';
  }
  return this.save();
};

notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  return this.save();
};

notificationSchema.methods.restore = async function() {
  this.isArchived = false;
  this.isDeleted = false;
  return this.save();
};

notificationSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================
notificationSchema.statics.createForUser = async function(userId, userRole, data) {
  return this.create({
    recipient: userId,
    recipientRole: userRole,
    ...data
  });
};

notificationSchema.statics.createForRole = async function(role, data) {
  return this.create({
    recipientRole: role,
    ...data
  });
};

notificationSchema.statics.createBroadcast = async function(recipientIds, data) {
  const notifications = recipientIds.map(userId => ({
    recipient: userId,
    ...data
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { recipient: userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date(),
        status: 'read'
      }
    }
  );
  
  return result.modifiedCount;
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false, 
    isArchived: false, 
    isDeleted: false 
  });
};

notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    isRead,
    type,
    priority,
    category,
    startDate,
    endDate
  } = options;

  const query = {
    recipient: userId,
    isArchived: false,
    isDeleted: false
  };

  if (isRead !== undefined) query.isRead = isRead;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query),
    this.getUnreadCount(userId)
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

notificationSchema.statics.cleanup = async function(options = {}) {
  const {
    daysToKeep = 30,
    keepPriority = ['high', 'urgent', 'critical']
  } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // Archive old read notifications
  const archiveResult = await this.updateMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
    priority: { $nin: keepPriority },
    isArchived: false
  }, {
    $set: { isArchived: true }
  });

  // Delete old archived notifications
  const deleteResult = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isArchived: true,
    priority: { $nin: keepPriority }
  });

  return {
    archived: archiveResult.modifiedCount,
    deleted: deleteResult.deletedCount
  };
};

// ============================================
// MIDDLEWARE
// ============================================
notificationSchema.pre('save', function(next) {
  // Auto-set category based on type
  if (!this.category) {
    const categoryMap = {
      order: 'order',
      payment: 'payment',
      payout: 'payment',
      product: 'product',
      vendor: 'vendor',
      user: 'user',
      system: 'system',
      security: 'security',
      review: 'product'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (this.type.includes(key)) {
        this.category = value;
        break;
      }
    }
  }
  
  // Set color based on priority
  const colorMap = {
    'low': 'gray',
    'normal': 'blue',
    'high': 'orange',
    'urgent': 'red',
    'critical': 'red'
  };
  this.color = colorMap[this.priority] || 'blue';
  
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;