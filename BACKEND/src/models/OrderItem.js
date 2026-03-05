// models/OrderItem.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor',
    required: true,
    index: true
  },
  productSnapshot: {
    name: String,
    sku: String,
    image: String,
    vendorName: String
  },
  variant: {
    id: String,
    name: String,
    sku: String,
    price: Number,
    compareAtPrice: Number,
    options: mongoose.Schema.Types.Mixed
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true
  },
  refundedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  refundedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: String,
  refundedAt: Date,
  
  // Digital product fields
  isDigital: {
    type: Boolean,
    default: false
  },
  downloadUrls: [String],
  downloadLimit: Number,
  downloadExpiry: Date,
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // Gift message
  giftMessage: String,
  giftWrapping: {
    type: Boolean,
    default: false
  },
  giftWrappingPrice: {
    type: Number,
    default: 0
  },
  
  metadata: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
orderItemSchema.index({ order: 1, product: 1 });
orderItemSchema.index({ vendor: 1, status: 1 });
orderItemSchema.index({ 'variant.sku': 1 });

// Virtual for formatted price
orderItemSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.price);
});

// Virtual for formatted total
orderItemSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.total);
});

// Pre-save middleware
orderItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

export default OrderItem;