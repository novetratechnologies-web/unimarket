// controllers/profileController.js - FIXED to use upload utility
import User from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  uploadToCloudinary, 
  ALLOWED_IMAGE_TYPES, 
  FILE_SIZE_LIMITS 
} from "../utils/upload.js";

// ==================== HELPER FUNCTIONS ====================

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
    csrfTokens,
    validRefreshTokens,
    ...safeUser 
  } = userObj;
  return safeUser;
};

const handleError = (res, error, message = "Server error", status = 500) => {
  console.error(`❌ ${message}:`, error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      })),
      code: 'VALIDATION_ERROR'
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: `${field.toUpperCase()}_EXISTS`
    });
  }

  res.status(status).json({
    success: false,
    message: message,
    code: 'SERVER_ERROR'
  });
};

// ==================== PROFILE CONTROLLERS ====================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -verificationCode -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens')
      .lean(); // Use lean() for better performance
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Ensure all fields exist
    const enhancedUser = {
      ...user,
      username: user.username || null,
      gender: user.gender || 'prefer not to say',
      bio: user.bio || null,
      dateOfBirth: user.dateOfBirth || null,
      alternativePhone: user.alternativePhone || null,
      location: user.location || { city: null, country: null },
      socialLinks: user.socialLinks || {
        github: null,
        twitter: null,
        linkedin: null,
        instagram: null
      },
      interests: user.interests || []
    };

    res.json({
      success: true,
      user: sanitizeUser(enhancedUser),
      code: 'PROFILE_FETCHED'
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch profile");
  }
};

/** GET /api/profile/username/:username - Get profile by username (public) */
export const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('firstName lastName displayName avatar university bio location interests username')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user,
      code: 'PROFILE_FETCHED'
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch profile");
  }
};

/** PUT /api/profile - Update profile */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const {
      firstName,
      lastName,
      displayName,
      phone,
      alternativePhone,
      university,
      username,
      dateOfBirth,
      gender,
      bio,
      location,
      socialLinks,
      interests
    } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if field exists in req.body using hasOwnProperty
    if (req.body.hasOwnProperty('firstName')) {
      user.firstName = firstName?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('lastName')) {
      user.lastName = lastName?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('displayName')) {
      user.displayName = displayName?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('phone')) {
      user.phone = phone?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('alternativePhone')) {
      user.alternativePhone = alternativePhone?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('university')) {
      user.university = university?.trim() || null;
    }
    
    if (req.body.hasOwnProperty('username')) {
      if (username && username.trim()) {
        const existingUser = await User.findOne({ 
          username: username.toLowerCase().trim(),
          _id: { $ne: user._id }
        });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Username already taken",
            code: 'USERNAME_EXISTS'
          });
        }
        user.username = username.toLowerCase().trim();
      } else {
        user.username = null;
      }
    }
    
    if (req.body.hasOwnProperty('dateOfBirth')) {
      user.dateOfBirth = dateOfBirth || null;
    }
    
    if (req.body.hasOwnProperty('gender')) {
      user.gender = gender || 'prefer not to say';
    }
    
    if (req.body.hasOwnProperty('bio')) {
      user.bio = bio || null;
    }
    
    if (req.body.hasOwnProperty('location')) {
      if (!user.location) user.location = {};
      if (location && typeof location === 'object') {
        if (location.hasOwnProperty('city')) {
          user.location.city = location.city || null;
        }
        if (location.hasOwnProperty('country')) {
          user.location.country = location.country || null;
        }
      } else {
        user.location.city = null;
        user.location.country = null;
      }
    }
    
    if (req.body.hasOwnProperty('socialLinks')) {
      if (!user.socialLinks) user.socialLinks = {};
      if (socialLinks && typeof socialLinks === 'object') {
        if (socialLinks.hasOwnProperty('github')) {
          user.socialLinks.github = socialLinks.github || null;
        }
        if (socialLinks.hasOwnProperty('twitter')) {
          user.socialLinks.twitter = socialLinks.twitter || null;
        }
        if (socialLinks.hasOwnProperty('linkedin')) {
          user.socialLinks.linkedin = socialLinks.linkedin || null;
        }
        if (socialLinks.hasOwnProperty('instagram')) {
          user.socialLinks.instagram = socialLinks.instagram || null;
        }
      }
    }
    
    if (req.body.hasOwnProperty('interests')) {
      user.interests = interests || [];
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
    handleError(res, error, "Failed to update profile");
  }
};

/** PUT /api/profile/preferences - Update user preferences */
export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: user.preferences,
      code: 'PREFERENCES_UPDATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to update preferences");
  }
};

/** PUT /api/profile/location - Update user location */
export const updateLocation = async (req, res) => {
  try {
    const { city, country } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.location) user.location = {};
    
    if (req.body.hasOwnProperty('city')) {
      user.location.city = city || null;
    }
    if (req.body.hasOwnProperty('country')) {
      user.location.country = country || null;
    }
    
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      location: user.location,
      code: 'LOCATION_UPDATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to update location");
  }
};

/** PUT /api/profile/social - Update social links */
export const updateSocialLinks = async (req, res) => {
  try {
    const { github, twitter, linkedin, instagram } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.socialLinks) user.socialLinks = {};
    
    if (req.body.hasOwnProperty('github')) {
      user.socialLinks.github = github || null;
    }
    if (req.body.hasOwnProperty('twitter')) {
      user.socialLinks.twitter = twitter || null;
    }
    if (req.body.hasOwnProperty('linkedin')) {
      user.socialLinks.linkedin = linkedin || null;
    }
    if (req.body.hasOwnProperty('instagram')) {
      user.socialLinks.instagram = instagram || null;
    }
    
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Social links updated successfully",
      socialLinks: user.socialLinks,
      code: 'SOCIAL_LINKS_UPDATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to update social links");
  }
};

/** PUT /api/profile/interests - Update user interests */
export const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    user.interests = interests || [];
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Interests updated successfully",
      interests: user.interests,
      code: 'INTERESTS_UPDATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to update interests");
  }
};

/** POST /api/profile/change-password - Change password */
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google OAuth. Set a password via Google settings.",
        code: 'OAUTH_ACCOUNT'
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

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.lastActive = new Date();
    user.validRefreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
      code: 'PASSWORD_CHANGED'
    });
  } catch (error) {
    handleError(res, error, "Failed to change password");
  }
};

/** 🔥 FIXED: POST /api/profile/avatar - Upload avatar using upload utility */
export const uploadAvatar = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
        code: 'NO_FILE_UPLOADED'
      });
    }

    console.log('📸 File uploaded:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Validate file type using the utility constants
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP)",
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Validate file size using the utility constants
    if (req.file.size > FILE_SIZE_LIMITS.image) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${FILE_SIZE_LIMITS.image / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Upload to Cloudinary using the utility function
    console.log('☁️ Uploading to Cloudinary...');
    
    // Add timeout to Cloudinary upload
    const uploadPromise = uploadToCloudinary(req.file, 'unimarket/avatars', {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:best' }
      ]
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloudinary upload timeout')), 30000);
    });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    
    console.log('✅ Cloudinary upload successful:', {
      url: result.url,
      public_id: result.public_id
    });

    // Update user with new avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: result.url } },
      { new: true }
    ).select('avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ Avatar updated successfully for user:', req.user.id);

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
      code: 'AVATAR_UPDATED'
    });
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    
    if (error.message === 'Cloudinary upload timeout') {
      return res.status(504).json({
        success: false,
        message: "Upload timeout. Please try again with a smaller image.",
        code: 'UPLOAD_TIMEOUT'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar",
      code: 'AVATAR_UPLOAD_FAILED'
    });
  }
};

/** GET /api/profile/sessions - Get all active sessions */
export const getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('validRefreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    const sessions = user.validRefreshTokens || [];
    
    res.json({
      success: true,
      sessions,
      currentSession: req.headers['user-agent'],
      code: 'SESSIONS_FETCHED'
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch sessions");
  }
};

/** DELETE /api/profile/sessions/:sessionId - Terminate specific session */
export const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    user.validRefreshTokens = user.validRefreshTokens.filter(
      token => token._id.toString() !== sessionId
    );
    
    await user.save();

    res.json({
      success: true,
      message: "Session terminated successfully",
      code: 'SESSION_TERMINATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to terminate session");
  }
};

/** POST /api/profile/sessions/terminate-all - Terminate all sessions */
export const terminateAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    user.validRefreshTokens = [];
    user.refreshToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: "All sessions terminated successfully",
      code: 'ALL_SESSIONS_TERMINATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to terminate sessions");
  }
};

/** GET /api/profile/activity - Get user activity log */
export const getActivityLog = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('loginHistory lastActive lastLogin lastLoginIP');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      activity: {
        loginHistory: user.loginHistory || [],
        lastActive: user.lastActive,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP
      },
      code: 'ACTIVITY_FETCHED'
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch activity");
  }
};

/** PUT /api/profile/privacy - Update privacy settings */
export const updatePrivacySettings = async (req, res) => {
  try {
    const {
      profileVisibility,
      showEmail,
      showPhone,
      showUniversity,
      showWishlist,
      showReviews,
      showListings
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.preferences) user.preferences = {};
    if (!user.preferences.privacy) user.preferences.privacy = {};
    
    const privacy = user.preferences.privacy;
    
    if (profileVisibility !== undefined) privacy.profileVisibility = profileVisibility;
    if (showEmail !== undefined) privacy.showEmail = showEmail;
    if (showPhone !== undefined) privacy.showPhone = showPhone;
    if (showUniversity !== undefined) privacy.showUniversity = showUniversity;
    if (showWishlist !== undefined) privacy.showWishlist = showWishlist;
    if (showReviews !== undefined) privacy.showReviews = showReviews;
    if (showListings !== undefined) privacy.showListings = showListings;
    
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
      privacy: user.preferences.privacy,
      code: 'PRIVACY_UPDATED'
    });
  } catch (error) {
    handleError(res, error, "Failed to update privacy settings");
  }
};

/** DELETE /api/profile/account - Delete account */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Password is incorrect",
          code: 'INVALID_PASSWORD'
        });
      }
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
      code: 'ACCOUNT_DELETED'
    });
  } catch (error) {
    handleError(res, error, "Failed to delete account");
  }
};

/** POST /api/profile/complete-google - Complete Google profile after OAuth */
export const completeGoogleProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const { firstName, lastName, phone, university, tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({
        success: false,
        message: "Temporary token is required",
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for Google OAuth users",
        code: 'NOT_GOOGLE_USER'
      });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();
    if (university) user.university = university.trim();
    user.profileCompleted = true;
    
    await user.save();

    const accessToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        type: "access"
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    const refreshToken = jwt.sign(
      { 
        id: user._id, 
        type: "refresh"
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: "Profile completed successfully!",
      user: sanitizeUser(user),
      tokens: {
        access: accessToken,
        refresh: refreshToken
      },
      code: 'PROFILE_COMPLETED'
    });

  } catch (error) {
    console.error("Complete Google profile error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
        code: 'TOKEN_EXPIRED'
      });
    }

    handleError(res, error, "Profile completion failed");
  }
};