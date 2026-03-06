// app.js - FULLY OPTIMIZED FOR RENDER + VERCEL
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import compression from "compression";
import hpp from "hpp";
import { sanitizeMongo } from './middleware/sanitize.js';
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";
import mongoose from "mongoose";
import csrf from 'csurf';
import os from 'os';
import { ipKeyGenerator } from 'express-rate-limit';

// ============================================
// ✅ IMPORT MIDDLEWARE
// ============================================
import resourceMonitor from './middleware/resourceMonitor.js';
import {
  getSystemMetrics, 
  getRequestStats, 
  getErrorLog, 
  getMemoryAnalysis,
  clearMetrics 
} from './middleware/resourceMonitor.js';

import { requestTimeoutMiddleware, connectionTracker } from './middleware/timeoutHandler.js';
import { connectionMonitor, getConnectionStatus } from './middleware/connectionMonitor.js';
import {payloadLimiter} from './middleware/payloadLimiter.js';

// ============================================
// ✅ IMPORT ERROR HANDLERS
// ============================================
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import { createModuleLogger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// ============================================
// ✅ IMPORT ROUTES
// ============================================
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profile.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoutes, { vendorRouter } from "./routes/adminRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminUserRoutes from './routes/adminUserRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

// Initialize logger
const logger = createModuleLogger('App');

const app = express();

// ============================================
// ENVIRONMENT DETECTION
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true' || process.env.IS_RENDER === 'true';
const isVercel = process.env.VERCEL === 'true';

console.log('🌍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  isRender,
  isVercel,
  PORT: process.env.PORT,
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL
});

// ============================================
// CONSTANTS WITH RENDER SUPPORT
// ============================================
const CLIENT_URL = process.env.CLIENT_URL || 
                   (isRender ? 'https://unimarket-vtx5.onrender.com' : 'http://localhost:5173');
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';
const VENDOR_URL = process.env.VENDOR_URL || 'http://localhost:5175';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unimarket';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'your-cookie-secret-change-this';

// ============================================
// GET ALL NETWORK INTERFACES FOR CORS
// ============================================
const getNetworkIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
};

const networkIPs = getNetworkIPs();

// ============================================
// CORS CONFIGURATION - RENDER + VERCEL FRIENDLY
// ============================================
const cleanUrl = (url) => {
  if (!url) return null;
  return url.replace(/\/$/, '');
};

// Base allowed origins
const baseOrigins = [
  cleanUrl(CLIENT_URL),
  cleanUrl(ADMIN_URL),
  cleanUrl(VENDOR_URL),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://localhost:5000',

 
  'https://unimatket.store',
  'https://unimarket-bodv51ojg-novetratechnologies-webs-projects.vercel.app/', // REPLACE WITH YOUR ACTUAL VERCEL URL
  'https://unimarket-bodv51ojg-novetratechnologies-webs-projects.vercel.app/', // Example

   'http://unimatket.store',
  'http://unimarket-bodv51ojg-novetratechnologies-webs-projects.vercel.app/', // REPLACE WITH YOUR ACTUAL VERCEL URL
  'http://unimarket-bodv51ojg-novetratechnologies-webs-projects.vercel.app/', // Example
];

// Add Render URL if in production
if (isRender) {
  baseOrigins.push(process.env.RENDER_EXTERNAL_URL || 'https://unimarket-vtx5.onrender.com');
}

// Add all network IPs for local development
const networkOrigins = [];
networkIPs.forEach(ip => {
  networkOrigins.push(`http://${ip}:5173`);
  networkOrigins.push(`http://${ip}:5174`);
  networkOrigins.push(`http://${ip}:5175`);
});

// Combine all origins
const allowedOrigins = [...new Set([...baseOrigins, ...networkOrigins].filter(Boolean))];

console.log('✅ Allowed CORS origins:', allowedOrigins);

// ============================================
// TRUST PROXY - CRITICAL FOR RENDER
// ============================================
if (isProduction || isRender) {
  // Trust first proxy (Render uses proxies)
  app.set('trust proxy', 1);
  console.log('🔄 Trust proxy enabled for Render');
}

// ============================================
// SECURITY HEADERS (Helmet)
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Render compatibility
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// ============================================
// REQUEST TIMEOUT & CONNECTION TRACKING
// ============================================
app.use(requestTimeoutMiddleware);
app.use(connectionTracker);
app.use('/api', payloadLimiter);

// ============================================
// CORS MIDDLEWARE - RENDER OPTIMIZED
// ============================================
// ============================================
// CORS MIDDLEWARE - RENDER OPTIMIZED
// ============================================
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (!isProduction && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow network IPs in development
    if (!isProduction) {
      const isNetworkIP = networkIPs.some(ip => origin.includes(ip));
      if (isNetworkIP) return callback(null, true);
    }
    
    // Allow Vercel domains
    if (origin.includes('vercel.app')) {
      logger.info('✅ Allowing Vercel origin:', origin);
      return callback(null, true);
    }
    
    // Allow Render domains
    if (origin.includes('onrender.com')) {
      logger.info('✅ Allowing Render origin:', origin);
      return callback(null, true);
    }
    
    logger.warn('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // CRITICAL for cookies/auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-CSRF-Token',
    'X-Request-ID', 
    'X-Session-Token', 
    'Accept', 
    'Accept-Version',
    'Content-Length', 
    'Content-MD5', 
    'Date', 
    'X-Api-Version',
    'X-Response-Time', 
    'X-Powered-By', 
    'X-Forwarded-For', 
    'Origin',
    'X-Refresh-Token',
    'X-Client-Version',   
    'X-Client-Platform'    
  ],
  exposedHeaders: [
    'X-Request-ID', 
    'X-Response-Time', 
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining', 
    'X-RateLimit-Reset', 
    'X-Session-Token',
    'X-CSRF-Token', 
    'Content-Range', 
    'X-Total-Count'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));


// ============================================
// HEALTH CHECK ENDPOINTS - ADD THESE
// ============================================

// Root health check (without /api)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// API health check (with /api)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Handle preflight requests explicitly
app.options('/', cors());

// ============================================
// ENHANCED RESOURCE MONITORING
// ============================================
app.use(resourceMonitor);

// ============================================
// RATE LIMITING
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // For authenticated users, use their ID
    if (req.user?._id) {
      return `user:${req.user._id}`;
    }
    // For unauthenticated users, use ipKeyGenerator to handle IPv6 safely
    return `ip:${ipKeyGenerator(req.ip)}`;
  },
  skip: (req) => req.user?.role === 'super_admin',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many authentication attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many API requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const productLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many product requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  if (!req.path.startsWith('/health') && !req.path.startsWith('/api/ping')) {
    return globalLimiter(req, res, next);
  }
  next();
});

// ============================================
// REQUEST PARSING & COMPRESSION
// ============================================
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(COOKIE_SECRET));

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(hpp());
app.use(sanitizeMongo());
app.use(xss());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ============================================
// SESSION CONFIGURATION - RENDER OPTIMIZED
// ============================================
export const initializeSession = (mongooseConnection) => {
  const sessionConfig = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      client: mongooseConnection.getClient(),
      ttl: 24 * 60 * 60,
      autoRemove: 'native',
      touchAfter: 24 * 3600,
      crypto: { secret: process.env.SESSION_ENCRYPTION_KEY || SESSION_SECRET }
    }),
    cookie: {
      secure: isProduction || isRender, // Use secure in production/Render
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? 'none' : 'lax', // 'none' allows cross-site (Vercel -> Render)
      path: '/',
      signed: true
    },
    name: 'sid',
    rolling: true,
    unset: 'destroy'
  };

  // Add domain only if explicitly set
  if (process.env.COOKIE_DOMAIN) {
    sessionConfig.cookie.domain = process.env.COOKIE_DOMAIN;
  }

  console.log('🍪 Session config:', {
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    isProduction,
    isRender
  });

  return session(sessionConfig);
};

// ============================================
// PASSPORT AUTHENTICATION
// ============================================
import setupGoogleStrategy from "./passport/googleStrategy.js";
import setupJWTStrategy from "./passport/jwtStrategy.js";

setupGoogleStrategy();
setupJWTStrategy();

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (!isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { 
    skip: (req, res) => res.statusCode < 400,
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// REQUEST TIMING
// ============================================
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalJson = res.json;
  const originalSend = res.send;
  
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    this.setHeader('X-Response-Time', `${duration}ms`);
    if (duration > 5000) {
      logger.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
    return originalJson.call(this, data);
  };
  
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    this.setHeader('X-Response-Time', `${duration}ms`);
    if (duration > 5000) {
      logger.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    requestId: req.id,
    render: isRender,
    metrics: {
      system: getSystemMetrics()
    }
  });
});

app.get('/api/ping', (req, res) => {
  return res.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString(),
    requestId: req.id 
  });
});

// ============================================
// DEBUG ENDPOINTS (Protected)
// ============================================
app.get('/api/debug/connections', (req, res) => {
  if (process.env.NODE_ENV === 'development' || req.user?.role === 'super_admin') {
    res.json(getConnectionStatus());
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

app.get('/api/debug/metrics', (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(getSystemMetrics());
});

app.get('/api/debug/requests', (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(getRequestStats());
});

app.get('/api/debug/errors', (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const limit = parseInt(req.query.limit) || 100;
  res.json(getErrorLog(limit));
});

app.get('/api/debug/memory', (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(getMemoryAnalysis());
});

app.post('/api/debug/clear-metrics', (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(clearMetrics());
});

app.get('/api/debug/pool-crisis', async (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  
  const topology = mongoose.connection?.client?.topology;
  const poolSize = topology?.connections?.()?.size || 0;
  const pending = topology?.s?.pendingQueueLength || 0;
  const ops = topology?.s?.processingWaitQueue?.length || 0;
  const handles = process._getActiveHandles();
  const sockets = handles.filter(h => h.constructor?.name === 'Socket').length;
  
  res.json({
    timestamp: new Date().toISOString(),
    pool: {
      active: poolSize,
      pending,
      processing: ops,
      status: poolSize === 0 && pending > 0 ? '🚨 CRISIS' : '✅ OK'
    },
    node: {
      handles: handles.length,
      sockets,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    }
  });
});

app.get('/api/debug/status', (req, res) => {
  if (isProduction && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json({
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      versions: process.versions
    },
    system: getSystemMetrics(),
    connections: mongoose.connection?.client?.topology?.connections?.()?.size || 0
  });
});

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// ============================================
// CSRF PROTECTION - ADAPTED FOR RENDER
// ============================================
let csrfProtection;
if (isProduction) {
  csrfProtection = csrf({
    cookie: {
      key: '_csrf',
      secure: true,
      httpOnly: true,
      sameSite: 'none', // Allow cross-site
      maxAge: 3600
    }
  });
} else {
  csrfProtection = (req, res, next) => {
    req.csrfToken = () => 'dev-csrf-token';
    next();
  };
}

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  return res.json({
    success: true,
    csrfToken: req.csrfToken ? req.csrfToken() : 'dev-csrf-token',
    requestId: req.id
  });
});

if (isProduction) {
  const csrfProtectionMiddleware = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return csrfProtection(req, res, next);
    }
    next();
  };
  
  app.use('/api/admin', csrfProtectionMiddleware);
  app.use('/api/vendor', csrfProtectionMiddleware);
}

// ============================================
// API ROUTES
// ============================================
console.log('📡 Registering routes...');

// Public routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', authLimiter, profileRoutes);

// Admin routes
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Vendor routes
app.use('/api/vendor', apiLimiter, vendorRouter);

// Other routes
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/products', productLimiter, productRoutes);
app.use('/api/categories', categoryRoutes);

console.log('✅ Routes registered successfully');

// ============================================
// CSP REPORTING
// ============================================
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  logger.error('CSP Violation:', req.body);
  return res.status(204).end();
});

// ============================================
// 404 HANDLER
// ============================================
app.use(notFoundHandler);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

export default app;