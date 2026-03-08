// scripts/mock-notifications.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AdminVendor from '../models/AdminVendor.js';

dotenv.config();

async function createMockNotifications() {
  console.log('🔔 MOCK NOTIFICATIONS CREATOR');
  console.log('=============================\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unimarket');
    console.log('✅ Connected to MongoDB\n');

    // Get the super admin user
    console.log('👤 Finding super admin user...');
    const adminUser = await AdminVendor.findOne({ email: 'migoboi@gmail.com' });
    
    if (!adminUser) {
      console.error('❌ Super admin user not found!');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${adminUser.email} (${adminUser._id})`);
    console.log(`   Role: ${adminUser.role}\n`);

    // Clear existing notifications (optional - remove if you want to keep existing)
    console.log('🧹 Clearing existing notifications...');
    await Notification.deleteMany({ recipient: adminUser._id });
    console.log('✅ Cleared old notifications\n');

    // Create mock notifications
    console.log('📝 Creating mock notifications...\n');

    const notifications = [
      // High Priority Notifications
      {
        type: 'order_created',
        category: 'order',
        title: '🚨 New Order #ORD-2024-001',
        message: 'A new order worth KSh 15,500 has been placed',
        priority: 'high',
        data: { 
          orderId: 'ORD-2024-001', 
          amount: 15500,
          customer: 'John Doe',
          items: 3
        },
        status: 'pending'
      },
      {
        type: 'payment_received',
        category: 'payment',
        title: '💰 Large Payment Received',
        message: 'Payment of KSh 50,000 received from Vendor XYZ',
        priority: 'high',
        data: { 
          transactionId: 'TXN-' + Date.now(),
          amount: 50000,
          paymentMethod: 'M-Pesa',
          vendor: 'Tech Supplies Ltd'
        },
        status: 'pending'
      },
      {
        type: 'system_alert',
        category: 'system',
        title: '⚠️ System Performance Alert',
        message: 'High CPU usage detected (85%) on main server',
        priority: 'high',
        data: { 
          server: 'app-server-01',
          cpu: 85,
          memory: 72,
          timestamp: new Date()
        },
        status: 'unresolved'
      },

      // Medium Priority Notifications
      {
        type: 'vendor_application',
        category: 'vendor',
        title: '📋 New Vendor Application',
        message: 'ABC Electronics has applied to become a vendor',
        priority: 'medium',
        data: { 
          vendorId: 'VEN-001',
          name: 'ABC Electronics',
          email: 'contact@abcelectronics.com',
          productsCount: 45
        },
        status: 'pending'
      },
      {
        type: 'product_created',
        category: 'product',
        title: '✨ New Product Added',
        message: '15 new products have been added by vendors',
        priority: 'medium',
        data: { 
          count: 15,
          vendors: ['Tech Store', 'Fashion Hub'],
          categories: ['Electronics', 'Clothing']
        },
        status: 'completed'
      },
      {
        type: 'payout_processed',
        category: 'payout',
        title: '💸 Monthly Payout Processed',
        message: 'KSh 125,000 paid out to 8 vendors',
        priority: 'medium',
        data: { 
          totalAmount: 125000,
          vendorCount: 8,
          period: 'February 2026'
        },
        status: 'completed'
      },

      // Normal Priority Notifications
      {
        type: 'user_registered',
        category: 'user',
        title: '👥 New User Registration',
        message: 'Sarah Johnson just registered as a customer',
        priority: 'normal',
        data: { 
          userId: 'USR-789',
          email: 'sarah.j@example.com',
          location: 'Nairobi'
        },
        status: 'pending'
      },
      {
        type: 'review_submitted',
        category: 'review',
        title: '⭐ New 5-Star Review',
        message: 'Product "Wireless Headphones" received a 5-star review',
        priority: 'normal',
        data: { 
          productId: 'PRD-456',
          productName: 'Wireless Headphones',
          rating: 5,
          reviewer: 'Mike Otieno'
        },
        status: 'pending'
      },
      {
        type: 'discount_created',
        category: 'discount',
        title: '🏷️ New Discount Campaign',
        message: 'Flash Sale: 20% off on all electronics',
        priority: 'normal',
        data: { 
          discountId: 'DSC-2024-01',
          percentage: 20,
          category: 'Electronics',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      },

      // Low Priority Notifications
      {
        type: 'report_generated',
        category: 'report',
        title: '📊 Weekly Report Ready',
        message: 'Your weekly sales report is ready for download',
        priority: 'low',
        data: { 
          reportId: 'RPT-001',
          period: 'Week 9, 2026',
          format: 'PDF',
          size: '2.4 MB'
        },
        status: 'completed'
      },
      {
        type: 'backup_completed',
        category: 'system',
        title: '💾 Database Backup Complete',
        message: 'Automated backup completed successfully',
        priority: 'low',
        data: { 
          backupId: 'BCK-' + Date.now(),
          size: '156 MB',
          tables: ['users', 'orders', 'products']
        },
        status: 'completed'
      },
      {
        type: 'newsletter',
        category: 'marketing',
        title: '📧 Monthly Newsletter',
        message: 'March 2026 newsletter has been sent to 2,547 subscribers',
        priority: 'low',
        data: { 
          campaignId: 'NL-0326',
          sent: 2547,
          openRate: 42,
          clickRate: 18
        },
        status: 'completed'
      }
    ];

    // Create notifications with different timestamps
    for (let i = 0; i < notifications.length; i++) {
      const notif = notifications[i];
      
      // Spread out timestamps over the last 7 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(i / 2)); // Spread over days
      createdAt.setHours(createdAt.getHours() - i * 2); // Spread over hours

      await Notification.create({
        recipient: adminUser._id,
        recipientModel: 'AdminVendor',
        recipientRole: adminUser.role,
        ...notif,
        channels: ['in_app', 'email'],
        createdAt,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      console.log(`   [${i + 1}/${notifications.length}] ✅ Created: ${notif.title}`);
    }

    console.log(`\n✅ Successfully created ${notifications.length} mock notifications!\n`);

    // Get summary
    const unreadCount = await Notification.countDocuments({ 
      recipient: adminUser._id, 
      isRead: false 
    });

    const byPriority = await Notification.aggregate([
      { $match: { recipient: adminUser._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const byCategory = await Notification.aggregate([
      { $match: { recipient: adminUser._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 SUMMARY:');
    console.log(`   Total Notifications: ${notifications.length}`);
    console.log(`   Unread: ${unreadCount}`);
    
    console.log('\n📊 BY PRIORITY:');
    byPriority.forEach(p => {
      console.log(`   ${p._id?.toUpperCase() || 'NORMAL'}: ${p.count}`);
    });

    console.log('\n📊 BY CATEGORY:');
    byCategory.forEach(c => {
      console.log(`   ${c._id}: ${c.count}`);
    });

  } catch (error) {
    console.error('❌ Error creating mock notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function
createMockNotifications();