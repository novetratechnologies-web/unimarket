// controllers/authController.js - UPDATED FOR EMAIL INTEGRATION
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminAlert
} from "../utils/emailService.js";

// ==================== CONFIGURATION ====================

const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_EXPIRY: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_EXPIRY: "7d",
  ISSUER: "UniMarket",
  AUDIENCE: "unimarket-app"
};

const SECURITY_CONFIG = {
  PASSWORD_SALT_ROUNDS: 12,
  VERIFICATION_CODE_EXPIRY: 10 * 60 * 1000, // 10 minutes
  RESET_CODE_EXPIRY: 10 * 60 * 1000, // 10 minutes
  RESEND_COOLDOWN: 60 * 1000, // 1 minute
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutes
};

// ==================== HELPER FUNCTIONS ====================

/** 🔐 Generate Secure Tokens */
const generateToken = (user, type = "access") => {
  const secret = type === "access" 
    ? JWT_CONFIG.ACCESS_SECRET 
    : JWT_CONFIG.REFRESH_SECRET;
  
  const expiry = type === "access"
    ? JWT_CONFIG.ACCESS_EXPIRY
    : JWT_CONFIG.REFRESH_EXPIRY;

  const payload = {
    id: user._id,
    email: user.email,
    type: type,
    iss: JWT_CONFIG.ISSUER,
    aud: JWT_CONFIG.AUDIENCE,
    sub: user._id.toString(),
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString("hex") // Unique token ID for replay protection
  };

  return jwt.sign(payload, secret, { expiresIn: expiry });
};

/** 🔐 Generate Secure Random Code */
const generateSecureCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/** 🔐 Sanitize User Input */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove any HTML tags and trim whitespace
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

/** 🔐 Validate Password Strength */
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  
  const isValid = Object.values(requirements).every(Boolean);
  const strengthScore = Object.values(requirements).filter(Boolean).length;
  
  return { 
    isValid, 
    requirements,
    strength: strengthScore >= 4 ? 'strong' : strengthScore >= 3 ? 'medium' : 'weak'
  };
};

/** 🔐 Check Rate Limit */
const checkRateLimit = (user, field) => {
  const now = Date.now();
  
  if (user[`${field}Attempts`] >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    if (user[`${field}LockoutUntil`] && now < user[`${field}LockoutUntil`]) {
      const remainingTime = Math.ceil((user[`${field}LockoutUntil`] - now) / 1000);
      throw {
        status: 429,
        message: `Account temporarily locked. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime,
        code: 'ACCOUNT_LOCKED'
      };
    } else {
      // Reset attempts after lockout period
      user[`${field}Attempts`] = 0;
      user[`${field}LockoutUntil`] = undefined;
    }
  }
};

/** 🔐 Centralized Error Handler */
const handleError = (res, err, message = "Server error", status = 500) => {
  console.error(`${message}:`, err);
  
  // Log security events
  if (status === 401 || status === 403 || status === 429) {
    console.log(`🔒 Security event: ${message} - ${err.message || 'No details'}`);
  }
  
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? message 
    : `${message}: ${err.message}`;
    
  return res.status(status).json({ 
    success: false,
    message: errorMessage,
    code: status === 500 ? 'SERVER_ERROR' : err.code || 'CLIENT_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
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
    resetPasswordAttempts,
    lastResetIP,
    ...safeUser 
  } = userObj;
  return safeUser;
};

// ==================== EMAIL HELPER FUNCTIONS ====================

/** 📧 Send Email with Better Error Handling */
const sendEmailWithFallback = async (emailFunction, ...args) => {
  try {
    const result = await emailFunction(...args);
    
    if (!result.success && process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV FALLBACK] Email function returned success: false`);
      console.log(`📧 Details:`, result);
    }
    
    return result;
  } catch (emailError) {
    console.error(`📧 Email send error:`, emailError.message);
    
    // In development, we don't want email failures to break the flow
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] Email failed but continuing in development mode`);
      return {
        success: false,
        message: "Email failed (development mode)",
        devNote: "Check console for details"
      };
    }
    
    // In production, re-throw the error
    throw emailError;
  }
};

// ==================== CONTROLLER FUNCTIONS ====================

/** 📝 REGISTER USER */
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors for frontend
      const formattedErrors = errors.array().map(err => ({
        field: err.param,
        message: getFriendlyErrorMessage('validation', err.param, err.msg)
      }));

      return res.status(400).json({ 
        success: false,
        message: "Please check your information and try again",
        errors: formattedErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { firstName, lastName, email, phone, password, university, username, dateOfBirth, gender, alternativePhone } = req.body;

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: sanitizeInput(email).toLowerCase(),
      phone: sanitizeInput(phone),
      university: sanitizeInput(university),
      username: username ? sanitizeInput(username).toLowerCase() : undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || 'prefer not to say',
      alternativePhone: alternativePhone ? sanitizeInput(alternativePhone) : undefined,
      password: password
    };

    // Check existing user with better conflict detection
    const existingUser = await User.findOne({ 
      $or: [
        { email: sanitizedData.email },
        { phone: sanitizedData.phone },
        ...(sanitizedData.username ? [{ username: sanitizedData.username }] : [])
      ] 
    });
    
    if (existingUser) {
      // Determine which field is causing the conflict
      if (existingUser.email === sanitizedData.email) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered. Please login or use a different email.",
          friendlyMessage: "Looks like you already have an account with this email. Want to login instead?",
          field: 'email',
          action: 'login',
          code: 'EMAIL_EXISTS'
        });
      }
      
      if (existingUser.phone === sanitizedData.phone) {
        return res.status(409).json({
          success: false,
          message: "This phone number is already registered. Please use a different number.",
          friendlyMessage: "This phone number is already in use. Please use a different number or contact support if this is a mistake.",
          field: 'phone',
          code: 'PHONE_EXISTS'
        });
      }
      
      if (sanitizedData.username && existingUser.username === sanitizedData.username) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken. Please choose another.",
          friendlyMessage: "Sorry, that username is already taken. Try adding numbers or underscores to make it unique.",
          field: 'username',
          code: 'USERNAME_EXISTS'
        });
      }
    };

    // Validate password strength
    const passwordValidation = validatePasswordStrength(sanitizedData.password);
    if (!passwordValidation.isValid) {
      // Create user-friendly password requirements message
      const missingRequirements = [];
      if (!passwordValidation.requirements.hasUpperCase) missingRequirements.push("an uppercase letter");
      if (!passwordValidation.requirements.hasLowerCase) missingRequirements.push("a lowercase letter");
      if (!passwordValidation.requirements.hasNumber) missingRequirements.push("a number");
      if (!passwordValidation.requirements.hasSpecialChar) missingRequirements.push("a special character");
      
      const requirementsText = missingRequirements.join(", ");
      
      return res.status(400).json({
        success: false,
        message: `Password needs ${requirementsText}`,
        friendlyMessage: `Your password needs to be stronger. Add ${requirementsText} to make it more secure.`,
        requirements: passwordValidation.requirements,
        strength: passwordValidation.strength,
        code: 'WEAK_PASSWORD'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      sanitizedData.password, 
      SECURITY_CONFIG.PASSWORD_SALT_ROUNDS
    );

    // Generate verification code
    const verificationCode = generateSecureCode();
    const verificationCodeExpiry = Date.now() + SECURITY_CONFIG.VERIFICATION_CODE_EXPIRY;

    console.log("📧 Attempting to send verification email...");

    let emailResult = null;
    let emailError = null;

    // Try to send email
    try {
      emailResult = await sendVerificationEmail(
        sanitizedData.email, 
        verificationCode, 
        sanitizedData.firstName
      );
      
      console.log(`✅ Email attempt result:`, {
        success: emailResult?.success,
        messageId: emailResult?.messageId,
        email: sanitizedData.email
      });
      
    } catch (emailErr) {
      emailError = emailErr;
      console.error(`❌ Email sending failed:`, emailErr.message);
      
      // For development, create a fallback result
      if (process.env.NODE_ENV === 'development') {
        emailResult = {
          success: false,
          message: "Email failed - development mode",
          code: verificationCode,
          fallback: true
        };
        console.log(`📧 [DEV] Using fallback code: ${verificationCode}`);
      }
    }

    // Create user
    const userData = {
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      password: hashedPassword,
      university: sanitizedData.university,
      isVerified: false,
      verificationCode,
      verificationCodeExpiry,
      lastActive: new Date(),
      accountCreated: new Date(),
      lastVerificationRequest: new Date(),
      gender: sanitizedData.gender,
      authMethod: 'email'
    };

    // Add optional fields if provided
    if (sanitizedData.username) userData.username = sanitizedData.username;
    if (sanitizedData.dateOfBirth) userData.dateOfBirth = sanitizedData.dateOfBirth;
    if (sanitizedData.alternativePhone) userData.alternativePhone = sanitizedData.alternativePhone;

    const newUser = await User.create(userData);

    console.log("✅ User created:", sanitizedData.email);

    // Send admin alert asynchronously (don't await)
    try {
      await sendAdminAlert(
        "New User Registration",
        `New user registered: ${sanitizedData.email}\nUniversity: ${sanitizedData.university}\nTime: ${new Date().toISOString()}`
      );
    } catch (adminError) {
      console.error("Admin alert failed:", adminError.message);
      // Don't fail the registration for admin alert failure
    }

    // Prepare response based on email status
    if (emailError && process.env.NODE_ENV === 'production') {
      // In production, email failure needs user action
      return res.status(201).json({
        success: true,
        message: "Account created! We couldn't send the verification email. Please contact support.",
        friendlyMessage: "Your account was created but we had trouble sending the verification email. Don't worry - you can still verify your account by contacting our support team.",
        data: {
          email: newUser.email,
          firstName: newUser.firstName,
          userId: newUser._id,
          nextStep: "contact_support"
        },
        code: 'REGISTRATION_EMAIL_FAILED'
      });
    }

    // Success response with appropriate message
    const successMessage = emailResult?.success 
      ? "Welcome to UniMarket! We've sent a verification code to your email."
      : "Welcome to UniMarket! Use the verification code below to complete your registration.";

    const friendlyMessage = emailResult?.success
      ? "Great! Check your inbox for a 6-digit code. Don't forget to check your spam folder if you don't see it."
      : "Almost there! Use the verification code shown below (development mode only).";

    const response = {
      success: true,
      message: successMessage,
      friendlyMessage: friendlyMessage,
      data: {
        email: newUser.email,
        firstName: newUser.firstName,
        nextStep: "verify_email",
        expiry: verificationCodeExpiry
      },
      code: 'REGISTRATION_SUCCESS'
    };

    // Include code in development or if email failed
    if (process.env.NODE_ENV === 'development' || !emailResult?.success) {
      response.data.verificationCode = verificationCode;
      response.data.emailStatus = emailResult?.success ? "Sent" : "Email failed - using development code";
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB duplicate key errors (just in case)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'email' ? 'email' : field === 'phone' ? 'phone number' : field;
      
      return res.status(409).json({
        success: false,
        message: `This ${fieldName} is already registered`,
        friendlyMessage: `Looks like this ${fieldName} is already in use. Please use a different one or login if this is your account.`,
        field: field,
        code: 'DUPLICATE_ENTRY'
      });
    }
    
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: getFriendlyErrorMessage('validation', err.path, err.message)
      }));
      
      return res.status(400).json({
        success: false,
        message: "Please check your information and try again",
        errors: errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Generic error response (don't leak backend details)
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      friendlyMessage: "We're having technical difficulties. Please try again in a few minutes.",
      code: 'SERVER_ERROR'
    });
  }
};

// Helper function to generate user-friendly error messages
const getFriendlyErrorMessage = (type, field, originalMessage) => {
  const messages = {
    // Validation messages
    'validation': {
      'firstName': "Please enter a valid first name (letters only, 2-50 characters)",
      'lastName': "Please enter a valid last name (letters only, 2-50 characters)",
      'email': "Please enter a valid email address (e.g., name@university.ac.ke)",
      'phone': "Please enter a valid phone number with country code (e.g., +254712345678)",
      'password': "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
      'university': "Please select your university from the list",
      'username': "Username can only contain letters, numbers, and underscores (3-30 characters)",
      'dateOfBirth': "You must be at least 13 years old to register"
    },
    // Duplicate messages
    'duplicate': {
      'email': "This email is already registered. Would you like to login instead?",
      'phone': "This phone number is already in use. Please use a different number.",
      'username': "This username is taken. Try adding numbers or underscores."
    }
  };

  return messages[type]?.[field] || originalMessage || "Please check this field and try again";
};



/** 📧 VERIFY EMAIL */
export const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, code } = req.body;

    // Find user with valid verification code
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationCode: code,
      verificationCodeExpiry: { $gt: Date.now() },
      isVerified: false
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification code",
        code: 'INVALID_CODE',
        suggestions: [
          "Check that you entered the 6-digit code correctly",
          "The code expires after 10 minutes",
          "You can request a new code from the resend page"
        ]
      });
    }

    console.log(`✅ Email verification successful for: ${email}`);

    // Update user verification status
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    user.lastActive = new Date();
    
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user, "access");
    const refreshToken = generateToken(user, "refresh");

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send welcome email asynchronously
    (async () => {
      try {
        console.log(`📧 [ASYNC] Sending welcome email to ${user.email}`);
        const welcomeResult = await sendWelcomeEmail(user.email, user.firstName);
        
        if (welcomeResult.success) {
          console.log(`✅ Welcome email sent to ${user.email}`);
        } else {
          console.warn(`⚠️ Welcome email had issues for ${user.email}:`, welcomeResult.message);
        }
      } catch (welcomeError) {
        console.error(`❌ Welcome email failed for ${user.email}:`, welcomeError.message);
      }
    })();

    return res.json({ 
      success: true,
      message: "🎉 Email verified successfully! Welcome to UniMarket!",
      data: {
        user: sanitizeUser(user),
        tokens: {
          access: accessToken,
          refresh: refreshToken,
          accessExpiresIn: JWT_CONFIG.ACCESS_EXPIRY,
          refreshExpiresIn: JWT_CONFIG.REFRESH_EXPIRY
        },
        csrfToken: crypto.randomBytes(32).toString("hex")
      },
      code: 'VERIFICATION_SUCCESS'
    });

  } catch (error) {
    console.error("Email verification error:", error);
    return handleError(res, error, "Email verification failed");
  }
};

/** 🔑 LOGIN USER */
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip;

    console.log(`🔐 Login attempt for: ${email} from IP: ${ipAddress}`);

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select("+password +loginAttempts +lastLoginAttempt +loginLockoutUntil");
    
    if (!user) {
      console.log(`❌ Login failed: User not found - ${email}`);
      
      // Small random delay to prevent timing attacks
      const randomDelay = Math.floor(Math.random() * 300) + 200;
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password",
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check rate limiting
    try {
      checkRateLimit(user, 'login');
    } catch (rateLimitError) {
      console.log(`🔒 Rate limit triggered for ${email}:`, rateLimitError.message);
      return res.status(429).json({
        success: false,
        message: rateLimitError.message,
        retryAfter: rateLimitError.retryAfter,
        code: rateLimitError.code
      });
    }

    if (!user.isVerified) {
      console.log(`⚠️ Login blocked: Email not verified - ${email}`);
      
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        code: 'EMAIL_NOT_VERIFIED',
        data: { 
          email: user.email,
          nextStep: "verify_email",
          canResend: true
        }
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastLoginAttempt = new Date();
      
      if (user.loginAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        user.loginLockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_TIME;
        console.log(`🔒 Account locked for ${email} after ${user.loginAttempts} failed attempts`);
      }
      
      await user.save();
      
      console.log(`❌ Login failed: Invalid password - ${email} (Attempt ${user.loginAttempts})`);
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password",
        attemptsRemaining: Math.max(0, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - user.loginAttempts),
        code: 'INVALID_CREDENTIALS',
        ...(user.loginLockoutUntil && {
          lockoutUntil: user.loginLockoutUntil,
          lockoutMessage: `Account locked until ${new Date(user.loginLockoutUntil).toLocaleString()}`
        })
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.loginLockoutUntil = undefined;
    user.lastActive = new Date();
    user.lastLogin = new Date();
    user.lastLoginIP = ipAddress;
    await user.save();

    console.log(`✅ Login successful for: ${email}`);

    // Generate tokens
    const accessToken = generateToken(user, "access");
    const refreshToken = generateToken(user, "refresh");

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // ✅ CRITICAL: Send response and IMMEDIATELY return
    const response = res.json({
      success: true,
      message: "Login successful!",
      data: {
        user: sanitizeUser(user),
        tokens: {
          access: accessToken,
          refresh: refreshToken,
          accessExpiresIn: JWT_CONFIG.ACCESS_EXPIRY,
          refreshExpiresIn: JWT_CONFIG.REFRESH_EXPIRY
        },
        csrfToken: crypto.randomBytes(32).toString("hex")
      },
      code: 'LOGIN_SUCCESS'
    });

    // ✅ IMPORTANT: Return to stop function execution
    return response;

  } catch (error) {
    console.error("Login error:", error);
    return handleError(res, error, "Login failed");
  }
  
  // ✅ EXTRA SAFETY: Add a final return to prevent any code after try/catch
  // This line will never be reached, but it ensures nothing else executes
  return;
};
/** 🔄 REFRESH TOKEN */
export const refreshToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { refresh: refreshToken } = req.body;

    console.log(`🔄 Token refresh attempt`);

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
    
    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Find user and validate token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user, "access");
    const newRefreshToken = generateToken(user, "refresh");

    // Update refresh token (token rotation)
    user.refreshToken = newRefreshToken;
    user.lastActive = new Date();
    await user.save();

    console.log(`✅ Token refresh successful for user: ${user.email}`);

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        tokens: {
          access: newAccessToken,
          refresh: newRefreshToken,
          accessExpiresIn: JWT_CONFIG.ACCESS_EXPIRY,
          refreshExpiresIn: JWT_CONFIG.REFRESH_EXPIRY
        },
        csrfToken: crypto.randomBytes(32).toString("hex")
      },
      code: 'TOKEN_REFRESHED'
    });

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error("Token refresh error:", error);
    return handleError(res, error, "Token refresh failed");
  }
};

/** 🚪 LOGOUT */
export const logout = async (req, res) => {
  try {
    const { refresh: refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
        code: 'MISSING_TOKEN'
      });
    }

    console.log(`🚪 Logout attempt`);

    // Invalidate refresh token
    const decoded = jwt.decode(refreshToken);
    if (decoded?.id) {
      await User.findByIdAndUpdate(decoded.id, {
        $unset: { refreshToken: 1 },
        $set: { lastLogout: new Date() }
      });
      console.log(`✅ Logout successful for user ID: ${decoded.id}`);
    } else {
      console.warn(`⚠️ Logout attempted with invalid token format`);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
      code: 'LOGOUT_SUCCESS'
    });

  } catch (error) {
    console.error("Logout error:", error);
    return handleError(res, error, "Logout failed");
  }
};

// ==================== PASSWORD RESET FUNCTIONS ====================

/** 🔐 FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Please check your information and try again",
        friendlyMessage: "Make sure you've entered a valid email address.",
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email } = req.body;
    const ipAddress = req.ip;

    console.log(`🔐 Password reset requested for: ${email} from IP: ${ipAddress}`);

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
        friendlyMessage: "Enter a valid email address to receive your reset code.",
        code: 'INVALID_EMAIL'
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ 
      email: sanitizedEmail,
      isActive: true 
    }).select('+resetPasswordAttempts +lastResetRequest +resetPasswordExpires +resetPasswordCode');

    // For security, always return success even if user doesn't exist
    if (!user) {
      console.log(`ℹ️ Password reset requested for non-existent email: ${sanitizedEmail}`);
      
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      return res.json({ 
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
        friendlyMessage: "Check your email for a 6-digit code. Don't forget to check your spam folder.",
        code: 'RESET_CODE_SENT'
      });
    }

    // Check rate limiting for password reset
    try {
      checkRateLimit(user, 'passwordReset');
    } catch (rateLimitError) {
      console.log(`🔒 Password reset rate limit for ${sanitizedEmail}:`, rateLimitError.message);
      return res.status(429).json({
        success: false,
        message: rateLimitError.message,
        friendlyMessage: `Please wait ${rateLimitError.retryAfter} seconds before requesting another code.`,
        retryAfter: rateLimitError.retryAfter,
        code: rateLimitError.code || 'RATE_LIMITED'
      });
    }

    // Check if last reset code is still valid
    if (user.resetPasswordExpires && Date.now() < user.resetPasswordExpires) {
      const timeRemaining = Math.ceil((user.resetPasswordExpires - Date.now()) / 1000);
      console.log(`⚠️ Reset code already active for ${sanitizedEmail}, expires in ${timeRemaining}s`);
      
      return res.status(429).json({ 
        success: false,
        message: "A reset code is already active. Please check your email.",
        friendlyMessage: `We've already sent a code to your email. It expires in ${Math.ceil(timeRemaining / 60)} minutes.`,
        retryAfter: timeRemaining,
        code: 'RESET_ACTIVE',
        expiry: user.resetPasswordExpires
      });
    }

    // Generate reset code
    const resetCode = generateSecureCode();
    const resetExpiry = Date.now() + (process.env.RESET_CODE_EXPIRY || 10 * 60 * 1000); // 10 minutes default

    console.log(`📧 Generated reset code for ${sanitizedEmail}: ${resetCode}`);

    // Send reset email
    let emailSent = false;
    let emailError = null;

    try {
      const emailResult = await sendPasswordResetEmail(sanitizedEmail, resetCode, user.firstName);
      emailSent = emailResult?.success || false;
      
      if (emailSent) {
        console.log(`✅ Reset email sent successfully to ${sanitizedEmail}`);
      } else {
        console.log(`⚠️ Reset email sending reported failure for ${sanitizedEmail}`);
      }
    } catch (error) {
      emailError = error;
      console.error(`❌ Failed to send reset email to ${sanitizedEmail}:`, error.message);
    }

    // Update user with reset code information
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpiry;
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    user.lastResetRequest = new Date();
    user.lastResetIP = ipAddress;
    user.resetCodeVerified = false; // Reset verification status
    
    await user.save();

    console.log(`✅ Password reset code stored for ${sanitizedEmail}`);

    // Send admin alert asynchronously (don't await)
    (async () => {
      try {
        await sendAdminAlert(
          "Password Reset Request",
          `User: ${sanitizedEmail}\nIP: ${ipAddress}\nTime: ${new Date().toISOString()}\nCode: ${resetCode}\nEmail Sent: ${emailSent}`
        );
      } catch (adminError) {
        console.error("Admin alert failed:", adminError.message);
      }
    })();

    // Handle email sending failure in production
    if (!emailSent && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset code. Please try again or contact support.",
        friendlyMessage: "We're having trouble sending emails right now. Please try again in a few minutes or contact support.",
        code: 'EMAIL_FAILED'
      });
    }

    // Development mode - include code for testing
    const response = {
      success: true,
      message: emailSent 
        ? "If an account exists with this email, a reset code has been sent."
        : "Reset code generated. Check console for code (development mode).",
      friendlyMessage: emailSent
        ? "Check your email for a 6-digit code. Don't forget to check your spam folder."
        : "Development mode: Check the server console for your reset code.",
      code: 'RESET_CODE_SENT'
    };

    // Include code in development mode
    if (process.env.NODE_ENV === 'development') {
      response.devCode = resetCode;
      response.expiry = resetExpiry;
      response.emailSent = emailSent;
      if (emailError) {
        response.emailError = emailError.message;
      }
    }

    return res.json(response);

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    
    // Don't leak internal errors to client
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      friendlyMessage: "We're having technical difficulties. Please try again in a few minutes.",
      code: 'SERVER_ERROR'
    });
  }
};
/** 🔍 VERIFY RESET CODE */
export const verifyResetCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, code } = req.body;

    console.log(`🔍 Verifying reset code for: ${email}`);

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      console.log(`❌ Invalid reset code for ${email}`);
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired reset code",
        code: 'INVALID_RESET_CODE',
        suggestions: [
          "Check that you entered the 6-digit code correctly",
          "Reset codes expire after 10 minutes",
          "You can request a new code if this one has expired"
        ]
      });
    }

    // Mark code as verified
    user.resetCodeVerified = true;
    await user.save();

    console.log(`✅ Reset code verified for ${email}`);

    return res.json({ 
      success: true,
      message: "Reset code verified successfully",
      code: 'RESET_CODE_VERIFIED',
      data: {
        email: user.email,
        canResetPassword: true
      }
    });

  } catch (error) {
    console.error("Verify reset code error:", error);
    return handleError(res, error, "Reset code verification failed");
  }
};

/** 🔄 RESEND RESET CODE */
export const resendResetCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email } = req.body;

    console.log(`🔄 Resend reset code requested for: ${email}`);

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    // Always return success for security
    if (!user) {
      console.log(`ℹ️ Resend requested for non-existent email: ${email}`);
      return res.json({ 
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
        code: 'RESET_CODE_SENT'
      });
    }

    // Check cooldown period
    const timeSinceLastRequest = Date.now() - (user.lastResetRequest || 0);
    if (timeSinceLastRequest < SECURITY_CONFIG.RESEND_COOLDOWN) {
      const timeRemaining = Math.ceil((SECURITY_CONFIG.RESEND_COOLDOWN - timeSinceLastRequest) / 1000);
      console.log(`⏳ Resend too soon for ${email}, wait ${timeRemaining}s`);
      
      return res.status(429).json({ 
        success: false,
        message: "Please wait before requesting another reset code",
        retryAfter: timeRemaining,
        code: 'RATE_LIMITED'
      });
    }

    // Generate new reset code
    const resetCode = generateSecureCode();
    const resetExpiry = Date.now() + SECURITY_CONFIG.RESET_CODE_EXPIRY;

    console.log(`📧 Generated new reset code for ${email}: ${resetCode}`);

    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, resetCode, user.firstName);
    
    if (!emailResult.success && process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] New reset code for ${email}: ${resetCode}`);
    }

    // Update user
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpiry;
    user.resetCodeVerified = false;
    user.lastResetRequest = new Date();
    await user.save();

    console.log(`✅ Reset code resent to ${email}`);

    return res.json({ 
      success: true,
      message: "Reset code sent successfully",
      code: 'RESET_CODE_RESENT',
      ...(process.env.NODE_ENV === 'development' && {
        devNote: "Check console for reset code",
        resetCode: resetCode,
        expiry: resetExpiry
      })
    });

  } catch (error) {
    console.error("Resend reset code error:", error);
    return handleError(res, error, "Failed to resend reset code");
  }
};

/** 🔑 RESET PASSWORD */
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, code, newPassword } = req.body;

    console.log(`🔑 Password reset attempt for: ${email}`);

    // ✅ FIX: Add .select('+password') to include the password field
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true
    }).select('+password');  // 👈 THIS IS THE KEY FIX

    if (!user) {
      console.log(`❌ Invalid reset code for ${email}`);
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired reset code",
        code: 'INVALID_RESET_CODE'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      console.log(`❌ Weak password for ${email}`);
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        requirements: passwordValidation.requirements,
        strength: passwordValidation.strength,
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if new password is same as old password
    // This will now work because user.password is defined
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      console.log(`❌ New password same as old for ${email}`);
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as old password",
        code: 'SAME_PASSWORD'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SECURITY_CONFIG.PASSWORD_SALT_ROUNDS);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.resetCodeVerified = undefined;
    user.resetPasswordAttempts = 0;
    user.lastActive = new Date();
    user.passwordChangedAt = new Date();
    
    await user.save();

 
    // Send admin alert for security
    (async () => {
      try {
        await sendAdminAlert(
          "Password Reset Completed",
          `User: ${email}\nTime: ${new Date().toISOString()}\nPassword changed successfully`
        );
      } catch (adminError) {
        console.error("Admin alert failed:", adminError.message);
      }
    })();

    return res.json({ 
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
      code: 'PASSWORD_RESET_SUCCESS',
      data: {
        email: user.email,
        nextStep: "login"
      }
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return handleError(res, error, "Failed to reset password");
  }
};




// ==================== USER PROFILE FUNCTIONS ====================

/** 👤 GET CURRENT USER */
export const getMe = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    return res.json({ 
      success: true,
      data: {
        user: sanitizeUser(user)
      },
      code: 'USER_FETCHED'
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return handleError(res, error, "Failed to fetch user profile");
  }
};


// ==================== EXPORTS ====================


export const testEmailConnection = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    console.log("=== EMAIL SERVICE TEST ===");
    console.log("📧 Test email:", email);
    console.log("📧 Environment:", process.env.NODE_ENV);
    console.log("📧 SMTP Config:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER?.substring(0, 10) + '...',
      from: process.env.EMAIL_FROM,
      hasPass: !!process.env.EMAIL_PASS
    });

    // Test 1: Direct SMTP test
    console.log("\n🔧 Testing SMTP connection directly...");
    const nodemailer = await import('nodemailer');
    
    const directTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000
    });

    let smtpTestResult = null;
    try {
      await directTransporter.verify();
      smtpTestResult = { success: true, message: "SMTP Connection Verified" };
      console.log("✅ Direct SMTP test: SUCCESS");
    } catch (smtpError) {
      smtpTestResult = { 
        success: false, 
        message: smtpError.message,
        code: smtpError.code,
        response: smtpError.response
      };
      console.log("❌ Direct SMTP test: FAILED", smtpError.message);
    }

    // Test 2: Using your email service
    console.log("\n🔧 Testing via emailService.js...");
    let serviceTestResult = null;
    try {
      const testCode = "123456";
      serviceTestResult = await sendVerificationEmail(email, testCode, "Test User");
      console.log("✅ Email service test: SUCCESS", { messageId: serviceTestResult?.messageId });
    } catch (serviceError) {
      serviceTestResult = { 
        success: false, 
        message: serviceError.message,
        stack: serviceError.stack
      };
      console.log("❌ Email service test: FAILED", serviceError.message);
    }

    // Test 3: Simple test email
    console.log("\n🔧 Sending simple test email...");
    let simpleTestResult = null;
    try {
      const simpleTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const info = await simpleTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'UniMarket Email Test',
        text: `This is a test email sent at ${new Date().toISOString()}`,
        html: `<p>This is a test email sent at ${new Date().toISOString()}</p>`
      });

      simpleTestResult = { 
        success: true, 
        messageId: info.messageId,
        response: info.response 
      };
      console.log("✅ Simple test email: SENT", info.messageId);
    } catch (simpleError) {
      simpleTestResult = { 
        success: false, 
        message: simpleError.message,
        command: simpleError.command,
        responseCode: simpleError.responseCode
      };
      console.log("❌ Simple test email: FAILED", simpleError.message);
    }

    console.log("=== EMAIL TEST COMPLETE ===");

    res.json({
      success: true,
      message: "Email tests completed",
      tests: {
        smtpConnection: smtpTestResult,
        emailService: serviceTestResult,
        simpleEmail: simpleTestResult
      },
      environment: process.env.NODE_ENV,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER?.substring(0, 10) + '...',
        from: process.env.EMAIL_FROM
      }
    });

  } catch (error) {
    console.error("Email test error:", error);
    res.status(500).json({
      success: false,
      message: "Email test failed",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;

    // Validate username format
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
        code: 'USERNAME_REQUIRED'
      });
    }

    // Check username format (alphanumeric and underscore only, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters and can only contain letters, numbers, and underscores",
        code: 'INVALID_USERNAME_FORMAT'
      });
    }

    // Check if username is already taken (case insensitive)
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    });

    return res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? "Username is already taken" : "Username is available",
      code: existingUser ? 'USERNAME_TAKEN' : 'USERNAME_AVAILABLE'
    });

  } catch (error) {
    console.error("Username check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check username availability",
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Bulk check multiple usernames (for admin features)
 * POST /api/auth/check-usernames-bulk
 */
export const bulkCheckUsernames = async (req, res) => {
  try {
    const { usernames } = req.body;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of usernames",
        code: 'INVALID_INPUT'
      });
    }

    // Validate each username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    const validUsernames = [];
    const invalidUsernames = [];

    usernames.forEach(username => {
      if (usernameRegex.test(username)) {
        validUsernames.push(username.toLowerCase());
      } else {
        invalidUsernames.push(username);
      }
    });

    // Check availability for valid usernames
    const existingUsers = await User.find({
      username: { $in: validUsernames }
    }).select('username');

    const takenUsernames = existingUsers.map(user => user.username);
    const availableUsernames = validUsernames.filter(
      username => !takenUsernames.includes(username)
    );

    return res.json({
      success: true,
      results: {
        available: availableUsernames,
        taken: takenUsernames,
        invalid: invalidUsernames
      },
      summary: {
        total: usernames.length,
        available: availableUsernames.length,
        taken: takenUsernames.length,
        invalid: invalidUsernames.length
      },
      code: 'BULK_CHECK_COMPLETE'
    });

  } catch (error) {
    console.error("Bulk username check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check usernames",
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Get username suggestions based on a base username
 * GET /api/auth/username-suggestions?base=john
 */
export const getUsernameSuggestions = async (req, res) => {
  try {
    const { base } = req.query;

    if (!base || base.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Base username must be at least 2 characters",
        code: 'INVALID_BASE'
      });
    }

    // Clean the base username
    const cleanBase = base.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    
    if (cleanBase.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Base username must contain at least 2 valid characters",
        code: 'INVALID_BASE'
      });
    }

    // Generate suggestions
    const suggestions = [];
    const numbers = [1, 2, 3, 123, 2024, new Date().getFullYear()];
    const prefixes = ['', 'the', 'real', 'official'];
    const suffixes = ['', '_ke', '_254', '_student', '_uni'];

    // Generate combinations
    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        for (const num of numbers) {
          let suggestion;
          
          if (prefix) {
            suggestion = `${prefix}_${cleanBase}${suffix}${num}`;
          } else {
            suggestion = `${cleanBase}${suffix}${num}`;
          }
          
          // Trim to max 30 chars
          if (suggestion.length > 30) {
            suggestion = suggestion.substring(0, 30);
          }
          
          // Validate format
          if (/^[a-zA-Z0-9_]{3,30}$/.test(suggestion)) {
            suggestions.push(suggestion);
          }
        }
      }
    }

    // Remove duplicates
    const uniqueSuggestions = [...new Set(suggestions)];

    // Check which suggestions are available
    const existingUsers = await User.find({
      username: { $in: uniqueSuggestions }
    }).select('username');

    const takenUsernames = new Set(existingUsers.map(user => user.username));
    
    const availableSuggestions = uniqueSuggestions
      .filter(username => !takenUsernames.has(username))
      .slice(0, 10); // Return top 10 available suggestions

    return res.json({
      success: true,
      base: cleanBase,
      suggestions: availableSuggestions,
      count: availableSuggestions.length,
      code: 'SUGGESTIONS_GENERATED'
    });

  } catch (error) {
    console.error("Username suggestions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate username suggestions",
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};