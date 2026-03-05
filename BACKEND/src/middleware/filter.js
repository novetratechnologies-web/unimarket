// FILE: src/middleware/filter.js

/**
 * Filter middleware
 * Processes filter parameters for MongoDB queries
 */
export const filter = (allowedFields = []) => {
    return (req, res, next) => {
        try {
            const filters = {};
            const query = { ...req.query };
            
            // Define filter operators mapping
            const operators = {
                gt: '$gt',
                gte: '$gte',
                lt: '$lt',
                lte: '$lte',
                in: '$in',
                nin: '$nin',
                ne: '$ne',
                like: '$regex'
            };
            
            // Process each query parameter
            Object.keys(query).forEach(key => {
                // Skip pagination params
                if (['page', 'limit', 'sort', 'fields'].includes(key)) {
                    return;
                }
                
                const value = query[key];
                
                // Handle operator filters (e.g., price[gt]=100)
                if (key.includes('[') && key.includes(']')) {
                    const [field, operator] = key.split(/[\[\]]/).filter(Boolean);
                    
                    if (allowedFields.length && !allowedFields.includes(field)) {
                        return;
                    }
                    
                    if (operators[operator]) {
                        if (!filters[field]) {
                            filters[field] = {};
                        }
                        
                        // Handle special operators
                        if (operator === 'like') {
                            filters[field][operators[operator]] = new RegExp(value, 'i');
                        } else {
                            filters[field][operators[operator]] = parseValue(value);
                        }
                    }
                } 
                // Handle normal filters
                else {
                    if (allowedFields.length && !allowedFields.includes(key)) {
                        return;
                    }
                    
                    // Handle comma-separated values for $in operator
                    if (typeof value === 'string' && value.includes(',')) {
                        filters[key] = { 
                            $in: value.split(',').map(v => parseValue(v.trim())) 
                        };
                    } else {
                        filters[key] = parseValue(value);
                    }
                }
            });
            
            // Attach to request
            req.filters = filters;
            
            // Remove from query
            Object.keys(query).forEach(key => {
                if (!['page', 'limit', 'sort', 'fields'].includes(key)) {
                    delete req.query[key];
                }
            });
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Parse string values to appropriate types
 */
const parseValue = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;
    if (!isNaN(value) && value.trim() !== '') return Number(value);
    return value;
};

/**
 * Date range filter helper
 */
export const dateRange = (field, startDate, endDate) => {
    const filter = {};
    if (startDate || endDate) {
        filter[field] = {};
        if (startDate) filter[field].$gte = new Date(startDate);
        if (endDate) filter[field].$lte = new Date(endDate);
    }
    return filter;
};

/**
 * Text search filter
 */
export const textSearch = (fields, query) => {
    if (!query) return {};
    
    if (fields.length === 1) {
        return { [fields[0]]: { $regex: query, $options: 'i' } };
    }
    
    return {
        $or: fields.map(field => ({
            [field]: { $regex: query, $options: 'i' }
        }))
    };
};

export default filter;