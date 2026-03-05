import Payout from '../models/Payout.js';
import Order from '../models/Order.js';
import AdminVendor from '../models/AdminVendor.js';
import ActivityLog from '../models/ActivityLog.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/email.js';
import { createAuditLog } from '../utils/audit.js';
import { generatePayoutNumber } from '../utils/payout.js';
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
// PAYOUT CRUD OPERATIONS
// ============================================

/**
 * @desc    Create Payout
 * @route   POST /api/payouts
 * @access  Private (Admin/Vendor - specific)
 */
export const createPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payoutData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // ============================================
    // 1. VALIDATE PERMISSIONS
    // ============================================
    
    if (userRole === 'vendor') {
      // Vendor can only create payout for themselves
      payoutData.vendor = userId;
    }

    // ============================================
    // 2. FETCH VENDOR DETAILS
    // ============================================
    
    const vendor = await AdminVendor.findById(payoutData.vendor).session(session);
    
    if (!vendor) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // ============================================
    // 3. CHECK ELIGIBILITY
    // ============================================
    
    // Check if vendor has completed orders in the period
    const ordersInPeriod = await Order.find({
      'vendors.vendor': vendor._id,
      'vendors.status': 'delivered',
      'vendors.paymentStatus': 'paid',
      orderDate: {
        $gte: payoutData.period.startDate,
        $lte: payoutData.period.endDate
      },
      isDeleted: false
    }).session(session);

    if (ordersInPeriod.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No eligible orders found for this period'
      });
    }

    // ============================================
    // 4. CALCULATE PAYOUT SUMMARY
    // ============================================
    
    const summary = await calculatePayoutSummary(ordersInPeriod, vendor._id);
    
    // Check minimum payout threshold
    const minPayout = vendor.vendorProfile?.banking?.payoutSchedule?.minimumAmount || 50;
    if (summary.netAmount < minPayout) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payout amount $${summary.netAmount.toFixed(2)} is below minimum threshold of $${minPayout}`,
        minimum: minPayout,
        current: summary.netAmount
      });
    }

    // ============================================
    // 5. CREATE PAYOUT
    // ============================================
    
    const payout = new Payout({
      ...payoutData,
      payoutNumber: await generatePayoutNumber(),
      vendor: vendor._id,
      vendorDetails: {
        storeName: vendor.vendorProfile?.storeName,
        storeSlug: vendor.vendorProfile?.storeSlug,
        email: vendor.email,
        phone: vendor.phoneNumber,
        bankDetails: vendor.vendorProfile?.banking?.primaryBank,
        paypalEmail: vendor.vendorProfile?.banking?.paypal?.email,
        stripeAccountId: vendor.vendorProfile?.banking?.stripe?.accountId
      },
      summary,
      orders: ordersInPeriod.map(order => {
        const vendorData = order.vendors.find(v => 
          v.vendor.toString() === vendor._id.toString()
        );
        return {
          order: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          subtotal: vendorData.subtotal,
          discount: vendorData.discount,
          shipping: vendorData.shipping,
          tax: vendorData.tax,
          total: vendorData.total,
          commission: vendorData.commission,
          commissionRate: vendorData.commissionRate,
          vendorEarnings: vendorData.vendorEarnings,
          status: vendorData.status,
          paymentStatus: vendorData.paymentStatus,
          paidAt: order.paidAt
        };
      }),
      status: 'draft',
      approval: {
        required: userRole === 'vendor' ? true : false,
        status: userRole === 'vendor' ? 'pending' : 'approved',
        requestedBy: userId,
        requestedAt: new Date()
      }
    });

    await payout.save({ session });
    await session.commitTransaction();

    // ============================================
    // 6. SEND NOTIFICATIONS
    // ============================================
    
    if (userRole === 'vendor') {
      await notifyAdminsPayoutRequest(payout, vendor);
    } else {
      await notifyVendorPayoutCreated(payout, vendor);
    }

    // ============================================
    // 7. AUDIT LOG
    // ============================================
    
    await createAuditLog({
      user: userId,
      action: 'create',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Payout created: ${payout.payoutNumber}`,
      metadata: { 
        amount: payout.summary.netAmount, 
        period: payout.period,
        vendor: vendor._id 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearPayoutCaches();

    res.status(201).json({
      success: true,
      message: userRole === 'vendor' 
        ? 'Payout request submitted for approval' 
        : 'Payout created successfully',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get All Payouts
 * @route   GET /api/payouts
 * @access  Private (Admin/Vendor - filtered)
 */
export const getPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      vendor,
      periodStart,
      periodEnd,
      minAmount,
      maxAmount,
      paymentMethod
    } = req.query;

    // Build query
    const query = { isDeleted: false };
    
    // Role-based access
    if (req.user.role === 'vendor') {
      query.vendor = req.user._id;
    } else if (req.user.role === 'admin' && vendor) {
      query.vendor = vendor;
    }

    // Apply filters
    if (status) {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    
    if (paymentMethod) {
      query['paymentMethod.type'] = paymentMethod;
    }
    
    if (periodStart || periodEnd) {
      query['period.startDate'] = {};
      if (periodStart) query['period.startDate'].$gte = new Date(periodStart);
      if (periodEnd) query['period.endDate'].$lte = new Date(periodEnd);
    }
    
    if (minAmount || maxAmount) {
      query['summary.netAmount'] = {};
      if (minAmount) query['summary.netAmount'].$gte = parseFloat(minAmount);
      if (maxAmount) query['summary.netAmount'].$lte = parseFloat(maxAmount);
    }

    // Text search
    if (search) {
      query.$or = [
        { payoutNumber: { $regex: search, $options: 'i' } },
        { 'vendorDetails.storeName': { $regex: search, $options: 'i' } },
        { 'vendorDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('vendor', 'firstName lastName email vendorProfile.storeName')
        .populate('approval.approvedBy', 'firstName lastName email')
        .populate('approval.rejectedBy', 'firstName lastName email')
        .lean(),
      Payout.countDocuments(query)
    ]);

    // Get statistics
    const statistics = await getPayoutStatistics(query);

    res.json({
      success: true,
      data: payouts,
      statistics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
};

/**
 * @desc    Get Single Payout
 * @route   GET /api/payouts/:id
 * @access  Private (Admin/Vendor - authorized)
 */
export const getPayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const payout = await Payout.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('vendor', 'firstName lastName email phone vendorProfile')
      .populate('orders.order', 'orderNumber orderDate customer guestDetails')
      .populate('approval.approvedBy', 'firstName lastName email')
      .populate('approval.rejectedBy', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email')
      .populate('summary.commission.breakdown.orderId', 'orderNumber');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor' && payout.vendor._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own payouts'
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    console.error('Get payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout',
      error: error.message
    });
  }
};

/**
 * @desc    Get Payout by Payout Number
 * @route   GET /api/payouts/number/:payoutNumber
 * @access  Private (Admin/Vendor - authorized)
 */
export const getPayoutByNumber = async (req, res) => {
  try {
    const { payoutNumber } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const payout = await Payout.findOne({
      payoutNumber,
      isDeleted: false
    }).populate('vendor', 'firstName lastName email vendorProfile.storeName');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor' && payout.vendor._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own payouts'
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    console.error('Get payout by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout',
      error: error.message
    });
  }
};

/**
 * @desc    Update Payout
 * @route   PUT /api/payouts/:id
 * @access  Private (Admin only)
 */
export const updatePayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const payout = await Payout.findById(id).session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Only admin can update
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only admins can update payouts'
      });
    }

    // Can only update draft or pending payouts
    if (!['draft', 'pending', 'approved'].includes(payout.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot update payout in ${payout.status} status`
      });
    }

    // Track changes
    const changes = [];

    // Update allowed fields
    const allowedUpdates = [
      'paymentMethod', 'bankDetails', 'paypalDetails', 'stripeDetails',
      'checkDetails', 'scheduling.scheduledDate', 'notes', 'metadata'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const oldValue = payout[field];
        const newValue = updates[field];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field, oldValue, newValue });
          
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            payout[parent][child] = newValue;
          } else {
            payout[field] = newValue;
          }
        }
      }
    });

    // Update adjustments if provided
    if (updates.adjustments) {
      for (const adjustment of updates.adjustments) {
        await payout.addAdjustment(adjustment, userId);
      }
      changes.push({ 
        field: 'adjustments', 
        oldValue: 'Previous adjustments', 
        newValue: 'New adjustments added' 
      });
    }

    payout.updatedAt = new Date();
    await payout.save({ session });
    await session.commitTransaction();

    // Audit log
    if (changes.length > 0) {
      await createAuditLog({
        user: userId,
        action: 'update',
        resourceType: 'payout',
        resourceId: payout._id,
        status: 'success',
        description: `Updated payout: ${payout.payoutNumber}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // Clear caches
    await clearPayoutCaches(id);

    res.json({
      success: true,
      message: 'Payout updated successfully',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Delete Payout (Soft Delete)
 * @route   DELETE /api/payouts/:id
 * @access  Private (Admin only)
 */
export const deletePayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, permanent } = req.body;
    const userId = req.user._id;

    const payout = await Payout.findById(id).session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete payouts'
      });
    }

    // Can only delete draft or pending payouts
    if (!['draft', 'pending', 'failed', 'cancelled'].includes(payout.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot delete payout in ${payout.status} status`
      });
    }

    if (permanent) {
      // Permanent delete
      await Payout.findByIdAndDelete(id).session(session);
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'payout',
        resourceId: payout._id,
        status: 'success',
        description: `Permanently deleted payout: ${payout.payoutNumber}`,
        metadata: { reason },
        severity: 'critical',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } else {
      // Soft delete
      await payout.softDelete(userId, reason || 'Manual deletion');
      await payout.save({ session });
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'payout',
        resourceId: payout._id,
        status: 'success',
        description: `Soft deleted payout: ${payout.payoutNumber}`,
        metadata: { reason },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    await session.commitTransaction();

    // Clear caches
    await clearPayoutCaches(id);

    res.json({
      success: true,
      message: permanent ? 'Payout permanently deleted' : 'Payout moved to trash'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Restore Deleted Payout
 * @route   POST /api/payouts/:id/restore
 * @access  Private (Admin only)
 */
export const restorePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const payout = await Payout.findOne({
      _id: id,
      isDeleted: true
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found in trash'
      });
    }

    await payout.restore();

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Restored payout: ${payout.payoutNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearPayoutCaches(id);

    res.json({
      success: true,
      message: 'Payout restored successfully',
      data: payout
    });
  } catch (error) {
    console.error('Restore payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore payout',
      error: error.message
    });
  }
};

// ============================================
// PAYOUT APPROVAL WORKFLOW
// ============================================

/**
 * @desc    Approve Payout
 * @route   POST /api/payouts/:id/approve
 * @access  Private (Admin only)
 */
export const approvePayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    const payout = await Payout.findById(id)
      .populate('vendor')
      .session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check if payout is pending approval
    if (payout.approval.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payout is not pending approval. Current status: ${payout.approval.status}`
      });
    }

    // Check minimum payout threshold
    const minPayout = payout.vendor.vendorProfile?.banking?.payoutSchedule?.minimumAmount || 50;
    if (payout.summary.netAmount < minPayout) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payout amount $${payout.summary.netAmount.toFixed(2)} is below minimum threshold of $${minPayout}`,
        minimum: minPayout,
        current: payout.summary.netAmount
      });
    }

    // Approve payout
    await payout.approve(userId, notes);
    await payout.save({ session });

    // Generate invoice
    await payout.generateInvoice();

    await session.commitTransaction();

    // Notify vendor
    await notifyVendorPayoutApproved(payout, payout.vendor);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'approve',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Approved payout: ${payout.payoutNumber}`,
      metadata: { amount: payout.summary.netAmount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearPayoutCaches(id);

    res.json({
      success: true,
      message: 'Payout approved successfully',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Approve payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Reject Payout
 * @route   POST /api/payouts/:id/reject
 * @access  Private (Admin only)
 */
export const rejectPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const userId = req.user._id;

    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const payout = await Payout.findById(id)
      .populate('vendor')
      .session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check if payout is pending approval
    if (payout.approval.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payout is not pending approval. Current status: ${payout.approval.status}`
      });
    }

    // Reject payout
    await payout.reject(reason, userId);
    if (notes) {
      payout.approval.notes = notes;
    }
    await payout.save({ session });
    await session.commitTransaction();

    // Notify vendor
    await notifyVendorPayoutRejected(payout, payout.vendor, reason, notes);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'reject',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Rejected payout: ${payout.payoutNumber}`,
      metadata: { reason },
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearPayoutCaches(id);

    res.json({
      success: true,
      message: 'Payout rejected successfully',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Reject payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Process Payout
 * @route   POST /api/payouts/:id/process
 * @access  Private (Admin only)
 */
export const processPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { paymentMethod, metadata } = req.body;
    const userId = req.user._id;

    const payout = await Payout.findById(id)
      .populate('vendor')
      .session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check if payout is approved
    if (payout.status !== 'approved') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payout must be approved before processing. Current status: ${payout.status}`
      });
    }

    // Set payment method
    if (paymentMethod) {
      payout.paymentMethod = paymentMethod;
    }

    // Process based on payment method
    let transactionData = {};

    switch (payout.paymentMethod.type) {
      case 'stripe':
        if (!stripe) {
          await session.abortTransaction();
          return res.status(503).json({
            success: false,
            message: 'Stripe payment service not configured'
          });
        }
        
        // Process Stripe payout
        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.summary.netAmount * 100),
          currency: payout.bankDetails?.currency?.toLowerCase() || 'usd',
          destination: payout.vendorDetails?.stripeAccountId,
          transfer_group: `payout_${payout.payoutNumber}`,
          metadata: {
            payoutId: payout._id.toString(),
            payoutNumber: payout.payoutNumber,
            vendorId: payout.vendor._id.toString(),
            vendorEmail: payout.vendor.email,
            ...metadata
          }
        });
        
        transactionData = {
          id: transfer.id,
          reference: transfer.balance_transaction,
          provider: 'stripe',
          metadata: transfer
        };
        break;

      case 'paypal':
        // Process PayPal payout
        // Implementation depends on PayPal SDK
        transactionData = {
          id: `paypal_${Date.now()}`,
          provider: 'paypal',
          metadata: { status: 'pending' }
        };
        break;

      case 'bank_transfer':
      case 'check':
      case 'cash':
        // Manual payment methods
        transactionData = {
          id: `manual_${Date.now()}`,
          provider: 'manual',
          metadata: { processedBy: userId }
        };
        break;
    }

    // Update payout with transaction data
    payout.transaction = {
      ...payout.transaction,
      ...transactionData,
      status: 'processing',
      initiatedAt: new Date()
    };

    await payout.process(userId);
    await payout.save({ session });
    await session.commitTransaction();

    // Notify vendor
    await notifyVendorPayoutProcessing(payout, payout.vendor);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Processed payout: ${payout.payoutNumber}`,
      metadata: { 
        paymentMethod: payout.paymentMethod.type,
        transactionId: transactionData.id 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Payout processing initiated',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Complete Payout
 * @route   POST /api/payouts/:id/complete
 * @access  Private (Admin/System)
 */
export const completePayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { transactionId, metadata } = req.body;
    const userId = req.user?._id;

    const payout = await Payout.findById(id)
      .populate('vendor')
      .session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Mark as paid
    await payout.markAsPaid({
      id: transactionId || payout.transaction.id,
      status: 'completed',
      completedAt: new Date(),
      metadata
    }, userId);

    await payout.save({ session });
    await session.commitTransaction();

    // Notify vendor
    await notifyVendorPayoutCompleted(payout, payout.vendor);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Completed payout: ${payout.payoutNumber}`,
      metadata: { 
        transactionId: transactionId || payout.transaction.id,
        amount: payout.summary.netAmount
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Payout completed successfully',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Complete payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete payout',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Fail Payout
 * @route   POST /api/payouts/:id/fail
 * @access  Private (Admin/System)
 */
export const failPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, metadata } = req.body;
    const userId = req.user?._id;

    const payout = await Payout.findById(id).session(session);

    if (!payout || payout.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Mark as failed
    await payout.markAsFailed(reason || 'Payment processing failed', userId);
    if (metadata) {
      payout.transaction.metadata = metadata;
    }
    await payout.save({ session });
    await session.commitTransaction();

    // Notify vendor
    await notifyVendorPayoutFailed(payout, payout.vendor, reason);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Payout failed: ${payout.payoutNumber}`,
      metadata: { reason },
      severity: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Payout marked as failed',
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Fail payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as failed',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// VENDOR PAYOUT OPERATIONS
// ============================================

/**
 * @desc    Get My Payouts (Vendor)
 * @route   GET /api/payouts/my-payouts
 * @access  Private (Vendor)
 */
export const getMyPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {
      vendor: req.user._id,
      isDeleted: false
    };

    if (status) query.status = status;
    if (startDate || endDate) {
      query['period.startDate'] = {};
      if (startDate) query['period.startDate'].$gte = new Date(startDate);
      if (endDate) query['period.endDate'].$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('payoutNumber period summary.netAmount status paymentMethod createdAt paidAt'),
      Payout.countDocuments(query)
    ]);

    // Get earnings summary
    const earnings = await Payout.aggregate([
      { $match: { vendor: req.user._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$summary.netAmount', 0] }
          },
          totalPending: {
            $sum: { 
              $cond: [
                { $in: ['$status', ['draft', 'pending', 'approved', 'processing']] },
                '$summary.netAmount',
                0
              ]
            }
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$summary.netAmount', 0] }
          },
          payoutCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: payouts,
      earnings: earnings[0] || {
        totalPaid: 0,
        totalPending: 0,
        totalFailed: 0,
        payoutCount: 0,
        paidCount: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your payouts',
      error: error.message
    });
  }
};

/**
 * @desc    Request Payout (Vendor)
 * @route   POST /api/payouts/request
 * @access  Private (Vendor)
 */
export const requestPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { periodStart, periodEnd } = req.body;
    const vendorId = req.user._id;

    // Check if vendor has pending payout request
    const existingPending = await Payout.findOne({
      vendor: vendorId,
      status: { $in: ['draft', 'pending', 'approved', 'processing'] },
      isDeleted: false
    }).session(session);

    if (existingPending) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You already have a pending payout request',
        pendingPayout: existingPending.payoutNumber
      });
    }

    // Create payout request
    const payoutData = {
      period: {
        startDate: periodStart || new Date(new Date().setDate(1)), // First day of current month
        endDate: periodEnd || new Date(), // Today
        type: 'custom'
      }
    };

    // Use createPayout logic
    req.body = payoutData;
    req.user.role = 'vendor';
    
    return createPayout(req, res);
  } catch (error) {
    await session.abortTransaction();
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request payout',
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
 * @desc    Bulk Update Payouts
 * @route   POST /api/payouts/bulk
 * @access  Private (Admin only)
 */
export const bulkUpdatePayouts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payoutIds, action, data } = req.body;
    const userId = req.user._id;

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payout IDs are required'
      });
    }

    let updateData = {};
    let result;

    switch (action) {
      case 'approve':
        updateData = {
          'approval.status': 'approved',
          'approval.approvedBy': userId,
          'approval.approvedAt': new Date(),
          status: 'approved',
          updatedAt: new Date(),
          $push: {
            statusHistory: {
              status: 'approved',
              note: data.note || 'Bulk approval',
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'reject':
        updateData = {
          'approval.status': 'rejected',
          'approval.rejectedBy': userId,
          'approval.rejectedAt': new Date(),
          'approval.rejectionReason': data.reason,
          status: 'cancelled',
          updatedAt: new Date(),
          $push: {
            statusHistory: {
              status: 'cancelled',
              note: `Bulk rejection: ${data.reason}`,
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'process':
        updateData = {
          status: 'processing',
          'transaction.status': 'processing',
          'transaction.initiatedAt': new Date(),
          updatedAt: new Date(),
          $push: {
            statusHistory: {
              status: 'processing',
              note: 'Bulk processing initiated',
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'schedule':
        updateData = {
          'scheduling.scheduledDate': data.scheduledDate,
          updatedAt: new Date(),
          $push: {
            statusHistory: {
              status: 'approved',
              note: `Bulk schedule: ${new Date(data.scheduledDate).toLocaleDateString()}`,
              changedBy: userId,
              changedAt: new Date()
            }
          }
        };
        break;

      case 'delete':
        updateData = {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: data.reason || 'Bulk delete',
          status: 'cancelled',
          updatedAt: new Date()
        };
        break;

      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    result = await Payout.updateMany(
      { _id: { $in: payoutIds } },
      updateData,
      { session }
    );

    await session.commitTransaction();

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'bulk_update',
      resourceType: 'payout',
      status: 'success',
      description: `Bulk ${action} on ${result.modifiedCount} payouts`,
      metadata: { payoutIds, action, data },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearPayoutCaches();

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} payouts`,
      data: result
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk update payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update payouts',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Export Payouts
 * @route   GET /api/payouts/export
 * @access  Private (Admin only)
 */
export const exportPayouts = async (req, res) => {
  try {
    const {
      format = 'csv',
      fields,
      status,
      vendor,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {
      isDeleted: false,
      ...(status && { status }),
      ...(vendor && { vendor }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      }
    };

    // Select fields
    const selectFields = fields ? fields.split(',') : [
      'payoutNumber',
      'vendorDetails.storeName',
      'vendorDetails.email',
      'period.startDate',
      'period.endDate',
      'summary.netAmount',
      'summary.totalSales',
      'summary.totalOrders',
      'summary.commission.amount',
      'status',
      'paymentMethod.type',
      'paidAt',
      'createdAt'
    ];

    const payouts = await Payout.find(query)
      .select(selectFields.join(' '))
      .populate('vendor', 'email vendorProfile.storeName')
      .lean();

    // Format data for export
    const exportData = payouts.map(payout => ({
      payoutNumber: payout.payoutNumber,
      storeName: payout.vendorDetails?.storeName || payout.vendor?.vendorProfile?.storeName,
      vendorEmail: payout.vendorDetails?.email || payout.vendor?.email,
      periodStart: new Date(payout.period?.startDate).toISOString().split('T')[0],
      periodEnd: new Date(payout.period?.endDate).toISOString().split('T')[0],
      netAmount: payout.summary?.netAmount || 0,
      totalSales: payout.summary?.totalSales || 0,
      totalOrders: payout.summary?.totalOrders || 0,
      commission: payout.summary?.commission?.amount || 0,
      status: payout.status,
      paymentMethod: payout.paymentMethod?.type || 'N/A',
      paidDate: payout.paidAt ? new Date(payout.paidAt).toISOString().split('T')[0] : 'N/A',
      createdDate: new Date(payout.createdAt).toISOString().split('T')[0]
    }));

    // Export based on format
    switch (format) {
      case 'csv':
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payouts.csv');
        return res.send(csv);

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payouts');
        
        // Add headers
        worksheet.columns = Object.keys(exportData[0] || {}).map(key => ({
          header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          key: key,
          width: 20
        }));
        
        // Add data
        worksheet.addRows(exportData);
        
        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=payouts.xlsx');
        
        await workbook.xlsx.write(res);
        return res.end();

      case 'pdf':
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const filename = `payouts-${Date.now()}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        doc.pipe(res);
        
        // Title
        doc.fontSize(18).text('Payouts Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Summary
        const totalAmount = exportData.reduce((sum, p) => sum + p.netAmount, 0);
        const totalPaid = exportData.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netAmount, 0);
        const totalPending = exportData.filter(p => ['pending', 'approved', 'processing'].includes(p.status))
          .reduce((sum, p) => sum + p.netAmount, 0);
        
        doc.fontSize(12).text(`Total Payouts: ${exportData.length}`);
        doc.fontSize(12).text(`Total Amount: $${totalAmount.toFixed(2)}`);
        doc.fontSize(12).text(`Paid Amount: $${totalPaid.toFixed(2)}`);
        doc.fontSize(12).text(`Pending Amount: $${totalPending.toFixed(2)}`);
        doc.moveDown(2);
        
        // Table
        const tableTop = 200;
        const tableHeaders = ['Payout #', 'Store', 'Period', 'Amount', 'Status', 'Date'];
        const columnWidths = [100, 120, 100, 80, 80, 100];
        
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
        
        exportData.slice(0, 50).forEach((payout, index) => {
          x = 30;
          doc.text(payout.payoutNumber || '', x, y, { width: columnWidths[0] });
          x += columnWidths[0];
          doc.text((payout.storeName || '').substring(0, 20), x, y, { width: columnWidths[1] });
          x += columnWidths[1];
          doc.text(`${payout.periodStart} to ${payout.periodEnd}`, x, y, { width: columnWidths[2] });
          x += columnWidths[2];
          doc.text(`$${payout.netAmount.toFixed(2)}`, x, y, { width: columnWidths[3] });
          x += columnWidths[3];
          doc.text(payout.status || '', x, y, { width: columnWidths[4] });
          x += columnWidths[4];
          doc.text(payout.paidDate || payout.createdDate, x, y, { width: columnWidths[5] });
          
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
    console.error('Export payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payouts',
      error: error.message
    });
  }
};

// ============================================
// PAYOUT ANALYTICS
// ============================================

/**
 * @desc    Get Payout Analytics
 * @route   GET /api/payouts/analytics
 * @access  Private (Admin)
 */
export const getPayoutAnalytics = async (req, res) => {
  try {
    const {
      period = '30d',
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
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false
    };

    if (vendor) {
      match.vendor = mongoose.Types.ObjectId(vendor);
    }

    // Get payout trends by period
    const payoutTrends = await Payout.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$summary.netAmount' },
          commission: { $sum: '$summary.commission.amount' }
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
          count: 1,
          amount: { $round: ['$amount', 2] },
          commission: { $round: ['$commission', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get status distribution
    const statusDistribution = await Payout.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$summary.netAmount' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          amount: { $round: ['$amount', 2] },
          percentage: {
            $multiply: [
              { $divide: ['$count', { $sum: '$count' }] },
              100
            ]
          }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get payment method distribution
    const paymentMethodDistribution = await Payout.aggregate([
      { $match: { ...match, 'paymentMethod.type': { $exists: true } } },
      {
        $group: {
          _id: '$paymentMethod.type',
          count: { $sum: 1 },
          amount: { $sum: '$summary.netAmount' }
        }
      },
      {
        $project: {
          method: '$_id',
          count: 1,
          amount: { $round: ['$amount', 2] }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get vendor performance
    const vendorPerformance = await Payout.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$vendor',
          totalPayouts: { $sum: 1 },
          totalAmount: { $sum: '$summary.netAmount' },
          averagePayout: { $avg: '$summary.netAmount' },
          lastPayout: { $max: '$paidAt' }
        }
      },
      {
        $lookup: {
          from: 'adminvendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      { $unwind: '$vendorInfo' },
      {
        $project: {
          _id: 1,
          storeName: '$vendorInfo.vendorProfile.storeName',
          email: '$vendorInfo.email',
          totalPayouts: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          averagePayout: { $round: ['$averagePayout', 2] },
          lastPayout: 1
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Get summary statistics
    const summary = await Payout.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          totalAmount: { $sum: '$summary.netAmount' },
          totalCommission: { $sum: '$summary.commission.amount' },
          totalOrders: { $sum: '$summary.totalOrders' },
          totalSales: { $sum: '$summary.totalSales' },
          averagePayout: { $avg: '$summary.netAmount' },
          paidPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$summary.netAmount', 0] }
          },
          pendingPayouts: {
            $sum: { 
              $cond: [
                { $in: ['$status', ['draft', 'pending', 'approved', 'processing']] },
                1,
                0
              ]
            }
          },
          pendingAmount: {
            $sum: { 
              $cond: [
                { $in: ['$status', ['draft', 'pending', 'approved', 'processing']] },
                '$summary.netAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: summary[0] || {
          totalPayouts: 0,
          totalAmount: 0,
          totalCommission: 0,
          totalOrders: 0,
          totalSales: 0,
          averagePayout: 0,
          paidPayouts: 0,
          paidAmount: 0,
          pendingPayouts: 0,
          pendingAmount: 0
        },
        trends: payoutTrends,
        statusDistribution,
        paymentMethodDistribution,
        topVendors: vendorPerformance
      }
    });
  } catch (error) {
    console.error('Payout analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payout analytics',
      error: error.message
    });
  }
};

// ============================================
// PAYOUT NOTES
// ============================================

/**
 * @desc    Add Note to Payout
 * @route   POST /api/payouts/:id/notes
 * @access  Private (Admin/Vendor - authorized)
 */
export const addPayoutNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = 'info', isPrivate = false, attachments } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const payout = await Payout.findById(id);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor' && payout.vendor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only add notes to your own payouts'
      });
    }

    await payout.addNote({
      note,
      type,
      isPrivate: userRole === 'admin' ? isPrivate : false, // Only admin can make private notes
      attachments
    }, userId);

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'payout',
      resourceId: payout._id,
      status: 'success',
      description: `Added note to payout: ${payout.payoutNumber}`,
      metadata: { noteType: type, isPrivate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      data: payout.notes[payout.notes.length - 1]
    });
  } catch (error) {
    console.error('Add payout note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * @desc    Get Payout Timeline
 * @route   GET /api/payouts/:id/timeline
 * @access  Private (Admin/Vendor - authorized)
 */
export const getPayoutTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const payout = await Payout.findById(id)
      .populate('vendor', 'firstName lastName email')
      .populate('statusHistory.changedBy', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email')
      .populate('approval.approvedBy', 'firstName lastName email')
      .populate('approval.rejectedBy', 'firstName lastName email');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Check authorization
    if (userRole === 'vendor' && payout.vendor._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this timeline'
      });
    }

    // Build timeline
    const timeline = [];

    // Payout created
    timeline.push({
      type: 'payout_created',
      title: 'Payout Created',
      description: `Payout #${payout.payoutNumber} was created`,
      date: payout.createdAt,
      user: payout.createdBy || 'System'
    });

    // Status changes
    payout.statusHistory.forEach(history => {
      timeline.push({
        type: 'status_change',
        title: `Status Changed to ${history.status}`,
        description: history.note || `Payout status updated to ${history.status}`,
        date: history.changedAt,
        user: history.changedBy
      });
    });

    // Approval events
    if (payout.approval?.approvedAt) {
      timeline.push({
        type: 'approval',
        title: 'Payout Approved',
        description: payout.approval.notes || 'Payout was approved',
        date: payout.approval.approvedAt,
        user: payout.approval.approvedBy
      });
    }

    if (payout.approval?.rejectedAt) {
      timeline.push({
        type: 'rejection',
        title: 'Payout Rejected',
        description: payout.approval.rejectionReason || 'Payout was rejected',
        date: payout.approval.rejectedAt,
        user: payout.approval.rejectedBy
      });
    }

    // Payment events
    if (payout.transaction?.initiatedAt) {
      timeline.push({
        type: 'payment',
        title: 'Payment Initiated',
        description: `Payment processing started via ${payout.paymentMethod?.type}`,
        date: payout.transaction.initiatedAt
      });
    }

    if (payout.paidAt) {
      timeline.push({
        type: 'payment_completed',
        title: 'Payment Completed',
        description: `Payment of ${payout.formattedNetAmount} was completed`,
        date: payout.paidAt
      });
    }

    if (payout.transaction?.failedAt) {
      timeline.push({
        type: 'payment_failed',
        title: 'Payment Failed',
        description: payout.transaction.failureReason || 'Payment processing failed',
        date: payout.transaction.failedAt
      });
    }

    // Notes
    payout.notes.forEach(note => {
      if (userRole === 'admin' || !note.isPrivate) {
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

    // Adjustments
    payout.summary?.adjustments?.items?.forEach(adjustment => {
      timeline.push({
        type: 'adjustment',
        title: `${adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)} Adjustment`,
        description: `${adjustment.reason}: $${adjustment.amount.toFixed(2)}`,
        date: adjustment.createdAt,
        user: adjustment.createdBy
      });
    });

    // Sort by date (newest first)
    timeline.sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get payout timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payout timeline',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate payout summary from orders
 */
async function calculatePayoutSummary(orders, vendorId) {
  const summary = {
    totalOrders: orders.length,
    totalItems: 0,
    subtotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grossRevenue: 0,
    commission: {
      rate: 0,
      amount: 0,
      breakdown: []
    },
    refunds: {
      total: 0,
      count: 0,
      items: []
    },
    netAmount: 0
  };

  let totalCommissionRate = 0;

  orders.forEach(order => {
    const vendorData = order.vendors.find(v => 
      v.vendor.toString() === vendorId.toString()
    );

    if (vendorData) {
      summary.subtotal += vendorData.subtotal || 0;
      summary.discountTotal += vendorData.discount || 0;
      summary.shippingTotal += vendorData.shipping || 0;
      summary.taxTotal += vendorData.tax || 0;
      summary.grossRevenue += vendorData.total || 0;
      
      summary.commission.amount += vendorData.commission || 0;
      totalCommissionRate += vendorData.commissionRate || 0;
      
      summary.commission.breakdown.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: vendorData.total || 0,
        rate: vendorData.commissionRate || 0,
        calculated: vendorData.commission || 0
      });

      // Count items
      summary.totalItems += vendorData.items?.length || 0;
    }
  });

  // Calculate average commission rate
  summary.commission.rate = summary.totalOrders > 0 
    ? totalCommissionRate / summary.totalOrders 
    : 0;

  // Calculate net amount
  summary.netAmount = summary.grossRevenue - summary.commission.amount;

  return summary;
}

/**
 * Get payout statistics
 */
async function getPayoutStatistics(query) {
  const stats = await Payout.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalPayouts: { $sum: 1 },
        totalAmount: { $sum: '$summary.netAmount' },
        totalCommission: { $sum: '$summary.commission.amount' },
        totalOrders: { $sum: '$summary.totalOrders' },
        averagePayout: { $avg: '$summary.netAmount' },
        
        // Status breakdown
        draftPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        pendingPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        processingPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
        },
        paidPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        failedPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        cancelledPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        
        // Amount by status
        draftAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, '$summary.netAmount', 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$summary.netAmount', 0] }
        },
        approvedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$summary.netAmount', 0] }
        },
        processingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$summary.netAmount', 0] }
        },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$summary.netAmount', 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalPayouts: 0,
    totalAmount: 0,
    totalCommission: 0,
    totalOrders: 0,
    averagePayout: 0,
    draftPayouts: 0,
    pendingPayouts: 0,
    approvedPayouts: 0,
    processingPayouts: 0,
    paidPayouts: 0,
    failedPayouts: 0,
    cancelledPayouts: 0,
    draftAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    processingAmount: 0,
    paidAmount: 0
  };
}

/**
 * Clear payout caches
 */
async function clearPayoutCaches(payoutId = null) {
  try {
    const keys = [];
    
    if (payoutId) {
      keys.push(`payout:${payoutId}`);
    }
    
    keys.push('payouts:list*', 'payouts:analytics*', 'payouts:vendor*');
    
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
// NOTIFICATION FUNCTIONS
// ============================================

/**
 * Notify admins of payout request
 */
async function notifyAdminsPayoutRequest(payout, vendor) {
  const admins = await AdminVendor.find({
    role: { $in: ['super_admin', 'admin'] },
    status: 'active',
    'notificationPreferences.email.payouts': true
  });

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `New Payout Request: ${payout.payoutNumber}`,
      template: 'admin-payout-request',
      data: {
        adminName: admin.firstName,
        vendorName: vendor.vendorProfile?.storeName || vendor.firstName,
        payoutNumber: payout.payoutNumber,
        amount: payout.summary.netAmount,
        periodStart: payout.period.startDate,
        periodEnd: payout.period.endDate,
        orderCount: payout.summary.totalOrders,
        requestDate: payout.createdAt,
        approvalUrl: `${process.env.ADMIN_URL}/payouts/${payout._id}`
      }
    });
  }
}

/**
 * Notify vendor payout created
 */
async function notifyVendorPayoutCreated(payout, vendor) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Created: ${payout.payoutNumber}`,
    template: 'vendor-payout-created',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      periodStart: payout.period.startDate,
      periodEnd: payout.period.endDate,
      orderCount: payout.summary.totalOrders,
      status: payout.status,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`
    }
  });
}

/**
 * Notify vendor payout approved
 */
async function notifyVendorPayoutApproved(payout, vendor) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Approved: ${payout.payoutNumber}`,
    template: 'vendor-payout-approved',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      scheduledDate: payout.scheduling?.scheduledDate,
      paymentMethod: payout.paymentMethod?.type,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`,
      invoiceUrl: payout.invoice?.url
    }
  });
}

/**
 * Notify vendor payout rejected
 */
async function notifyVendorPayoutRejected(payout, vendor, reason, notes) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Request Update: ${payout.payoutNumber}`,
    template: 'vendor-payout-rejected',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      reason: reason,
      notes: notes,
      reviewDate: payout.approval.reviewDate,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`
    }
  });
}

/**
 * Notify vendor payout processing
 */
async function notifyVendorPayoutProcessing(payout, vendor) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Processing: ${payout.payoutNumber}`,
    template: 'vendor-payout-processing',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      paymentMethod: payout.paymentMethod?.type,
      initiatedAt: payout.transaction.initiatedAt,
      transactionId: payout.transaction.id,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`
    }
  });
}

/**
 * Notify vendor payout completed
 */
async function notifyVendorPayoutCompleted(payout, vendor) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Completed: ${payout.payoutNumber}`,
    template: 'vendor-payout-completed',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      paymentMethod: payout.paymentMethod?.type,
      completedAt: payout.paidAt,
      transactionId: payout.transaction.id,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`,
      invoiceUrl: payout.invoice?.url
    }
  });
}

/**
 * Notify vendor payout failed
 */
async function notifyVendorPayoutFailed(payout, vendor, reason) {
  await sendEmail({
    to: vendor.email,
    subject: `Payout Failed: ${payout.payoutNumber}`,
    template: 'vendor-payout-failed',
    data: {
      vendorName: vendor.firstName,
      storeName: vendor.vendorProfile?.storeName,
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      reason: reason || 'Payment processing failed',
      failedAt: payout.transaction.failedAt,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`
    }
  });
}

// ============================================
// EXPORT CONTROLLER
// ============================================

export default {
  // CRUD Operations
  createPayout,
  getPayouts,
  getPayoutById,
  getPayoutByNumber,
  updatePayout,
  deletePayout,
  restorePayout,
  
  // Approval Workflow
  approvePayout,
  rejectPayout,
  processPayout,
  completePayout,
  failPayout,
  
  // Vendor Operations
  getMyPayouts,
  requestPayout,
  
  // Bulk Operations
  bulkUpdatePayouts,
  exportPayouts,
  
  // Analytics
  getPayoutAnalytics,
  
  // Notes
  addPayoutNote,
  getPayoutTimeline
};