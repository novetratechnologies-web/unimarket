// BACKEND/routes/admin/activityRoutes.js
import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin', 'super_admin'));

/**
 * GET /api/admin/activities
 * Get all activities with filters - FULLY FIXED
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userType,
      userId,
      action,
      resourceType,
      status,
      severity,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

        // Build filter
    const filter = {};

    // User filters
    if (userType && userType !== 'all') {
      filter.userModel = userType;
    }
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user = new mongoose.Types.ObjectId(userId);
      } else {
        filter.userEmail = { $regex: userId, $options: 'i' };
      }
    }

    // Action filters
    if (action && action !== 'all') {
      const actions = action.split(',').filter(a => a.trim());
      if (actions.length === 1) {
        filter.action = actions[0];
      } else if (actions.length > 1) {
        filter.action = { $in: actions };
      }
    }
    
    // Resource type filter
    if (resourceType && resourceType !== 'all') {
      filter.resourceType = resourceType;
    }
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Severity filter
    if (severity && severity !== 'all') {
      const severities = severity.split(',').filter(s => s.trim());
      if (severities.length === 1) {
        filter.severity = severities[0];
      } else if (severities.length > 1) {
        filter.severity = { $in: severities };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    } else {
      // Default to last 90 days if no date range specified (for performance)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      filter.createdAt = { $gte: ninetyDaysAgo };
    }

    // Search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { description: searchRegex },
        { userEmail: searchRegex },
        { ipAddress: searchRegex },
        { action: searchRegex },
        { resourceType: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute main query
    const activities = await ActivityLog.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'user',
        select: 'firstName lastName email avatar role',
        options: { strictPopulate: false }
      })
      .lean();

    // Get total count
    const total = await ActivityLog.countDocuments(filter);

    // ✅ FIXED: Remove .maxTimeMS() from aggregation
    let summaryResult = [];
    try {
      summaryResult = await ActivityLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
            failures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } },
            warnings: { $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
            uniqueUsers: { $addToSet: "$userEmail" },
            uniqueIPs: { $addToSet: "$ipAddress" }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            success: 1,
            failures: 1,
            warnings: 1,
            critical: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            uniqueIPs: { $size: "$uniqueIPs" }
          }
        }
      ]);
    } catch (summaryError) {
      console.warn('⚠️ Summary aggregation failed, using defaults:', summaryError.message);
    }

    const summary = summaryResult.length > 0 ? summaryResult[0] : { 
      total: 0, 
      success: 0, 
      failures: 0, 
      warnings: 0,
      critical: 0,
      uniqueUsers: 0,
      uniqueIPs: 0
    };

    // ✅ FIXED: Remove .limit() from distinct queries
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [distinctActions, distinctResourceTypes, distinctUserModels] = await Promise.all([
      ActivityLog.distinct('action', { createdAt: { $gte: last30Days } }),
      ActivityLog.distinct('resourceType', { createdAt: { $gte: last30Days } }),
      ActivityLog.distinct('userModel', { createdAt: { $gte: last30Days } })
    ]);


    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      ...activity,
      userDisplay: activity.user ? 
        `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email :
        activity.userEmail || 'System',
      timestamp: activity.createdAt
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary,
        filters: {
          actions: distinctActions.filter(Boolean).sort().slice(0, 100),
          resourceTypes: distinctResourceTypes.filter(Boolean).sort().slice(0, 50),
          userTypes: distinctUserModels.filter(Boolean).sort().slice(0, 20),
          statuses: ['success', 'failure', 'warning', 'pending'],
          severities: ['info', 'warning', 'error', 'critical']
        }
      }
    });

  } catch (error) {
    console.error('❌ Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/admin/activities/statistics
 * Get activity statistics - FIXED
 */
router.get('/statistics', async (req, res) => {
  try {
    const { days = 30, interval = 'day' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.min(parseInt(days), 90));

    // Overall statistics
    let overallResult = [];
    try {
      overallResult = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
            failures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } },
            warnings: { $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
            uniqueUsers: { $addToSet: "$userEmail" },
            uniqueIPs: { $addToSet: "$ipAddress" }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            success: 1,
            failures: 1,
            warnings: 1,
            critical: 1,
            successRate: { 
              $multiply: [
                { $divide: ["$success", { $max: ["$total", 1] }] }, 
                100
              ]
            },
            uniqueUsers: { $size: "$uniqueUsers" },
            uniqueIPs: { $size: "$uniqueIPs" }
          }
        }
      ]);
    } catch (overallError) {
      console.warn('⚠️ Overall stats failed:', overallError.message);
    }

    const overall = overallResult.length > 0 ? overallResult[0] : {
      total: 0,
      success: 0,
      failures: 0,
      warnings: 0,
      critical: 0,
      successRate: 0,
      uniqueUsers: 0,
      uniqueIPs: 0
    };

    // Activities over time - FIXED
    let timeSeries = [];
    try {
      const dateFormat = interval === 'hour' ? "%Y-%m-%d %H:00" : "%Y-%m-%d";
      
      timeSeries = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: dateFormat, date: "$createdAt" } }
            },
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
            failures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            total: 1,
            success: 1,
            failures: 1
          }
        },
        { $sort: { date: 1 } }
      ]);
    } catch (timeError) {
      console.warn('⚠️ Time series failed:', timeError.message);
    }

    // Top actions
    let topActions = [];
    try {
      topActions = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastUsed: { $max: "$createdAt" },
            successRate: {
              $avg: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            action: "$_id",
            count: 1,
            lastUsed: 1,
            successRate: { $multiply: ["$successRate", 100] }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
    } catch (actionsError) {
      console.warn('⚠️ Top actions failed:', actionsError.message);
    }

    // User type distribution
    let userTypeDistribution = [];
    try {
      const totalCount = overall.total || 1;

      userTypeDistribution = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            userModel: { $ne: null }
          }
        },
        {
          $group: {
            _id: "$userModel",
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$userEmail" }
          }
        },
        {
          $project: {
            userType: "$_id",
            count: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            percentage: {
              $multiply: [
                { $divide: ["$count", totalCount] },
                100
              ]
            }
          }
        },
        { $sort: { count: -1 } }
      ]);
    } catch (userError) {
      console.warn('⚠️ User type distribution failed:', userError.message);
    }

    // Error analysis
    let errorAnalysis = [];
    try {
      errorAnalysis = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "failure"
          }
        },
        {
          $group: {
            _id: {
              action: "$action",
              resourceType: "$resourceType"
            },
            count: { $sum: 1 },
            lastError: { $max: "$createdAt" }
          }
        },
        {
          $project: {
            _id: 0,
            action: "$_id.action",
            resourceType: "$_id.resourceType",
            count: 1,
            lastError: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
    } catch (errorError) {
      console.warn('⚠️ Error analysis failed:', errorError.message);
    }

    // Severity distribution
    let severityDistribution = [];
    try {
      const totalCount = overall.total || 1;

      severityDistribution = await ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$severity",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            severity: "$_id",
            count: 1,
            percentage: {
              $multiply: [
                { $divide: ["$count", totalCount] },
                100
              ]
            }
          }
        },
        { $sort: { count: -1 } }
      ]);
    } catch (severityError) {
      console.warn('⚠️ Severity distribution failed:', severityError.message);
    }

    res.json({
      success: true,
      data: {
        overall,
        timeSeries,
        topActions,
        userTypeDistribution,
        errorAnalysis,
        severityDistribution,
        dateRange: {
          start: startDate,
          end: new Date(),
          days: parseInt(days),
          interval
        }
      }
    });

  } catch (error) {
    console.error('❌ Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
});

// Keep all other routes exactly as they were (user/:userId, export, clean, :id)

export default router;