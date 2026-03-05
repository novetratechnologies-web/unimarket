import Joi from 'joi';

// ============================================
// COMMON SCHEMAS
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow('', null),
  status: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

export const bulkActionSchema = Joi.object({
  ids: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  action: Joi.string().required(),
  data: Joi.object().default({})
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
  twoFactorCode: Joi.string().length(6).pattern(/^\d+$/).optional()
});

export const adminCreateSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  firstName: Joi.string().required().min(2).max(50).trim(),
  lastName: Joi.string().required().min(2).max(50).trim(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  role: Joi.string().valid('admin', 'super_admin').default('admin'),
  permissions: Joi.array().items(Joi.string()),
  adminDetails: Joi.object({
    department: Joi.string(),
    position: Joi.string(),
    reportsTo: Joi.string().hex().length(24).optional(),
    employmentType: Joi.string().valid('full_time', 'part_time', 'contract', 'intern')
  })
});

export const adminUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim(),
  lastName: Joi.string().min(2).max(50).trim(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  role: Joi.string().valid('admin', 'super_admin'),
  permissions: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  statusReason: Joi.string().when('status', {
    is: Joi.string().valid('inactive', 'suspended'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  adminProfile: Joi.object({
    department: Joi.string(),
    position: Joi.string(),
    reportsTo: Joi.string().hex().length(24)
  })
});

// ============================================
// VENDOR SCHEMAS
// ============================================

export const vendorLoginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
  twoFactorCode: Joi.string().length(6).pattern(/^\d+$/).optional()
});

export const vendorRegisterSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  firstName: Joi.string().required().min(2).max(50).trim(),
  lastName: Joi.string().required().min(2).max(50).trim(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  storeName: Joi.string().required().min(2).max(100).trim(),
  storeDescription: Joi.string().max(500).optional(),
  businessType: Joi.string().valid(
    'individual', 'partnership', 'llc', 'corporation', 'nonprofit'
  ).required(),
  taxId: Joi.string().required(),
  taxIdType: Joi.string().valid('ein', 'vat', 'gst', 'pan', 'other').default('ein'),
  storeAddress: Joi.object({
    street: Joi.string().required(),
    street2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
  }).optional()
});

export const vendorProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim(),
  lastName: Joi.string().min(2).max(50).trim(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  storeName: Joi.string().min(2).max(100).trim(),
  storeTagline: Joi.string().max(200).allow('', null),
  storeDescription: Joi.string().max(500).allow('', null),
  storeStory: Joi.string().max(2000).allow('', null),
  businessType: Joi.string().valid(
    'individual', 'partnership', 'llc', 'corporation', 'nonprofit'
  ),
  yearEstablished: Joi.number().integer().min(1900).max(new Date().getFullYear())
});

export const addressSchema = Joi.object({
  type: Joi.string().valid('business', 'warehouse', 'returns', 'billing').required(),
  isDefault: Joi.boolean().default(false),
  street: Joi.string().required(),
  street2: Joi.string().optional().allow('', null),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  postalCode: Joi.string().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  instructions: Joi.string().max(500).optional().allow('', null)
});

export const bankDetailsSchema = Joi.object({
  accountHolderName: Joi.string().required(),
  accountNumber: Joi.string().required().min(8).max(20),
  routingNumber: Joi.string().required().length(9),
  swiftCode: Joi.string().required().length(8).uppercase(),
  bankName: Joi.string().required(),
  bankAddress: Joi.string().required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').default('USD')
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productCreateSchema = Joi.object({
  name: Joi.string().required().min(3).max(200).trim(),
  description: Joi.string().required().min(10).max(5000),
  shortDescription: Joi.string().max(500).optional(),
  price: Joi.number().required().min(0).precision(2),
  compareAtPrice: Joi.number().min(0).precision(2).optional(),
  cost: Joi.number().min(0).precision(2).optional(),
  sku: Joi.string().optional(),
  barcode: Joi.string().optional(),
  quantity: Joi.number().integer().min(0).default(0),
  lowStockThreshold: Joi.number().integer().min(0).default(5),
  trackQuantity: Joi.boolean().default(true),
  allowBackorder: Joi.boolean().default(false),
  categories: Joi.array().items(Joi.string().hex().length(24)),
  tags: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'active', 'inactive').default('draft'),
  visibility: Joi.string().valid('public', 'private', 'password').default('public'),
  weight: Joi.number().min(0).optional(),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('g'),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    unit: Joi.string().valid('cm', 'in').default('cm')
  }).optional(),
  isTaxable: Joi.boolean().default(true),
  taxClass: Joi.string().hex().length(24).optional(),
  seo: Joi.object({
    title: Joi.string().max(60),
    description: Joi.string().max(160),
    keywords: Joi.array().items(Joi.string()),
    ogImage: Joi.string().uri()
  }).optional()
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(200).trim(),
  description: Joi.string().min(10).max(5000),
  shortDescription: Joi.string().max(500),
  price: Joi.number().min(0).precision(2),
  compareAtPrice: Joi.number().min(0).precision(2),
  cost: Joi.number().min(0).precision(2),
  sku: Joi.string(),
  barcode: Joi.string(),
  quantity: Joi.number().integer().min(0),
  lowStockThreshold: Joi.number().integer().min(0),
  trackQuantity: Joi.boolean(),
  allowBackorder: Joi.boolean(),
  categories: Joi.array().items(Joi.string().hex().length(24)),
  tags: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'active', 'inactive'),
  visibility: Joi.string().valid('public', 'private', 'password'),
  removeImages: Joi.array().items(Joi.string()),
  primaryImageId: Joi.string().hex().length(24),
  weight: Joi.number().min(0),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz'),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    unit: Joi.string().valid('cm', 'in')
  }),
  isTaxable: Joi.boolean(),
  taxClass: Joi.string().hex().length(24),
  seo: Joi.object({
    title: Joi.string().max(60),
    description: Joi.string().max(160),
    keywords: Joi.array().items(Joi.string()),
    ogImage: Joi.string().uri()
  })
}).min(1); // At least one field required

// ============================================
// ORDER SCHEMAS
// ============================================

export const orderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ).required(),
  trackingNumber: Joi.string().when('status', {
    is: 'shipped',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  carrier: Joi.string().when('status', {
    is: 'shipped',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  note: Joi.string().max(500).optional()
});

export const refundSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
  reason: Joi.string().required().max(500),
  notes: Joi.string().max(500).optional()
});

// ============================================
// COMMON SCHEMAS
// ============================================

export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

export const twoFactorSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required()
});

export const emailSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});