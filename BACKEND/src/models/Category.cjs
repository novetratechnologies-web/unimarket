const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  // ============================================
  // BASIC INFORMATION
  // ============================================
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    minlength: [2, 'Category name must be at least 2 characters'],
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
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // ============================================
  // HIERARCHY & RELATIONSHIPS
  // ============================================
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  
  ancestors: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    name: String,
    slug: String,
    level: Number
  }],
  
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
    index: true
  },
  
  path: {
    type: String,
    index: true
  },
  
  fullPath: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    slug: String
  }],
  
  // ============================================
  // MEDIA & BRANDING
  // ============================================
  image: {
    url: String,
    thumbnailUrl: String,
    alt: String,
    title: String,
    width: Number,
    height: Number,
    size: Number,
    format: String,
    cloudinaryId: String,
    awsKey: String
  },
  
  banner: {
    url: String,
    thumbnailUrl: String,
    alt: String,
    title: String,
    width: Number,
    height: Number,
    size: Number,
    format: String,
    cloudinaryId: String,
    awsKey: String
  },
  
  icon: {
    type: String, // Font Awesome class or SVG path
    default: 'fas fa-folder'
  },
  
  iconImage: {
    url: String,
    alt: String
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
      default: 'website'
    },
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image', 'app', 'player'],
      default: 'summary_large_image'
    },
    canonical: String,
    robots: {
      type: String,
      default: 'index, follow'
    },
    schema: mongoose.Schema.Types.Mixed // JSON-LD schema
  },
  
  // ============================================
  // SETTINGS & CONFIGURATION
  // ============================================
  settings: {
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    showInMenu: {
      type: Boolean,
      default: true
    },
    showInHomepage: {
      type: Boolean,
      default: false
    },
    showInFooter: {
      type: Boolean,
      default: false
    },
    showInSidebar: {
      type: Boolean,
      default: true
    },
    showProductCount: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    },
    menuPosition: {
      type: Number,
      default: 0
    },
    columnCount: {
      type: Number,
      default: 4,
      min: 1,
      max: 6
    }
  },
  
  // ============================================
  // PRODUCT STATISTICS
  // ============================================
  stats: {
    productCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    activeProductCount: {
      type: Number,
      default: 0,
      min: 0
    },
    subcategoryCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageProductPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    topSellingProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      sku: String,
      sold: Number,
      revenue: Number
    }],
    lastProductAddedAt: Date
  },
  
  // ============================================
  // ATTRIBUTES & FILTERS
  // ============================================
  attributes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'text', 'number', 'boolean', 'date', 'select',
        'multiselect', 'color', 'size', 'range'
      ],
      default: 'text'
    },
    options: [{
      value: String,
      label: String,
      slug: String,
      color: String,
      image: String,
      sortOrder: Number
    }],
    unit: String,
    placeholder: String,
    isRequired: {
      type: Boolean,
      default: false
    },
    isFilterable: {
      type: Boolean,
      default: true,
      index: true
    },
    isSearchable: {
      type: Boolean,
      default: true
    },
    isComparable: {
      type: Boolean,
      default: false
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      minLength: Number,
      maxLength: Number
    },
    displayType: {
      type: String,
      enum: ['dropdown', 'radio', 'checkbox', 'color_swatch', 'size_swatch', 'range_slider'],
      default: 'dropdown'
    }
  }],
  
  // ============================================
  // PRICE RANGES (for filtering)
  // ============================================
  priceRanges: [{
    label: String,
    min: Number,
    max: Number,
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  
  // ============================================
  // CONTENT & CUSTOMIZATION
  // ============================================
  content: {
    header: {
      type: String,
      maxlength: [2000, 'Header content cannot exceed 2000 characters']
    },
    footer: {
      type: String,
      maxlength: [2000, 'Footer content cannot exceed 2000 characters']
    },
    bannerText: String,
    bannerLink: String,
    customCss: String,
    customJs: String
  },
  
  // ============================================
  // FEATURED PRODUCTS
  // ============================================
  featuredProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============================================
  // RELATED CATEGORIES
  // ============================================
  relatedCategories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    type: {
      type: String,
      enum: ['cross_sell', 'upsell', 'complementary', 'alternative'],
      default: 'complementary'
    },
    sortOrder: Number
  }],
  
  // ============================================
  // PROMOTIONS & BADGES
  // ============================================
  badges: [{
    text: String,
    color: String,
    backgroundColor: String,
    icon: String,
    type: {
      type: String,
      enum: ['new', 'sale', 'hot', 'featured', 'limited', 'custom'],
      default: 'custom'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ============================================
  // RESTRICTIONS
  // ============================================
  restrictions: {
    minPurchase: {
      type: Number,
      min: 0,
      default: 0
    },
    maxPurchase: {
      type: Number,
      min: 0,
      default: 0 // 0 = unlimited
    },
    allowedCustomerGroups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerGroup'
    }],
    allowedVendors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminVendor'
    }],
    allowedCountries: [String],
    ageRestriction: {
      minAge: {
        type: Number,
        min: 0,
        default: 0
      },
      message: String
    }
  },
  
  // ============================================
  // COMMISSION RATES (override)
  // ============================================
  commission: {
    rate: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    override: {
      type: Boolean,
      default: false
    }
  },
  
  // ============================================
  // TAX CONFIGURATION
  // ============================================
  tax: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxClass'
    },
    rate: {
      type: Number,
      min: 0,
      max: 100
    },
    exempt: {
      type: Boolean,
      default: false
    }
  },
  
  // ============================================
  // SHIPPING CONFIGURATION
  // ============================================
  shipping: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShippingClass'
    },
    requiresShipping: {
      type: Boolean,
      default: true
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    additionalCost: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // ============================================
  // LOCALIZATION
  // ============================================
  translations: [{
    language: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 5
    },
    name: String,
    description: String,
    seo: {
      title: String,
      description: String,
      keywords: [String]
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // ============================================
  // ANALYTICS & TRACKING
  // ============================================
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    },
    searchCount: {
      type: Number,
      default: 0
    },
    filterCount: {
      type: Number,
      default: 0
    },
    weeklyViews: [{
      week: Number,
      year: Number,
      count: Number
    }],
    monthlyViews: [{
      month: Number,
      year: Number,
      count: Number
    }],
    popularFilters: [{
      attribute: String,
      value: String,
      count: Number
    }]
  },
  
  // ============================================
  // AUDIT & METADATA
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
  
  version: {
    type: Number,
    default: 1
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
      delete ret.metadata;
      delete ret.analytics;
      delete ret.weeklyViews;
      delete ret.monthlyViews;
      delete ret.translations;
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

// Text search indexes
categorySchema.index({ 
  name: 'text', 
  description: 'text',
  'seo.keywords': 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    'seo.keywords': 3,
    tags: 2
  },
  name: 'category_search_index'
});

// Compound indexes for common queries
categorySchema.index({ parent: 1, 'settings.sortOrder': 1 });
categorySchema.index({ 'settings.isActive': 1, 'settings.isVisible': 1, 'settings.sortOrder': -1 });
categorySchema.index({ 'settings.isFeatured': 1, 'settings.isActive': 1 });
categorySchema.index({ level: 1, 'settings.sortOrder': 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ 'stats.productCount': -1 });

// Partial indexes
categorySchema.index({ 'settings.showInMenu': 1, 'settings.sortOrder': 1 }, {
  partialFilterExpression: { 'settings.showInMenu': true, 'settings.isActive': true }
});

categorySchema.index({ 'settings.showInHomepage': 1, 'settings.sortOrder': 1 }, {
  partialFilterExpression: { 'settings.showInHomepage': true, 'settings.isActive': true }
});

// ============================================
// VIRTUALS
// ============================================

/**
 * Full URL
 */
categorySchema.virtual('url').get(function() {
  return `/category/${this.slug}`;
});

/**
 * Admin URL
 */
categorySchema.virtual('adminUrl').get(function() {
  return `/admin/categories/${this._id}`;
});

/**
 * Parent category object
 */
categorySchema.virtual('parentCategory', {
  ref: 'Category',
  localField: 'parent',
  foreignField: '_id',
  justOne: true
});

/**
 * Subcategories
 */
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  options: {
    sort: { 'settings.sortOrder': 1 }
  }
});

/**
 * Products in this category
 */
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categories'
});

/**
 * Breadcrumb trail
 */
categorySchema.virtual('breadcrumb').get(function() {
  const breadcrumb = [];
  
  if (this.ancestors && this.ancestors.length > 0) {
    this.ancestors.forEach(ancestor => {
      breadcrumb.push({
        _id: ancestor._id,
        name: ancestor.name,
        slug: ancestor.slug,
        url: `/category/${ancestor.slug}`
      });
    });
  }
  
  breadcrumb.push({
    _id: this._id,
    name: this.name,
    slug: this.slug,
    url: `/category/${this.slug}`
  });
  
  return breadcrumb;
});

/**
 * Has children
 */
categorySchema.virtual('hasChildren').get(function() {
  return this.stats?.subcategoryCount > 0;
});

/**
 * Is root category
 */
categorySchema.virtual('isRoot').get(function() {
  return !this.parent;
});

/**
 * Is leaf category (no children)
 */
categorySchema.virtual('isLeaf').get(function() {
  return this.stats?.subcategoryCount === 0;
});

/**
 * Formatted product count
 */
categorySchema.virtual('formattedProductCount').get(function() {
  return this.stats?.productCount?.toLocaleString() || '0';
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Generate slug before save
 */
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    // Generate base slug
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    
    // Add parent prefix if exists
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        baseSlug = `${parentCategory.slug}/${baseSlug}`;
      }
    }
    
    this.slug = baseSlug;
    
    // Check for duplicate slug
    let count = 1;
    const baseSlugForCheck = this.slug;
    while (
      await mongoose.models.Category.findOne({ slug: this.slug, _id: { $ne: this._id } })
    ) {
      this.slug = `${baseSlugForCheck}-${count++}`;
    }
  }
  
  // Update path
  this.path = this.slug;
  
  // Update level and ancestors
  if (this.isModified('parent')) {
    await this.updateHierarchy();
  }
  
  // Increment version if modified
  if (!this.isNew && this.isModified()) {
    this.version += 1;
  }
  
  next();
});

/**
 * Update hierarchy (level, ancestors, fullPath)
 */
categorySchema.methods.updateHierarchy = async function() {
  this.ancestors = [];
  this.fullPath = [{ _id: this._id, name: this.name, slug: this.slug }];
  this.level = 0;
  
  if (this.parent) {
    let currentParent = await this.constructor.findById(this.parent);
    const ancestors = [];
    const fullPath = [];
    let level = 0;
    
    while (currentParent && level < 10) {
      ancestors.unshift({
        _id: currentParent._id,
        name: currentParent.name,
        slug: currentParent.slug,
        level
      });
      
      fullPath.unshift({
        _id: currentParent._id,
        name: currentParent.name,
        slug: currentParent.slug
      });
      
      level++;
      
      if (currentParent.parent) {
        currentParent = await this.constructor.findById(currentParent.parent);
      } else {
        break;
      }
    }
    
    this.ancestors = ancestors;
    this.fullPath = [...fullPath, { _id: this._id, name: this.name, slug: this.slug }];
    this.level = level;
  }
};

// ============================================
// PRE-FIND MIDDLEWARE
// ============================================

/**
 * Exclude deleted categories by default
 */
categorySchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

/**
 * Populate parent by default
 */
categorySchema.pre(/^find/, function(next) {
  this.populate('parent', 'name slug level');
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get all descendants
 */
categorySchema.methods.getDescendants = async function(includeSelf = false) {
  const descendants = await this.constructor.find({
    path: { $regex: `^${this.path}` }
  }).sort('path');
  
  if (includeSelf) {
    return descendants;
  }
  
  return descendants.filter(d => d._id.toString() !== this._id.toString());
};

/**
 * Get all ancestors
 */
categorySchema.methods.getAncestors = async function(includeSelf = false) {
  const ancestors = await this.constructor.find({
    _id: { $in: this.ancestors.map(a => a._id) }
  }).sort('level');
  
  if (includeSelf) {
    return [...ancestors, this];
  }
  
  return ancestors;
};

/**
 * Update product counts
 */
categorySchema.methods.updateProductCounts = async function() {
  const Product = mongoose.model('Product');
  
  const [productCount, activeProductCount, revenue] = await Promise.all([
    Product.countDocuments({
      categories: this._id,
      isDeleted: false
    }),
    Product.countDocuments({
      categories: this._id,
      status: 'active',
      isDeleted: false
    }),
    Product.aggregate([
      { $match: { categories: this._id, isDeleted: false, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ])
  ]);
  
  this.stats.productCount = productCount;
  this.stats.activeProductCount = activeProductCount;
  this.stats.totalRevenue = revenue[0]?.total || 0;
  this.stats.averageProductPrice = productCount > 0 
    ? this.stats.totalRevenue / productCount 
    : 0;
  
  return this.save();
};

/**
 * Update subcategory counts
 */
categorySchema.methods.updateSubcategoryCounts = async function() {
  const count = await this.constructor.countDocuments({
    parent: this._id,
    isDeleted: false
  });
  
  this.stats.subcategoryCount = count;
  return this.save();
};

/**
 * Increment view count
 */
categorySchema.methods.incrementViewCount = async function() {
  this.stats.totalViews += 1;
  
  // Update weekly views
  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();
  
  let weeklyView = this.analytics.weeklyViews.find(v => 
    v.week === week && v.year === year
  );
  
  if (!weeklyView) {
    weeklyView = { week, year, count: 0 };
    this.analytics.weeklyViews.push(weeklyView);
  }
  weeklyView.count += 1;
  
  // Update monthly views
  const month = now.getMonth() + 1;
  let monthlyView = this.analytics.monthlyViews.find(v => 
    v.month === month && v.year === year
  );
  
  if (!monthlyView) {
    monthlyView = { month, year, count: 0 };
    this.analytics.monthlyViews.push(monthlyView);
  }
  monthlyView.count += 1;
  
  // Keep only last 12 months and 52 weeks
  this.analytics.monthlyViews = this.analytics.monthlyViews
    .filter(v => v.year > year - 1 || (v.year === year && v.month > month - 12));
  
  this.analytics.weeklyViews = this.analytics.weeklyViews
    .filter(v => v.year > year - 1 || (v.year === year && v.week > week - 52));
  
  return this.save();
};

/**
 * Add filter popularity
 */
categorySchema.methods.addFilterPopularity = async function(attribute, value) {
  const existing = this.analytics.popularFilters.find(f => 
    f.attribute === attribute && f.value === value
  );
  
  if (existing) {
    existing.count += 1;
  } else {
    this.analytics.popularFilters.push({
      attribute,
      value,
      count: 1
    });
  }
  
  // Keep only top 20 filters
  this.analytics.popularFilters.sort((a, b) => b.count - a.count);
  this.analytics.popularFilters = this.analytics.popularFilters.slice(0, 20);
  
  return this.save();
};

/**
 * Add translation
 */
categorySchema.methods.addTranslation = async function(language, data, isDefault = false) {
  let translation = this.translations.find(t => t.language === language);
  
  if (translation) {
    Object.assign(translation, data);
  } else {
    translation = { language, ...data, isDefault };
    this.translations.push(translation);
  }
  
  if (isDefault) {
    this.translations.forEach(t => t.isDefault = t.language === language);
  }
  
  return this.save();
};

/**
 * Build category tree
 */
categorySchema.methods.buildTree = async function(depth = 3) {
  const tree = {
    _id: this._id,
    name: this.name,
    slug: this.slug,
    level: this.level,
    children: []
  };
  
  if (depth > 0) {
    const children = await this.constructor.find({ parent: this._id })
      .sort('settings.sortOrder')
      .limit(20);
    
    for (const child of children) {
      tree.children.push(await child.buildTree(depth - 1));
    }
  }
  
  return tree;
};

/**
 * Soft delete
 */
categorySchema.methods.softDelete = async function(deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  this.settings.isActive = false;
  this.settings.isVisible = false;
  
  // Also soft delete all descendants
  const descendants = await this.getDescendants();
  for (const descendant of descendants) {
    descendant.isDeleted = true;
    descendant.deletedAt = new Date();
    descendant.deletedBy = deletedBy;
    descendant.deleteReason = `Parent deleted: ${reason}`;
    descendant.settings.isActive = false;
    descendant.settings.isVisible = false;
    await descendant.save();
  }
  
  return this.save();
};

/**
 * Restore soft deleted category
 */
categorySchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deleteReason = null;
  this.settings.isActive = true;
  this.settings.isVisible = true;
  
  // Restore descendants if parent is restored
  if (!this.parent) {
    const descendants = await this.constructor.find({
      path: { $regex: `^${this.path}` },
      isDeleted: true
    });
    
    for (const descendant of descendants) {
      descendant.isDeleted = false;
      descendant.deletedAt = null;
      descendant.deletedBy = null;
      descendant.deleteReason = null;
      descendant.settings.isActive = true;
      descendant.settings.isVisible = true;
      await descendant.save();
    }
  }
  
  return this.save();
};

/**
 * Flatten structure (from original file)
 */
categorySchema.methods.flattenStructure = function() {
  const flatten = (category, parentPath = []) => {
    const currentPath = [...parentPath, {
      _id: category._id,
      name: category.name,
      slug: category.slug
    }];

    let flattened = [{
      ...category.toObject(),
      ancestors: parentPath,
      level: parentPath.length
    }];

    // Use the virtual subcategories or query for children
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subCat => {
        flattened = flattened.concat(flatten(subCat, currentPath));
      });
    }

    return flattened;
  };

  return flatten(this);
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get category tree
 */
categorySchema.statics.getTree = async function(rootId = null, depth = 3) {
  const query = { isDeleted: false, 'settings.isActive': true };

  if (rootId) {
    query._id = rootId;
  } else {
    query.parent = null;
  }

  const roots = await this.find(query).sort('settings.sortOrder');
  const tree = [];

  for (const root of roots) {
    tree.push(await root.buildTree(depth));
  }

  return tree;
};

/**
 * Get breadcrumb for slug
 */
categorySchema.statics.getBreadcrumb = async function(slug) {
  const category = await this.findOne({ slug, isDeleted: false });
  
  if (!category) {
    return [];
  }
  
  return category.breadcrumb;
};


/**
 * Get menu categories with full nested structure
 */
categorySchema.statics.getMenuCategories = async function(depth = 10) {
  const query = {
    'settings.showInMenu': true,
    'settings.isActive': true,
    'settings.isVisible': true,
    isDeleted: false
  };
  
  // Get all categories that match the criteria
  const categories = await this.find(query)
    .sort('settings.menuPosition settings.sortOrder name')
    .select('name slug description image banner icon iconImage stats settings parent level')
    .lean();

  // Create a map for quick lookups
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map with empty children array
  categories.forEach(category => {
    category.children = [];
    categoryMap.set(category._id.toString(), category);
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    if (category.parent) {
      const parentId = category.parent.toString();
      const parent = categoryMap.get(parentId);
      if (parent) {
        parent.children.push(category);
      } else {
        // Parent not in menu, treat as root
        rootCategories.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });


  // Recursively clean and prepare categories
  const prepareCategory = (cat) => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image: cat.image,
    banner: cat.banner,
    icon: cat.icon,
    iconImage: cat.iconImage,
    level: cat.level,
    stats: {
      productCount: cat.stats?.productCount || 0,
      subcategoryCount: cat.stats?.subcategoryCount || cat.children?.length || 0
    },
    settings: {
      columnCount: cat.settings?.columnCount || 4,
      menuPosition: cat.settings?.menuPosition || 0,
      sortOrder: cat.settings?.sortOrder || 0
    },
    children: cat.children ? cat.children.map(prepareCategory) : []
  });

  return rootCategories.map(prepareCategory);
};


/**
 * Get homepage categories
 */
categorySchema.statics.getHomepageCategories = async function(limit = 8) {
  return this.find({
    'settings.showInHomepage': true,
    'settings.isActive': true,
    'settings.isVisible': true,
    isDeleted: false
  })
    .sort('settings.sortOrder')
    .limit(limit)
    .select('name slug description image stats.productCount');
};

/**
 * Get popular categories
 */
categorySchema.statics.getPopularCategories = async function(limit = 10) {
  return this.find({
    'settings.isActive': true,
    'settings.isVisible': true,
    isDeleted: false
  })
    .sort({ 'stats.productCount': -1, 'analytics.viewCount': -1 })
    .limit(limit)
    .select('name slug image stats.productCount');
};

/**
 * Search categories
 */
categorySchema.statics.search = async function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'relevance',
    parent = null,
    level = null,
    isActive = true
  } = options;
  
  const searchQuery = {
    isDeleted: false,
    ...(isActive && { 'settings.isActive': true }),
    ...(parent && { parent }),
    ...(level !== null && { level })
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  let sort = {};
  if (sortBy === 'relevance' && query) {
    sort = { score: { $meta: 'textScore' } };
  } else if (sortBy === 'name') {
    sort = { name: 1 };
  } else if (sortBy === 'productCount') {
    sort = { 'stats.productCount': -1 };
  } else {
    sort = { 'settings.sortOrder': 1, name: 1 };
  }
  
  const skip = (page - 1) * limit;
  
  const [categories, total] = await Promise.all([
    this.find(searchQuery)
      .select(query ? { score: { $meta: 'textScore' } } : {})
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(searchQuery)
  ]);
  
  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Bulk update categories
 */
categorySchema.statics.bulkUpdate = async function(ids, updates, updatedBy) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await this.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          ...updates,
          updatedBy,
          updatedAt: new Date()
        },
        $inc: { version: 1 }
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

/**
 * Clean up old analytics data
 */
categorySchema.statics.cleanupAnalytics = async function() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return this.updateMany(
    {},
    {
      $pull: {
        'analytics.weeklyViews': { year: { $lt: oneYearAgo.getFullYear() } },
        'analytics.monthlyViews': { year: { $lt: oneYearAgo.getFullYear() } }
      }
    }
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get ISO week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;