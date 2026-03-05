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
  
  // 🔥 FIX: Remove IP from fingerprint calculation
  const timeWindow = includeTimeWindow 
    ? Math.floor(Date.now() / (5 * 60 * 1000))
    : '';
  
  // Create fingerprint WITHOUT IP - only browser/device characteristics
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}:${acceptLang}:${acceptEncoding}:${connection}:${timeWindow}`)
    .digest('hex')
    .substring(0, 20);
  
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
    ? Math.floor(Date.now() / (5 * 60 * 1000))
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
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    
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
      const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
      
      console.warn(`⚠️ Rate limit exceeded:`, {
        ip: req.ip,
        userId: req.user?._id,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        retryAfter: `${retryAfter} minutes`
      });

      res.status(429).json({
        success: false,
        message: options.message.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
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

/**
 * Auth rate limiter - Device + Email based (no IP sharing)
 */
export const authLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 30 * 60 * 1000,
  max: isDevelopment ? 100 : 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'auth',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    // 🔥 FIX: Use device fingerprint without IP
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `auth:${email}:${deviceFingerprint}`;
  }
});

/**
 * STRICT Auth rate limiter - Device + Email based
 */
export const strictAuthLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 2 * 60 * 60 * 1000,
  max: isDevelopment ? 50 : 5,
  message: {
    success: false,
    message: 'Too many sensitive authentication attempts, please try again later',
    code: 'STRICT_AUTH_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'strict-auth',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `strict-auth:${email}:${deviceFingerprint}`;
  }
});

/**
 * Login rate limiter - Device + Email based
 */
export const loginLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 30 * 60 * 1000,
  max: isDevelopment ? 100 : 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'login',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `login:${email}:${deviceFingerprint}`;
  }
});

/**
 * 🔥 FIXED: Registration rate limiter - Email + Device based (NO IP SHARING)
 * Different devices on same network get different limits
 */
export const registerLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 24 * 60 * 60 * 1000,
  max: isDevelopment ? 50 : 5,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'register',
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    // 🔥 CRITICAL FIX: Use device fingerprint WITHOUT IP
    // This ensures different devices on same network have separate limits
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    
    // For extra security, also add a network-level limit in a separate limiter
    // But for registration, device + email is sufficient
    return `register:${email}:${deviceFingerprint}`;
  }
});

/**
 * Password reset rate limiter - Email + Device based
 */
export const passwordResetLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 2 * 60 * 60 * 1000,
  max: isDevelopment ? 50 : 5,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'password-reset',
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `password-reset:${email}:${deviceFingerprint}`;
  }
});

/**
 * Email verification rate limiter - Email + Device based
 */
export const emailVerificationLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 60 * 1000,
  max: isDevelopment ? 50 : 3,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later',
    code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'email-verification',
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    const deviceFingerprint = generateDeviceFingerprint(req, false);
    return `email-verification:${email}:${deviceFingerprint}`;
  }
});

/**
 * IP-based network limiter (optional - for additional protection)
 * This runs alongside device-based limiters
 */
export const networkLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour from same IP/network
  message: {
    success: false,
    message: 'Too many requests from your network, please try again later',
    code: 'NETWORK_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'network',
  keyGenerator: (req) => {
    const safeIp = ipKeyGenerator(req.ip);
    return `network:${safeIp}`;
  }
});

// ============================================
// EXISTING LIMITERS (unchanged - keep as is)
// ============================================

export const apiLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 1000 : 300,
  message: {
    success: false,
    message: 'Too many API requests, please slow down',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'api'
});

export const adminLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 1000 : 800,
  message: {
    success: false,
    message: 'Too many admin requests, please slow down',
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

export const publicLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 500 : 400,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'public'
});

export const dashboardLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000,
  max: isDevelopment ? 1000 : 500,
  message: {
    success: false,
    message: 'Too many dashboard requests, please slow down',
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

export const notificationLimiter = rateLimiter({
  windowMs: isDevelopment ? 30 * 1000 : 30 * 1000,
  max: isDevelopment ? 500 : 100,
  message: {
    success: false,
    message: 'Too many notification requests, please slow down',
    code: 'NOTIFICATION_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'notification',
  keyGenerator: (req) => {
    if (req.user?._id) return `notification:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `notification:fp:${fingerprint}`;
  }
});

export const activityLimiter = rateLimiter({
  windowMs: isDevelopment ? 30 * 1000 : 30 * 1000,
  max: isDevelopment ? 500 : 150,
  message: {
    success: false,
    message: 'Too many activity requests, please slow down',
    code: 'ACTIVITY_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'activity',
  keyGenerator: (req) => {
    if (req.user?._id) return `activity:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `activity:fp:${fingerprint}`;
  }
});

export const orderLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000,
  max: isDevelopment ? 1000 : 300,
  message: {
    success: false,
    message: 'Too many order requests, please slow down',
    code: 'ORDER_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'order',
  keyGenerator: (req) => {
    if (req.user?._id) return `order:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `order:fp:${fingerprint}`;
  }
});

export const productLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000,
  max: isDevelopment ? 1000 : 400,
  message: {
    success: false,
    message: 'Too many product requests, please slow down',
    code: 'PRODUCT_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'product',
  keyGenerator: (req) => {
    if (req.user?._id) return `product:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `product:fp:${fingerprint}`;
  }
});

export const userLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000,
  max: isDevelopment ? 1000 : 200,
  message: {
    success: false,
    message: 'Too many user requests, please slow down',
    code: 'USER_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'user',
  keyGenerator: (req) => {
    if (req.user?._id) return `user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `user:fp:${fingerprint}`;
  }
});

export const uploadLimiter = rateLimiter({
  windowMs: isDevelopment ? 60 * 1000 : 24 * 60 * 60 * 1000,
  max: isDevelopment ? 200 : 50,
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  prefix: 'upload',
  keyGenerator: (req) => {
    if (req.user?._id) return `upload:user:${req.user._id}`;
    const fingerprint = generateIpBasedFingerprint(req, true);
    return `upload:fp:${fingerprint}`;
  }
});

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