import Category from '../models/Category.cjs';
import Product from '../models/Product.js';
import AdminVendor from '../models/AdminVendor.js';
import ActivityLog from '../models/ActivityLog.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; // ADDED - Missing import
import { sendEmail } from '../utils/email.js';
import { createAuditLog } from '../middleware/audit.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';
import redis from '../config/redis.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// ============================================
// CATEGORY CRUD OPERATIONS
// ============================================

/**
 * @desc    Create Category
 * @route   POST /api/categories
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const userId = req.user._id;

    // ============================================
    // 1. PARSE JSON STRINGS FROM FORMDATA
    // ============================================
    
    // Parse settings if it's a string
    if (categoryData.settings && typeof categoryData.settings === 'string') {
      try {
        categoryData.settings = JSON.parse(categoryData.settings);
      } catch (e) {
        console.error('Error parsing settings:', e);
        categoryData.settings = {
          isActive: true,
          isVisible: true,
          isFeatured: false,
          showInMenu: true,
          showInHomepage: false,
          showInFooter: false,
          showInSidebar: true,
          showProductCount: true,
          sortOrder: 0,
          menuPosition: 0,
          columnCount: 4
        };
      }
    }

    // Parse seo if it's a string
    if (categoryData.seo && typeof categoryData.seo === 'string') {
      try {
        categoryData.seo = JSON.parse(categoryData.seo);
      } catch (e) {
        console.error('Error parsing seo:', e);
        categoryData.seo = {
          title: '',
          description: '',
          keywords: [],
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterCard: 'summary_large_image',
          robots: 'index, follow',
          schema: null
        };
      }
    }

    // Parse attributes if it's a string
    if (categoryData.attributes && typeof categoryData.attributes === 'string') {
      try {
        categoryData.attributes = JSON.parse(categoryData.attributes);
      } catch (e) {
        console.error('Error parsing attributes:', e);
        categoryData.attributes = [];
      }
    }

    // Parse priceRanges if it's a string
    if (categoryData.priceRanges && typeof categoryData.priceRanges === 'string') {
      try {
        categoryData.priceRanges = JSON.parse(categoryData.priceRanges);
      } catch (e) {
        console.error('Error parsing priceRanges:', e);
        categoryData.priceRanges = [];
      }
    }

    // Parse badges if it's a string
    if (categoryData.badges && typeof categoryData.badges === 'string') {
      try {
        categoryData.badges = JSON.parse(categoryData.badges);
      } catch (e) {
        console.error('Error parsing badges:', e);
        categoryData.badges = [];
      }
    }

    // Parse restrictions if it's a string
    if (categoryData.restrictions && typeof categoryData.restrictions === 'string') {
      try {
        categoryData.restrictions = JSON.parse(categoryData.restrictions);
      } catch (e) {
        console.error('Error parsing restrictions:', e);
        categoryData.restrictions = {
          minPurchase: 0,
          maxPurchase: 0,
          allowedCustomerGroups: [],
          allowedVendors: [],
          allowedCountries: [],
          ageRestriction: { minAge: 0, message: '' }
        };
      }
    }

    // Parse commission if it's a string
    if (categoryData.commission && typeof categoryData.commission === 'string') {
      try {
        categoryData.commission = JSON.parse(categoryData.commission);
      } catch (e) {
        console.error('Error parsing commission:', e);
        categoryData.commission = {
          rate: null,
          type: 'percentage',
          override: false
        };
      }
    }

    // Parse tax if it's a string
    if (categoryData.tax && typeof categoryData.tax === 'string') {
      try {
        categoryData.tax = JSON.parse(categoryData.tax);
      } catch (e) {
        console.error('Error parsing tax:', e);
        categoryData.tax = {
          class: null,
          rate: null,
          exempt: false
        };
      }
    }

    // Parse shipping if it's a string
    if (categoryData.shipping && typeof categoryData.shipping === 'string') {
      try {
        categoryData.shipping = JSON.parse(categoryData.shipping);
      } catch (e) {
        console.error('Error parsing shipping:', e);
        categoryData.shipping = {
          class: null,
          requiresShipping: true,
          freeShipping: false,
          additionalCost: 0
        };
      }
    }

    // Parse content if it's a string
    if (categoryData.content && typeof categoryData.content === 'string') {
      try {
        categoryData.content = JSON.parse(categoryData.content);
      } catch (e) {
        console.error('Error parsing content:', e);
        categoryData.content = {
          header: '',
          footer: '',
          bannerText: '',
          bannerLink: '',
          customCss: '',
          customJs: ''
        };
      }
    }

    // Parse tags if it's a string
    if (categoryData.tags && typeof categoryData.tags === 'string') {
      try {
        categoryData.tags = JSON.parse(categoryData.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        categoryData.tags = [];
      }
    }

    // Parse featuredProducts if it's a string
    if (categoryData.featuredProducts && typeof categoryData.featuredProducts === 'string') {
      try {
        categoryData.featuredProducts = JSON.parse(categoryData.featuredProducts);
      } catch (e) {
        console.error('Error parsing featuredProducts:', e);
        categoryData.featuredProducts = [];
      }
    }

    // Parse relatedCategories if it's a string
    if (categoryData.relatedCategories && typeof categoryData.relatedCategories === 'string') {
      try {
        categoryData.relatedCategories = JSON.parse(categoryData.relatedCategories);
      } catch (e) {
        console.error('Error parsing relatedCategories:', e);
        categoryData.relatedCategories = [];
      }
    }

    // ============================================
    // 2. VALIDATE PARENT CATEGORY
    // ============================================
    
    // Handle parent field - convert 'null' string to actual null
    if (categoryData.parent === 'null' || categoryData.parent === '') {
      categoryData.parent = null;
    }
    
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Check hierarchy depth
      if (parentCategory.level >= 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum category depth (10) exceeded'
        });
      }

      // Check if parent is active
      if (!parentCategory.settings.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create subcategory under inactive parent'
        });
      }
    }

    // ============================================
    // 3. HANDLE IMAGE UPLOADS
    // ============================================
    
    if (req.files?.image) {
      try {
        const upload = await uploadToCloudinary(req.files.image[0], 'categories/images');
        categoryData.image = {
          url: upload.secure_url,
          thumbnailUrl: upload.eager?.[0]?.secure_url || upload.secure_url,
          alt: categoryData.name,
          title: categoryData.name,
          width: upload.width,
          height: upload.height,
          size: upload.bytes,
          format: upload.format,
          cloudinaryId: upload.public_id
        };
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        categoryData.image = null;
      }
    }

    if (req.files?.banner) {
      try {
        const upload = await uploadToCloudinary(req.files.banner[0], 'categories/banners');
        categoryData.banner = {
          url: upload.secure_url,
          thumbnailUrl: upload.eager?.[0]?.secure_url || upload.secure_url,
          alt: categoryData.name,
          title: categoryData.name,
          width: upload.width,
          height: upload.height,
          size: upload.bytes,
          format: upload.format,
          cloudinaryId: upload.public_id
        };
      } catch (uploadError) {
        console.error('Banner upload error:', uploadError);
        categoryData.banner = null;
      }
    }

    if (req.files?.icon) {
      try {
        const upload = await uploadToCloudinary(req.files.icon[0], 'categories/icons');
        categoryData.iconImage = {
          url: upload.secure_url,
          alt: categoryData.name
        };
      } catch (uploadError) {
        console.error('Icon upload error:', uploadError);
        categoryData.iconImage = null;
      }
    }

    // ============================================
    // 4. SET CREATOR INFO
    // ============================================
    
    categoryData.createdBy = userId;
    categoryData.updatedBy = userId;

    // ============================================
    // 5. ENSURE DEFAULTS FOR EMPTY FIELDS
    // ============================================
    
    if (!categoryData.attributes) categoryData.attributes = [];
    if (!categoryData.priceRanges) categoryData.priceRanges = [];
    if (!categoryData.badges) categoryData.badges = [];
    if (!categoryData.tags) categoryData.tags = [];
    if (!categoryData.featuredProducts) categoryData.featuredProducts = [];
    if (!categoryData.relatedCategories) categoryData.relatedCategories = [];
    
    if (!categoryData.settings) {
      categoryData.settings = {
        isActive: true,
        isVisible: true,
        isFeatured: false,
        showInMenu: true,
        showInHomepage: false,
        showInFooter: false,
        showInSidebar: true,
        showProductCount: true,
        sortOrder: 0,
        menuPosition: 0,
        columnCount: 4
      };
    }
    
    if (!categoryData.seo) {
      categoryData.seo = {
        title: '',
        description: '',
        keywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
        robots: 'index, follow',
        schema: null
      };
    }
    
    if (!categoryData.restrictions) {
      categoryData.restrictions = {
        minPurchase: 0,
        maxPurchase: 0,
        allowedCustomerGroups: [],
        allowedVendors: [],
        allowedCountries: [],
        ageRestriction: { minAge: 0, message: '' }
      };
    }
    
    if (!categoryData.commission) {
      categoryData.commission = {
        rate: null,
        type: 'percentage',
        override: false
      };
    }
    
    if (!categoryData.tax) {
      categoryData.tax = {
        class: null,
        rate: null,
        exempt: false
      };
    }
    
    if (!categoryData.shipping) {
      categoryData.shipping = {
        class: null,
        requiresShipping: true,
        freeShipping: false,
        additionalCost: 0
      };
    }
    
    if (!categoryData.content) {
      categoryData.content = {
        header: '',
        footer: '',
        bannerText: '',
        bannerLink: '',
        customCss: '',
        customJs: ''
      };
    }

    // ============================================
    // 6. CREATE CATEGORY
    // ============================================
    
    const category = new Category(categoryData);
    await category.save();

    // ============================================
    // 7. UPDATE PARENT SUBCATEGORY COUNT
    // ============================================
    
    if (category.parent) {
      const parent = await Category.findById(category.parent);
      if (parent) {
        parent.stats.subcategoryCount = await Category.countDocuments({ 
          parent: parent._id,
          isDeleted: false 
        });
        await parent.save();
      }
    }

    // ============================================
    // 8. AUDIT LOG - FIXED: Now properly logs to ActivityLog
    // ============================================
    
    await createAuditLog({
      user: userId,
      action: 'create',
      resourceType: 'category',
      resourceId: category._id,
      resourceName: category.name,
      status: 'success',
      description: `Created category: ${category.name}`,
      metadata: { 
        level: category.level,
        parent: category.parent,
        slug: category.slug
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // ============================================
    // 9. CLEAR CACHES
    // ============================================
    
    await clearCategoryCaches();

    // Populate for response
    await category.populate('parent', 'name slug level');
    await category.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

/**
 * @desc    Get All Categories
 * @route   GET /api/categories
 * @access  Public/Private
 */

export const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      parent,
      level,
      isActive,
      isVisible,
      isFeatured,
      showInMenu,
      showInHomepage,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      includeInactive = false,
      includeDeleted = false,
      tree = false,
      depth = 3
    } = req.query;

    // ============================================
    // 1. FAST ADMIN CHECK
    // ============================================
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    
    // ============================================
    // 2. RETURN CATEGORY TREE (if requested)
    // ============================================
    if (tree === 'true') {
      const categoryTree = await Category.getTree(
        parent === 'null' ? null : parent, 
        parseInt(depth)
      );
      return res.json({ success: true, data: categoryTree });
    }

    // ============================================
    // 3. BUILD EFFICIENT QUERY
    // ============================================
    const query = {};
    
    // Deleted filter
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    // Apply filters based on admin status
    if (!isAdmin) {
      // Public users: only see active & visible
      query['settings.isActive'] = true;
      query['settings.isVisible'] = true;
    } else {
      // Admin: apply filters only if explicitly provided
      if (isActive !== undefined && isActive !== '') {
        query['settings.isActive'] = isActive === 'true';
      }
      if (isVisible !== undefined && isVisible !== '') {
        query['settings.isVisible'] = isVisible === 'true';
      }
      if (isFeatured !== undefined && isFeatured !== '') {
        query['settings.isFeatured'] = isFeatured === 'true';
      }
      if (showInMenu !== undefined && showInMenu !== '') {
        query['settings.showInMenu'] = showInMenu === 'true';
      }
      if (showInHomepage !== undefined && showInHomepage !== '') {
        query['settings.showInHomepage'] = showInHomepage === 'true';
      }
    }
    
    // Parent filter
    if (parent !== undefined && parent !== '') {
      query.parent = parent === 'null' || parent === 'none' ? null : parent;
    }
    
    // Level filter
    if (level !== undefined && level !== '') {
      query.level = parseInt(level);
    }

    // ============================================
    // 4. EFFICIENT SORTING
    // ============================================
    const sort = {};
    
    // Map sortBy to actual field names
    const sortFieldMap = {
      'name': 'name',
      'sortOrder': 'settings.sortOrder',
      'level': 'level',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'productCount': 'stats.productCount',
      'viewCount': 'stats.totalViews',
      'revenue': 'stats.totalRevenue'
    };
    
    const field = sortFieldMap[sortBy] || 'settings.sortOrder';
    sort[field] = sortOrder === 'desc' ? -1 : 1;

    // ============================================
    // 5. PAGINATION WITH LIMITS
    // ============================================
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Hard limit 50
    const skip = (pageNum - 1) * limitNum;

    // ============================================
    // 6. EXECUTE MAIN QUERY
    // ============================================
    let categories, total;
    
    if (search && search.trim()) {
      // Use text search for search queries
      const searchTerm = search.trim();
      [categories, total] = await Promise.all([
        Category.find(
          { $text: { $search: searchTerm }, ...query },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limitNum)
          .populate('parent', 'name slug level')
          .lean()
          .maxTimeMS(5000), // ✅ Works on find()
        Category.countDocuments({ $text: { $search: searchTerm }, ...query })
          .maxTimeMS(3000)
      ]);
    } else {
      // Regular listing
      [categories, total] = await Promise.all([
        Category.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate('parent', 'name slug level')
          .lean()
          .maxTimeMS(3000), // ✅ Works on find()
        Category.countDocuments(query).maxTimeMS(2000)
      ]);
    }

    // ============================================
    // 7. GET STATISTICS (ONLY FOR ADMIN, NO maxTimeMS on aggregation!)
    // ============================================
    let statistics = null;
    if (isAdmin) {
      // Cache statistics for 5 minutes
      const cacheKey = 'category:statistics';
      
      try {
        const cachedStats = await redis?.get(cacheKey);
        if (cachedStats) {
          statistics = JSON.parse(cachedStats);
        } else {
          const statsMatch = isAdmin ? {} : { 'settings.isActive': true, isDeleted: false };
          
          // ✅ FIXED: No .maxTimeMS() on aggregation
          const statsResult = await Category.aggregate([
            { $match: statsMatch },
            {
              $group: {
                _id: null,
                totalCategories: { $sum: 1 },
                activeCategories: { 
                  $sum: { $cond: [{ $eq: ['$settings.isActive', true] }, 1, 0] } 
                },
                inactiveCategories: { 
                  $sum: { $cond: [{ $eq: ['$settings.isActive', false] }, 1, 0] } 
                },
                rootCategories: { 
                  $sum: { $cond: [{ $eq: ['$parent', null] }, 1, 0] } 
                },
                featuredCategories: { 
                  $sum: { $cond: [{ $eq: ['$settings.isFeatured', true] }, 1, 0] } 
                },
                deletedCategories: { 
                  $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] } 
                },
                totalProducts: { $sum: '$stats.productCount' },
                totalViews: { $sum: '$stats.totalViews' }
              }
            }
          ]).option({ maxTimeMS: 5000 }); // ✅ Alternative: use .option()
          
          statistics = statsResult[0] || {
            totalCategories: 0,
            activeCategories: 0,
            inactiveCategories: 0,
            rootCategories: 0,
            featuredCategories: 0,
            deletedCategories: 0,
            totalProducts: 0,
            totalViews: 0
          };
          
          if (redis) {
            await redis.setEx(cacheKey, 300, JSON.stringify(statistics));
          }
        }
      } catch (statsError) {
        console.warn('⚠️ Stats aggregation failed:', statsError.message);
        // Continue without stats
      }
    }

    // ============================================
    // 8. FORMAT RESPONSE
    // ============================================
    res.json({
      success: true,
      data: categories,
      ...(isAdmin && statistics && { statistics }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get Single Category
 * @route   GET /api/categories/:id
 * @access  Public/Private
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      includeProducts = false, 
      productLimit = 10
    } = req.query;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Get category with minimal population
    const category = await Category.findById(id)
      .populate('parent', 'name slug level')
      .populate('createdBy', 'firstName lastName email')
      .lean(); // Use lean() to get plain JavaScript object

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parent: id,
      isDeleted: false,
      'settings.isActive': true 
    })
      .select('name slug description image stats.productCount level')
      .sort('settings.sortOrder')
      .limit(20)
      .lean();

    // Get products if requested
    let products = [];
    if (includeProducts === 'true') {
      products = await Product.find({
        categories: id,
        status: 'active',
        isDeleted: false
      })
        .select('name slug price images')
        .limit(parseInt(productLimit) || 10)
        .lean();
    }

    // Get breadcrumb
    const breadcrumb = await Category.getBreadcrumb(category.slug).catch(() => []);

    // Get filter attributes
    const filters = category.attributes?.filter(attr => attr.isFilterable) || [];

    // Increment view count (non-blocking)
    Category.findByIdAndUpdate(id, { $inc: { 'stats.totalViews': 1 } }).catch(() => {});

    res.json({
      success: true,
      data: {
        ...category,
        subcategories,
        products,
        filters,
        breadcrumb
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Get Category by Slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
export const getCategoryBySlug = async (req, res) => {
  try {
    const fullSlug = req.params.slug; // e.g., 'electrocnics/phones/iphones'
    const { includeProducts = false, productLimit = 10 } = req.query;
    
    console.log('Looking for category with full slug:', fullSlug);

    // Strategy 1: Try to find by fullPath match (most reliable for nested slugs)
    let category = await Category.findOne({
      'fullPath.slug': fullSlug,
      isDeleted: false,
      'settings.isActive': true,
      'settings.isVisible': true
    })
      .populate('parent', 'name slug level')
      .populate('ancestors._id', 'name slug');

    // Strategy 2: If not found, try exact slug match (for root categories)
    if (!category) {
      console.log('Trying exact slug match:', fullSlug);
      category = await Category.findOne({
        slug: fullSlug,
        isDeleted: false,
        'settings.isActive': true,
        'settings.isVisible': true
      })
        .populate('parent', 'name slug level')
        .populate('ancestors._id', 'name slug');
    }

    // Strategy 3: If still not found, try to find by the last part with fullPath validation
    if (!category) {
      const slugParts = fullSlug.split('/');
      const lastSlug = slugParts[slugParts.length - 1];
      
      console.log('Looking for category with slug:', lastSlug);
      
      // Find categories that have this slug
      const candidates = await Category.find({
        slug: lastSlug,
        isDeleted: false,
        'settings.isActive': true,
        'settings.isVisible': true
      }).populate('ancestors._id', 'name slug');
      
      // Check each candidate to see if its full path matches
      for (const candidate of candidates) {
        // Build the full path from ancestors and own slug
        const ancestorSlugs = candidate.ancestors.map(a => a.slug);
        const candidateFullPath = [...ancestorSlugs, candidate.slug].join('/');
        
        console.log(`Candidate ${candidate.name}:`, candidateFullPath);
        
        if (candidateFullPath === fullSlug) {
          category = candidate;
          break;
        }
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        debug: { requestedSlug: fullSlug }
      });
    }

    console.log('Found category:', category.name, 'with slug:', category.slug);

    // ============================================
    // ADD THIS: Construct full image URLs from Cloudinary
    // ============================================
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dgo3v1qbf';
    
    const addCloudinaryUrl = (media) => {
      if (!media || !media.cloudinaryId) return media;
      return {
        ...media,
        url: `https://res.cloudinary.com/${cloudName}/image/upload/${media.cloudinaryId}`,
        thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/w_300,h_300,c_fill/${media.cloudinaryId}`,
        secure_url: `https://res.cloudinary.com/${cloudName}/image/upload/${media.cloudinaryId}`
      };
    };

    // Convert category to plain object
    const categoryObj = category.toJSON();
    
    // Add URLs to image if exists
    if (categoryObj.image) {
      categoryObj.image = addCloudinaryUrl(categoryObj.image);
    }
    
    // Add URLs to banner if exists
    if (categoryObj.banner) {
      categoryObj.banner = addCloudinaryUrl(categoryObj.banner);
    }
    
    // Add URLs to iconImage if exists
    if (categoryObj.iconImage) {
      categoryObj.iconImage = addCloudinaryUrl(categoryObj.iconImage);
    }

    // Increment view count
    await category.incrementViewCount();

    // Get subcategories
    const subcategories = await Category.find({
      parent: category._id,
      isDeleted: false,
      'settings.isActive': true
    })
      .sort('settings.sortOrder')
      .select('name slug description image stats.productCount');

    // Process subcategory images
    const processedSubcategories = subcategories.map(sub => {
      const subObj = sub.toJSON();
      if (subObj.image) {
        subObj.image = addCloudinaryUrl(subObj.image);
      }
      return subObj;
    });

    // Get products if requested
    let products = [];
    if (includeProducts === 'true') {
      products = await Product.find({
        categories: category._id,
        status: 'active',
        isDeleted: false
      })
        .sort('-createdAt')
        .limit(parseInt(productLimit))
        .select('name slug price images reviews.averageRating')
        .populate('vendor', 'vendorProfile.storeName');

      // Process product images
      products = products.map(product => {
        const productObj = product.toJSON();
        if (productObj.images && productObj.images.length > 0) {
          productObj.images = productObj.images.map(img => addCloudinaryUrl(img));
        }
        return productObj;
      });
    }

    // Get breadcrumb
    const breadcrumb = await Category.getBreadcrumb(category.slug);

    res.json({
      success: true,
      data: {
        ...categoryObj,
        subcategories: processedSubcategories,
        products,
        breadcrumb
      }
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};
/**
 * @desc    Update Category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin only)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // ============================================
    // 1. PARSE JSON STRINGS FROM FORMDATA
    // ============================================
    
    // Parse settings if it's a string
    if (updates.settings && typeof updates.settings === 'string') {
      try {
        updates.settings = JSON.parse(updates.settings);
      } catch (e) {
        console.error('Error parsing settings:', e);
        updates.settings = {
          isActive: true,
          isVisible: true,
          isFeatured: false,
          showInMenu: true,
          showInHomepage: false,
          showInFooter: false,
          showInSidebar: true,
          showProductCount: true,
          sortOrder: 0,
          menuPosition: 0,
          columnCount: 4
        };
      }
    }

    // Parse seo if it's a string
    if (updates.seo && typeof updates.seo === 'string') {
      try {
        updates.seo = JSON.parse(updates.seo);
      } catch (e) {
        console.error('Error parsing seo:', e);
        updates.seo = {
          title: '',
          description: '',
          keywords: [],
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterCard: 'summary_large_image',
          robots: 'index, follow',
          schema: null
        };
      }
    }

    // Parse attributes if it's a string
    if (updates.attributes && typeof updates.attributes === 'string') {
      try {
        updates.attributes = JSON.parse(updates.attributes);
      } catch (e) {
        console.error('Error parsing attributes:', e);
        updates.attributes = [];
      }
    }

    // Parse priceRanges if it's a string
    if (updates.priceRanges && typeof updates.priceRanges === 'string') {
      try {
        updates.priceRanges = JSON.parse(updates.priceRanges);
      } catch (e) {
        console.error('Error parsing priceRanges:', e);
        updates.priceRanges = [];
      }
    }

    // Parse badges if it's a string
    if (updates.badges && typeof updates.badges === 'string') {
      try {
        updates.badges = JSON.parse(updates.badges);
      } catch (e) {
        console.error('Error parsing badges:', e);
        updates.badges = [];
      }
    }

    // Parse restrictions if it's a string
    if (updates.restrictions && typeof updates.restrictions === 'string') {
      try {
        updates.restrictions = JSON.parse(updates.restrictions);
      } catch (e) {
        console.error('Error parsing restrictions:', e);
        updates.restrictions = {
          minPurchase: 0,
          maxPurchase: 0,
          allowedCustomerGroups: [],
          allowedVendors: [],
          allowedCountries: [],
          ageRestriction: { minAge: 0, message: '' }
        };
      }
    }

    // Parse commission if it's a string
    if (updates.commission && typeof updates.commission === 'string') {
      try {
        updates.commission = JSON.parse(updates.commission);
      } catch (e) {
        console.error('Error parsing commission:', e);
        updates.commission = {
          rate: null,
          type: 'percentage',
          override: false
        };
      }
    }

    // Parse tax if it's a string
    if (updates.tax && typeof updates.tax === 'string') {
      try {
        updates.tax = JSON.parse(updates.tax);
      } catch (e) {
        console.error('Error parsing tax:', e);
        updates.tax = {
          class: null,
          rate: null,
          exempt: false
        };
      }
    }

    // Parse shipping if it's a string
    if (updates.shipping && typeof updates.shipping === 'string') {
      try {
        updates.shipping = JSON.parse(updates.shipping);
      } catch (e) {
        console.error('Error parsing shipping:', e);
        updates.shipping = {
          class: null,
          requiresShipping: true,
          freeShipping: false,
          additionalCost: 0
        };
      }
    }

    // Parse content if it's a string
    if (updates.content && typeof updates.content === 'string') {
      try {
        updates.content = JSON.parse(updates.content);
      } catch (e) {
        console.error('Error parsing content:', e);
        updates.content = {
          header: '',
          footer: '',
          bannerText: '',
          bannerLink: '',
          customCss: '',
          customJs: ''
        };
      }
    }

    // Parse tags if it's a string
    if (updates.tags && typeof updates.tags === 'string') {
      try {
        updates.tags = JSON.parse(updates.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        updates.tags = [];
      }
    }

    // Parse featuredProducts if it's a string
    if (updates.featuredProducts && typeof updates.featuredProducts === 'string') {
      try {
        updates.featuredProducts = JSON.parse(updates.featuredProducts);
      } catch (e) {
        console.error('Error parsing featuredProducts:', e);
        updates.featuredProducts = [];
      }
    }

    // Parse relatedCategories if it's a string
    if (updates.relatedCategories && typeof updates.relatedCategories === 'string') {
      try {
        updates.relatedCategories = JSON.parse(updates.relatedCategories);
      } catch (e) {
        console.error('Error parsing relatedCategories:', e);
        updates.relatedCategories = [];
      }
    }

    // ============================================
    // 2. HANDLE PARENT FIELD
    // ============================================
    
    // Convert 'null' string to actual null
    if (updates.parent === 'null' || updates.parent === '') {
      updates.parent = null;
    }

    // ============================================
    // 3. TRACK CHANGES FOR AUDIT
    // ============================================
    
    const changes = [];

    // ============================================
    // 4. HANDLE PARENT CHANGE
    // ============================================
    
    if (updates.parent !== undefined && updates.parent !== category.parent?.toString()) {
      // Prevent circular reference
      if (updates.parent === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
      
      // Check if new parent exists and is valid
      if (updates.parent) {
        const newParent = await Category.findById(updates.parent);
        
        if (!newParent) {
          return res.status(404).json({
            success: false,
            message: 'Parent category not found'
          });
        }
        
        // Check if new parent is not a descendant
        const descendants = await category.getDescendants();
        if (descendants.some(d => d._id.toString() === updates.parent)) {
          return res.status(400).json({
            success: false,
            message: 'Cannot set a descendant as parent'
          });
        }
        
        // Check depth limit
        if (newParent.level >= 10) {
          return res.status(400).json({
            success: false,
            message: 'Maximum category depth (10) exceeded'
          });
        }
      }
      
      changes.push({
        field: 'parent',
        oldValue: category.parent?.toString() || null,
        newValue: updates.parent || null
      });
      
      // Update old parent's subcategory count
      if (category.parent) {
        const oldParent = await Category.findById(category.parent);
        if (oldParent) {
          oldParent.stats.subcategoryCount = await Category.countDocuments({ 
            parent: oldParent._id,
            isDeleted: false 
          });
          await oldParent.save();
        }
      }
      
      // Set new parent
      category.parent = updates.parent || null;
      
      // Update hierarchy
      await category.updateHierarchy();
      
      // Update new parent's subcategory count
      if (category.parent) {
        const newParent = await Category.findById(category.parent);
        if (newParent) {
          newParent.stats.subcategoryCount = await Category.countDocuments({ 
            parent: newParent._id,
            isDeleted: false 
          });
          await newParent.save();
        }
      }
    }

    // ============================================
    // 5. HANDLE IMAGE UPLOADS
    // ============================================
    
    if (req.files?.image) {
      try {
        // Delete old image from cloudinary
        if (category.image?.cloudinaryId) {
          await deleteFromCloudinary(category.image.cloudinaryId);
        }
        
        const upload = await uploadToCloudinary(req.files.image[0], 'categories/images');
        updates.image = {
          url: upload.secure_url,
          thumbnailUrl: upload.eager?.[0]?.secure_url || upload.secure_url,
          alt: updates.name || category.name,
          title: updates.name || category.name,
          width: upload.width,
          height: upload.height,
          size: upload.bytes,
          format: upload.format,
          cloudinaryId: upload.public_id
        };
        changes.push({ field: 'image', oldValue: 'Updated', newValue: 'New image uploaded' });
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
      }
    }

    if (req.files?.banner) {
      try {
        // Delete old banner
        if (category.banner?.cloudinaryId) {
          await deleteFromCloudinary(category.banner.cloudinaryId);
        }
        
        const upload = await uploadToCloudinary(req.files.banner[0], 'categories/banners');
        updates.banner = {
          url: upload.secure_url,
          thumbnailUrl: upload.eager?.[0]?.secure_url || upload.secure_url,
          alt: updates.name || category.name,
          title: updates.name || category.name,
          width: upload.width,
          height: upload.height,
          size: upload.bytes,
          format: upload.format,
          cloudinaryId: upload.public_id
        };
        changes.push({ field: 'banner', oldValue: 'Updated', newValue: 'New banner uploaded' });
      } catch (uploadError) {
        console.error('Banner upload error:', uploadError);
      }
    }

    if (req.files?.icon) {
      try {
        // Delete old icon
        if (category.iconImage?.cloudinaryId) {
          await deleteFromCloudinary(category.iconImage.cloudinaryId);
        }
        
        const upload = await uploadToCloudinary(req.files.icon[0], 'categories/icons');
        updates.iconImage = {
          url: upload.secure_url,
          alt: updates.name || category.name
        };
        changes.push({ field: 'iconImage', oldValue: 'Updated', newValue: 'New icon uploaded' });
      } catch (uploadError) {
        console.error('Icon upload error:', uploadError);
      }
    }

    // ============================================
    // 6. REMOVE IMAGES
    // ============================================
    
    if (updates.removeImage === 'true' && category.image?.cloudinaryId) {
      await deleteFromCloudinary(category.image.cloudinaryId);
      updates.image = null;
      changes.push({ field: 'image', oldValue: 'Removed', newValue: null });
    }
    
    if (updates.removeBanner === 'true' && category.banner?.cloudinaryId) {
      await deleteFromCloudinary(category.banner.cloudinaryId);
      updates.banner = null;
      changes.push({ field: 'banner', oldValue: 'Removed', newValue: null });
    }
    
    if (updates.removeIcon === 'true' && category.iconImage?.cloudinaryId) {
      await deleteFromCloudinary(category.iconImage.cloudinaryId);
      updates.iconImage = null;
      changes.push({ field: 'iconImage', oldValue: 'Removed', newValue: null });
    }

    // ============================================
    // 7. UPDATE ALLOWED FIELDS
    // ============================================
    
    const allowedUpdates = [
      'name', 'description', 'seo', 'settings', 'attributes',
      'priceRanges', 'content', 'badges', 'restrictions',
      'commission', 'tax', 'shipping', 'metadata', 'tags',
      'icon', 'featuredProducts', 'relatedCategories'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const oldValue = JSON.stringify(category[field]);
        const newValue = JSON.stringify(updates[field]);
        
        if (oldValue !== newValue) {
          changes.push({ field, oldValue: category[field], newValue: updates[field] });
          category[field] = updates[field];
        }
      }
    });

    // ============================================
    // 8. SET UPDATED BY
    // ============================================
    
    category.updatedBy = userId;
    category.updatedAt = new Date();

    await category.save();

    // ============================================
    // 9. AUDIT LOG - FIXED: Now properly logs to ActivityLog
    // ============================================
    
    if (changes.length > 0) {
      await createAuditLog({
        user: userId,
        action: 'update',
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name,
        status: 'success',
        description: `Updated category: ${category.name}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // ============================================
    // 10. CLEAR CACHES
    // ============================================
    
    await clearCategoryCaches(id, category.slug);

    // Populate for response
    await category.populate('parent', 'name slug level');
    await category.populate('updatedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

/**
 * @desc    Delete Category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, permanent, reassignTo } = req.body;
    const userId = req.user._id;

    // ============================================
    // 1. VALIDATE ID
    // ============================================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // ============================================
    // 2. FIND CATEGORY
    // ============================================
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // ============================================
    // 3. CHECK IF CATEGORY HAS PRODUCTS
    // ============================================
    const productCount = await Product.countDocuments({
      categories: category._id,
      isDeleted: false
    });

    if (productCount > 0 && !reassignTo) {
      return res.status(400).json({
        success: false,
        message: `Category has ${productCount} products. Please reassign them to another category.`,
        productCount
      });
    }

    // ============================================
    // 4. CHECK IF CATEGORY HAS SUBCATEGORIES
    // ============================================
    const subcategoryCount = await Category.countDocuments({
      parent: category._id,
      isDeleted: false
    });

    if (subcategoryCount > 0 && !reassignTo) {
      return res.status(400).json({
        success: false,
        message: `Category has ${subcategoryCount} subcategories. Please reassign them first.`,
        subcategoryCount
      });
    }

    // ============================================
    // 5. REASSIGN PRODUCTS
    // ============================================
    if (reassignTo) {
      if (!mongoose.Types.ObjectId.isValid(reassignTo)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reassign category ID'
        });
      }

      const targetCategory = await Category.findById(reassignTo);
      if (!targetCategory) {
        return res.status(404).json({
          success: false,
          message: 'Target category for reassignment not found'
        });
      }

      await Product.updateMany(
        { categories: category._id },
        { $set: { 'categories.$': reassignTo } }
      );
    }

    // ============================================
    // 6. REASSIGN SUBCATEGORIES
    // ============================================
    if (reassignTo && subcategoryCount > 0) {
      await Category.updateMany(
        { parent: category._id },
        { $set: { parent: reassignTo } }
      );
      
      // Update hierarchy for all subcategories
      const subcategories = await Category.find({ parent: reassignTo });
      for (const subcat of subcategories) {
        if (subcat.updateHierarchy) {
          await subcat.updateHierarchy();
          await subcat.save();
        }
      }
    }

    // ============================================
    // 7. PERMANENT DELETE OR SOFT DELETE
    // ============================================
    if (permanent && req.user.role === 'super_admin') {
      // Delete images from cloudinary
      if (category.image?.cloudinaryId) {
        await deleteFromCloudinary(category.image.cloudinaryId).catch(err => 
          console.error('Failed to delete image from cloudinary:', err)
        );
      }
      if (category.banner?.cloudinaryId) {
        await deleteFromCloudinary(category.banner.cloudinaryId).catch(err => 
          console.error('Failed to delete banner from cloudinary:', err)
        );
      }
      if (category.iconImage?.cloudinaryId) {
        await deleteFromCloudinary(category.iconImage.cloudinaryId).catch(err => 
          console.error('Failed to delete icon from cloudinary:', err)
        );
      }
      
      await Category.findByIdAndDelete(id);
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name,
        status: 'success',
        description: `Permanently deleted category: ${category.name}`,
        metadata: { reason, reassignTo },
        severity: 'critical',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } else {
      // Soft delete
      if (category.softDelete) {
        await category.softDelete(userId, reason || 'Manual deletion');
      } else {
        // Manual soft delete if method doesn't exist
        category.isDeleted = true;
        category.deletedAt = new Date();
        category.deletedBy = userId;
        category.deletedReason = reason || 'Manual deletion';
      }
      await category.save();
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name,
        status: 'success',
        description: `Soft deleted category: ${category.name}`,
        metadata: { reason, reassignTo },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // ============================================
    // 8. UPDATE PARENT SUBCATEGORY COUNT
    // ============================================
    if (category.parent) {
      const parent = await Category.findById(category.parent);
      if (parent) {
        parent.stats.subcategoryCount = await Category.countDocuments({ 
          parent: parent._id,
          isDeleted: false 
        });
        await parent.save();
      }
    }

    // ============================================
    // 9. CLEAR CACHES
    // ============================================
    await clearCategoryCaches(id, category.slug).catch(err => 
      console.error('Failed to clear caches:', err)
    );

    res.json({
      success: true,
      message: permanent ? 'Category permanently deleted' : 'Category moved to trash'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Restore Category
 * @route   POST /api/categories/:id/restore
 * @access  Private (Admin only)
 */
export const restoreCategory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findOne({
      _id: id,
      isDeleted: true
    }).session(session);

    if (!category) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Category not found in trash'
      });
    }

    await category.restore();
    await category.save({ session });

    // Update parent subcategory count
    if (category.parent) {
      const parent = await Category.findById(category.parent).session(session);
      if (parent) {
        parent.stats.subcategoryCount = await Category.countDocuments({ 
          parent: parent._id,
          isDeleted: false 
        }).session(session);
        await parent.save({ session });
      }
    }

    await session.commitTransaction();

    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'category',
      resourceId: category._id,
      resourceName: category.name,
      status: 'success',
      description: `Restored category: ${category.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await clearCategoryCaches(id, category.slug);

    res.json({
      success: true,
      message: 'Category restored successfully',
      data: category
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Restore category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore category',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * @desc    Get Category Tree
 * @route   GET /api/categories/tree
 * @access  Public
 */
export const getCategoryTree = async (req, res) => {
  try {
    const { root = null, depth = 3, includeInactive = false } = req.query;
    
    const tree = await Category.getTree(
      root === 'null' ? null : root, 
      parseInt(depth),
      includeInactive === 'true'
    );
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree',
      error: error.message
    });
  }
};

/**
 * @desc    Get Menu Categories
 * @route   GET /api/categories/menu
 * @access  Public
 */

// In your category controller - REPLACE your getMenuCategories function

export const getMenuCategories = async (req, res) => {
  try {
    console.log('📡 Fetching menu categories...');
    
    // Get all categories
    const allCategories = await Category.find({
      'settings.showInMenu': true,
      'settings.isActive': true,
      'settings.isVisible': true,
      isDeleted: false
    })
      .select('name slug description image banner icon iconImage stats settings parent level')
      .lean();

    console.log(`✅ Found ${allCategories.length} total categories`);
    
    // Log raw data from database
    console.log('\n📋 RAW DATA FROM DATABASE:');
    allCategories.forEach(cat => {
      console.log(`  ${cat.name}:`, {
        id: cat._id.toString(),
        parent: cat.parent,
        parentType: cat.parent ? typeof cat.parent : 'null',
        parentString: cat.parent ? cat.parent.toString() : null,
        level: cat.level
      });
    });

    // Create a map for quick lookups
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: Create map with all categories and ensure parent is string
    allCategories.forEach(category => {
      // Convert parent ObjectId to string if it exists
      let parentId = null;
      if (category.parent) {
        // Handle ObjectId format { "$oid": "..." }
        if (category.parent.$oid) {
          parentId = category.parent.$oid;
          console.log(`  🔄 ${category.name}: Extracted $oid: ${parentId}`);
        } 
        // Handle regular ObjectId
        else if (category.parent.toString) {
          parentId = category.parent.toString();
          console.log(`  🔄 ${category.name}: Converted ObjectId: ${parentId}`);
        }
        // Handle any other case
        else {
          parentId = category.parent;
          console.log(`  🔄 ${category.name}: Used as is: ${parentId}`);
        }
      } else {
        console.log(`  🔄 ${category.name}: No parent (root candidate)`);
      }
      
      categoryMap.set(category._id.toString(), {
        ...category,
        parent: parentId, // Store as string ID
        children: []
      });
    });

    // Second pass: Build tree structure
    console.log('\n🌳 BUILDING TREE STRUCTURE:');
    allCategories.forEach(category => {
      const categoryId = category._id.toString();
      const categoryWithChildren = categoryMap.get(categoryId);
      
      // Get the parent ID (now stored as string)
      const parentId = categoryWithChildren.parent;
      
      if (parentId) {
        console.log(`  🔍 ${category.name} looking for parent ID: ${parentId}`);
        const parent = categoryMap.get(parentId);
        
        if (parent) {
          parent.children.push(categoryWithChildren);
          console.log(`  ✅ Nested "${category.name}" under "${parent.name}"`);
        } else {
          rootCategories.push(categoryWithChildren);
          console.log(`  ⚠️ "${category.name}" has parent ID ${parentId} but parent NOT FOUND in map`);
        }
      } else {
        rootCategories.push(categoryWithChildren);
        console.log(`  📌 Root category: "${category.name}"`);
      }
    });

    // Log rootCategories before cleaning
    console.log('\n📊 ROOT CATEGORIES BEFORE CLEANING:');
    rootCategories.forEach((cat, index) => {
      console.log(`  [${index}] ${cat.name}:`, {
        id: cat._id,
        parent: cat.parent,
        childrenCount: cat.children.length,
        children: cat.children.map(c => c.name)
      });
    });

    // Sort function for categories
    const sortCategories = (cats) => {
      cats.sort((a, b) => {
        if ((a.settings?.menuPosition || 0) !== (b.settings?.menuPosition || 0)) {
          return (a.settings?.menuPosition || 0) - (b.settings?.menuPosition || 0);
        }
        if ((a.settings?.sortOrder || 0) !== (b.settings?.sortOrder || 0)) {
          return (a.settings?.sortOrder || 0) - (b.settings?.sortOrder || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      });

      cats.forEach(cat => {
        if (cat.children?.length > 0) {
          sortCategories(cat.children);
        }
      });
    };

    sortCategories(rootCategories);

    console.log('\n📊 FINAL MENU STRUCTURE:');
    rootCategories.forEach(root => {
      console.log(`   📁 ${root.name} - Children: ${root.children.length}`);
      root.children.forEach(child => {
        console.log(`      📂 ${child.name} - Children: ${child.children.length}`);
        if (child.children.length > 0) {
          child.children.forEach(grandchild => {
            console.log(`         📄 ${grandchild.name}`);
          });
        }
      });
    });

    // Clean up the response
    const cleanCategories = rootCategories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      banner: cat.banner,
      icon: cat.icon,
      iconImage: cat.iconImage,
      level: cat.level,
      parent: cat.parent, // Include parent
      stats: cat.stats,
      settings: {
        columnCount: cat.settings?.columnCount || 4,
        menuPosition: cat.settings?.menuPosition || 0,
        sortOrder: cat.settings?.sortOrder || 0
      },
      children: cat.children.map(child => ({
        _id: child._id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        image: child.image,
        icon: child.icon,
        iconImage: child.iconImage,
        level: child.level,
        parent: child.parent, // Include parent
        stats: child.stats,
        settings: {
          columnCount: child.settings?.columnCount || 4,
          menuPosition: child.settings?.menuPosition || 0,
          sortOrder: child.settings?.sortOrder || 0
        },
        children: child.children.map(grandchild => ({
          _id: grandchild._id,
          name: grandchild.name,
          slug: grandchild.slug,
          level: grandchild.level,
          parent: grandchild.parent, // Include parent
          stats: grandchild.stats
        }))
      }))
    }));

    // Log what we're sending
    console.log('\n📤 SENDING DATA:');
    console.log('Root categories count:', cleanCategories.length);
    cleanCategories.forEach((cat, index) => {
      console.log(`  [${index}] ${cat.name}:`, {
        parent: cat.parent,
        childrenCount: cat.children.length
      });
    });

    // Disable caching for testing
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log(`\n✅ Sending ${cleanCategories.length} root categories with nested children`);
    
    res.json({
      success: true,
      data: cleanCategories
    });

  } catch (error) {
    console.error('❌ Get menu categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get Homepage Categories
 * @route   GET /api/categories/homepage
 * @access  Public
 */
export const getHomepageCategories = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const categories = await Category.getHomepageCategories(parseInt(limit));
    
    // Cache for 30 minutes
    res.set('Cache-Control', 'public, max-age=1800');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get homepage categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch homepage categories',
      error: error.message
    });
  }
};

/**
 * @desc    Get Popular Categories
 * @route   GET /api/categories/popular
 * @access  Public
 */
export const getPopularCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const categories = await Category.getPopularCategories(parseInt(limit));
    
    // Cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular categories',
      error: error.message
    });
  }
};

/**
 * @desc    Get Breadcrumb
 * @route   GET /api/categories/breadcrumb/:slug
 * @access  Public
 */
export const getBreadcrumb = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const breadcrumb = await Category.getBreadcrumb(slug);
    
    res.json({
      success: true,
      data: breadcrumb
    });
  } catch (error) {
    console.error('Get breadcrumb error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch breadcrumb',
      error: error.message
    });
  }
};

// ============================================
// ATTRIBUTE MANAGEMENT
// ============================================

/**
 * @desc    Add Attribute to Category
 * @route   POST /api/categories/:id/attributes
 * @access  Private (Admin only)
 */
export const addAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const attributeData = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Generate slug for attribute
    if (attributeData.name) {
      attributeData.slug = attributeData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
    }

    // Check for duplicate attribute name
    if (category.attributes.some(attr => attr.name === attributeData.name)) {
      return res.status(400).json({
        success: false,
        message: 'Attribute with this name already exists'
      });
    }

    category.attributes.push(attributeData);
    await category.save();

    await createAuditLog({
      user: userId,
      action: 'create',
      resourceType: 'category_attribute',
      resourceId: category._id,
      resourceName: category.name,
      status: 'success',
      description: `Added attribute ${attributeData.name} to category ${category.name}`,
      metadata: { attribute: attributeData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await clearCategoryCaches(id);

    res.json({
      success: true,
      message: 'Attribute added successfully',
      data: category.attributes[category.attributes.length - 1]
    });
  } catch (error) {
    console.error('Add attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add attribute',
      error: error.message
    });
  }
};

/**
 * @desc    Update Attribute
 * @route   PUT /api/categories/:id/attributes/:attributeId
 * @access  Private (Admin only)
 */
export const updateAttribute = async (req, res) => {
  try {
    const { id, attributeId } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(attributeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const attribute = category.attributes.id(attributeId);
    
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    // Track changes
    const changes = [];
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && JSON.stringify(attribute[key]) !== JSON.stringify(updates[key])) {
        changes.push({ field: key, oldValue: attribute[key], newValue: updates[key] });
        attribute[key] = updates[key];
      }
    });

    // Update slug if name changed
    if (updates.name) {
      attribute.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
    }

    await category.save();

    if (changes.length > 0) {
      await createAuditLog({
        user: userId,
        action: 'update',
        resourceType: 'category_attribute',
        resourceId: category._id,
        resourceName: category.name,
        status: 'success',
        description: `Updated attribute ${attribute.name}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    await clearCategoryCaches(id);

    res.json({
      success: true,
      message: 'Attribute updated successfully',
      data: attribute
    });
  } catch (error) {
    console.error('Update attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attribute',
      error: error.message
    });
  }
};

/**
 * @desc    Delete Attribute
 * @route   DELETE /api/categories/:id/attributes/:attributeId
 * @access  Private (Admin only)
 */
export const deleteAttribute = async (req, res) => {
  try {
    const { id, attributeId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(attributeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const attribute = category.attributes.id(attributeId);
    
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    const attributeName = attribute.name;
    attribute.deleteOne();

    await category.save();

    await createAuditLog({
      user: userId,
      action: 'delete',
      resourceType: 'category_attribute',
      resourceId: category._id,
      resourceName: category.name,
      status: 'success',
      description: `Deleted attribute ${attributeName} from category ${category.name}`,
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await clearCategoryCaches(id);

    res.json({
      success: true,
      message: 'Attribute deleted successfully'
    });
  } catch (error) {
    console.error('Delete attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attribute',
      error: error.message
    });
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @desc    Bulk Update Categories
 * @route   POST /api/categories/bulk
 * @access  Private (Admin only)
 */
export const bulkUpdateCategories = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { categoryIds, action, data } = req.body;
    const userId = req.user._id;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
    }

    // Validate all IDs
    for (const id of categoryIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Invalid category ID: ${id}`
        });
      }
    }

    let result;
    const categories = await Category.find({ _id: { $in: categoryIds } }).session(session);

    switch (action) {
      case 'activate':
        for (const category of categories) {
          category.settings.isActive = true;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'deactivate':
        for (const category of categories) {
          category.settings.isActive = false;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'feature':
        for (const category of categories) {
          category.settings.isFeatured = true;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'unfeature':
        for (const category of categories) {
          category.settings.isFeatured = false;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'showInMenu':
        for (const category of categories) {
          category.settings.showInMenu = true;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'hideInMenu':
        for (const category of categories) {
          category.settings.showInMenu = false;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'updateSortOrder':
        if (!data || data.sortOrder === undefined) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'sortOrder is required for this action'
          });
        }
        for (const category of categories) {
          category.settings.sortOrder = data.sortOrder;
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      case 'delete':
        for (const category of categories) {
          await category.softDelete(userId, data?.reason || 'Bulk delete');
          await category.save({ session });
        }
        result = { modifiedCount: categories.length };
        break;

      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await session.commitTransaction();

    await createAuditLog({
      user: userId,
      action: 'bulk_update',
      resourceType: 'category',
      status: 'success',
      description: `Bulk ${action} on ${result.modifiedCount} categories`,
      metadata: { categoryIds, action, data },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await clearCategoryCaches();

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} categories`,
      data: result
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk update categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update categories',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Export Categories
 * @route   GET /api/categories/export
 * @access  Private (Admin only)
 */
export const exportCategories = async (req, res) => {
  try {
    const {
      format = 'csv',
      fields,
      includeInactive = false,
      includeDeleted = false
    } = req.query;

    // Build query
    const query = {};
    
    if (!includeDeleted || includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    if (!includeInactive || includeInactive !== 'true') {
      query['settings.isActive'] = true;
    }

    // Select fields
    const selectFields = fields ? fields.split(',') : [
      'name',
      'slug',
      'level',
      'parent',
      'description',
      'stats.productCount',
      'settings.isActive',
      'settings.isFeatured',
      'settings.showInMenu',
      'createdAt'
    ];

    const categories = await Category.find(query)
      .select(selectFields.join(' '))
      .populate('parent', 'name slug')
      .lean();

    // Format data for export
    const exportData = categories.map(category => ({
      ...category,
      parentName: category.parent?.name || 'None',
      parentSlug: category.parent?.slug || null,
      productCount: category.stats?.productCount || 0,
      isActive: category.settings?.isActive ? 'Yes' : 'No',
      isFeatured: category.settings?.isFeatured ? 'Yes' : 'No',
      showInMenu: category.settings?.showInMenu ? 'Yes' : 'No',
      createdAt: category.createdAt ? new Date(category.createdAt).toISOString().split('T')[0] : ''
    }));

    // Export based on format
    switch (format) {
      case 'csv':
        try {
          const json2csvParser = new Parser();
          const csv = json2csvParser.parse(exportData);
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=categories.csv');
          return res.send(csv);
        } catch (csvError) {
          console.error('CSV export error:', csvError);
          return res.status(500).json({
            success: false,
            message: 'Failed to generate CSV',
            error: csvError.message
          });
        }

      case 'excel':
        try {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Categories');
          
          // Add headers
          if (exportData.length > 0) {
            worksheet.columns = Object.keys(exportData[0]).map(key => ({
              header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              key: key,
              width: 20
            }));
            
            // Add data
            worksheet.addRows(exportData);
            
            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          }
          
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');
          
          await workbook.xlsx.write(res);
          return res.end();
        } catch (excelError) {
          console.error('Excel export error:', excelError);
          return res.status(500).json({
            success: false,
            message: 'Failed to generate Excel',
            error: excelError.message
          });
        }

      case 'json':
      default:
        return res.json({
          success: true,
          data: exportData,
          count: exportData.length
        });
    }
  } catch (error) {
    console.error('Export categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export categories',
      error: error.message
    });
  }
};

// ============================================
// CATEGORY ANALYTICS
// ============================================

/**
 * @desc    Get Category Analytics
 * @route   GET /api/categories/analytics
 * @access  Private (Admin only)
 */
export const getCategoryAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '12m':
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // ============================================
    // 1. OVERALL STATISTICS
    // ============================================
    
    const overall = await Category.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$settings.isActive', true] }, 1, 0] }
          },
          featuredCategories: {
            $sum: { $cond: [{ $eq: ['$settings.isFeatured', true] }, 1, 0] }
          },
          totalProducts: { $sum: '$stats.productCount' },
          totalViews: { $sum: '$stats.totalViews' },
          totalRevenue: { $sum: '$stats.totalRevenue' },
          avgProductPrice: { $avg: '$stats.averageProductPrice' }
        }
      }
    ]);

    // ============================================
    // 2. LEVEL DISTRIBUTION
    // ============================================
    
    const levelDistribution = await Category.aggregate([
      { $match: { isDeleted: false, 'settings.isActive': true } },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          products: { $sum: '$stats.productCount' },
          views: { $sum: '$stats.totalViews' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          level: '$_id',
          count: 1,
          products: 1,
          views: 1,
          _id: 0
        }
      }
    ]);

    // ============================================
    // 3. TOP CATEGORIES BY PRODUCTS
    // ============================================
    
    const topByProducts = await Category.aggregate([
      { $match: { isDeleted: false, 'settings.isActive': true } },
      { $sort: { 'stats.productCount': -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          slug: 1,
          productCount: '$stats.productCount',
          viewCount: '$stats.totalViews',
          revenue: '$stats.totalRevenue',
          level: 1
        }
      }
    ]);

    // ============================================
    // 4. TOP CATEGORIES BY VIEWS
    // ============================================
    
    const topByViews = await Category.aggregate([
      { $match: { isDeleted: false, 'settings.isActive': true } },
      { $sort: { 'stats.totalViews': -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          slug: 1,
          productCount: '$stats.productCount',
          viewCount: '$stats.totalViews',
          revenue: '$stats.totalRevenue',
          level: 1
        }
      }
    ]);

    // ============================================
    // 5. VIEW TRENDS
    // ============================================
    
    const viewTrends = await Category.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$analytics.monthlyViews' },
      {
        $match: {
          'analytics.monthlyViews.year': { $gte: startDate.getFullYear() }
        }
      },
      {
        $group: {
          _id: {
            year: '$analytics.monthlyViews.year',
            month: '$analytics.monthlyViews.month'
          },
          views: { $sum: '$analytics.monthlyViews.count' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          views: 1,
          date: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        overall: overall[0] || {
          totalCategories: 0,
          activeCategories: 0,
          featuredCategories: 0,
          totalProducts: 0,
          totalViews: 0,
          totalRevenue: 0,
          avgProductPrice: 0
        },
        levelDistribution,
        topByProducts,
        topByViews,
        viewTrends
      }
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category analytics',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Clear category caches
 */
async function clearCategoryCaches(categoryId = null, slug = null) {
  try {
    // Check if redis is available
    if (!redis) {
      return;
    }
    
    const keys = [];
    
    if (categoryId) {
      keys.push(`category:${categoryId}`);
      keys.push(`category:${categoryId}:details`);
    }
    if (slug) {
      keys.push(`category:slug:${slug}`);
    }
    
    // Get all matching keys
    const patterns = [
      'categories:list*',
      'categories:tree*',
      'categories:menu*',
      'categories:homepage*',
      'categories:popular*',
      'categories:analytics*'
    ];
    
    for (const pattern of patterns) {
      try {
        // Try to use scan if available (safer for production)
        if (redis.scan && typeof redis.scan === 'function') {
          let cursor = '0';
          do {
            const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = result[0];
            const scannedKeys = result[1];
            keys.push(...scannedKeys);
          } while (cursor !== '0');
        } else if (redis.keys && typeof redis.keys === 'function') {
          // Fallback to keys (use with caution in production)
          const matchingKeys = await redis.keys(pattern);
          if (Array.isArray(matchingKeys)) {
            keys.push(...matchingKeys);
          }
        }
      } catch (patternError) {
        console.error(`Error scanning pattern ${pattern}:`, patternError.message);
      }
    }
    
    // Remove duplicates
    const uniqueKeys = [...new Set(keys)];
    
    if (uniqueKeys.length > 0) {
      if (redis.del && typeof redis.del === 'function') {
        await redis.del(uniqueKeys);
  
      }
    }
  } catch (error) {
    console.error('Cache clear error:', error.message);
    // Don't throw - non-critical
  }
}

// ============================================
// EXPORT CONTROLLER
// ============================================

export default {
  // CRUD Operations
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  restoreCategory,
  
  // Category Management
  getCategoryTree,
  getMenuCategories,
  getHomepageCategories,
  getPopularCategories,
  getBreadcrumb,
  
  // Attribute Management
  addAttribute,
  updateAttribute,
  deleteAttribute,
  
  // Bulk Operations
  bulkUpdateCategories,
  exportCategories,
  
  // Analytics
  getCategoryAnalytics
};