import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// LOGGER CONFIGURATION
// ============================================

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
  silly: 6
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'gray'
};

// Add colors to winston
winston.addColors(colors);

// ============================================
// CUSTOM LOG FORMATS
// ============================================

/**
 * Custom timestamp format
 */
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss.SSS'
});

/**
 * Custom printf format for console
 */
const consoleFormat = winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  // Add stack trace for errors
  if (stack) {
    log += `\n${stack}`;
  }
  
  // Add metadata if exists and not empty
  if (Object.keys(metadata).length > 0 && !metadata.stack) {
    log += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  
  return log;
});

/**
 * Custom console format with colors
 */
const consoleJsonFormat = winston.format.combine(
  timestampFormat,
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  consoleFormat
);

// ============================================
// CUSTOM TRANSPORTS
// ============================================

/**
 * Console transport - ALWAYS ENABLED
 */
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: consoleJsonFormat,
  handleExceptions: true,
  handleRejections: true
});

// Console only - NO FILE TRANSPORTS
const transports = [consoleTransport];

// ============================================
// CREATE LOGGER INSTANCE
// ============================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false,
  defaultMeta: {
    service: 'unimarket-api',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    pid: process.pid
  }
});

// ============================================
// LOGGER STREAM FOR MORGAN
// ============================================

export const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// ============================================
// REQUEST LOGGER MIDDLEWARE
// ============================================

/**
 * Generate request ID middleware
 */
export const requestIdMiddleware = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * HTTP request logger middleware
 */
export const httpLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const responseTime = Date.now() - start;
    const contentLength = res.getHeader('content-length') || 0;
    const userAgent = req.get('user-agent') || '-';
    const ip = req.ip || req.connection.remoteAddress || '-';
    
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength,
      userAgent,
      ip,
      referrer: req.get('referrer') || req.get('referer') || '-'
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  };
  
  next();
};

// ============================================
// CONTEXTUAL LOGGERS
// ============================================

/**
 * Create a child logger with context
 */
export const createContextLogger = (context) => {
  return logger.child(context);
};

/**
 * Create module-specific logger
 */
export const createModuleLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

/**
 * Create request-specific logger
 */
export const createRequestLogger = (req) => {
  return logger.child({
    requestId: req.id,
    userId: req.user?._id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    sessionId: req.session?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

// ============================================
// PERFORMANCE LOGGING
// ============================================

/**
 * Performance logger - log execution time
 */
export const perfLogger = (name, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  logger.verbose(`Performance: ${name}`, {
    ...metadata,
    operation: name,
    duration: `${duration}ms`,
    durationMs: duration
  });
  return duration;
};

/**
 * Measure and log function execution time
 */
export const measureAsync = async (name, fn, metadata = {}) => {
  const start = Date.now();
  try {
    const result = await fn();
    perfLogger(name, start, { ...metadata, status: 'success' });
    return result;
  } catch (error) {
    perfLogger(name, start, { ...metadata, status: 'error', error: error.message });
    throw error;
  }
};

/**
 * Create performance middleware
 */
export const perfMiddleware = (operationName) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      perfLogger(operationName || `${req.method} ${req.route?.path || req.url}`, start, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        status: res.statusCode
      });
    });
    
    next();
  };
};

// ============================================
// DATABASE LOGGING
// ============================================

/**
 * Database query logger
 */
export const dbLogger = {
  query: (query, duration, metadata = {}) => {
    logger.debug('Database Query', {
      ...metadata,
      query: typeof query === 'string' ? query : JSON.stringify(query),
      duration: `${duration}ms`,
      durationMs: duration
    });
  },
  
  error: (error, query, metadata = {}) => {
    logger.error('Database Error', {
      ...metadata,
      error: error.message,
      stack: error.stack,
      query: typeof query === 'string' ? query : JSON.stringify(query)
    });
  },
  
  connection: (status, metadata = {}) => {
    logger.info(`Database Connection: ${status}`, metadata);
  }
};

// ============================================
// BUSINESS LOGIC LOGGERS
// ============================================

/**
 * Order logger
 */
export const orderLogger = {
  created: (order, metadata = {}) => {
    logger.info(`Order Created: ${order.orderNumber}`, {
      ...metadata,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: order.customerEmail || order.guestEmail,
      total: order.total,
      items: order.itemCount
    });
  },
  
  updated: (order, changes, metadata = {}) => {
    logger.info(`Order Updated: ${order.orderNumber}`, {
      ...metadata,
      orderId: order._id,
      orderNumber: order.orderNumber,
      changes
    });
  },
  
  cancelled: (order, reason, metadata = {}) => {
    logger.warn(`Order Cancelled: ${order.orderNumber}`, {
      ...metadata,
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason,
      total: order.total,
      refunded: order.totalRefunded
    });
  },
  
  refunded: (order, refund, metadata = {}) => {
    logger.info(`Order Refunded: ${order.orderNumber}`, {
      ...metadata,
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundAmount: refund.amount,
      refundReason: refund.reason
    });
  }
};

/**
 * Product logger
 */
export const productLogger = {
  created: (product, metadata = {}) => {
    logger.info(`Product Created: ${product.name}`, {
      ...metadata,
      productId: product._id,
      sku: product.sku,
      vendor: product.vendor,
      price: product.price
    });
  },
  
  updated: (product, changes, metadata = {}) => {
    logger.info(`Product Updated: ${product.name}`, {
      ...metadata,
      productId: product._id,
      sku: product.sku,
      changes
    });
  },
  
  deleted: (product, reason, metadata = {}) => {
    logger.warn(`Product Deleted: ${product.name}`, {
      ...metadata,
      productId: product._id,
      sku: product.sku,
      reason
    });
  },
  
  lowStock: (product, metadata = {}) => {
    logger.warn(`Low Stock Alert: ${product.name}`, {
      ...metadata,
      productId: product._id,
      sku: product.sku,
      currentStock: product.quantity,
      threshold: product.lowStockThreshold
    });
  }
};

/**
 * Vendor logger
 */
export const vendorLogger = {
  registered: (vendor, metadata = {}) => {
    logger.info(`Vendor Registered: ${vendor.vendorProfile?.storeName}`, {
      ...metadata,
      vendorId: vendor._id,
      email: vendor.email,
      storeName: vendor.vendorProfile?.storeName,
      businessType: vendor.vendorProfile?.businessType
    });
  },
  
  approved: (vendor, approvedBy, metadata = {}) => {
    logger.info(`Vendor Approved: ${vendor.vendorProfile?.storeName}`, {
      ...metadata,
      vendorId: vendor._id,
      approvedBy: approvedBy?.email || approvedBy,
      storeName: vendor.vendorProfile?.storeName
    });
  },
  
  suspended: (vendor, reason, metadata = {}) => {
    logger.warn(`Vendor Suspended: ${vendor.vendorProfile?.storeName}`, {
      ...metadata,
      vendorId: vendor._id,
      reason,
      storeName: vendor.vendorProfile?.storeName
    });
  },
  
  payout: (payout, vendor, metadata = {}) => {
    logger.info(`Vendor Payout: ${vendor.vendorProfile?.storeName}`, {
      ...metadata,
      payoutId: payout._id,
      payoutNumber: payout.payoutNumber,
      vendorId: vendor._id,
      amount: payout.summary.netAmount,
      period: payout.period
    });
  }
};

/**
 * Auth logger
 */
export const authLogger = {
  login: (user, status, metadata = {}) => {
    const level = status === 'success' ? 'info' : 'warn';
    logger[level](`User Login: ${user?.email || 'Unknown'}`, {
      ...metadata,
      userId: user?._id,
      email: user?.email,
      role: user?.role,
      status
    });
  },
  
  logout: (user, metadata = {}) => {
    logger.info(`User Logout: ${user?.email}`, {
      ...metadata,
      userId: user?._id,
      email: user?.email
    });
  },
  
  '2fa': (user, action, status, metadata = {}) => {
    logger.info(`2FA ${action}: ${user?.email}`, {
      ...metadata,
      userId: user?._id,
      email: user?.email,
      action,
      status
    });
  },
  
  passwordReset: (email, status, metadata = {}) => {
    logger.info(`Password Reset: ${email}`, {
      ...metadata,
      email,
      status
    });
  }
};

/**
 * Payment logger
 */
export const paymentLogger = {
  initiated: (payment, metadata = {}) => {
    logger.info(`Payment Initiated`, {
      ...metadata,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      orderId: payment.metadata?.orderId
    });
  },
  
  succeeded: (payment, metadata = {}) => {
    logger.info(`Payment Succeeded`, {
      ...metadata,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.metadata?.orderId
    });
  },
  
  failed: (payment, error, metadata = {}) => {
    logger.error(`Payment Failed`, {
      ...metadata,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      error: error.message,
      orderId: payment.metadata?.orderId
    });
  },
  
  refunded: (refund, metadata = {}) => {
    logger.info(`Payment Refunded`, {
      ...metadata,
      refundId: refund.id,
      paymentId: refund.payment_intent,
      amount: refund.amount,
      reason: refund.reason
    });
  }
};

// ============================================
// SYSTEM LOGGERS
// ============================================

/**
 * System logger
 */
export const systemLogger = {
  startup: (metadata = {}) => {
    logger.info('🚀 Application Starting', {
      ...metadata,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  },
  
  shutdown: (signal, metadata = {}) => {
    logger.info(`🛑 Application Shutdown: ${signal}`, {
      ...metadata,
      signal,
      uptime: process.uptime()
    });
  },
  
  error: (error, metadata = {}) => {
    logger.error('💥 Uncaught Exception/Rejection', {
      ...metadata,
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
  },
  
  database: (status, metadata = {}) => {
    logger.info(`🗄️ Database ${status}`, metadata);
  },
  
  cache: (operation, status, metadata = {}) => {
    logger.debug(`📦 Cache ${operation}: ${status}`, metadata);
  }
};

// ============================================
// SECURITY LOGGERS
// ============================================

/**
 * Security logger
 */
export const securityLogger = {
  unauthorized: (req, reason, metadata = {}) => {
    logger.warn(`🔒 Unauthorized Access`, {
      ...metadata,
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      reason,
      userAgent: req.get('user-agent')
    });
  },
  
  forbidden: (req, reason, metadata = {}) => {
    logger.warn(`🚫 Forbidden Access`, {
      ...metadata,
      requestId: req.id,
      userId: req.user?._id,
      email: req.user?.email,
      role: req.user?.role,
      ip: req.ip,
      path: req.path,
      method: req.method,
      reason
    });
  },
  
  rateLimit: (req, metadata = {}) => {
    logger.warn(`⏱️ Rate Limit Exceeded`, {
      ...metadata,
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method
    });
  },
  
  csrf: (req, metadata = {}) => {
    logger.warn(`🛡️ CSRF Attack Detected`, {
      ...metadata,
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method
    });
  },
  
  suspicious: (req, reason, metadata = {}) => {
    logger.warn(`⚠️ Suspicious Activity`, {
      ...metadata,
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      reason,
      userAgent: req.get('user-agent')
    });
  }
};

// ============================================
// DUMMY CLEANUP FUNCTION (no-op)
// ============================================

/**
 * Clean up old log files - dummy function that does nothing
 */
export const cleanupOldLogs = async (daysToKeep = 7) => {
  logger.info('🧹 File logging is disabled - no cleanup needed');
  return 0;
};

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export default {
  // Core logger
  logger,
  
  // Stream for morgan
  stream,
  
  // Middleware
  requestIdMiddleware,
  httpLoggerMiddleware,
  perfMiddleware,
  
  // Contextual loggers
  createContextLogger,
  createModuleLogger,
  createRequestLogger,
  
  // Performance logging
  perfLogger,
  measureAsync,
  
  // Database logging
  dbLogger,
  
  // Business loggers
  orderLogger,
  productLogger,
  vendorLogger,
  authLogger,
  paymentLogger,
  
  // System loggers
  systemLogger,
  securityLogger,
  
  // Maintenance - dummy function
  cleanupOldLogs,
  
  
  // Always disabled
  isFileLoggingEnabled: false
};