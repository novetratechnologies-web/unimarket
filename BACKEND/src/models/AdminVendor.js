import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const adminVendorSchema = new mongoose.Schema({
  // ============================================
  // AUTHENTICATION & SECURITY (Modern)
  // ============================================
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't return password by default
  },
  passwordHistory: [{
    password: String,
    changedAt: Date
  }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String],
    method: {
      type: String,
      enum: ['authenticator', 'sms', 'email'],
      default: 'authenticator'
    }
  },
  refreshToken: {
    token: String,
    expiresAt: Date
  },
  sessionTokens: [{
    token: String,
    deviceInfo: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    lastUsed: Date,
    expiresAt: Date
  }],
  
  // ============================================
  // ROLE & PERMISSIONS (Admin/Vendor Only)
  // ============================================
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'vendor'],
    required: true,
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      // User Management
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'users.impersonate', 'users.export',
      
      // Vendor Management
      'vendors.view', 'vendors.approve', 'vendors.suspend', 
      'vendors.edit', 'vendors.delete', 'vendors.commission.edit',
      'vendors.payouts.process', 'vendors.payouts.view',
      
      // Product Management
      'products.view', 'products.create', 'products.edit', 
      'products.delete', 'products.approve', 'products.feature',
      'products.import', 'products.export', 'products.inventory.edit',
      
      // Order Management
      'orders.view', 'orders.edit', 'orders.cancel', 
      'orders.refund', 'orders.ship', 'orders.export',
      
      // Payment & Finance
      'payments.view', 'payments.refund', 'payments.export',
      'commissions.view', 'commissions.edit',
      
      // Discount & Promotion
      'discounts.view', 'discounts.create', 'discounts.edit', 
      'discounts.delete', 'coupons.manage',
      
      // Content Management
      'categories.manage', 'collections.manage', 'reviews.moderate',
      
      // Analytics & Reports
      'analytics.view', 'reports.generate', 'reports.export',
      'dashboard.customize',
      
      // System & Settings
      'settings.view', 'settings.edit', 'backup.manage',
      'logs.view', 'audit.trail', 'api.keys.manage',
      
      // Support
      'support.tickets.view', 'support.tickets.respond',
      'support.disputes.resolve'
    ]
  }],
  
  // Admin Hierarchy
  adminLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3 // 1 = Super Admin, 5 = Junior Admin
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  departments: [{
    type: String,
    enum: ['management', 'operations', 'finance', 'marketing', 
           'customer_service', 'technical', 'compliance', 'hr']
  }],
  
  // ============================================
  // VENDOR SPECIFIC FIELDS (Comprehensive)
  // ============================================
  vendorProfile: {
    // Store Information
    storeName: {
      type: String,
      trim: true
    },
    storeSlug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    storeTagline: String,
    storeDescription: {
      type: String,
      maxlength: 5000
    },
    storeStory: String,
    
    // Branding & Media
    branding: {
      logo: {
        url: String,
        alt: String,
        dimensions: { width: Number, height: Number }
      },
      banner: {
        url: String,
        alt: String,
        dimensions: { width: Number, height: Number }
      },
      favicon: String,
      brandColor: String,
      socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        pinterest: String,
        youtube: String,
        linkedin: String,
        tiktok: String
      }
    },
    
    // Business Details
    businessType: {
      type: String,
      enum: ['individual', 'partnership', 'llc', 'corporation', 'nonprofit']
    },
    yearEstablished: Number,
    businessRegistration: {
      number: String,
      certificate: String, // URL to uploaded document
      issuedDate: Date,
      expiryDate: Date,
      issuingAuthority: String
    },
    taxInfo: {
      taxId: String,
      taxIdType: {
        type: String,
        enum: ['ein', 'vat', 'gst', 'pan', 'other']
      },
      taxCertificate: String, // URL
      taxExempt: {
        type: Boolean,
        default: false
      }
    },
    
    // Contact Information
    contactInfo: {
      primaryPhone: String,
      secondaryPhone: String,
      supportEmail: String,
      supportPhone: String,
      customerServiceHours: {
        monday: { open: String, close: String, closed: Boolean },
        tuesday: { open: String, close: String, closed: Boolean },
        wednesday: { open: String, close: String, closed: Boolean },
        thursday: { open: String, close: String, closed: Boolean },
        friday: { open: String, close: String, closed: Boolean },
        saturday: { open: String, close: String, closed: Boolean },
        sunday: { open: String, close: String, closed: Boolean }
      }
    },
    
    // Address
    addresses: [{
      type: {
        type: String,
        enum: ['business', 'warehouse', 'returns', 'billing'],
        default: 'business'
      },
      isDefault: Boolean,
      street: String,
      street2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      phone: String,
      instructions: String
    }],
    
    // Payment & Banking
    banking: {
      primaryBank: {
        accountHolderName: String,
        accountNumber: {
          type: String,
          select: false // Encrypted in production
        },
        routingNumber: {
          type: String,
          select: false
        },
        swiftCode: String,
        bankName: String,
        bankAddress: String,
        currency: {
          type: String,
          default: 'USD'
        },
        verified: {
          type: Boolean,
          default: false
        }
      },
      paypal: {
        email: String,
        verified: Boolean
      },
      stripe: {
        accountId: String,
        onboardingComplete: Boolean
      },
      payoutSchedule: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'biweekly', 'monthly'],
          default: 'weekly'
        },
        dayOfWeek: {
          type: Number,
          min: 0,
          max: 6 // 0 = Sunday, 6 = Saturday
        },
        dayOfMonth: {
          type: Number,
          min: 1,
          max: 31
        },
        minimumAmount: {
          type: Number,
          default: 50
        },
        nextPayoutDate: Date
      }
    },
    
    // Commission Structure
    commission: {
      rate: {
        type: Number,
        min: 0,
        max: 100,
        default: 10
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      categories: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        },
        rate: Number,
        type: String
      }],
      specialRates: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        rate: Number,
        startDate: Date,
        endDate: Date
      }],
      volumeDiscount: [{
        threshold: Number, // Monthly sales threshold
        rate: Number // Reduced commission rate
      }],
      platformFee: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    
    // Subscription & Plan
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'professional', 'enterprise', 'custom'],
        default: 'basic'
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'trial'],
        default: 'trial'
      },
      trialEndsAt: Date,
      subscribedAt: Date,
      expiresAt: Date,
      autoRenew: {
        type: Boolean,
        default: true
      },
      features: [String],
      monthlyFee: Number,
      annualFee: Number,
      lastBilledAt: Date,
      nextBillingDate: Date
    },
    
    // Verification & Onboarding
    verification: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
      },
      documents: [{
        type: {
          type: String,
          enum: ['id_proof', 'address_proof', 'business_proof', 'tax_proof']
        },
        url: String,
        uploadedAt: Date,
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminVendor'
        },
        expiryDate: Date,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        rejectionReason: String
      }],
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      notes: String
    },
    
    // Performance Metrics
    performance: {
      totalSales: {
        type: Number,
        default: 0
      },
      totalOrders: {
        type: Number,
        default: 0
      },
      totalRevenue: {
        type: Number,
        default: 0
      },
      totalCommission: {
        type: Number,
        default: 0
      },
      averageOrderValue: {
        type: Number,
        default: 0
      },
      customerRating: {
        average: {
          type: Number,
          min: 0,
          max: 5,
          default: 0
        },
        count: {
          type: Number,
          default: 0
        },
        distribution: {
          1: { type: Number, default: 0 },
          2: { type: Number, default: 0 },
          3: { type: Number, default: 0 },
          4: { type: Number, default: 0 },
          5: { type: Number, default: 0 }
        }
      },
      responseTime: {
        average: Number, // In hours
        lastUpdated: Date
      },
      fulfillmentRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      cancellationRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      refundRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      monthlyStats: [{
        month: Date,
        sales: Number,
        orders: Number,
        revenue: Number,
        commission: Number
      }]
    },
    
    // Inventory & Shipping
    inventory: {
      totalProducts: {
        type: Number,
        default: 0
      },
      activeProducts: {
        type: Number,
        default: 0
      },
      outOfStock: {
        type: Number,
        default: 0
      },
      lowStock: {
        type: Number,
        default: 0
      },
      warehouses: [{
        name: String,
        location: {
          address: String,
          city: String,
          state: String,
          country: String,
          postalCode: String
        },
        manager: String,
        phone: String,
        capacity: Number,
        currentStock: Number
      }]
    },
    
    // Shipping Settings
    shippingSettings: {
      carriers: [{
        name: String,
        accountNumber: String,
        negotiatedRates: Boolean,
        services: [String]
      }],
      shippingZones: [{
        name: String,
        regions: [String],
        rates: [{
          name: String,
          price: Number,
          condition: String,
          minWeight: Number,
          maxWeight: Number,
          minPrice: Number,
          maxPrice: Number
        }],
        freeShippingThreshold: Number
      }],
      processingTime: {
        min: Number,
        max: Number,
        unit: {
          type: String,
          enum: ['hours', 'days', 'weeks'],
          default: 'days'
        }
      },
      returnsPolicy: {
        acceptsReturns: {
          type: Boolean,
          default: true
        },
        returnPeriod: Number, // Days
        restockingFee: Number, // Percentage
        returnShippingPaidBy: {
          type: String,
          enum: ['vendor', 'customer'],
          default: 'vendor'
        },
        policyText: String
      }
    }
  },
  
  // ============================================
  // ADMIN SPECIFIC FIELDS (Comprehensive)
  // ============================================
  adminProfile: {
    // Employment Details
    employeeId: String,
    position: String,
    department: String,
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern']
    },
    joinedAt: Date,
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    
    // Access Control
    accessLevel: {
      type: String,
      enum: ['super_admin', 'full_access', 'restricted', 'read_only'],
      default: 'restricted'
    },
    ipWhitelist: [String],
    allowedDomains: [String],
    mfaRequired: {
      type: Boolean,
      default: false
    },
    
    // Admin Activity
    lastLogin: Date,
    lastLoginIp: String,
    lastActive: Date,
    loginHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      location: String,
      success: Boolean,
      failureReason: String
    }],
    
    // Admin Settings
    dashboardPreferences: {
      defaultView: String,
      widgets: [String],
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      notifications: {
        email: Boolean,
        push: Boolean,
        desktop: Boolean
      }
    },
    
    // Audit & Compliance
    securityQuestions: [{
      question: String,
      answer: String,
      updatedAt: Date
    }],
    dataAccessLogs: [{
      resource: String,
      action: String,
      timestamp: Date,
      ip: String
    }],
    
    // Admin Notes
    notes: [{
      title: String,
      content: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      createdAt: Date,
      isPrivate: Boolean
    }]
  },
  
  // ============================================
  // ACCOUNT STATUS & VERIFICATION
  // ============================================
  status: {
    type: String,
    enum: [
      'active', 
      'inactive', 
      'suspended', 
      'pending_verification', 
      'pending_approval',
      'rejected',
      'locked',
      'deactivated'
    ],
    default: 'pending_verification',
    index: true
  },
  statusReason: String,
  statusChangedAt: Date,
  statusChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: Date,
  identityVerified: {
    type: Boolean,
    default: false
  },
  identityVerifiedAt: Date,
  
  // ============================================
  // COMMUNICATION & NOTIFICATIONS
  // ============================================
  notificationPreferences: {
    email: {
      orders: { type: Boolean, default: true },
      payouts: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      security: { type: Boolean, default: true },
      system: { type: Boolean, default: true }
    },
    push: {
      orders: { type: Boolean, default: true },
      payouts: { type: Boolean, default: true },
      products: { type: Boolean, default: false },
      reviews: { type: Boolean, default: false }
    },
    sms: {
      orders: { type: Boolean, default: false },
      security: { type: Boolean, default: true }
    }
  },
  
  // ============================================
  // METADATA & AUDIT
  // ============================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
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
  rejectionReason: String,
  
  // System Fields
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
  
  // API & Integration
  apiKeys: [{
    name: String,
    key: {
      type: String,
      unique: true,
      sparse: true
    },
    secret: {
      type: String,
      select: false
    },
    permissions: [String],
    lastUsed: Date,
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    }
  }],
  
  // Metadata
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  tags: [String],
  
  // Impersonation
  impersonatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  impersonatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// INDEXES (Performance Optimization)
// ============================================
adminVendorSchema.index({ email: 1, isDeleted: 1 });
adminVendorSchema.index({ role: 1, status: 1 });
adminVendorSchema.index({ 'vendorProfile.storeSlug': 1 }, { unique: true, sparse: true });
adminVendorSchema.index({ 'vendorProfile.verification.status': 1 });
adminVendorSchema.index({ 'vendorProfile.performance.totalRevenue': -1 });
adminVendorSchema.index({ createdAt: -1 });
adminVendorSchema.index({ 'adminProfile.employeeId': 1 }, { sparse: true });

// ============================================
// VIRTUALS
// ============================================
adminVendorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

adminVendorSchema.virtual('isVendor').get(function() {
  return this.role === 'vendor';
});

adminVendorSchema.virtual('isAdmin').get(function() {
  return ['admin', 'super_admin'].includes(this.role);
});

adminVendorSchema.virtual('isSuperAdmin').get(function() {
  return this.role === 'super_admin';
});

adminVendorSchema.virtual('storeUrl').get(function() {
  if (this.role === 'vendor' && this.vendorProfile?.storeSlug) {
    return `/store/${this.vendorProfile.storeSlug}`;
  }
  return null;
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================
adminVendorSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    // Add to password history
    if (this.password) {
      this.passwordHistory.push({
        password: this.password,
        changedAt: new Date()
      });
      
      // Keep only last 5 passwords
      if (this.passwordHistory.length > 5) {
        this.passwordHistory = this.passwordHistory.slice(-5);
      }
    }
    
    this.passwordChangedAt = new Date();
  }
  
  // Generate store slug if not exists
  if (this.role === 'vendor' && this.vendorProfile?.storeName && !this.vendorProfile.storeSlug) {
    this.vendorProfile.storeSlug = this.vendorProfile.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================
adminVendorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

adminVendorSchema.methods.isPasswordInHistory = async function(newPassword) {
  for (const history of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, history.password)) {
      return true;
    }
  }
  return false;
};

adminVendorSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }
  
  return this.save();
};

adminVendorSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

adminVendorSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions?.includes(permission) || false;
};

adminVendorSchema.methods.generateApiKey = function(name, permissions, expiresInDays = 365) {
  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiSecret = crypto.randomBytes(48).toString('hex');
  
  this.apiKeys.push({
    name,
    key: apiKey,
    secret: apiSecret,
    permissions,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: this._id
  });
  
  return { apiKey, apiSecret };
};

adminVendorSchema.methods.updatePerformanceMetrics = async function(orderData) {
  if (this.role !== 'vendor') return;
  
  this.vendorProfile.performance.totalSales += orderData.total;
  this.vendorProfile.performance.totalOrders += 1;
  this.vendorProfile.performance.totalRevenue += orderData.revenue;
  this.vendorProfile.performance.totalCommission += orderData.commission;
  this.vendorProfile.performance.averageOrderValue = 
    this.vendorProfile.performance.totalRevenue / this.vendorProfile.performance.totalOrders;
  
  // Update monthly stats
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  let monthlyStat = this.vendorProfile.performance.monthlyStats.find(
    stat => stat.month.getTime() === currentMonth.getTime()
  );
  
  if (!monthlyStat) {
    monthlyStat = {
      month: currentMonth,
      sales: 0,
      orders: 0,
      revenue: 0,
      commission: 0
    };
    this.vendorProfile.performance.monthlyStats.push(monthlyStat);
  }
  
  monthlyStat.sales += orderData.total;
  monthlyStat.orders += 1;
  monthlyStat.revenue += orderData.revenue;
  monthlyStat.commission += orderData.commission;
  
  // Keep only last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  this.vendorProfile.performance.monthlyStats = 
    this.vendorProfile.performance.monthlyStats.filter(
      stat => stat.month >= twelveMonthsAgo
    );
  
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================
adminVendorSchema.statics.findActiveVendors = function() {
  return this.find({
    role: 'vendor',
    status: 'active',
    isDeleted: false
  }).sort({ 'vendorProfile.performance.totalRevenue': -1 });
};

adminVendorSchema.statics.findPendingApproval = function() {
  return this.find({
    role: 'vendor',
    status: 'pending_approval',
    isDeleted: false
  });
};

adminVendorSchema.statics.getDashboardStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] }
        },
        suspended: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats;
};

// ============================================
// PLUGINS (Add monitoring, soft delete, etc.)
// ============================================
// Add soft delete plugin
adminVendorSchema.methods.softDelete = async function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = 'deactivated';
  return this.save();
};

// ============================================
// EXPORT
// ============================================
const AdminVendor = mongoose.model('AdminVendor', adminVendorSchema);

export default AdminVendor;