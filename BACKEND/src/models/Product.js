import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // ============================================
  // BASIC INFORMATION
  // ============================================
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    minlength: [3, 'Product name must be at least 3 characters'],
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    index: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  gtin: {
    type: String,
    trim: true,
    index: true
  },
  mpn: {
    type: String,
    trim: true,
    index: true
  },
  isbn: {
    type: String,
    trim: true,
    index: true
  },
  upc: {
    type: String,
    trim: true,
    index: true
  },
  ean: {
    type: String,
    trim: true,
    index: true
  },
  
  // ============================================
  // OWNERSHIP & PERMISSIONS
  // ============================================
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor',
    required: [true, 'Vendor is required'],
    index: true
  },
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
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // ============================================
  // DESCRIPTION & CONTENT
  // ============================================
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
    trim: true
  },
  highlights: [{
    type: String,
    maxlength: [200, 'Highlight cannot exceed 200 characters'],
    trim: true
  }],
  specifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    unit: String,
    isHighlighted: {
      type: Boolean,
      default: false
    },
    group: {
      type: String,
      trim: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  
  // ============================================
  // PRICING & CURRENCY
  // ============================================
  currency: {
    type: String,
    default: 'KES',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'KES']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    set: v => parseFloat(v.toFixed(2)),
    index: true
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative'],
    set: v => v ? parseFloat(v.toFixed(2)) : null,
    validate: {
      validator: function(v) {
        return !v || v > this.price;
      },
      message: 'Compare at price must be greater than regular price'
    }
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    set: v => v ? parseFloat(v.toFixed(2)) : null,
    select: false
  },
  wholesalePrice: {
    type: Number,
    min: 0,
    set: v => v ? parseFloat(v.toFixed(2)) : null
  },
  minimumWholesaleQuantity: {
    type: Number,
    min: 1,
    default: 1
  },
  bulkPricing: [{
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
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  }],
  volumeDiscounts: [{
    minQuantity: Number,
    maxQuantity: Number,
    discountPercentage: Number,
    discountAmount: Number
  }],
  priceHistory: [{
    price: Number,
    compareAtPrice: Number,
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: Date,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    reason: String
  }],
  profit: {
    type: Number,
    min: 0,
    virtual: true,
    get: function() {
      if (this.cost && this.price) {
        return parseFloat((this.price - this.cost).toFixed(2));
      }
      return null;
    }
  },
  profitMargin: {
    type: Number,
    min: 0,
    max: 100,
    virtual: true,
    get: function() {
      if (this.cost && this.price && this.price > 0) {
        return parseFloat(((this.price - this.cost) / this.price * 100).toFixed(2));
      }
      return null;
    }
  },
  
  // ============================================
  // INVENTORY & STOCK MANAGEMENT
  // ============================================
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Quantity cannot be negative'],
    index: true
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    virtual: true,
    get: function() {
      return Math.max(0, this.quantity - this.reservedQuantity);
    }
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: [0, 'Low stock threshold cannot be negative']
  },
  isLowStock: {
    type: Boolean,
    virtual: true,
    get: function() {
      return this.quantity > 0 && this.quantity <= this.lowStockThreshold;
    }
  },
  isOutOfStock: {
    type: Boolean,
    virtual: true,
    get: function() {
      return this.quantity <= 0;
    }
  },
  trackQuantity: {
    type: Boolean,
    default: true
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },
  backorderLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  backorderedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  backorderLeadTime: {
    type: Number, // days
    min: 0
  },
  inventoryTrackingMethod: {
    type: String,
    enum: ['continuous', 'periodic', 'just_in_time'],
    default: 'continuous'
  },
  reorderPoint: {
    type: Number,
    min: 0
  },
  reorderQuantity: {
    type: Number,
    min: 1
  },
  safetyStock: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumStock: {
    type: Number,
    min: 0
  },
  inventoryAlerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: [{
      type: Number,
      min: 0
    }],
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  stockStatusDisplay: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'pre_order', 'discontinued', 'coming_soon'],
    default: 'in_stock'
  },
  preOrderAvailability: {
    expectedDate: Date,
    availableQuantity: Number
  },
  
  // ============================================
  // WAREHOUSE & LOCATION
  // ============================================
  warehouses: [{
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    location: {
      aisle: String,
      shelf: String,
      bin: String,
      zone: String
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  defaultWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  stockLocations: [{
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    quantity: Number,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    }
  }],
  
  // ============================================
  // VARIANTS
  // ============================================
  hasVariants: {
    type: Boolean,
    default: false
  },
  variantAttributes: [{
    name: {
      type: String,
      required: true,
      enum: ['size', 'color', 'material', 'style', 'pattern', 'length', 'width', 'height', 'weight', 'capacity', 'flavor', 'scent', 'finish', 'edition', 'other']
    },
    values: [{
      type: String,
      required: true
    }],
    displayType: {
      type: String,
      enum: ['text', 'color_swatch', 'image_swatch', 'button'],
      default: 'text'
    },
    swatchValues: [{
      value: String,
      color: String,
      image: String
    }]
  }],
  variants: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      sparse: true
    },
    barcode: String,
    gtin: String,
    upc: String,
    ean: String,
    isbn: String,
    mpn: String,
    name: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    cost: {
      type: Number,
      min: 0,
      select: false
    },
    wholesalePrice: Number,
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    availableQuantity: {
      type: Number,
      virtual: true,
      get: function() {
        return Math.max(0, this.quantity - this.reservedQuantity);
      }
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    },
    backorderLimit: {
      type: Number,
      min: 0,
      default: 0
    },
    backorderedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    options: [{
      name: String,
      value: String
    }],
    attributes: {
      type: Map,
      of: String
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductImage'
    },
    images: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductImage'
    }],
    weight: Number,
    weightUnit: {
      type: String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'g'
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'mm'],
        default: 'cm'
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active'
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
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
  // MEDIA & ASSETS
  // ============================================
  images: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: String,
    mediumUrl: String,
    largeUrl: String,
    alt: {
      type: String,
      default: function() {
        return this.name || 'Product image';
      }
    },
    title: String,
    caption: String,
    description: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    width: Number,
    height: Number,
    size: Number,
    format: String,
    mimeType: String,
    cloudinaryId: String,
    cloudinaryUrl: String,
    awsKey: String,
    awsBucket: String,
    awsRegion: String,
    azureUrl: String,
    googleStoragePath: String,
    cdnUrl: String,
    isExternal: {
      type: Boolean,
      default: false
    },
    externalUrl: String,
    tags: [String],
    focalPoint: {
      x: Number,
      y: Number
    },
    watermark: {
      enabled: Boolean,
      url: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    }
  }],
  videos: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    url: {
      type: String,
      required: true
    },
    embedUrl: String,
    thumbnailUrl: String,
    title: String,
    description: String,
    duration: Number,
    platform: {
      type: String,
      enum: ['youtube', 'vimeo', 'dailymotion', 'tiktok', 'instagram', 'facebook', 'other'],
      default: 'youtube'
    },
    videoId: String,
    sortOrder: {
      type: Number,
      default: 0
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    loop: {
      type: Boolean,
      default: false
    },
    mute: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    url: {
      type: String,
      required: true
    },
    title: String,
    description: String,
    fileType: String,
    fileSize: Number,
    pages: Number,
    sortOrder: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  threeDModel: {
    url: String,
    format: String,
    size: Number,
    thumbnailUrl: String,
    isAr: Boolean
  },
  augmentedReality: {
    enabled: Boolean,
    url: String,
    format: String,
    scale: Number
  },
  
  // ============================================
  // CATEGORIZATION & TAXONOMY
  // ============================================
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  }],
  primaryCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    index: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'date', 'select'],
      default: 'text'
    },
    group: String,
    isFilterable: {
      type: Boolean,
      default: false
    },
    isSearchable: {
      type: Boolean,
      default: true
    },
    isComparable: {
      type: Boolean,
      default: false
    },
    isVariant: {
      type: Boolean,
      default: false
    }
  }],
  type: {
    type: String,
    enum: ['simple', 'variable', 'grouped', 'bundle', 'digital', 'service', 'subscription'],
    default: 'simple'
  },
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductType'
  },
  
  // ============================================
  // SHIPPING & DELIVERY
  // ============================================
  weight: {
    type: Number,
    min: 0
  },
  weightUnit: {
    type: String,
    enum: ['g', 'kg', 'lb', 'oz'],
    default: 'g'
  },
  dimensions: {
    length: {
      type: Number,
      min: 0
    },
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['cm', 'in', 'mm'],
      default: 'cm'
    }
  },
  volume: {
    value: Number,
    unit: {
      type: String,
      enum: ['m3', 'ft3', 'l', 'ml'],
      default: 'm3'
    }
  },
  shippingClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingClass'
  },
  shippingProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingProfile'
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  shippingCost: {
    type: Number,
    min: 0,
    set: v => v ? parseFloat(v.toFixed(2)) : null
  },
  shippingCostPerItem: {
    type: Boolean,
    default: false
  },
  flatShippingRate: {
    type: Number,
    min: 0
  },
  shippingRates: [{
    method: String,
    cost: Number,
    currency: String,
    estimatedDays: {
      min: Number,
      max: Number
    },
    locations: [String]
  }],
  estimatedDelivery: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  },
  deliveryOptions: [{
    method: String,
    carrier: String,
    cost: Number,
    estimatedDays: {
      min: Number,
      max: Number
    },
    trackingAvailable: Boolean
  }],
  requiresShipping: {
    type: Boolean,
    default: true
  },
  hazardous: {
    type: Boolean,
    default: false
  },
  hazardousClass: String,
  perishable: {
    type: Boolean,
    default: false
  },
  expiryDate: Date,
  storageRequirements: String,
  
  // ============================================
  // TAX & DUTIES
  // ============================================
  isTaxable: {
    type: Boolean,
    default: true
  },
  taxClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxClass'
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100
  },
  taxCode: String,
  taxIncluded: {
    type: Boolean,
    default: false
  },
  duties: {
    applicable: Boolean,
    rate: Number,
    code: String
  },
  customsInformation: {
    hsCode: String,
    countryOfOrigin: String,
    description: String,
    value: Number
  },
  
  // ============================================
  // SEO & METADATA
  // ============================================
  seo: {
    title: {
      type: String,
      maxlength: [70, 'SEO title should not exceed 70 characters'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [320, 'SEO description should not exceed 320 characters'],
      trim: true
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    ogTitle: {
      type: String,
      maxlength: [70, 'Open Graph title should not exceed 70 characters']
    },
    ogDescription: {
      type: String,
      maxlength: [200, 'Open Graph description should not exceed 200 characters']
    },
    ogImage: String,
    ogType: {
      type: String,
      default: 'product'
    },
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image', 'app', 'player'],
      default: 'summary_large_image'
    },
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String,
    canonical: String,
    robots: {
      type: String,
      default: 'index, follow'
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    schemaMarkup: String,
    hreflang: [{
      lang: String,
      url: String
    }]
  },
  
  // ============================================
  // STATUS & VISIBILITY
  // ============================================
  status: {
    type: String,
    enum: [
      'draft',
      'pending',
      'active',
      'inactive',
      'suspended',
      'rejected',
      'deleted',
      'archived',
      'coming_soon',
      'pre_order'
    ],
    default: 'draft',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden', 'password'],
    default: 'public',
    index: true
  },
  visibilityPassword: {
    type: String,
    select: false
  },
  publishedAt: {
    type: Date,
    index: true
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  scheduledEndAt: Date,
  unpublishAt: Date,
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  featuredRank: {
    type: Number,
    default: 0
  },
  isNew: {
    type: Boolean,
    default: function() {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return this.createdAt > thirtyDaysAgo;
    }
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isStaffPick: {
    type: Boolean,
    default: false
  },
  isLimitedEdition: {
    type: Boolean,
    default: false
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  isGiftCard: {
    type: Boolean,
    default: false
  },
  
  // ============================================
  // APPROVAL WORKFLOW
  // ============================================
  approval: {
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
    reviewNotes: String,
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalWorkflow'
    },
    currentStep: Number,
    completedSteps: [{
      step: Number,
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminVendor'
      },
      performedAt: Date,
      notes: String
    }]
  },
  
  // ============================================
  // SALES & PERFORMANCE
  // ============================================
  sales: {
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    averagePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSoldAt: Date,
    daily: [{
      date: Date,
      quantity: Number,
      revenue: Number
    }],
    weekly: [{
      week: Number,
      year: Number,
      quantity: Number,
      revenue: Number
    }],
    monthly: [{
      month: Number,
      year: Number,
      quantity: Number,
      revenue: Number
    }],
    byRegion: [{
      region: String,
      quantity: Number,
      revenue: Number
    }],
    byChannel: [{
      channel: String,
      quantity: Number,
      revenue: Number
    }]
  },
  
  // ============================================
  // REVIEWS & RATINGS
  // ============================================
  reviews: {
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    withImages: {
      type: Number,
      default: 0
    },
    withVideos: {
      type: Number,
      default: 0
    },
    verifiedPurchases: {
      type: Number,
      default: 0
    },
    lastReviewedAt: Date,
    summary: {
      quality: Number,
      value: Number,
      fit: Number,
      shipping: Number,
      customerService: Number
    }
  },
  
  // ============================================
  // QUESTIONS & ANSWERS
  // ============================================
  questions: {
    total: {
      type: Number,
      default: 0
    },
    answered: {
      type: Number,
      default: 0
    },
    unanswered: {
      type: Number,
      default: 0
    },
    lastAskedAt: Date,
    lastAnsweredAt: Date
  },
  
  // ============================================
  // RELATED PRODUCTS & CROSS-SELLING
  // ============================================
  relatedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    type: {
      type: String,
      enum: ['upsell', 'cross_sell', 'related', 'bundle', 'recommended', 'similar'],
      default: 'related'
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  upSellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  crossSellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  frequentlyBoughtTogether: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    frequency: {
      type: Number,
      default: 0
    }
  }],
  
  // ============================================
  // BUNDLES & KITS
  // ============================================
  isBundle: {
    type: Boolean,
    default: false
  },
  bundleType: {
    type: String,
    enum: ['fixed', 'configurable', 'dynamic'],
    default: 'fixed'
  },
  bundleItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    discountValue: Number,
    isOptional: {
      type: Boolean,
      default: false
    },
    minQuantity: {
      type: Number,
      default: 1
    },
    maxQuantity: Number
  }],
  bundleSavings: {
    type: Number,
    min: 0
  },
  bundleSavingsPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // ============================================
  // DIGITAL PRODUCT
  // ============================================
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalFile: {
    url: String,
    filename: String,
    filesize: Number,
    filetype: String,
    format: String,
    duration: Number,
    pages: Number,
    downloadLimit: {
      type: Number,
      default: 0
    },
    downloadExpiry: {
      type: Number,
      default: 30
    },
    previewUrl: String,
    previewImages: [String],
    licenseKey: String,
    licenseType: {
      type: String,
      enum: ['single', 'multi', 'enterprise'],
      default: 'single'
    },
    watermark: Boolean,
    drm: Boolean,
    encryption: String,
    version: String,
    systemRequirements: [String]
  },
  digitalAssets: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    sortOrder: Number
  }],
  
  // ============================================
  // WARRANTY
  // ============================================
  warranty: {
    hasWarranty: {
      type: Boolean,
      default: false
    },
    period: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years'],
        default: 'months'
      }
    },
    description: String,
    terms: String,
    provider: String,
    contactInfo: String,
    type: {
      type: String,
      enum: ['manufacturer', 'seller', 'extended'],
      default: 'manufacturer'
    },
    coverage: [String],
    exclusions: [String],
    documents: [String]
  },
  
  // ============================================
  // RETURNS
  // ============================================
  returnPolicy: {
    isReturnable: {
      type: Boolean,
      default: true
    },
    returnPeriod: {
      type: Number,
      default: 30
    },
    restockingFee: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    conditions: String,
    exclusions: [String],
    instructions: String,
    returnMethod: {
      type: String,
      enum: ['store_credit', 'refund', 'exchange'],
      default: 'refund'
    },
    refundMethod: {
      type: String,
      enum: ['original_payment', 'store_credit', 'bank_transfer'],
      default: 'original_payment'
    },
    requiresAuthorization: {
      type: Boolean,
      default: true
    }
  },
  
  // ============================================
  // BRAND & MANUFACTURER
  // ============================================
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  brandName: String,
  manufacturer: {
    name: String,
    partNumber: String,
    website: String,
    contact: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierSku: String,
  supplierPrice: Number,
  minimumOrderQuantity: {
    type: Number,
    min: 1,
    default: 1
  },
  maximumOrderQuantity: Number,
  countryOfOrigin: {
    type: String,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  regionOfOrigin: String,
  
  // ============================================
  // CERTIFICATIONS & COMPLIANCE
  // ============================================
  certifications: [{
    name: String,
    authority: String,
    certificateNumber: String,
    issuedDate: Date,
    expiryDate: Date,
    document: String,
    verified: Boolean,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    verifiedAt: Date
  }],
  compliance: {
    rohs: Boolean,
    reach: Boolean,
    ce: Boolean,
    fcc: Boolean,
    ul: Boolean,
    energyStar: Boolean,
    fsc: Boolean,
    organic: Boolean,
    gmo: Boolean,
    vegan: Boolean,
    glutenFree: Boolean,
    kosher: Boolean,
    halal: Boolean
  },
  safetyInformation: {
    warnings: [String],
    ageRestriction: Number,
    safetyDataSheet: String,
    emergencyInfo: String
  },
  
  // ============================================
  // AI & MACHINE LEARNING
  // ============================================
  embedding: {
    type: [Number],
    index: false // We'll use vector index separately
  },
  embeddingText: String,
  embeddingVersion: String,
  aiTags: [String],
  aiCategories: [String],
  aiDescription: String,
  searchKeywords: [String],
  searchBoost: {
    type: Number,
    min: 0,
    max: 10,
    default: 1
  },
  semanticEmbedding: [Number],
  imageEmbedding: [Number],
  
  // ============================================
  // USER ENGAGEMENT
  // ============================================
  engagement: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    addToCarts: {
      type: Number,
      default: 0
    },
    wishlistAdds: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    clickThroughRate: Number,
    conversionRate: Number,
    lastViewedAt: Date
  },
  
  // ============================================
  // LOCALIZATION
  // ============================================
  localizedContent: [{
    language: String,
    name: String,
    description: String,
    shortDescription: String,
    slug: String,
    seo: {
      title: String,
      description: String,
      keywords: [String]
    },
    translations: {
      type: Map,
      of: String
    }
  }],
  supportedLanguages: [String],
  defaultLanguage: {
    type: String,
    default: 'en'
  },
  
  // ============================================
  // MARKETING & PROMOTIONS
  // ============================================
  badges: [{
    type: String,
    text: String,
    icon: String,
    color: String,
    startDate: Date,
    endDate: Date
  }],
  labels: [String],
  promotions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  }],
  couponEligible: {
    type: Boolean,
    default: true
  },
  discountEligible: {
    type: Boolean,
    default: true
  },
  maximumDiscount: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // ============================================
  // PRICING & SUBSCRIPTION
  // ============================================
  subscription: {
    enabled: Boolean,
    interval: {
      type: String,
      enum: ['day', 'week', 'month', 'year']
    },
    intervalCount: Number,
    trialDays: Number,
    prices: [{
      interval: String,
      intervalCount: Number,
      price: Number,
      currency: String
    }]
  },
  rental: {
    enabled: Boolean,
    prices: [{
      period: String,
      price: Number,
      deposit: Number
    }]
  },
  
  // ============================================
  // METADATA & AUDIT
  // ============================================
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    maxlength: 1000,
    select: false
  },
  adminNotes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      enum: ['general', 'quality', 'inventory', 'pricing', 'compliance'],
      default: 'general'
    }
  }],
  
  // ============================================
  // VERSIONING & HISTORY
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
    reason: String,
    changes: [String]
  }],
  versionNotes: String,
  
  // ============================================
  // SOFT DELETE & ARCHIVING
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
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminVendor'
  },
  
  // ============================================
  // TIMESTAMPS
  // ============================================
  lastViewedAt: Date,
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: Date,
  importedAt: Date,
  importedFrom: String
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.visibilityPassword;
      delete ret.notes;
      delete ret.adminNotes;
      delete ret.previousVersions;
      delete ret.embedding;
      delete ret.semanticEmbedding;
      delete ret.imageEmbedding;
      if (!ret.cost) delete ret.cost;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    getters: true
  },
  strict: true,
  minimize: false
});

// ============================================
// INDEXES
// ============================================

// Text search indexes
productSchema.index({
  name: 'text',
  description: 'text',
  shortDescription: 'text',
  'seo.keywords': 'text',
  tags: 'text',
  sku: 'text',
  barcode: 'text',
  gtin: 'text',
  mpn: 'text',
  isbn: 'text',
  upc: 'text',
  ean: 'text'
}, {
  weights: {
    name: 10,
    sku: 8,
    tags: 5,
    description: 3,
    shortDescription: 2,
    'seo.keywords': 2,
    gtin: 2,
    mpn: 2,
    isbn: 2
  },
  name: 'product_search_index'
});

// Compound indexes for common queries
productSchema.index({ vendor: 1, status: 1, createdAt: -1 });
productSchema.index({ vendor: 1, isDeleted: 1, status: 1 });
productSchema.index({ categories: 1, status: 1, featured: -1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ 'reviews.averageRating': -1, status: 1 });
productSchema.index({ featured: -1, featuredRank: -1 });
productSchema.index({ status: 1, publishedAt: -1 });
productSchema.index({ isDeleted: 1, deletedAt: -1 });
productSchema.index({ type: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ 'attributes.name': 1, 'attributes.value': 1 });
productSchema.index({ 'sales.totalQuantity': -1 });
productSchema.index({ 'engagement.views': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });

// Scheduled publishing index
productSchema.index({ scheduledAt: 1 }, {
  partialFilterExpression: {
    scheduledAt: { $exists: true },
    status: 'draft'
  }
});

// Inventory management indexes
productSchema.index({ vendor: 1, quantity: 1, lowStockThreshold: 1 });
productSchema.index({ trackQuantity: 1, quantity: 1, lowStockThreshold: 1 });
productSchema.index({ allowBackorder: 1, backorderLimit: 1, backorderedQuantity: 1 });

// Approval workflow indexes
productSchema.index({ 'approval.status': 1, status: 1 });
productSchema.index({ 'approval.requestedAt': -1 });

// Geospatial index for stock locations
productSchema.index({ 'stockLocations.coordinates': '2dsphere' });

// ============================================
// VIRTUALS
// ============================================

// Primary image
productSchema.virtual('primaryImage').get(function() {
  return this.images?.find(img => img.isPrimary) || this.images?.[0];
});

// Discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Formatted price
productSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.price);
});

// Formatted compare at price
productSchema.virtual('formattedCompareAtPrice').get(function() {
  if (this.compareAtPrice) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD'
    }).format(this.compareAtPrice);
  }
  return null;
});

// URL
productSchema.virtual('url').get(function() {
  return `/product/${this.slug}`;
});

// Admin URL
productSchema.virtual('adminUrl').get(function() {
  return `/admin/products/${this._id}`;
});

// Vendor URL
productSchema.virtual('vendorUrl').get(function() {
  return `/vendor/products/${this._id}`;
});

// Stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) {
    return this.allowBackorder ? 'backorder' : 'out_of_stock';
  }
  if (this.quantity <= this.lowStockThreshold) {
    return 'low_stock';
  }
  return 'in_stock';
});

// Total inventory value
productSchema.virtual('inventoryValue').get(function() {
  return this.cost ? this.cost * this.quantity : null;
});

// Total retail value
productSchema.virtual('retailValue').get(function() {
  return this.price * this.quantity;
});

// Profit potential
productSchema.virtual('profitPotential').get(function() {
  if (this.cost && this.price) {
    return (this.price - this.cost) * this.quantity;
  }
  return null;
});

// Average review score
productSchema.virtual('averageReviewScore').get(function() {
  return this.reviews?.averageRating || 0;
});

// Total review count
productSchema.virtual('reviewCount').get(function() {
  return this.reviews?.totalReviews || 0;
});

// Is in stock
productSchema.virtual('inStock').get(function() {
  return this.quantity > 0 || this.allowBackorder;
});

// Is on sale
productSchema.virtual('onSale').get(function() {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

// Savings amount
productSchema.virtual('savings').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return this.compareAtPrice - this.price;
  }
  return 0;
});

// Default variant
productSchema.virtual('defaultVariant').get(function() {
  return this.variants?.find(v => v.isDefault) || this.variants?.[0];
});

// Variant count
productSchema.virtual('variantCount').get(function() {
  return this.variants?.length || 0;
});

// Image count
productSchema.virtual('imageCount').get(function() {
  return this.images?.length || 0;
});

// Total warehouse quantity
productSchema.virtual('totalWarehouseQuantity').get(function() {
  return this.warehouses?.reduce((sum, w) => sum + (w.quantity || 0), 0) || 0;
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

// Generate slug before save
productSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check for duplicate slug
    const count = await this.constructor.countDocuments({
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (count > 0) {
      this.slug = `${this.slug}-${count + 1}`;
    }
  }

  // Generate SKU if not provided
  if (!this.sku && this.vendor) {
    const vendor = await mongoose.model('AdminVendor').findById(this.vendor);
    const prefix = vendor?.vendorProfile?.storeName?.substring(0, 3).toUpperCase() || 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.sku = `${prefix}-${timestamp}${random}`;
  }

  // Update timestamps
  this.lastUpdatedAt = new Date();
  
  // Handle publishing
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Handle scheduling
  if (this.isModified('scheduledAt') && this.scheduledAt) {
    this.status = 'draft';
  }

  // Calculate bundle savings
  if (this.isBundle && this.bundleItems && this.bundleItems.length > 0) {
    const totalRegularPrice = this.bundleItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    if (totalRegularPrice > this.price) {
      this.bundleSavings = totalRegularPrice - this.price;
      this.bundleSavingsPercentage = Math.round((this.bundleSavings / totalRegularPrice) * 100);
    }
  }

  // Ensure variant uniqueness
  if (this.variants && this.variants.length > 0) {
    const skus = new Set();
    this.variants = this.variants.map(variant => {
      if (skus.has(variant.sku)) {
        variant.sku = `${variant.sku}-${Date.now()}`;
      }
      skus.add(variant.sku);
      return variant;
    });
  }

  next();
});

// Pre-update middleware
productSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  if (update && update.$set) {
    update.$set.lastUpdatedAt = new Date();
  }
});

// ============================================
// PRE-FIND MIDDLEWARE
// ============================================

// Exclude deleted products by default
productSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Exclude archived products unless specified
productSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeArchived) {
    this.where({ isArchived: false });
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Update inventory with transaction support
 */
productSchema.methods.updateInventory = async function(quantity, type = 'decrease', warehouseId = null) {
  if (type === 'decrease') {
    if (this.quantity < quantity && !this.allowBackorder) {
      throw new Error('Insufficient stock');
    }
    
    if (warehouseId) {
      const warehouse = this.warehouses.find(w => w.warehouse.toString() === warehouseId);
      if (warehouse) {
        warehouse.quantity = Math.max(0, warehouse.quantity - quantity);
      }
    }
    
    this.quantity = Math.max(0, this.quantity - quantity);
    
    if (this.allowBackorder && this.quantity < 0) {
      this.backorderedQuantity = Math.abs(this.quantity);
      this.quantity = 0;
    }
  } else {
    if (warehouseId) {
      const warehouse = this.warehouses.find(w => w.warehouse.toString() === warehouseId);
      if (warehouse) {
        warehouse.quantity += quantity;
      }
    }
    this.quantity += quantity;
  }
  
  // Update stock status
  this.stockStatusDisplay = this.quantity > 0 ? 'in_stock' : 'out_of_stock';
  
  return this.save();
};

/**
 * Reserve inventory
 */
productSchema.methods.reserveInventory = async function(quantity, warehouseId = null) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient available stock');
  }
  
  if (warehouseId) {
    const warehouse = this.warehouses.find(w => w.warehouse.toString() === warehouseId);
    if (warehouse) {
      warehouse.reservedQuantity += quantity;
    }
  }
  
  this.reservedQuantity += quantity;
  return this.save();
};

/**
 * Release reserved inventory
 */
productSchema.methods.releaseInventory = async function(quantity, warehouseId = null) {
  if (warehouseId) {
    const warehouse = this.warehouses.find(w => w.warehouse.toString() === warehouseId);
    if (warehouse) {
      warehouse.reservedQuantity = Math.max(0, warehouse.reservedQuantity - quantity);
    }
  }
  
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  return this.save();
};

/**
 * Update sales stats
 */
productSchema.methods.recordSale = async function(quantity, revenue, options = {}) {
  const { channel = null, region = null } = options;
  
  this.sales.totalQuantity += quantity;
  this.sales.totalRevenue += revenue;
  this.sales.totalOrders += 1;
  this.sales.averagePrice = this.sales.totalRevenue / this.sales.totalQuantity;
  this.sales.lastSoldAt = new Date();
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.sales.daily.find(d => d.date.getTime() === today.getTime());
  if (!dailyStat) {
    dailyStat = { date: today, quantity: 0, revenue: 0 };
    this.sales.daily.push(dailyStat);
  }
  dailyStat.quantity += quantity;
  dailyStat.revenue += revenue;
  
  // Update weekly stats
  const week = Math.ceil((today.getDate() - today.getDay() + 1) / 7);
  const year = today.getFullYear();
  
  let weeklyStat = this.sales.weekly.find(w => w.week === week && w.year === year);
  if (!weeklyStat) {
    weeklyStat = { week, year, quantity: 0, revenue: 0 };
    this.sales.weekly.push(weeklyStat);
  }
  weeklyStat.quantity += quantity;
  weeklyStat.revenue += revenue;
  
  // Update monthly stats
  const month = today.getMonth() + 1;
  
  let monthlyStat = this.sales.monthly.find(m => m.month === month && m.year === year);
  if (!monthlyStat) {
    monthlyStat = { month, year, quantity: 0, revenue: 0 };
    this.sales.monthly.push(monthlyStat);
  }
  monthlyStat.quantity += quantity;
  monthlyStat.revenue += revenue;
  
  // Update channel stats
  if (channel) {
    if (!this.sales.byChannel) this.sales.byChannel = [];
    let channelStat = this.sales.byChannel.find(c => c.channel === channel);
    if (!channelStat) {
      channelStat = { channel, quantity: 0, revenue: 0 };
      this.sales.byChannel.push(channelStat);
    }
    channelStat.quantity += quantity;
    channelStat.revenue += revenue;
  }
  
  // Update region stats
  if (region) {
    if (!this.sales.byRegion) this.sales.byRegion = [];
    let regionStat = this.sales.byRegion.find(r => r.region === region);
    if (!regionStat) {
      regionStat = { region, quantity: 0, revenue: 0 };
      this.sales.byRegion.push(regionStat);
    }
    regionStat.quantity += quantity;
    regionStat.revenue += revenue;
  }
  
  // Keep only last 90 days of daily stats
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  this.sales.daily = this.sales.daily.filter(d => d.date > ninetyDaysAgo);
  
  // Keep only last 52 weeks
  if (this.sales.weekly.length > 52) {
    this.sales.weekly = this.sales.weekly.slice(-52);
  }
  
  // Keep only last 24 months
  if (this.sales.monthly.length > 24) {
    this.sales.monthly = this.sales.monthly.slice(-24);
  }
  
  return this.save();
};

/**
 * Update review stats
 */
productSchema.methods.updateReviewStats = async function(rating, oldRating = null, options = {}) {
  const { verified = false, hasImage = false, hasVideo = false } = options;
  
  if (oldRating !== null) {
    this.reviews.distribution[oldRating]--;
    this.reviews.totalRatings--;
  }
  
  this.reviews.distribution[rating]++;
  this.reviews.totalRatings++;
  this.reviews.totalReviews = this.reviews.totalRatings;
  
  if (verified) this.reviews.verifiedPurchases++;
  if (hasImage) this.reviews.withImages++;
  if (hasVideo) this.reviews.withVideos++;
  
  // Calculate weighted average
  let totalPoints = 0;
  let totalCount = 0;
  
  for (let i = 1; i <= 5; i++) {
    totalPoints += i * (this.reviews.distribution[i] || 0);
    totalCount += this.reviews.distribution[i] || 0;
  }
  
  this.reviews.averageRating = totalCount > 0 ? parseFloat((totalPoints / totalCount).toFixed(1)) : 0;
  this.reviews.lastReviewedAt = new Date();
  
  return this.save();
};

/**
 * Track engagement
 */
productSchema.methods.trackEngagement = async function(type) {
  const engagementTypes = ['views', 'uniqueViews', 'addToCarts', 'wishlistAdds', 'shares'];
  
  if (engagementTypes.includes(type)) {
    this.engagement[type] = (this.engagement[type] || 0) + 1;
    this.engagement.lastViewedAt = new Date();
    
    // Calculate conversion rate
    if (this.engagement.views > 0) {
      this.engagement.conversionRate = (this.engagement.addToCarts / this.engagement.views) * 100;
    }
  }
  
  return this.save();
};

/**
 * Create version snapshot
 */
productSchema.methods.createVersion = async function(updatedBy, reason = 'Update', changes = []) {
  const versionData = this.toObject();
  delete versionData._id;
  delete versionData.__v;
  delete versionData.previousVersions;
  
  this.previousVersions.push({
    version: this.version,
    data: versionData,
    updatedBy,
    updatedAt: new Date(),
    reason,
    changes
  });
  
  // Keep only last 10 versions
  if (this.previousVersions.length > 10) {
    this.previousVersions = this.previousVersions.slice(-10);
  }
  
  this.version += 1;
  return this.save();
};

/**
 * Soft delete
 */
productSchema.methods.softDelete = async function(deletedBy, reason = 'Manual deletion') {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  this.status = 'deleted';
  return this.save();
};

/**
 * Archive product
 */
productSchema.methods.archive = async function(archivedBy, reason = 'Manual archive') {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = archivedBy;
  this.status = 'archived';
  return this.save();
};

/**
 * Restore soft deleted product
 */
productSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deleteReason = null;
  this.status = 'draft';
  return this.save();
};

/**
 * Unarchive product
 */
productSchema.methods.unarchive = async function() {
  this.isArchived = false;
  this.archivedAt = null;
  this.archivedBy = null;
  this.status = 'draft';
  return this.save();
};

/**
 * Add price history entry
 */
productSchema.methods.addPriceHistory = async function(price, compareAtPrice, changedBy, reason = null) {
  if (!this.priceHistory) this.priceHistory = [];
  
  // End current price period if exists
  if (this.priceHistory.length > 0) {
    const lastEntry = this.priceHistory[this.priceHistory.length - 1];
    if (!lastEntry.effectiveTo) {
      lastEntry.effectiveTo = new Date();
    }
  }
  
  this.priceHistory.push({
    price,
    compareAtPrice,
    effectiveFrom: new Date(),
    changedBy,
    reason
  });
  
  return this.save();
};

/**
 * Check low stock and send alert
 */
productSchema.methods.checkLowStock = async function() {
  if (this.trackQuantity && 
      this.inventoryAlerts?.enabled && 
      this.quantity > 0 && 
      this.quantity <= this.lowStockThreshold) {
    
    // This would trigger a notification service
    return {
      isLowStock: true,
      currentQuantity: this.quantity,
      threshold: this.lowStockThreshold,
      productId: this._id,
      productName: this.name
    };
  }
  return { isLowStock: false };
};

/**
 * Get bulk price for quantity
 */
productSchema.methods.getBulkPrice = function(quantity) {
  if (!this.bulkPricing || this.bulkPricing.length === 0) {
    return this.price;
  }
  
  // Sort by quantity ascending
  const sortedPrices = [...this.bulkPricing].sort((a, b) => a.quantity - b.quantity);
  
  // Find applicable price
  let applicablePrice = this.price;
  for (const price of sortedPrices) {
    if (quantity >= price.quantity) {
      if (price.discountType === 'percentage') {
        applicablePrice = this.price * (1 - price.price / 100);
      } else {
        applicablePrice = price.price;
      }
    } else {
      break;
    }
  }
  
  return applicablePrice;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find products by vendor
 */
productSchema.statics.findByVendor = function(vendorId, options = {}) {
  const query = { vendor: vendorId, ...options };
  return this.find(query).sort('-createdAt');
};

/**
 * Find low stock products
 */
productSchema.statics.findLowStock = function(threshold = null) {
  const query = {
    isDeleted: false,
    isArchived: false,
    status: 'active',
    trackQuantity: true,
    $expr: {
      $and: [
        { $gt: ['$quantity', 0] },
        { $lte: ['$quantity', threshold ? threshold : '$lowStockThreshold'] }
      ]
    }
  };
  return this.find(query).populate('vendor', 'vendorProfile.storeName email');
};

/**
 * Find out of stock products
 */
productSchema.statics.findOutOfStock = function() {
  return this.find({
    isDeleted: false,
    isArchived: false,
    status: 'active',
    quantity: { $lte: 0 },
    allowBackorder: false
  }).populate('vendor', 'vendorProfile.storeName email');
};

/**
 * Find pending approval products
 */
productSchema.statics.findPendingApproval = function() {
  return this.find({
    'approval.status': 'pending',
    status: 'pending',
    isDeleted: false,
    isArchived: false
  }).populate('vendor', 'vendorProfile.storeName email firstName lastName');
};

/**
 * Find products by category
 */
productSchema.statics.findByCategory = function(categoryId, options = {}) {
  const query = {
    categories: categoryId,
    status: 'active',
    isDeleted: false,
    isArchived: false,
    ...options
  };
  return this.find(query).sort('-featured -featuredRank');
};

/**
 * Get inventory summary
 */
productSchema.statics.getInventorySummary = async function(vendorId = null) {
  const match = { isDeleted: false, isArchived: false };
  if (vendorId) match.vendor = vendorId;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { 
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        outOfStock: {
          $sum: { 
            $cond: [
              { $and: [
                { $eq: ['$status', 'active'] },
                { $lte: ['$quantity', 0] },
                { $eq: ['$allowBackorder', false] }
              ]},
              1, 0
            ]
          }
        },
        lowStock: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'active'] },
                { $gt: ['$quantity', 0] },
                { $lte: ['$quantity', '$lowStockThreshold'] }
              ]},
              1, 0
            ]
          }
        },
        totalValue: {
          $sum: { $multiply: ['$price', '$quantity'] }
        },
        totalCost: {
          $sum: { $multiply: ['$cost', '$quantity'] }
        },
        totalPotentialProfit: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$cost', 0] },
                { $gt: ['$price', 0] }
              ]},
              { $multiply: [{ $subtract: ['$price', '$cost'] }, '$quantity'] },
              0
            ]
          }
        }
      }
    }
  ]);
};

/**
 * Get category distribution
 */
productSchema.statics.getCategoryDistribution = async function(vendorId = null) {
  const match = { 
    isDeleted: false,
    isArchived: false,
    status: 'active'
  };
  if (vendorId) match.vendor = vendorId;
  
  return this.aggregate([
    { $match: match },
    { $unwind: '$categories' },
    {
      $group: {
        _id: '$categories',
        count: { $sum: 1 },
        products: { $push: '$_id' },
        totalRevenue: { $sum: '$sales.totalRevenue' },
        totalQuantity: { $sum: '$sales.totalQuantity' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 1,
        name: '$category.name',
        slug: '$category.slug',
        count: 1,
        totalRevenue: 1,
        totalQuantity: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get price range
 */
productSchema.statics.getPriceRange = async function(categoryId = null) {
  const match = { 
    isDeleted: false,
    isArchived: false,
    status: 'active'
  };
  if (categoryId) match.categories = categoryId;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
        medianPrice: { $percentile: { input: '$price', p: 0.5 } }
      }
    }
  ]);
};

/**
 * Search products with filters
 */
productSchema.statics.advancedSearch = async function(searchParams) {
  const {
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    rating,
    tags,
    sortBy = 'relevance',
    page = 1,
    limit = 20
  } = searchParams;

  const pipeline = [];

  // Match stage
  const match = {
    isDeleted: false,
    isArchived: false,
    status: 'active'
  };

  if (query) {
    match.$text = { $search: query };
  }

  if (category) {
    match.categories = mongoose.Types.ObjectId.isValid(category) 
      ? category 
      : { $in: await this.getCategoryIds(category) };
  }

  if (brand) {
    match.brand = mongoose.Types.ObjectId.isValid(brand) 
      ? brand 
      : { $in: await this.getBrandIds(brand) };
  }

  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = parseFloat(minPrice);
    if (maxPrice) match.price.$lte = parseFloat(maxPrice);
  }

  if (inStock) {
    match.$expr = { $gt: ['$quantity', 0] };
  }

  if (onSale) {
    match.compareAtPrice = { $gt: '$price' };
  }

  if (rating) {
    match['reviews.averageRating'] = { $gte: parseFloat(rating) };
  }

  if (tags) {
    match.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  pipeline.push({ $match: match });

  // Add text score if searching
  if (query) {
    pipeline.push({
      $addFields: {
        score: { $meta: 'textScore' }
      }
    });
  }

  // Lookup stages
  pipeline.push(
    {
      $lookup: {
        from: 'adminvendors',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendorInfo'
      }
    },
    { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'categories',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brandInfo'
      }
    },
    { $unwind: { path: '$brandInfo', preserveNullAndEmptyArrays: true } }
  );

  // Sort stage
  let sort = {};
  switch (sortBy) {
    case 'relevance':
      sort = query ? { score: -1 } : { createdAt: -1 };
      break;
    case 'price_asc':
      sort = { price: 1 };
      break;
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'rating':
      sort = { 'reviews.averageRating': -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'bestselling':
      sort = { 'sales.totalQuantity': -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  pipeline.push({ $sort: sort });

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

  // Project stage
  pipeline.push({
    $project: {
      name: 1,
      slug: 1,
      sku: 1,
      price: 1,
      compareAtPrice: 1,
      currency: 1,
      images: 1,
      'reviews.averageRating': 1,
      'reviews.totalReviews': 1,
      quantity: 1,
      vendor: {
        _id: '$vendorInfo._id',
        storeName: '$vendorInfo.vendorProfile.storeName',
        storeSlug: '$vendorInfo.vendorProfile.storeSlug'
      },
      categories: '$categoryInfo',
      brand: {
        _id: '$brandInfo._id',
        name: '$brandInfo.name',
        slug: '$brandInfo.slug'
      },
      tags: 1,
      featured: 1,
      isNew: 1,
      stockStatusDisplay: 1,
      discountPercentage: 1,
      score: 1
    }
  });

  return this.aggregate(pipeline);
};

/**
 * Bulk update with validation
 */
productSchema.statics.bulkUpdate = async function(productIds, updates, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await this.updateMany(
      { _id: { $in: productIds } },
      {
        $set: {
          ...updates,
          updatedBy: userId,
          lastUpdatedAt: new Date()
        }
      },
      { session }
    );

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================
// EXPORT
// ============================================

const Product = mongoose.model('Product', productSchema);

export default Product;