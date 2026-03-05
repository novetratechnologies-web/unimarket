// test-notifications.js - Get Unread Notifications
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AdminVendor from '../models/AdminVendor.js';

dotenv.config();

async function getUnreadNotifications() {
  console.log('🔔 UNREAD NOTIFICATIONS TEST');
  console.log('============================\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unimarket');
    console.log('✅ Connected to MongoDB\n');

    // Get a test user
    console.log('👤 Finding test user...');
    let testUser = await AdminVendor.findOne({ role: 'super_admin' });
    if (!testUser) {
      testUser = await User.findOne();
    }
    
    if (!testUser) {
      console.error('❌ No test user found. Please create a user first.');
      process.exit(1);
    }
    console.log(`✅ Found test user: ${testUser.email} (${testUser._id})`);
    console.log(`   Role: ${testUser.role || 'admin'}\n`);

    // Get unread notifications count
    console.log('📊 UNREAD NOTIFICATIONS COUNT');
    const unreadCount = await Notification.countDocuments({ 
      recipient: testUser._id, 
      isRead: false,
      isDeleted: false,
      isArchived: false
    });
    console.log(`📊 Total unread: ${unreadCount}\n`);

    if (unreadCount === 0) {
      console.log('✨ No unread notifications found. Creating some test notifications...\n');
      
      // Create some test notifications if none exist
      await createTestNotifications(testUser);
      
      // Get updated count
      const newUnreadCount = await Notification.countDocuments({ 
        recipient: testUser._id, 
        isRead: false,
        isDeleted: false,
        isArchived: false
      });
      console.log(`📊 New unread count: ${newUnreadCount}\n`);
    }

    // Get all unread notifications with details
    console.log('📋 UNREAD NOTIFICATIONS LIST');
    const unreadNotifications = await Notification.find({ 
      recipient: testUser._id, 
      isRead: false,
      isDeleted: false,
      isArchived: false
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    if (unreadNotifications.length === 0) {
      console.log('📭 No unread notifications to display');
    } else {
      console.log(`📋 Found ${unreadNotifications.length} unread notifications:\n`);
      
      unreadNotifications.forEach((notif, index) => {
        console.log(`[${index + 1}] 📨 NOTIFICATION`);
        console.log(`    ID: ${notif._id}`);
        console.log(`    Title: ${notif.title}`);
        console.log(`    Message: ${notif.message}`);
        console.log(`    Type: ${notif.type}`);
        console.log(`    Category: ${notif.category}`);
        console.log(`    Priority: ${notif.priority?.toUpperCase() || 'NORMAL'}`);
        console.log(`    Created: ${new Date(notif.createdAt).toLocaleString()}`);
        console.log(`    Status: ${notif.status || 'pending'}`);
        if (notif.data) {
          console.log(`    Data: ${JSON.stringify(notif.data, null, 2)}`);
        }
        console.log('    ---');
      });
    }

    console.log('\n============================');
    console.log('📊 SUMMARY');
    console.log(`   Total Unread: ${unreadCount}`);
    
    // Get breakdown by priority
    const priorityBreakdown = await Notification.aggregate([
      { 
        $match: { 
          recipient: testUser._id, 
          isRead: false,
          isDeleted: false,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 BREAKDOWN BY PRIORITY:');
    priorityBreakdown.forEach(item => {
      const priority = item._id || 'normal';
      console.log(`   ${priority.toUpperCase()}: ${item.count}`);
    });

    // Get breakdown by category
    const categoryBreakdown = await Notification.aggregate([
      { 
        $match: { 
          recipient: testUser._id, 
          isRead: false,
          isDeleted: false,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 BREAKDOWN BY CATEGORY:');
    categoryBreakdown.forEach(item => {
      console.log(`   ${item._id || 'other'}: ${item.count}`);
    });

    // Get notifications by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUnread = await Notification.countDocuments({
      recipient: testUser._id,
      isRead: false,
      isDeleted: false,
      isArchived: false,
      createdAt: { $gte: today }
    });
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekUnread = await Notification.countDocuments({
      recipient: testUser._id,
      isRead: false,
      isDeleted: false,
      isArchived: false,
      createdAt: { $gte: weekAgo }
    });
    
    console.log('\n📊 BY TIMEFRAME:');
    console.log(`   Today: ${todayUnread}`);
    console.log(`   Last 7 days: ${weekUnread}`);
    console.log(`   Older: ${unreadCount - weekUnread}`);

    // Option to mark all as read
    console.log('\n🔧 OPTIONS:');
    console.log('1. Run with --mark-read to mark all as read');
    console.log('2. Run with --create to create test notifications');
    
    if (process.argv.includes('--mark-read')) {
      console.log('\n📝 Marking all as read...');
      const result = await Notification.updateMany(
        { recipient: testUser._id, isRead: false },
        { isRead: true, readAt: new Date(), status: 'read' }
      );
      console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

async function createTestNotifications(user) {
  const testNotifications = [
    {
      type: 'order_created',
      category: 'order',
      title: 'New Order #12345',
      message: 'A new order has been placed for KSh 5,000',
      priority: 'high',
      data: { orderId: '12345', amount: 5000 }
    },
    {
      type: 'system_alert',
      category: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance in 2 hours',
      priority: 'normal',
      data: { maintenanceTime: new Date() }
    },
    {
      type: 'payment_received',
      category: 'payment',
      title: 'Payment Received',
      message: 'Payment of KSh 2,500 has been received',
      priority: 'normal',
      data: { transactionId: 'TXN123', amount: 2500 }
    },
    {
      type: 'low_stock',
      category: 'inventory',
      title: 'Low Stock Alert',
      message: 'Product "Classic T-Shirt" is running low',
      priority: 'high',
      data: { productId: 'PROD1', quantity: 5 }
    },
    {
      type: 'vendor_application',
      category: 'vendor',
      title: 'New Vendor Application',
      message: 'A new vendor has applied to join',
      priority: 'medium',
      data: { vendorId: 'VEND1', name: 'New Vendor' }
    }
  ];

  console.log('📝 Creating test notifications...');
  
  for (const notif of testNotifications) {
    await Notification.create({
      recipient: user._id,
      recipientModel: user.constructor.modelName,
      recipientRole: user.role || 'admin',
      ...notif,
      channels: ['in_app'],
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    console.log(`   ✅ Created: ${notif.title}`);
  }
  
  console.log(`✅ Created ${testNotifications.length} test notifications\n`);
}

// Run the function
getUnreadNotifications();