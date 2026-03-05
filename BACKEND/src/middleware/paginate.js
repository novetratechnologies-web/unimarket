// FILE: src/middleware/paginate.js

/**
 * Pagination middleware
 * Adds pagination to query results
 */
export const paginate = (defaultPage = 1, defaultLimit = 20) => {
    return (req, res, next) => {
        try {
            // Get pagination params from query
            const page = parseInt(req.query.page) || defaultPage;
            const limit = parseInt(req.query.limit) || defaultLimit;
            
            // Validate
            const validatedPage = Math.max(1, page);
            const validatedLimit = Math.min(100, Math.max(1, limit));
            
            // Calculate skip
            const skip = (validatedPage - 1) * validatedLimit;
            
            // Attach to request
            req.pagination = {
                page: validatedPage,
                limit: validatedLimit,
                skip
            };
            
            // Remove from query to avoid conflicts
            delete req.query.page;
            delete req.query.limit;
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Apply pagination to response
 */
export const applyPagination = (data, total, req) => {
    const { page, limit } = req.pagination;
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        }
    };
};

export default paginate;