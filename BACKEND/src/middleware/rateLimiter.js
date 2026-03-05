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
      enableOfflineQueue: true, // 🔥 CHANGE THIS TO TRUE
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error('❌ Redis connection failed after 5 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true // Don't connect immediately
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

    // Connect manually
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
 * Generate a fingerprint for anonymous users
 * This prevents one user on a shared IP from blocking everyone
 */
const generateFingerprint = (req, includeTimeWindow = true) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLang = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  const connection = req.headers['connection'] || 'unknown';
  
  // Add time window to prevent permanent blocking (changes every 5 minutes)
  const timeWindow = includeTimeWindow 
    ? Math.floor(Date.now() / (5 * 60 * 1000)) // 5-minute windows
    : '';
  
  // Create a hash of multiple factors to create a semi-unique fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${req.ip}:${userAgent}:${acceptLang}:${acceptEncoding}:${connection}:${timeWindow}`)
    .digest('hex')
    .substring(0, 20);
  
  return fingerprint;
};

/**
 * Create rate limiter - Production ready with Redis support
 */
export const rateLimiter = (options = {}) => {
  // Skip rate limiting in test environment
  if (isTest) {
    return (req, res, next) => next();
  }

  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each client to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    
    // 🔥 FIXED: Proper key generator that satisfies the IPv6 validation
    keyGenerator: (req) => {
      // For authenticated users, use their ID (prevents one user from blocking others)
      if (req.user?._id) {
        return `user:${req.user._id.toString()}`;
      }
      
      // For API keys
      if (req.headers['x-api-key']) {
        return `apikey:${req.headers['x-api-key']}`;
      }
      
      // For sessions
      if (req.session?.id) {
        return `session:${req.session.id}`;
      }
      
      // For client ID sent from frontend
      if (req.headers['x-client-id']) {
        return `client:${req.headers['x-client-id']}`;
      }
      
      // ✅ CORRECT FIX: For unauthenticated users, use ipKeyGenerator to handle IPv6 safely
      const safeIp = ipKeyGenerator(req.ip);
      
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLang = req.headers['accept-language'] || 'unknown';
      const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute windows
      
      // Create a fingerprint that includes the safe IP
      const fingerprint = crypto
        .createHash('sha256')
        .update(`${safeIp}:${userAgent}:${acceptLang}:${timeWindow}`)
        .digest('hex')
        .substring(0, 20);
      
      return `fp:${fingerprint}`;
    },
    
    // Skip rate limiting conditions
    skip: (req) => {
      // Skip in development for easier testing
      if (isDevelopment) {
        return true;
      }
      
      // Skip for health checks
      if (req.path === '/health' || req.path === '/healthcheck') {
        return true;
      }
      
      // Skip for super admins
      if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
        return true;
      }
      
      // Skip for whitelisted IPs
      const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
      if (whitelistedIPs.includes(ipKeyGenerator(req.ip))) {
        return true;
      }
      
      return false;
    },
    
    // Custom handler when rate limit is exceeded
    handler: (req, res, next, options) => {
      const retryAfter = Math.ceil(options.windowMs / 1000 / 60); // minutes
      
      // Log rate limit hits
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

  // Merge with user options
  const config = { ...defaultOptions, ...options };

  // 🔥 FIXED: Only use Redis store if client exists AND is connected
  if (isProduction && redisClient && redisConnected && !config.store) {
    try {
      config.store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${config.prefix || 'global'}:`,
      });
      console.log(`✅ Using Redis store for rate limiting: ${config.prefix || 'global'}`);
    } catch (error) {
      console.error(`❌ Failed to create Redis store:`, error);
      // Fall back to memory store
      console.warn('⚠️ Falling back to memory store');
    }
  } else if (isProduction && redisClient && !redisConnected) {
    console.warn('⚠️ Redis not connected yet, using memory store initially');
  } else if (isProduction && !redisClient) {
    console.warn('⚠️ Redis not available, using memory store');
  }

  // Remove any invalid options
  const { prefix, ...cleanConfig } = config;

  return rateLimit(cleanConfig);
};

/**
 * Auth rate limiter - For authentication endpoints
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
    const fingerprint = generateFingerprint(req, false);
    return `auth:${email}:${fingerprint}`;
  }
});

/**
 * STRICT Auth rate limiter - For sensitive operations
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
    const fingerprint = generateFingerprint(req, false);
    return `strict-auth:${email}:${fingerprint}`;
  }
});

/**
 * API rate limiter - General API endpoints
 */
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

/**
 * Admin rate limiter
 */
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

/**
 * Public rate limiter
 */
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

/**
 * DASHBOARD LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `dashboard:fp:${fingerprint}`;
  }
});

/**
 * NOTIFICATION LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `notification:fp:${fingerprint}`;
  }
});

/**
 * ACTIVITY LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `activity:fp:${fingerprint}`;
  }
});

/**
 * ORDER LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `order:fp:${fingerprint}`;
  }
});

/**
 * PRODUCT LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `product:fp:${fingerprint}`;
  }
});

/**
 * USER LIMITER
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `user:fp:${fingerprint}`;
  }
});

/**
 * Login rate limiter
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
    const fingerprint = generateFingerprint(req, false);
    return `login:${email}:${fingerprint}`;
  }
});

/**
 * Registration rate limiter
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
    const fingerprint = generateFingerprint(req, false);
    return `register:${email}:${fingerprint}`;
  }
});

/**
 * Password reset rate limiter
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
    const fingerprint = generateFingerprint(req, false);
    return `password-reset:${email}:${fingerprint}`;
  }
});

/**
 * File upload rate limiter
 */
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
    const fingerprint = generateFingerprint(req, true);
    return `upload:fp:${fingerprint}`;
  }
});

/**
 * Email verification rate limiter
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
    const fingerprint = generateFingerprint(req, false);
    return `email-verification:${email}:${fingerprint}`;
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