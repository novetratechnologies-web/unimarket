import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // ============================================
  // ORDER IDENTIFICATION
  // ============================================
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  orderId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  cartId: {
    type: String,
    index: true
  },
  
  // ============================================
  // CUSTOMER INFORMATION
  // ============================================
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  guestEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  guestDetails: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  
  // ============================================
  // VENDOR INFORMATION (Multi-Vendor)
  // ============================================
  vendors: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor',
      required: true,
      index: true
    },
    storeName: String,
    storeSlug: String,
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem'
    }],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      min: 0,
      default: 0
    },
    shipping: {
      type: Number,
      min: 0,
      default: 0
    },
    tax: {
      type: Number,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    commission: {
      type: Number,
      min: 0,
      default: 0
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    vendorEarnings: {
      type: Number,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },
    statusHistory: [{
      status: String,
      note: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      changedAt: {
        type: Date,
        default: Date.now
      }
    }],
    tracking: [{
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      status: String,
      estimatedDelivery: Date,
      shippedAt: Date,
      deliveredAt: Date,
      lastUpdated: Date
    }],
    fulfillmentStatus: {
      type: String,
      enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled'],
      default: 'unfulfilled'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod'
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============================================
  // ORDER ITEMS
  // ============================================
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],
  itemCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueItemCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ============================================
  // PRICING SUMMARY
  // ============================================
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: 0
  },
  
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  subtotalBeforeDiscounts: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Discounts
  discountTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  discounts: [{
    type: {
      type: String,
      enum: ['coupon', 'bulk', 'seasonal', 'vendor', 'admin', 'automatic'],
      required: true
    },
    code: String,
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'free_shipping'],
        required: true
      },
      value: Number
    },
    appliedTo: {
      type: String,
      enum: ['order', 'shipping', 'specific_items'],
      default: 'order'
    },
    itemIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem'
    }],
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Shipping
  shippingTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  shippingDiscount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Tax
  taxTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  taxBreakdown: [{
    name: String,
    rate: Number,
    amount: Number,
    jurisdiction: String
  }],
  
  // Total
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPaid: {
    type: Number,
    min: 0,
    default: 0
  },
  totalRefunded: {
    type: Number,
    min: 0,
    default: 0
  },
  balanceDue: {
    type: Number,
    min: 0,
    default: 0,
    virtual: true,
    get: function() {
      return this.total - this.totalPaid + this.totalRefunded;
    }
  },
  
  // ============================================
  // SHIPPING INFORMATION
  // ============================================
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    countryCode: {
      type: String,
      uppercase: true,
      minlength: 2,
      maxlength: 2
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 500
    },
    latitude: Number,
    longitude: Number,
    isResidential: {
      type: Boolean,
      default: true
    },
    isPoBox: {
      type: Boolean,
      default: false
    },
    validated: {
      type: Boolean,
      default: false
    },
    validationResponse: mongoose.Schema.Types.Mixed
  },
  
  shippingMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingMethod'
  },
  shippingMethodName: String,
  shippingCarrier: String,
  shippingService: String,
  shippingSpeed: String,
  shippingEstimatedDays: {
    min: Number,
    max: Number
  },
  shippingEstimatedDelivery: Date,
  shippingGuaranteed: {
    type: Boolean,
    default: false
  },
  shippingSignatureRequired: {
    type: Boolean,
    default: false
  },
  shippingInsurance: {
    type: Boolean,
    default: false
  },
  shippingInsuranceAmount: {
    type: Number,
    min: 0
  },
  
  shippingTracking: [{
    carrier: String,
    trackingNumber: {
      type: String,
      index: true
    },
    trackingUrl: String,
    status: {
      type: String,
      enum: ['pending', 'info_received', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'exception', 'returned'],
      default: 'pending'
    },
    statusDetails: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    signedBy: String,
    events: [{
      date: Date,
      status: String,
      description: String,
      location: String,
      latitude: Number,
      longitude: Number
    }],
    lastUpdated: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // ============================================
  // BILLING INFORMATION
  // ============================================
  billingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    countryCode: String,
    phone: String,
    email: String
  },
  billingSameAsShipping: {
    type: Boolean,
    default: true
  },
  
  // ============================================
  // PAYMENT INFORMATION
  // ============================================
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  paymentMethodName: String,
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'cash', 'bank_transfer', 'wallet', 'other'],
    default: 'stripe'
  },
  paymentProviderId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'authorized', 'paid', 'partially_paid', 'failed', 'refunded', 'partially_refunded', 'disputed', 'chargeback'],
    default: 'pending',
    index: true
  },
  paymentStatusHistory: [{
    status: String,
    note: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    }
  }],
  
  payments: [{
    transactionId: {
      type: String,
      index: true
    },
    provider: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: String,
    cardLast4: String,
    cardBrand: String,
    billingDetails: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  refunds: [{
    refundId: {
      type: String,
      index: true
    },
    transactionId: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: ['customer_request', 'damaged', 'defective', 'wrong_item', 'not_as_described', 'shipping_delay', 'other'],
      required: true
    },
    reasonText: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    items: [{
      orderItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
      },
      quantity: Number,
      amount: Number
    }],
    restockingFee: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    restockingFeeAmount: Number,
    notes: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    processedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============================================
  // ORDER STATUS
  // ============================================
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, payment pending
      'processing',        // Payment confirmed, processing
      'confirmed',         // Order confirmed by vendor
      'shipped',          // Partially or fully shipped
      'delivered',        // Delivered to customer
      'cancelled',        // Cancelled before fulfillment
      'refunded',         // Fully refunded
      'partially_refunded', // Partially refunded
      'disputed',         // Customer dispute
      'on_hold',          // Held for review
      'failed',           // Payment failed
      'abandoned'         // Cart abandoned
    ],
    default: 'pending',
    index: true
  },
  
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    note: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled'],
    default: 'unfulfilled',
    index: true
  },
  
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    cancelledAt: Date,
    reason: String,
    reasonCode: {
      type: String,
      enum: ['customer_request', 'payment_failed', 'fraud', 'out_of_stock', 'other']
    },
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    approvedAt: Date
  },
  
  // ============================================
  // COUPONS & PROMOTIONS
  // ============================================
  coupons: [{
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    code: String,
    discountAmount: Number,
    discountType: String
  }],
  
  giftCards: [{
    giftCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftCard'
    },
    code: String,
    amount: Number,
    remainingBalance: Number
  }],
  
  storeCredits: [{
    amount: Number,
    creditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreCredit'
    },
    appliedAt: Date
  }],
  
  // ============================================
  // CUSTOMER COMMUNICATION
  // ============================================
  customerNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  adminNotes: [{
    note: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'issue', 'resolution', 'other'],
      default: 'info'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  vendorNotes: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: Date,
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // ============================================
  // TAX INFORMATION
  // ============================================
  taxCalculation: {
    method: {
      type: String,
      enum: ['origin', 'destination'],
      default: 'destination'
    },
    nexus: [{
      region: String,
      rate: Number,
      amount: Number
    }],
    customerTaxExempt: {
      type: Boolean,
      default: false
    },
    customerTaxExemptReason: String,
    taxCollectedBy: {
      type: String,
      enum: ['seller', 'marketplace', 'customer'],
      default: 'seller'
    }
  },
  
  // ============================================
  // ORDER SOURCE & ATTRIBUTION
  // ============================================
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'admin', 'api', 'pos', 'marketplace', 'social_media'],
    default: 'website',
    index: true
  },
  
  sourceDetails: {
    channel: String,
    campaign: String,
    source: String,
    medium: String,
    term: String,
    content: String,
    referrer: String,
    landingPage: String,
    utmParams: mongoose.Schema.Types.Mixed
  },
  
  ipAddress: String,
  userAgent: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'other']
  },
  browser: String,
  platform: String,
  
  location: {
    ip: String,
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  
  // ============================================
  // MARKETING ATTRIBUTION
  // ============================================
  attribution: {
    affiliate: {
      id: mongoose.Schema.Types.ObjectId,
      code: String,
      commission: Number
    },
    referral: {
      code: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      discount: Number
    },
    campaign: String,
    adGroup: String,
    ad: String,
    keyword: String
  },
  
  // ============================================
  // CUSTOMER ENGAGEMENT
  // ============================================
  customerAcquisition: {
    type: {
      type: String,
      enum: ['organic', 'paid', 'referral', 'social', 'email', 'direct', 'other'],
      default: 'organic'
    },
    cost: Number,
    date: Date
  },
  
  // ============================================
  // ORDER METRICS
  // ============================================
  metrics: {
    processingTime: {
      type: Number, // In hours
      default: 0
    },
    fulfillmentTime: {
      type: Number, // In hours
      default: 0
    },
    shippingTime: {
      type: Number, // In hours
      default: 0
    },
    deliveryTime: {
      type: Number, // In hours
      default: 0
    },
    totalTimeToDeliver: {
      type: Number, // In hours
      default: 0
    },
    firstResponseTime: {
      type: Number, // In hours
      default: 0
    },
    resolutionTime: {
      type: Number, // In hours
      default: 0
    }
  },
  
  // ============================================
  // FRAUD DETECTION
  // ============================================
  fraudCheck: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    flags: [String],
    rules: [{
      rule: String,
      score: Number,
      reason: String,
      triggered: Boolean
    }],
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'review'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    reviewedAt: Date,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // ============================================
  // CUSTOMER SATISFACTION
  // ============================================
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    feedbackCategories: [String],
    surveySent: {
      type: Boolean,
      default: false
    },
    surveyResponded: {
      type: Boolean,
      default: false
    },
    surveyResponseDate: Date,
    nps: {
      type: Number,
      min: -100,
      max: 100
    },
    csat: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // ============================================
  // INTERNATIONAL ORDERS
  // ============================================
  isInternational: {
    type: Boolean,
    default: false
  },
  customs: {
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    harmonizedCode: String,
    invoiceNumber: String,
    invoiceDate: Date,
    incoterms: {
      type: String,
      enum: ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']
    },
    duties: {
      type: Number,
      default: 0
    },
    dutiesPaidBy: {
      type: String,
      enum: ['seller', 'buyer', 'marketplace'],
      default: 'buyer'
    },
    taxes: {
      type: Number,
      default: 0
    },
    taxesPaidBy: {
      type: String,
      enum: ['seller', 'buyer', 'marketplace'],
      default: 'buyer'
    }
  },
  
  // ============================================
  // SUBSCRIPTION ORDERS
  // ============================================
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscription: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    frequency: String,
    interval: Number,
    intervalUnit: String,
    nextOrderDate: Date,
    orderNumber: Number,
    totalOrders: Number
  },
  
  // ============================================
  // POS ORDERS
  // ============================================
  isPosOrder: {
    type: Boolean,
    default: false
  },
  pos: {
    location: String,
    terminal: String,
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    registerId: String,
    receiptNumber: String
  },
  
  // ============================================
  // ORDER TAGS & CUSTOM FIELDS
  // ============================================
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  
  customFields: [{
    name: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select'],
      default: 'text'
    }
  }],
  
  // ============================================
  // METADATA & AUDIT
  // ============================================
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
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
  deleteReason: String,
  
  // ============================================
  // TIMESTAMPS
  // ============================================
  orderDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  refundedAt: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.metadata;
      delete ret.customFields;
      delete ret.adminNotes;
      delete ret.vendorNotes;
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ guestEmail: 1, orderDate: -1 });
orderSchema.index({ 'vendors.vendor': 1, orderDate: -1 });
orderSchema.index({ 'vendors.status': 1, orderDate: -1 });

// Status indexes
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1, createdAt: -1 });

// Date range indexes
orderSchema.index({ orderDate: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ completedAt: -1 });

// Search indexes
orderSchema.index({ 
  orderNumber: 'text', 
  guestEmail: 'text',
  'shippingAddress.firstName': 'text',
  'shippingAddress.lastName': 'text',
  'billingAddress.firstName': 'text',
  'billingAddress.lastName': 'text',
  tags: 'text'
}, {
  weights: {
    orderNumber: 10,
    guestEmail: 8,
    'shippingAddress.firstName': 5,
    'shippingAddress.lastName': 5,
    'billingAddress.firstName': 3,
    'billingAddress.lastName': 3,
    tags: 2
  },
  name: 'order_search_index'
});

// Compound indexes for common queries
orderSchema.index({ customer: 1, status: 1, orderDate: -1 });
orderSchema.index({ 'vendors.vendor': 1, 'vendors.status': 1, orderDate: -1 });
orderSchema.index({ source: 1, orderDate: -1 });
orderSchema.index({ paymentProvider: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ 'shippingTracking.trackingNumber': 1 }, { sparse: true });
orderSchema.index({ 'fraudCheck.status': 1, orderDate: -1 });

// Partial indexes
orderSchema.index({ cancelledAt: 1 }, { 
  partialFilterExpression: { status: 'cancelled' } 
});

orderSchema.index({ completedAt: 1 }, { 
  partialFilterExpression: { status: 'delivered' } 
});

// ============================================
// VIRTUALS
// ============================================

/**
 * Order age in days
 */
orderSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

/**
 * Formatted total
 */
orderSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.total);
});

/**
 * Formatted subtotal
 */
orderSchema.virtual('formattedSubtotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.subtotal);
});

/**
 * Customer full name
 */
orderSchema.virtual('customerName').get(function() {
  if (this.customer) {
    return this.customer.fullName;
  }
  if (this.guestDetails) {
    return `${this.guestDetails.firstName || ''} ${this.guestDetails.lastName || ''}`.trim();
  }
  return this.shippingAddress?.firstName + ' ' + this.shippingAddress?.lastName || 'Unknown';
});

/**
 * Customer email
 */
orderSchema.virtual('customerEmail').get(function() {
  if (this.customer) {
    return this.customer.email;
  }
  if (this.guestDetails?.email) {
    return this.guestDetails.email;
  }
  return this.shippingAddress?.email || this.guestEmail || null;
});

/**
 * Customer phone
 */
orderSchema.virtual('customerPhone').get(function() {
  if (this.customer) {
    return this.customer.phoneNumber;
  }
  if (this.guestDetails?.phone) {
    return this.guestDetails.phone;
  }
  return this.shippingAddress?.phone || null;
});

/**
 * Is guest order
 */
orderSchema.virtual('isGuest').get(function() {
  return !this.customer && !!this.guestEmail;
});

/**
 * Is fully paid
 */
orderSchema.virtual('isPaid').get(function() {
  return this.totalPaid >= this.total;
});

/**
 * Is fully refunded
 */
orderSchema.virtual('isFullyRefunded').get(function() {
  return this.totalRefunded >= this.total;
});

/**
 * Has tracking
 */
orderSchema.virtual('hasTracking').get(function() {
  return this.shippingTracking && this.shippingTracking.length > 0;
});

/**
 * Days since order
 */
orderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

/**
 * Days since last update
 */
orderSchema.virtual('daysSinceUpdate').get(function() {
  return Math.floor((Date.now() - this.updatedAt) / (1000 * 60 * 60 * 24));
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Generate order number before save
 */
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders today for sequential number
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequential = (count + 1).toString().padStart(4, '0');
    
    // Format: INV-YYMMDD-0001
    this.orderNumber = `INV-${year}${month}${day}-${sequential}`;
  }
  
  // Update timestamps
  this.updatedAt = new Date();
  
  // Update vendor timestamps
  if (this.vendors && this.vendors.length > 0) {
    this.vendors.forEach(vendor => {
      vendor.updatedAt = new Date();
    });
  }
  
  // Calculate metrics
  if (this.status === 'delivered' && !this.completedAt) {
    this.completedAt = new Date();
    
    // Calculate delivery time
    if (this.orderDate) {
      this.metrics.totalTimeToDeliver = Math.round(
        (this.completedAt - this.orderDate) / (1000 * 60 * 60)
      );
    }
  }
  
  // Calculate balance
  this.balanceDue = this.total - this.totalPaid + this.totalRefunded;
  
  next();
});

/**
 * Update fulfillment status based on vendor statuses
 */
orderSchema.pre('save', function(next) {
  if (this.vendors && this.vendors.length > 0) {
    const vendorStatuses = this.vendors.map(v => v.status);
    
    if (vendorStatuses.every(s => s === 'delivered')) {
      this.fulfillmentStatus = 'fulfilled';
    } else if (vendorStatuses.some(s => s === 'shipped' || s === 'delivered') && 
               vendorStatuses.some(s => s === 'pending' || s === 'processing')) {
      this.fulfillmentStatus = 'partially_fulfilled';
    } else if (vendorStatuses.every(s => s === 'cancelled')) {
      this.fulfillmentStatus = 'cancelled';
    }
  }
  
  next();
});

/**
 * Update payment status based on payments
 */
orderSchema.pre('save', function(next) {
  if (this.payments && this.payments.length > 0) {
    const totalPaid = this.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    this.totalPaid = totalPaid;
    
    if (totalPaid >= this.total) {
      this.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      this.paymentStatus = 'partially_paid';
    }
  }
  
  next();
});

// ============================================
// PRE-FIND MIDDLEWARE
// ============================================

/**
 * Exclude deleted orders by default
 */
orderSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Update order status
 */
orderSchema.methods.updateStatus = async function(status, options = {}) {
  const { note, changedBy, metadata } = options;
  
  const oldStatus = this.status;
  
  // Add to status history
  this.statusHistory.push({
    status,
    note: note || `Status changed from ${oldStatus} to ${status}`,
    changedBy,
    changedAt: new Date(),
    metadata
  });
  
  this.status = status;
  this.updatedAt = new Date();
  
  // Handle special statuses
  switch (status) {
    case 'cancelled':
      this.cancelledAt = new Date();
      this.cancellation = {
        cancelledBy: changedBy,
        cancelledAt: new Date(),
        reason: note,
        ...options.cancellation
      };
      break;
    case 'delivered':
      this.completedAt = new Date();
      this.metrics.totalTimeToDeliver = Math.round(
        (this.completedAt - this.orderDate) / (1000 * 60 * 60)
      );
      break;
    case 'processing':
      this.processedAt = new Date();
      break;
  }
  
  return this.save();
};

/**
 * Add payment
 */
orderSchema.methods.addPayment = async function(paymentData) {
  const payment = {
    transactionId: paymentData.transactionId || `TR-${Date.now()}`,
    provider: paymentData.provider,
    amount: paymentData.amount,
    currency: paymentData.currency || this.currency,
    status: paymentData.status || 'completed',
    method: paymentData.method,
    cardLast4: paymentData.cardLast4,
    cardBrand: paymentData.cardBrand,
    billingDetails: paymentData.billingDetails,
    metadata: paymentData.metadata,
    processedAt: new Date(),
    processedBy: paymentData.processedBy,
    createdAt: new Date()
  };
  
  this.payments.push(payment);
  
  // Update total paid
  if (payment.status === 'completed') {
    this.totalPaid += payment.amount;
  }
  
  // Update payment status
  if (this.totalPaid >= this.total) {
    this.paymentStatus = 'paid';
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'partially_paid';
  }
  
  // Add to payment status history
  this.paymentStatusHistory.push({
    status: this.paymentStatus,
    note: `Payment added: ${payment.amount} ${payment.currency}`,
    changedAt: new Date(),
    changedBy: payment.processedBy
  });
  
  return this.save();
};

/**
 * Process refund
 */
orderSchema.methods.processRefund = async function(refundData) {
  const refund = {
    refundId: refundData.refundId || `REF-${Date.now()}`,
    transactionId: refundData.transactionId,
    amount: refundData.amount,
    reason: refundData.reason,
    reasonText: refundData.reasonText,
    status: 'completed',
    items: refundData.items || [],
    restockingFee: refundData.restockingFee || 0,
    notes: refundData.notes,
    processedBy: refundData.processedBy,
    processedAt: new Date(),
    metadata: refundData.metadata,
    createdAt: new Date()
  };
  
  // Calculate restocking fee amount
  if (refund.restockingFee > 0 && refund.items.length > 0) {
    const itemTotal = refund.items.reduce((sum, item) => sum + item.amount, 0);
    refund.restockingFeeAmount = (itemTotal * refund.restockingFee) / 100;
    refund.amount -= refund.restockingFeeAmount;
  }
  
  this.refunds.push(refund);
  this.totalRefunded += refund.amount;
  
  // Update payment status
  if (this.totalRefunded >= this.total) {
    this.paymentStatus = 'refunded';
  } else if (this.totalRefunded > 0) {
    this.paymentStatus = 'partially_refunded';
  }
  
  // Add to payment status history
  this.paymentStatusHistory.push({
    status: this.paymentStatus,
    note: `Refund processed: ${refund.amount} ${this.currency} - ${refund.reason}`,
    changedAt: new Date(),
    changedBy: refund.processedBy
  });
  
  return this.save();
};

/**
 * Add tracking information
 */
orderSchema.methods.addTracking = async function(vendorId, trackingData) {
  const vendor = this.vendors.find(v => v.vendor.toString() === vendorId.toString());
  
  if (vendor) {
    vendor.tracking.push({
      carrier: trackingData.carrier,
      trackingNumber: trackingData.trackingNumber,
      trackingUrl: trackingData.trackingUrl,
      status: trackingData.status || 'pending',
      estimatedDelivery: trackingData.estimatedDelivery,
      shippedAt: trackingData.shippedAt || new Date(),
      lastUpdated: new Date(),
      events: trackingData.events || []
    });
    
    vendor.status = 'shipped';
    vendor.fulfillmentStatus = 'fulfilled';
    vendor.updatedAt = new Date();
    
    vendor.statusHistory.push({
      status: 'shipped',
      note: `Order shipped via ${trackingData.carrier} - Tracking: ${trackingData.trackingNumber}`,
      changedBy: vendorId,
      changedAt: new Date()
    });
  }
  
  // Also add to main shipping tracking
  this.shippingTracking.push({
    carrier: trackingData.carrier,
    trackingNumber: trackingData.trackingNumber,
    trackingUrl: trackingData.trackingUrl,
    status: trackingData.status || 'pending',
    estimatedDelivery: trackingData.estimatedDelivery,
    shippedAt: trackingData.shippedAt || new Date(),
    lastUpdated: new Date(),
    events: trackingData.events || []
  });
  
  return this.save();
};

/**
 * Update tracking status
 */
orderSchema.methods.updateTracking = async function(trackingNumber, trackingData) {
  // Update vendor tracking
  this.vendors.forEach(vendor => {
    const tracking = vendor.tracking.find(t => t.trackingNumber === trackingNumber);
    if (tracking) {
      Object.assign(tracking, trackingData);
      tracking.lastUpdated = new Date();
      
      if (trackingData.events) {
        tracking.events.push(...trackingData.events);
      }
      
      if (tracking.status === 'delivered') {
        tracking.deliveredAt = new Date();
        vendor.status = 'delivered';
      }
    }
  });
  
  // Update main tracking
  const mainTracking = this.shippingTracking.find(t => t.trackingNumber === trackingNumber);
  if (mainTracking) {
    Object.assign(mainTracking, trackingData);
    mainTracking.lastUpdated = new Date();
    
    if (trackingData.events) {
      mainTracking.events.push(...trackingData.events);
    }
  }
  
  return this.save();
};

/**
 * Add admin note
 */
orderSchema.methods.addAdminNote = async function(note, createdBy, options = {}) {
  this.adminNotes.push({
    note,
    createdBy,
    createdAt: new Date(),
    isPrivate: options.isPrivate !== false,
    type: options.type || 'info',
    metadata: options.metadata
  });
  
  return this.save();
};

/**
 * Add vendor note
 */
orderSchema.methods.addVendorNote = async function(vendorId, note, createdBy) {
  this.vendorNotes.push({
    vendor: vendorId,
    note,
    createdBy,
    createdAt: new Date(),
    isPrivate: false
  });
  
  return this.save();
};

/**
 * Calculate vendor earnings
 */
orderSchema.methods.calculateVendorEarnings = function() {
  this.vendors.forEach(vendor => {
    vendor.vendorEarnings = vendor.total - vendor.commission;
  });
  
  return this.vendors;
};

/**
 * Check if order is eligible for cancellation
 */
orderSchema.methods.canCancel = function() {
  const cancellableStatuses = ['pending', 'processing'];
  const vendorCancellable = this.vendors.every(v => 
    ['pending', 'processing'].includes(v.status)
  );
  
  return cancellableStatuses.includes(this.status) && vendorCancellable;
};

/**
 * Soft delete
 */
orderSchema.methods.softDelete = async function(deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  
  return this.save();
};

/**
 * Restore soft deleted order
 */
orderSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deleteReason = null;
  
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get orders by customer
 */
orderSchema.statics.findByCustomer = function(customerId, options = {}) {
  const query = { customer: customerId, isDeleted: false };
  
  if (options.status) query.status = options.status;
  if (options.startDate || options.endDate) {
    query.orderDate = {};
    if (options.startDate) query.orderDate.$gte = options.startDate;
    if (options.endDate) query.orderDate.$lte = options.endDate;
  }
  
  return this.find(query)
    .sort(options.sortBy || { orderDate: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Get orders by vendor
 */
orderSchema.statics.findByVendor = function(vendorId, options = {}) {
  const query = { 
    'vendors.vendor': vendorId,
    isDeleted: false 
  };
  
  if (options.status) query['vendors.status'] = options.status;
  if (options.startDate || options.endDate) {
    query.orderDate = {};
    if (options.startDate) query.orderDate.$gte = options.startDate;
    if (options.endDate) query.orderDate.$lte = options.endDate;
  }
  
  return this.find(query)
    .sort(options.sortBy || { orderDate: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Get revenue statistics
 */
orderSchema.statics.getRevenueStats = async function(startDate, endDate, groupBy = 'day') {
  const match = {
    isDeleted: false,
    paymentStatus: { $in: ['paid', 'partially_paid'] },
    status: { $ne: 'cancelled' }
  };
  
  if (startDate || endDate) {
    match.orderDate = {};
    if (startDate) match.orderDate.$gte = startDate;
    if (endDate) match.orderDate.$lte = endDate;
  }
  
  let groupId;
  switch (groupBy) {
    case 'hour':
      groupId = { $dateToString: { format: '%Y-%m-%d-%H', date: '$orderDate' } };
      break;
    case 'day':
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } };
      break;
    case 'week':
      groupId = { $dateToString: { format: '%Y-W%V', date: '$orderDate' } };
      break;
    case 'month':
      groupId = { $dateToString: { format: '%Y-%m', date: '$orderDate' } };
      break;
    case 'year':
      groupId = { $dateToString: { format: '%Y', date: '$orderDate' } };
      break;
    default:
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupId,
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' },
        totalItems: { $sum: '$itemCount' },
        uniqueCustomers: { $addToSet: '$customer' }
      }
    },
    {
      $project: {
        _id: 0,
        period: '$_id',
        revenue: 1,
        orders: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        totalItems: 1,
        uniqueCustomers: { $size: '$uniqueCustomers' }
      }
    },
    { $sort: { period: 1 } }
  ]);
};

/**
 * Get order status distribution
 */
orderSchema.statics.getStatusDistribution = async function(startDate, endDate) {
  const match = {
    isDeleted: false
  };
  
  if (startDate || endDate) {
    match.orderDate = {};
    if (startDate) match.orderDate.$gte = startDate;
    if (endDate) match.orderDate.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        total: 1,
        percentage: {
          $multiply: [
            { $divide: ['$count', { $sum: '$count' }] },
            100
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get vendor performance stats
 */
orderSchema.statics.getVendorPerformance = async function(vendorId, startDate, endDate) {
  const match = {
    'vendors.vendor': vendorId,
    isDeleted: false,
    paymentStatus: { $in: ['paid', 'partially_paid'] }
  };
  
  if (startDate || endDate) {
    match.orderDate = {};
    if (startDate) match.orderDate.$gte = startDate;
    if (endDate) match.orderDate.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    { $unwind: '$vendors' },
    { $match: { 'vendors.vendor': vendorId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$vendors.total' },
        totalCommission: { $sum: '$vendors.commission' },
        totalEarnings: { $sum: '$vendors.vendorEarnings' },
        averageOrderValue: { $avg: '$vendors.total' },
        totalItems: { $sum: { $size: '$vendors.items' } },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$vendors.status', 'cancelled'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$vendors.status', 'delivered'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalCommission: { $round: ['$totalCommission', 2] },
        totalEarnings: { $round: ['$totalEarnings', 2] },
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        totalItems: 1,
        cancellationRate: {
          $round: [
            { $multiply: [{ $divide: ['$cancelledOrders', '$totalOrders'] }, 100] },
            2
          ]
        },
        deliveryRate: {
          $round: [
            { $multiply: [{ $divide: ['$deliveredOrders', '$totalOrders'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

/**
 * Get customer purchase history
 */
orderSchema.statics.getCustomerPurchaseHistory = async function(customerId, limit = 10) {
  return this.find({
    customer: customerId,
    isDeleted: false,
    status: 'delivered'
  })
    .sort({ orderDate: -1 })
    .limit(limit)
    .populate('items')
    .populate('vendors.vendor', 'vendorProfile.storeName');
};

/**
 * Clean up old orders
 */
orderSchema.statics.cleanup = async function(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    orderDate: { $lt: cutoffDate },
    status: { $in: ['delivered', 'cancelled', 'refunded'] },
    isDeleted: true
  });
};

// ============================================
// EXPORT
// ============================================

const Order = mongoose.model('Order', orderSchema);

export default Order;