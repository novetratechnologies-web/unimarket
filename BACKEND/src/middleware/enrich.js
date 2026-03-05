// FILE: src/middleware/enrich.js

/**
 * Enrich response middleware
 * Adds metadata and computed fields to responses
 */
export const enrichResponse = (options = {}) => {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json;
        
        // Override json method
        res.json = function(data) {
            // Add timestamp
            if (data && typeof data === 'object') {
                data.timestamp = new Date().toISOString();
                
                // Add request ID if available
                if (req.id) {
                    data.requestId = req.id;
                }
                
                // Add response time if available
                if (req._startTime) {
                    data.responseTime = `${Date.now() - req._startTime}ms`;
                }
                
                // Add pagination metadata if not present but available
                if (req.pagination && data.data && !data.pagination) {
                    data.pagination = req.pagination;
                }
                
                // Add user role info
                if (req.user) {
                    data.userRole = req.user.role;
                }
                
                // Apply custom enrichments
                if (options.enrichments) {
                    data = applyEnrichments(data, req, options.enrichments);
                }
            }
            
            // Call original json
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * Apply custom enrichments to response data
 */
const applyEnrichments = (data, req, enrichments) => {
    if (Array.isArray(enrichments)) {
        enrichments.forEach(enrichment => {
            if (typeof enrichment === 'function') {
                data = enrichment(data, req);
            }
        });
    }
    return data;
};

/**
 * Add currency formatting to price fields
 */
export const formatPrices = (fields = ['price', 'compareAtPrice', 'cost']) => {
    return (data, req) => {
        if (!data.data) return data;
        
        const currency = req.query.currency || 'USD';
        const locale = req.query.locale || 'en-US';
        
        const formatPrice = (value) => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency
            }).format(value);
        };
        
        if (Array.isArray(data.data)) {
            data.data = data.data.map(item => {
                fields.forEach(field => {
                    if (item[field] !== undefined) {
                        item[`formatted_${field}`] = formatPrice(item[field]);
                    }
                });
                return item;
            });
        } else if (data.data && typeof data.data === 'object') {
            fields.forEach(field => {
                if (data.data[field] !== undefined) {
                    data.data[`formatted_${field}`] = formatPrice(data.data[field]);
                }
            });
        }
        
        return data;
    };
};

/**
 * Add computed stock status
 */
export const addStockStatus = () => {
    return (data, req) => {
        if (!data.data) return data;
        
        const getStockStatus = (quantity, threshold = 5, backorder = false) => {
            if (quantity <= 0) return backorder ? 'backorder' : 'out_of_stock';
            if (quantity <= threshold) return 'low_stock';
            return 'in_stock';
        };
        
        if (Array.isArray(data.data)) {
            data.data = data.data.map(item => {
                if (item.quantity !== undefined) {
                    item.stockStatus = getStockStatus(
                        item.quantity, 
                        item.lowStockThreshold, 
                        item.allowBackorder
                    );
                }
                return item;
            });
        } else if (data.data && typeof data.data === 'object') {
            if (data.data.quantity !== undefined) {
                data.data.stockStatus = getStockStatus(
                    data.data.quantity, 
                    data.data.lowStockThreshold, 
                    data.data.allowBackorder
                );
            }
        }
        
        return data;
    };
};

/**
 * Add discount calculations
 */
export const addDiscountInfo = () => {
    return (data, req) => {
        if (!data.data) return data;
        
        const calculateDiscount = (price, compareAtPrice) => {
            if (!compareAtPrice || compareAtPrice <= price) return null;
            const amount = compareAtPrice - price;
            const percentage = Math.round((amount / compareAtPrice) * 100);
            return { amount, percentage };
        };
        
        if (Array.isArray(data.data)) {
            data.data = data.data.map(item => {
                if (item.price && item.compareAtPrice) {
                    item.discount = calculateDiscount(item.price, item.compareAtPrice);
                }
                return item;
            });
        } else if (data.data && typeof data.data === 'object') {
            if (data.data.price && data.data.compareAtPrice) {
                data.data.discount = calculateDiscount(data.data.price, data.data.compareAtPrice);
            }
        }
        
        return data;
    };
};

/**
 * Add user-specific data (wishlist status, etc.)
 */
export const addUserData = (userField = 'userId') => {
    return async (data, req) => {
        if (!req.user || !data.data) return data;
        
        // This would typically call services to check wishlist, cart, etc.
        // For now, just add placeholder
        if (Array.isArray(data.data)) {
            data.data = data.data.map(item => {
                item.inWishlist = false; // Would check actual wishlist
                item.inCart = false; // Would check actual cart
                return item;
            });
        } else if (data.data && typeof data.data === 'object') {
            data.data.inWishlist = false;
            data.data.inCart = false;
        }
        
        return data;
    };
};

export default enrichResponse;