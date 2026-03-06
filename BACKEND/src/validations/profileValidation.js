// validations/profileValidation.js
import { body } from "express-validator";

export const profileValidation = [
  body("firstName")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage("First name contains invalid characters"),
  
  body("lastName")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters")
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage("Last name contains invalid characters"),
  
  body("displayName")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 50 }),
  
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please enter a valid phone number (+254 XXX XXX XXX)"),
  
  body("alternativePhone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please enter a valid phone number"),
  
  body("university")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 }),
  
  body("username")
    .optional()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  
  body("gender")
    .optional()
    .isIn(['male', 'female', 'other', 'prefer not to say'])
    .withMessage("Invalid gender option"),
  
  body("bio")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 }),
];

export const locationValidation = [
  body("city")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 }),
  body("country")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 }),
];

export const socialLinksValidation = [
  body("github")
    .optional()
    .isURL()
    .withMessage("Invalid GitHub URL"),
  body("twitter")
    .optional()
    .isURL()
    .withMessage("Invalid Twitter URL"),
  body("linkedin")
    .optional()
    .isURL()
    .withMessage("Invalid LinkedIn URL"),
  body("instagram")
    .optional()
    .isURL()
    .withMessage("Invalid Instagram URL"),
];

export const preferencesValidation = [
  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("Email notifications must be a boolean"),
  body("pushNotifications")
    .optional()
    .isBoolean()
    .withMessage("Push notifications must be a boolean"),
  body("twoFactorEnabled")
    .optional()
    .isBoolean()
    .withMessage("Two-factor authentication must be a boolean"),
  body("theme")
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage("Theme must be light, dark, or auto"),
];

export const privacyValidation = [
  body("profileVisibility")
    .optional()
    .isIn(['public', 'students', 'private'])
    .withMessage("Profile visibility must be public, students, or private"),
  body("showEmail")
    .optional()
    .isBoolean()
    .withMessage("Show email must be a boolean"),
  body("showPhone")
    .optional()
    .isBoolean()
    .withMessage("Show phone must be a boolean"),
  body("showUniversity")
    .optional()
    .isBoolean()
    .withMessage("Show university must be a boolean"),
  body("showWishlist")
    .optional()
    .isBoolean()
    .withMessage("Show wishlist must be a boolean"),
  body("showReviews")
    .optional()
    .isBoolean()
    .withMessage("Show reviews must be a boolean"),
  body("showListings")
    .optional()
    .isBoolean()
    .withMessage("Show listings must be a boolean"),
];

export const passwordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
    .withMessage("Password must contain uppercase, lowercase, number and special character"),
  
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

export const interestsValidation = [
  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array"),
  body("interests.*")
    .optional()
    .isString()
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage("Each interest must be less than 50 characters"),
];

export const avatarValidation = [
  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
];

export const sessionValidation = [
  body("sessionId")
    .optional()
    .isMongoId()
    .withMessage("Invalid session ID"),
];

export const deleteAccountValidation = [
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password is required to delete account"),
  body("confirmDelete")
    .optional()
    .isIn(['DELETE'])
    .withMessage("Type DELETE to confirm"),
];