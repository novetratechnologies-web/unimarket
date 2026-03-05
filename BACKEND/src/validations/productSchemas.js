// FILE: src/validations/productSchemas.js

import Joi from 'joi';

// ============================================
// CUSTOM VALIDATORS
// ============================================

/**
 * Custom ObjectId validator
 */
const objectId = Joi.string().hex().length(24).messages({
    'string.hex': 'Invalid ID format',
    'string.length': 'Invalid ID format'
});

/**
 * Custom URL validator
 */
const url = Joi.string().uri().messages({
    'string.uri': 'Invalid URL format'
});

/**
 * Custom currency validator
 */
const currency = Joi.string().valid('KES','USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR');

/**
 * Custom date validator
 */
const date = Joi.date().iso().messages({
    'date.iso': 'Invalid date format'
});

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * ID param schema
 */
export const idParamSchema = Joi.object({
    id: objectId.required()
});

/**
 * Slug param schema
 */
export const slugParamSchema = Joi.object({
    slug: Joi.string().required().min(3).max(200).pattern(/^[a-z0-9-]+$/).messages({
        'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
        'string.min': 'Slug must be at least 3 characters long',
        'string.max': 'Slug cannot exceed 200 characters',
        'any.required': 'Slug is required'
    })
});

/**
 * Pagination query schema
 */
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid(
         'createdAt', 'updatedAt', 'price', 'name', 
        'rating', 'popularity', 'relevance', 'featured',
        'sold', 'totalSold', 'quantity', 'stock' 
    ).default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

/**
 * Dimension schema
 */
const dimensionSchema = Joi.object({
    length: Joi.number().min(0).optional(),
    width: Joi.number().min(0).optional(),
    height: Joi.number().min(0).optional(),
    unit: Joi.string().valid('cm', 'in', 'mm').default('cm')
}).optional();

/**
 * Specification schema
 */
const specificationSchema = Joi.object({
    name: Joi.string().required().max(100).messages({
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    value: Joi.string().required().max(500).messages({
        'string.max': 'Value cannot exceed 500 characters',
        'any.required': 'Value is required'
    }),
    unit: Joi.string().max(20).optional(),
    isHighlighted: Joi.boolean().default(false),
    group: Joi.string().max(50).optional(),
    sortOrder: Joi.number().integer().min(0).default(0)
});

/**
 * Attribute schema
 */
const attributeSchema = Joi.object({
    name: Joi.string().required().max(100).messages({
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    value: Joi.any().required(),
    type: Joi.string().valid('text', 'number', 'boolean', 'date', 'select', 'multiselect').default('text'),
    group: Joi.string().max(50).optional(),
    isFilterable: Joi.boolean().default(false),
    isSearchable: Joi.boolean().default(true),
    isComparable: Joi.boolean().default(false),
    isVariant: Joi.boolean().default(false)
});

/**
 * Bulk pricing schema
 */
const bulkPricingSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
    }),
    price: Joi.number().min(0).required().messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required'
    }),
    discountType: Joi.string().valid('percentage', 'fixed').default('fixed')
});

/**
 * SEO schema
 */
const seoSchema = Joi.object({
    title: Joi.string().max(70).optional(),
    description: Joi.string().max(320).optional(),
    keywords: Joi.array().items(Joi.string().max(50)).optional(),
    ogTitle: Joi.string().max(70).optional(),
    ogDescription: Joi.string().max(200).optional(),
    ogImage: Joi.string().uri().optional(),
    ogType: Joi.string().default('product'),
    twitterCard: Joi.string().valid('summary', 'summary_large_image', 'app', 'player').default('summary_large_image'),
    twitterTitle: Joi.string().max(70).optional(),
    twitterDescription: Joi.string().max(200).optional(),
    twitterImage: Joi.string().uri().optional(),
    canonical: Joi.string().uri().optional(),
    robots: Joi.string().default('index, follow')
}).optional();

/**
 * Image schema
 */
const imageSchema = Joi.object({
    _id: Joi.alternatives().try(
        objectId,
        Joi.string().pattern(/^temp-/),
        Joi.any().strip()
    ).optional(),
    url: url.required(),
    thumbnailUrl: url.optional(),
    mediumUrl: url.optional(),
    largeUrl: url.optional(),
    alt: Joi.string().max(200).optional(),
    title: Joi.string().max(200).optional(),
    caption: Joi.string().max(500).optional(),
    isPrimary: Joi.boolean().default(false),
    sortOrder: Joi.number().integer().min(0).default(0),
    width: Joi.number().integer().min(0).optional(),
    height: Joi.number().integer().min(0).optional(),
    size: Joi.number().integer().min(0).optional(),
    format: Joi.string().optional(),
    cloudinaryId: Joi.string().optional(),
    focalPoint: Joi.object({
        x: Joi.number().min(0).max(1),
        y: Joi.number().min(0).max(1)
    }).optional()
});

/**
 * Variant option schema
 */
const variantOptionSchema = Joi.object({
    name: Joi.string().required().max(50).messages({
        'string.max': 'Option name cannot exceed 50 characters',
        'any.required': 'Option name is required'
    }),
    value: Joi.string().required().max(100).messages({
        'string.max': 'Option value cannot exceed 100 characters',
        'any.required': 'Option value is required'
    })
});

/**
 * ✅ FIXED: Variant schema - make _id optional and accept temp IDs
 */
const variantSchema = Joi.object({
    _id: Joi.alternatives().try(
        objectId,
        Joi.string().pattern(/^temp-/),
        Joi.any().strip()
    ).optional(),
    sku: Joi.string().alphanum().min(3).max(50).required().messages({
        'string.alphanum': 'SKU must contain only alphanumeric characters',
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
        'any.required': 'SKU is required'
    }),
    barcode: Joi.string().max(50).optional(),
    gtin: Joi.string().max(50).optional(),
    upc: Joi.string().max(50).optional(),
    ean: Joi.string().max(50).optional(),
    mpn: Joi.string().max(50).optional(),
    name: Joi.string().max(200).optional(),
    price: Joi.number().min(0).required().messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required'
    }),
    compareAtPrice: Joi.number().min(0).when('price', {
        is: Joi.exist(),
        then: Joi.number().greater(Joi.ref('price')).optional().messages({
            'number.greater': 'Compare at price must be greater than regular price'
        })
    }).optional(),
    cost: Joi.number().min(0).optional(),
    wholesalePrice: Joi.number().min(0).optional(),
    quantity: Joi.number().integer().min(0).default(0),
    reservedQuantity: Joi.number().integer().min(0).default(0),
    lowStockThreshold: Joi.number().integer().min(0).default(5),
    trackQuantity: Joi.boolean().default(true),
    allowBackorder: Joi.boolean().default(false),
    backorderLimit: Joi.number().integer().min(0).default(0),
    options: Joi.array().items(variantOptionSchema).min(1).optional(),
    attributes: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    image: Joi.alternatives().try(objectId, Joi.string()).optional(),
    images: Joi.array().items(objectId).optional(),
    weight: Joi.number().min(0).optional(),
    weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('g'),
    dimensions: dimensionSchema.optional(),
    isDefault: Joi.boolean().default(false),
    status: Joi.string().valid('active', 'inactive', 'discontinued').default('active'),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

/**
 * ✅ FIXED: Variant attributes schema
 */
const variantAttributeSchema = Joi.object({
    id: Joi.alternatives().try(
        Joi.string().pattern(/^[0-9]+$/),
        Joi.string().pattern(/^temp-/),
        Joi.any().strip()
    ).optional(),
    name: Joi.string().required().valid(
        'size', 'color', 'material', 'style', 'pattern', 
        'length', 'width', 'height', 'weight', 'capacity', 
        'flavor', 'scent', 'finish', 'edition', 'other'
    ).messages({
        'any.only': 'Attribute name must be a valid option type'
    }),
    values: Joi.array().items(Joi.string()).min(1).required(),
    displayType: Joi.string().valid('text', 'color_swatch', 'image_swatch', 'button').default('text'),
    swatchValues: Joi.array().items(Joi.object({
        value: Joi.string(),
        color: Joi.string().optional(),
        image: Joi.string().uri().optional()
    })).optional()
});

/**
 * Video schema
 */
const videoSchema = Joi.object({
    _id: Joi.alternatives().try(objectId, Joi.any().strip()).optional(),
    url: url.required(),
    embedUrl: url.optional(),
    thumbnailUrl: url.optional(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    duration: Joi.number().integer().min(0).optional(),
    platform: Joi.string().valid('youtube', 'vimeo', 'dailymotion', 'tiktok', 'instagram', 'facebook', 'other').default('youtube'),
    videoId: Joi.string().optional(),
    sortOrder: Joi.number().integer().min(0).default(0)
});

/**
 * Document schema
 */
const documentSchema = Joi.object({
    _id: Joi.alternatives().try(objectId, Joi.any().strip()).optional(),
    url: url.required(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    fileType: Joi.string().max(50).optional(),
    fileSize: Joi.number().integer().min(0).optional(),
    pages: Joi.number().integer().min(0).optional(),
    sortOrder: Joi.number().integer().min(0).default(0)
});

/**
 * Digital file schema
 */
const digitalFileSchema = Joi.object({
    url: url.optional(),
    filename: Joi.string().max(255).optional(),
    filesize: Joi.number().integer().min(0).optional(),
    filetype: Joi.string().max(100).optional(),
    downloadLimit: Joi.number().integer().min(0).default(0),
    downloadExpiry: Joi.number().integer().min(0).default(30),
    previewUrl: url.optional(),
    licenseKey: Joi.string().optional()
}).optional();

/**
 * Warehouse schema
 */
const warehouseSchema = Joi.object({
    warehouse: objectId.optional(),
    quantity: Joi.number().integer().min(0).default(0),
    reservedQuantity: Joi.number().integer().min(0).default(0),
    location: Joi.object({
        aisle: Joi.string().optional(),
        shelf: Joi.string().optional(),
        bin: Joi.string().optional(),
        zone: Joi.string().optional()
    }).optional(),
    isDefault: Joi.boolean().default(false)
});

/**
 * Warranty schema
 */
const warrantySchema = Joi.object({
    hasWarranty: Joi.boolean().default(false),
    period: Joi.object({
        value: Joi.number().integer().min(0).optional(),
        unit: Joi.string().valid('days', 'months', 'years').default('months')
    }).optional(),
    description: Joi.string().max(500).optional(),
    terms: Joi.string().max(2000).optional(),
    provider: Joi.string().max(200).optional()
}).optional();

/**
 * Return policy schema
 */
const returnPolicySchema = Joi.object({
    isReturnable: Joi.boolean().default(true),
    returnPeriod: Joi.number().integer().min(0).default(30),
    restockingFee: Joi.number().min(0).max(100).default(0),
    conditions: Joi.string().max(1000).optional(),
    instructions: Joi.string().max(1000).optional(),
    returnMethod: Joi.string().valid('store_credit', 'refund', 'exchange').default('refund'),
    refundMethod: Joi.string().valid('original_payment', 'store_credit', 'bank_transfer').default('original_payment'),
    requiresAuthorization: Joi.boolean().default(true)
}).optional();

/**
 * Manufacturer schema
 */
const manufacturerSchema = Joi.object({
    name: Joi.string().max(200).optional(),
    partNumber: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    contact: Joi.string().max(200).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(50).optional(),
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zipCode: Joi.string().optional()
    }).optional()
}).optional();

/**
 * Certification schema
 */
const certificationSchema = Joi.object({
    name: Joi.string().max(200).optional(),
    authority: Joi.string().max(200).optional(),
    certificateNumber: Joi.string().max(100).optional(),
    issuedDate: Joi.date().optional(),
    expiryDate: Joi.date().min(Joi.ref('issuedDate')).optional().messages({
        'date.min': 'Expiry date must be after issued date'
    }),
    document: Joi.string().uri().optional()
});

/**
 * Admin note schema
 */
const adminNoteSchema = Joi.object({
    id: Joi.alternatives().try(Joi.string(), Joi.any().strip()).optional(),
    note: Joi.string().required(),
    createdBy: objectId.required(),
    createdAt: Joi.date().default(Date.now),
    isPrivate: Joi.boolean().default(true),
    category: Joi.string().valid('general', 'quality', 'inventory', 'pricing', 'compliance').default('general')
});

/**
 * Bundle item schema
 */
const bundleItemSchema = Joi.object({
    id: Joi.alternatives().try(Joi.string(), Joi.any().strip()).optional(),
    product: objectId.required(),
    variant: objectId.optional(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    discountType: Joi.string().valid('percentage', 'fixed').default('fixed'),
    discountValue: Joi.number().min(0).optional(),
    isOptional: Joi.boolean().default(false),
    minQuantity: Joi.number().integer().min(1).default(1),
    maxQuantity: Joi.number().integer().min(1).optional()
});

/**
 * ✅ FIXED: Create product schema - complete with all fields
 */
export const createProductSchema = Joi.object({
    // Basic Info
    name: Joi.string().required().min(3).max(200).messages({
        'string.min': 'Product name must be at least 3 characters long',
        'string.max': 'Product name cannot exceed 200 characters',
        'any.required': 'Product name is required'
    }),
    slug: Joi.string().min(3).max(200).pattern(/^[a-z0-9-]+$/).optional(),
    sku: Joi.string().alphanum().min(3).max(50).optional(),
    barcode: Joi.string().max(50).optional(),
    gtin: Joi.string().max(50).optional(),
    mpn: Joi.string().max(50).optional(),
    isbn: Joi.string().max(50).optional(),
    upc: Joi.string().max(50).optional(),
    ean: Joi.string().max(50).optional(),

        vendor: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Invalid vendor ID format',
        'string.length': 'Vendor ID must be 24 characters',
        'any.required': 'Vendor is required'
    }),

    // Description
    description: Joi.string().required().max(5000).messages({
        'string.max': 'Description cannot exceed 5000 characters',
        'any.required': 'Description is required'
    }),
    shortDescription: Joi.string().max(500).optional(),
    highlights: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    specifications: Joi.array().items(specificationSchema).max(50).optional(),

    // Pricing
    currency: currency.default('USD'),
    price: Joi.number().required().min(0).precision(2).messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required'
    }),
    compareAtPrice: Joi.number().min(0).precision(2).when('price', {
        is: Joi.exist(),
        then: Joi.number().greater(Joi.ref('price')).optional().messages({
            'number.greater': 'Compare at price must be greater than regular price'
        })
    }).optional(),
    cost: Joi.number().min(0).precision(2).optional(),
    wholesalePrice: Joi.number().min(0).precision(2).optional(),
    minimumWholesaleQuantity: Joi.number().integer().min(1).default(1),
    bulkPricing: Joi.array().items(bulkPricingSchema).optional(),
    volumeDiscounts: Joi.array().items(Joi.object()).optional(),

    // Inventory
    quantity: Joi.number().integer().min(0).default(0),
    reservedQuantity: Joi.number().integer().min(0).default(0),
    lowStockThreshold: Joi.number().integer().min(0).default(5),
    trackQuantity: Joi.boolean().default(true),
    allowBackorder: Joi.boolean().default(false),
    backorderLimit: Joi.number().integer().min(0).default(0),
    backorderLeadTime: Joi.number().integer().min(0).optional(),
    inventoryTrackingMethod: Joi.string().valid('continuous', 'periodic', 'just_in_time').default('continuous'),
    reorderPoint: Joi.number().integer().min(0).optional(),
    reorderQuantity: Joi.number().integer().min(1).optional(),
    safetyStock: Joi.number().integer().min(0).default(0),
    maximumStock: Joi.number().integer().min(0).optional(),
    inventoryAlerts: Joi.object({
        enabled: Joi.boolean().default(false),
        thresholds: Joi.array().items(Joi.number().min(0)).default([5, 10]),
        emailNotifications: Joi.boolean().default(true)
    }).optional(),
    stockStatusDisplay: Joi.string().valid('in_stock', 'out_of_stock', 'pre_order', 'discontinued', 'coming_soon').default('in_stock'),
    preOrderAvailability: Joi.object({
        expectedDate: Joi.date().optional(),
        availableQuantity: Joi.number().integer().min(0).optional()
    }).optional(),

    // Warehouses
    warehouses: Joi.array().items(warehouseSchema).optional(),
    defaultWarehouse: objectId.optional(),

    // ✅ FIXED: Variants - handle temporary IDs
    hasVariants: Joi.boolean().default(false),
    variantAttributes: Joi.array().items(variantAttributeSchema).when('hasVariants', {
        is: true,
        then: Joi.array().min(1).optional(),
        otherwise: Joi.array().max(0).optional()
    }),
    variants: Joi.array().items(variantSchema).when('hasVariants', {
        is: true,
        then: Joi.array().min(1).required().messages({
            'array.min': 'At least one variant is required when product has variants'
        }),
        otherwise: Joi.array().max(0).optional()
    }),

    // Media
    images: Joi.array().items(imageSchema).max(20).optional(),
    videos: Joi.array().items(videoSchema).max(10).optional(),
    documents: Joi.array().items(documentSchema).max(10).optional(),
    threeDModel: Joi.object({
        url: Joi.string().uri().optional(),
        format: Joi.string().optional(),
        size: Joi.number().integer().min(0).optional(),
        thumbnailUrl: Joi.string().uri().optional(),
        isAr: Joi.boolean().optional()
    }).optional(),
    augmentedReality: Joi.object({
        enabled: Joi.boolean().optional(),
        url: Joi.string().uri().optional(),
        format: Joi.string().optional(),
        scale: Joi.number().min(0).optional()
    }).optional(),

    // Categorization
    categories: Joi.array().items(objectId).optional(),
    primaryCategory: objectId.optional(),
    collections: Joi.array().items(objectId).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    attributes: Joi.array().items(attributeSchema).max(100).optional(),
    type: Joi.string().valid('simple', 'variable', 'grouped', 'bundle', 'digital', 'service', 'subscription').default('simple'),
    productType: objectId.optional(),

    // Brand & Manufacturer
    brand: objectId.optional(),
    brandName: Joi.string().optional(),
    manufacturer: manufacturerSchema,
    countryOfOrigin: Joi.string().length(2).uppercase().optional(),

    // Shipping
    weight: Joi.number().min(0).optional(),
    weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('g'),
    dimensions: dimensionSchema,
    shippingClass: objectId.optional(),
    freeShipping: Joi.boolean().default(false),
    shippingCost: Joi.number().min(0).precision(2).optional(),
    shippingCostPerItem: Joi.boolean().default(false),
    flatShippingRate: Joi.number().min(0).optional(),
    shippingRates: Joi.array().items(Joi.object({
        method: Joi.string().optional(),
        cost: Joi.number().min(0).optional(),
        currency: Joi.string().optional(),
        estimatedDays: Joi.object({
            min: Joi.number().min(0).optional(),
            max: Joi.number().min(0).optional()
        }).optional(),
        locations: Joi.array().items(Joi.string()).optional(),
        trackingAvailable: Joi.boolean().optional()
    })).optional(),
    estimatedDelivery: Joi.object({
        min: Joi.number().min(0).optional(),
        max: Joi.number().min(0).optional(),
        unit: Joi.string().valid('hours', 'days', 'weeks').default('days')
    }).optional(),
    requiresShipping: Joi.boolean().default(true),
    hazardous: Joi.boolean().default(false),
    hazardousClass: Joi.string().optional(),
    perishable: Joi.boolean().default(false),
    expiryDate: Joi.date().optional(),
    storageRequirements: Joi.string().optional(),

    // Tax
    isTaxable: Joi.boolean().default(true),
    taxClass: objectId.optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    taxCode: Joi.string().optional(),
    taxIncluded: Joi.boolean().default(false),
    customsInformation: Joi.object({
        hsCode: Joi.string().optional(),
        countryOfOrigin: Joi.string().length(2).uppercase().optional(),
        description: Joi.string().optional(),
        value: Joi.number().min(0).optional()
    }).optional(),

    // SEO
    seo: seoSchema,

    // Status & Visibility
    visibility: Joi.string().valid('public', 'private', 'hidden', 'password').default('public'),
    featured: Joi.boolean().default(false),
    scheduledAt: Joi.date().optional(),
    unpublishAt: Joi.date().optional(),

    // Badges
    isNew: Joi.boolean().default(false),
    isTrending: Joi.boolean().default(false),
    isBestSeller: Joi.boolean().default(false),
    isExclusive: Joi.boolean().default(false),
    isGiftCard: Joi.boolean().default(false),

    // Bundle
    isBundle: Joi.boolean().default(false),
    bundleType: Joi.string().valid('fixed', 'configurable', 'dynamic').default('fixed'),
    bundleItems: Joi.array().items(bundleItemSchema).when('isBundle', {
        is: true,
        then: Joi.array().min(1).optional(),
        otherwise: Joi.array().max(0).optional()
    }),
    bundleSavings: Joi.number().min(0).optional(),
    bundleSavingsPercentage: Joi.number().min(0).max(100).optional(),

    // Digital
    isDigital: Joi.boolean().default(false),
    digitalFile: digitalFileSchema,

    // Warranty & Returns
    warranty: warrantySchema,
    returnPolicy: returnPolicySchema,

    // Certifications
    certifications: Joi.array().items(certificationSchema).optional(),

    // Notes
    notes: Joi.string().max(1000).optional(),
    adminNotes: Joi.array().items(adminNoteSchema).optional(),

    // Metadata
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),

    // Versioning
    version: Joi.number().integer().min(1).default(1),

    // Timestamps
    lastUpdatedAt: Joi.date().default(Date.now)
});

/**
 * Update product schema
 */
export const updateProductSchema = Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    slug: Joi.string().min(3).max(200).pattern(/^[a-z0-9-]+$/).optional(),
    sku: Joi.string().alphanum().min(3).max(50).optional(),
    barcode: Joi.string().max(50).optional(),
    description: Joi.string().max(5000).optional(),
    shortDescription: Joi.string().max(500).optional(),
    highlights: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    specifications: Joi.array().items(specificationSchema).max(50).optional(),
    price: Joi.number().min(0).precision(2).optional(),
    compareAtPrice: Joi.number().min(0).precision(2).optional(),
    cost: Joi.number().min(0).precision(2).optional(),
    quantity: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('draft', 'pending', 'active', 'inactive', 'archived').optional(),
    visibility: Joi.string().valid('public', 'private', 'hidden').optional(),
    featured: Joi.boolean().optional(),
    categories: Joi.array().items(objectId).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    images: Joi.array().items(imageSchema).optional(),
    removeImages: Joi.alternatives().try(objectId, Joi.array().items(objectId)).optional(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
}).min(1);

// ============================================
// INVENTORY SCHEMAS
// ============================================

/**
 * Inventory update schema
 */
export const inventoryUpdateSchema = Joi.object({
    quantity: Joi.number().integer().min(0).required().messages({
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity cannot be negative',
        'any.required': 'Quantity is required'
    }),
    variantId: objectId.optional(),
    operation: Joi.string().valid('set', 'increase', 'decrease').default('set'),
    warehouseId: objectId.optional(),
    reason: Joi.string().max(500).optional()
});

/**
 * Bulk inventory update schema
 */
export const bulkInventorySchema = Joi.object({
    updates: Joi.array().items(Joi.object({
        productId: objectId.required(),
        variantId: objectId.optional(),
        quantity: Joi.number().integer().min(0).required(),
        operation: Joi.string().valid('set', 'increase', 'decrease').default('set'),
        reason: Joi.string().max(500).optional()
    })).min(1).max(100).required()
});

// ============================================
// BULK OPERATIONS SCHEMAS
// ============================================

/**
 * Bulk product schema
 */
export const bulkProductSchema = Joi.object({
    productIds: Joi.array().items(objectId).min(1).max(1000).required(),
    action: Joi.string().valid(
        'activate', 'deactivate', 'delete',
        'update-price', 'update-quantity',
        'add-category', 'remove-category',
        'add-tags', 'remove-tags',
        'update-featured', 'update-tax', 'update-shipping',
        'archive', 'restore'
    ).required(),
    data: Joi.when('action', {
        switch: [
            { is: 'update-price', then: Joi.object({
                price: Joi.number().min(0).required(),
                compareAtPrice: Joi.number().min(0).optional()
            })},
            { is: 'update-quantity', then: Joi.object({
                quantity: Joi.number().integer().min(0).required(),
                operation: Joi.string().valid('set', 'increase', 'decrease').default('set')
            })},
            { is: 'add-category', then: Joi.object({
                categoryId: objectId.required()
            })},
            { is: 'remove-category', then: Joi.object({
                categoryId: objectId.required()
            })},
            { is: 'add-tags', then: Joi.object({
                tags: Joi.array().items(Joi.string().max(50)).required()
            })},
            { is: 'remove-tags', then: Joi.object({
                tags: Joi.array().items(Joi.string().max(50)).required()
            })},
            { is: 'update-featured', then: Joi.object({
                featured: Joi.boolean().required(),
                featuredRank: Joi.number().integer().min(0).optional()
            })},
            { is: 'update-tax', then: Joi.object({
                isTaxable: Joi.boolean().optional(),
                taxClass: objectId.optional(),
                taxRate: Joi.number().min(0).max(100).optional()
            })},
            { is: 'update-shipping', then: Joi.object({
                weight: Joi.number().min(0).optional(),
                dimensions: dimensionSchema,
                freeShipping: Joi.boolean().optional(),
                shippingClass: objectId.optional()
            })},
            { is: 'delete', then: Joi.object({
                reason: Joi.string().max(500).optional(),
                permanent: Joi.boolean().default(false)
            })}
        ],
        otherwise: Joi.object().default({})
    })
});

/**
 * Product import schema
 */
export const productImportSchema = Joi.object({
    format: Joi.string().valid('csv', 'excel', 'json').default('csv'),
    updateExisting: Joi.boolean().default(false),
    skipValidation: Joi.boolean().default(false),
    mapping: Joi.object().pattern(Joi.string(), Joi.string()).default({})
});

/**
 * Product export schema
 */
export const productExportSchema = Joi.object({
    format: Joi.string().valid('csv', 'excel', 'json', 'pdf').default('csv'),
    fields: Joi.string().optional(),
    status: Joi.string().optional(),
    category: Joi.string().optional(),
    vendor: Joi.string().optional(),
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    includeVariants: Joi.boolean().default(true),
    includeImages: Joi.boolean().default(false)
});

// ============================================
// APPROVAL SCHEMAS
// ============================================

/**
 * Product approval schema
 */
export const productApprovalSchema = Joi.object({
    notes: Joi.string().max(1000).optional(),
    publishNow: Joi.boolean().default(true)
});

/**
 * Product rejection schema
 */
export const productRejectionSchema = Joi.object({
    reason: Joi.string().required().max(500),
    notes: Joi.string().max(1000).optional()
});

/**
 * Product changes schema
 */
export const productChangesSchema = Joi.object({
    changes: Joi.array().items(Joi.object({
        field: Joi.string().required(),
        message: Joi.string().required().max(500)
    })).min(1).required(),
    notes: Joi.string().max(1000).optional()
});

// ============================================
// REVIEW SCHEMAS
// ============================================

/**
 * Review schema
 */
export const reviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    title: Joi.string().max(100).optional(),
    content: Joi.string().required().max(2000),
    pros: Joi.array().items(Joi.string().max(200)).optional(),
    cons: Joi.array().items(Joi.string().max(200)).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    isAnonymous: Joi.boolean().default(false),
    metadata: Joi.object().optional()
});

/**
 * Review update schema
 */
export const reviewUpdateSchema = Joi.object({
    rating: Joi.number().min(1).max(5).optional(),
    title: Joi.string().max(100).optional(),
    content: Joi.string().max(2000).optional(),
    pros: Joi.array().items(Joi.string().max(200)).optional(),
    cons: Joi.array().items(Joi.string().max(200)).optional()
}).min(1);

// ============================================
// QUESTION SCHEMAS
// ============================================

/**
 * Question schema
 */
export const questionSchema = Joi.object({
    question: Joi.string().required().max(500),
    isAnonymous: Joi.boolean().default(false)
});

/**
 * Answer schema
 */
export const answerSchema = Joi.object({
    answer: Joi.string().required().max(1000)
});

// ============================================
// WISHLIST SCHEMAS
// ============================================

/**
 * Wishlist schema
 */
export const wishlistSchema = Joi.object({
    productId: objectId.required(),
    variantId: objectId.optional(),
    notes: Joi.string().max(500).optional()
});

// ============================================
// COMPARE SCHEMAS
// ============================================

/**
 * Compare schema
 */
export const compareSchema = Joi.object({
    productIds: Joi.array().items(objectId).min(2).max(4).required()
});

// ============================================
// SEARCH SCHEMAS
// ============================================

/**
 * Search schema
 */
export const searchSchema = Joi.object({
    q: Joi.string().required().min(2).max(100),
    type: Joi.string().valid('semantic', 'visual', 'fuzzy', 'vector', 'hybrid').default('hybrid'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    sortBy: Joi.string().valid('relevance', 'price', 'rating', 'newest', 'popularity').default('relevance'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    categories: Joi.string().optional(),
    vendors: Joi.string().optional(),
    inStock: Joi.boolean().optional(),
    onSale: Joi.boolean().optional(),
    rating: Joi.number().min(1).max(5).optional(),
    tags: Joi.string().optional(),
    brand: Joi.string().optional(),
    freeShipping: Joi.boolean().optional(),
    isDigital: Joi.boolean().optional()
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

/**
 * Analytics schema
 */
export const productAnalyticsSchema = Joi.object({
    period: Joi.string().valid('24h', '7d', '30d', '90d', '12m').default('30d'),
    groupBy: Joi.string().valid('hour', 'day', 'week', 'month', 'year').default('day'),
    category: Joi.string().optional(),
    vendor: Joi.string().optional(),
    compare: Joi.boolean().default(false)
});

// ============================================
// VARIANT SCHEMAS
// ============================================

/**
 * Create variant schema
 */
export const createVariantSchema = Joi.object({
    sku: Joi.string().alphanum().min(3).max(50).required(),
    barcode: Joi.string().max(50).optional(),
    name: Joi.string().max(200).optional(),
    price: Joi.number().min(0).required(),
    compareAtPrice: Joi.number().min(0).optional(),
    cost: Joi.number().min(0).optional(),
    quantity: Joi.number().integer().min(0).default(0),
    options: Joi.array().items(variantOptionSchema).min(1).required(),
    weight: Joi.number().min(0).optional(),
    weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('g'),
    dimensions: dimensionSchema,
    isDefault: Joi.boolean().default(false),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

/**
 * Update variant schema
 */
export const updateVariantSchema = Joi.object({
    sku: Joi.string().alphanum().min(3).max(50).optional(),
    barcode: Joi.string().max(50).optional(),
    name: Joi.string().max(200).optional(),
    price: Joi.number().min(0).optional(),
    compareAtPrice: Joi.number().min(0).optional(),
    cost: Joi.number().min(0).optional(),
    quantity: Joi.number().integer().min(0).optional(),
    options: Joi.array().items(variantOptionSchema).optional(),
    weight: Joi.number().min(0).optional(),
    weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').optional(),
    dimensions: dimensionSchema,
    isDefault: Joi.boolean().optional(),
    status: Joi.string().valid('active', 'inactive', 'discontinued').optional(),
    metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional()
}).min(1);

// ============================================
// PROMOTION SCHEMAS
// ============================================

/**
 * Promotion schema
 */
export const promotionSchema = Joi.object({
    promotionId: objectId.required(),
    discountType: Joi.string().valid('percentage', 'fixed').optional(),
    discountValue: Joi.number().min(0).optional(),
    validFrom: Joi.date().optional(),
    validTo: Joi.date().min(Joi.ref('validFrom')).optional()
});

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export default {
    // Param schemas
    idParamSchema,
    slugParamSchema,
    paginationSchema,
    
    // Product schemas
    createProductSchema,
    updateProductSchema,
    
    // Inventory schemas
    inventoryUpdateSchema,
    bulkInventorySchema,
    
    // Bulk schemas
    bulkProductSchema,
    productImportSchema,
    productExportSchema,
    
    // Approval schemas
    productApprovalSchema,
    productRejectionSchema,
    productChangesSchema,
    
    // Review schemas
    reviewSchema,
    reviewUpdateSchema,
    
    // Question schemas
    questionSchema,
    answerSchema,
    
    // Wishlist schemas
    wishlistSchema,
    
    // Compare schemas
    compareSchema,
    
    // Search schemas
    searchSchema,
    
    // Analytics schemas
    productAnalyticsSchema,
    
    // Variant schemas
    createVariantSchema,
    updateVariantSchema,
    
    // Promotion schemas
    promotionSchema
};