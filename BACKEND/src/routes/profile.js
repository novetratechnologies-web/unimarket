import express from "express";
import { body } from "express-validator";
import { updateProfile, getProfile, completeGoogleProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation rules
const profileValidation = [
  body("firstName")
    .optional()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters")
    .trim()
    .escape(),
  
  body("lastName")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters")
    .trim()
    .escape(),
  
  body("phone")
    .optional()
    .matches(/^\+?\d{7,15}$/)
    .withMessage("Please enter a valid phone number"),
  
  body("university")
    .optional()
    .isLength({ min: 2 })
    .withMessage("University must be at least 2 characters")
    .trim()
    .escape(),
  
  body("displayName")
    .optional()
    .trim()
    .escape(),
  
  body("profilePic")
    .optional()
    .isURL()
    .withMessage("Profile picture must be a valid URL"),
  
  body("newPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

const googleProfileValidation = [
  body("firstName")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters")
    .trim()
    .escape(),
  
  body("lastName")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters")
    .trim()
    .escape(),
  
  body("phone")
    .matches(/^\+?\d{7,15}$/)
    .withMessage("Please enter a valid phone number"),
  
  body("university")
    .isLength({ min: 2 })
    .withMessage("Please select your university")
    .trim()
    .escape(),
  
  body("tempToken")
    .notEmpty()
    .withMessage("Temporary token is required"),
];

// 🔐 Protected routes
router.get("/", protect, getProfile);
router.put("/", protect, profileValidation, updateProfile);
router.post("/complete-google", googleProfileValidation, completeGoogleProfile);

export default router;