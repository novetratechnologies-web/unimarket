// routes/notificationRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import notificationService from '../service/notificationService.js'; // Fixed path (plural 'services')
// import Notification from '../models/Notification.js'; // Not needed as service handles it

const router = express.Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(protect);

// ============================================
// GET NOTIFICATIONS
// ============================================

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = 'false',
      type,
      priority,
      category,
      startDate,
      endDate
    } = req.query;


    const result = await notificationService.getUserNotifications(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      category,
      startDate,
      endDate
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getNotificationById(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('❌ Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// UPDATE NOTIFICATIONS
// ============================================

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.markAsRead(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('notification:read', { id });
      io.to(`user:${req.user._id}`).emit('notification:read', { id });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('notifications:all-read');
      io.to(`user:${req.user._id}`).emit('notifications:all-read');
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/notifications/mark-read
 * @desc    Mark multiple notifications as read
 * @access  Private
 */
router.post('/mark-read', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of notification IDs'
      });
    }

    // Mark each notification as read
    const results = await Promise.all(
      ids.map(id => notificationService.markAsRead(id, req.user._id).catch(() => null))
    );

    const markedCount = results.filter(r => r !== null).length;

    res.json({
      success: true,
      message: `${markedCount} notifications marked as read`,
      count: markedCount
    });
  } catch (error) {
    console.error('❌ Mark multiple as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/archive
 * @desc    Archive a notification
 * @access  Private
 */
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.archive(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification archived',
      data: notification
    });
  } catch (error) {
    console.error('❌ Archive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/restore
 * @desc    Restore an archived notification
 * @access  Private
 */
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.restore(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification restored',
      data: notification
    });
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// DELETE NOTIFICATIONS
// ============================================

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Soft delete a notification
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.softDelete(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id/permanent
 * @desc    Permanently delete a notification (cannot be undone)
 * @access  Private
 */
router.delete('/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.permanentDelete(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification permanently deleted'
    });
  } catch (error) {
    console.error('❌ Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications (soft delete all)
 * @access  Private
 */
router.delete('/clear-all', async (req, res) => {
  try {
    const result = await notificationService.clearAll(req.user._id);

    res.json({
      success: true,
      message: 'All notifications cleared',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Clear all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route   POST /api/notifications/cleanup
 * @desc    Clean up old notifications based on retention policy
 * @access  Private/Admin/SuperAdmin
 */
router.post('/cleanup', authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    const result = await notificationService.cleanup({ daysToKeep });

    res.json({
      success: true,
      message: `Cleaned up ${result.archived + result.deleted} old notifications`,
      archived: result.archived,
      deleted: result.deleted
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics (admin only)
 * @access  Private/Admin/SuperAdmin
 */
router.get('/stats', authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // You can implement this in your service if needed
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || { total: 0, unread: 0, archived: 0 }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// DEVELOPMENT ONLY ROUTES
// ============================================

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification (development only)
 * @access  Private
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', async (req, res) => {
    try {
      const { type = 'system_alert', channel = 'in_app' } = req.body;

      const notification = await notificationService.notifyUser(
        req.user._id,
        req.user.role,
        {
          type,
          title: '🧪 Test Notification',
          message: 'This is a test notification to verify the system is working correctly.',
          priority: 'normal',
          data: {
            testId: Date.now(),
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
          },
          channels: [channel],
          icon: 'bell'
        }
      );

      res.json({
        success: true,
        message: 'Test notification sent',
        notification
      });
    } catch (error) {
      console.error('❌ Test notification error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

export default router;