import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

// ============================================
// OPTIONAL GEOIP - COMMENT OUT IF NOT NEEDED
// ============================================
// GeoIP loads ~60-80MB database into memory
// Only enable if you absolutely need location data
let geoip = null;
try {
  // Dynamically import geoip only when needed
  // Comment out the line below if you want to disable geoip completely
  // geoip = require('geoip-lite');
  console.log('⚠️ GeoIP disabled - location data will not be captured');
} catch (err) {
  console.warn('⚠️ GeoIP not available - location data will be skipped');
}

// ============================================
// CONSTANTS
// ============================================
const MAX_LIMIT = 1000; // Hard limit for any query
const DEFAULT_LIMIT = 50;
const MAX_CHANGES = 50; // Max number of changes to store
const MAX_FIELD_LENGTH = 1000; // Max length for any field value in changes
const AGGREGATION_TIMEOUT = 30000; // 30 seconds

// Lazy load ActivityLog to avoid circular dependencies
let ActivityLog;

const getActivityLogModel = () => {
  if (!ActivityLog) {
    ActivityLog = mongoose.model('ActivityLog');
  }
  return ActivityLog;
};

// ============================================
// CONNECTION GUARD - SIMPLIFIED
// ============================================
const ensureDbConnection = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  // Wait for connection (max 10 seconds)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('MongoDB connection timeout'));
    }, 10000);
    
    if (mongoose.connection.readyState === 1) {
      clearTimeout(timeout);
      resolve(true);
    } else {
      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    }
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Truncate large objects to prevent memory bloat
 */
const truncateValue = (value, maxLength = MAX_FIELD_LENGTH) => {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }
  
  if (typeof value === 'object') {
    try {
      const stringified = JSON.stringify(value);
      if (stringified.length > maxLength) {
        return { _truncated: true, _originalType: typeof value };
      }
    } catch (e) {
      return { _error: 'Failed to stringify object' };
    }
  }
  
  return value;
};

/**
 * Truncate changes array to prevent huge audit logs
 */
const truncateChanges = (changes) => {
  if (!changes || !Array.isArray(changes)) return changes;
  
  // Limit number of changes
  const limitedChanges = changes.slice(0, MAX_CHANGES);
  
  // Truncate each change value
  return limitedChanges.map(change => ({
    field: change.field,
    oldValue: truncateValue(change.oldValue),
    newValue: truncateValue(change.newValue)
  }));
};

const generateDefaultDescription = (action, resourceType, status) => {
  const actionMap = {
    create: 'created',
    read: 'accessed',
    update: 'updated',
    delete: 'deleted',
    login: 'logged in',
    logout: 'logged out',
    approve: 'approved',
    reject: 'rejected',
    suspend: 'suspended',
    activate: 'activated',
    payout: 'processed payout',
    refund: 'processed refund',
    cancel: 'cancelled',
    export: 'exported',
    import: 'imported',
    bulk_update: 'bulk updated',
    password_change: 'changed password',
    '2fa_setup': 'setup 2FA',
    '2fa_enable': 'enabled 2FA',
    '2fa_disable': 'disabled 2FA'
  };

  const actionText = actionMap[action] || action;
  const statusText = status === 'success' ? 'successfully' : 'failed to';
  
  return `${statusText} ${actionText} ${resourceType}`;
};

const extractChanges = (req) => {
  const changes = [];
  
  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (req.originalData && req.body) {
      Object.keys(req.body).forEach(key => {
        try {
          if (JSON.stringify(req.originalData[key]) !== JSON.stringify(req.body[key])) {
            changes.push({
              field: key,
              oldValue: truncateValue(req.originalData[key]),
              newValue: truncateValue(req.body[key])
            });
          }
        } catch (e) {
          // Skip if can't stringify
        }
      });
    }
  }
  
  return truncateChanges(changes);
};

const sendCriticalAlert = async (auditLog) => {
  console.warn('🚨 CRITICAL AUDIT EVENT:', {
    id: auditLog._id,
    action: auditLog.action,
    user: auditLog.user,
    description: auditLog.description,
    timestamp: auditLog.createdAt
  });
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create audit log entry - FIXED to handle null users
 */
export const createAuditLog = async ({
  user,
  action,
  resourceType,
  resourceId,
  status = 'success',
  description,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent,
  sessionId,
  requestId,
  severity = 'info',
  errorMessage,
  beforeData,
  afterData,
  duration
}) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();

    const parser = new UAParser(userAgent || '');
    const uaResult = parser.getResult();

    let location = null;
    // Only attempt geoip if it's loaded
    if (geoip && ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
      try {
        const geo = geoip.lookup(ipAddress);
        if (geo) {
          location = {
            country: geo.country,
            region: geo.region,
            city: geo.city,
            timezone: geo.timezone
          };
        }
      } catch (geoError) {
        // Silently fail - location just won't be available
      }
    }

    const reqId = requestId || uuidv4();

    // Truncate changes to prevent huge documents
    const truncatedChanges = truncateChanges(changes);
    
    // Truncate metadata if too large
    let truncatedMetadata = metadata;
    try {
      const metadataStr = JSON.stringify(metadata);
      if (metadataStr.length > 10000) { // 10KB limit for metadata
        truncatedMetadata = { _truncated: true, originalSize: metadataStr.length };
      }
    } catch (e) {
      truncatedMetadata = { _error: 'Failed to stringify metadata' };
    }

    const auditData = {
      user: user || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      status,
      description: description || generateDefaultDescription(action, resourceType, status),
      changes: truncatedChanges,
      metadata: {
        ...truncatedMetadata,
        requestId: reqId,
        duration,
        location,
        userAgent: {
          browser: uaResult.browser?.name || 'Unknown',
          os: uaResult.os?.name || 'Unknown',
          device: uaResult.device?.type || 'Unknown'
        },
        ...(status === 'failure' && !user && { systemGenerated: true })
      },
      ipAddress,
      userAgent: userAgent ? userAgent.substring(0, 500) : null, // Truncate user agent
      sessionId,
      requestId: reqId,
      severity,
      errorMessage: errorMessage ? errorMessage.substring(0, 1000) : null, // Truncate error message
      beforeData: beforeData ? { _present: true } : null, // Don't store large before/after data
      afterData: afterData ? { _present: true } : null
    };

    const auditLog = new ActivityLog(auditData);
    await auditLog.save();

    if (severity === 'critical') {
      await sendCriticalAlert(auditLog);
    }

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Create multiple audit logs in batch
 */
export const createBatchAuditLogs = async (logs) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.user || null,
      requestId: log.requestId || uuidv4(),
      changes: truncateChanges(log.changes || []),
      metadata: log.metadata ? { _batched: true, ...log.metadata } : { _batched: true },
      createdAt: new Date()
    }));

    const result = await ActivityLog.insertMany(enrichedLogs, { 
      ordered: false,
      // Limit batch size
      rawResult: true 
    });
    return result;
  } catch (error) {
    console.error('Failed to create batch audit logs:', error);
    return [];
  }
};

// ============================================
// SPECIALIZED LOG FUNCTIONS
// ============================================

export const logAuthEvent = async ({
  user,
  action,
  status,
  ipAddress,
  userAgent,
  errorMessage,
  metadata = {}
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'user',
    resourceId: user || null,
    status,
    description: `${status === 'success' ? 'Successful' : 'Failed'} ${action} attempt`,
    metadata,
    ipAddress,
    userAgent,
    severity: status === 'success' ? 'info' : 'warning',
    errorMessage
  });
};

export const logOrderEvent = async ({
  user,
  action,
  orderId,
  orderNumber,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent,
  severity = 'info'
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'order',
    resourceId: orderId,
    status,
    description: `Order ${orderNumber}: ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      orderNumber
    },
    ipAddress,
    userAgent,
    severity
  });
};

export const logProductEvent = async ({
  user,
  action,
  productId,
  productName,
  productSku,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'product',
    resourceId: productId,
    status,
    description: `Product ${productName} (${productSku}): ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      productName,
      productSku
    },
    ipAddress,
    userAgent,
    severity: action === 'delete' ? 'warning' : 'info'
  });
};

export const logVendorEvent = async ({
  user,
  action,
  vendorId,
  storeName,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'vendor',
    resourceId: vendorId,
    status,
    description: `Vendor ${storeName}: ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      storeName
    },
    ipAddress,
    userAgent,
    severity: action === 'suspend' || action === 'delete' ? 'warning' : 'info'
  });
};

export const logPayoutEvent = async ({
  user,
  action,
  payoutId,
  payoutNumber,
  vendorId,
  amount,
  status,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'payout',
    resourceId: payoutId,
    status,
    description: `Payout ${payoutNumber}: $${amount} - ${action} ${status}`,
    metadata: {
      ...metadata,
      payoutNumber,
      vendorId,
      amount
    },
    ipAddress,
    userAgent,
    severity: action === 'reject' ? 'warning' : 'info'
  });
};

export const logCommissionEvent = async ({
  user,
  action,
  commissionId,
  commissionCode,
  commissionName,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'commission',
    resourceId: commissionId,
    status,
    description: `Commission ${commissionName} (${commissionCode}): ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      commissionCode,
      commissionName
    },
    ipAddress,
    userAgent,
    severity: action === 'delete' ? 'warning' : 'info'
  });
};

export const logCategoryEvent = async ({
  user,
  action,
  categoryId,
  categoryName,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'category',
    resourceId: categoryId,
    status,
    description: `Category ${categoryName}: ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      categoryName
    },
    ipAddress,
    userAgent
  });
};

export const logUserEvent = async ({
  user,
  action,
  targetUserId,
  targetUserEmail,
  targetUserRole,
  status,
  changes = [],
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'user',
    resourceId: targetUserId,
    status,
    description: `User ${targetUserEmail} (${targetUserRole}): ${action} ${status}`,
    changes,
    metadata: {
      ...metadata,
      targetUserEmail,
      targetUserRole
    },
    ipAddress,
    userAgent,
    severity: action === 'delete' || action === 'suspend' ? 'warning' : 'info'
  });
};

export const logSystemEvent = async ({
  user,
  action,
  setting,
  oldValue,
  newValue,
  status,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'settings',
    status,
    description: `System setting ${setting} changed`,
    changes: [{
      field: setting,
      oldValue: truncateValue(oldValue),
      newValue: truncateValue(newValue)
    }],
    metadata: {
      ...metadata,
      setting
    },
    ipAddress,
    userAgent,
    severity: 'warning'
  });
};

export const logApiKeyEvent = async ({
  user,
  action,
  keyId,
  keyName,
  status,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType: 'api_key',
    resourceId: keyId,
    status,
    description: `API Key ${keyName}: ${action} ${status}`,
    metadata: {
      ...metadata,
      keyName
    },
    ipAddress,
    userAgent,
    severity: action === 'delete' ? 'warning' : 'info'
  });
};

export const logDataEvent = async ({
  user,
  action,
  resourceType,
  filename,
  recordCount,
  status,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action,
    resourceType,
    status,
    description: `${action} ${resourceType}: ${recordCount} records - ${filename}`,
    metadata: {
      ...metadata,
      filename,
      recordCount
    },
    ipAddress,
    userAgent,
    severity: 'info'
  });
};

export const logErrorEvent = async ({
  user = null,
  error,
  resourceType,
  resourceId,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  return createAuditLog({
    user: user || null,
    action: 'error',
    resourceType: resourceType || 'system',
    resourceId,
    status: 'failure',
    description: error?.message || 'An error occurred',
    errorMessage: error?.stack || error?.message,
    metadata: {
      ...metadata,
      errorName: error?.name,
      errorCode: error?.code
    },
    ipAddress,
    userAgent,
    severity: 'error'
  });
};

// ============================================
// QUERY FUNCTIONS - WITH HARD LIMITS
// ============================================

export const getAuditLogsForResource = async ({
  resourceType,
  resourceId,
  page = 1,
  limit = DEFAULT_LIMIT,
  startDate,
  endDate,
  actions = [],
  status = []
}) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const query = {
      resourceType,
      resourceId
    };

    if (actions.length > 0) {
      query.action = { $in: actions };
    }

    if (status.length > 0) {
      query.status = { $in: status };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Enforce hard limits
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('user', 'firstName lastName email')
        .maxTimeMS(5000)
        .lean(),
      ActivityLog.countDocuments(query).maxTimeMS(3000)
    ]);

    return {
      logs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

export const getAuditLogsForUser = async ({
  userId,
  page = 1,
  limit = DEFAULT_LIMIT,
  startDate,
  endDate
}) => {
  return getAuditLogsForResource({
    resourceType: 'user',
    resourceId: userId,
    page,
    limit,
    startDate,
    endDate
  });
};

export const getRecentActivity = async (limit = 20) => {
  // Check connection first
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ MongoDB not connected, returning empty recent activity');
    return [];
  }
  
  try {
    const ActivityLog = getActivityLogModel();
    
    const safeLimit = Math.min(limit, 100); // Never more than 100
    
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate('user', 'firstName lastName email role')
      .maxTimeMS(3000)
      .lean();

    return logs;
  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return [];
  }
};

export const getActivitySummary = async ({ startDate, endDate }) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const summary = await ActivityLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          success: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'success'] }, '$count', 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'failure'] }, '$count', 0] }
          }
        }
      },
      {
        $project: {
          action: '$_id',
          total: 1,
          success: 1,
          failure: 1,
          successRate: {
            $multiply: [{ $divide: ['$success', '$total'] }, 100]
          }
        }
      },
      { $sort: { total: -1 } }
    ])
    .maxTimeMS(AGGREGATION_TIMEOUT)
    .allowDiskUse(true); // Allow disk use for large aggregations

    return summary;
  } catch (error) {
    console.error('Failed to get activity summary:', error);
    return [];
  }
};

export const getUserActivityHeatmap = async ({ userId, days = 30 }) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const safeDays = Math.min(days, 90); // Never more than 90 days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);

    const activity = await ActivityLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' }
          },
          count: { $sum: 1 }
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
          hour: '$_id.hour',
          count: 1
        }
      },
      { $sort: { date: -1, hour: 1 } }
    ])
    .maxTimeMS(AGGREGATION_TIMEOUT)
    .allowDiskUse(true);

    return activity;
  } catch (error) {
    console.error('Failed to get user activity heatmap:', error);
    return [];
  }
};

export const getAuditStatistics = async ({ startDate, endDate }) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const stats = await ActivityLog.aggregate([
      { $match: match },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                uniqueUsers: { $addToSet: '$user' },
                successCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                },
                failureCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
                },
                criticalCount: {
                  $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalEvents: 1,
                uniqueUsers: { $size: '$uniqueUsers' },
                successCount: 1,
                failureCount: 1,
                criticalCount: 1,
                successRate: {
                  $multiply: [{ $divide: ['$successCount', '$totalEvents'] }, 100]
                }
              }
            }
          ],
          topActions: [
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          topUsers: [
            {
              $group: {
                _id: '$user',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'adminvendors',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $project: {
                _id: 1,
                count: 1,
                email: { $arrayElemAt: ['$user.email', 0] }
              }
            }
          ],
          resourceActivity: [
            {
              $group: {
                _id: '$resourceType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          hourlyDistribution: [
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ], { allowDiskUse: true })
    .maxTimeMS(AGGREGATION_TIMEOUT);

    return stats[0] || {};
  } catch (error) {
    console.error('Failed to get audit statistics:', error);
    throw error;
  }
};

// ============================================
// MAINTENANCE FUNCTIONS
// ============================================

export const cleanupAuditLogs = async (daysToKeep = 90) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const safeDays = Math.min(daysToKeep, 3650); // Max 10 years
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeDays);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate },
      severity: { $ne: 'critical' }
    }).maxTimeMS(30000);

    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    throw error;
  }
};

export const archiveAuditLogs = async (daysToKeep = 365) => {
  try {
    await ensureDbConnection();
    
    const ActivityLog = getActivityLogModel();
    
    const safeDays = Math.min(daysToKeep, 3650); // Max 10 years
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeDays);

    // Archive in batches to prevent memory issues
    const batchSize = 1000;
    let totalArchived = 0;
    let hasMore = true;

    while (hasMore) {
      const logs = await ActivityLog.find({
        createdAt: { $lt: cutoffDate }
      })
        .limit(batchSize)
        .lean();

      if (logs.length === 0) {
        hasMore = false;
        break;
      }

      const ids = logs.map(l => l._id);
      await ActivityLog.deleteMany({ _id: { $in: ids } });
      
      totalArchived += logs.length;
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return totalArchived;
  } catch (error) {
    console.error('Failed to archive audit logs:', error);
    throw error;
  }
};

export const auditLogExport = async ({ startDate, endDate, format = 'csv' }) => {
  // Check connection state immediately
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ MongoDB not connected, returning empty audit logs');
    return []; // Return empty array, don't throw error
  }
  
  try {
    const ActivityLog = getActivityLogModel();
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Hard limit on export size
    const MAX_EXPORT = 10000;
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .maxTimeMS(10000)
      .lean()
      .exec();

    return logs.map(log => ({
      timestamp: log.createdAt,
      user: log.user?.email || 'System',
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId?.toString(),
      status: log.status,
      description: log.description ? log.description.substring(0, 500) : '',
      ipAddress: log.ipAddress,
      severity: log.severity
    }));
    
  } catch (error) {
    console.error('❌ Failed to export audit logs:', error.message);
    return []; // Return empty array instead of throwing
  }
};

// ============================================
// FIXED MIDDLEWARE - NO MONKEY PATCHING!
// ============================================

export const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture response data via res.locals
    const originalJson = res.json;
    
    res.json = function(data) {
      // Store response data for audit
      res.locals.responseData = data;
      // Call original json method
      return originalJson.call(this, data);
    };

    // Listen for finish event to log after response is sent
    res.once('finish', async () => {
      // Only log successful requests (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const duration = Date.now() - startTime;
        
        const resourceId = req.params.id || 
                          req.body?._id || 
                          res.locals.responseData?.data?._id ||
                          res.locals.responseData?.data?.id ||
                          res.locals.responseData?._id ||
                          res.locals.responseData?.id;

        // Fire and forget - don't await
        createAuditLog({
          user: req.user?._id,
          action,
          resourceType,
          resourceId,
          status: 'success',
          description: `${action} ${resourceType} - ${req.method} ${req.originalUrl}`,
          changes: extractChanges(req),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            responseTime: duration,
            statusCode: res.statusCode
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          sessionId: req.session?.id,
          requestId: req.id,
          duration
        }).catch(err => console.error('Audit log creation failed:', err));
      }
    });

    next();
  };
};

// ============================================
// EXPORT OBJECT - MUST BE AT THE VERY END
// ============================================

export const auditLog = auditLogExport;

export default {
  // Core functions
  createAuditLog,
  createBatchAuditLogs,
  
  // Specialized log functions
  logAuthEvent,
  logOrderEvent,
  logProductEvent,
  logVendorEvent,
  logPayoutEvent,
  logCommissionEvent,
  logCategoryEvent,
  logUserEvent,
  logSystemEvent,
  logApiKeyEvent,
  logDataEvent,
  logErrorEvent,
  
  // Query functions
  getAuditLogsForResource,
  getAuditLogsForUser,
  getRecentActivity,
  getActivitySummary,
  getUserActivityHeatmap,
  getAuditStatistics,
  
  // Maintenance functions
  cleanupAuditLogs,
  archiveAuditLogs,
  auditLog,
  auditLogExport,
  
  // Middleware
  auditMiddleware
};