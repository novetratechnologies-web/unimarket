// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { ipKeyGenerator } from 'express-rate-limit';
import crypto from 'crypto';

// Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// Redis client for production (optional but recommended)
let redisClient = null;
let redisConnected = false;

if (isProduction && process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error('❌ Redis connection failed after 5 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
      redisConnected = true;
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
      redisConnected = false;
    });

    redisClient.connect().catch(err => {
      console.error('❌ Failed to connect to Redis:', err);
      redisClient = null;
    });
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    redisClient = null;
  }
}

/**
 * Generate a device fingerprint that doesn't include IP
 * This ensures different devices on same network have different fingerprints
 */
const generateDeviceFingerprint = (req, includeTimeWindow = true) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLang = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  const connection = req.headers['connection'] || 'unknown';
  
  // Additional browser identifiers for better uniqueness
  const secChUa = req.headers['sec-ch-ua'] || 'unknown';
  const secChUaPlatform = req.headers['sec-ch-ua-platform'] || 'unknown';
  const secChUaMobile = req.headers['sec-ch-ua-mobile'] || 'unknown';
  
  // Client-side identifiers (sent from frontend)
  const clientId = req.headers['x-client-id'] || 'unknown';
  const screenSize = req.headers['x-screen-size'] || 'unknown';
  const timezone = req.headers['x-timezone'] || 'unknown';
  
  const timeWindow = includeTimeWindow 
    ? Math.floor(Date.now() / (15 * 60 * 1000)) // 15-minute window
    : '';
  
  // Create fingerprint WITHOUT IP - use ALL available browser characteristics
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}:${acceptLang}:${acceptEncoding}:${connection}:${secChUa}:${secChUaPlatform}:${secChUaMobile}:${clientId}:${screenSize}:${timezone}:${timeWindow}`)
    .digest('hex')
    .substring(0, 24);
  
  return fingerprint;
};

/**
 * Generate a fingerprint for anonymous users (includes IP for global rate limiting)
 */
const generateIpBasedFingerprint = (req, includeTimeWindow = true) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLang = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  const connection = req.headers['connection'] || 'unknown';
  
  const timeWindow = includeTimeWindow 
    ? Math.floor(Date.now() / (5 * 60 * 1000)) // 5-minute window
    : '';
  
  const safeIp = ipKeyGenerator(req.ip);
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${safeIp}:${userAgent}:${acceptLang}:${acceptEncoding}:${connection}:${timeWindow}`)
    .digest('hex')
    .substring(0, 20);
  
  return fingerprint;
};

/**
 * Create rate limiter - Production ready with Redis support
 */
export const rateLimiter = (options = {}) => {
  if (isTest) {
    return (req, res, next) => next();
  }

  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes default
    max: 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Default key generator (will be overridden by specific limiters)
    keyGenerator: (req) => {
      if (req.user?._id) {
        return `user:${req.user._id.toString()}`;
      }
      
      if (req.headers['x-api-key']) {
        return `apikey:${req.headers['x-api-key']}`;
      }
      
      if (req.session?.id) {
        return `session:${req.session.id}`;
      }
      
      if (req.headers['x-client-id']) {
        return `client:${req.headers['x-client-id']}`;
      }
      
      // Default to IP-based fingerprint for general endpoints
      const fingerprint = generateIpBasedFingerprint(req, true);
      return `fp:${fingerprint}`;
    },
    
    skip: (req) => {
      if (isDevelopment) {
        return true;
      }
      
      if (req.path === '/health' || req.path === '/healthcheck') {
        return true;
      }
      
      if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
        return true;
      }
      
      const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
      if (whitelistedIPs.includes(ipKeyGenerator(req.ip))) {
        return true;
      }
      
      return false;
    },
    
    handler: (req, res, next, options) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      
      console.warn(`⚠️ Rate limit exceeded:`, {
        ip: req.ip,
        userId: req.user?._id,
        path: req.path,
        method: req.method,
        key: req.rateLimit?.key,
        userAgent: req.headers['user-agent'],
        retryAfter: `${retryAfter}s`
      });

      res.status(429).json({
        success: false,
        message: options.message.message || 'Too many requests, please try again later',
        code: options.message.code || 'RATE_LIMIT_EXCEEDED',
        retryAfter,
        limit: options.max,
        windowMs: options.windowMs
      });
    },
    
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    requestPropertyName: 'rateLimit',
    statusCode: 429
  };

  const config = { ...defaultOptions, ...options };
  
  // Ensure custom keyGenerator is preserved
  if (options.keyGenerator) {
    config.keyGenerator = options.keyGenerator;
  }

  // Add debug logging for key generation in development
  if (isDevelopment) {
    const originalKeyGenerator = config.keyGenerator;
    config.keyGenerator = (req) => {
      const key = originalKeyGenerator(req);
      console.log(`🔑 Rate limit key for ${req.path}:`, key);
      return key;
    };
  }

  if (isProduction && redisClient && redisConnected && !config.store) {
    try {
      config.store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${config.prefix || 'global'}:`,
      });
      console.log(`✅ Using Redis store for rate limiting: ${config.prefix || 'global'}`);
    } catch (error) {
      console.error(`❌ Failed to create Redis store:`, error);
      console.warn('⚠️ Falling back to memory store');
    }
  } else if (isProduction && redisClient && !redisConnected) {
    console.warn('⚠️ Redis not connected yet, using memory store initially');
  } else if (isProduction && !redisClient) {
    console.warn('⚠️ Redis not available, using memory store');
  }

  const { prefix, ...cleanConfig } = config;
  return rateLimit(cleanConfig);
};

// ============================================
// AUTHENTICATION LIMITERS (Device + Email based)
// ============================================

/**
 * Auth rate limiter - Device + Email based (no IP sharing)
 */
export const authLimiter = rateLimiter({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 30 * 60 * 1000, // 2 min dev, 30 min prod
  max: isDevelopment ? 100 : 15, // 15 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'auth',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `auth:${email}:${deviceFingerprint}`;
  }
});

/**
 * Login rate limiter - Device + Email based
 */
export const loginLimiter = rateLimiter({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 30 * 60 * 1000, // 2 min dev, 30 min prod
  max: isDevelopment ? 100 : 10, // 10 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'login',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `login:${email}:${deviceFingerprint}`;
  }
});

/**
 * Registration rate limiter - Email + Device based
 */
export const registerLimiter = rateLimiter({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 min dev, 24 hours prod
  max: isDevelopment ? 20 : 3, // 3 registrations per day per device
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'register',
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `register:${email}:${deviceFingerprint}`;
  }
});

/**
 * Strict auth limiter (for sensitive operations)
 */
export const strictAuthLimiter = rateLimiter({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 2 * 60 * 60 * 1000, // 5 min dev, 2 hours prod
  max: isDevelopment ? 20 : 5, // 5 attempts per 2 hours
  message: {
    success: false,
    message: 'Too many sensitive authentication attempts. Please try again later.',
    code: 'STRICT_AUTH_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'strict-auth',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `strict:${email}:${deviceFingerprint}`;
  }
});

/**
 * Password reset rate limiter - Email + Device based
 */
export const passwordResetLimiter = rateLimiter({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 2 * 60 * 60 * 1000, // 5 min dev, 2 hours prod
  max: isDevelopment ? 20 : 5, // 5 attempts per 2 hours
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'password-reset',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `password-reset:${email}:${deviceFingerprint}`;
  }
});

/**
 * Email verification rate limiter - Email + Device based
 */
export const emailVerificationLimiter = rateLimiter({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 60 * 60 * 1000, // 2 min dev, 1 hour prod
  max: isDevelopment ? 30 : 5, // 5 attempts per hour
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
    code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'email-verification',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().replace(/[^a-z0-9@.]/g, '') : 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `email-verification:${email}:${deviceFingerprint}`;
  }
});

// ============================================
// NETWORK/IP BASED LIMITERS (Global protection)
// ============================================

/**
 * IP-based network limiter - prevents DoS attacks
 */
export const networkLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per 5 minutes per IP
  message: {
    success: false,
    message: 'Too many requests from your network. Please slow down.',
    code: 'NETWORK_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'network',
  keyGenerator: (req) => {
    const safeIp = ipKeyGenerator(req.ip);
    return `network:${safeIp}`;
  }
});

// ============================================
// API LIMITERS (General purpose)
// ============================================

export const apiLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 1000 : 300,
  message: {
    success: false,
    message: 'Too many API requests. Please slow down.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'api'
});

export const publicLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 500 : 200,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'public'
});

// ============================================
// ADMIN LIMITERS
// ============================================

export const adminLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 1000 : 500,
  message: {
    success: false,
    message: 'Too many admin requests. Please slow down.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'admin',
  skip: (req) => {
    if (isDevelopment && req.user?.role === 'super_admin') {
      return true;
    }
    return false;
  }
});

// ============================================
// FEATURE-SPECIFIC LIMITERS
// ============================================

export const dashboardLimiter = rateLimiter({
  windowMs: isDevelopment ? 30 * 1000 : 60 * 1000,
  max: isDevelopment ? 500 : 100,
  message: {
    success: false,
    message: 'Too many dashboard requests. Please slow down.',
    code: 'DASHBOARD_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'dashboard',
  keyGenerator: (req) => {
    if (req.user?._id) {
      return `dashboard:user:${req.user._id.toString()}`;
    }
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `dashboard:fp:${fingerprint}`;
  }
});

export const uploadLimiter = rateLimiter({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000,
  max: isDevelopment ? 50 : 20,
  message: {
    success: false,
    message: 'Too many upload attempts. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'upload',
  keyGenerator: (req) => {
    if (req.user?._id) return `upload:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `upload:fp:${fingerprint}`;
  }
});

export const notificationLimiter = rateLimiter({
  windowMs: isDevelopment ? 30 * 1000 : 60 * 1000,
  max: isDevelopment ? 200 : 50,
  message: {
    success: false,
    message: 'Too many notification requests. Please slow down.',
    code: 'NOTIFICATION_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'notification',
  keyGenerator: (req) => {
    if (req.user?._id) return `notification:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `notification:fp:${fingerprint}`;
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create custom rate limiter with options
 */
export const createRateLimiter = (options) => {
  return rateLimiter(options);
};

/**
 * Get rate limit status for a key
 */
export const getRateLimitStatus = async (key) => {
  if (!redisClient || !redisConnected) {
    return { error: 'Redis not available' };
  }
  
  try {
    const hits = await redisClient.get(`rl:${key}`);
    return {
      key,
      hits: parseInt(hits) || 0,
      remaining: Math.max(0, 100 - (parseInt(hits) || 0))
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return { error: error.message };
  }
};

/**
 * Reset rate limit for a key
 */
export const resetRateLimit = async (key) => {
  if (!redisClient || !redisConnected) {
    return false;
  }
  
  try {
    await redisClient.del(`rl:${key}`);
    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
};

/**
 * Bypass rate limiter for testing/development
 */
export const bypassRateLimiter = (req, res, next) => {
  if (isDevelopment || isTest) {
    return next();
  }
  
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
  if (whitelistedIPs.includes(ipKeyGenerator(req.ip))) {
    return next();
  }
  
  return rateLimiter()(req, res, next);
};

// Export Redis client for use elsewhere
export { redisClient, redisConnected };