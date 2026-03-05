import express from 'express';
import mongoose from 'mongoose';

// ============================================
// IMPORT ALL ROUTE MODULES
// ============================================

// Auth Routes
import authRoutes from './authRoutes.js';

// Profile Routes
import profileRoutes from './profile.js';

// Commission Routes
import commissionRoutes from './commissionRoutes.js';

// Product Routes
import productRoutes from './productRoutes.js';

// Order Routes
import orderRoutes from './orderRoutes.js';

// Admin Routes
import adminRoutes from './adminRoutes.js';

// Vendor Routes
import vendorRoutes from './vendorRoutes.js';

// Category Routes
import categoryRoutes from './categoryRoutes.js';

// Public Routes
import publicRoutes from './publicRoutes.js';

// Payout Routes
import payoutRoutes from './payoutRoutes.js';

// ============================================
// VALIDATE ROUTE IMPORTS
// ============================================

// Ensure all route modules are valid Express routers
const validateRouter = (router, name) => {
  if (!router) {
    console.error(`❌ Route module "${name}" is undefined or null`);
    return express.Router(); // Return empty router as fallback
  }
  if (typeof router !== 'function') {
    console.error(`❌ Route module "${name}" is not a valid router function`);
    return express.Router(); // Return empty router as fallback
  }
  return router;
};

// Apply validation
authRoutes = validateRouter(authRoutes, 'authRoutes');
profileRoutes = validateRouter(profileRoutes, 'profileRoutes');
commissionRoutes = validateRouter(commissionRoutes, 'commissionRoutes');
productRoutes = validateRouter(productRoutes, 'productRoutes');
orderRoutes = validateRouter(orderRoutes, 'orderRoutes'); // This fixes line 55!
adminRoutes = validateRouter(adminRoutes, 'adminRoutes');
vendorRoutes = validateRouter(vendorRoutes, 'vendorRoutes');
categoryRoutes = validateRouter(categoryRoutes, 'categoryRoutes');
publicRoutes = validateRouter(publicRoutes, 'publicRoutes');
payoutRoutes = validateRouter(payoutRoutes, 'payoutRoutes');

// ============================================
// CREATE ROUTER INSTANCE
// ============================================

const router = express.Router();

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * @route   GET /api/health
 * @desc    API Health Check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// ============================================
// API VERSION CHECK
// ============================================

/**
 * @route   GET /api/version
 * @desc    Get API Version
 * @access  Public
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: process.env.API_VERSION || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// MODULE ROUTES
// ============================================

/**
 * Authentication Routes
 * Base: /api/auth
 * Functions: Login, Register, Logout, Refresh Token, Email Verification, Password Reset, 2FA
 */
router.use('/auth', authRoutes);

/**
 * Profile Routes
 * Base: /api/profile
 * Functions: Get Profile, Update Profile, Change Password, Update Avatar
 * Access: Private (Authenticated Users)
 */
router.use('/profile', profileRoutes);

/**
 * Product Routes
 * Base: /api/products
 * Functions: CRUD, Search, Inventory, Reviews, Questions, Analytics
 * Access: Public/Private (Role-based)
 */
router.use('/products', productRoutes);

/**
 * Order Routes
 * Base: /api/orders
 * Functions: CRUD, Tracking, Refunds, Payments, Analytics
 * Access: Public/Private (Role-based)
 */
router.use('/orders', orderRoutes); // Line 55 - This is now safe!

/**
 * Payout Routes
 * Base: /api/payouts
 * Functions: Create, List, Process, Analytics
 * Access: Private (Admin/Vendor)
 */
router.use('/payouts', payoutRoutes);

/**
 * Admin Routes
 * Base: /api/admin
 * Functions: Dashboard, User Management, Vendor Management, System Settings, Audit Logs
 * Access: Private (Admin/Super Admin only)
 */
router.use('/admin', adminRoutes);

/**
 * Commission Routes
 * Base: /api/commissions
 * Functions: Calculate, Apply, List, Analytics
 * Access: Private (Admin/Vendor)
 */
router.use('/commissions', commissionRoutes);

/**
 * Vendor Routes
 * Base: /api/vendor
 * Functions: Dashboard, Profile, Products, Orders, Payouts, Documents
 * Access: Private (Vendor only)
 */
router.use('/vendor', vendorRoutes);

/**
 * Category Routes
 * Base: /api/categories
 * Functions: List, Tree, CRUD, Filters, Attributes
 * Access: Public/Private (Admin)
 */
router.use('/categories', categoryRoutes);

/**
 * Public Routes
 * Base: /api/public
 * Functions: Categories, Featured Products, Store Info, Public APIs
 * Access: Public (No authentication required)
 */
router.use('/public', publicRoutes);

// ============================================
// API ROOT - COMPLETE DOCUMENTATION
// ============================================

/**
 * @route   GET /api
 * @desc    API Documentation & Entry Point
 * @access  Public
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api`;
  
  res.status(200).json({
    success: true,
    message: '🚀 UniMarket API',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: process.env.API_DOCS_URL || `${baseUrl}/docs`,
    timestamp: new Date().toISOString(),
    
    // ========================================
    // AUTHENTICATION ENDPOINTS
    // ========================================
    auth: {
      base: `${baseUrl}/auth`,
      endpoints: {
        login: {
          method: 'POST',
          path: '/login',
          description: 'Authenticate user and get tokens',
          body: { email: 'string', password: 'string', twoFactorCode: 'string (optional)' }
        },
        register: {
          method: 'POST',
          path: '/register',
          description: 'Register new user account',
          body: { email: 'string', password: 'string', firstName: 'string', lastName: 'string' }
        },
        logout: {
          method: 'POST',
          path: '/logout',
          description: 'Logout user and invalidate tokens',
          auth: true
        },
        refreshToken: {
          method: 'POST',
          path: '/refresh-token',
          description: 'Get new access token using refresh token',
          body: { refreshToken: 'string' }
        },
        verifyEmail: {
          method: 'GET',
          path: '/verify-email/:token',
          description: 'Verify email address'
        },
        forgotPassword: {
          method: 'POST',
          path: '/forgot-password',
          description: 'Send password reset email',
          body: { email: 'string' }
        },
        resetPassword: {
          method: 'POST',
          path: '/reset-password/:token',
          description: 'Reset password with token',
          body: { password: 'string', confirmPassword: 'string' }
        },
        twoFactor: {
          setup: { method: 'POST', path: '/2fa/setup', auth: true },
          enable: { method: 'POST', path: '/2fa/enable', auth: true },
          disable: { method: 'POST', path: '/2fa/disable', auth: true },
          verify: { method: 'POST', path: '/2fa/verify', auth: true }
        }
      }
    },

    // ========================================
    // PROFILE ENDPOINTS
    // ========================================
    profile: {
      base: `${baseUrl}/profile`,
      endpoints: {
        get: { method: 'GET', path: '/', description: 'Get current user profile', auth: true },
        update: { method: 'PUT', path: '/', description: 'Update profile', auth: true },
        changePassword: { method: 'POST', path: '/change-password', description: 'Change password', auth: true },
        uploadAvatar: { method: 'POST', path: '/avatar', description: 'Upload profile picture', auth: true }
      }
    },

    // ========================================
    // PRODUCT ENDPOINTS
    // ========================================
    products: {
      base: `${baseUrl}/products`,
      documentation: 'Complete product management system with AI search',
      
      // AI Search & Recommendations
      search: {
        ai: {
          method: 'GET',
          path: '/search/ai',
          description: 'AI-powered semantic product search',
          query: { q: 'string', limit: 'number', page: 'number', minPrice: 'number', maxPrice: 'number', categories: 'string', vendors: 'string', ratings: 'number', inStock: 'boolean', sortBy: 'string' }
        },
        visual: {
          method: 'POST',
          path: '/search/visual',
          description: 'Visual similarity search using image',
          body: { image: 'file' }
        },
        recommendations: {
          method: 'GET',
          path: '/recommendations',
          description: 'Get personalized product recommendations',
          query: { limit: 'number' }
        }
      },

      // CRUD Operations
      crud: {
        create: {
          method: 'POST',
          path: '/',
          description: 'Create new product (Admin/Vendor)',
          auth: true,
          body: 'Product object',
          files: 'images[] (up to 10)'
        },
        list: {
          method: 'GET',
          path: '/',
          description: 'Get all products with filters',
          query: { page: 'number', limit: 'number', sortBy: 'string', sortOrder: 'asc|desc', search: 'string', category: 'string', vendor: 'string', minPrice: 'number', maxPrice: 'number', inStock: 'boolean', onSale: 'boolean', featured: 'boolean', rating: 'number', tags: 'string', status: 'string' }
        },
        getById: {
          method: 'GET',
          path: '/:id',
          description: 'Get product by ID'
        },
        getBySlug: {
          method: 'GET',
          path: '/slug/:slug',
          description: 'Get product by slug'
        },
        update: {
          method: 'PUT',
          path: '/:id',
          description: 'Update product (Admin/Vendor)',
          auth: true
        },
        delete: {
          method: 'DELETE',
          path: '/:id',
          description: 'Soft delete product (Admin/Vendor)',
          auth: true
        },
        restore: {
          method: 'POST',
          path: '/:id/restore',
          description: 'Restore deleted product (Admin/Vendor)',
          auth: true
        },
        bulk: {
          method: 'POST',
          path: '/bulk',
          description: 'Bulk update products (Admin/Vendor)',
          auth: true
        }
      },

      // Inventory Management
      inventory: {
        lowStock: {
          method: 'GET',
          path: '/inventory/low-stock',
          description: 'Get low stock products (Admin/Vendor)',
          auth: true
        },
        outOfStock: {
          method: 'GET',
          path: '/inventory/out-of-stock',
          description: 'Get out of stock products (Admin/Vendor)',
          auth: true
        },
        update: {
          method: 'PUT',
          path: '/:id/inventory',
          description: 'Update product inventory (Admin/Vendor)',
          auth: true
        }
      },

      // Approval Workflow
      approval: {
        approve: {
          method: 'POST',
          path: '/:id/approve',
          description: 'Approve product (Admin only)',
          auth: true
        },
        reject: {
          method: 'POST',
          path: '/:id/reject',
          description: 'Reject product (Admin only)',
          auth: true
        },
        requestChanges: {
          method: 'POST',
          path: '/:id/request-changes',
          description: 'Request changes for product (Admin only)',
          auth: true
        }
      },

      // Commissions
      commissions: {
        base: '/api/commissions',
        documentation: 'Complete commission management system',
        
        // Public Endpoints
        public: {
          calculate: { method: 'POST', path: '/calculate', description: 'Calculate commission for order' }
        },
        
        // CRUD Operations
        crud: {
          list: { method: 'GET', path: '/', description: 'Get all commissions' },
          get: { method: 'GET', path: '/:id', description: 'Get commission by ID' },
          getByCode: { method: 'GET', path: '/code/:code', description: 'Get commission by code' },
          create: { method: 'POST', path: '/', description: 'Create commission' },
          update: { method: 'PUT', path: '/:id', description: 'Update commission' },
          delete: { method: 'DELETE', path: '/:id', description: 'Delete commission' },
          restore: { method: 'POST', path: '/:id/restore', description: 'Restore commission' }
        },
        
        // Approval Workflow
        approval: {
          approve: { method: 'POST', path: '/:id/approve', description: 'Approve commission' },
          reject: { method: 'POST', path: '/:id/reject', description: 'Reject commission' }
        },
        
        // Application
        application: {
          apply: { method: 'POST', path: '/apply', description: 'Apply commission to order' }
        },
        
        // Vendor Operations
        vendor: {
          myCommissions: { method: 'GET', path: '/my-commissions', description: 'Get my commissions (Vendor)' },
          summary: { method: 'GET', path: '/vendor/:vendorId/summary', description: 'Get vendor commission summary' }
        },
        
        // Bulk Operations
        bulk: {
          update: { method: 'POST', path: '/bulk', description: 'Bulk update commissions' },
          export: { method: 'GET', path: '/bulk/export', description: 'Export commissions' }
        },
        
        // Analytics
        analytics: {
          overview: { method: 'GET', path: '/analytics', description: 'Get commission analytics' }
        }
      },

      // Categories
      categories: {
        base: '/api/categories',
        documentation: 'Complete category management system',
        
        // Public Endpoints
        public: {
          list: { method: 'GET', path: '/', description: 'Get all categories' },
          tree: { method: 'GET', path: '/tree', description: 'Get category tree' },
          menu: { method: 'GET', path: '/menu', description: 'Get menu categories' },
          featured: { method: 'GET', path: '/featured', description: 'Get featured categories' },
          popular: { method: 'GET', path: '/popular', description: 'Get popular categories' },
          getById: { method: 'GET', path: '/:id', description: 'Get category by ID' },
          getBySlug: { method: 'GET', path: '/slug/:slug', description: 'Get category by slug' }
        },
        
        // Admin Endpoints
        admin: {
          create: { method: 'POST', path: '/', description: 'Create category' },
          update: { method: 'PUT', path: '/:id', description: 'Update category' },
          delete: { method: 'DELETE', path: '/:id', description: 'Delete category' },
          restore: { method: 'POST', path: '/:id/restore', description: 'Restore category' }
        },
        
        // Filters
        filters: {
          add: { method: 'POST', path: '/:id/filters', description: 'Add filter' },
          update: { method: 'PUT', path: '/:id/filters/:filterId', description: 'Update filter' },
          delete: { method: 'DELETE', path: '/:id/filters/:filterId', description: 'Delete filter' }
        },
        
        // Attributes
        attributes: {
          add: { method: 'POST', path: '/:id/attributes', description: 'Add attribute' }
        },
        
        // Translations
        translations: {
          add: { method: 'POST', path: '/:id/translations', description: 'Add translation' },
          get: { method: 'GET', path: '/:id/translations', description: 'Get translations' },
          delete: { method: 'DELETE', path: '/:id/translations/:language', description: 'Delete translation' }
        },
        
        // Bulk Operations
        bulk: {
          update: { method: 'POST', path: '/bulk', description: 'Bulk update categories' },
          export: { method: 'GET', path: '/bulk/export', description: 'Export categories' }
        },
        
        // Analytics
        analytics: {
          overview: { method: 'GET', path: '/analytics', description: 'Get category analytics' },
          updateStats: { method: 'POST', path: '/:id/update-stats', description: 'Update category stats' }
        }
      },

      // Payouts
      payouts: {
        base: '/api/payouts',
        documentation: 'Complete payout management system',
        
        // CRUD
        crud: {
          create: { method: 'POST', path: '/', description: 'Create payout (Admin/Vendor)' },
          list: { method: 'GET', path: '/', description: 'Get all payouts' },
          get: { method: 'GET', path: '/:id', description: 'Get payout by ID' },
          getByNumber: { method: 'GET', path: '/number/:payoutNumber', description: 'Get payout by number' },
          update: { method: 'PUT', path: '/:id', description: 'Update payout (Admin)' },
          delete: { method: 'DELETE', path: '/:id', description: 'Delete payout (Admin)' },
          restore: { method: 'POST', path: '/:id/restore', description: 'Restore deleted payout (Admin)' }
        },
        
        // Approval Workflow
        approval: {
          approve: { method: 'POST', path: '/:id/approve', description: 'Approve payout (Admin)' },
          reject: { method: 'POST', path: '/:id/reject', description: 'Reject payout (Admin)' },
          process: { method: 'POST', path: '/:id/process', description: 'Process payout (Admin)' },
          complete: { method: 'POST', path: '/:id/complete', description: 'Complete payout (Admin/System)' },
          fail: { method: 'POST', path: '/:id/fail', description: 'Mark payout as failed (Admin/System)' }
        },
        
        // Vendor Operations
        vendor: {
          myPayouts: { method: 'GET', path: '/my-payouts', description: 'Get my payouts (Vendor)' },
          request: { method: 'POST', path: '/request', description: 'Request payout (Vendor)' }
        },
        
        // Bulk Operations
        bulk: {
          update: { method: 'POST', path: '/bulk', description: 'Bulk update payouts (Admin)' },
          export: { method: 'GET', path: '/bulk/export', description: 'Export payouts (Admin)' }
        },
        
        // Analytics
        analytics: {
          overview: { method: 'GET', path: '/analytics', description: 'Get payout analytics (Admin)' },
          export: { method: 'GET', path: '/analytics/export', description: 'Export payout analytics (Admin)' }
        },
        
        // Notes & Timeline
        notes: {
          add: { method: 'POST', path: '/:id/notes', description: 'Add note to payout' },
          timeline: { method: 'GET', path: '/:id/timeline', description: 'Get payout timeline' }
        }
      },

      // Bulk Operations
      bulk: {
        import: {
          method: 'POST',
          path: '/bulk/import',
          description: 'Bulk import products from CSV/Excel (Admin/Vendor)',
          auth: true,
          files: 'file (csv/xlsx)'
        },
        export: {
          method: 'GET',
          path: '/bulk/export',
          description: 'Bulk export products (Admin/Vendor)',
          auth: true,
          query: { format: 'csv|excel|pdf|json', fields: 'string', status: 'string', category: 'string' }
        }
      },

      // Analytics
      analytics: {
        overview: {
          method: 'GET',
          path: '/analytics',
          description: 'Get product analytics (Admin/Vendor)',
          auth: true,
          query: { period: '7d|30d|90d|12m', groupBy: 'day|week|month' }
        },
        export: {
          method: 'GET',
          path: '/analytics/export',
          description: 'Export product analytics (Admin/Vendor)',
          auth: true
        }
      },

      // Vendor Specific
      vendor: {
        mine: {
          method: 'GET',
          path: '/vendor/mine',
          description: 'Get my products (Vendor only)',
          auth: true
        },
        pending: {
          method: 'GET',
          path: '/vendor/pending',
          description: 'Get my pending products (Vendor only)',
          auth: true
        }
      },

      // Admin Specific
      admin: {
        pending: {
          method: 'GET',
          path: '/admin/pending',
          description: 'Get all pending products (Admin only)',
          auth: true
        },
        rejected: {
          method: 'GET',
          path: '/admin/rejected',
          description: 'Get rejected products (Admin only)',
          auth: true
        },
        featured: {
          method: 'GET',
          path: '/admin/featured',
          description: 'Get/manage featured products (Admin only)',
          auth: true
        }
      }
    },

    // ========================================
    // ORDER ENDPOINTS
    // ========================================
    orders: {
      base: `${baseUrl}/orders`,
      documentation: 'Complete order management system with multi-vendor support',
      
      // Analytics
      analytics: {
        overview: {
          method: 'GET',
          path: '/analytics',
          description: 'Get comprehensive order analytics (Admin only)',
          auth: true,
          query: { period: '7d|30d|90d|12m|custom', groupBy: 'day|week|month|year', vendor: 'string' }
        },
        export: {
          method: 'GET',
          path: '/analytics/export',
          description: 'Export order analytics report (Admin only)',
          auth: true
        }
      },

      // Payment
      payment: {
        intent: {
          method: 'POST',
          path: '/payment-intent',
          description: 'Create Stripe payment intent',
          body: { amount: 'number', currency: 'string', orderId: 'string' }
        },
        webhook: {
          method: 'POST',
          path: '/webhook/stripe',
          description: 'Stripe webhook handler',
          headers: { 'stripe-signature': 'string' }
        }
      },

      // Customer Operations
      customer: {
        myOrders: {
          method: 'GET',
          path: '/my-orders',
          description: 'Get current customer orders',
          auth: true,
          query: { page: 'number', limit: 'number', status: 'string' }
        },
        cancel: {
          method: 'POST',
          path: '/:id/cancel',
          description: 'Cancel my order (Customer only)',
          auth: true,
          body: { reason: 'string' }
        }
      },

      // Vendor Operations
      vendor: {
        orders: {
          method: 'GET',
          path: '/vendor',
          description: 'Get vendor orders (Vendor only)',
          auth: true,
          query: { page: 'number', limit: 'number', status: 'string', search: 'string' }
        },
        updateStatus: {
          method: 'PUT',
          path: '/vendor/:id/status',
          description: 'Update vendor-specific order status (Vendor only)',
          auth: true,
          body: { status: 'string', note: 'string', tracking: 'object' }
        }
      },

      // CRUD Operations
      crud: {
        create: {
          method: 'POST',
          path: '/',
          description: 'Create new order (Public/Customer)',
          body: 'Order object with items, shipping, payment'
        },
        list: {
          method: 'GET',
          path: '/',
          description: 'Get all orders with filters (Admin/Vendor)',
          auth: true,
          query: { page: 'number', limit: 'number', status: 'string', paymentStatus: 'string', startDate: 'date', endDate: 'date' }
        },
        getById: {
          method: 'GET',
          path: '/:id',
          description: 'Get order by ID (Authorized users)',
          auth: true
        },
        getByNumber: {
          method: 'GET',
          path: '/number/:orderNumber',
          description: 'Get order by order number (Public with email)',
          query: { email: 'string' }
        }
      },

      // Status Management
      status: {
        update: {
          method: 'PUT',
          path: '/:id/status',
          description: 'Update order status (Admin/Vendor)',
          auth: true,
          body: { status: 'string', note: 'string' }
        },
        payment: {
          method: 'PUT',
          path: '/:id/payment',
          description: 'Update payment status (Admin/System)',
          auth: true,
          body: { status: 'string', transactionId: 'string', provider: 'string', amount: 'number' }
        }
      },

      // Tracking
      tracking: {
        add: {
          method: 'POST',
          path: '/:id/tracking',
          description: 'Add tracking information (Vendor/Admin)',
          auth: true,
          body: { carrier: 'string', trackingNumber: 'string', trackingUrl: 'string' }
        },
        update: {
          method: 'PUT',
          path: '/tracking/:trackingNumber',
          description: 'Update tracking information (System/Webhook)',
          body: { status: 'string', events: 'array' }
        }
      },

      // Refunds
      refunds: {
        process: {
          method: 'POST',
          path: '/:id/refund',
          description: 'Process refund (Admin/Vendor)',
          auth: true,
          body: { amount: 'number', reason: 'string', items: 'array' }
        },
        history: {
          method: 'GET',
          path: '/:id/refunds',
          description: 'Get refund history (Authorized users)',
          auth: true
        }
      },

      // Bulk Operations
      bulk: {
        update: {
          method: 'POST',
          path: '/bulk',
          description: 'Bulk update orders (Admin only)',
          auth: true,
          body: { orderIds: 'array', action: 'string', data: 'object' }
        },
        export: {
          method: 'GET',
          path: '/bulk/export',
          description: 'Bulk export orders (Admin only)',
          auth: true,
          query: { format: 'csv|excel|pdf|json', status: 'string', startDate: 'date' }
        }
      },

      // Notes & Timeline
      notes: {
        add: {
          method: 'POST',
          path: '/:id/notes',
          description: 'Add admin note to order (Admin only)',
          auth: true,
          body: { note: 'string', type: 'string', isPrivate: 'boolean' }
        },
        timeline: {
          method: 'GET',
          path: '/:id/timeline',
          description: 'Get order timeline (Authorized users)',
          auth: true
        }
      }
    },

    // ========================================
    // ADMIN ENDPOINTS
    // ========================================
    admin: {
      base: `${baseUrl}/admin`,
      documentation: 'Complete admin management system',
      
      auth: {
        login: { method: 'POST', path: '/auth/login', description: 'Admin login' },
        logout: { method: 'POST', path: '/auth/logout', description: 'Admin logout', auth: true },
        me: { method: 'GET', path: '/auth/me', description: 'Get current admin', auth: true },
        changePassword: { method: 'POST', path: '/auth/change-password', description: 'Change password', auth: true },
        twoFactor: {
          setup: { method: 'POST', path: '/auth/2fa/setup', auth: true },
          enable: { method: 'POST', path: '/auth/2fa/enable', auth: true },
          disable: { method: 'POST', path: '/auth/2fa/disable', auth: true }
        }
      },
      
      management: {
        list: { method: 'GET', path: '/manage', description: 'Get all admins', auth: true },
        create: { method: 'POST', path: '/manage', description: 'Create new admin', auth: true },
        get: { method: 'GET', path: '/manage/:id', description: 'Get admin by ID', auth: true },
        update: { method: 'PUT', path: '/manage/:id', description: 'Update admin', auth: true },
        delete: { method: 'DELETE', path: '/manage/:id', description: 'Delete admin', auth: true },
        bulk: { method: 'POST', path: '/manage/bulk', description: 'Bulk update admins', auth: true }
      },
      
      dashboard: {
        stats: { method: 'GET', path: '/dashboard', description: 'Get dashboard stats', auth: true },
        revenue: { method: 'GET', path: '/analytics/revenue', description: 'Get revenue analytics', auth: true }
      },
      
      vendors: {
        summary: { method: 'GET', path: '/vendors', description: 'Get vendors summary', auth: true }
      },
      
      settings: {
        get: { method: 'GET', path: '/settings', description: 'Get system settings', auth: true },
        update: { method: 'PUT', path: '/settings', description: 'Update system settings', auth: true }
      },
      
      audit: {
        logs: { method: 'GET', path: '/audit-logs', description: 'Get audit logs', auth: true }
      }
    },

    // ========================================
    // VENDOR ENDPOINTS
    // ========================================
    vendor: {
      base: `${baseUrl}/vendor`,
      documentation: 'Complete vendor management system',
      
      auth: {
        login: { method: 'POST', path: '/auth/login', description: 'Vendor login' },
        register: { method: 'POST', path: '/auth/register', description: 'Vendor registration' },
        verifyEmail: { method: 'GET', path: '/auth/verify-email/:token', description: 'Verify email' },
        logout: { method: 'POST', path: '/auth/logout', description: 'Vendor logout', auth: true }
      },
      
      profile: {
        get: { method: 'GET', path: '/profile', description: 'Get vendor profile', auth: true },
        update: { method: 'PUT', path: '/profile', description: 'Update vendor profile', auth: true },
        address: { method: 'POST', path: '/profile/address', description: 'Add store address', auth: true },
        social: { method: 'PUT', path: '/profile/social', description: 'Update social media', auth: true },
        bank: { method: 'PUT', path: '/profile/bank', description: 'Update bank details', auth: true }
      },
      
      products: {
        list: { method: 'GET', path: '/products', description: 'Get vendor products', auth: true },
        create: { method: 'POST', path: '/products', description: 'Create product', auth: true },
        update: { method: 'PUT', path: '/products/:id', description: 'Update product', auth: true },
        delete: { method: 'DELETE', path: '/products/:id', description: 'Delete product', auth: true },
        bulk: { method: 'POST', path: '/products/bulk', description: 'Bulk update products', auth: true }
      },
      
      orders: {
        list: { method: 'GET', path: '/orders', description: 'Get vendor orders', auth: true },
        get: { method: 'GET', path: '/orders/:id', description: 'Get single order', auth: true },
        updateStatus: { method: 'PUT', path: '/orders/:id/status', description: 'Update order status', auth: true },
        refund: { method: 'POST', path: '/orders/:id/refund', description: 'Process refund', auth: true }
      },
      
      payouts: {
        history: { method: 'GET', path: '/payouts', description: 'Get payout history', auth: true },
        earnings: { method: 'GET', path: '/earnings', description: 'Get earnings summary', auth: true }
      },
      
      dashboard: {
        stats: { method: 'GET', path: '/dashboard', description: 'Get vendor dashboard', auth: true }
      },
      
      documents: {
        upload: { method: 'POST', path: '/documents', description: 'Upload verification documents', auth: true },
        status: { method: 'GET', path: '/verification-status', description: 'Get verification status', auth: true }
      }
    },

    // ========================================
    // PUBLIC ENDPOINTS
    // ========================================
    public: {
      base: `${baseUrl}/public`,
      documentation: 'Public API endpoints (no authentication required)',
      
      endpoints: {
        categories: {
          method: 'GET',
          path: '/categories',
          description: 'Get all active categories'
        },
        featuredProducts: {
          method: 'GET',
          path: '/products/featured',
          description: 'Get featured products'
        },
        storeInfo: {
          method: 'GET',
          path: '/store-info',
          description: 'Get public store information'
        }
      }
    },

    // ========================================
    // UTILITY ENDPOINTS
    // ========================================
    utility: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'API health check'
      },
      version: {
        method: 'GET',
        path: '/version',
        description: 'Get API version'
      }
    }
  });
});

// ============================================
// 404 HANDLER - ROUTE NOT FOUND
// ============================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND',
    documentation: `${req.protocol}://${req.get('host')}/api`
  });
});

// ============================================
// ERROR HANDLER
// ============================================

router.use((err, req, res, next) => {
  console.error('Route Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors,
      error: 'VALIDATION_ERROR'
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'UNAUTHORIZED'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
      error: 'FORBIDDEN'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default router;