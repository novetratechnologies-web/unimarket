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
   * Create notification for a single user
   */
  async notifyUser(userId, userRole, data) {
    try {
      const recipientModel = this.getModelFromRole(userRole);
      
      const notification = await Notification.create({
        recipient: userId,
        recipientModel,
        recipientRole: userRole,
        ...data,
        status: 'pending'
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

  // ============================================
  // GET NOTIFICATIONS - OPTIMIZED FOR ATLAS
  // ============================================
  
  /**
   * Get user notifications with filters - OPTIMIZED FOR ATLAS
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
        endDate
      } = options;

      // Log incoming request
      console.log(`📨 [${requestId}] getUserNotifications for ${userId}`, { page, limit, unreadOnly });

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
      const limitNum = Math.min(parseInt(limit), 100); // Never return more than 100

      // Determine which index to use
      let hint = { recipient: 1, createdAt: -1 };
      if (unreadOnly) {
        hint = { recipient: 1, isRead: 1, createdAt: -1 };
      } else if (type) {
        hint = { recipient: 1, type: 1, createdAt: -1 };
      } else if (priority) {
        hint = { recipient: 1, priority: 1, createdAt: -1 };
      }

      // Execute queries in parallel with proper hints
      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select('-__v -readReceipts -webhookResponse -webhookSent -metadata') // Only needed fields
          .lean()
          .hint(hint)
          .maxTimeMS(3000)
          .exec(),
          
        Notification.countDocuments(query)
          .hint(hint)
          .maxTimeMS(2000),
          
        Notification.countDocuments({ 
          recipient: userId, 
          isRead: false, 
          isDeleted: false 
        })
          .hint({ recipient: 1, isRead: 1 })
          .maxTimeMS(1000)
      ]);

      const duration = Date.now() - startTime;
      
      // Log performance
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
      
      // Fallback: return empty but don't crash
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        unreadCount: 0
      };
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
      return 0; // Fallback
    }
  }

  // ============================================
  // UPDATE NOTIFICATIONS - OPTIMIZED
  // ============================================
  
  /**
   * Mark notification as read - OPTIMIZED
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
          projection: { _id: 1, isRead: 1, readAt: 1 } // Only return what's needed
        }
      ).maxTimeMS(2000);
      
      return result;
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read - OPTIMIZED BULK
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
      
      return result;
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      throw error;
    }
  }

  // ============================================
  // DELIVERY HANDLING
  // ============================================
  
  /**
   * Deliver notification through specified channels - FIRE AND FORGET
   */
  async deliverNotification(notification, channels = ['in_app']) {
    // Don't await - let it run in background
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
        
        // Update notification status (fire and forget)
        const failed = results.filter(r => r.status === 'rejected');
        const status = failed.length === 0 ? 'delivered' : 
                      failed.length < channels.length ? 'partial' : 'failed';
        
        await Notification.updateOne(
          { _id: notification._id },
          { 
            $set: { 
              status,
              lastDeliveryAttempt: new Date(),
              deliveryAttempts: notification.deliveryAttempts + 1,
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
   * Deliver in-app notification (via WebSocket) - OPTIMIZED
   */
  async deliverInApp(notification) {
    try {
      const io = getIO();
      if (io) {
        // Only send minimal data
        const minimalNotification = {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message.substring(0, 100),
          priority: notification.priority,
          createdAt: notification.createdAt,
          link: notification.link
        };
        
        io.to(`user-${notification.recipient}`).emit('notification', minimalNotification);
      }
      return { success: true };
    } catch (error) {
      console.error('In-app delivery failed:', error);
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================
  
  /**
   * Create notifications in bulk - OPTIMIZED
   */
  async createBulk(notifications) {
    try {
      // Use insertMany for bulk operations
      const result = await Notification.insertMany(notifications, { 
        ordered: false,
        rawResult: true 
      });
      
      // Trigger deliveries in background
      notifications.forEach(n => {
        this.deliverNotification(n, n.channels || ['in_app'])
          .catch(err => console.error('Bulk delivery failed:', err));
      });
      
      return result;
    } catch (error) {
      console.error('❌ Bulk create error:', error);
      throw error;
    }
  }

  // ============================================
  // CLEANUP - OPTIMIZED FOR ATLAS
  // ============================================
  
  /**
   * Clean up old notifications - OPTIMIZED FOR ATLAS
   */
  async cleanup(options = {}) {
    try {
      const { daysToKeep = 30, dryRun = false } = options;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Find old notifications
      const oldNotifications = await Notification.find({
        createdAt: { $lt: cutoffDate },
        priority: { $nin: ['high', 'urgent', 'critical'] }
      })
      .select('_id')
      .hint({ createdAt: 1 })
      .limit(dryRun ? 1000 : 100000) // Limit for dry runs
      .maxTimeMS(10000)
      .lean();

      if (dryRun) {
        return {
          dryRun: true,
          wouldArchive: oldNotifications.length,
          sample: oldNotifications.slice(0, 5)
        };
      }

      // Archive in batches
      const batchSize = 1000;
      let archived = 0;
      
      for (let i = 0; i < oldNotifications.length; i += batchSize) {
        const batch = oldNotifications.slice(i, i + batchSize);
        const batchIds = batch.map(n => n._id);
        
        const result = await Notification.updateMany(
          { _id: { $in: batchIds } },
          { $set: { isArchived: true } }
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
  // HELPER METHODS (Keep as is)
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
    if (role === 'customer' || role === 'user') {
      return User.find({ role: 'user', isActive: true }).lean();
    } else {
      return AdminVendor.find({ role, isActive: true }).lean();
    }
  }

  async getUser(userId) {
    let user = await User.findById(userId).lean();
    if (!user) {
      user = await AdminVendor.findById(userId).lean();
    }
    return user;
  }

  generateEmailTemplate(notification) {
    // Keep your existing email template
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

  // Keep other methods (orderCreated, lowStockAlert, etc.) as they are
}

export default new NotificationService();