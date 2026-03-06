// routes/profileRoutes.js - FIXED VERSION
import express from "express";
import { validate, schemas } from "../middleware/validate.js";
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  getProfile, 
  updateProfile, 
  updatePreferences,
  changePassword,
  uploadAvatar,
  getSessions,
  terminateSession,
  terminateAllSessions,
  deleteAccount,
  getActivityLog,
  updatePrivacySettings,
  getProfileByUsername,
  updateSocialLinks,
  updateLocation,
  updateInterests
} from "../controllers/profileController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== FILE UPLOAD CONFIGURATION ====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for cloud upload or disk storage

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ==================== JOI VALIDATION SCHEMAS ====================

// Profile update schema
const profileUpdateSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s-']+$/)
    .messages({
      'string.pattern.base': 'First name contains invalid characters',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s-']+$/)
    .messages({
      'string.pattern.base': 'Last name contains invalid characters',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  displayName: Joi.string()
    .max(50)
    .allow('', null),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]{10,}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number (+254 XXX XXX XXX)'
    })
    .allow('', null),
  
  alternativePhone: Joi.string()
    .pattern(/^\+?[\d\s-()]{10,}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    })
    .allow('', null),
  
  university: Joi.string()
    .max(100)
    .allow('', null),
  
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    })
    .lowercase()
    .allow('', null),
  
  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    })
    .allow(null),
  
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer not to say')
    .default('prefer not to say'),
  
  bio: Joi.string()
    .max(500)
    .allow('', null),
  
  location: Joi.object({
    city: Joi.string().max(100).allow('', null),
    country: Joi.string().max(100).allow('', null)
  }).optional(),
  
  socialLinks: Joi.object({
    github: Joi.string().uri().allow('', null),
    twitter: Joi.string().uri().allow('', null),
    linkedin: Joi.string().uri().allow('', null),
    instagram: Joi.string().uri().allow('', null)
  }).optional(),
  
  interests: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Location update schema
const locationUpdateSchema = Joi.object({
  city: Joi.string().max(100).allow('', null),
  country: Joi.string().max(100).allow('', null)
}).min(1).messages({
  'object.min': 'At least one location field must be provided'
});

// Social links update schema
const socialLinksUpdateSchema = Joi.object({
  github: Joi.string().uri().allow('', null),
  twitter: Joi.string().uri().allow('', null),
  linkedin: Joi.string().uri().allow('', null),
  instagram: Joi.string().uri().allow('', null)
}).min(1).messages({
  'object.min': 'At least one social link must be provided'
});

// Interests update schema
const interestsUpdateSchema = Joi.object({
  interests: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .required()
    .messages({
      'array.max': 'Cannot have more than 20 interests',
      'any.required': 'Interests array is required'
    })
});

// Preferences update schema
const preferencesUpdateSchema = Joi.object({
  emailNotifications: Joi.boolean(),
  pushNotifications: Joi.boolean(),
  twoFactorEnabled: Joi.boolean(),
  theme: Joi.string().valid('light', 'dark', 'auto')
}).min(1).messages({
  'object.min': 'At least one preference must be provided'
});

// Privacy settings update schema
const privacyUpdateSchema = Joi.object({
  profileVisibility: Joi.string().valid('public', 'students', 'private'),
  showEmail: Joi.boolean(),
  showPhone: Joi.boolean(),
  showUniversity: Joi.boolean(),
  showWishlist: Joi.boolean(),
  showReviews: Joi.boolean(),
  showListings: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one privacy setting must be provided'
});

// Password change schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

// 🔥 FIXED: Avatar update schema - make it optional or remove validation for file uploads
const avatarUpdateSchema = Joi.object({
  avatar: Joi.any().optional() // Allow any for file uploads
});

// Session ID params schema
const sessionIdParamsSchema = Joi.object({
  sessionId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid session ID format',
    'string.length': 'Invalid session ID length',
    'any.required': 'Session ID is required'
  })
});

// Username params schema
const usernameParamsSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  })
});

// Account deletion schema
const accountDeletionSchema = Joi.object({
  password: Joi.string().when('$hasPassword', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Password is required to delete account'
  }),
  confirmDelete: Joi.string().valid('DELETE').required().messages({
    'any.only': 'Please type DELETE to confirm',
    'any.required': 'Please type DELETE to confirm'
  })
});

// ==================== ROUTES ====================

// 🔐 All routes below require authentication
router.use(protect);

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/", getProfile);

/**
 * @route   GET /api/profile/username/:username
 * @desc    Get profile by username (public)
 * @access  Public
 */
router.get("/username/:username", 
  validate(usernameParamsSchema, 'params'), 
  getProfileByUsername
);

/**
 * @route   PUT /api/profile
 * @desc    Update profile
 * @access  Private
 */
router.put("/", 
  validate(profileUpdateSchema), 
  updateProfile
);

/**
 * @route   PUT /api/profile/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put("/preferences", 
  validate(preferencesUpdateSchema), 
  updatePreferences
);

/**
 * @route   PUT /api/profile/privacy
 * @desc    Update privacy settings
 * @access  Private
 */
router.put("/privacy", 
  validate(privacyUpdateSchema), 
  updatePrivacySettings
);

/**
 * @route   PUT /api/profile/location
 * @desc    Update location
 * @access  Private
 */
router.put("/location", 
  validate(locationUpdateSchema), 
  updateLocation
);

/**
 * @route   PUT /api/profile/social
 * @desc    Update social links
 * @access  Private
 */
router.put("/social", 
  validate(socialLinksUpdateSchema), 
  updateSocialLinks
);

/**
 * @route   PUT /api/profile/interests
 * @desc    Update interests
 * @access  Private
 */
router.put("/interests", 
  validate(interestsUpdateSchema), 
  updateInterests
);

/**
 * @route   POST /api/profile/change-password
 * @desc    Change password
 * @access  Private
 */
router.post("/change-password", 
  validate(passwordChangeSchema), 
  changePassword
);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload avatar
 * @access  Private
 * @note    This route does NOT use validation because it's multipart/form-data
 */
router.post("/avatar", 
  upload.single('avatar'), // Handle file upload
  uploadAvatar
);



// ==================== SESSION MANAGEMENT ====================

/**
 * @route   GET /api/profile/sessions
 * @desc    Get all active sessions
 * @access  Private
 */
router.get("/sessions", getSessions);

/**
 * @route   DELETE /api/profile/sessions/:sessionId
 * @desc    Terminate specific session
 * @access  Private
 */
router.delete("/sessions/:sessionId", 
  validate(sessionIdParamsSchema, 'params'), 
  terminateSession
);

/**
 * @route   POST /api/profile/sessions/terminate-all
 * @desc    Terminate all sessions
 * @access  Private
 */
router.post("/sessions/terminate-all", terminateAllSessions);

// ==================== ACTIVITY ====================

/**
 * @route   GET /api/profile/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get("/activity", getActivityLog);

// ==================== DANGER ZONE ====================

/**
 * @route   DELETE /api/profile/account
 * @desc    Delete account
 * @access  Private
 */
router.delete("/account", 
  validate(accountDeletionSchema), 
  deleteAccount
);

export default router;