import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import AdminVendor from "../models/AdminVendor.js";

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    ExtractJwt.fromHeader('x-session-token'),
    (req) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['access_token'];
      }
      return token;
    }
  ]),
  secretOrKey: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISSUER || 'ecommerce-api',
  audience: process.env.JWT_AUDIENCE || 'ecommerce-client',
  passReqToCallback: true,
  jsonWebTokenOptions: {
    maxAge: '24h'
  }
};

const setupJWTStrategy = () => {
  passport.use(
    new JwtStrategy(opts, async (req, jwt_payload, done) => {
      try {
        const user = await AdminVendor.findById(jwt_payload.id)
          .select('-password -refreshToken -twoFactorAuth.secret -twoFactorAuth.backupCodes')
          .lean();

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        if (user.status !== 'active') {
          return done(null, false, { message: `Account is ${user.status}` });
        }

        if (user.isDeleted) {
          return done(null, false, { message: 'Account has been deactivated' });
        }

        // Check if password was changed after token was issued
        if (user.passwordChangedAt) {
          const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
          if (jwt_payload.iat < changedTimestamp) {
            return done(null, false, { message: 'Password recently changed. Please login again.' });
          }
        }

        return done(null, user);
      } catch (error) {
        console.error('JWT Strategy Error:', error);
        return done(error, false);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await AdminVendor.findById(id)
        .select('-password -refreshToken -twoFactorAuth.secret -twoFactorAuth.backupCodes');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default setupJWTStrategy;