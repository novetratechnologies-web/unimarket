// validators/categoryValidators.js
import Joi from 'joi';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const slugParamSchema = Joi.object({
  slug: Joi.string().min(2).max(200).required()
});

export const languageParamSchema = Joi.object({
  language: Joi.string().length(2).lowercase().required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid(
    'name', 'sortOrder', 'level', 'createdAt', 'updatedAt',
    'stats.productCount', 'stats.viewCount', 'stats.revenue'
  ).default('sortOrder'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().allow('', null),
  parent: Joi.string().allow('', null),
  level: Joi.number().integer().min(0).max(10),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  isVisible: Joi.boolean(),
  includeInactive: Joi.boolean().default(false),
  includeDeleted: Joi.boolean().default(false),
  tree: Joi.boolean().default(false),
  depth: Joi.number().integer().min(1).max(10).default(3),
  language: Joi.string().length(2).lowercase(),
  minProductCount: Joi.number().integer().min(0),
  maxProductCount: Joi.number().integer().min(0)
});

// ============================================
// CREATE CATEGORY SCHEMA
// ============================================

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  description: Joi.string().max(1000).allow('', null),
  parent: Joi.string().hex().length(24).allow(null),
  
  settings: Joi.object({
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    isVisible: Joi.boolean().default(true),
    showInMenu: Joi.boolean().default(true),
    showInHomepage: Joi.boolean().default(false),
    showInFooter: Joi.boolean().default(false),
    showInSidebar: Joi.boolean().default(true),
    showProductCount: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().min(0).default(0),
    menuPosition: Joi.number().integer().min(0).default(0),
    columnCount: Joi.number().integer().min(1).max(6).default(4)
  }).default(),
  
  icon: Joi.string().allow('', null),
  
  seo: Joi.object({
    title: Joi.string().max(70).allow('', null),
    description: Joi.string().max(320).allow('', null),
    keywords: Joi.array().items(Joi.string()),
    ogTitle: Joi.string().max(70).allow('', null),
    ogDescription: Joi.string().max(200).allow('', null),
    ogImage: Joi.string().uri().allow('', null),
    ogType: Joi.string().default('website'),
    twitterCard: Joi.string().valid('summary', 'summary_large_image').default('summary_large_image'),
    canonical: Joi.string().uri().allow('', null),
    robots: Joi.string().default('index, follow')
  }).default(),
  
  tags: Joi.array().items(Joi.string().trim().lowercase()),
  
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).default({})
}).unknown(true);

// ============================================
// UPDATE CATEGORY SCHEMA
// ============================================

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(1000).allow('', null),
  parent: Joi.string().hex().length(24).allow(null),
  
  settings: Joi.object({
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    isVisible: Joi.boolean(),
    showInMenu: Joi.boolean(),
    showInHomepage: Joi.boolean(),
    showInFooter: Joi.boolean(),
    showInSidebar: Joi.boolean(),
    showProductCount: Joi.boolean(),
    sortOrder: Joi.number().integer().min(0),
    menuPosition: Joi.number().integer().min(0),
    columnCount: Joi.number().integer().min(1).max(6)
  }),
  
  icon: Joi.string().allow('', null),
  removeImage: Joi.boolean(),
  removeBanner: Joi.boolean(),
  removeIcon: Joi.boolean(),
  
  seo: Joi.object({
    title: Joi.string().max(70).allow('', null),
    description: Joi.string().max(320).allow('', null),
    keywords: Joi.array().items(Joi.string()),
    ogTitle: Joi.string().max(70).allow('', null),
    ogDescription: Joi.string().max(200).allow('', null),
    ogImage: Joi.string().uri().allow('', null),
    twitterCard: Joi.string().valid('summary', 'summary_large_image'),
    canonical: Joi.string().uri().allow('', null),
    robots: Joi.string()
  }),
  
  tags: Joi.array().items(Joi.string().trim().lowercase()),
  
  metadata: Joi.object().pattern(Joi.string(), Joi.any())
}).min(1).unknown(true);

// ============================================
// CATEGORY FILTER SCHEMA
// ============================================

export const categoryFilterSchema = Joi.object({
  name: Joi.string().required().trim(),
  label: Joi.string().trim(),
  type: Joi.string().valid('checkbox', 'radio', 'select', 'range', 'color', 'size', 'rating')
    .default('checkbox'),
  options: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      label: Joi.string().required(),
      count: Joi.number().integer().min(0).default(0),
      image: Joi.string().uri().allow('', null),
      colorCode: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null)
    })
  ).when('type', {
    is: Joi.string().valid('checkbox', 'radio', 'select', 'color', 'size'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  min: Joi.number().when('type', {
    is: 'range',
    then: Joi.number().required(),
    otherwise: Joi.forbidden()
  }),
  max: Joi.number().when('type', {
    is: 'range',
    then: Joi.number().required().greater(Joi.ref('min')),
    otherwise: Joi.forbidden()
  }),
  step: Joi.number().when('type', {
    is: 'range',
    then: Joi.number().min(0.01).default(1),
    otherwise: Joi.forbidden()
  }),
  unit: Joi.string().when('type', {
    is: 'range',
    then: Joi.string().optional(),
    otherwise: Joi.forbidden()
  }),
  isCollapsible: Joi.boolean().default(true),
  isVisible: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0)
});

// ============================================
// CATEGORY ATTRIBUTE SCHEMA
// ============================================

export const categoryAttributeSchema = Joi.object({
  name: Joi.string().required().trim(),
  label: Joi.string().trim(),
  type: Joi.string().valid('text', 'number', 'boolean', 'date', 'select', 'multiselect', 'image')
    .default('text'),
  required: Joi.boolean().default(false),
  options: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      label: Joi.string().required(),
      image: Joi.string().uri().allow('', null)
    })
  ).when('type', {
    is: Joi.string().valid('select', 'multiselect'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  unit: Joi.string().allow('', null),
  validation: Joi.object({
    min: Joi.number(),
    max: Joi.number(),
    pattern: Joi.string(),
    message: Joi.string()
  }).optional(),
  isFilterable: Joi.boolean().default(false),
  isComparable: Joi.boolean().default(false),
  isVariantable: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).default(0)
});

// ============================================
// CATEGORY TRANSLATION SCHEMA
// ============================================

export const categoryTranslationSchema = Joi.object({
  language: Joi.string().length(2).lowercase().required(),
  name: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(1000).allow('', null),
  slug: Joi.string().allow('', null),
  seo: Joi.object({
    title: Joi.string().max(70).allow('', null),
    description: Joi.string().max(320).allow('', null),
    keywords: Joi.array().items(Joi.string())
  }).optional()
}).min(2);

// ============================================
// BULK OPERATION SCHEMA
// ============================================

export const bulkCategorySchema = Joi.object({
  categoryIds: Joi.array().items(
    Joi.string().hex().length(24)
  ).min(1).max(100).required(),
  action: Joi.string().valid(
    'activate', 'deactivate', 'feature', 'unfeature',
    'showInMenu', 'hideInMenu', 'updateSortOrder', 'delete'
  ).required(),
  data: Joi.object({
    sortOrder: Joi.number().integer().min(0).when('action', {
      is: 'updateSortOrder',
      then: Joi.number().integer().min(0).required(),
      otherwise: Joi.optional()
    }),
    reason: Joi.string().when('action', {
      is: 'delete',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    })
  }).default({})
});

// ============================================
// EXPORT SCHEMA
// ============================================

export const categoryExportSchema = Joi.object({
  format: Joi.string().valid('csv', 'excel', 'json').default('csv'),
  fields: Joi.string().optional(),
  includeInactive: Joi.boolean().default(false),
  includeDeleted: Joi.boolean().default(false),
  language: Joi.string().length(2).lowercase()
});

// ============================================
// ANALYTICS SCHEMA
// ============================================

export const categoryAnalyticsSchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '12m', 'custom').default('30d'),
  startDate: Joi.date().iso().when('period', {
    is: 'custom',
    then: Joi.date().iso().required(),
    otherwise: Joi.optional()
  }),
  endDate: Joi.date().iso().when('period', {
    is: 'custom',
    then: Joi.date().iso().required().min(Joi.ref('startDate')),
    otherwise: Joi.optional()
  })
});

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export default {
  idParamSchema,
  slugParamSchema,
  languageParamSchema,
  paginationSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryFilterSchema,
  categoryAttributeSchema,
  categoryTranslationSchema,
  bulkCategorySchema,
  categoryExportSchema,
  categoryAnalyticsSchema
};