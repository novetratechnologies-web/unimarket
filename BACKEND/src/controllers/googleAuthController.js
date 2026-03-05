// controllers/googleAuthController.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/** 🔐 Helper: Create JWT Token */
const createToken = (user, type = 'access') => {
  const payload = { 
    id: user._id, 
    email: user.email,
    role: user.role 
  };
  
  if (type === 'refresh') {
    return jwt.sign(
      { id: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
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
    ...safeUser 
  } = userObj;
  return safeUser;
};

/**
 * Handle successful Google OAuth callback
 * This runs AFTER passport authenticates the user
 */
export const handleGoogleCallback = async (req, res) => {
  try {
    // User is attached by passport
    const user = req.user;
    
    if (!user) {
      throw new Error("No user found after authentication");
    }

    console.log("✅ Processing Google callback for:", user.email);

    // Check if profile needs completion
    const needsProfileCompletion = !user.phone || 
                                   !user.university || 
                                   user.university === "Not specified" || 
                                   user.phone === "+254700000000";

    // Generate tokens
    const accessToken = createToken(user, 'access');
    const refreshToken = createToken(user, 'refresh');

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ Tokens generated for:", user.email);

    return {
      success: true,
      user: sanitizeUser(user),
      tokens: {
        access: accessToken,
        refresh: refreshToken
      },
      requiresProfileCompletion: needsProfileCompletion,
      csrfToken: crypto.randomBytes(32).toString("hex")
    };

  } catch (error) {
    console.error("❌ Google callback error:", error);
    throw error;
  }
};

/**
 * Complete profile after Google OAuth
 */
export const completeGoogleProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, university } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update profile
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (university) user.university = university;

    await user.save();

    // Generate new tokens
    const accessToken = createToken(user, 'access');
    const refreshToken = createToken(user, 'refresh');

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: "Profile completed successfully",
      user: sanitizeUser(user),
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    });

  } catch (error) {
    console.error("Profile completion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile"
    });
  }
};