// models/User.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFO ====================
    firstName: {
      type: String,
      required: function() {
        return !this.googleId; // Only required for non-Google users
      },
      trim: true,
      maxlength: 50,
      match: [/^[a-zA-Z\s-']+$/, "First name contains invalid characters"]
    },
    lastName: {
      type: String,
      required: function() {
        return !this.googleId; // Only required for non-Google users
      },
      trim: true,
      maxlength: 50,
      match: [/^[a-zA-Z\s-']+$/, "Last name contains invalid characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email format"],
      index: true
    },
    phone: {
      type: String,
      required: function() {
        return !this.googleId; // Only required for non-Google users
      },
      trim: true,
      validate: {
        validator: function(v) {
          if (this.googleId) return true; // Skip for Google users
          if (!v) return false; // Required for non-Google
          return /^\+?[\d\s-()]{10,}$/.test(v);
        },
        message: "Please provide a valid phone number (+XXX XXX XXX XXX)"
      },
      default: null
    },
    
    alternativePhone: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^\+?[\d\s-()]{10,}$/.test(v);
        },
        message: "Please provide a valid phone number (+XXX XXX XXX XXX)"
      }
    },
    
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
    },
    
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null
    },
    
    dateOfBirth: {
      type: Date,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          // Must be at least 13 years old and not in the future
          const today = new Date();
          const birthDate = new Date(v);
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 >= 13;
          }
          return age >= 13 && birthDate <= today;
        },
        message: "You must be at least 13 years old"
      }
    },
    
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say'],
      default: 'prefer not to say'
    },

    university: {
      type: String,
      required: function() {
        return !this.googleId; // Only required for non-Google users
      },
      trim: true,
      maxlength: 100,
      default: null
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null
    },

    // ==================== LOCATION ====================
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null
      },
      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null
      }
    },

    // ==================== SOCIAL LINKS ====================
    socialLinks: {
      github: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return validator.isURL(v);
          },
          message: "Invalid GitHub URL"
        },
        default: null
      },
      twitter: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return validator.isURL(v);
          },
          message: "Invalid Twitter URL"
        },
        default: null
      },
      linkedin: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return validator.isURL(v);
          },
          message: "Invalid LinkedIn URL"
        },
        default: null
      },
      instagram: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return validator.isURL(v);
          },
          message: "Invalid Instagram URL"
        },
        default: null
      }
    },

    // ==================== INTERESTS ====================
    interests: [{
      type: String,
      trim: true,
      maxlength: 50
    }],

    // ==================== AUTHENTICATION ====================
    password: {
      type: String,
      select: false, // Never return in queries
      validate: {
        validator: function(v) {
          // Skip validation for Google OAuth users
          if (this.googleId || !v) return true;
          // Validate only for email/password users
          return v.length >= 8;
        },
        message: "Password must be at least 8 characters"
      }
    },
    authMethod: {
      type: String,
      enum: ["email", "google"],
      default: "email",
      index: true
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },

    // ==================== SECURITY FIELDS ====================
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verificationCode: {
      type: String,
      select: false,
      default: null
    },
    verificationCodeExpiry: {
      type: Date,
      select: false,
      default: null
    },
    lastVerificationRequest: {
      type: Date,
      select: false,
      default: null
    },
    
    // Reset password fields
    resetPasswordCode: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null
    },
    resetCodeVerified: {
      type: Boolean,
      select: false,
      default: false
    },
    resetPasswordAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lastResetRequest: {
      type: Date,
      select: false,
      default: null
    },
    lastResetIP: {
      type: String,
      select: false
    },
    
    // Login security
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    loginLockoutUntil: {
      type: Date,
      select: false,
      default: null
    },
    lastLoginAttempt: {
      type: Date,
      select: false,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      select: false,
      default: null
    },

    // ==================== TOKENS & SESSIONS ====================
    refreshToken: {
      type: String,
      select: false
    },
    validRefreshTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date,
      deviceInfo: String,
      ipAddress: String
    }],
    csrfTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }],

    // ==================== PROFILE & ACTIVITY ====================
    avatar: {
      type: String,
      default: ""
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    accountCreated: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date,
      default: null
    },
    lastLoginIP: {
      type: String,
      select: false
    },
    lastLogout: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    
    // ==================== PREFERENCES ====================
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto"
      },
      // Privacy settings
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'students', 'private'],
          default: 'public'
        },
        showEmail: {
          type: Boolean,
          default: false
        },
        showPhone: {
          type: Boolean,
          default: false
        },
        showUniversity: {
          type: Boolean,
          default: true
        },
        showWishlist: {
          type: Boolean,
          default: false
        },
        showReviews: {
          type: Boolean,
          default: true
        },
        showListings: {
          type: Boolean,
          default: true
        }
      }
    },

    // ==================== METADATA ====================
    deviceHistory: [{
      deviceId: String,
      userAgent: String,
      ipAddress: String,
      lastUsed: Date,
      location: String
    }],
    loginHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      successful: Boolean,
      location: String
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== VIRTUAL PROPERTIES ====================

userSchema.virtual("fullName").get(function() {
  if (this.googleId && !this.firstName) {
    return this.displayName || this.email.split('@')[0];
  }
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual("isPasswordSet").get(function() {
  return !!this.password;
});

userSchema.virtual("needsProfileCompletion").get(function() {
  return !this.profileCompleted && (this.googleId && (!this.phone || !this.university));
});

userSchema.virtual("accountStatus").get(function() {
  if (!this.isActive) return "suspended";
  if (!this.isVerified) return "unverified";
  if (this.loginLockoutUntil && this.loginLockoutUntil > new Date()) return "locked";
  if (this.needsProfileCompletion) return "incomplete";
  return "active";
});

userSchema.virtual("age").get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual("locationString").get(function() {
  if (this.location?.city && this.location?.country) {
    return `${this.location.city}, ${this.location.country}`;
  }
  if (this.location?.city) return this.location.city;
  if (this.location?.country) return this.location.country;
  return null;
});

// ==================== MIDDLEWARE ====================

// Update lastActive before findOneAndUpdate
userSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate();
  if (update && !update.$set) {
    this.setUpdate({ $set: { ...update, lastActive: new Date() } });
  } else if (update && update.$set) {
    update.$set.lastActive = new Date();
  }
  next();
});

// // Hash password before saving
// userSchema.pre("save", async function(next) {
//   if (!this.isModified("password") || !this.password) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// ==================== INSTANCE METHODS ====================

/** 🔐 Compare passwords */
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (this.authMethod === "google" || this.googleId || !this.password) {
    return false;
  }
  
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

/** 🔐 Check if password was changed after token was issued */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/** 🔐 Check if account is locked */
userSchema.methods.isLocked = function() {
  return this.loginLockoutUntil && this.loginLockoutUntil > new Date();
};

/** 🔐 Increment login attempts */
userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  this.lastLoginAttempt = new Date();
  
  if (this.loginAttempts >= 5) {
    this.loginLockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await this.save();
};

/** 🔐 Reset login attempts */
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.loginLockoutUntil = null;
  await this.save();
};

/** 🔐 Add valid refresh token */
userSchema.methods.addRefreshToken = async function(token, deviceInfo = "", ipAddress = "") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  if (this.validRefreshTokens.length >= 5) {
    this.validRefreshTokens.shift();
  }
  
  this.validRefreshTokens.push({
    token,
    createdAt: new Date(),
    expiresAt,
    deviceInfo,
    ipAddress
  });
  
  await this.save();
};

/** 🔐 Remove refresh token */
userSchema.methods.removeRefreshToken = async function(token) {
  this.validRefreshTokens = this.validRefreshTokens.filter(t => t.token !== token);
  await this.save();
};

/** 🔐 Add CSRF token */
userSchema.methods.addCSRFToken = async function(token) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  if (this.csrfTokens.length >= 10) {
    this.csrfTokens.shift();
  }
  
  this.csrfTokens.push({
    token,
    createdAt: new Date(),
    expiresAt
  });
  
  await this.save();
};

/** 🔐 Validate CSRF token */
userSchema.methods.isValidCSRFToken = function(token) {
  const now = new Date();
  const validToken = this.csrfTokens.find(t => 
    t.token === token && t.expiresAt > now
  );
  
  if (validToken) {
    this.csrfTokens = this.csrfTokens.filter(t => t.expiresAt > now);
  }
  
  return !!validToken;
};

/** 🔐 Add login history */
userSchema.methods.addLoginHistory = async function(ipAddress, userAgent, successful, location = "") {
  if (this.loginHistory.length >= 20) {
    this.loginHistory.shift();
  }
  
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    successful,
    location
  });
  
  await this.save();
};

/** 🔐 Update profile with new fields */
userSchema.methods.updateProfile = async function(profileData) {
  const { 
    firstName, lastName, displayName, phone, alternativePhone, 
    username, dateOfBirth, gender, university, bio, avatar,
    location, socialLinks, interests
  } = profileData;
  
  if (firstName) this.firstName = firstName;
  if (lastName) this.lastName = lastName;
  if (displayName !== undefined) this.displayName = displayName;
  if (phone) this.phone = phone;
  if (alternativePhone !== undefined) this.alternativePhone = alternativePhone;
  if (username) this.username = username;
  if (dateOfBirth) this.dateOfBirth = dateOfBirth;
  if (gender) this.gender = gender;
  if (university) this.university = university;
  if (bio !== undefined) this.bio = bio;
  if (avatar) this.avatar = avatar;
  
  if (location) {
    if (!this.location) this.location = {};
    if (location.city !== undefined) this.location.city = location.city;
    if (location.country !== undefined) this.location.country = location.country;
  }
  
  if (socialLinks) {
    if (!this.socialLinks) this.socialLinks = {};
    Object.assign(this.socialLinks, socialLinks);
  }
  
  if (interests) this.interests = interests;
  
  if (this.firstName && this.lastName && this.phone && this.university) {
    this.profileCompleted = true;
  }
  
  this.lastActive = new Date();
  await this.save();
  return this;
};

// ==================== STATIC METHODS ====================

/** 🔐 Find user by email with security */
userSchema.statics.findByEmail = async function(email, includeSecurity = false) {
  const select = includeSecurity ? "+password +loginAttempts +lastLoginAttempt" : "";
  return await this.findOne({ email: email.toLowerCase() }).select(select);
};

/** 🔐 Find or create Google user */
userSchema.statics.findOrCreateGoogleUser = async function(profile) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const email = profile.emails[0].value.toLowerCase();
    
    let user = await this.findOne({ 
      email: email,
      isActive: true 
    }).session(session);

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.authMethod = "google";
        user.isVerified = true;
        user.emailVerifiedAt = new Date();
      }
      
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.displayName = profile.displayName || user.displayName;
      user.lastActive = new Date();
      user.lastLogin = new Date();
      
      await user.save({ session });
      await session.commitTransaction();
      return user;
    }

    const names = profile.displayName?.split(' ') || [];
    const firstName = profile.name?.givenName || names[0] || 'Google';
    const lastName = profile.name?.familyName || names.slice(1).join(' ') || 'User';

    user = new this({
      googleId: profile.id,
      email: email,
      authMethod: "google",
      firstName,
      lastName,
      displayName: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      isVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      accountCreated: new Date(),
      lastActive: new Date(),
      lastLogin: new Date(),
      profileCompleted: false,
      gender: 'prefer not to say'
    });

    await user.save({ session });
    await session.commitTransaction();
    
    return user;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in findOrCreateGoogleUser:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/** 🔐 Find user with valid verification code */
userSchema.statics.findByVerificationCode = async function(email, code) {
  return await this.findOne({
    email: email.toLowerCase(),
    verificationCode: code,
    verificationCodeExpiry: { $gt: new Date() },
    isVerified: false
  });
};

/** 🔐 Find user with valid reset code */
userSchema.statics.findByResetCode = async function(email, code) {
  return await this.findOne({
    email: email.toLowerCase(),
    resetPasswordCode: code,
    resetPasswordExpires: { $gt: new Date() },
    isActive: true
  }).select("+resetPasswordCode +resetPasswordExpires");
};

/** 🔐 Clean expired tokens (cron job) */
userSchema.statics.cleanExpiredTokens = async function() {
  const now = new Date();
  
  await this.updateMany(
    {},
    {
      $pull: {
        validRefreshTokens: { expiresAt: { $lt: now } },
        csrfTokens: { expiresAt: { $lt: now } }
      }
    }
  );
};

/** 🔐 Find users by date of birth range (for birthday campaigns) */
userSchema.statics.findByBirthdayRange = async function(startDate, endDate) {
  return await this.find({
    dateOfBirth: { $ne: null },
    $expr: {
      $and: [
        { $gte: [{ $dayOfMonth: '$dateOfBirth' }, startDate.getDate()] },
        { $lte: [{ $dayOfMonth: '$dateOfBirth' }, endDate.getDate()] },
        { $gte: [{ $month: '$dateOfBirth' }, startDate.getMonth() + 1] },
        { $lte: [{ $month: '$dateOfBirth' }, endDate.getMonth() + 1] }
      ]
    }
  });
};

// ==================== INDEXES ====================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ authMethod: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "validRefreshTokens.expiresAt": 1 });
userSchema.index({ "csrfTokens.expiresAt": 1 });
userSchema.index({ username: 1 }, { sparse: true, unique: true });
userSchema.index({ dateOfBirth: 1 }, { sparse: true });
userSchema.index({ gender: 1 }, { sparse: true });
userSchema.index({ alternativePhone: 1 }, { sparse: true });
userSchema.index({ "location.country": 1 }, { sparse: true });
userSchema.index({ interests: 1 }, { sparse: true });

// Compound indexes
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ university: 1, isVerified: 1 });

// ==================== QUERY HELPERS ====================

userSchema.query.active = function() {
  return this.where({ isActive: true });
};

userSchema.query.verified = function() {
  return this.where({ isVerified: true });
};

userSchema.query.byAuthMethod = function(method) {
  return this.where({ authMethod: method });
};

userSchema.query.byGender = function(gender) {
  return this.where({ gender });
};

userSchema.query.byInterest = function(interest) {
  return this.where({ interests: interest });
};

userSchema.query.byCountry = function(country) {
  return this.where({ "location.country": country });
};

userSchema.query.withBirthdayThisMonth = function() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  return this.where({
    dateOfBirth: { $ne: null },
    $expr: {
      $and: [
        { $eq: [{ $month: '$dateOfBirth' }, currentMonth] },
        { $gte: [{ $dayOfMonth: '$dateOfBirth' }, currentDay] }
      ]
    }
  });
};

// ==================== EXPORT ====================

const User = mongoose.model("User", userSchema);

export default User;