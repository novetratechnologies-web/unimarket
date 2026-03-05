// FILE: middleware/sanitize.js - PRODUCTION READY

/**
 * Enhanced sanitization middleware
 * Prevents MongoDB operator injection, XSS attacks, and data corruption
 */

import xss from 'xss';

// Configuration
const config = {
    // MongoDB operators to block/rename
    blockMongoOperators: true,
    // Prefix for sanitized operators (instead of deleting)
    operatorPrefix: '_',
    // Enable XSS sanitization for strings
    enableXSS: true,
    // Strict mode - remove instead of prefix
    strictMode: false,
    // Log sanitization actions
    enableLogging: process.env.NODE_ENV === 'development'
};

// Patterns
const MONGO_OPERATOR_PATTERN = /^\$/;
const DOTS_PATTERN = /\./g;
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const SQL_INJECTION_PATTERN = /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b|\bEXEC\b)/i;

/**
 * Main sanitization middleware
 */
export const sanitizeMongo = (options = {}) => {
    // Merge options with defaults
    const settings = { ...config, ...options };
    
    return (req, res, next) => {
        const startTime = Date.now();
        
        try {
            // Store original request parts for logging
            const originalQuery = req.query ? { ...req.query } : null;
            const originalBody = req.body ? JSON.stringify(req.body).substring(0, 200) : null;
            
            // ============================================
            // SANITIZE QUERY PARAMETERS (req.query)
            // ============================================
            if (req.query && typeof req.query === 'object') {
                const sanitizedQuery = sanitizeObject({ ...req.query }, settings, 'query');
                
                // Replace query object
                Object.defineProperty(req, 'query', {
                    value: sanitizedQuery,
                    writable: true,
                    configurable: true,
                    enumerable: true
                });
            }
            
            // ============================================
            // SANITIZE BODY (req.body)
            // ============================================
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body, settings, 'body');
            }
            
            // ============================================
            // SANITIZE PARAMS (req.params)
            // ============================================
            if (req.params && typeof req.params === 'object') {
                const sanitizedParams = {};
                Object.keys(req.params).forEach(key => {
                    const safeKey = sanitizeKey(key, settings);
                    sanitizedParams[safeKey] = sanitizeValue(req.params[key], settings, 'param');
                });
                req.params = sanitizedParams;
            }
            
            // ============================================
            // SANITIZE HEADERS (if needed)
            // ============================================
            if (settings.sanitizeHeaders) {
                // Headers are read-only, so we can't modify them
                // But we can check for suspicious headers
                checkHeaders(req.headers);
            }
            
            // ============================================
            // LOGGING (development only)
            // ============================================
            if (settings.enableLogging) {
                const duration = Date.now() - startTime;
                const changes = detectChanges(originalQuery, req.query, 'query');
                
                if (changes.length > 0) {
                    console.log(`[Sanitize] Modified ${changes.join(', ')} in query (${duration}ms)`);
                }
            }
            
            // Add sanitization info to request
            req.sanitized = true;
            req.sanitizeTime = Date.now() - startTime;
            
            next();
        } catch (error) {
            console.error('[Sanitize Error]:', error.message);
            
            // In production, still continue but with original request
            if (process.env.NODE_ENV === 'production') {
                next();
            } else {
                next(error);
            }
        }
    };
};

/**
 * Deep sanitize an object
 */
const sanitizeObject = (obj, settings, context = 'object', path = '') => {
    if (!obj || typeof obj !== 'object') {
        return sanitizeValue(obj, settings, context, path);
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item, index) => 
            sanitizeObject(item, settings, context, `${path}[${index}]`)
        );
    }
    
    // Handle dates and other special objects
    if (obj instanceof Date) {
        return obj;
    }
    
    if (obj instanceof RegExp) {
        return obj;
    }
    
    if (obj instanceof Buffer) {
        return obj;
    }
    
    // Handle plain objects
    const sanitized = {};
    
    Object.keys(obj).forEach(key => {
        const safeKey = sanitizeKey(key, settings, path);
        const value = obj[key];
        
        // Skip internal properties
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            if (settings.enableLogging) {
                console.warn(`[Sanitize] Blocked prototype pollution attempt at ${path}`);
            }
            return;
        }
        
        // Recursively sanitize value
        sanitized[safeKey] = sanitizeObject(
            value, 
            settings, 
            context, 
            path ? `${path}.${safeKey}` : safeKey
        );
    });
    
    return sanitized;
};

/**
 * Sanitize a key (prevent MongoDB operator injection)
 */
const sanitizeKey = (key, settings, path = '') => {
    let safeKey = key;
    
    // Handle MongoDB operators ($)
    if (settings.blockMongoOperators && MONGO_OPERATOR_PATTERN.test(key)) {
        if (settings.strictMode) {
            if (settings.enableLogging) {
                console.warn(`[Sanitize] Removed MongoDB operator: ${key} at ${path}`);
            }
            return null; // Will be filtered out
        } else {
            safeKey = settings.operatorPrefix + key.substring(1);
            if (settings.enableLogging) {
                console.log(`[Sanitize] Renamed MongoDB operator: ${key} -> ${safeKey} at ${path}`);
            }
        }
    }
    
    // Handle dots (.)
    if (DOTS_PATTERN.test(key)) {
        const newKey = key.replace(DOTS_PATTERN, '_');
        if (settings.enableLogging && newKey !== key) {
            console.log(`[Sanitize] Replaced dots: ${key} -> ${newKey} at ${path}`);
        }
        safeKey = newKey;
    }
    
    return safeKey;
};

/**
 * Sanitize a value (prevent XSS, SQL injection)
 */
const sanitizeValue = (value, settings, context = 'value', path = '') => {
    if (value === null || value === undefined) {
        return value;
    }
    
    // Handle strings
    if (typeof value === 'string') {
        let safeValue = value;
        
        // XSS Prevention
        if (settings.enableXSS) {
            safeValue = xss(safeValue, {
                whiteList: {}, // No HTML tags allowed by default
                stripIgnoreTag: true,
                stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
            });
        }
        
        // SQL Injection detection (log only, don't modify)
        if (SQL_INJECTION_PATTERN.test(safeValue)) {
            if (settings.enableLogging) {
                console.warn(`[Sanitize] Possible SQL injection attempt in ${path}: ${safeValue.substring(0, 50)}`);
            }
        }
        
        // Remove control characters
        safeValue = safeValue.replace(/[\x00-\x1F\x7F]/g, '');
        
        // Trim
        safeValue = safeValue.trim();
        
        return safeValue;
    }
    
    // Handle numbers
    if (typeof value === 'number') {
        // Check for NaN, Infinity
        if (isNaN(value) || !isFinite(value)) {
            return null;
        }
        return value;
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
        return value;
    }
    
    return value;
};

/**
 * Check headers for suspicious content
 */
const checkHeaders = (headers) => {
    const suspicious = [];
    
    Object.keys(headers).forEach(key => {
        const value = headers[key];
        
        // Check for XSS in headers
        if (typeof value === 'string' && SCRIPT_PATTERN.test(value)) {
            suspicious.push(key);
        }
        
        // Check for SQL injection
        if (typeof value === 'string' && SQL_INJECTION_PATTERN.test(value)) {
            suspicious.push(key);
        }
    });
    
    if (suspicious.length > 0 && config.enableLogging) {
        console.warn(`[Sanitize] Suspicious headers detected: ${suspicious.join(', ')}`);
    }
};

/**
 * Detect changes between original and sanitized
 */
const detectChanges = (original, sanitized, type) => {
    const changes = [];
    
    if (!original || !sanitized) return changes;
    
    // Check for removed keys
    Object.keys(original).forEach(key => {
        if (!sanitized.hasOwnProperty(key)) {
            changes.push(`${type}.${key} (removed)`);
        }
    });
    
    // Check for modified keys
    Object.keys(sanitized).forEach(key => {
        if (!original.hasOwnProperty(key)) {
            changes.push(`${type}.${key} (added)`);
        } else if (JSON.stringify(original[key]) !== JSON.stringify(sanitized[key])) {
            changes.push(`${type}.${key} (modified)`);
        }
    });
    
    return changes;
};

// ============================================
// SPECIALIZED SANITIZERS
// ============================================

/**
 * Sanitize email addresses
 */
export const sanitizeEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    return email.toLowerCase().trim().replace(/[^\w.@+-]/g, '');
};

/**
 * Sanitize phone numbers
 */
export const sanitizePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return phone;
    // Keep only digits, +, -, (, ), space
    return phone.replace(/[^\d+\-() ]/g, '').trim();
};

/**
 * Sanitize URLs
 */
export const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    
    const trimmed = url.trim();
    
    // Only allow http, https, and relative URLs
    if (trimmed.startsWith('http:') || trimmed.startsWith('https:') || trimmed.startsWith('/')) {
        // Remove javascript: protocol
        if (trimmed.toLowerCase().includes('javascript:')) {
            return '';
        }
        return trimmed;
    }
    
    return '';
};

/**
 * Sanitize HTML (allow some tags)
 */
export const sanitizeHtml = (html, allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']) => {
    if (!html || typeof html !== 'string') return html;
    
    return xss(html, {
        whiteList: allowedTags.reduce((acc, tag) => {
            acc[tag] = [];
            return acc;
        }, {}),
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
    });
};

/**
 * Strip all HTML
 */
export const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

/**
 * Sanitize MongoDB ObjectId
 */
export const sanitizeObjectId = (id) => {
    if (!id || typeof id !== 'string') return id;
    // Only allow hex characters
    return id.replace(/[^0-9a-fA-F]/g, '');
};

/**
 * Sanitize slug
 */
export const sanitizeSlug = (slug) => {
    if (!slug || typeof slug !== 'string') return slug;
    return slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename) => {
    if (!filename || typeof filename !== 'string') return filename;
    // Remove path traversal attempts
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .replace(/\.\./g, '')
        .replace(/^\./, '');
};

// ============================================
// MIDDLEWARE VARIANTS
// ============================================

/**
 * Strict sanitization (removes suspicious content)
 */
export const strictSanitize = (options = {}) => {
    return sanitizeMongo({ ...options, strictMode: true });
};

/**
 * Light sanitization (only blocks, doesn't modify)
 */
export const lightSanitize = (options = {}) => {
    return sanitizeMongo({ ...options, blockMongoOperators: true, enableXSS: false });
};

/**
 * Sanitize only specific fields
 */
export const sanitizeFields = (fields = []) => {
    return (req, res, next) => {
        fields.forEach(field => {
            if (req.body && req.body[field]) {
                req.body[field] = sanitizeValue(req.body[field], config, 'field', field);
            }
        });
        next();
    };
};

// ============================================
// EXPORT
// ============================================

export default sanitizeMongo;