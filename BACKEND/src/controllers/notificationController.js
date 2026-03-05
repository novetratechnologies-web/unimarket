// controllers/notificationController.js
import Notification from '../models/Notification.js';
import notificationService from '../service/notificationService.js';

// ============================================
// GET NOTIFICATIONS
// ============================================

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isRead,
      type,
      priority,
      category,
      startDate,
      endDate
    } = req.query;

    const result = await Notification.getForUser(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
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
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

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
};

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
      isDeleted: false
    }).lean();

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
};

// ============================================
// UPDATE NOTIFICATIONS
// ============================================

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead({
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('notification:read', { id });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark multiple notifications as read
 * POST /api/notifications/mark-read
 */
export const markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of notification IDs'
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: ids },
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          status: 'read'
        }
      }
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('notifications:read', { count: result.modifiedCount });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Mark multiple as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user._id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('notifications:all-read');
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count
    });
  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Archive notification
 * PATCH /api/notifications/:id/archive
 */
export const archiveNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.archive();

    res.json({
      success: true,
      message: 'Notification archived'
    });
  } catch (error) {
    console.error('❌ Archive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Restore notification from archive
 * PATCH /api/notifications/:id/restore
 */
export const restoreNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.restore();

    res.json({
      success: true,
      message: 'Notification restored'
    });
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// DELETE NOTIFICATIONS
// ============================================

/**
 * Soft delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.softDelete();

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
};

/**
 * Permanently delete notification (admin only)
 * DELETE /api/notifications/:id/permanent
 */
export const permanentDeleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id
    });

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
};

/**
 * Clear all notifications (user only)
 * DELETE /api/notifications/clear-all
 */
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('❌ Clear all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Cleanup old notifications (admin only)
 * POST /api/notifications/cleanup
 */
export const cleanupNotifications = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    const result = await Notification.cleanup({ daysToKeep });

    res.json({
      success: true,
      message: `Cleaned up ${result.archived + result.deleted} notifications`,
      ...result
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get notification statistics (admin only)
 * GET /api/notifications/stats
 */
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$isRead', 0, 1] } },
          archived: { $sum: { $cond: ['$isArchived', 1, 0] } },
          byType: { $push: '$type' },
          byPriority: { $push: '$priority' }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          unread: 1,
          archived: 1,
          readRate: { $multiply: [{ $divide: [{ $subtract: ['$total', '$unread'] }, '$total'] }, 100] }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || { total: 0, unread: 0, archived: 0, readRate: 0 }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// TEST ENDPOINTS (Development only)
// ============================================

/**
 * Send test notification
 * POST /api/notifications/test
 */
export const sendTestNotification = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

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
          testId: new Date().getTime(),
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
};