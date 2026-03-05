// FILE: src/utils/errorHandler.js

import mongoose from 'mongoose';
import loggerModule from './logger.js';

// Extract the logger instance and create contextual logger
const { logger, createModuleLogger } = loggerModule;
const contextLogger = createModuleLogger('ErrorHandler');

/**
 * Custom App Error Class
 * Extends native Error with additional properties
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = null, details = null) {
        super(message);
        
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode || this.getErrorCode(statusCode);
        this.details = details;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Get error code based on status code
     */
    getErrorCode(statusCode) {
        const codes = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_SERVER_ERROR',
            503: 'SERVICE_UNAVAILABLE'
        };
        return codes[statusCode] || 'UNKNOWN_ERROR';
    }

    /**
     * Convert error to JSON
     */
    toJSON() {
        return {
            error: {
                message: this.message,
                code: this.errorCode,
                statusCode: this.statusCode,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}

/**
 * Validation Error Class
 * For handling validation errors
 */
export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = null) {
        super(message, 422, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication Error Class
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error Class
 */
export class AuthorizationError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error Class
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Conflict Error Class
 */
export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}

/**
 * Rate Limit Error Class
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

// ============================================
// ASYNC ERROR HANDLER WRAPPER
// ============================================

/**
 * Wraps async route handlers to catch errors
 * Eliminates need for try-catch blocks in controllers
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Wraps async middleware
 */
export const catchMiddleware = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

// ============================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Global error handler for Express
 */
export const errorHandler = (err, req, res, next) => {
    // Set default values
    let error = err;
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    let details = err.details || null;

    // Log error
    logError(error, req);

    // Handle specific error types
    if (error instanceof mongoose.Error.ValidationError) {
        // Mongoose validation error
        statusCode = 422;
        message = 'Validation Error';
        errorCode = 'VALIDATION_ERROR';
        details = formatMongooseValidationError(error);
    } 
    else if (error instanceof mongoose.Error.CastError) {
        // Mongoose cast error (invalid ID)
        statusCode = 400;
        message = 'Invalid ID format';
        errorCode = 'INVALID_ID';
        details = { field: error.path, value: error.value };
    }
    else if (error.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        message = 'Duplicate key error';
        errorCode = 'DUPLICATE_KEY';
        details = formatDuplicateKeyError(error);
    }
    else if (error.name === 'JsonWebTokenError') {
        // JWT error
        statusCode = 401;
        message = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
    }
    else if (error.name === 'TokenExpiredError') {
        // JWT expired
        statusCode = 401;
        message = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
    }
    else if (error.name === 'MulterError') {
        // File upload error
        statusCode = 400;
        message = 'File upload error';
        errorCode = 'UPLOAD_ERROR';
        details = { code: error.code, field: error.field };
    }
    else if (error.isAxiosError) {
        // Axios error (external API calls)
        statusCode = error.response?.status || 502;
        message = 'External service error';
        errorCode = 'EXTERNAL_SERVICE_ERROR';
        details = {
            service: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        };
    }
    else if (error.name === 'TimeoutError') {
        // Timeout error
        statusCode = 504;
        message = 'Request timeout';
        errorCode = 'TIMEOUT_ERROR';
    }

    // Build error response
    const errorResponse = {
        success: false,
        error: {
            message,
            code: errorCode,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            requestId: req.id || generateRequestId()
        }
    };

    // Add details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.details = details;
        errorResponse.error.stack = error.stack;
        errorResponse.error.fullError = error;
    }

    // Add validation details if present
    if (details && (errorCode === 'VALIDATION_ERROR' || statusCode === 422)) {
        errorResponse.error.validation = details;
    }

    // Send response
    res.status(statusCode).json(errorResponse);
};

// ============================================
// NOT FOUND HANDLER
// ============================================

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    error.details = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip
    };
    next(error);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Log error with context
 */
const logError = (error, req) => {
    const logContext = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?._id,
        userRole: req.user?.role,
        statusCode: error.statusCode || 500,
        errorCode: error.errorCode,
        message: error.message
    };

    if (error.statusCode && error.statusCode < 500) {
        // Client errors (4xx) - log as warning
        contextLogger.warn('Client Error:', logContext);
        if (process.env.NODE_ENV === 'development') {
            contextLogger.debug('Error Stack:', error.stack);
        }
    } else {
        // Server errors (5xx) - log as error
        contextLogger.error('Server Error:', logContext);
        contextLogger.error('Error Stack:', error.stack);
    }
};

/**
 * Format Mongoose validation errors
 */
const formatMongooseValidationError = (error) => {
    const errors = {};
    
    Object.keys(error.errors).forEach(key => {
        errors[key] = {
            message: error.errors[key].message,
            value: error.errors[key].value,
            kind: error.errors[key].kind,
            path: error.errors[key].path
        };
    });
    
    return errors;
};

/**
 * Format duplicate key error
 */
const formatDuplicateKeyError = (error) => {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    
    return {
        field,
        value,
        message: `${field} with value '${value}' already exists`
    };
};

/**
 * Generate request ID
 */
const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// ERROR RESPONSE UTILITIES
// ============================================

/**
 * Send error response (for use in controllers)
 */
export const sendError = (res, error, statusCode = 500) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json(error.toJSON());
    }
    
    return res.status(statusCode).json({
        success: false,
        error: {
            message: error.message || 'Internal Server Error',
            code: 'INTERNAL_SERVER_ERROR',
            statusCode
        }
    });
};

/**
 * Send validation error response
 */
export const sendValidationError = (res, errors, message = 'Validation failed') => {
    return res.status(422).json({
        success: false,
        error: {
            message,
            code: 'VALIDATION_ERROR',
            statusCode: 422,
            validation: errors
        }
    });
};

// ============================================
// ERROR FACTORY FUNCTIONS
// ============================================

/**
 * Create a bad request error
 */
export const badRequest = (message = 'Bad request', details = null) => {
    return new AppError(message, 400, 'BAD_REQUEST', details);
};

/**
 * Create unauthorized error
 */
export const unauthorized = (message = 'Unauthorized') => {
    return new AppError(message, 401, 'UNAUTHORIZED');
};

/**
 * Create forbidden error
 */
export const forbidden = (message = 'Forbidden') => {
    return new AppError(message, 403, 'FORBIDDEN');
};

/**
 * Create not found error
 */
export const notFound = (resource = 'Resource') => {
    return new NotFoundError(resource);
};

/**
 * Create conflict error
 */
export const conflict = (message = 'Conflict') => {
    return new AppError(message, 409, 'CONFLICT');
};

/**
 * Create validation error
 */
export const validationError = (message = 'Validation failed', details = null) => {
    return new ValidationError(message, details);
};

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtExceptions = () => {
    process.on('uncaughtException', (error) => {
        contextLogger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        contextLogger.error('Error:', error);
        contextLogger.error('Stack:', error.stack);
        
        // Graceful shutdown
        process.exit(1);
    });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejections = (server) => {
    process.on('unhandledRejection', (error) => {
        contextLogger.error('UNHANDLED REJECTION! 💥 Shutting down...');
        contextLogger.error('Error:', error);
        
        // Graceful shutdown
        if (server) {
            server.close(() => {
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
};

/**
 * Handle SIGTERM signal
 */
export const handleSigTerm = (server) => {
    process.on('SIGTERM', () => {
        contextLogger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
        
        if (server) {
            server.close(() => {
                contextLogger.info('💥 Process terminated!');
            });
        }
    });
};

// ============================================
// RATE LIMIT ERROR HANDLER
// ============================================

/**
 * Rate limit exceeded handler
 */
export const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        error: {
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            retryAfter: res.getHeader('Retry-After') || 60
        }
    });
};

// ============================================
// DATABASE ERROR HANDLER
// ============================================

/**
 * Handle database connection errors
 */
export const handleDatabaseError = (error) => {
    contextLogger.error('Database connection error:', error);
    
    if (error.name === 'MongoNetworkError') {
        return new AppError('Database network error', 503, 'DB_NETWORK_ERROR');
    }
    
    if (error.name === 'MongoTimeoutError') {
        return new AppError('Database timeout', 504, 'DB_TIMEOUT');
    }
    
    return new AppError('Database error', 500, 'DB_ERROR');
};

// ============================================
// EXPORT ALL
// ============================================

export default {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    catchAsync,
    catchMiddleware,
    errorHandler,
    notFoundHandler,
    sendError,
    sendValidationError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    validationError,
    handleUncaughtExceptions,
    handleUnhandledRejections,
    handleSigTerm,
    rateLimitHandler,
    handleDatabaseError
};