// passport/googleStrategy.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken'; // Make sure to install jsonwebtoken

// Load env vars
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find .env file
const possiblePaths = [
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env'),
  resolve(process.cwd(), '.env'),
];

let envLoaded = false;
for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    dotenv.config({ path });
    envLoaded = true;
    break;
  }
}

// Helper function to generate JWT tokens
const generateTokens = (user) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { 
      id: user._id,
      type: 'refresh' 
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export default function setupGoogleStrategy() {
  // Check if required env vars exist
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.error('❌ Google OAuth configuration missing. Skipping Google Strategy setup.');
    return;
  }

  console.log('✅ Setting up Google OAuth Strategy with callback:', process.env.GOOGLE_CALLBACK_URL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔐 Google OAuth Profile received:", {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName
          });

          // Find or create user
          let user = await User.findOne({ email: profile.emails[0].value });
          
          if (!user) {
            // Create new user
            user = new User({
              email: profile.emails[0].value,
              firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
              lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true,
              authMethod: 'google',
              emailVerifiedAt: new Date()
            });
            await user.save();
            console.log("✅ New user created from Google OAuth");
          } else {
            // Update existing user with Google info
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value || user.avatar;
            user.authMethod = user.authMethod || 'google';
            user.lastActive = new Date();
            await user.save();
            console.log("✅ Existing user updated with Google info");
          }

          // Generate JWT tokens
          const tokens = generateTokens(user);
          
          console.log("✅ JWT tokens generated for user:", user.email);

          // 🔥 IMPORTANT: Return user WITH tokens in the done callback
          // This will be available in the route handler
          return done(null, { 
            user, 
            tokens: {
              access: tokens.accessToken,
              refresh: tokens.refreshToken
            }
          });
          
        } catch (error) {
          console.error("❌ Google OAuth Error:", error);
          return done(error, null);
        }
      }
    )
  );

  // Serialization for session (if using sessions)
  passport.serializeUser((user, done) => {
    done(null, user.id || user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}