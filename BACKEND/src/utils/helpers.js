import mongoose from 'mongoose';
import crypto from 'crypto';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate slug from string
 */
export const generateSlug = (text, options = {}) => {
  const defaultOptions = {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g
  };

  return slugify(text, { ...defaultOptions, ...options });
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 32, options = {}) => {
  const {
    numbers = true,
    symbols = false,
    uppercase = true,
    lowercase = true
  } = options;

  let chars = '';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_-+=<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
};

/**
 * Generate SKU (Stock Keeping Unit)
 */
export const generateSKU = async (vendorIdentifier, productName, options = {}) => {
  const {
    prefix = '',
    suffix = '',
    separator = '-',
    includeTimestamp = true,
    includeRandom = true
  } = options;

  const vendorCode = vendorIdentifier
    .toString()
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const productCode = productName
    .substring(0, 4)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const timestamp = includeTimestamp ? Date.now().toString().slice(-6) : '';
  const random = includeRandom ? Math.floor(Math.random() * 1000).toString().padStart(3, '0') : '';

  const parts = [
    prefix,
    vendorCode,
    productCode,
    timestamp,
    random,
    suffix
  ].filter(Boolean);

  return parts.join(separator).toUpperCase();
};

/**
 * Generate order number
 */
export const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `INV-${year}${month}-${random}`;
};

/**
 * Generate payout number
 */
export const generatePayoutNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `PO-${year}${month}-${random}`;
};

/**
 * Generate coupon code
 */
export const generateCouponCode = (length = 8, prefix = '') => {
  const code = generateRandomString(length, {
    numbers: true,
    uppercase: true,
    lowercase: false,
    symbols: false
  }).toUpperCase();
  
  return prefix ? `${prefix}-${code}` : code;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalize each word
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

/**
 * Remove special characters
 */
export const sanitizeString = (text, options = {}) => {
  const {
    allowSpaces = true,
    allowNumbers = true,
    allowDashes = false,
    allowUnderscores = false
  } = options;

  let pattern = '[^a-zA-Z';
  if (allowNumbers) pattern += '0-9';
  if (allowSpaces) pattern += '\\s';
  if (allowDashes) pattern += '-';
  if (allowUnderscores) pattern += '_';
  pattern += ']';

  return text.replace(new RegExp(pattern, 'g'), '');
};

// ============================================
// NUMBER & CURRENCY UTILITIES
// ============================================

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Calculate tax amount
 */
export const calculateTax = (amount, taxRate) => {
  return (amount * taxRate) / 100;
};

/**
 * Calculate profit margin
 */
export const calculateProfitMargin = (cost, price) => {
  if (!cost || !price || price === 0) return 0;
  return ((price - cost) / price) * 100;
};

/**
 * Round to decimal places
 */
export const roundTo = (value, decimals = 2) => {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Format date
 */
export const formatDate = (date, format = 'PPP', locale = 'en-US') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'PPP':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'PP':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    case 'P':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    case 'datetime':
      return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toISOString();
  }
};

/**
 * Get date range
 */
export const getDateRange = (period, date = new Date()) => {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

/**
 * Add time to date
 */
export const addTime = (date, value, unit) => {
  const d = new Date(date);
  
  switch (unit) {
    case 'milliseconds':
      d.setMilliseconds(d.getMilliseconds() + value);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + value);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + value);
      break;
    case 'hours':
      d.setHours(d.getHours() + value);
      break;
    case 'days':
      d.setDate(d.getDate() + value);
      break;
    case 'weeks':
      d.setDate(d.getDate() + (value * 7));
      break;
    case 'months':
      d.setMonth(d.getMonth() + value);
      break;
    case 'years':
      d.setFullYear(d.getFullYear() + value);
      break;
  }
  
  return d;
};

/**
 * Calculate days between dates
 */
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(new Date(date1) - new Date(date2));
  return Math.round(diff / oneDay);
};

/**
 * Check if date is within range
 */
export const isDateInRange = (date, start, end) => {
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
};

/**
 * Get relative time
 */
export const getRelativeTime = (date) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const diff = new Date(date) - now;
  
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);
  
  if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  if (Math.abs(months) < 12) return rtf.format(months, 'month');
  return rtf.format(years, 'year');
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !/\s/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return {
    isValid: score >= 3,
    strength,
    checks,
    score
  };
};

/**
 * Validate ObjectId
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate credit card (Luhn algorithm)
 */
export const isValidCreditCard = (cardNumber) => {
  const sanitized = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// ============================================
// ENCRYPTION & HASHING UTILITIES
// ============================================

/**
 * Hash password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token, type = 'access') => {
  const secret = type === 'refresh' ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

/**
 * Generate MD5 hash
 */
export const md5 = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * Generate SHA256 hash
 */
export const sha256 = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate random token
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate API key
 */
export const generateApiKey = () => {
  const key = crypto.randomBytes(24).toString('hex');
  const secret = crypto.randomBytes(32).toString('hex');
  return { key, secret };
};

/**
 * Encrypt data
 */
export const encrypt = (text, secret = process.env.ENCRYPTION_KEY) => {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

/**
 * Decrypt data
 */
export const decrypt = (encrypted, secret = process.env.ENCRYPTION_KEY) => {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ============================================
// 2FA & QR CODE UTILITIES
// ============================================

/**
 * Generate 2FA secret
 */
export const generateTwoFactorSecret = (name = 'UniMarket', account) => {
  return speakeasy.generateSecret({
    name: `${name}:${account}`
  });
};

/**
 * Generate QR code
 */
export const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

/**
 * Verify 2FA token
 */
export const verifyTwoFactorToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateRandomString(10, {
      numbers: true,
      uppercase: true,
      lowercase: false,
      symbols: false
    }).toUpperCase());
  }
  return codes;
};

// ============================================
// ARRAY & OBJECT UTILITIES
// ============================================

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort by field
 */
export const sortBy = (array, field, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (order === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};

/**
 * Unique array
 */
export const unique = (array, key = null) => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

/**
 * Chunk array
 */
export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Pick object properties
 */
export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit object properties
 */
export const omit = (obj, keys) => {
  return Object.keys(obj).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Flatten nested object
 */
export const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((result, key) => {
    const prefixed = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], prefixed));
    } else {
      result[prefixed] = obj[key];
    }
    
    return result;
  }, {});
};

// ============================================
// FILE & IMAGE UTILITIES
// ============================================

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get file name without extension
 */
export const getFileNameWithoutExtension = (filename) => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get image dimensions from buffer
 */
export const getImageDimensions = async (buffer) => {
  const { imageSize } = await import('image-size');
  return imageSize(buffer);
};

/**
 * Generate image URL with transformations
 */
export const generateImageUrl = (url, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;

  if (!url) return url;

  // Cloudinary transformations
  if (url.includes('cloudinary.com')) {
    let transformation = '';
    
    if (width || height) {
      transformation += `/c_${crop},g_${gravity},w_${width || ''},h_${height || ''}`;
    }
    
    if (quality) {
      transformation += `/q_${quality}`;
    }
    
    if (format) {
      transformation += `/f_${format}`;
    }
    
    return url.replace('/upload/', `/upload${transformation}/`);
  }

  return url;
};

// ============================================
// PRICE & TAX UTILITIES
// ============================================

/**
 * Calculate commission
 */
export const calculateCommission = (amount, rate, type = 'percentage') => {
  if (type === 'percentage') {
    return (amount * rate) / 100;
  }
  return rate;
};

/**
 * Calculate vendor earnings
 */
export const calculateVendorEarnings = (amount, commission, tax = 0, shipping = 0) => {
  return amount - commission - tax - shipping;
};

/**
 * Calculate bulk discount
 */
export const calculateBulkDiscount = (quantity, price, tiers = []) => {
  const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
  let discountRate = 0;
  
  for (const tier of sortedTiers) {
    if (quantity >= tier.quantity) {
      discountRate = tier.discount;
    }
  }
  
  return (price * quantity * discountRate) / 100;
};

// ============================================
// SHIPPING UTILITIES
// ============================================

/**
 * Calculate shipping cost
 */
export const calculateShippingCost = (weight, dimensions, destination, method) => {
  // Mock shipping calculation - replace with actual carrier API
  let cost = 0;
  
  // Base rate
  cost += 5;
  
  // Weight factor
  cost += weight * 0.5;
  
  // Dimension factor
  const volume = dimensions.length * dimensions.width * dimensions.height;
  cost += volume * 0.001;
  
  // Destination factor
  if (destination.country !== 'US') {
    cost *= 1.5;
  }
  
  return roundTo(cost, 2);
};

/**
 * Generate tracking URL
 */
export const generateTrackingUrl = (carrier, trackingNumber) => {
  const urls = {
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'canada-post': `https://www.canadapost-postescanada.ca/track-reperage/en#/resultList?searchFor=${trackingNumber}`,
    'australia-post': `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
    'royal-mail': `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
    'dpd': `https://www.dpd.co.uk/tracking/?parcelNumber=${trackingNumber}`,
    'hermes': `https://www.myhermes.co.uk/tracking-results.html?trackingNumber=${trackingNumber}`,
    'yanwen': `http://track.yw56.com.cn/en/result?num=${trackingNumber}`
  };
  
  return urls[carrier.toLowerCase()] || null;
};

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Generate random color
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const colors = {
    // Order status
    pending: '#ffc107',
    processing: '#17a2b8',
    confirmed: '#28a745',
    shipped: '#007bff',
    delivered: '#28a745',
    cancelled: '#dc3545',
    refunded: '#6c757d',
    failed: '#dc3545',
    
    // Payment status
    paid: '#28a745',
    unpaid: '#dc3545',
    authorized: '#17a2b8',
    
    // Product status
    active: '#28a745',
    inactive: '#6c757d',
    draft: '#6c757d',
    
    // Vendor status
    approved: '#28a745',
    pending_approval: '#ffc107',
    suspended: '#dc3545'
  };
  
  return colors[status] || '#6c757d';
};

/**
 * Lighten color
 */
export const lightenColor = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

/**
 * Darken color
 */
export const darkenColor = (color, percent) => {
  return lightenColor(color, -percent);
};

// ============================================
// MISC UTILITIES
// ============================================

/**
 * Sleep/delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
};

/**
 * Debounce function
 */
export const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoize function
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Parse JSON safely
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Stringify JSON safely
 */
export const safeJsonStringify = (obj, fallback = '') => {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
};

/**
 * Get environment variable with fallback
 */
export const getEnv = (key, fallback = null) => {
  return process.env[key] || fallback;
};

/**
 * Is development environment
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Is production environment
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Is test environment
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

// ============================================
// EXPORT
// ============================================

export default {
  // String utilities
  generateSlug,
  generateRandomString,
  generateSKU,
  generateOrderNumber,
  generateInvoiceNumber,
  generatePayoutNumber,
  generateCouponCode,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  sanitizeString,
  
  // Number & Currency
  formatCurrency,
  formatNumber,
  formatPercentage,
  calculateDiscountPercentage,
  calculateTax,
  calculateProfitMargin,
  roundTo,
  
  // Date & Time
  formatDate,
  getDateRange,
  addTime,
  daysBetween,
  isDateInRange,
  getRelativeTime,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidUrl,
  validatePasswordStrength,
  isValidObjectId,
  isValidCreditCard,
  
  // Encryption & Hashing
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  md5,
  sha256,
  generateRandomToken,
  generateApiKey,
  encrypt,
  decrypt,
  
  // 2FA & QR
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  generateBackupCodes,
  
  // Array & Object
  groupBy,
  sortBy,
  unique,
  chunk,
  pick,
  omit,
  deepClone,
  flattenObject,
  
  // File & Image
  getFileExtension,
  getFileNameWithoutExtension,
  formatFileSize,
  getImageDimensions,
  generateImageUrl,
  
  // Price & Tax
  calculateCommission,
  calculateVendorEarnings,
  calculateBulkDiscount,
  
  // Shipping
  calculateShippingCost,
  generateTrackingUrl,
  
  // Color
  getRandomColor,
  getStatusColor,
  lightenColor,
  darkenColor,
  
  // Misc
  sleep,
  retry,
  debounce,
  throttle,
  memoize,
  safeJsonParse,
  safeJsonStringify,
  getEnv,
  isDevelopment,
  isProduction,
  isTest
};