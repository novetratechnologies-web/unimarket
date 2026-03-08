// services/notificationService.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AdminVendor from '../models/AdminVendor.js';
import { getIO } from '../config/websocket.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/smsService.js';
import { sendPushNotification } from '../utils/pushService.js';
import { sendSlackAlert } from '../utils/slackService.js';
import mongoose from 'mongoose';

class NotificationService {
  // ============================================
  // CREATE NOTIFICATIONS
  // ============================================
  
  /**
   * Create notification for a single user (works for both User and AdminVendor)
   */
  async notifyUser(userId, userRole, data) {
    try {
      const recipientModel = this.getModelFromRole(userRole);
      
      const notification = await Notification.create({
        recipient: userId,
        recipientModel,
        recipientRole: userRole,
        ...data,
        status: 'pending',
        createdAt: new Date()
      });
      
      // Don't await delivery - fire and forget
      this.deliverNotification(notification, data.channels || ['in_app'])
        .catch(err => console.error('Background delivery failed:', err));
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to create user notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for multiple users by role
   */
  async notifyUsersByRole(role, data) {
    try {
      const users = await this.getUsersByRole(role);
      
      if (!users || users.length === 0) {
        console.log(`No users found with role: ${role}`);
        return [];
      }

      const notifications = users.map(user => ({
        recipient: user._id,
        recipientModel: this.getModelFromRole(role),
        recipientRole: role,
        ...data,
        status: 'pending',
        createdAt: new Date()
      }));

      // Bulk insert
      const created = await Notification.insertMany(notifications, { ordered: false });
      
      // Trigger deliveries in background
      created.forEach(notification => {
        this.deliverNotification(notification, data.channels || ['in_app'])
          .catch(err => console.error('Bulk delivery failed:', err));
      });

      return created;
    } catch (error) {
      console.error('❌ Failed to notify users by role:', error);
      throw error;
    }
  }

  // ============================================
  // GET NOTIFICATIONS - OPTIMIZED FOR ATLAS
  // ============================================
  
  /**
   * Get user notifications with filters - Works for both User and AdminVendor
   */
  async getUserNotifications(userId, options = {}) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type,
        priority,
        category,
        startDate,
        endDate,
        appType // Add appType to distinguish between main and admin
      } = options;

      console.log(`📨 [${requestId}] getUserNotifications for ${userId}`, { page, limit, unreadOnly, appType });

      const query = { 
        recipient: userId,
        isDeleted: false 
      };

      if (unreadOnly) query.isRead = false;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = Math.min(parseInt(limit), 100);

      // Determine which index to use
      let hint = { recipient: 1, createdAt: -1 };
      if (unreadOnly) {
        hint = { recipient: 1, isRead: 1, createdAt: -1 };
      } else if (type) {
        hint = { recipient: 1, type: 1, createdAt: -1 };
      } else if (priority) {
        hint = { recipient: 1, priority: 1, createdAt: -1 };
      }

      // Execute queries in parallel
      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select('-__v -readReceipts -webhookResponse -webhookSent -metadata')
          .lean()
          .hint(hint)
          .maxTimeMS(3000)
          .exec(),
          
        Notification.countDocuments(query)
          .hint(hint)
          .maxTimeMS(2000),
          
        this.getUnreadCount(userId)
      ]);

      const duration = Date.now() - startTime;
      
      if (duration > 100) {
        console.warn(`🐢 [${requestId}] Slow query: ${duration}ms for ${notifications.length} notifications`);
      } else {
        console.log(`✅ [${requestId}] Query took ${duration}ms for ${notifications.length} notifications`);
      }

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        unreadCount
      };
      
    } catch (error) {
      console.error(`❌ [${requestId}] Get user notifications error:`, error);
      
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        unreadCount: 0
      };
    }
  }


  // Add to notificationService.js inside the class

/**
 * Get single notification by ID
 */
async getNotificationById(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
      isDeleted: false
    })
    .select('-__v -readReceipts -webhookResponse -webhookSent')
    .lean()
    .maxTimeMS(3000);

    return notification;
  } catch (error) {
    console.error('❌ Get notification by ID error:', error);
    return null;
  }
}

// In notificationService.js, add:
async getStats(userId = null) {
  try {
    const match = userId ? { recipient: userId } : {};
    
    const stats = await Notification.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] } },
          byType: { $push: { type: '$type', count: 1 } },
          byPriority: { $push: { priority: '$priority', count: 1 } }
        }
      }
    ]).maxTimeMS(5000);

    if (stats.length === 0) {
      return { total: 0, unread: 0, archived: 0, byType: {}, byPriority: {} };
    }

    // Aggregate by type
    const byType = {};
    stats[0].byType?.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    // Aggregate by priority
    const byPriority = {};
    stats[0].byPriority?.forEach(item => {
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    });

    return {
      total: stats[0].total,
      unread: stats[0].unread,
      archived: stats[0].archived,
      byType,
      byPriority
    };
  } catch (error) {
    console.error('❌ Get stats error:', error);
    throw error;
  }
}

/**
 * Archive a notification
 */
async archive(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { 
        $set: { 
          isArchived: true, 
          archivedAt: new Date(),
          status: 'archived'
        }
      },
      { new: true }
    ).maxTimeMS(2000);

    if (notification) {
      // Emit archive event
      this.emitArchiveEvent(userId, notificationId);
    }

    return notification;
  } catch (error) {
    console.error('❌ Archive error:', error);
    throw error;
  }
}

/**
 * Restore an archived notification
 */
async restore(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId, isArchived: true },
      { 
        $set: { 
          isArchived: false,
          status: 'delivered' 
        },
        $unset: { archivedAt: 1 }
      },
      { new: true }
    ).maxTimeMS(2000);

    if (notification) {
      // Emit restore event
      this.emitRestoreEvent(userId, notificationId);
    }

    return notification;
  } catch (error) {
    console.error('❌ Restore error:', error);
    throw error;
  }
}

/**
 * Soft delete a notification
 */
async softDelete(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date(),
          status: 'deleted'
        }
      },
      { new: true }
    ).maxTimeMS(2000);

    if (notification) {
      // Emit delete event
      this.emitDeleteEvent(userId, notificationId);
    }

    return notification;
  } catch (error) {
    console.error('❌ Soft delete error:', error);
    throw error;
  }
}

/**
 * Clear all notifications (soft delete all)
 */
async clearAll(userId) {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isDeleted: false },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date(),
          status: 'deleted'
        }
      }
    ).maxTimeMS(5000);

    if (result.modifiedCount > 0) {
      // Emit clear all event
      this.emitClearAllEvent(userId);
    }

    return result;
  } catch (error) {
    console.error('❌ Clear all error:', error);
    throw error;
  }
}

// Add these helper methods for WebSocket events
emitArchiveEvent(userId, notificationId) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification:archived', { id: notificationId });
      io.to(`user:${userId}`).emit('notification:archived', { id: notificationId });
    }
  } catch (error) {
    console.error('Failed to emit archive event:', error);
  }
}

emitRestoreEvent(userId, notificationId) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification:restored', { id: notificationId });
      io.to(`user:${userId}`).emit('notification:restored', { id: notificationId });
    }
  } catch (error) {
    console.error('Failed to emit restore event:', error);
  }
}

emitDeleteEvent(userId, notificationId) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification:deleted', { id: notificationId });
      io.to(`user:${userId}`).emit('notification:deleted', { id: notificationId });
    }
  } catch (error) {
    console.error('Failed to emit delete event:', error);
  }
}

emitClearAllEvent(userId) {
  try {
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notifications:cleared');
      io.to(`user:${userId}`).emit('notifications:cleared');
    }
  } catch (error) {
    console.error('Failed to emit clear all event:', error);
  }
}

  /**
   * Get unread count for user - OPTIMIZED
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false, 
        isDeleted: false 
      })
      .hint({ recipient: 1, isRead: 1 })
      .maxTimeMS(1000)
      .lean();
      
      return count;
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      return 0;
    }
  }

  // ============================================
  // UPDATE NOTIFICATIONS
  // ============================================
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date(),
            status: 'read'
          }
        },
        { 
          new: true,
          projection: { _id: 1, isRead: 1, readAt: 1 }
        }
      ).maxTimeMS(2000);
      
      if (result) {
        // Emit read receipt via WebSocket
        this.emitReadReceipt(userId, notificationId);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds, userId) {
    try {
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: userId, isRead: false },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date(),
            status: 'read'
          }
        }
      ).maxTimeMS(3000);
      
      if (result.modifiedCount > 0) {
        // Get updated unread count
        const unreadCount = await this.getUnreadCount(userId);
        
        // Emit bulk read event
        this.emitBulkReadReceipt(userId, notificationIds, unreadCount);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Mark multiple as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false, isDeleted: false },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date(),
            status: 'read'
          }
        }
      ).hint({ recipient: 1, isRead: 1 })
       .maxTimeMS(5000);
      
      if (result.modifiedCount > 0) {
        // Emit all read event
        this.emitAllRead(userId);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { $set: { isArchived: true, archivedAt: new Date() } },
        { new: true }
      ).maxTimeMS(2000);
      
      return result;
    } catch (error) {
      console.error('❌ Archive notification error:', error);
      throw error;
    }
  }

  /**
   * Restore archived notification
   */
  async restoreNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId, isArchived: true },
        { $set: { isArchived: false }, $unset: { archivedAt: 1 } },
        { new: true }
      ).maxTimeMS(2000);
      
      return result;
    } catch (error) {
      console.error('❌ Restore notification error:', error);
      throw error;
    }
  }

  /**
   * Delete notification (soft delete)
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
      ).maxTimeMS(2000);
      
      return result;
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Permanently delete notification (hard delete)
   */
  async permanentDeleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete(
        { _id: notificationId, recipient: userId }
      ).maxTimeMS(2000);
      
      return result;
    } catch (error) {
      console.error('❌ Permanent delete error:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications (soft delete)
   */
  async clearAllNotifications(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      ).maxTimeMS(5000);
      
      return result;
    } catch (error) {
      console.error('❌ Clear all error:', error);
      throw error;
    }
  }

  // ============================================
  // DELIVERY HANDLING
  // ============================================
  
  /**
   * Deliver notification through specified channels
   */
  async deliverNotification(notification, channels = ['in_app']) {
    setTimeout(async () => {
      try {
        const deliveryPromises = channels.map(channel => {
          switch (channel) {
            case 'in_app': return this.deliverInApp(notification);
            case 'email': return this.deliverEmail(notification);
            case 'sms': return this.deliverSMS(notification);
            case 'push': return this.deliverPush(notification);
            case 'slack': return this.deliverSlack(notification);
            default: return Promise.resolve();
          }
        });
        
        const results = await Promise.allSettled(deliveryPromises);
        
        const failed = results.filter(r => r.status === 'rejected');
        const status = failed.length === 0 ? 'delivered' : 
                      failed.length < channels.length ? 'partial' : 'failed';
        
        await Notification.updateOne(
          { _id: notification._id },
          { 
            $set: { 
              status,
              lastDeliveryAttempt: new Date(),
              deliveryAttempts: (notification.deliveryAttempts || 0) + 1,
              deliveryError: failed.length ? failed[0].reason?.message : null
            }
          }
        ).maxTimeMS(2000);
        
      } catch (error) {
        console.error('Background delivery failed:', error);
      }
    }, 0);
  }

  /**
   * Deliver in-app notification (via WebSocket)
   */
  async deliverInApp(notification) {
    try {
      const io = getIO();
      if (io) {
        // Get user to determine app type
        const user = await this.getUser(notification.recipient);
        const appType = this.getAppTypeFromUser(user);
        
        const minimalNotification = {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message.substring(0, 100),
          priority: notification.priority,
          createdAt: notification.createdAt,
          link: notification.link,
          data: notification.data,
          appType // Add app type for frontend
        };
        
        // Send to both room formats for compatibility
        io.to(`user-${notification.recipient}`).emit('notification', minimalNotification);
        io.to(`user:${notification.recipient}`).emit('notification', minimalNotification);
        
        // Also send to app-specific room if known
        if (appType) {
          io.to(`app:${appType}`).emit('notification', minimalNotification);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('In-app delivery failed:', error);
      throw error;
    }
  }

  /**
   * Emit read receipt via WebSocket
   */
  emitReadReceipt(userId, notificationId) {
    try {
      const io = getIO();
      if (io) {
        io.to(`user-${userId}`).emit('notification:read', { notificationId });
        io.to(`user:${userId}`).emit('notification:read', { notificationId });
      }
    } catch (error) {
      console.error('Failed to emit read receipt:', error);
    }
  }

  /**
   * Emit bulk read receipt
   */
  emitBulkReadReceipt(userId, notificationIds, unreadCount) {
    try {
      const io = getIO();
      if (io) {
        io.to(`user-${userId}`).emit('notifications:read', { 
          notificationIds,
          unreadCount 
        });
        io.to(`user:${userId}`).emit('notifications:read', { 
          notificationIds,
          unreadCount 
        });
      }
    } catch (error) {
      console.error('Failed to emit bulk read receipt:', error);
    }
  }

  /**
   * Emit all read event
   */
  emitAllRead(userId) {
    try {
      const io = getIO();
      if (io) {
        io.to(`user-${userId}`).emit('notifications:all-read', { 
          readAt: new Date() 
        });
        io.to(`user:${userId}`).emit('notifications:all-read', { 
          readAt: new Date() 
        });
      }
    } catch (error) {
      console.error('Failed to emit all read event:', error);
    }
  }

  // ============================================
  // EMAIL DELIVERY
  // ============================================
  
  async deliverEmail(notification) {
    try {
      const user = await this.getUser(notification.recipient);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const emailContent = this.generateEmailTemplate(notification);
      
      await sendEmail({
        to: user.email,
        subject: notification.title,
        html: emailContent
      });
      
      return { success: true };
    } catch (error) {
      console.error('Email delivery failed:', error);
      throw error;
    }
  }

  // ============================================
  // SMS DELIVERY
  // ============================================
  
  async deliverSMS(notification) {
    try {
      const user = await this.getUser(notification.recipient);
      if (!user || !user.phone) {
        throw new Error('User phone not found');
      }

      await sendSMS({
        to: user.phone,
        message: `${notification.title}: ${notification.message.substring(0, 100)}`
      });
      
      return { success: true };
    } catch (error) {
      console.error('SMS delivery failed:', error);
      throw error;
    }
  }

  // ============================================
  // PUSH DELIVERY
  // ============================================
  
  async deliverPush(notification) {
    try {
      const user = await this.getUser(notification.recipient);
      if (!user || !user.pushToken) {
        throw new Error('User push token not found');
      }

      await sendPushNotification({
        to: user.pushToken,
        title: notification.title,
        body: notification.message.substring(0, 100),
        data: notification.data
      });
      
      return { success: true };
    } catch (error) {
      console.error('Push delivery failed:', error);
      throw error;
    }
  }

  // ============================================
  // SLACK DELIVERY
  // ============================================
  
  async deliverSlack(notification) {
    try {
      await sendSlackAlert({
        text: `*${notification.title}*\n${notification.message}`,
        priority: notification.priority,
        metadata: notification.data
      });
      
      return { success: true };
    } catch (error) {
      console.error('Slack delivery failed:', error);
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================
  
  /**
   * Create notifications in bulk
   */
  async createBulk(notifications) {
    try {
      const result = await Notification.insertMany(notifications, { 
        ordered: false,
        rawResult: true 
      });
      
      // Trigger deliveries in background
      result.forEach(notification => {
        this.deliverNotification(notification, notification.channels || ['in_app'])
          .catch(err => console.error('Bulk delivery failed:', err));
      });
      
      return result;
    } catch (error) {
      console.error('❌ Bulk create error:', error);
      throw error;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================
  
  /**
   * Get notification statistics
   */
  async getStats(userId, options = {}) {
    try {
      const { startDate, endDate } = options;
      
      const match = { recipient: userId };
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      const stats = await Notification.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: ['$isRead', 0, 1] } },
            read: { $sum: { $cond: ['$isRead', 1, 0] } },
            byType: { $push: { type: '$type', count: 1 } },
            byPriority: { $push: { priority: '$priority', count: 1 } }
          }
        }
      ]).maxTimeMS(5000);

      if (stats.length === 0) {
        return {
          total: 0,
          unread: 0,
          read: 0,
          byType: {},
          byPriority: {}
        };
      }

      // Aggregate by type
      const byType = {};
      stats[0].byType.forEach(item => {
        byType[item.type] = (byType[item.type] || 0) + 1;
      });

      // Aggregate by priority
      const byPriority = {};
      stats[0].byPriority.forEach(item => {
        byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
      });

      return {
        total: stats[0].total,
        unread: stats[0].unread,
        read: stats[0].read,
        byType,
        byPriority
      };
    } catch (error) {
      console.error('❌ Get stats error:', error);
      throw error;
    }
  }

  // ============================================
  // CLEANUP
  // ============================================
  
  /**
   * Clean up old notifications
   */
  async cleanup(options = {}) {
    try {
      const { daysToKeep = 30, dryRun = false } = options;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldNotifications = await Notification.find({
        createdAt: { $lt: cutoffDate },
        priority: { $nin: ['high', 'urgent', 'critical'] }
      })
      .select('_id')
      .hint({ createdAt: 1 })
      .limit(dryRun ? 1000 : 100000)
      .maxTimeMS(10000)
      .lean();

      if (dryRun) {
        return {
          dryRun: true,
          wouldArchive: oldNotifications.length,
          sample: oldNotifications.slice(0, 5)
        };
      }

      const batchSize = 1000;
      let archived = 0;
      
      for (let i = 0; i < oldNotifications.length; i += batchSize) {
        const batch = oldNotifications.slice(i, i + batchSize);
        const batchIds = batch.map(n => n._id);
        
        const result = await Notification.updateMany(
          { _id: { $in: batchIds } },
          { $set: { isArchived: true, archivedAt: new Date() } }
        ).maxTimeMS(5000);
        
        archived += result.modifiedCount;
        
        console.log(`📦 Archived batch ${i/batchSize + 1}: ${result.modifiedCount} notifications`);
      }

      return {
        archived,
        total: oldNotifications.length
      };
      
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  
  getModelFromRole(role) {
    const modelMap = {
      'customer': 'User',
      'user': 'User',
      'vendor': 'AdminVendor',
      'admin': 'AdminVendor',
      'super_admin': 'AdminVendor'
    };
    return modelMap[role] || 'User';
  }

  async getUsersByRole(role) {
    try {
      if (role === 'customer' || role === 'user') {
        return User.find({ role: 'user', isActive: true })
          .select('_id email firstName lastName')
          .lean()
          .maxTimeMS(5000);
      } else {
        return AdminVendor.find({ role, isActive: true })
          .select('_id email firstName lastName')
          .lean()
          .maxTimeMS(5000);
      }
    } catch (error) {
      console.error(`❌ Error getting users by role ${role}:`, error);
      return [];
    }
  }

  async getUser(userId) {
    try {
      let user = await User.findById(userId)
        .select('_id email firstName lastName phone pushToken role')
        .lean()
        .maxTimeMS(3000);
      
      if (!user) {
        user = await AdminVendor.findById(userId)
          .select('_id email firstName lastName phone pushToken role')
          .lean()
          .maxTimeMS(3000);
      }
      
      return user;
    } catch (error) {
      console.error(`❌ Error getting user ${userId}:`, error);
      return null;
    }
  }

  getAppTypeFromUser(user) {
    if (!user) return null;
    
    if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'vendor') {
      return 'admin';
    }
    return 'main';
  }

  generateEmailTemplate(notification) {
    const colorMap = {
      'low': '#808080',
      'normal': '#3B82F6',
      'high': '#F59E0B',
      'urgent': '#EF4444',
      'critical': '#EF4444'
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${notification.title}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            <div style="background-color: #f8f9fa; border-left: 4px solid ${colorMap[notification.priority] || '#3B82F6'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">${notification.message}</p>
            </div>
            
            ${notification.data ? `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 10px;">Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${Object.entries(notification.data).map(([key, value]) => `
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; border-bottom: 1px solid #E5E7EB; text-align: right;">${value}</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            ` : ''}
            
            ${notification.link ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${notification.link}" style="display: inline-block; background-color: #3B82F6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 500;">View Details</a>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">This is an automated message from UniMarket. Please do not reply to this email.</p>
            <p style="margin: 10px 0 0; color: #9CA3AF; font-size: 12px;">&copy; ${new Date().getFullYear()} UniMarket. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================
  // BUSINESS LOGIC NOTIFICATIONS
  // ============================================
  
  async orderCreated(order, user) {
    return this.notifyUser(user._id, user.role, {
      type: 'order_created',
      title: 'Order Created',
      message: `Your order #${order.orderNumber} has been created successfully.`,
      priority: 'normal',
      category: 'order',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status
      },
      link: `/orders/${order._id}`,
      channels: ['in_app', 'email']
    });
  }

  async orderShipped(order, user) {
    return this.notifyUser(user._id, user.role, {
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order #${order.orderNumber} has been shipped.`,
      priority: 'normal',
      category: 'order',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        trackingNumber: order.shipping?.trackingNumber,
        carrier: order.shipping?.carrier
      },
      link: `/orders/${order._id}`,
      channels: ['in_app', 'email', 'push']
    });
  }

  async orderDelivered(order, user) {
    return this.notifyUser(user._id, user.role, {
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order #${order.orderNumber} has been delivered.`,
      priority: 'normal',
      category: 'order',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        deliveredAt: order.deliveredAt
      },
      link: `/orders/${order._id}`,
      channels: ['in_app', 'email', 'push']
    });
  }

  async lowStockAlert(product, vendor) {
    return this.notifyUser(vendor._id, 'vendor', {
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `Product "${product.name}" is running low on stock. Current stock: ${product.quantity}`,
      priority: 'high',
      category: 'inventory',
      data: {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.quantity,
        threshold: product.lowStockThreshold
      },
      link: `/vendor/products/${product._id}`,
      channels: ['in_app', 'email', 'push']
    });
  }

  async payoutCompleted(payout, vendor) {
    return this.notifyUser(vendor._id, 'vendor', {
      type: 'payout_completed',
      title: 'Payout Completed',
      message: `Your payout of $${payout.amount} has been processed.`,
      priority: 'normal',
      category: 'payout',
      data: {
        payoutId: payout._id,
        payoutNumber: payout.payoutNumber,
        amount: payout.amount,
        period: payout.period
      },
      link: `/vendor/payouts/${payout._id}`,
      channels: ['in_app', 'email']
    });
  }

  async vendorApproved(vendor) {
    return this.notifyUser(vendor._id, 'vendor', {
      type: 'vendor_approved',
      title: 'Vendor Application Approved',
      message: 'Congratulations! Your vendor application has been approved.',
      priority: 'high',
      category: 'vendor',
      data: {
        storeName: vendor.vendorProfile?.storeName
      },
      link: '/vendor/dashboard',
      channels: ['in_app', 'email', 'push']
    });
  }

  async vendorSuspended(vendor, reason) {
    return this.notifyUser(vendor._id, 'vendor', {
      type: 'vendor_suspended',
      title: 'Vendor Account Suspended',
      message: `Your vendor account has been suspended. Reason: ${reason}`,
      priority: 'urgent',
      category: 'vendor',
      data: {
        storeName: vendor.vendorProfile?.storeName,
        reason
      },
      link: '/vendor/support',
      channels: ['in_app', 'email']
    });
  }

  async newVendorRegistration(vendor) {
    return this.notifyUsersByRole('admin', {
      type: 'new_vendor',
      title: 'New Vendor Registration',
      message: `${vendor.vendorProfile?.storeName} has registered as a vendor.`,
      priority: 'normal',
      category: 'vendor',
      data: {
        vendorId: vendor._id,
        storeName: vendor.vendorProfile?.storeName,
        email: vendor.email,
        businessType: vendor.vendorProfile?.businessType
      },
      link: `/admin/vendors/${vendor._id}`,
      channels: ['in_app', 'email']
    });
  }

  async newOrderForVendor(order, vendor) {
    return this.notifyUser(vendor._id, 'vendor', {
      type: 'new_order',
      title: 'New Order Received',
      message: `You have received a new order #${order.orderNumber}.`,
      priority: 'high',
      category: 'order',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.shippingAddress?.fullName
      },
      link: `/vendor/orders/${order._id}`,
      channels: ['in_app', 'email', 'push']
    });
  }

  async paymentReceived(payment, user) {
    return this.notifyUser(user._id, user.role, {
      type: 'payment_received',
      title: 'Payment Received',
      message: `Your payment of $${payment.amount} has been received.`,
      priority: 'normal',
      category: 'payment',
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        orderId: payment.metadata?.orderId
      },
      link: `/orders/${payment.metadata?.orderId}`,
      channels: ['in_app', 'email']
    });
  }

  async paymentFailed(payment, user) {
    return this.notifyUser(user._id, user.role, {
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of $${payment.amount} has failed. Please update your payment method.`,
      priority: 'high',
      category: 'payment',
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        error: payment.error
      },
      link: `/payment-methods`,
      channels: ['in_app', 'email', 'push']
    });
  }
}

export default new NotificationService();