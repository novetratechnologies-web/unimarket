import Commission from '../models/Commission.js';
import AdminVendor from '../models/AdminVendor.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ActivityLog from '../models/ActivityLog.js';
import mongoose from 'mongoose';
import { createAuditLog } from '../utils/audit.js';
import { sendEmail } from '../utils/email.js';
import redis from '../config/redis.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// ============================================
// COMMISSION CRUD OPERATIONS
// ============================================

/**
 * @desc    Create Commission
 * @route   POST /api/commissions
 * @access  Private (Admin only)
 */
export const createCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const commissionData = req.body;
    const userId = req.user._id;

    // ============================================
    // 1. VALIDATE SCOPE REQUIREMENTS
    // ============================================
    
    if (commissionData.scope === 'vendor') {
      const vendor = await AdminVendor.findById(commissionData.vendor).session(session);
      if (!vendor) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }

    if (commissionData.scope === 'category') {
      const category = await Category.findById(commissionData.category).session(session);
      if (!category) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    if (commissionData.scope === 'product') {
      const product = await Product.findById(commissionData.product).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    }

    // ============================================
    // 2. VALIDATE TIERS IF TIERED
    // ============================================
    
    if (commissionData.isTiered) {
      if (!commissionData.tiers || commissionData.tiers.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Tiered commission must have at least one tier'
        });
      }
      
      // Validate tier criteria
      for (const tier of commissionData.tiers) {
        if (!tier.criteria || !tier.criteria.type) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Each tier must have criteria defined'
          });
        }
      }
    }

    // ============================================
    // 3. CHECK FOR DUPLICATE DEFAULT
    // ============================================
    
    if (commissionData.isDefault) {
      const existingDefault = await Commission.findOne({
        scope: commissionData.scope,
        ...(commissionData.scope === 'vendor' && { vendor: commissionData.vendor }),
        ...(commissionData.scope === 'category' && { category: commissionData.category }),
        ...(commissionData.scope === 'product' && { product: commissionData.product }),
        isDefault: true,
        isDeleted: false
      }).session(session);

      if (existingDefault) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Default commission already exists for this scope'
        });
      }
    }

    // ============================================
    // 4. CREATE COMMISSION
    // ============================================
    
    commissionData.createdBy = userId;
    commissionData.updatedBy = userId;
    
    // Set approval based on scope
    if (commissionData.scope === 'global' || commissionData.scope === 'vendor') {
      commissionData.approval = {
        required: true,
        status: 'pending',
        requestedBy: userId,
        requestedAt: new Date()
      };
    } else {
      commissionData.approval = {
        required: false,
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      };
    }

    const commission = new Commission(commissionData);
    await commission.save({ session });

    // ============================================
    // 5. NOTIFY IF PENDING APPROVAL
    // ============================================
    
    if (commission.approval.status === 'pending') {
      await notifyAdminsCommissionApproval(commission, req.user);
    }

    await session.commitTransaction();

    // ============================================
    // 6. AUDIT LOG
    // ============================================
    
    await createAuditLog({
      user: userId,
      action: 'create',
      resourceType: 'commission',
      resourceId: commission._id,
      status: 'success',
      description: `Created commission: ${commission.name} (${commission.code})`,
      metadata: {
        scope: commission.scope,
        type: commission.type,
        rate: commission.rate,
        isTiered: commission.isTiered
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearCommissionCaches();

    res.status(201).json({
      success: true,
      message: commission.approval.status === 'pending' 
        ? 'Commission created and pending approval' 
        : 'Commission created successfully',
      data: commission
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get All Commissions
 * @route   GET /api/commissions
 * @access  Private (Admin/Vendor - filtered)
 */
export const getCommissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      scope,
      type,
      vendor,
      category,
      product,
      isActive,
      isDefault,
      isTiered,
      approvalStatus,
      minRate,
      maxRate,
      effectiveFrom,
      effectiveTo,
      includeInactive = false,
      includePending = false
    } = req.query;

    // ============================================
    // 1. BUILD QUERY
    // ============================================
    
    const query = { isDeleted: false };
    
    // Role-based filtering
    if (req.user.role === 'vendor') {
      query.$or = [
        { scope: 'global' },
        { scope: 'vendor', vendor: req.user._id },
        { scope: 'category', category: { $in: await getVendorCategories(req.user._id) } },
        { scope: 'product', product: { $in: await getVendorProducts(req.user._id) } }
      ];
      
      // Vendors only see approved commissions
      query['approval.status'] = 'approved';
    }

    // Apply filters
    if (scope) query.scope = scope;
    if (type) query.type = type;
    if (vendor) query.vendor = vendor;
    if (category) query.category = category;
    if (product) query.product = product;
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isDefault !== undefined) query.isDefault = isDefault === 'true';
    if (isTiered !== undefined) query.isTiered = isTiered === 'true';
    
    if (approvalStatus) query['approval.status'] = approvalStatus;
    
    if (minRate || maxRate) {
      query.rate = {};
      if (minRate) query.rate.$gte = parseFloat(minRate);
      if (maxRate) query.rate.$lte = parseFloat(maxRate);
    }
    
    if (effectiveFrom || effectiveTo) {
      query.effectiveFrom = {};
      if (effectiveFrom) query.effectiveFrom.$gte = new Date(effectiveFrom);
      if (effectiveTo) query.effectiveTo.$lte = new Date(effectiveTo);
    }

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // ============================================
    // 2. BUILD SORT
    // ============================================
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // ============================================
    // 3. EXECUTE QUERY
    // ============================================
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('vendor', 'vendorProfile.storeName email')
        .populate('category', 'name slug')
        .populate('product', 'name sku')
        .populate('createdBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .lean(),
      Commission.countDocuments(query)
    ]);

    // ============================================
    // 4. GET STATISTICS
    // ============================================
    
    const statistics = await getCommissionStatistics(query);

    res.json({
      success: true,
      data: commissions,
      statistics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
};

/**
 * @desc    Get Single Commission
 * @route   GET /api/commissions/:id
 * @access  Private (Admin/Vendor - authorized)
 */
export const getCommissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const commission = await Commission.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('vendor', 'vendorProfile.storeName email phone')
      .populate('category', 'name slug path')
      .populate('product', 'name sku price images')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('approval.requestedBy', 'firstName lastName email')
      .populate('approval.approvedBy', 'firstName lastName email')
      .populate('approval.rejectedBy', 'firstName lastName email');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    // Check authorization for vendors
    if (userRole === 'vendor') {
      if (commission.scope === 'vendor' && commission.vendor?._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own vendor-specific commissions'
        });
      }
      
      if (commission.approval.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Commission is not yet approved'
        });
      }
    }

    // Get application history summary
    const applicationSummary = {
      totalApplied: commission.performance.totalApplied,
      totalCommission: commission.performance.totalCommission,
      averageCommission: commission.performance.averageCommission,
      lastAppliedAt: commission.performance.lastAppliedAt,
      recentApplications: commission.performance.applicationHistory?.slice(-10) || []
    };

    res.json({
      success: true,
      data: {
        ...commission.toJSON(),
        applicationSummary
      }
    });
  } catch (error) {
    console.error('Get commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission',
      error: error.message
    });
  }
};

/**
 * @desc    Get Commission by Code
 * @route   GET /api/commissions/code/:code
 * @access  Private (Admin only)
 */
export const getCommissionByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const commission = await Commission.findOne({
      code: code.toUpperCase(),
      isDeleted: false
    })
      .populate('vendor', 'vendorProfile.storeName')
      .populate('category', 'name')
      .populate('product', 'name');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Get commission by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission',
      error: error.message
    });
  }
};

/**
 * @desc    Update Commission
 * @route   PUT /api/commissions/:id
 * @access  Private (Admin only)
 */
export const updateCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const commission = await Commission.findById(id).session(session);

    if (!commission || commission.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    // ============================================
    // 1. TRACK CHANGES
    // ============================================
    
    const changes = [];

    // ============================================
    // 2. CHECK FOR DEFAULT CONFLICT
    // ============================================
    
    if (updates.isDefault && !commission.isDefault) {
      const existingDefault = await Commission.findOne({
        scope: commission.scope,
        ...(commission.scope === 'vendor' && { vendor: commission.vendor }),
        ...(commission.scope === 'category' && { category: commission.category }),
        ...(commission.scope === 'product' && { product: commission.product }),
        isDefault: true,
        isDeleted: false,
        _id: { $ne: id }
      }).session(session);

      if (existingDefault) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Default commission already exists for this scope'
        });
      }
    }

    // ============================================
    // 3. UPDATE FIELDS
    // ============================================
    
    const allowedUpdates = [
      'name', 'description', 'rate', 'currency', 'isTiered', 'tiers',
      'effectiveFrom', 'effectiveTo', 'isPermanent', 'priority',
      'isActive', 'isDefault', 'isStackable', 'stackPriority',
      'calculationMethod', 'calculationBasis', 'minimum', 'maximum',
      'rules', 'volumeDiscounts', 'customerTiers', 'geographic',
      'applicableProductTypes', 'applicableOrderTypes',
      'exclusions', 'overrides', 'scheduling', 'metadata', 'tags', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const oldValue = commission[field];
        const newValue = updates[field];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field, oldValue, newValue });
          commission[field] = newValue;
        }
      }
    });

    // ============================================
    // 4. CREATE VERSION SNAPSHOT
    // ============================================
    
    if (changes.length > 0) {
      await commission.createVersion(userId, 'Manual update');
    }

    commission.updatedBy = userId;
    await commission.save({ session });

    await session.commitTransaction();

    // ============================================
    // 5. AUDIT LOG
    // ============================================
    
    if (changes.length > 0) {
      await createAuditLog({
        user: userId,
        action: 'update',
        resourceType: 'commission',
        resourceId: commission._id,
        status: 'success',
        description: `Updated commission: ${commission.name} (${commission.code})`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // Clear caches
    await clearCommissionCaches(id);

    res.json({
      success: true,
      message: 'Commission updated successfully',
      data: commission
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Delete Commission (Soft Delete)
 * @route   DELETE /api/commissions/:id
 * @access  Private (Admin only)
 */
export const deleteCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, permanent } = req.body;
    const userId = req.user._id;

    const commission = await Commission.findById(id).session(session);

    if (!commission || commission.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (permanent && req.user.role === 'super_admin') {
      await Commission.findByIdAndDelete(id).session(session);
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'commission',
        resourceId: commission._id,
        status: 'success',
        description: `Permanently deleted commission: ${commission.name} (${commission.code})`,
        metadata: { reason },
        severity: 'critical',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } else {
      await commission.softDelete(userId, reason || 'Manual deletion');
      await commission.save({ session });
      
      await createAuditLog({
        user: userId,
        action: 'delete',
        resourceType: 'commission',
        resourceId: commission._id,
        status: 'success',
        description: `Soft deleted commission: ${commission.name} (${commission.code})`,
        metadata: { reason },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    await session.commitTransaction();

    // Clear caches
    await clearCommissionCaches(id);

    res.json({
      success: true,
      message: permanent ? 'Commission permanently deleted' : 'Commission moved to trash'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Restore Deleted Commission
 * @route   POST /api/commissions/:id/restore
 * @access  Private (Admin only)
 */
export const restoreCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const commission = await Commission.findOne({
      _id: id,
      isDeleted: true
    });

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found in trash'
      });
    }

    await commission.restore();

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'update',
      resourceType: 'commission',
      resourceId: commission._id,
      status: 'success',
      description: `Restored commission: ${commission.name} (${commission.code})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearCommissionCaches(id);

    res.json({
      success: true,
      message: 'Commission restored successfully',
      data: commission
    });
  } catch (error) {
    console.error('Restore commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore commission',
      error: error.message
    });
  }
};

// ============================================
// COMMISSION APPROVAL WORKFLOW
// ============================================

/**
 * @desc    Approve Commission
 * @route   POST /api/commissions/:id/approve
 * @access  Private (Admin only)
 */
export const approveCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    const commission = await Commission.findById(id).session(session);

    if (!commission || commission.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.approval.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Commission is not pending approval. Current status: ${commission.approval.status}`
      });
    }

    await commission.approve(userId, notes);
    await commission.save({ session });

    await session.commitTransaction();

    // Notify requester
    if (commission.approval.requestedBy) {
      await notifyCommissionApproved(commission, req.user);
    }

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'approve',
      resourceType: 'commission',
      resourceId: commission._id,
      status: 'success',
      description: `Approved commission: ${commission.name} (${commission.code})`,
      metadata: { notes },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearCommissionCaches(id);

    res.json({
      success: true,
      message: 'Commission approved successfully',
      data: commission
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Approve commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Reject Commission
 * @route   POST /api/commissions/:id/reject
 * @access  Private (Admin only)
 */
export const rejectCommission = async (req, res) => {
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

    const commission = await Commission.findById(id).session(session);

    if (!commission || commission.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.approval.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Commission is not pending approval. Current status: ${commission.approval.status}`
      });
    }

    await commission.reject(userId, reason);
    if (notes) {
      commission.approval.notes = notes;
    }
    await commission.save({ session });

    await session.commitTransaction();

    // Notify requester
    if (commission.approval.requestedBy) {
      await notifyCommissionRejected(commission, req.user, reason, notes);
    }

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'reject',
      resourceType: 'commission',
      resourceId: commission._id,
      status: 'success',
      description: `Rejected commission: ${commission.name} (${commission.code})`,
      metadata: { reason, notes },
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearCommissionCaches(id);

    res.json({
      success: true,
      message: 'Commission rejected successfully',
      data: commission
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Reject commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// COMMISSION CALCULATION & APPLICATION
// ============================================

/**
 * @desc    Calculate Commission
 * @route   POST /api/commissions/calculate
 * @access  Private (Admin/System)
 */
export const calculateCommission = async (req, res) => {
  try {
    const {
      amount,
      vendorId,
      productId,
      quantity = 1,
      customerTier,
      orderType = 'regular',
      productType = 'physical',
      country
    } = req.body;

    // Get applicable commissions
    const commissions = await Commission.getApplicableCommission(
      vendorId,
      'vendor',
      {
        products: productId ? [productId] : [],
        productType,
        orderType,
        country,
        date: new Date()
      }
    );

    if (!commissions || commissions.length === 0) {
      // Use global default
      const defaultCommission = await Commission.getDefaultCommission('global');
      
      if (defaultCommission) {
        const calculation = await defaultCommission.calculate(amount, {
          quantity,
          customerTier
        });
        
        return res.json({
          success: true,
          data: {
            commission: calculation.commission,
            rate: calculation.rate,
            tier: calculation.tier,
            rules: calculation.rules,
            appliedCommission: defaultCommission
          }
        });
      }
      
      return res.json({
        success: true,
        data: {
          commission: 0,
          rate: 0,
          message: 'No applicable commission found'
        }
      });
    }

    // Apply the highest priority commission
    const commission = commissions[0];
    const calculation = await commission.calculate(amount, {
      quantity,
      customerTier,
      vendorStats: await getVendorStats(vendorId)
    });

    res.json({
      success: true,
      data: {
        commission: calculation.commission,
        rate: calculation.rate,
        tier: calculation.tier,
        rules: calculation.rules,
        appliedCommission: commission,
        availableCommissions: commissions.slice(0, 3) // Return top 3 for reference
      }
    });
  } catch (error) {
    console.error('Calculate commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission',
      error: error.message
    });
  }
};

/**
 * @desc    Apply Commission to Order
 * @route   POST /api/commissions/apply
 * @access  Private (System only)
 */
export const applyCommission = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orderId,
      vendorId,
      productId,
      amount,
      quantity = 1
    } = req.body;

    // Get applicable commission
    const commissions = await Commission.getApplicableCommission(
      vendorId,
      'vendor',
      {
        products: productId ? [productId] : [],
        date: new Date()
      }
    );

    if (!commissions || commissions.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'No applicable commission found'
      });
    }

    // Apply the highest priority commission
    const commission = commissions[0];
    const calculation = await commission.apply(
      { _id: orderId, orderNumber: `ORD-${Date.now()}` },
      vendorId,
      productId,
      amount
    );

    await commission.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: {
        commission: calculation.commission,
        rate: calculation.rate,
        tier: calculation.tier,
        commissionId: commission._id,
        commissionCode: commission.code
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Apply commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply commission',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// VENDOR COMMISSION OPERATIONS
// ============================================

/**
 * @desc    Get My Commissions (Vendor)
 * @route   GET /api/commissions/my-commissions
 * @access  Private (Vendor)
 */
export const getMyCommissions = async (req, res) => {
  try {
    const vendorId = req.user._id;
    
    const {
      page = 1,
      limit = 20,
      status = 'active'
    } = req.query;

    const query = {
      isDeleted: false,
      isActive: status === 'active',
      'approval.status': 'approved',
      $or: [
        { scope: 'global' },
        { scope: 'vendor', vendor: vendorId },
        { scope: 'category', category: { $in: await getVendorCategories(vendorId) } },
        { scope: 'product', product: { $in: await getVendorProducts(vendorId) } }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .sort({ priority: -1, effectiveFrom: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name')
        .populate('product', 'name sku')
        .lean(),
      Commission.countDocuments(query)
    ]);

    // Get summary statistics
    const summary = await Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$scope',
          count: { $sum: 1 },
          averageRate: { $avg: '$rate' }
        }
      }
    ]);

    res.json({
      success: true,
      data: commissions,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your commissions',
      error: error.message
    });
  }
};

/**
 * @desc    Get Vendor Commission Summary
 * @route   GET /api/commissions/vendor/:vendorId/summary
 * @access  Private (Admin/Vendor - authorized)
 */
export const getVendorCommissionSummary = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate = new Date()
    } = req.query;

    // Check authorization
    if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own commission summary'
      });
    }

    const summary = await Commission.getVendorSummary(vendorId, startDate, endDate);

    // Get applicable commissions
    const applicableCommissions = await Commission.getApplicableCommission(
      vendorId,
      'vendor',
      { date: new Date() }
    );

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: summary[0] || {
          totalCommission: 0,
          totalOrders: 0,
          averageCommission: 0,
          totalAmount: 0,
          effectiveRate: 0
        },
        applicableCommissions: applicableCommissions.map(c => ({
          id: c._id,
          name: c.name,
          code: c.code,
          rate: c.rate,
          type: c.type,
          scope: c.scope
        }))
      }
    });
  } catch (error) {
    console.error('Get vendor commission summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor commission summary',
      error: error.message
    });
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @desc    Bulk Update Commissions
 * @route   POST /api/commissions/bulk
 * @access  Private (Admin only)
 */
export const bulkUpdateCommissions = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { commissionIds, action, data } = req.body;
    const userId = req.user._id;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission IDs are required'
      });
    }

    let updateData = {};
    let result;

    switch (action) {
      case 'activate':
        updateData = {
          isActive: true,
          updatedBy: userId,
          updatedAt: new Date()
        };
        break;

      case 'deactivate':
        updateData = {
          isActive: false,
          updatedBy: userId,
          updatedAt: new Date()
        };
        break;

      case 'extend':
        updateData = {
          effectiveTo: data.effectiveTo,
          isPermanent: false,
          updatedBy: userId,
          updatedAt: new Date()
        };
        break;

      case 'update-rate':
        updateData = {
          rate: data.rate,
          updatedBy: userId,
          updatedAt: new Date()
        };
        break;

      case 'update-priority':
        updateData = {
          priority: data.priority,
          updatedBy: userId,
          updatedAt: new Date()
        };
        break;

      case 'delete':
        updateData = {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: data.reason || 'Bulk delete',
          isActive: false
        };
        break;

      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    result = await Commission.updateMany(
      { _id: { $in: commissionIds } },
      updateData,
      { session }
    );

    await session.commitTransaction();

    // Audit log
    await createAuditLog({
      user: userId,
      action: 'bulk_update',
      resourceType: 'commission',
      status: 'success',
      description: `Bulk ${action} on ${result.modifiedCount} commissions`,
      metadata: { commissionIds, action, data },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearCommissionCaches();

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} commissions`,
      data: result
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk update commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update commissions',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Export Commissions
 * @route   GET /api/commissions/export
 * @access  Private (Admin only)
 */
export const exportCommissions = async (req, res) => {
  try {
    const {
      format = 'csv',
      fields,
      scope,
      status,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {
      isDeleted: false,
      ...(scope && { scope }),
      ...(status && { 'approval.status': status }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      }
    };

    const commissions = await Commission.find(query)
      .populate('vendor', 'vendorProfile.storeName email')
      .populate('category', 'name')
      .populate('product', 'name')
      .lean();

    // Format data for export
    const exportData = commissions.map(commission => ({
      code: commission.code,
      name: commission.name,
      description: commission.description || '',
      type: commission.type,
      scope: commission.scope,
      rate: commission.type === 'percentage' ? `${commission.rate}%` : commission.rate,
      currency: commission.currency || 'USD',
      isTiered: commission.isTiered ? 'Yes' : 'No',
      tiers: commission.isTiered ? commission.tiers.length : 0,
      vendor: commission.vendor?.vendorProfile?.storeName || commission.vendor?.email || 'N/A',
      category: commission.category?.name || 'N/A',
      product: commission.product?.name || 'N/A',
      effectiveFrom: new Date(commission.effectiveFrom).toISOString().split('T')[0],
      effectiveTo: commission.effectiveTo ? new Date(commission.effectiveTo).toISOString().split('T')[0] : 'Permanent',
      isActive: commission.isActive ? 'Yes' : 'No',
      isDefault: commission.isDefault ? 'Yes' : 'No',
      priority: commission.priority,
      status: commission.approval.status,
      totalApplied: commission.performance.totalApplied,
      totalCommission: commission.performance.totalCommission.toFixed(2),
      createdBy: commission.createdBy?.email || 'System',
      createdAt: new Date(commission.createdAt).toISOString().split('T')[0]
    }));

    // Export based on format
    switch (format) {
      case 'csv':
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=commissions.csv');
        return res.send(csv);

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Commissions');
        
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
        res.setHeader('Content-Disposition', 'attachment; filename=commissions.xlsx');
        
        await workbook.xlsx.write(res);
        return res.end();

      case 'pdf':
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const filename = `commissions-${Date.now()}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        doc.pipe(res);
        
        // Title
        doc.fontSize(18).text('Commissions Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Summary
        const totalCommissions = exportData.reduce((sum, c) => sum + parseFloat(c.totalCommission || 0), 0);
        const activeCount = exportData.filter(c => c.isActive === 'Yes').length;
        const pendingCount = exportData.filter(c => c.status === 'pending').length;
        
        doc.fontSize(12).text(`Total Commissions: ${exportData.length}`);
        doc.fontSize(12).text(`Active Commissions: ${activeCount}`);
        doc.fontSize(12).text(`Pending Approval: ${pendingCount}`);
        doc.fontSize(12).text(`Total Commission Paid: $${totalCommissions.toFixed(2)}`);
        doc.moveDown(2);
        
        // Table
        const tableTop = 220;
        const tableHeaders = ['Code', 'Name', 'Type', 'Rate', 'Scope', 'Status', 'Effective', 'Applied'];
        const columnWidths = [80, 120, 60, 60, 70, 70, 80, 70];
        
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
        
        exportData.slice(0, 30).forEach((commission, index) => {
          x = 30;
          doc.text(commission.code || '', x, y, { width: columnWidths[0] });
          x += columnWidths[0];
          doc.text((commission.name || '').substring(0, 20), x, y, { width: columnWidths[1] });
          x += columnWidths[1];
          doc.text(commission.type || '', x, y, { width: columnWidths[2] });
          x += columnWidths[2];
          doc.text(commission.rate || '', x, y, { width: columnWidths[3] });
          x += columnWidths[3];
          doc.text(commission.scope || '', x, y, { width: columnWidths[4] });
          x += columnWidths[4];
          doc.text(commission.status || '', x, y, { width: columnWidths[5] });
          x += columnWidths[5];
          doc.text(commission.effectiveFrom || '', x, y, { width: columnWidths[6] });
          x += columnWidths[6];
          doc.text(commission.totalApplied?.toString() || '0', x, y, { width: columnWidths[7] });
          
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
    console.error('Export commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export commissions',
      error: error.message
    });
  }
};

// ============================================
// COMMISSION ANALYTICS
// ============================================

/**
 * @desc    Get Commission Analytics
 * @route   GET /api/commissions/analytics
 * @access  Private (Admin only)
 */
export const getCommissionAnalytics = async (req, res) => {
  try {
    const {
      period = '30d',
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

    // ============================================
    // 1. OVERALL STATISTICS
    // ============================================
    
    const overallStats = await Commission.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: 1 },
          activeCommissions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          pendingApprovals: {
            $sum: { $cond: [{ $eq: ['$approval.status', 'pending'] }, 1, 0] }
          },
          tieredCommissions: {
            $sum: { $cond: [{ $eq: ['$isTiered', true] }, 1, 0] }
          },
          defaultCommissions: {
            $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] }
          },
          averageRate: { $avg: '$rate' },
          totalCommissionPaid: { $sum: '$performance.totalCommission' },
          totalOrders: { $sum: '$performance.totalApplied' }
        }
      }
    ]);

    // ============================================
    // 2. DISTRIBUTION BY SCOPE
    // ============================================
    
    const scopeDistribution = await Commission.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$scope',
          count: { $sum: 1 },
          totalCommission: { $sum: '$performance.totalCommission' },
          averageRate: { $avg: '$rate' }
        }
      },
      {
        $project: {
          scope: '$_id',
          count: 1,
          totalCommission: { $round: ['$totalCommission', 2] },
          averageRate: { $round: ['$averageRate', 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // ============================================
    // 3. DISTRIBUTION BY TYPE
    // ============================================
    
    const typeDistribution = await Commission.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCommission: { $sum: '$performance.totalCommission' }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          totalCommission: { $round: ['$totalCommission', 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // ============================================
    // 4. COMMISSIONS CREATED OVER TIME
    // ============================================
    
    const commissionsOverTime = await Commission.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$approval.status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$approval.status', 'approved'] }, 1, 0] }
          }
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
          pending: 1,
          approved: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // ============================================
    // 5. EXPIRING COMMISSIONS
    // ============================================
    
    const expiringCommissions = await Commission.getExpiringCommissions(30);
    
    // ============================================
    // 6. TOP VENDORS BY COMMISSION
    // ============================================
    
    const topVendors = await Commission.aggregate([
      { $match: { isDeleted: false, 'performance.applicationHistory': { $exists: true, $ne: [] } } },
      { $unwind: '$performance.applicationHistory' },
      {
        $match: {
          'performance.applicationHistory.appliedAt': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$performance.applicationHistory.vendorId',
          totalCommission: { $sum: '$performance.applicationHistory.commission' },
          totalOrders: { $sum: 1 },
          averageCommission: { $avg: '$performance.applicationHistory.commission' }
        }
      },
      {
        $lookup: {
          from: 'adminvendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendorId: '$_id',
          storeName: '$vendor.vendorProfile.storeName',
          email: '$vendor.email',
          totalCommission: { $round: ['$totalCommission', 2] },
          totalOrders: 1,
          averageCommission: { $round: ['$averageCommission', 2] }
        }
      },
      { $sort: { totalCommission: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: overallStats[0] || {
          totalCommissions: 0,
          activeCommissions: 0,
          pendingApprovals: 0,
          tieredCommissions: 0,
          defaultCommissions: 0,
          averageRate: 0,
          totalCommissionPaid: 0,
          totalOrders: 0
        },
        distribution: {
          byScope: scopeDistribution,
          byType: typeDistribution
        },
        trends: commissionsOverTime,
        expiringSoon: {
          count: expiringCommissions.length,
          commissions: expiringCommissions.map(c => ({
            id: c._id,
            name: c.name,
            code: c.code,
            vendor: c.vendor?.vendorProfile?.storeName,
            effectiveTo: c.effectiveTo,
            daysRemaining: c.daysUntilExpiry
          }))
        },
        topVendors
      }
    });
  } catch (error) {
    console.error('Commission analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission analytics',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get vendor categories
 */
async function getVendorCategories(vendorId) {
  const products = await Product.find({ vendor: vendorId, isDeleted: false })
    .distinct('categories');
  return products;
}

/**
 * Get vendor products
 */
async function getVendorProducts(vendorId) {
  const products = await Product.find({ vendor: vendorId, isDeleted: false })
    .distinct('_id');
  return products;
}

/**
 * Get vendor stats
 */
async function getVendorStats(vendorId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const orders = await Order.aggregate([
    { $match: { 'vendors.vendor': vendorId, orderDate: { $gte: thirtyDaysAgo } } },
    { $unwind: '$vendors' },
    { $match: { 'vendors.vendor': vendorId } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$vendors.total' },
        orderCount: { $sum: 1 },
        productCount: { $sum: { $size: '$vendors.items' } }
      }
    }
  ]);
  
  return orders[0] || { totalSales: 0, orderCount: 0, productCount: 0 };
}

/**
 * Get commission statistics
 */
async function getCommissionStatistics(query) {
  const stats = await Commission.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalCommissions: { $sum: 1 },
        activeCommissions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        pendingApprovals: {
          $sum: { $cond: [{ $eq: ['$approval.status', 'pending'] }, 1, 0] }
        },
        tieredCommissions: {
          $sum: { $cond: [{ $eq: ['$isTiered', true] }, 1, 0] }
        },
        defaultCommissions: {
          $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] }
        },
        percentageCommissions: {
          $sum: { $cond: [{ $eq: ['$type', 'percentage'] }, 1, 0] }
        },
        fixedCommissions: {
          $sum: { $cond: [{ $eq: ['$type', 'fixed'] }, 1, 0] }
        },
        averageRate: { $avg: '$rate' },
        totalCommissionPaid: { $sum: '$performance.totalCommission' },
        totalOrders: { $sum: '$performance.totalApplied' }
      }
    }
  ]);

  return stats[0] || {
    totalCommissions: 0,
    activeCommissions: 0,
    pendingApprovals: 0,
    tieredCommissions: 0,
    defaultCommissions: 0,
    percentageCommissions: 0,
    fixedCommissions: 0,
    averageRate: 0,
    totalCommissionPaid: 0,
    totalOrders: 0
  };
}

/**
 * Clear commission caches
 */
async function clearCommissionCaches(commissionId = null) {
  try {
    const keys = [];
    
    if (commissionId) {
      keys.push(`commission:${commissionId}`);
      keys.push(`commission:code:*`);
    }
    
    keys.push('commissions:list*', 'commissions:analytics*', 'commissions:vendor*');
    
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
 * Notify admins of commission approval request
 */
async function notifyAdminsCommissionApproval(commission, requester) {
  const admins = await AdminVendor.find({
    role: { $in: ['super_admin', 'admin'] },
    status: 'active',
    'notificationPreferences.email.commissions': true
  });

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `Commission Approval Required: ${commission.name}`,
      template: 'admin-commission-approval',
      data: {
        adminName: admin.firstName,
        requesterName: `${requester.firstName} ${requester.lastName}`,
        commissionName: commission.name,
        commissionCode: commission.code,
        commissionType: commission.type,
        commissionRate: commission.formattedRate,
        commissionScope: commission.scope,
        effectiveFrom: commission.effectiveFrom,
        effectiveTo: commission.effectiveTo || 'Permanent',
        approvalUrl: `${process.env.ADMIN_URL}/commissions/approve/${commission._id}`
      }
    });
  }
}

/**
 * Notify requester commission approved
 */
async function notifyCommissionApproved(commission, approver) {
  const requester = await AdminVendor.findById(commission.approval.requestedBy);
  
  if (requester) {
    await sendEmail({
      to: requester.email,
      subject: `Commission Approved: ${commission.name}`,
      template: 'commission-approved',
      data: {
        name: requester.firstName,
        commissionName: commission.name,
        commissionCode: commission.code,
        approvedBy: `${approver.firstName} ${approver.lastName}`,
        approvedAt: new Date(),
        commissionUrl: `${process.env.ADMIN_URL}/commissions/${commission._id}`
      }
    });
  }
}

/**
 * Notify requester commission rejected
 */
async function notifyCommissionRejected(commission, rejector, reason, notes) {
  const requester = await AdminVendor.findById(commission.approval.requestedBy);
  
  if (requester) {
    await sendEmail({
      to: requester.email,
      subject: `Commission Update: ${commission.name}`,
      template: 'commission-rejected',
      data: {
        name: requester.firstName,
        commissionName: commission.name,
        commissionCode: commission.code,
        rejectedBy: `${rejector.firstName} ${rejector.lastName}`,
        rejectedAt: new Date(),
        reason,
        notes,
        commissionUrl: `${process.env.ADMIN_URL}/commissions/${commission._id}`
      }
    });
  }
}

// ============================================
// EXPORT CONTROLLER
// ============================================

export default {
  // CRUD Operations
  createCommission,
  getCommissions,
  getCommissionById,
  getCommissionByCode,
  updateCommission,
  deleteCommission,
  restoreCommission,
  
  // Approval Workflow
  approveCommission,
  rejectCommission,
  
  // Calculation & Application
  calculateCommission,
  applyCommission,
  
  // Vendor Operations
  getMyCommissions,
  getVendorCommissionSummary,
  
  // Bulk Operations
  bulkUpdateCommissions,
  exportCommissions,
  
  // Analytics
  getCommissionAnalytics
};