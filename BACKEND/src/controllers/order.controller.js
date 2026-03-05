import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import AdminVendor from '../models/AdminVendor.js';
import ActivityLog from '../models/ActivityLog.js';
import DashboardStats from '../models/DashboardStats.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/email.js';
import { generateOrderNumber, calculateTax, calculateShipping } from '../utils/order.js';
import { createAuditLog } from '../middleware/audit.js';
import redis from '../config/redis.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Stripe from 'stripe';
import Paypal from '@paypal/checkout-server-sdk';

// Initialize payment providers
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

// ============================================
// ORDER CRUD OPERATIONS
// ============================================

/**
 * @desc    Create Order
 * @route   POST /api/orders
 * @access  Private (Customer) / Public (Guest)
 */
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderData = req.body;
    const userId = req.user?._id;

    // ============================================
    // 1. VALIDATE & PROCESS ORDER DATA
    // ============================================

    // Generate order number
    orderData.orderNumber = await generateOrderNumber();

    // Set customer info
    if (userId) {
      orderData.customer = userId;
    } else {
      // Guest checkout - validate email
      if (!orderData.guestEmail && !orderData.shippingAddress?.email) {
        throw new Error('Email is required for guest checkout');
      }
      orderData.guestEmail = orderData.guestEmail || orderData.shippingAddress?.email;
      orderData.guestDetails = {
        firstName: orderData.shippingAddress?.firstName,
        lastName: orderData.shippingAddress?.lastName,
        email: orderData.guestEmail,
        phone: orderData.shippingAddress?.phone
      };
    }

    // ============================================
    // 2. VALIDATE ITEMS & CHECK INVENTORY
    // ============================================

    const { items, vendorGroups } = await processOrderItems(orderData.items, session);
    orderData.items = items.map(item => item._id);
    orderData.itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    orderData.uniqueItemCount = items.length;

    // ============================================
    // 3. GROUP BY VENDOR
    // ============================================

    orderData.vendors = await Promise.all(
      Object.entries(vendorGroups).map(async ([vendorId, vendorItems]) => {
        const vendor = await AdminVendor.findById(vendorId).session(session);
        
        // Calculate vendor totals
        const subtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = vendorItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const shipping = await calculateShipping(vendorItems, orderData.shippingAddress);
        const tax = await calculateTax(vendorItems, orderData.shippingAddress);
        const total = subtotal - discount + shipping + tax;
        
        // Calculate commission
        const commissionRate = vendor.vendorProfile?.commission?.rate || 10;
        const commission = (subtotal - discount) * (commissionRate / 100);
        const vendorEarnings = total - commission;

        return {
          vendor: vendorId,
          storeName: vendor.vendorProfile?.storeName,
          storeSlug: vendor.vendorProfile?.storeSlug,
          items: vendorItems.map(item => item._id),
          subtotal,
          discount,
          shipping,
          tax,
          total,
          commission,
          commissionRate,
          vendorEarnings,
          status: 'pending',
          paymentStatus: 'pending',
          fulfillmentStatus: 'unfulfilled',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      })
    );

    // ============================================
    // 4. CALCULATE ORDER TOTALS
    // ============================================

    orderData.subtotal = orderData.vendors.reduce((sum, v) => sum + v.subtotal, 0);
    orderData.subtotalBeforeDiscounts = orderData.subtotal;
    orderData.discountTotal = orderData.vendors.reduce((sum, v) => sum + v.discount, 0);
    orderData.shippingTotal = orderData.vendors.reduce((sum, v) => sum + v.shipping, 0);
    orderData.taxTotal = orderData.vendors.reduce((sum, v) => sum + v.tax, 0);
    orderData.total = orderData.vendors.reduce((sum, v) => sum + v.total, 0);

    // ============================================
    // 5. APPLY COUPONS & DISCOUNTS
    // ============================================

    if (orderData.coupons?.length > 0) {
      const discountResult = await applyCoupons(orderData, session);
      orderData.discounts = discountResult.discounts;
      orderData.discountTotal += discountResult.totalDiscount;
      orderData.total -= discountResult.totalDiscount;
    }

    // ============================================
    // 6. CREATE ORDER
    // ============================================

    const order = new Order(orderData);
    
    // Add status history
    order.statusHistory.push({
      status: 'pending',
      note: 'Order created',
      changedBy: userId,
      changedAt: new Date()
    });

    await order.save({ session });

    // ============================================
    // 7. UPDATE INVENTORY
    // ============================================

    await Promise.all(
      items.map(item => 
        Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { 
              quantity: -item.quantity,
              reservedQuantity: -item.quantity
            },
            $push: {
              'sales.daily': {
                date: new Date(),
                quantity: item.quantity,
                revenue: item.price * item.quantity
              }
            }
          },
          { session }
        )
      )
    );

    await session.commitTransaction();

    // ============================================
    // 8. SEND NOTIFICATIONS
    // ============================================

    await Promise.all([
      sendOrderConfirmation(order),
      notifyVendorsNewOrder(order),
      notifyAdminsNewOrder(order)
    ]);

    // ============================================
    // 9. AUDIT LOG
    // ============================================

    await createAuditLog({
      user: userId || order.guestEmail,
      action: 'create',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Order created: ${order.orderNumber}`,
      metadata: { total: order.total, items: order.itemCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear relevant caches
    await clearOrderCaches();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        paymentIntent: orderData.paymentIntent,
        redirectUrl: orderData.redirectUrl
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get All Orders (with filters) - OPTIMIZED VERSION
 * @route   GET /api/orders
 * @access  Private (Admin/Vendor - filtered)
 */
export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      paymentStatus,
      fulfillmentStatus,
      vendor,
      customer,
      minTotal,
      maxTotal,
      startDate,
      endDate,
      tags,
      source
    } = req.query;

    // Build query
    const query = { isDeleted: false };
    
    // Role-based access
    if (req.user.role === 'vendor') {
      query['vendors.vendor'] = req.user._id;
    } else if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Apply filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fulfillmentStatus) query.fulfillmentStatus = fulfillmentStatus;
    if (vendor && req.user.role === 'admin') {
      query['vendors.vendor'] = vendor;
    }
    if (customer && req.user.role === 'admin') {
      query.customer = customer;
    }
    if (minTotal || maxTotal) {
      query.total = {};
      if (minTotal) query.total.$gte = parseFloat(minTotal);
      if (maxTotal) query.total.$lte = parseFloat(maxTotal);
    }
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    if (source) query.source = source;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination with limits
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100); // Never more than 100
    const skip = (pageNum - 1) * limitNum;

    // Determine best index
    let hint = {};
    if (req.user.role === 'vendor') {
      hint = { 'vendors.vendor': 1, orderDate: -1 };
    } else if (req.user.role === 'customer') {
      hint = { customer: 1, orderDate: -1 };
    } else {
      hint = { orderDate: -1 };
    }

    // ✅ OPTIMIZED: Execute query with timeout and field selection
    const ordersPromise = Order.find(query)
      .select({
        orderNumber: 1,
        orderDate: 1,
        total: 1,
        status: 1,
        paymentStatus: 1,
        fulfillmentStatus: 1,
        itemCount: 1,
        customer: 1,
        guestEmail: 1,
        guestDetails: 1,
        'vendors.vendor': 1,
        'vendors.status': 1,
        'vendors.total': 1
      })
      .sort(search ? { score: { $meta: 'textScore' } } : sort)
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'firstName lastName email')
      .populate('vendors.vendor', 'vendorProfile.storeName')
      .hint(hint)
      .maxTimeMS(5000) // Kill after 5 seconds
      .lean();

    const countPromise = Order.countDocuments(query)
      .hint(hint)
      .maxTimeMS(3000);

    // Use Promise.allSettled to handle partial failures
    const [ordersResult, totalResult] = await Promise.allSettled([ordersPromise, countPromise]);

    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
    const total = totalResult.status === 'fulfilled' ? totalResult.value : 0;

    // Get statistics (cached)
    let statistics = {};
    try {
      const cacheKey = `order-stats-${JSON.stringify(query)}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        statistics = JSON.parse(cached);
      } else {
        statistics = await getOrderStatistics(query);
        await redis.setEx(cacheKey, 300, JSON.stringify(statistics)); // Cache for 5 minutes
      }
    } catch (statsError) {
      console.warn('Failed to get order statistics:', statsError.message);
    }

    // Log slow queries
    if (ordersResult.status === 'rejected') {
      console.error('❌ Orders query failed:', ordersResult.reason?.message);
    }

    res.json({
      success: true,
      data: orders,
      statistics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      _debug: process.env.NODE_ENV === 'development' ? {
        queryTime: ordersResult.status === 'fulfilled' ? 'success' : 'failed'
      } : undefined
    });
  } catch (error) {
    console.error('Get orders error:', error);
    
    // Always return something, even on error
    res.json({
      success: true,
      data: [],
      statistics: {
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageOrderValue: 0,
        paidOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      },
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 20),
        total: 0,
        pages: 0
      }
    });
  }
};

/**
 * @desc    Get Single Order
 * @route   GET /api/orders/:id
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('vendors.vendor', 'vendorProfile.storeName vendorProfile.storeSlug vendorProfile.branding.logo')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name slug sku price images'
        }
      })
      .populate('payments.processedBy', 'firstName lastName')
      .populate('refunds.processedBy', 'firstName lastName')
      .populate('statusHistory.changedBy', 'firstName lastName email')
      .populate('adminNotes.createdBy', 'firstName lastName email')
      .populate('vendorNotes.createdBy', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor') {
      const hasVendor = order.vendors.some(v => 
        v.vendor._id.toString() === userId.toString()
      );
      if (!hasVendor) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order'
        });
      }
    }

    if (userRole === 'customer') {
      if (!order.customer || order.customer._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order'
        });
      }
    }

    // Get tracking information
    const trackingInfo = await getTrackingInfo(order);

    res.json({
      success: true,
      data: {
        ...order.toJSON(),
        trackingInfo
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * @desc    Get Order by Order Number
 * @route   GET /api/orders/number/:orderNumber
 * @access  Public (with verification)
 */
export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    const order = await Order.findOne({
      orderNumber,
      isDeleted: false
    })
      .populate('items.product', 'name slug images')
      .populate('vendors.vendor', 'vendorProfile.storeName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify email for guest orders
    if (order.isGuest && order.guestEmail !== email) {
      return res.status(403).json({
        success: false,
        message: 'Invalid email for this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * @desc    Update Order Status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin/Vendor - authorized)
 */
export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, note, cancellation } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(id).session(session);

    if (!order || order.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor') {
      const hasVendor = order.vendors.some(v => 
        v.vendor.toString() === userId.toString()
      );
      if (!hasVendor) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'You can only update orders for your store'
        });
      }

      // Vendor can only update their own vendor status, not the whole order
      const vendorIndex = order.vendors.findIndex(v => 
        v.vendor.toString() === userId.toString()
      );

      if (vendorIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Vendor not found in this order'
        });
      }

      // Update vendor status
      order.vendors[vendorIndex].status = status;
      order.vendors[vendorIndex].statusHistory.push({
        status,
        note: note || `Status updated by vendor`,
        changedBy: userId,
        changedAt: new Date()
      });
      order.vendors[vendorIndex].updatedAt = new Date();

      // Update order fulfillment status based on all vendors
      const vendorStatuses = order.vendors.map(v => v.status);
      if (vendorStatuses.every(s => s === 'delivered')) {
        order.fulfillmentStatus = 'fulfilled';
      } else if (vendorStatuses.some(s => ['shipped', 'delivered'].includes(s)) &&
                 vendorStatuses.some(s => ['pending', 'processing'].includes(s))) {
        order.fulfillmentStatus = 'partially_fulfilled';
      }

    } else {
      // Admin can update entire order
      await order.updateStatus(status, {
        note,
        changedBy: userId,
        cancellation
      });
    }

    await order.save({ session });
    await session.commitTransaction();

    // Send notifications
    if (status === 'cancelled') {
      await sendOrderCancellationNotification(order);
    } else if (status === 'delivered') {
      await sendOrderDeliveredNotification(order);
    }

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Order status updated to ${status}`,
      metadata: { oldStatus: order.status, newStatus: status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearOrderCaches(id);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Update Payment Status
 * @route   PUT /api/orders/:id/payment
 * @access  Private (Admin/System)
 */
export const updatePaymentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, transactionId, provider, amount } = req.body;
    const userId = req.user?._id;

    const order = await Order.findById(id).session(session);

    if (!order || order.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Add payment
    if (amount) {
      await order.addPayment({
        transactionId,
        provider,
        amount,
        status: 'completed',
        processedBy: userId
      });
    }

    // Update payment status
    order.paymentStatus = status;
    order.paymentStatusHistory.push({
      status,
      note: `Payment status updated to ${status}`,
      changedAt: new Date(),
      changedBy: userId
    });

    await order.save({ session });
    await session.commitTransaction();

    // Update vendor payment statuses
    if (status === 'paid') {
      order.vendors.forEach(vendor => {
        vendor.paymentStatus = 'paid';
      });
      await order.save();
    }

    // Send notification
    if (status === 'paid') {
      await sendPaymentConfirmation(order);
    }

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Payment status updated to ${status}`,
      metadata: { transactionId, provider, amount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Add Tracking Information
 * @route   POST /api/orders/:id/tracking
 * @access  Private (Vendor/Admin)
 */
export const addTracking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const trackingData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(id).session(session);

    if (!order || order.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    let vendorId = userId;
    if (userRole === 'admin' && trackingData.vendorId) {
      vendorId = trackingData.vendorId;
    }

    await order.addTracking(vendorId, trackingData);
    await order.save({ session });
    await session.commitTransaction();

    // Send notification
    await sendTrackingNotification(order, trackingData);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Tracking added for order`,
      metadata: { trackingNumber: trackingData.trackingNumber, carrier: trackingData.carrier },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Tracking information added successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Add tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tracking information',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Update Tracking Information
 * @route   PUT /api/orders/tracking/:trackingNumber
 * @access  Private (System/Webhook)
 */
export const updateTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const trackingData = req.body;

    const order = await Order.findOne({
      'shippingTracking.trackingNumber': trackingNumber,
      isDeleted: false
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this tracking number'
      });
    }

    await order.updateTracking(trackingNumber, trackingData);
    await order.save();

    // Send notification on delivery
    if (trackingData.status === 'delivered') {
      await sendOrderDeliveredNotification(order);
    }

    res.json({
      success: true,
      message: 'Tracking information updated successfully'
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tracking information',
      error: error.message
    });
  }
};

// ============================================
// REFUND OPERATIONS
// ============================================

/**
 * @desc    Process Refund
 * @route   POST /api/orders/:id/refund
 * @access  Private (Admin/Vendor - authorized)
 */
export const processRefund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const refundData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(id)
      .populate('items')
      .session(session);

    if (!order || order.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor') {
      const hasVendor = order.vendors.some(v => 
        v.vendor.toString() === userId.toString()
      );
      if (!hasVendor) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'You can only refund orders for your store'
        });
      }

      // Filter items to only this vendor's items
      const vendorItems = order.items.filter(item => 
        item.vendor.toString() === userId.toString()
      );
      refundData.items = refundData.items.filter(item => 
        vendorItems.some(vi => vi._id.toString() === item.orderItem.toString())
      );
    }

    // Process refund through payment provider
    let paymentRefund;
    if (order.paymentProvider === 'stripe' && stripe) {
      paymentRefund = await stripe.refunds.create({
        payment_intent: order.payments[0]?.transactionId,
        amount: Math.round(refundData.amount * 100)
      });
    }

    // Process refund in our system
    await order.processRefund({
      ...refundData,
      refundId: paymentRefund?.id,
      processedBy: userId
    });

    // Update order items status
    if (refundData.items && refundData.items.length > 0) {
      await Promise.all(
        refundData.items.map(async (item) => {
          const orderItem = await OrderItem.findById(item.orderItem).session(session);
          if (orderItem) {
            orderItem.status = 'refunded';
            orderItem.refundedQuantity = item.quantity;
            orderItem.refundedAmount = item.amount;
            orderItem.refundReason = refundData.reason;
            orderItem.refundedAt = new Date();
            await orderItem.save({ session });

            // Restore inventory
            await Product.findByIdAndUpdate(
              orderItem.product,
              { $inc: { quantity: item.quantity } },
              { session }
            );
          }
        })
      );
    }

    await order.save({ session });
    await session.commitTransaction();

    // Send notification
    await sendRefundNotification(order, refundData);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'refund',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Refund processed for order ${order.orderNumber}`,
      metadata: { amount: refundData.amount, reason: refundData.reason },
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund: order.refunds[order.refunds.length - 1],
        order
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get Refund Status
 * @route   GET /api/orders/:id/refunds
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
export const getRefunds = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(id)
      .select('refunds orderNumber total totalRefunded')
      .populate('refunds.processedBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor') {
      const hasVendor = order.vendors.some(v => 
        v.vendor.toString() === userId.toString()
      );
      if (!hasVendor) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view refunds for this order'
        });
      }
    }

    if (userRole === 'customer') {
      if (!order.customer || order.customer.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view refunds for this order'
        });
      }
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        total: order.total,
        totalRefunded: order.totalRefunded,
        refunds: order.refunds
      }
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refunds',
      error: error.message
    });
  }
};

// ============================================
// CUSTOMER ORDER MANAGEMENT
// ============================================

/**
 * @desc    Get My Orders (Customer)
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {
      customer: req.user._id,
      isDeleted: false
    };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('orderNumber total status paymentStatus fulfillmentStatus orderDate shippingTracking items')
        .populate('items.product', 'name slug images'),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel My Order (Customer)
 * @route   POST /api/orders/:id/cancel
 * @access  Private (Customer)
 */
export const cancelMyOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      customer: userId,
      isDeleted: false
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!order.canCancel()) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    await order.updateStatus('cancelled', {
      note: reason || 'Cancelled by customer',
      changedBy: userId,
      cancellation: {
        cancelledBy: userId,
        cancelledAt: new Date(),
        reason: reason || 'Customer request',
        reasonCode: 'customer_request'
      }
    });

    // Restore inventory
    const orderItems = await OrderItem.find({ order: order._id }).session(session);
    await Promise.all(
      orderItems.map(item =>
        Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
          { session }
        )
      )
    );

    await order.save({ session });
    await session.commitTransaction();

    // Process refund if payment was made
    if (order.totalPaid > 0) {
      await processRefund({
        params: { id: order._id },
        body: {
          amount: order.totalPaid,
          reason: 'order_cancelled',
          reasonText: reason || 'Order cancelled by customer'
        },
        user: req.user
      }, {
        json: () => {}
      });
    }

    // Send notification
    await sendOrderCancellationNotification(order);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// VENDOR ORDER MANAGEMENT
// ============================================

/**
 * @desc    Get Vendor Orders
 * @route   GET /api/orders/vendor
 * @access  Private (Vendor)
 */
export const getVendorOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    const match = {
      'vendors.vendor': req.user._id,
      isDeleted: false
    };

    if (status) match['vendors.status'] = status;
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: match },
      { $unwind: '$vendors' },
      { $match: { 'vendors.vendor': req.user._id } },
      {
        $lookup: {
          from: 'orderitems',
          localField: 'vendors.items',
          foreignField: '_id',
          as: 'vendorItems'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'vendorItems.product',
          foreignField: '_id',
          as: 'products'
        }
      },
      {
        $project: {
          orderNumber: 1,
          orderDate: 1,
          customer: 1,
          guestDetails: 1,
          shippingAddress: 1,
          vendor: '$vendors',
          items: '$vendorItems',
          products: 1,
          total: '$vendors.total',
          subtotal: '$vendors.subtotal',
          shipping: '$vendors.shipping',
          tax: '$vendors.tax',
          commission: '$vendors.commission',
          vendorEarnings: '$vendors.vendorEarnings',
          status: '$vendors.status',
          paymentStatus: '$vendors.paymentStatus',
          fulfillmentStatus: '$vendors.fulfillmentStatus',
          tracking: '$vendors.tracking',
          createdAt: 1
        }
      }
    ];

    // Text search
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'guestDetails.email': { $regex: search, $options: 'i' } },
            { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
            { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Sort
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const [orders, total] = await Promise.all([
      Order.aggregate(pipeline),
      Order.countDocuments(match)
    ]);

    // Get statistics
    const statistics = await Order.aggregate([
      { $match: match },
      { $unwind: '$vendors' },
      { $match: { 'vendors.vendor': req.user._id } },
      {
        $group: {
          _id: '$vendors.status',
          count: { $sum: 1 },
          total: { $sum: '$vendors.total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: orders,
      statistics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor orders',
      error: error.message
    });
  }
};

/**
 * @desc    Update Vendor Order Status
 * @route   PUT /api/orders/vendor/:id/status
 * @access  Private (Vendor)
 */
export const updateVendorOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, note, tracking } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(id).session(session);

    if (!order || order.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const vendorIndex = order.vendors.findIndex(v => 
      v.vendor.toString() === userId.toString()
    );

    if (vendorIndex === -1) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }

    // Update vendor status
    order.vendors[vendorIndex].status = status;
    order.vendors[vendorIndex].statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      changedBy: userId,
      changedAt: new Date()
    });
    order.vendors[vendorIndex].updatedAt = new Date();

    // Add tracking if provided
    if (tracking) {
      order.vendors[vendorIndex].tracking.push({
        ...tracking,
        shippedAt: new Date(),
        lastUpdated: new Date()
      });
      
      order.shippingTracking.push({
        ...tracking,
        shippedAt: new Date(),
        lastUpdated: new Date()
      });
    }

    // Update order fulfillment status
    const vendorStatuses = order.vendors.map(v => v.status);
    if (vendorStatuses.every(s => s === 'delivered')) {
      order.fulfillmentStatus = 'fulfilled';
    } else if (vendorStatuses.some(s => ['shipped', 'delivered'].includes(s)) &&
               vendorStatuses.some(s => ['pending', 'processing'].includes(s))) {
      order.fulfillmentStatus = 'partially_fulfilled';
    }

    await order.save({ session });
    await session.commitTransaction();

    // Send notification to customer
    if (status === 'shipped' && tracking) {
      await sendTrackingNotification(order, tracking);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order.vendors[vendorIndex]
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update vendor order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @desc    Bulk Update Orders
 * @route   POST /api/orders/bulk
 * @access  Private (Admin)
 */
export const bulkUpdateOrders = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderIds, action, data } = req.body;
    const userId = req.user._id;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }

    let updateData = {};
    let result;

    switch (action) {
      case 'update-status':
        updateData = {
          status: data.status,
          updatedAt: new Date(),
          $push: {
            statusHistory: {
              status: data.status,
              note: data.note || 'Bulk status update',
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'update-payment-status':
        updateData = {
          paymentStatus: data.paymentStatus,
          updatedAt: new Date(),
          $push: {
            paymentStatusHistory: {
              status: data.paymentStatus,
              note: data.note || 'Bulk payment status update',
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'add-tags':
        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { $addToSet: { tags: { $each: data.tags } } },
          { session }
        );
        break;

      case 'remove-tags':
        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { $pull: { tags: { $in: data.tags } } },
          { session }
        );
        break;

      case 'delete':
        updateData = {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: data.reason || 'Bulk delete'
        };
        break;

      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    if (!result) {
      result = await Order.updateMany(
        { _id: { $in: orderIds } },
        updateData,
        { session }
      );
    }

    await session.commitTransaction();

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'bulk_update',
      resourceType: 'order',
      status: 'success',
      description: `Bulk ${action} on ${result.modifiedCount} orders`,
      metadata: { orderIds, action, data },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearOrderCaches();

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} orders`,
      data: result
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk update orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update orders',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Export Orders
 * @route   GET /api/orders/export
 * @access  Private (Admin)
 */
export const exportOrders = async (req, res) => {
  try {
    const {
      format = 'csv',
      fields,
      startDate,
      endDate,
      status,
      paymentStatus
    } = req.query;

    // Build query
    const query = {
      isDeleted: false,
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(startDate || endDate) && {
        orderDate: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      }
    };

    // Select fields
    const selectFields = fields ? fields.split(',') : [
      'orderNumber',
      'orderDate',
      'customerName',
      'customerEmail',
      'subtotal',
      'discountTotal',
      'shippingTotal',
      'taxTotal',
      'total',
      'paymentStatus',
      'fulfillmentStatus',
      'status'
    ];

    const orders = await Order.find(query)
      .select(selectFields.join(' '))
      .populate('customer', 'firstName lastName email')
      .lean();

    // Format data for export
    const exportData = orders.map(order => ({
      ...order,
      customerName: order.customerName || order.guestDetails?.firstName + ' ' + order.guestDetails?.lastName,
      customerEmail: order.customerEmail || order.guestEmail,
      orderDate: new Date(order.orderDate).toISOString().split('T')[0]
    }));

    // Export based on format
    switch (format) {
      case 'csv':
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        return res.send(csv);

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');
        
        // Add headers
        worksheet.columns = Object.keys(exportData[0] || {}).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        
        // Add data
        worksheet.addRows(exportData);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
        
        await workbook.xlsx.write(res);
        return res.end();

      case 'pdf':
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const filename = `orders-${Date.now()}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        doc.pipe(res);
        
        // Title
        doc.fontSize(18).text('Orders Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Table
        const tableTop = 150;
        const tableHeaders = ['Order #', 'Date', 'Customer', 'Total', 'Status'];
        const columnWidths = [100, 80, 150, 80, 100];
        
        let y = tableTop;
        
        // Headers
        doc.font('Helvetica-Bold');
        let x = 30;
        tableHeaders.forEach((header, i) => {
          doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
          x += columnWidths[i];
        });
        
        // Data
        doc.font('Helvetica');
        y += 20;
        
        exportData.slice(0, 50).forEach((order, index) => {
          x = 30;
          doc.text(order.orderNumber || '', x, y, { width: columnWidths[0] });
          x += columnWidths[0];
          doc.text(order.orderDate || '', x, y, { width: columnWidths[1] });
          x += columnWidths[1];
          doc.text(order.customerName || order.customerEmail || '', x, y, { width: columnWidths[2] });
          x += columnWidths[2];
          doc.text(`$${order.total?.toFixed(2) || '0.00'}`, x, y, { width: columnWidths[3] });
          x += columnWidths[3];
          doc.text(order.status || '', x, y, { width: columnWidths[4] });
          
          y += 20;
          if (y > 550) {
            doc.addPage();
            y = 50;
          }
        });
        
        doc.end();
        return;

      default:
        return res.json({
          success: true,
          data: exportData,
          count: exportData.length
        });
    }
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
};

// ============================================
// ORDER ANALYTICS
// ============================================

/**
 * @desc    Get Order Analytics
 * @route   GET /api/orders/analytics
 * @access  Private (Admin)
 */
export const getOrderAnalytics = async (req, res) => {
  try {
    const {
      period = '30d',
      groupBy = 'day',
      vendor,
      startDate: customStartDate,
      endDate: customEndDate
    } = req.query;

    // Calculate date range
    const endDate = customEndDate ? new Date(customEndDate) : new Date();
    const startDate = customStartDate 
      ? new Date(customStartDate) 
      : new Date(endDate);

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '12m':
        startDate.setMonth(startDate.getMonth() - 12);
        break;
    }

    const match = {
      orderDate: { $gte: startDate, $lte: endDate },
      isDeleted: false,
      paymentStatus: { $in: ['paid', 'partially_paid'] }
    };

    if (vendor) {
      match['vendors.vendor'] = mongoose.Types.ObjectId(vendor);
    }

    // Get revenue by period
    const revenueByPeriod = await Order.aggregate([
      { $match: match },
      ...(vendor ? [{ $unwind: '$vendors' }, { $match: { 'vendors.vendor': mongoose.Types.ObjectId(vendor) } }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' },
            week: { $week: '$orderDate' }
          },
          revenue: { $sum: vendor ? '$vendors.total' : '$total' },
          orders: { $sum: 1 },
          items: { $sum: '$itemCount' },
          averageOrderValue: { $avg: vendor ? '$vendors.total' : '$total' }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          revenue: 1,
          orders: 1,
          items: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get status distribution
    const statusDistribution = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          total: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', { $sum: '$count' }] },
              100
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get payment method distribution
    const paymentMethodDistribution = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentProvider',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $project: {
          method: '$_id',
          count: 1,
          total: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get hourly distribution
    const hourlyDistribution = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: '$orderDate' },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $project: {
          hour: '$_id',
          count: 1,
          total: 1
        }
      },
      { $sort: { hour: 1 } }
    ]);

    // Get weekday distribution
    const weekdayDistribution = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dayOfWeek: '$orderDate' },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $project: {
          weekday: '$_id',
          count: 1,
          total: 1
        }
      },
      { $sort: { weekday: 1 } }
    ]);

    // Get customer acquisition
    const customerAcquisition = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$customerAcquisition.type',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          total: 1
        }
      }
    ]);

    // Get refund rate
    const refundStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRefunded: { $sum: '$totalRefunded' },
          refundCount: {
            $sum: { $cond: [{ $gt: [{ $size: '$refunds' }, 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalRevenue: revenueByPeriod.reduce((sum, p) => sum + p.revenue, 0),
          totalOrders: revenueByPeriod.reduce((sum, p) => sum + p.orders, 0),
          totalItems: revenueByPeriod.reduce((sum, p) => sum + p.items, 0),
          averageOrderValue: revenueByPeriod.reduce((sum, p) => sum + p.averageOrderValue, 0) / revenueByPeriod.length || 0,
          refundRate: refundStats[0] ? (refundStats[0].totalRefunded / refundStats[0].totalOrders) * 100 : 0,
          refundCount: refundStats[0]?.refundCount || 0
        },
        trends: revenueByPeriod,
        distribution: {
          byStatus: statusDistribution,
          byPaymentMethod: paymentMethodDistribution,
          byHour: hourlyDistribution,
          byWeekday: weekdayDistribution,
          bySource: customerAcquisition
        }
      }
    });
  } catch (error) {
    console.error('Order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order analytics',
      error: error.message
    });
  }
};

// ============================================
// PAYMENT PROCESSING
// ============================================

/**
 * @desc    Create Payment Intent
 * @route   POST /api/orders/payment-intent
 * @access  Public
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', orderId, metadata } = req.body;

    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        orderId,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

/**
 * @desc    Stripe Webhook
 * @route   POST /api/orders/webhook/stripe
 * @access  Public (Webhook)
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    case 'charge.refunded':
      const refund = event.data.object;
      await handleRefund(refund);
      break;
  }

  res.json({ received: true });
};

// ============================================
// ORDER NOTES & COMMUNICATION
// ============================================

/**
 * @desc    Add Admin Note
 * @route   POST /api/orders/:id/notes
 * @access  Private (Admin)
 */
export const addAdminNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = 'info', isPrivate = true } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.addAdminNote(note, userId, { type, isPrivate });

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'order',
      resourceId: order._id,
      status: 'success',
      description: `Admin note added to order`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      data: order.adminNotes[order.adminNotes.length - 1]
    });
  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * @desc    Get Order Timeline
 * @route   GET /api/orders/:id/timeline
 * @access  Private (Admin/Vendor/Customer - authorized)
 */
export const getOrderTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor') {
      const hasVendor = order.vendors.some(v => 
        v.vendor.toString() === userId.toString()
      );
      if (!hasVendor) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order'
        });
      }
    }

    if (userRole === 'customer') {
      if (!order.customer || order.customer.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order'
        });
      }
    }

    // Build timeline
    const timeline = [];

    // Order created
    timeline.push({
      type: 'order_created',
      title: 'Order Placed',
      description: `Order #${order.orderNumber} was placed`,
      date: order.orderDate,
      user: order.customer || 'Guest'
    });

    // Payment events
    order.payments.forEach(payment => {
      timeline.push({
        type: 'payment',
        title: 'Payment Received',
        description: `$${payment.amount} paid via ${payment.provider}`,
        date: payment.createdAt,
        metadata: payment
      });
    });

    // Status changes
    order.statusHistory.forEach(history => {
      timeline.push({
        type: 'status_change',
        title: `Status Changed to ${history.status}`,
        description: history.note,
        date: history.changedAt,
        user: history.changedBy
      });
    });

    // Vendor status changes
    order.vendors.forEach(vendor => {
      vendor.statusHistory.forEach(history => {
        timeline.push({
          type: 'vendor_status_change',
          title: `${vendor.storeName} - Status: ${history.status}`,
          description: history.note,
          date: history.changedAt,
          user: history.changedBy
        });
      });
    });

    // Tracking events
    order.shippingTracking.forEach(tracking => {
      tracking.events?.forEach(event => {
        timeline.push({
          type: 'tracking',
          title: `Package ${tracking.status}`,
          description: `${event.description} - ${event.location}`,
          date: event.date,
          metadata: { carrier: tracking.carrier, trackingNumber: tracking.trackingNumber }
        });
      });
    });

    // Refunds
    order.refunds.forEach(refund => {
      timeline.push({
        type: 'refund',
        title: 'Refund Processed',
        description: `$${refund.amount} refunded - ${refund.reason}`,
        date: refund.processedAt,
        user: refund.processedBy
      });
    });

    // Notes
    order.adminNotes.forEach(note => {
      if (userRole !== 'customer' || !note.isPrivate) {
        timeline.push({
          type: 'note',
          title: `Note: ${note.type}`,
          description: note.note,
          date: note.createdAt,
          user: note.createdBy,
          isPrivate: note.isPrivate
        });
      }
    });

    // Sort by date
    timeline.sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order timeline',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Process order items and validate inventory
 */
async function processOrderItems(items, session) {
  const processedItems = [];
  const vendorGroups = {};

  for (const item of items) {
    // Get product
    const product = await Product.findById(item.productId)
      .session(session);

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    // Check inventory
    if (product.trackQuantity && product.quantity < item.quantity) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }

    // Reserve inventory
    if (product.trackQuantity) {
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { reservedQuantity: item.quantity } },
        { session }
      );
    }

    // Create order item
    const orderItem = new OrderItem({
      order: null, // Will be set after order creation
      product: product._id,
      vendor: product.vendor,
      productSnapshot: {
        name: product.name,
        sku: product.sku,
        image: product.images?.[0]?.url,
        vendorName: product.vendor?.vendorProfile?.storeName
      },
      variant: item.variant,
      quantity: item.quantity,
      price: item.variant?.price || product.price,
      compareAtPrice: item.variant?.compareAtPrice || product.compareAtPrice,
      discount: item.discount || 0,
      tax: item.tax || 0,
      shipping: item.shipping || 0,
      total: (item.variant?.price || product.price) * item.quantity
    });

    await orderItem.save({ session });
    processedItems.push(orderItem);

    // Group by vendor
    const vendorId = product.vendor.toString();
    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = [];
    }
    vendorGroups[vendorId].push(orderItem);
  }

  return { items: processedItems, vendorGroups };
}

/**
 * Apply coupons to order
 */
async function applyCoupons(orderData, session) {
  const discounts = [];
  let totalDiscount = 0;

  // Implementation depends on your coupon system
  // This is a placeholder

  return { discounts, totalDiscount };
}

/**
 * Get order statistics
 */
async function getOrderStatistics(query) {
  const stats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalItems: { $sum: '$itemCount' },
        averageOrderValue: { $avg: '$total' },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageOrderValue: 0,
    paidOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  };
}

/**
 * Get tracking information from carriers
 */
async function getTrackingInfo(order) {
  const trackingInfo = [];

  for (const tracking of order.shippingTracking) {
    // Implement carrier API calls to get real-time tracking
    trackingInfo.push({
      ...tracking.toObject(),
      realTimeStatus: 'pending' // Placeholder
    });
  }

  return trackingInfo;
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmation(order) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Order Confirmation #${order.orderNumber}`,
    template: 'order-confirmation',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      items: order.items,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      total: order.total,
      shippingAddress: order.shippingAddress,
      trackingUrl: order.shippingTracking[0]?.trackingUrl,
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmation(order) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Payment Confirmed #${order.orderNumber}`,
    template: 'payment-confirmation',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      amount: order.totalPaid,
      paymentMethod: order.paymentMethodName,
      transactionId: order.payments[0]?.transactionId,
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Send tracking notification email
 */
async function sendTrackingNotification(order, tracking) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Your Order #${order.orderNumber} Has Shipped!`,
    template: 'order-shipped',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      estimatedDelivery: tracking.estimatedDelivery,
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Send order delivered notification
 */
async function sendOrderDeliveredNotification(order) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Your Order #${order.orderNumber} Has Been Delivered`,
    template: 'order-delivered',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      deliveredAt: order.shippingTracking[0]?.deliveredAt,
      reviewUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}/review`,
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Send order cancellation notification
 */
async function sendOrderCancellationNotification(order) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Order #${order.orderNumber} Has Been Cancelled`,
    template: 'order-cancelled',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      reason: order.cancellation?.reason,
      refundStatus: order.totalRefunded > 0 ? 'processed' : 'pending',
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Send refund notification email
 */
async function sendRefundNotification(order, refund) {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Refund Processed for Order #${order.orderNumber}`,
    template: 'refund-processed',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      amount: refund.amount,
      reason: refund.reason,
      refundDate: new Date(),
      orderUrl: `${process.env.CLIENT_URL}/order/${order.orderNumber}`
    }
  });
}

/**
 * Notify vendors of new order
 */
async function notifyVendorsNewOrder(order) {
  for (const vendorData of order.vendors) {
    const vendor = await AdminVendor.findById(vendorData.vendor);
    
    if (vendor?.notificationPreferences?.email?.orders) {
      await sendEmail({
        to: vendor.email,
        subject: `New Order Received #${order.orderNumber}`,
        template: 'vendor-new-order',
        data: {
          vendorName: vendor.firstName,
          storeName: vendor.vendorProfile?.storeName,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          items: vendorData.items,
          total: vendorData.total,
          customerName: order.customerName,
          shippingAddress: order.shippingAddress,
          orderUrl: `${process.env.VENDOR_URL}/orders/${order._id}`
        }
      });
    }
  }
}

/**
 * Notify admins of new order
 */
async function notifyAdminsNewOrder(order) {
  const admins = await AdminVendor.find({
    role: { $in: ['super_admin', 'admin'] },
    status: 'active',
    'notificationPreferences.email.orders': true
  });

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `New Order #${order.orderNumber}`,
      template: 'admin-new-order',
      data: {
        adminName: admin.firstName,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        total: order.total,
        customerName: order.customerName,
        itemCount: order.itemCount,
        vendorCount: order.vendors.length,
        orderUrl: `${process.env.ADMIN_URL}/orders/${order._id}`
      }
    });
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(paymentIntent) {
  const { orderId } = paymentIntent.metadata;
  
  const order = await Order.findById(orderId);
  if (order) {
    await updatePaymentStatus({
      params: { id: orderId },
      body: {
        status: 'paid',
        transactionId: paymentIntent.id,
        provider: 'stripe',
        amount: paymentIntent.amount / 100
      },
      user: null
    }, {
      json: () => {}
    });
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(paymentIntent) {
  const { orderId } = paymentIntent.metadata;
  
  const order = await Order.findById(orderId);
  if (order) {
    order.paymentStatus = 'failed';
    order.paymentStatusHistory.push({
      status: 'failed',
      note: `Payment failed: ${paymentIntent.last_payment_error?.message}`,
      changedAt: new Date()
    });
    await order.save();
  }
}

/**
 * Handle refund from payment provider
 */
async function handleRefund(refund) {
  const paymentIntent = await stripe.paymentIntents.retrieve(refund.payment_intent);
  const { orderId } = paymentIntent.metadata;
  
  const order = await Order.findById(orderId);
  if (order) {
    await order.processRefund({
      refundId: refund.id,
      amount: refund.amount / 100,
      reason: 'payment_provider_refund',
      status: 'completed',
      processedAt: new Date()
    });
    await order.save();
  }
}

/**
 * Clear order caches
 */
async function clearOrderCaches(orderId = null) {
  try {
    const keys = [];
    
    if (orderId) {
      keys.push(`order:${orderId}`);
    }
    
    keys.push('orders:list*', 'orders:analytics*', 'orders:vendor*');
    
    for (const key of keys) {
      const matchingKeys = await redis.keys(key);
      if (matchingKeys.length > 0) {
        await redis.del(matchingKeys);
      }
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

// ============================================
// EXPORT CONTROLLER
// ============================================

export default {
  // CRUD Operations
  createOrder,
  getOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  updatePaymentStatus,
  
  // Tracking
  addTracking,
  updateTracking,
  
  // Refunds
  processRefund,
  getRefunds,
  
  // Customer Operations
  getMyOrders,
  cancelMyOrder,
  
  // Vendor Operations
  getVendorOrders,
  updateVendorOrderStatus,
  
  // Bulk Operations
  bulkUpdateOrders,
  exportOrders,
  
  // Analytics
  getOrderAnalytics,
  
  // Payment
  createPaymentIntent,
  stripeWebhook,
  
  // Notes & Communication
  addAdminNote,
  getOrderTimeline
};