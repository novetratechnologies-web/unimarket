// backend/controllers/adminUserController.js
import User from '../models/User.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================
// GET ALL USERS (CUSTOMERS) - FOR ADMIN
// ============================================
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      verification,
      university,
      startDate,
      endDate,
      minOrders,
      maxOrders,
      minSpent,
      maxSpent,
      includeDeleted = false
    } = req.query;

    // Build query
    const query = {};

    // Handle soft-deleted users
    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true };
    }

    // Apply status filter
    if (status) {
      const statuses = status.split(',');
      const statusConditions = [];
      
      if (statuses.includes('active')) {
        statusConditions.push({ isActive: true, isVerified: true, isDeleted: { $ne: true } });
      }
      if (statuses.includes('inactive')) {
        statusConditions.push({ isActive: false, isDeleted: { $ne: true } });
      }
      if (statuses.includes('pending')) {
        statusConditions.push({ isVerified: false, isActive: true, isDeleted: { $ne: true } });
      }
      if (statuses.includes('suspended')) {
        statusConditions.push({ 
          isActive: false,
          isDeleted: { $ne: true },
          loginLockoutUntil: { $gt: new Date() }
        });
      }
      if (statuses.includes('deleted')) {
        statusConditions.push({ isDeleted: true });
      }
      
      if (statusConditions.length > 0) {
        query.$or = statusConditions;
      }
    }

    // Apply verification filter
    if (verification) {
      const verificationStatuses = verification.split(',');
      const verificationConditions = [];
      
      if (verificationStatuses.includes('verified')) {
        verificationConditions.push({ isVerified: true });
      }
      if (verificationStatuses.includes('unverified')) {
        verificationConditions.push({ isVerified: false });
      }
      
      if (verificationConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: verificationConditions });
      }
    }

    // University filter
    if (university) {
      query.university = { $regex: university, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken -verificationCode -verificationCodeExpiry -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens -loginHistory -deviceHistory')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Get order statistics for each user
    const userIds = users.map(user => user._id);
    
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    // Create a map of order stats
    const statsMap = {};
    orderStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        orderCount: stat.orderCount,
        totalSpent: stat.totalSpent,
        averageOrderValue: stat.averageOrderValue || 0,
        lastOrderDate: stat.lastOrderDate
      };
    });

    // Combine user data with order stats
    const usersWithStats = users.map(user => ({
      ...user,
      orderCount: statsMap[user._id.toString()]?.orderCount || 0,
      totalSpent: statsMap[user._id.toString()]?.totalSpent || 0,
      averageOrderValue: statsMap[user._id.toString()]?.averageOrderValue || 0,
      lastOrderDate: statsMap[user._id.toString()]?.lastOrderDate || null,
      status: user.isDeleted ? 'deleted' : (user.isActive ? 'active' : 'inactive')
    }));

    // Apply order count filters if provided
    let filteredUsers = usersWithStats;
    if (minOrders || maxOrders) {
      filteredUsers = usersWithStats.filter(user => {
        const count = user.orderCount;
        if (minOrders && maxOrders) {
          return count >= parseInt(minOrders) && count <= parseInt(maxOrders);
        } else if (minOrders) {
          return count >= parseInt(minOrders);
        } else if (maxOrders) {
          return count <= parseInt(maxOrders);
        }
        return true;
      });
    }

    // Apply spent filters if provided
    if (minSpent || maxSpent) {
      filteredUsers = filteredUsers.filter(user => {
        const spent = user.totalSpent;
        if (minSpent && maxSpent) {
          return spent >= parseFloat(minSpent) && spent <= parseFloat(maxSpent);
        } else if (minSpent) {
          return spent >= parseFloat(minSpent);
        } else if (maxSpent) {
          return spent <= parseFloat(maxSpent);
        }
        return true;
      });
    }

    res.json({
      success: true,
      data: filteredUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
        filteredTotal: filteredUsers.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// ============================================
// GET USER BY ID
// ============================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .limit(1000)
      .skip(exportSkip)
      .select('-password -refreshToken -verificationCode -verificationCodeExpiry -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens -loginHistory -deviceHistory')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate order statistics
    const orderStats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          minOrderValue: { $min: '$total' },
          maxOrderValue: { $max: '$total' }
        }
      }
    ]);

    const stats = orderStats[0] || {};

    res.json({
      success: true,
      data: {
        ...user,
        orders: orders || [],
        orderCount: stats.orderCount || 0,
        totalSpent: stats.totalSpent || 0,
        averageOrderValue: stats.averageOrderValue || 0,
        minOrderValue: stats.minOrderValue || 0,
        maxOrderValue: stats.maxOrderValue || 0,
        status: user.isDeleted ? 'deleted' : (user.isActive ? 'active' : 'inactive')
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// ============================================
// GET USER ORDERS
// ============================================
export const getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: id, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'name price images')
        .lean(),
      Order.countDocuments({ user: id, isDeleted: { $ne: true } })
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
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message
    });
  }
};

// ============================================
// CREATE NEW USER (CUSTOMER)
// ============================================
export const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check username uniqueness if provided
    if (userData.username) {
      const existingUsername = await User.findOne({ username: userData.username.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      username: userData.username?.toLowerCase(),
      authMethod: userData.authMethod || 'email',
      isVerified: userData.isVerified || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isDeleted: false,
      accountCreated: new Date(),
      lastActive: new Date()
    });

    await user.save();

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.verificationCode;
    delete userResponse.verificationCodeExpiry;
    delete userResponse.resetPasswordCode;
    delete userResponse.resetPasswordExpires;
    delete userResponse.csrfTokens;
    delete userResponse.validRefreshTokens;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// ============================================
// UPDATE USER
// ============================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;
    delete updates.__v;
    delete updates.refreshToken;
    delete updates.verificationCode;
    delete updates.verificationCodeExpiry;
    delete updates.resetPasswordCode;
    delete updates.resetPasswordExpires;
    delete updates.loginHistory;
    delete updates.deviceHistory;
    delete updates.csrfTokens;
    delete updates.validRefreshTokens;

    // Handle email update
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: updates.email,
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Handle username update
    if (updates.username) {
      updates.username = updates.username.toLowerCase();
      const existingUsername = await User.findOne({
        username: updates.username,
        _id: { $ne: id }
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -verificationCode -verificationCodeExpiry -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens -loginHistory -deviceHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// ============================================
// SOFT DELETE USER (Move to trash)
// ============================================
export const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is already deleted'
      });
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedReason = reason || 'No reason provided';
    user.deletedBy = req.user._id; // Assuming admin user is in req.user
    user.isActive = false;
    user.lastLogout = new Date();

    await user.save();

    // Optionally: Invalidate all user sessions/tokens
    user.refreshToken = null;
    user.validRefreshTokens = [];
    user.csrfTokens = [];

    await user.save();

    res.json({
      success: true,
      message: 'User moved to trash successfully',
      data: {
        _id: user._id,
        email: user.email,
        deletedAt: user.deletedAt,
        isDeleted: user.isDeleted
      }
    });
  } catch (error) {
    console.error('Soft delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ============================================
// RESTORE USER (From trash)
// ============================================
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is not deleted'
      });
    }

    // Restore the user
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedReason = null;
    user.deletedBy = null;
    user.isActive = true;
    user.restoredAt = new Date();
    user.restoredBy = req.user._id;

    await user.save();

    res.json({
      success: true,
      message: 'User restored successfully',
      data: {
        _id: user._id,
        email: user.email,
        restoredAt: user.restoredAt,
        isDeleted: user.isDeleted
      }
    });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user',
      error: error.message
    });
  }
};

// ============================================
// PERMANENT DELETE USER (Hard delete)
// ============================================
export const permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has orders - prevent deletion if they have orders
    const orderCount = await Order.countDocuments({ user: id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot permanently delete user with existing orders. Soft delete instead.'
      });
    }

    // Permanently delete the user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User permanently deleted successfully',
      data: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Permanent delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete user',
      error: error.message
    });
  }
};

// ============================================
// ACTIVATE USER
// ============================================
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate a deleted user. Restore first.'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    // Activate user
    user.isActive = true;
    user.loginLockoutUntil = null;
    user.loginAttempts = 0;
    user.activatedAt = new Date();
    user.activatedBy = req.user._id;

    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
};

// ============================================
// DEACTIVATE USER
// ============================================
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate a deleted user'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already inactive'
      });
    }

    // Deactivate user
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedReason = reason || 'No reason provided';
    user.deactivatedBy = req.user._id;
    user.lastLogout = new Date();

    // Invalidate sessions
    user.refreshToken = null;
    user.validRefreshTokens = [];
    user.csrfTokens = [];

    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
};

// ============================================
// SUSPEND USER
// ============================================
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration = 30 } = req.body; // duration in days

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend a deleted user'
      });
    }

    // Suspend user
    user.isActive = false;
    user.loginLockoutUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    user.suspendedAt = new Date();
    user.suspendedReason = reason || 'Violation of terms';
    user.suspendedBy = req.user._id;
    user.suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    user.lastLogout = new Date();

    // Invalidate sessions
    user.refreshToken = null;
    user.validRefreshTokens = [];
    user.csrfTokens = [];

    await user.save();

    res.json({
      success: true,
      message: `User suspended for ${duration} days`,
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive,
        suspendedUntil: user.suspendedUntil,
        suspendedReason: user.suspendedReason
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
};

// ============================================
// UNSUSPEND USER
// ============================================
export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.loginLockoutUntil || user.loginLockoutUntil < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'User is not currently suspended'
      });
    }

    // Unsuspend user
    user.isActive = true;
    user.loginLockoutUntil = null;
    user.suspendedUntil = null;
    user.suspendedReason = null;
    user.unsuspendedAt = new Date();
    user.unsuspendedBy = req.user._id;

    await user.save();

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message
    });
  }
};

// ============================================
// GET DELETED USERS
// ============================================
export const getDeletedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find({ isDeleted: true })
        .select('-password -refreshToken -verificationCode -verificationCodeExpiry -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens -loginHistory -deviceHistory')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments({ isDeleted: true })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get deleted users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted users',
      error: error.message
    });
  }
};

// ============================================
// GET USER STATISTICS
// ============================================
export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const stats = await User.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                activeCustomers: {
                  $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                inactiveCustomers: {
                  $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                },
                deletedCustomers: {
                  $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] }
                },
                verifiedCustomers: {
                  $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
                },
                unverifiedCustomers: {
                  $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] }
                },
                emailVerifiedCustomers: {
                  $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
                },
                phoneVerifiedCustomers: {
                  $sum: { $cond: [{ $eq: ['$isPhoneVerified', true] }, 1, 0] }
                },
                googleAuthCustomers: {
                  $sum: { $cond: [{ $eq: ['$authMethod', 'google'] }, 1, 0] }
                },
                emailAuthCustomers: {
                  $sum: { $cond: [{ $eq: ['$authMethod', 'email'] }, 1, 0] }
                },
                businessAccounts: {
                  $sum: { $cond: [{ $eq: ['$isBusiness', true] }, 1, 0] }
                },
                studentsWithId: {
                  $sum: { $cond: [{ $ne: ['$studentId', null] }, 1, 0] }
                },
                usersWithPhone: {
                  $sum: { $cond: [{ $ne: ['$phone', null] }, 1, 0] }
                },
                usersWithUsername: {
                  $sum: { $cond: [{ $ne: ['$username', null] }, 1, 0] }
                }
              }
            }
          ],
          recentJoins: [
            { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } } },
            { $count: 'count' }
          ],
          recentActivity: [
            { $match: { lastActive: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } } },
            { $count: 'count' }
          ],
          byUniversity: [
            { $match: { university: { $ne: null, $ne: '' }, isDeleted: { $ne: true } } },
            { $group: { _id: '$university', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          byCounty: [
            { $match: { county: { $ne: null, $ne: '' }, isDeleted: { $ne: true } } },
            { $group: { _id: '$county', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          byYearOfStudy: [
            { $match: { yearOfStudy: { $ne: null, $ne: '' }, isDeleted: { $ne: true } } },
            { $group: { _id: '$yearOfStudy', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byGender: [
            { $match: { gender: { $ne: null, $ne: '' }, isDeleted: { $ne: true } } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
          ],
          byRole: [
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          newCustomersLast90Days: [
            { $match: { createdAt: { $gte: ninetyDaysAgo }, isDeleted: { $ne: true } } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]
        }
      }
    ]);

    const result = stats[0] || {};
    const totals = result.totals[0] || {};

    // Get order statistics for all customers
    const orderStats = await Order.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          customersWithOrders: { $addToSet: '$user' }
        }
      }
    ]);

    const orderData = orderStats[0] || {};

    res.json({
      success: true,
      data: {
        // Basic counts
        totalCustomers: totals.totalCustomers || 0,
        activeCustomers: totals.activeCustomers || 0,
        inactiveCustomers: totals.inactiveCustomers || 0,
        deletedCustomers: totals.deletedCustomers || 0,
        verifiedCustomers: totals.verifiedCustomers || 0,
        unverifiedCustomers: totals.unverifiedCustomers || 0,
        emailVerifiedCustomers: totals.emailVerifiedCustomers || 0,
        phoneVerifiedCustomers: totals.phoneVerifiedCustomers || 0,
        
        // Auth methods
        googleAuthCustomers: totals.googleAuthCustomers || 0,
        emailAuthCustomers: totals.emailAuthCustomers || 0,
        
        // Business stats
        businessAccounts: totals.businessAccounts || 0,
        studentsWithId: totals.studentsWithId || 0,
        usersWithPhone: totals.usersWithPhone || 0,
        usersWithUsername: totals.usersWithUsername || 0,
        
        // Activity stats
        recentJoins: result.recentJoins[0]?.count || 0,
        recentActivity: result.recentActivity[0]?.count || 0,
        
        // Order stats
        totalOrders: orderData.totalOrders || 0,
        totalRevenue: orderData.totalRevenue || 0,
        averageOrderValue: orderData.averageOrderValue || 0,
        customersWithOrders: orderData.customersWithOrders?.length || 0,
        
        // Breakdowns
        topUniversities: result.byUniversity || [],
        topCounties: result.byCounty || [],
        byYearOfStudy: result.byYearOfStudy || [],
        byGender: result.byGender || [],
        byRole: result.byRole || [],
        
        // Trends
        newCustomersTrend: result.newCustomersLast90Days || []
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// ============================================
// BULK UPDATE USERS
// ============================================
export const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { 
          isActive: true,
          loginLockoutUntil: null,
          activatedAt: new Date(),
          activatedBy: req.user._id
        };
        message = 'activated';
        break;
        
      case 'deactivate':
        updateData = { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedReason: data?.reason || 'Bulk deactivation',
          deactivatedBy: req.user._id,
          lastLogout: new Date()
        };
        message = 'deactivated';
        break;
        
      case 'suspend':
        const duration = data?.duration || 30;
        updateData = { 
          isActive: false,
          loginLockoutUntil: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
          suspendedAt: new Date(),
          suspendedReason: data?.reason || 'Bulk suspension',
          suspendedBy: req.user._id,
          suspendedUntil: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
          lastLogout: new Date()
        };
        message = 'suspended';
        break;
        
      case 'verify':
        updateData = { 
          isVerified: true, 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        };
        message = 'verified';
        break;
        
      case 'unverify':
        updateData = { 
          isVerified: false, 
          isEmailVerified: false,
          emailVerifiedAt: null
        };
        message = 'unverified';
        break;
        
      case 'soft-delete':
        updateData = { 
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
          deletedReason: data?.reason || 'Bulk deletion',
          deletedBy: req.user._id,
          lastLogout: new Date()
        };
        message = 'moved to trash';
        break;
        
      case 'restore':
        updateData = { 
          isDeleted: false,
          isActive: true,
          deletedAt: null,
          deletedReason: null,
          deletedBy: null,
          restoredAt: new Date(),
          restoredBy: req.user._id
        };
        message = 'restored';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Successfully ${message} ${result.modifiedCount} users`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update users',
      error: error.message
    });
  }
};

// ============================================
// BULK PERMANENT DELETE USERS
// ============================================
export const bulkPermanentDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    // Check if any users have orders
    const usersWithOrders = await Order.distinct('user', { user: { $in: userIds } });
    
    if (usersWithOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot permanently delete users with existing orders. Use soft delete instead.',
        data: {
          usersWithOrders: usersWithOrders
        }
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      success: true,
      message: `Successfully permanently deleted ${result.deletedCount} users`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete users',
      error: error.message
    });
  }
};

// ============================================
// EXPORT USERS
// ============================================
export const exportUsers = async (req, res) => {
  try {
    const { 
      format = 'json', 
      fields, 
      ids, 
      includeDeleted = false, 
      limit = 1000, // ✅ Add limit with reasonable default
      ...filters 
    } = req.query;

    // Build query
    const query = {};

    // Handle deleted users
    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true };
    }

    // If specific IDs are provided
    if (ids) {
      query._id = { $in: ids.split(',') };
    }

    // Apply filters (same as before)
    if (filters.status === 'active') {
      query.isActive = true;
    } else if (filters.status === 'inactive') {
      query.isActive = false;
    } else if (filters.status === 'deleted') {
      query.isDeleted = true;
    }

    if (filters.verification === 'verified') {
      query.isVerified = true;
    } else if (filters.verification === 'unverified') {
      query.isVerified = false;
    }

    if (filters.university) {
      query.university = { $regex: filters.university, $options: 'i' };
    }

    if (filters.gender) {
      query.gender = filters.gender;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { username: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // ✅ FIX 1: Add pagination with hard limit
    const exportLimit = Math.min(parseInt(limit), 5000); // Never export more than 5000 at once
    const exportSkip = parseInt(req.query.exportSkip) || 0;

    console.log(`📦 Exporting users with limit: ${exportLimit}, skip: ${exportSkip}`);

    // Get total count first
    const totalUsers = await User.countDocuments(query).maxTimeMS(10000);

    // Get users in batches
    const users = await User.find(query)
      .select('-password -refreshToken -verificationCode -verificationCodeExpiry -resetPasswordCode -resetPasswordExpires -csrfTokens -validRefreshTokens -loginHistory -deviceHistory')
      .skip(exportSkip)
      .limit(exportLimit)
      .maxTimeMS(30000)
      .lean();

    // ✅ FIX 2: Only get stats for these users, and use efficient aggregation
    const userIds = users.map(user => user._id);
    
    // Only run aggregation if we have users
    let orderStats = [];
    if (userIds.length > 0) {
      orderStats = await Order.aggregate([
        { 
          $match: { 
            user: { $in: userIds }, 
            isDeleted: { $ne: true } 
          } 
        },
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' }
          }
        }
      ]).maxTimeMS(20000);
    }

    const statsMap = {};
    orderStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        orderCount: stat.orderCount,
        totalSpent: stat.totalSpent,
        averageOrderValue: stat.averageOrderValue || 0
      };
    });

    // Format data for export
    const exportData = users.map(user => ({
      // Basic Info
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.phone || '',
      alternativePhone: user.alternativePhone || '',
      username: user.username || '',
      
      // Personal Info
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      idNumber: user.idNumber || '',
      nationality: user.nationality || 'Kenyan',
      
      // Academic Info
      university: user.university || '',
      faculty: user.faculty || '',
      department: user.department || '',
      yearOfStudy: user.yearOfStudy || '',
      studentId: user.studentId || '',
      registrationNumber: user.registrationNumber || '',
      
      // Address
      address: user.address || '',
      city: user.city || '',
      county: user.county || '',
      postalCode: user.postalCode || '',
      estate: user.estate || '',
      
      // Account Info
      authMethod: user.authMethod || 'email',
      role: user.role || 'customer',
      status: user.isDeleted ? 'deleted' : (user.isActive ? 'active' : 'inactive'),
      isVerified: user.isVerified ? 'Yes' : 'No',
      isEmailVerified: user.isEmailVerified ? 'Yes' : 'No',
      isPhoneVerified: user.isPhoneVerified ? 'Yes' : 'No',
      
      // Business Info
      isBusiness: user.isBusiness ? 'Yes' : 'No',
      businessName: user.businessName || '',
      businessRegNumber: user.businessRegNumber || '',
      
      // Preferences
      currency: user.currency || 'KES',
      language: user.language || 'en',
      timezone: user.timezone || 'Africa/Nairobi',
      preferredPaymentMethod: user.preferredPaymentMethod || 'M-Pesa',
      
      // Notifications
      newsletter: user.newsletter ? 'Yes' : 'No',
      emailNotifications: user.emailNotifications ? 'Yes' : 'No',
      smsNotifications: user.smsNotifications ? 'Yes' : 'No',
      promotionalEmails: user.promotionalEmails ? 'Yes' : 'No',
      
      // Stats
      orderCount: statsMap[user._id.toString()]?.orderCount || 0,
      totalSpent: statsMap[user._id.toString()]?.totalSpent || 0,
      averageOrderValue: statsMap[user._id.toString()]?.averageOrderValue || 0,
      
      // Timestamps
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
      lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : '',
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : '',
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : '',
      
      // Deletion info
      isDeleted: user.isDeleted ? 'Yes' : 'No',
      deletedAt: user.deletedAt ? new Date(user.deletedAt).toISOString() : '',
      deletedReason: user.deletedReason || '',
      
      // Metadata
      tags: user.tags ? user.tags.join(', ') : '',
      referralSource: user.referralSource || '',
      notes: user.notes || ''
    }));

    // ✅ FIX 3: For large exports, use streaming instead of sending all at once
    if (format === 'json' && exportData.length > 1000) {
      // Send as a stream instead of one giant JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.json`);
      
      res.write('[');
      for (let i = 0; i < exportData.length; i++) {
        res.write(JSON.stringify(exportData[i]));
        if (i < exportData.length - 1) res.write(',');
        
        // Flush periodically
        if (i % 100 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      res.write(']');
      return res.end();
    }

    if (format === 'json') {
      return res.json({
        success: true,
        data: exportData,
        pagination: {
          total: totalUsers,
          exported: exportData.length,
          limit: exportLimit,
          skip: exportSkip,
          hasMore: exportSkip + exportLimit < totalUsers
        },
        generatedAt: new Date().toISOString()
      });
    }

    // For CSV format
    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      message: 'Export completed',
      data: exportData,
      pagination: {
        total: totalUsers,
        exported: exportData.length
      }
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
};

// ============================================
// GET USER ACTIVITY LOGS
// ============================================
export const getUserActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get login history
    const loginHistory = user.loginHistory || [];
    const deviceHistory = user.deviceHistory || [];

    // Combine and sort activities
    const activities = [
      ...loginHistory.map(log => ({
        type: 'login',
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        location: log.location,
        status: log.successful ? 'success' : 'failed'
      })),
      ...deviceHistory.map(device => ({
        type: 'device',
        timestamp: device.lastUsed,
        deviceInfo: device.deviceInfo,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        location: device.location,
        status: 'info'
      }))
    ];

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        pages: Math.ceil(activities.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity logs',
      error: error.message
    });
  }
};