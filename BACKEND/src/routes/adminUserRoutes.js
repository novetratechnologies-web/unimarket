// backend/routes/adminUserRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/auth.js';
import {
  // Basic CRUD
  getUsers,
  getUserById,
  getUserOrders,
  getUserActivityLogs,
  createUser,
  updateUser,
  
  // Account Management
  softDeleteUser,
  restoreUser,
  permanentDeleteUser,
  activateUser,
  deactivateUser,
  suspendUser,
  unsuspendUser,
  getDeletedUsers,
  
  // Statistics & Bulk Operations
  getUserStats,
  bulkUpdateUsers,
  bulkPermanentDeleteUsers,
  exportUsers
} from '../controllers/adminUserController.js';

const router = express.Router();


// ============================================
// PUBLIC TEST ROUTE (No Auth)
// ============================================
router.get('/public-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Public test route is working',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DEBUG MIDDLEWARE
// ============================================
router.use((req, res, next) => {
  next();
});

// ============================================
// PROTECT ALL ROUTES BELOW
// ============================================
router.use(protect);

// Debug after protect
router.use((req, res, next) => {
  next();
});

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================
router.use(authorize('admin', 'super_admin'));

// Debug after authorize
router.use((req, res, next) => {
  next();
});

// ============================================
// ROUTES - ORDER MATTERS! Most specific first
// ============================================

/**
 * @route   GET /api/admin/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/admin/users/export
 * @desc    Export users (CSV/JSON)
 * @access  Private/Admin
 */
router.get('/export', exportUsers);

/**
 * @route   GET /api/admin/users/deleted
 * @desc    Get all deleted users (trash)
 * @access  Private/Admin
 */
router.get('/deleted', getDeletedUsers);

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Bulk update users (activate, deactivate, suspend, verify, etc.)
 * @access  Private/Admin
 */
router.post('/bulk', bulkUpdateUsers);

/**
 * @route   POST /api/admin/users/bulk/permanent-delete
 * @desc    Bulk permanently delete users (only if no orders)
 * @access  Private/Admin
 */
router.post('/bulk/permanent-delete', bulkPermanentDeleteUsers);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Private/Admin
 */
router.get('/', getUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private/Admin
 */
router.post('/', createUser);

// ============================================
// USER-SPECIFIC ROUTES
// ============================================

/**
 * @route   GET /api/admin/users/:id/orders
 * @desc    Get user orders
 * @access  Private/Admin
 */
router.get('/:id/orders', getUserOrders);

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private/Admin
 */
router.get('/:id/activity', getUserActivityLogs);

/**
 * @route   PUT /api/admin/users/:id/activate
 * @desc    Activate user account
 * @access  Private/Admin
 */
router.put('/:id/activate', activateUser);

/**
 * @route   PUT /api/admin/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private/Admin
 */
router.put('/:id/deactivate', deactivateUser);

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend user account for a period
 * @access  Private/Admin
 */
router.put('/:id/suspend', suspendUser);

/**
 * @route   PUT /api/admin/users/:id/unsuspend
 * @desc    Remove suspension from user account
 * @access  Private/Admin
 */
router.put('/:id/unsuspend', unsuspendUser);

/**
 * @route   DELETE /api/admin/users/:id/soft
 * @desc    Soft delete user (move to trash)
 * @access  Private/Admin
 */
router.delete('/:id/soft', softDeleteUser);

/**
 * @route   PUT /api/admin/users/:id/restore
 * @desc    Restore user from trash
 * @access  Private/Admin
 */
router.put('/:id/restore', restoreUser);

/**
 * @route   DELETE /api/admin/users/:id/permanent
 * @desc    Permanently delete user (only if no orders)
 * @access  Private/Admin
 */
router.delete('/:id/permanent', permanentDeleteUser);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user by ID
 * @access  Private/Admin
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft delete user (legacy - maps to softDelete)
 * @access  Private/Admin
 */
router.delete('/:id', softDeleteUser);

export default router;