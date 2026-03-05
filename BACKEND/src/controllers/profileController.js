import User from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // ✅ Import jwt directly

/** 👤 UPDATE USER PROFILE */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation failed",
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const {
      firstName,
      lastName,
      phone,
      university,
      displayName,
      profilePic,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Update basic profile fields
    const updateData = {};
    
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();
    if (university) updateData.university = university.trim();
    if (displayName) updateData.displayName = displayName.trim();
    if (profilePic) updateData.profilePic = profilePic;

    // Handle password change if requested
    if (currentPassword && newPassword) {
      // For Google OAuth users, they don't have passwords
      if (user.authMethod === "google") {
        return res.status(400).json({
          message: "Google OAuth users cannot set password here",
          code: 'OAUTH_USER_PASSWORD'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          message: "Current password is incorrect",
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters long",
          code: 'WEAK_PASSWORD'
        });
      }

      updateData.password = newPassword;
    } else if (newPassword && !currentPassword) {
      return res.status(400).json({
        message: "Current password is required to set new password",
        code: 'CURRENT_PASSWORD_REQUIRED'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    ).select("-password -refreshToken -verificationCode");

    // If password was updated, we need to save again to trigger hashing
    if (newPassword) {
      updatedUser.password = newPassword;
      await updatedUser.save();
    }

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        university: updatedUser.university,
        profilePic: updatedUser.profilePic,
        displayName: updatedUser.displayName,
        isVerified: updatedUser.isVerified,
        authMethod: updatedUser.authMethod,
        googleId: updatedUser.googleId,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        lastActive: updatedUser.lastActive,
        fullName: updatedUser.fullName,
      },
      code: 'PROFILE_UPDATED'
    });

  } catch (error) {
    console.error("Profile update error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
        code: 'DUPLICATE_EMAIL'
      });
    }

    return res.status(500).json({ 
      message: "Profile update failed",
      code: 'UPDATE_FAILED'
    });
  }
};

/** 👤 GET USER PROFILE */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshToken -verificationCode");

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    return res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        university: user.university,
        profilePic: user.profilePic,
        displayName: user.displayName,
        isVerified: user.isVerified,
        authMethod: user.authMethod,
        googleId: user.googleId,
        emailVerifiedAt: user.emailVerifiedAt,
        lastActive: user.lastActive,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      code: 'PROFILE_FETCHED'
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ 
      message: "Failed to fetch profile",
      code: 'FETCH_FAILED'
    });
  }
};

/** 👤 COMPLETE GOOGLE OAUTH PROFILE */
export const completeGoogleProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation failed",
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const { firstName, lastName, phone, university, tempToken } = req.body;

    console.log("Complete Google Profile - Received data:", {
      firstName,
      lastName,
      phone,
      university,
      tempToken: tempToken ? "present" : "missing"
    });

    if (!tempToken) {
      return res.status(400).json({
        message: "Temporary token is required",
        code: 'MISSING_TOKEN'
      });
    }

    // ✅ FIXED: Use the imported jwt directly
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);
    
    const user = await User.findById(decoded.id);
    console.log("User found:", user ? user.email : "not found");

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        message: "This endpoint is only for Google OAuth users",
        code: 'NOT_GOOGLE_USER'
      });
    }

    // Update user profile with real data
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.phone = phone.trim();
    user.university = university.trim();
    
    await user.save();
    console.log("User profile updated successfully");

    // Generate permanent tokens
    const createToken = (user) =>
      jwt.sign(
        { 
          id: user._id, 
          email: user.email,
          type: "access"
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || "1h",
          issuer: "UniMarket",
          subject: user._id.toString()
        }
      );

    const createRefreshToken = (user) =>
      jwt.sign(
        { 
          id: user._id, 
          type: "refresh"
        },
        process.env.JWT_REFRESH_SECRET,
        { 
          expiresIn: "7d",
          issuer: "UniMarket",
          subject: user._id.toString()
        }
      );

    const accessToken = createToken(user);
    const refreshToken = createRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    console.log("Profile completion successful for:", user.email);

    return res.json({
      message: "Profile completed successfully!",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        university: user.university,
        phone: user.phone,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        authMethod: user.authMethod,
        fullName: user.fullName,
      },
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
        message: "Invalid or expired token",
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Token has expired",
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({ 
      message: "Profile completion failed",
      code: 'COMPLETION_FAILED'
    });
  }
};