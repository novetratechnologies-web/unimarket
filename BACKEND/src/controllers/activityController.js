// controllers/admin/activityController.js
import ActivityLog from "../../models/ActivityLog.js";
import User from "../../models/User.js";
import AdminVendor from "../../models/AdminVendor.js";
import mongoose from "mongoose";

// ============================================
// CONSTANTS - ADD HARD LIMITS
// ============================================
const MAX_LIMIT = 1000; // Never return more than 1000 records
const MAX_EXPORT = 10000; // Max export size
const AGGREGATION_TIMEOUT = 30000; // 30 seconds
const MAX_DAYS_HISTORY = 90; // Default max days for queries

/**
 * 📊 GET ALL ACTIVITIES WITH FILTERS - OPTIMIZED
 * GET /api/admin/activities
 */
export const getActivities = async (req, res) => {
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

    // Enforce hard limits
    const safeLimit = Math.min(parseInt(limit), MAX_LIMIT);
    const safePage = Math.max(1, parseInt(page));
    const skip = (safePage - 1) * safeLimit;

    // Build filter with date limits
    const filter = {};

    // Always add date range to prevent full collection scans
    filter.createdAt = {};
    
    // Default to last 90 days if no dates specified
    if (!startDate && !endDate) {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - MAX_DAYS_HISTORY);
      filter.createdAt.$gte = defaultStart;
    } else {
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
    }

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

    // Action filters - handle comma-separated values
    if (action && action !== 'all') {
      const actions = action.split(',').filter(a => a.trim()).slice(0, 20); // Max 20 actions
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
    
    // Severity filter - handle comma-separated values
    if (severity && severity !== 'all') {
      const severities = severity.split(',').filter(s => s.trim()).slice(0, 10);
      if (severities.length === 1) {
        filter.severity = severities[0];
      } else if (severities.length > 1) {
        filter.severity = { $in: severities };
      }
    }

    // Search in multiple fields (with limit)
    if (search && search.trim()) {
      const searchTerm = search.trim().substring(0, 100); // Limit search length
      const searchRegex = new RegExp(searchTerm, 'i');
      filter.$or = [
        { description: searchRegex },
        { userEmail: searchRegex },
        { action: searchRegex },
        { resourceType: searchRegex }
      ].slice(0, 5); // Limit OR conditions
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with proper population and limits
    const activities = await ActivityLog.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(safeLimit)
      .populate({
        path: 'user',
        select: 'firstName lastName email avatar role',
        options: { strictPopulate: false }
      })
      .maxTimeMS(5000) // 5 second timeout
      .lean();

    // Get total count (with same filter)
    const total = await ActivityLog.countDocuments(filter).maxTimeMS(3000);

    // Get summary statistics - simplified and with timeout
    let summary = { total: 0, success: 0, failures: 0, warnings: 0, critical: 0, uniqueUsers: 0, uniqueIPs: 0 };
    
    try {
      const summaryResult = await ActivityLog.aggregate([
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
      ])
      .maxTimeMS(5000)
      .allowDiskUse(true);

      if (summaryResult.length > 0) {
        summary = summaryResult[0];
      }
    } catch (summaryError) {
      console.warn("⚠️ Summary aggregation failed:", summaryError.message);
      // Continue with empty summary
    }

    // Get unique filter options (cached or limited)
    let distinctActions = [];
    let distinctResourceTypes = [];
    let distinctUserModels = [];

    try {
      // Use Promise.allSettled to handle partial failures
      const [actionsResult, resourcesResult, modelsResult] = await Promise.allSettled([
        ActivityLog.distinct('action', { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
          .maxTimeMS(2000),
        ActivityLog.distinct('resourceType', { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
          .maxTimeMS(2000),
        ActivityLog.distinct('userModel', { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
          .maxTimeMS(2000)
      ]);

      if (actionsResult.status === 'fulfilled') distinctActions = actionsResult.value;
      if (resourcesResult.status === 'fulfilled') distinctResourceTypes = resourcesResult.value;
      if (modelsResult.status === 'fulfilled') distinctUserModels = modelsResult.value;
    } catch (distinctError) {
      console.warn("⚠️ Distinct queries failed:", distinctError.message);
    }

    // Format activities for response (with field limits)
    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      action: activity.action,
      resourceType: activity.resourceType,
      status: activity.status,
      severity: activity.severity,
      description: activity.description ? activity.description.substring(0, 500) : '',
      createdAt: activity.createdAt,
      userDisplay: activity.user ? 
        `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email :
        activity.userEmail || 'System',
      user: activity.user ? {
        _id: activity.user._id,
        firstName: activity.user.firstName,
        lastName: activity.user.lastName,
        email: activity.user.email,
        avatar: activity.user.avatar,
        role: activity.user.role
      } : null
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit)
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
    console.error("❌ Get activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * 📊 GET ACTIVITY DETAILS BY ID - OPTIMIZED
 * GET /api/admin/activities/:id
 */
export const getActivityDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID format",
        code: 'INVALID_ID'
      });
    }

    const activity = await ActivityLog.findById(id)
      .populate({
        path: 'user',
        select: 'firstName lastName email avatar phone role',
        options: { strictPopulate: false }
      })
      .maxTimeMS(3000)
      .lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
        code: 'NOT_FOUND'
      });
    }

    // Truncate large fields
    if (activity.description) {
      activity.description = activity.description.substring(0, 1000);
    }
    if (activity.errorMessage) {
      activity.errorMessage = activity.errorMessage.substring(0, 500);
    }
    if (activity.metadata) {
      // Don't send full metadata in list view
      activity.metadata = { _present: true };
    }

    // Get similar activities - limited and with timeout
    let similarActivities = [];
    try {
      similarActivities = await ActivityLog.find({
        $or: [
          { user: activity.user },
          { ipAddress: activity.ipAddress },
          { userEmail: activity.userEmail }
        ],
        _id: { $ne: activity._id },
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      })
        .limit(5)
        .sort({ createdAt: -1 })
        .select('action resourceType status createdAt description severity')
        .maxTimeMS(2000)
        .lean();
    } catch (similarError) {
      console.warn("⚠️ Similar activities query failed:", similarError.message);
    }

    // Format activity for response
    const formattedActivity = {
      ...activity,
      userDisplay: activity.user ? 
        `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email :
        activity.userEmail || 'System',
      similarActivities: similarActivities.map(sa => ({
        _id: sa._id,
        action: sa.action,
        resourceType: sa.resourceType,
        status: sa.status,
        severity: sa.severity,
        description: sa.description ? sa.description.substring(0, 200) : '',
        createdAt: sa.createdAt,
        userDisplay: sa.userEmail || 'System'
      }))
    };

    res.json({
      success: true,
      data: formattedActivity
    });

  } catch (error) {
    console.error("❌ Get activity details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * 📊 GET USER ACTIVITY TIMELINE - OPTIMIZED
 * GET /api/admin/activities/user/:userId
 */
export const getUserActivityTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7, limit = 50 } = req.query;

    // Validate and enforce limits
    const safeDays = Math.min(parseInt(days), 90); // Max 90 days
    const safeLimit = Math.min(parseInt(limit), 200); // Max 200 activities

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: 'INVALID_ID'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);

    // Try to find user in any of the user models
    let user = await User.findById(userId)
      .select('firstName lastName email avatar role')
      .maxTimeMS(2000)
      .lean();

    if (!user) {
      user = await AdminVendor.findById(userId)
        .select('firstName lastName email avatar role')
        .maxTimeMS(2000)
        .lean();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: 'USER_NOT_FOUND'
      });
    }

    // Get activities for this user - with limit
    const activities = await ActivityLog.find({
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        { userEmail: user.email }
      ],
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .select('action resourceType description status severity createdAt')
      .maxTimeMS(3000)
      .lean();

    // Group activities by date (limited)
    const timeline = {};
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toISOString().split('T')[0];
      
      if (!timeline[date]) {
        timeline[date] = {
          date,
          count: 0,
          activities: []
        };
      }
      
      timeline[date].count++;
      timeline[date].activities.push({
        id: activity._id,
        action: activity.action,
        resourceType: activity.resourceType,
        description: activity.description ? activity.description.substring(0, 200) : '',
        status: activity.status,
        severity: activity.severity,
        time: activity.createdAt
      });

      // Limit activities per day
      if (timeline[date].activities.length > 20) {
        timeline[date].activities = timeline[date].activities.slice(0, 20);
      }
    });

    // Get activity statistics - simplified with timeout
    let stats = [];
    try {
      stats = await ActivityLog.aggregate([
        {
          $match: {
            $or: [
              { user: new mongoose.Types.ObjectId(userId) },
              { userEmail: user.email }
            ],
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastOccurrence: { $max: "$createdAt" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
      .maxTimeMS(3000)
      .allowDiskUse(true);
    } catch (statsError) {
      console.warn("⚠️ Stats aggregation failed:", statsError.message);
    }

    // Get activity heatmap data - simplified
    let heatmap = [];
    try {
      heatmap = await ActivityLog.aggregate([
        {
          $match: {
            $or: [
              { user: new mongoose.Types.ObjectId(userId) },
              { userEmail: user.email }
            ],
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" },
              dayOfWeek: { $dayOfWeek: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            hour: "$_id.hour",
            dayOfWeek: "$_id.dayOfWeek",
            count: 1
          }
        },
        { $sort: { dayOfWeek: 1, hour: 1 } },
        { $limit: 168 } // 24 hours * 7 days
      ])
      .maxTimeMS(3000)
      .allowDiskUse(true);
    } catch (heatmapError) {
      console.warn("⚠️ Heatmap aggregation failed:", heatmapError.message);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        timeline: Object.values(timeline).sort((a, b) => b.date.localeCompare(a.date)),
        stats,
        heatmap,
        dateRange: {
          start: startDate,
          end: new Date(),
          days: safeDays
        },
        totalActivities: activities.length
      }
    });

  } catch (error) {
    console.error("❌ Get user timeline error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user timeline",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * 📊 GET ACTIVITY STATISTICS - OPTIMIZED
 * GET /api/admin/activities/statistics
 */
export const getActivityStatistics = async (req, res) => {
  try {
    const { days = 30, interval = 'day' } = req.query;

    // Enforce limits
    const safeDays = Math.min(parseInt(days), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);

    // Overall statistics - simplified
    let overall = {
      total: 0,
      success: 0,
      failures: 0,
      warnings: 0,
      critical: 0,
      successRate: 0,
      uniqueUsers: 0,
      uniqueIPs: 0
    };

    try {
      const overallResult = await ActivityLog.aggregate([
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
      ])
      .maxTimeMS(5000)
      .allowDiskUse(true);

      if (overallResult.length > 0) {
        overall = overallResult[0];
      }
    } catch (overallError) {
      console.warn("⚠️ Overall stats failed:", overallError.message);
    }

    // Activities over time - simplified
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
        { $sort: { date: 1 } },
        { $limit: 100 }
      ])
      .maxTimeMS(5000)
      .allowDiskUse(true);
    } catch (timeError) {
      console.warn("⚠️ Time series failed:", timeError.message);
    }

    // Top actions - simplified
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
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            action: "$_id",
            count: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .maxTimeMS(3000)
      .allowDiskUse(true);
    } catch (actionsError) {
      console.warn("⚠️ Top actions failed:", actionsError.message);
    }

    // Severity distribution - simplified
    let severityDistribution = [];
    try {
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
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ])
      .maxTimeMS(3000)
      .allowDiskUse(true);
    } catch (severityError) {
      console.warn("⚠️ Severity distribution failed:", severityError.message);
    }

    res.json({
      success: true,
      data: {
        overall,
        timeSeries,
        topActions,
        severityDistribution,
        dateRange: {
          start: startDate,
          end: new Date(),
          days: safeDays,
          interval
        }
      }
    });

  } catch (error) {
    console.error("❌ Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * 📊 EXPORT ACTIVITIES - OPTIMIZED WITH STREAMING
 * GET /api/admin/activities/export
 */
export const exportActivities = async (req, res) => {
  try {
    const { format = 'json', limit = 5000, ...filters } = req.query;

    // Enforce export limit
    const exportLimit = Math.min(parseInt(limit), MAX_EXPORT);

    // Build filter with date limits
    const filter = buildFilterFromQuery(filters);
    
    // Always add date range to prevent full collection scans
    if (!filter.createdAt) {
      filter.createdAt = {};
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 90);
      filter.createdAt.$gte = defaultStart;
    }

    if (format === 'json' && exportLimit > 1000) {
      // Stream JSON for large exports
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="activities_${new Date().toISOString().split('T')[0]}.json"`);
      
      // Write opening bracket
      res.write('[');
      
      let first = true;
      let count = 0;
      
      const cursor = ActivityLog.find(filter)
        .populate({
          path: 'user',
          select: 'firstName lastName email',
          options: { strictPopulate: false }
        })
        .sort({ createdAt: -1 })
        .limit(exportLimit)
        .maxTimeMS(30000)
        .lean()
        .cursor();

      for await (const activity of cursor) {
        if (!first) {
          res.write(',');
        }
        first = false;
        
        // Format activity
        const exportItem = {
          id: activity._id,
          timestamp: activity.createdAt,
          user: activity.user ? 
            `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email :
            activity.userEmail || 'System',
          action: activity.action,
          resourceType: activity.resourceType,
          resourceId: activity.resourceId,
          description: activity.description ? activity.description.substring(0, 500) : '',
          status: activity.status,
          severity: activity.severity,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent ? activity.userAgent.substring(0, 200) : ''
        };
        
        res.write(JSON.stringify(exportItem));
        count++;
        
        // Flush periodically
        if (count % 100 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      
      // Write closing bracket
      res.write(']');
      
      // Log export
      logExportAction(req, count, format, filters).catch(() => {});
      
      return res.end();
    }

    // For smaller exports, use regular method
    const activities = await ActivityLog.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName email',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .limit(exportLimit)
      .maxTimeMS(10000)
      .lean();

    // Format data for export (with field limits)
    const exportData = activities.map(activity => ({
      id: activity._id,
      timestamp: activity.createdAt,
      user: activity.user ? 
        `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email :
        activity.userEmail || 'System',
      action: activity.action,
      resourceType: activity.resourceType,
      resourceId: activity.resourceId,
      description: activity.description ? activity.description.substring(0, 500) : '',
      status: activity.status,
      severity: activity.severity,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent ? activity.userAgent.substring(0, 200) : '',
      responseTime: activity.responseTime
    }));

    // Format based on export type
    let exportedData;
    let contentType;
    let filename = `activities_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        exportedData = convertToCSV(exportData);
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'json':
      default:
        exportedData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename += '.json';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);

    // Log export action asynchronously
    logExportAction(req, exportData.length, format, filters).catch(() => {});

  } catch (error) {
    console.error("❌ Export activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export activities",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * 📊 CLEAN OLD ACTIVITIES (Admin only) - OPTIMIZED
 * POST /api/admin/activities/clean
 */
export const cleanOldActivities = async (req, res) => {
  try {
    const { retention = 90, confirm = false } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention);

    if (!confirm) {
      // Preview what will be deleted (with limit)
      const toDelete = await ActivityLog.countDocuments({
        createdAt: { $lt: cutoffDate },
        severity: { $ne: 'critical' }
      }).maxTimeMS(5000);

      const criticalToKeep = await ActivityLog.countDocuments({
        createdAt: { $lt: cutoffDate },
        severity: 'critical'
      }).maxTimeMS(5000);

      return res.json({
        success: true,
        data: {
          preview: true,
          willDelete: toDelete,
          criticalToKeep,
          retention,
          cutoffDate,
          message: `This will delete ${toDelete} activities older than ${retention} days. ${criticalToKeep} critical activities will be preserved.`
        }
      });
    }

    // Perform cleanup in batches to prevent memory issues
    const batchSize = 1000;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const activities = await ActivityLog.find({
        createdAt: { $lt: cutoffDate },
        severity: { $ne: 'critical' }
      })
        .limit(batchSize)
        .select('_id')
        .lean();

      if (activities.length === 0) {
        hasMore = false;
        break;
      }

      const ids = activities.map(a => a._id);
      const result = await ActivityLog.deleteMany({ _id: { $in: ids } });
      totalDeleted += result.deletedCount;

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log the cleanup
    await ActivityLog.create({
      action: 'delete',
      resourceType: 'log',
      user: req.user._id,
      userModel: req.user.constructor.modelName,
      userEmail: req.user.email,
      description: `Cleaned ${totalDeleted} old activities with retention period: ${retention} days`,
      metadata: { 
        deletedCount: totalDeleted, 
        retention,
        cutoffDate 
      },
      severity: 'info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: {
        deleted: totalDeleted,
        message: `Successfully cleaned ${totalDeleted} old activities`
      }
    });

  } catch (error) {
    console.error("❌ Clean activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean activities",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the appropriate model based on resource type
 */
function getModelFromResourceType(resourceType) {
  const models = {
    user: User,
    admin: AdminVendor,
    vendor: AdminVendor
  };
  return models[resourceType.toLowerCase()];
}

/**
 * Build filter object from query parameters
 */
function buildFilterFromQuery(query) {
  const filter = {};
  
  if (query.userType && query.userType !== 'all') {
    filter.userModel = query.userType;
  }
  if (query.userId) {
    if (mongoose.Types.ObjectId.isValid(query.userId)) {
      filter.user = new mongoose.Types.ObjectId(query.userId);
    } else {
      filter.userEmail = { $regex: query.userId, $options: 'i' };
    }
  }
  if (query.action && query.action !== 'all') {
    const actions = query.action.split(',').filter(a => a.trim()).slice(0, 20);
    if (actions.length === 1) {
      filter.action = actions[0];
    } else if (actions.length > 1) {
      filter.action = { $in: actions };
    }
  }
  if (query.resourceType && query.resourceType !== 'all') {
    filter.resourceType = query.resourceType;
  }
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }
  if (query.severity && query.severity !== 'all') {
    const severities = query.severity.split(',').filter(s => s.trim()).slice(0, 10);
    if (severities.length === 1) {
      filter.severity = severities[0];
    } else if (severities.length > 1) {
      filter.severity = { $in: severities };
    }
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  
  return filter;
}

/**
 * Convert activities to CSV format
 */
function convertToCSV(activities) {
  const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource Type', 'Status', 'Severity', 'IP Address', 'Description'];
  
  const rows = activities.map(a => [
    a.id,
    new Date(a.timestamp).toISOString(),
    a.user || 'System',
    a.action,
    a.resourceType || '',
    a.status || '',
    a.severity || '',
    a.ipAddress || '',
    (a.description || '').substring(0, 200)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const cellStr = String(cell || '').replace(/"/g, '""');
      return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
    }).join(','))
  ].join('\n');
}

/**
 * Log export action asynchronously
 */
async function logExportAction(req, count, format, filters) {
  try {
    await ActivityLog.create({
      action: 'export',
      resourceType: 'log',
      user: req.user?._id,
      userModel: req.user?.constructor?.modelName,
      userEmail: req.user?.email,
      description: `Exported ${count} activities in ${format} format`,
      metadata: { filters, count, format },
      severity: 'info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (logError) {
    // Silently fail - non-critical
  }
}

export default {
  getActivities,
  getActivityDetails,
  getUserActivityTimeline,
  getActivityStatistics,
  exportActivities,
  cleanOldActivities
};