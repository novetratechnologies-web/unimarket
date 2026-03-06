// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ✅ Import User model, not AdminVendor

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check cookies (for production)
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔍 Decoded token:', { id: decoded.id, email: decoded.email });
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: 'TOKEN_EXPIRED',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: 'INVALID_TOKEN'
      });
    }
    
    // Check token type if it exists
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // ✅ FIXED: Get user from User model (not AdminVendor)
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -verificationCode -resetPasswordCode -csrfTokens -validRefreshTokens');
    
    if (!user) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach full user object to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role || 'user';

    console.log('✅ User authenticated:', user.email);
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      code: 'AUTH_ERROR'
    });
  }
};

export const verifyCSRFToken = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
  
  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      message: "CSRF token required",
      code: 'CSRF_REQUIRED'
    });
  }

  // Optional: Validate CSRF token against user's stored tokens
  // if (req.user && !req.user.isValidCSRFToken(csrfToken)) {
  //   return res.status(403).json({
  //     success: false,
  //     message: "Invalid CSRF token",
  //     code: 'CSRF_INVALID'
  //   });
  // }

  next();
};

// Optional: Add role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
        code: 'NO_TOKEN'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this role",
        code: 'UNAUTHORIZED_ROLE'
      });
    }

    next();
  };
};