import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  // ============================================
  // PAYOUT IDENTIFICATION
  // ============================================
  payoutNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  payoutId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // ============================================
  // VENDOR INFORMATION
  // ============================================
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor',
    required: true,
    index: true
  },
  vendorDetails: {
    storeName: String,
    storeSlug: String,
    email: String,
    phone: String,
    bankDetails: {
      accountHolderName: String,
      accountNumber: {
        type: String,
        select: false // Encrypted in production
      },
      bankName: String,
      routingNumber: {
        type: String,
        select: false
      },
      swiftCode: String,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    paypalEmail: String,
    stripeAccountId: String
  },
  
  // ============================================
  // PAYOUT PERIOD
  // ============================================
  period: {
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'custom'],
      default: 'weekly',
      index: true
    }
  },
  
  // ============================================
  // FINANCIAL SUMMARY
  // ============================================
  summary: {
    // Sales
    totalSales: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalOrders: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalItems: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    // Revenue Breakdown
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discountTotal: {
      type: Number,
      min: 0,
      default: 0
    },
    shippingTotal: {
      type: Number,
      min: 0,
      default: 0
    },
    taxTotal: {
      type: Number,
      min: 0,
      default: 0
    },
    grossRevenue: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // Commissions
    commission: {
      rate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      amount: {
        type: Number,
        min: 0,
        default: 0
      },
      breakdown: [{
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order'
        },
        orderNumber: String,
        amount: Number,
        rate: Number,
        calculated: Number
      }]
    },
    
    // Adjustments
    adjustments: {
      total: {
        type: Number,
        default: 0
      },
      items: [{
        type: {
          type: String,
          enum: ['credit', 'debit', 'correction', 'bonus', 'penalty', 'fee'],
          required: true
        },
        reason: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        description: String,
        reference: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminVendor'
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminVendor'
        },
        approvedAt: Date,
        metadata: mongoose.Schema.Types.Mixed
      }]
    },
    
    // Refunds
    refunds: {
      total: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      },
      items: [{
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order'
        },
        orderNumber: String,
        refundId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order.refunds'
        },
        amount: Number,
        reason: String,
        processedAt: Date
      }]
    },
    
    // Net Amount
    netAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  
  // ============================================
  // ORDER DETAILS
  // ============================================
  orders: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    orderDate: Date,
    items: [{
      orderItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
      },
      productName: String,
      productSku: String,
      quantity: Number,
      price: Number,
      discount: Number,
      total: Number,
      commission: Number
    }],
    subtotal: Number,
    discount: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    commission: Number,
    commissionRate: Number,
    vendorEarnings: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'delivered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid'
    },
    paidAt: Date
  }],
  
  // ============================================
  // PAYMENT DETAILS
  // ============================================
  paymentMethod: {
    type: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'wallet', 'other'],
      required: true,
      index: true
    },
    label: String,
    description: String
  },
  
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String,
    iban: String,
    branchName: String,
    branchCode: String,
    country: String,
    currency: {
      type: String,
      default: 'USD'
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  
  paypalDetails: {
    email: String,
    transactionId: String,
    payerId: String,
    paymentId: String
  },
  
  stripeDetails: {
    accountId: String,
    transferId: String,
    transferGroup: String,
    destinationPaymentId: String
  },
  
  checkDetails: {
    payeeName: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    checkNumber: String,
    mailedAt: Date,
    estimatedDelivery: Date
  },
  
  // ============================================
  // TRANSACTION INFORMATION
  // ============================================
  transaction: {
    id: {
      type: String,
      index: true,
      sparse: true
    },
    reference: String,
    provider: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    initiatedAt: Date,
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    failureReason: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // ============================================
  // INVOICE
  // ============================================
  invoice: {
    number: String,
    url: String,
    pdfUrl: String,
    generatedAt: Date,
    sentAt: Date,
    downloadedAt: Date
  },
  
  // ============================================
  // PAYOUT STATUS
  // ============================================
  status: {
    type: String,
    enum: [
      'draft',           // Initial state, not yet processed
      'pending',         // Awaiting approval
      'approved',        // Approved but not yet processed
      'processing',      // Being processed by payment provider
      'paid',           // Successfully paid
      'failed',         // Payment failed
      'cancelled',      // Cancelled before processing
      'reversed',       // Payment reversed/charged back
      'on_hold'         // Held for review
    ],
    default: 'draft',
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
    notes: String,
    reviewDate: Date
  },
  
  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: {
    vendorNotified: {
      type: Boolean,
      default: false
    },
    vendorNotifiedAt: Date,
    adminNotified: {
      type: Boolean,
      default: false
    },
    adminNotifiedAt: Date,
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date
  },
  
  // ============================================
  // TAX & COMPLIANCE
  // ============================================
  tax: {
    withholding: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    withholdingAmount: {
      type: Number,
      default: 0
    },
    taxId: String,
    taxCountry: String,
    taxRegion: String,
    taxRate: Number,
    taxAmount: Number,
    exempt: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date
    }]
  },
  
  // ============================================
  // SCHEDULING
  // ============================================
  scheduling: {
    scheduledDate: {
      type: Date,
      index: true
    },
    actualDate: Date,
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly'
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31
      },
      nextPayoutDate: Date
    }
  },
  
  // ============================================
  // NOTES & ATTACHMENTS
  // ============================================
  notes: [{
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
      default: false
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'issue', 'resolution', 'other'],
      default: 'info'
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number
    }]
  }],
  
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
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
  paidAt: Date,
  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.metadata;
      delete ret.attachments;
      delete ret.notes;
      if (ret.bankDetails) {
        delete ret.bankDetails.accountNumber;
        delete ret.bankDetails.routingNumber;
      }
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
payoutSchema.index({ payoutNumber: 1 });
payoutSchema.index({ vendor: 1, createdAt: -1 });
payoutSchema.index({ vendor: 1, status: 1, createdAt: -1 });
payoutSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
payoutSchema.index({ status: 1, 'scheduling.scheduledDate': 1 });
payoutSchema.index({ 'paymentMethod.type': 1, status: 1 });
payoutSchema.index({ 'transaction.id': 1 }, { sparse: true });

// Compound indexes for common queries
payoutSchema.index({ vendor: 1, status: 1, 'period.startDate': -1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ 'approval.status': 1, createdAt: -1 });

// Partial indexes
payoutSchema.index({ paidAt: 1 }, { 
  partialFilterExpression: { status: 'paid' } 
});

payoutSchema.index({ 'scheduling.scheduledDate': 1 }, {
  partialFilterExpression: { 
    status: 'approved',
    'scheduling.scheduledDate': { $exists: true }
  }
});

// ============================================
// VIRTUALS
// ============================================

/**
 * Payout age in days
 */
payoutSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

/**
 * Formatted net amount
 */
payoutSchema.virtual('formattedNetAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.bankDetails?.currency || 'USD'
  }).format(this.summary.netAmount);
});

/**
 * Formatted total sales
 */
payoutSchema.virtual('formattedTotalSales').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.bankDetails?.currency || 'USD'
  }).format(this.summary.totalSales);
});

/**
 * Days since payout was created
 */
payoutSchema.virtual('daysSinceCreation').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

/**
 * Days until scheduled payout
 */
payoutSchema.virtual('daysUntilScheduled').get(function() {
  if (!this.scheduling?.scheduledDate) return null;
  return Math.ceil((this.scheduling.scheduledDate - Date.now()) / (1000 * 60 * 60 * 24));
});

/**
 * Is overdue
 */
payoutSchema.virtual('isOverdue').get(function() {
  if (!this.scheduling?.scheduledDate) return false;
  return this.scheduling.scheduledDate < new Date() && 
         ['approved', 'pending'].includes(this.status);
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Generate payout number before save
 */
payoutSchema.pre('save', async function(next) {
  if (this.isNew && !this.payoutNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of payouts this month for sequential number
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const sequential = (count + 1).toString().padStart(4, '0');
    
    // Format: PO-YYYYMM-0001
    this.payoutNumber = `PO-${year}${month}-${sequential}`;
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  // Calculate net amount
  if (this.summary) {
    this.summary.netAmount = 
      this.summary.grossRevenue + 
      this.summary.adjustments.total - 
      this.summary.commission.amount - 
      this.summary.refunds.total;
  }
  
  next();
});

/**
 * Validate payout before saving
 */
payoutSchema.pre('save', function(next) {
  // Check if payout amount meets minimum threshold
  const minPayout = this.vendorDetails?.bankDetails?.minimumPayout || 50;
  
  if (this.status === 'approved' && this.summary.netAmount < minPayout) {
    const error = new Error(`Payout amount $${this.summary.netAmount} is below minimum threshold of $${minPayout}`);
    error.code = 'BELOW_MINIMUM';
    return next(error);
  }
  
  // Check if payout period is valid
  if (this.period.startDate && this.period.endDate) {
    if (this.period.startDate > this.period.endDate) {
      const error = new Error('Start date cannot be after end date');
      error.code = 'INVALID_PERIOD';
      return next(error);
    }
  }
  
  next();
});

// ============================================
// PRE-FIND MIDDLEWARE
// ============================================

/**
 * Exclude deleted payouts by default
 */
payoutSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Update payout status
 */
payoutSchema.methods.updateStatus = async function(status, options = {}) {
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
    case 'paid':
      this.paidAt = new Date();
      this.transaction.completedAt = new Date();
      this.transaction.status = 'completed';
      break;
    case 'processing':
      this.processedAt = new Date();
      this.transaction.processedAt = new Date();
      this.transaction.status = 'processing';
      break;
    case 'failed':
      this.transaction.failedAt = new Date();
      this.transaction.status = 'failed';
      this.transaction.failureReason = metadata?.failureReason;
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  return this.save();
};

/**
 * Add adjustment
 */
payoutSchema.methods.addAdjustment = async function(adjustmentData, createdBy) {
  const adjustment = {
    ...adjustmentData,
    createdBy,
    createdAt: new Date()
  };
  
  if (!this.summary.adjustments) {
    this.summary.adjustments = { total: 0, items: [] };
  }
  
  this.summary.adjustments.items.push(adjustment);
  this.summary.adjustments.total += adjustment.amount;
  
  // Recalculate net amount
  this.summary.netAmount = 
    this.summary.grossRevenue + 
    this.summary.adjustments.total - 
    this.summary.commission.amount - 
    this.summary.refunds.total;
  
  return this.save();
};

/**
 * Add note
 */
payoutSchema.methods.addNote = async function(noteData, createdBy) {
  const note = {
    ...noteData,
    createdBy,
    createdAt: new Date()
  };
  
  this.notes.push(note);
  return this.save();
};

/**
 * Process payout
 */
payoutSchema.methods.process = async function(processedBy) {
  // Update status
  await this.updateStatus('processing', {
    note: 'Payout processing initiated',
    changedBy: processedBy
  });
  
  // Here you would integrate with payment provider
  // This is a placeholder for actual payment processing
  
  return this;
};

/**
 * Mark as paid
 */
payoutSchema.methods.markAsPaid = async function(transactionData, processedBy) {
  this.transaction = {
    ...this.transaction,
    ...transactionData,
    status: 'completed',
    completedAt: new Date()
  };
  
  this.paidAt = new Date();
  this.scheduling.actualDate = new Date();
  
  await this.updateStatus('paid', {
    note: `Payout completed. Transaction ID: ${transactionData.id}`,
    changedBy: processedBy
  });
  
  return this;
};

/**
 * Mark as failed
 */
payoutSchema.methods.markAsFailed = async function(failureReason, processedBy) {
  this.transaction.status = 'failed';
  this.transaction.failedAt = new Date();
  this.transaction.failureReason = failureReason;
  
  await this.updateStatus('failed', {
    note: `Payout failed: ${failureReason}`,
    changedBy: processedBy,
    metadata: { failureReason }
  });
  
  return this;
};

/**
 * Cancel payout
 */
payoutSchema.methods.cancel = async function(reason, cancelledBy) {
  await this.updateStatus('cancelled', {
    note: reason || 'Payout cancelled',
    changedBy: cancelledBy
  });
  
  return this;
};

/**
 * Approve payout
 */
payoutSchema.methods.approve = async function(approvedBy, notes = '') {
  this.approval.status = 'approved';
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.notes = notes;
  
  await this.updateStatus('approved', {
    note: 'Payout approved',
    changedBy: approvedBy
  });
  
  return this;
};

/**
 * Reject payout
 */
payoutSchema.methods.reject = async function(rejectionReason, rejectedBy) {
  this.approval.status = 'rejected';
  this.approval.rejectedBy = rejectedBy;
  this.approval.rejectedAt = new Date();
  this.approval.rejectionReason = rejectionReason;
  
  await this.updateStatus('cancelled', {
    note: `Payout rejected: ${rejectionReason}`,
    changedBy: rejectedBy
  });
  
  return this;
};

/**
 * Generate invoice
 */
payoutSchema.methods.generateInvoice = async function() {
  // Generate invoice PDF
  const invoiceNumber = `INV-${this.payoutNumber}`;
  
  this.invoice = {
    number: invoiceNumber,
    generatedAt: new Date(),
    url: `/invoices/${invoiceNumber}.pdf`, // Placeholder
    pdfUrl: `/invoices/${invoiceNumber}.pdf` // Placeholder
  };
  
  return this.save();
};

/**
 * Soft delete
 */
payoutSchema.methods.softDelete = async function(deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  
  return this.save();
};

/**
 * Restore soft deleted payout
 */
payoutSchema.methods.restore = async function() {
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
 * Get payouts by vendor
 */
payoutSchema.statics.findByVendor = function(vendorId, options = {}) {
  const query = { vendor: vendorId, isDeleted: false };
  
  if (options.status) query.status = options.status;
  if (options.startDate || options.endDate) {
    query['period.startDate'] = {};
    if (options.startDate) query['period.startDate'].$gte = options.startDate;
    if (options.endDate) query['period.endDate'].$lte = options.endDate;
  }
  
  return this.find(query)
    .sort(options.sortBy || { createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Get pending payouts
 */
payoutSchema.statics.getPendingPayouts = function() {
  return this.find({
    status: { $in: ['draft', 'pending', 'approved'] },
    isDeleted: false
  }).sort({ 'scheduling.scheduledDate': 1 });
};

/**
 * Get scheduled payouts
 */
payoutSchema.statics.getScheduledPayouts = function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    'scheduling.scheduledDate': { $gte: startOfDay, $lte: endOfDay },
    status: 'approved',
    isDeleted: false
  });
};

/**
 * Get payout statistics
 */
payoutSchema.statics.getStatistics = async function(vendorId = null, startDate, endDate) {
  const match = { isDeleted: false };
  
  if (vendorId) match.vendor = vendorId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPayouts: { $sum: 1 },
        totalAmount: { $sum: '$summary.netAmount' },
        totalCommission: { $sum: '$summary.commission.amount' },
        totalOrders: { $sum: '$summary.totalOrders' },
        totalSales: { $sum: '$summary.totalSales' },
        averagePayout: { $avg: '$summary.netAmount' },
        
        // Status breakdown
        paidPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$summary.netAmount', 0] }
        },
        pendingPayouts: {
          $sum: { $cond: [{ $in: ['$status', ['draft', 'pending', 'approved']] }, 1, 0] }
        },
        pendingAmount: {
          $sum: { 
            $cond: [
              { $in: ['$status', ['draft', 'pending', 'approved']] },
              '$summary.netAmount',
              0
            ]
          }
        },
        failedPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalPayouts: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        totalCommission: { $round: ['$totalCommission', 2] },
        totalOrders: 1,
        totalSales: { $round: ['$totalSales', 2] },
        averagePayout: { $round: ['$averagePayout', 2] },
        paidPayouts: 1,
        paidAmount: { $round: ['$paidAmount', 2] },
        pendingPayouts: 1,
        pendingAmount: { $round: ['$pendingAmount', 2] },
        failedPayouts: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalPayouts: 0,
    totalAmount: 0,
    totalCommission: 0,
    totalOrders: 0,
    totalSales: 0,
    averagePayout: 0,
    paidPayouts: 0,
    paidAmount: 0,
    pendingPayouts: 0,
    pendingAmount: 0,
    failedPayouts: 0
  };
};

/**
 * Generate recurring payouts
 */
payoutSchema.statics.generateRecurringPayouts = async function() {
  const vendors = await mongoose.model('AdminVendor').find({
    'vendorProfile.banking.payoutSchedule': { $exists: true },
    'vendorProfile.banking.payoutSchedule.frequency': { $ne: null },
    isDeleted: false
  });
  
  const payouts = [];
  
  for (const vendor of vendors) {
    const schedule = vendor.vendorProfile.banking.payoutSchedule;
    const nextPayoutDate = calculateNextPayoutDate(schedule);
    
    // Check if payout should be generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (nextPayoutDate.getTime() === today.getTime()) {
      // Generate payout for the period
      const periodStart = calculatePeriodStart(schedule);
      const periodEnd = calculatePeriodEnd(schedule);
      
      const payout = await this.create({
        vendor: vendor._id,
        vendorDetails: {
          storeName: vendor.vendorProfile.storeName,
          storeSlug: vendor.vendorProfile.storeSlug,
          email: vendor.email,
          phone: vendor.phoneNumber,
          bankDetails: vendor.vendorProfile.banking.primaryBank,
          paypalEmail: vendor.vendorProfile.banking.paypal?.email,
          stripeAccountId: vendor.vendorProfile.banking.stripe?.accountId
        },
        period: {
          startDate: periodStart,
          endDate: periodEnd,
          type: schedule.frequency
        },
        scheduling: {
          scheduledDate: nextPayoutDate,
          isRecurring: true,
          recurrencePattern: schedule
        },
        status: 'draft',
        approval: {
          required: true,
          status: 'pending'
        }
      });
      
      payouts.push(payout);
    }
  }
  
  return payouts;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateNextPayoutDate(schedule) {
  const today = new Date();
  
  switch (schedule.frequency) {
    case 'daily':
      return new Date(today.setDate(today.getDate() + 1));
    case 'weekly':
      const daysUntilNextWeek = (schedule.dayOfWeek - today.getDay() + 7) % 7;
      return new Date(today.setDate(today.getDate() + (daysUntilNextWeek || 7)));
    case 'biweekly':
      return new Date(today.setDate(today.getDate() + 14));
    case 'monthly':
      let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, schedule.dayOfMonth || 1);
      if (nextMonth < today) {
        nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, schedule.dayOfMonth || 1);
      }
      return nextMonth;
    default:
      return new Date(today.setDate(today.getDate() + 7));
  }
}

function calculatePeriodStart(schedule) {
  const today = new Date();
  
  switch (schedule.frequency) {
    case 'daily':
      return new Date(today.setDate(today.getDate() - 1));
    case 'weekly':
      return new Date(today.setDate(today.getDate() - 7));
    case 'biweekly':
      return new Date(today.setDate(today.getDate() - 14));
    case 'monthly':
      return new Date(today.setMonth(today.getMonth() - 1));
    default:
      return new Date(today.setDate(today.getDate() - 7));
  }
}

function calculatePeriodEnd(schedule) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(today.setDate(today.getDate() - 1));
}

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;