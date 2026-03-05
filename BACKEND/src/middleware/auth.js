// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import AdminVendor from '../models/AdminVendor.js';
import User from '../models/User.js'; // Add this import for regular users
import bcrypt from 'bcryptjs';

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hash password
 */
export const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
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
  
  return {
    isValid: score >= 3,
    strength: score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak',
    checks,
    score
  };
};

// ============================================
// JWT TOKEN UTILITIES
// ============================================

/**
 * Generate JWT token
 */
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn,
    issuer: process.env.JWT_ISSUER || 'unimarket-api',
    audience: process.env.JWT_AUDIENCE || 'unimarket-client'
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
    expiresIn: '30d',
    issuer: process.env.JWT_ISSUER || 'unimarket-api',
    audience: process.env.JWT_AUDIENCE || 'unimarket-client'
  });
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_VERIFY_SECRET, { 
    expiresIn: '24h',
    issuer: process.env.JWT_ISSUER || 'unimarket-api'
  });
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_RESET_SECRET, { 
    expiresIn: '1h',
    issuer: process.env.JWT_ISSUER || 'unimarket-api'
  });
};

/**
 * Verify JWT token - FIXED with better error handling
 */
export const verifyToken = (token, type = 'access') => {
  let secret;
  
  switch (type) {
    case 'refresh':
      secret = process.env.JWT_REFRESH_SECRET;
      break;
    case 'verify':
      secret = process.env.JWT_VERIFY_SECRET;
      break;
    case 'reset':
      secret = process.env.JWT_RESET_SECRET;
      break;
    default:
      secret = process.env.JWT_SECRET;
  }

  if (!secret) {
    console.error(`❌ JWT_SECRET for type '${type}' is not defined in environment variables`);
    throw new Error('JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error(`🔐 Token verification failed (${type}):`, error.message);
    throw error;
  }
};

// ============================================
// AUTHENTICATION MIDDLEWARE - FIXED
// ============================================

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }


    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'NO_TOKEN'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token, 'access');
    } catch (verifyError) {
      
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          error: 'TOKEN_EXPIRED',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    // Get user - check both AdminVendor and User models based on role
    let user = null;
    
    if (decoded.role === 'admin' || decoded.role === 'super_admin' || decoded.role === 'vendor') {
      user = await AdminVendor.findById(decoded.id)
        .select('-password -refreshToken -twoFactorAuth.secret -twoFactorAuth.backupCodes');

    } else {
      user = await User.findById(decoded.id)
        .select('-password -refreshToken');

    }


    
    if (user) {
    }

    if (!user) {

      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active (for AdminVendor)
    if (user.status && user.status !== 'active') {

      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user is active (for User model)
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user is deleted
    if (user.isDeleted) {

      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
        error: 'ACCOUNT_DELETED'
      });
    }

    // Check if session token is valid (for AdminVendor only)
    if (req.headers['x-session-token'] && user.sessionTokens) {
      const session = user.sessionTokens?.find(
        s => s.token === req.headers['x-session-token'] && s.expiresAt > new Date()
      );
      
      
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session',
          error: 'INVALID_SESSION'
        });
      }
      
      // Update last used
      session.lastUsed = new Date();
      await user.save();
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role || 'user';


    next();
  } catch (error) {
    console.error('🔍 [protect] Unexpected error:', error);
    console.error('🔍 [protect] Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

// ============================================
// AUTHORIZATION MIDDLEWARE - FIXED with super_admin bypass
// ============================================

/**
 * Authorize roles - with super_admin bypass
 */
export const authorize = (...roles) => {
  return (req, res, next) => {


    if (!req.user) {

      return res.status(401).json({
        success: false,
        message: 'Not authorized',
        error: 'UNAUTHORIZED'
      });
    }

    // Super admin has access to everything
    if (req.user.role === 'super_admin') {

      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
        error: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
};

/**
 * Check permissions - with super_admin bypass
 */
export const permit = (...requiredPermissions) => {
  return (req, res, next) => {


    if (!req.user) {

      return res.status(401).json({
        success: false,
        message: 'Not authorized',
        error: 'UNAUTHORIZED'
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super_admin') {

      return next();
    }

    const userPermissions = req.user.permissions || [];
    
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );


    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        error: 'FORBIDDEN_PERMISSION',
        required: requiredPermissions
      });
    }

    next();
  };
};

/**
 * Check if user is owner of resource
 */
export const isOwner = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user._id;

      // Super admin can access all
      if (req.user.role === 'super_admin') {
        return next();
      }

      const Model = req.model;
      if (!Model) {
        return next();
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          error: 'NOT_FOUND'
        });
      }

      const ownerId = resource[resourceField]?.toString();
      
      if (ownerId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not own this resource',
          error: 'NOT_OWNER'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

/**
 * Rate limit for authenticated users
 */
export const userRateLimit = (maxRequests = 100, windowMs = 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const userRequests = requests.get(userId) || [];
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    // Cleanup old entries
    if (requests.size > 10000) {
      for (const [key, times] of requests) {
        const validTimes = times.filter(time => time > windowStart);
        if (validTimes.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, validTimes);
        }
      }
    }

    next();
  };
};

export default {
  // Password utilities
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  
  // Token utilities
  generateToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  
  // Middleware
  protect,
  authorize,
  permit,
  isOwner,
  userRateLimit
};