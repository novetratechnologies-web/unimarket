// routes/authRoutes.js - COMPLETELY REFINED AUTH FLOW
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import passport from "passport"; // ✅ IMPORT PASSPORT
import {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  verifyResetCode,
  resendResetCode,
  resetPassword,
  bulkCheckUsernames,
  checkUsernameAvailability,
  getUsernameSuggestions
} from "../controllers/authController.js";
import { authLimiter, strictAuthLimiter } from "../middleware/rateLimiter.js";
import { protect, verifyCSRFToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import bcrypt from "bcryptjs"; 
import { handleGoogleCallback, completeGoogleProfile } from '../controllers/googleAuthController.js';

const router = express.Router();

// ==================== ROUTE DEBUGGING (REMOVE IN PRODUCTION) ====================
router.get("/test-routes", (req, res) => {
  const routes = [];
  router.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      routes.push({
        path: layer.route.path,
        methods
      });
    }
  });
  res.json({
    success: true,
    routes,
    total: routes.length,
    message: "Auth routes loaded successfully"
  });
});

/** 🔐 JWT Token Configuration */
const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  ISSUER: "UniMarket",
  AUDIENCE: "unimarket-app"
};

/** 🔐 Helper: Generate Secure Random Code */
const generateSecureCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/** 🔐 Validation Middleware */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      })),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

/** 🔐 Sanitize User Object */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  const { 
    password, 
    refreshToken, 
    verificationCode, 
    verificationCodeExpiry,
    resetPasswordCode, 
    resetPasswordExpires, 
    loginAttempts,
    loginLockoutUntil,
    ...safeUser 
  } = userObj;
  return safeUser;
};

// ==================== GOOGLE OAUTH ROUTES (MUST BE FIRST) ====================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get(
  "/google",
  (req, res, next) => {
    console.log("🔄 [1] Google OAuth initiation started");
    console.log("📍 Query params:", req.query);
    
    const redirectUrl = req.query.redirect || process.env.CLIENT_URL;
    
    // Create state object with redirect URL
    const state = Buffer.from(JSON.stringify({
      redirect: redirectUrl,
      timestamp: Date.now(),
      random: crypto.randomBytes(8).toString('hex')
    })).toString('base64');
    
    // Start Google OAuth flow
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: state,
      session: false,
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  }
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("🔄 [2] Google OAuth callback received");
    console.log("📍 Query params:", req.query);
    
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`
    }, async (err, user, info) => {
      try {
        if (err) {
          console.error('❌ Google auth error:', err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed&message=${encodeURIComponent(err.message)}`);
        }

        if (!user) {
          console.error('❌ No user returned from Google');
          return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
        }

        console.log("✅ Google auth successful for:", user.email);

        // Parse state for redirect URL
        let redirectUrl = process.env.CLIENT_URL;
        if (req.query.state) {
          try {
            const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
            redirectUrl = stateData.redirect || redirectUrl;
            console.log("📍 Redirect URL from state:", redirectUrl);
          } catch (e) {
            console.warn('Failed to parse state:', e);
          }
        }

        // Call the handler with user
        req.user = user;
        const result = await handleGoogleCallback(req, res);

        if (result.requiresProfileCompletion) {
          const tempToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
          );
          console.log("⚠️ Profile incomplete, redirecting to completion");
          return res.redirect(`${redirectUrl}/complete-profile?token=${tempToken}`);
        }

        console.log("✅ Authentication complete, redirecting to frontend");
        res.redirect(
          `${redirectUrl}/auth-success?token=${result.tokens.access}&refresh=${result.tokens.refresh}`
        );

      } catch (error) {
        console.error('❌ Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
      }
    })(req, res, next);
  }
);

/**
 * @route   POST /api/auth/complete-google-profile
 * @desc    Complete Google profile after OAuth
 * @access  Private
 */
router.post(
  "/complete-google-profile",
  protect,
  verifyCSRFToken,
  [
    body("firstName").trim().escape().isLength({ min: 2, max: 50 }).optional(),
    body("lastName").trim().escape().isLength({ min: 2, max: 50 }).optional(),
    body("phone").matches(/^\+?[\d\s-()]{10,}$/).withMessage("Valid phone number required"),
    body("university").trim().escape().isLength({ min: 2, max: 100 })
  ],
  validateRequest,
  completeGoogleProfile
);

// ==================== REGISTRATION & VERIFICATION ====================

/** 📝 Register User */
router.post(
  "/register",
  authLimiter,
  [
    body("firstName").trim().escape().isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
    body("lastName").trim().escape().isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
      .withMessage("Password must contain uppercase, lowercase, number and special character"),
    body("phone").matches(/^\+?[\d\s-()]{10,}$/).withMessage("Please provide a valid phone number"),
    body("university").trim().escape().isLength({ min: 2, max: 100 }).withMessage("Please select your university"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    })
  ],
  validateRequest,
  register
);

/** ✅ Verify Email */
router.post(
  "/verify-email",
  strictAuthLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Please enter a valid 6-digit code")
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, code } = req.body;
      
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
        verificationCode: code,
        verificationCodeExpiry: { $gt: Date.now() },
        isVerified: false
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
          code: 'INVALID_CODE'
        });
      }

      user.isVerified = true;
      user.emailVerifiedAt = new Date();
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
      user.lastVerificationRequest = undefined;
      await user.save();

      console.log(`✅ Email verified for: ${email}`);

      res.json({
        success: true,
        message: "Email verified successfully! You can now login.",
        code: 'VERIFIED'
      });

    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({
        success: false,
        message: "Verification failed. Please try again.",
        code: 'VERIFICATION_FAILED',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/** 🔄 Resend Verification Code */
router.post(
  "/resend-verification",
  strictAuthLimiter,
  [
    body("email").isEmail().normalizeEmail()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ 
        email: email.toLowerCase().trim(),
        isVerified: false 
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No unverified account found with this email",
          code: 'USER_NOT_FOUND'
        });
      }

      const oneMinuteAgo = Date.now() - 60000;
      if (user.lastVerificationRequest && user.lastVerificationRequest > oneMinuteAgo) {
        const remainingTime = Math.ceil((user.lastVerificationRequest + 60000 - Date.now()) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting another code`,
          retryAfter: remainingTime,
          code: 'RATE_LIMITED'
        });
      }

      const verificationCode = generateSecureCode();
      const expiry = Date.now() + 10 * 60 * 1000;

      let emailSent = false;
      let emailError = null;

      try {
        const emailResult = await sendVerificationEmail(email, verificationCode, user.firstName);
        emailSent = emailResult.success !== false;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 [DEV] Verification code for ${email}: ${verificationCode}`);
        }
        
      } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        emailError = error;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 [DEV FALLBACK] Using code: ${verificationCode} for ${email}`);
          emailSent = true;
        }
      }

      user.verificationCode = verificationCode;
      user.verificationCodeExpiry = expiry;
      user.lastVerificationRequest = Date.now();
      await user.save();

      if (emailSent) {
        return res.json({
          success: true,
          message: "Verification code sent successfully",
          code: 'VERIFICATION_RESENT',
          expiry: expiry,
          ...(process.env.NODE_ENV === 'development' && {
            verificationCode: verificationCode
          })
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to send email, but code was generated. Please contact support.",
          code: 'EMAIL_FAILED',
          ...(process.env.NODE_ENV === 'development' && {
            verificationCode: verificationCode
          })
        });
      }

    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification code",
        code: 'SERVER_ERROR'
      });
    }
  }
);

// ==================== LOGIN & SESSION ====================

/** 🔑 Login */
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  login
);

/** 🔄 Refresh Token */
router.post(
  "/refresh",
  authLimiter,
  [
    body("refresh").notEmpty().withMessage("Refresh token is required")
  ],
  validateRequest,
  refreshToken
);

/** 🚪 Logout */
router.post(
  "/logout",
  protect,
  [
    body("refresh").notEmpty().withMessage("Refresh token is required")
  ],
  validateRequest,
  logout
);

// ==================== USERNAME MANAGEMENT ====================

/** 🔍 Check Username Availability */
router.get(
  "/check-username",
  authLimiter,
  checkUsernameAvailability
);

/** 💡 Get Username Suggestions */
router.get(
  "/username-suggestions",
  authLimiter,
  getUsernameSuggestions
);

/** 📊 Bulk Check Usernames */
router.post(
  "/check-usernames-bulk",
  protect,
  verifyCSRFToken,
  bulkCheckUsernames
);

// ==================== PASSWORD RESET ====================

/** 🔐 Forgot Password */
router.post(
  "/forgot-password",
  strictAuthLimiter,
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  forgotPassword
);

/** 🔍 Verify Reset Code */
router.post(
  "/verify-reset-code",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isLength({ min: 6, max: 6 }).isNumeric()
  ],
  validateRequest,
  verifyResetCode
);

/** 🔄 Resend Reset Code */
router.post(
  "/resend-reset-code",
  strictAuthLimiter,
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  resendResetCode
);

/** 🔑 Reset Password */
router.post(
  "/reset-password",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isLength({ min: 6, max: 6 }).isNumeric(),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
      .withMessage("Password must contain uppercase, lowercase, number and special character")
  ],
  validateRequest,
  resetPassword
);

// ==================== USER PROFILE ====================

/** 👤 Get Current User */
router.get(
  "/me",
  protect,
  getMe
);

/** ✏️ Update Profile */
router.put(
  "/profile",
  protect,
  verifyCSRFToken,
  [
    body("firstName").optional().trim().escape().isLength({ min: 2, max: 50 }),
    body("lastName").optional().trim().escape().isLength({ min: 2, max: 50 }),
    body("phone").optional().matches(/^\+?[\d\s-()]{10,}$/),
    body("university").optional().trim().escape().isLength({ min: 2, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const updates = req.body;
      const userId = req.user.id;

      delete updates.email;
      delete updates.password;
      delete updates.isVerified;
      delete updates._id;
      delete updates.__v;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: 'USER_NOT_FOUND'
        });
      }

      user.lastActive = new Date();
      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: sanitizeUser(user),
        code: 'PROFILE_UPDATED'
      });

    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        code: 'UPDATE_FAILED'
      });
    }
  }
);

// ==================== SECURITY ENDPOINTS ====================

/** 🔐 Change Password */
router.post(
  "/change-password",
  protect,
  verifyCSRFToken,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
      .withMessage("Password must contain uppercase, lowercase, number and special character"),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) throw new Error("Passwords do not match");
        return true;
      })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId).select("+password");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: 'USER_NOT_FOUND'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
          code: 'INVALID_PASSWORD'
        });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "New password cannot be the same as old password",
          code: 'SAME_PASSWORD'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      user.lastActive = new Date();
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
        code: 'PASSWORD_CHANGED'
      });

    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
        code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  }
);

/** 🛡️ Invalidate All Sessions */
router.post(
  "/invalidate-all-sessions",
  protect,
  [body("password").notEmpty().withMessage("Password is required")],
  validateRequest,
  async (req, res) => {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId).select("+password");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: 'USER_NOT_FOUND'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Password is incorrect",
          code: 'INVALID_PASSWORD'
        });
      }

      user.refreshToken = undefined;
      user.lastLogout = new Date();
      await user.save();

      res.json({
        success: true,
        message: "All sessions invalidated successfully",
        code: 'SESSIONS_INVALIDATED'
      });

    } catch (error) {
      console.error("Invalidate sessions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to invalidate sessions",
        code: 'INVALIDATION_FAILED'
      });
    }
  }
);

/** 🔍 Session Info */
router.get(
  "/session-info",
  protect,
  (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email
      },
      session: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString()
      },
      environment: process.env.NODE_ENV
    });
  }
);

/** 📧 Test Email Service */
router.post(
  "/test-email",
  strictAuthLimiter,
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  async (req, res) => {
    try {
      const { email } = req.body;
      const { testEmailService } = await import("../utils/emailService.js");
      const result = await testEmailService(email);
      
      res.json({
        success: result.success,
        message: result.message,
        data: result
      });
      
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test email service",
        error: error.message
      });
    }
  }
);

// ==================== HEALTH CHECK ====================

/** 🩺 Health Check */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: "MongoDB",
      authentication: "JWT",
      email: "Brevo SMTP",
      environment: process.env.NODE_ENV
    }
  });
});

export default router;