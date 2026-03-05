// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import AdminVendor from "../models/AdminVendor.js";

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
    
    // ✅ FIXED: Only check token type if it exists
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get full user from database
    const user = await AdminVendor.findById(decoded.id).select('-password -refreshToken -twoFactorAuth.secret -twoFactorAuth.backupCodes');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }


    // Check if user is active
    if (user.status !== 'active') {

      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
        code: 'ACCOUNT_DELETED'
      });
    }

    // Attach full user object to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;


    next();

  } catch (error) {
    
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

  next();
};