// BACKEND/middleware/activityLogger.js
import ActivityLog from "../models/ActivityLog.js";

/**
 * Middleware to log all activities automatically
 */
export const activityLogger = async (req, res, next) => {
  // Store the original end function
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end function to capture response
  res.end = async function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Only log if it's not a static file request and not excluded
    const shouldLog = !req.path.match(/\.(css|js|jpg|png|gif|ico|woff|woff2|ttf|eot|svg)$/);
    
    if (shouldLog && res.statusCode !== 404) {
      try {
        // Determine user info
        let userId = null;
        let userModel = null;
        let userEmail = null;
        let userRole = 'guest';
        
        if (req.user) {
          userId = req.user._id;
          userModel = req.user.constructor.modelName;
          userEmail = req.user.email;
          userRole = req.user.role || userModel?.toLowerCase() || 'user';
        }

        // Determine action based on method and path
        const action = determineAction(req.method, req.path, res.statusCode);
        
        // Determine resource type
        const resourceType = determineResourceType(req.path);
        
        // Extract resource ID from path
        const resourceId = extractResourceId(req.path);
        
        // Get IP address
        const ipAddress = req.headers['x-forwarded-for'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress || 
                         req.ip;

        // Create activity log
        const log = new ActivityLog({
          user: userId,
          userModel,
          userEmail,
          userRole,
          anonymousId: !userId ? ipAddress : undefined,
          action,
          resourceType,
          resourceId: resourceId ? mongoose.Types.ObjectId(resourceId) : undefined,
          resourceIdentifier: resourceId,
          description: generateDescription(req, res.statusCode),
          status: res.statusCode >= 400 ? 'failure' : 'success',
          errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
          ipAddress,
          userAgent: req.get('user-agent'),
          sessionId: req.session?.id,
          requestId: req.headers['x-request-id'] || `${Date.now()}-${Math.random()}`,
          method: req.method,
          endpoint: req.path,
          queryParams: sanitizeData(req.query),
          responseTime,
          severity: determineSeverity(res.statusCode),
          metadata: {
            statusCode: res.statusCode,
            referer: req.get('referer'),
            host: req.get('host'),
            origin: req.get('origin'),
            body: shouldLogBody(req) ? sanitizeData(req.body) : undefined
          }
        });

        // Save asynchronously (don't await to not block response)
        log.save().catch(err => {
          console.error('❌ Failed to save activity log:', err.message);
        });

      } catch (logError) {
        console.error('❌ Activity logging error:', logError.message);
      }
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Helper functions
const determineAction = (method, path, statusCode) => {
  // Authentication actions
  if (path.includes('/login')) return statusCode === 200 ? 'login' : 'login_failed';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/register')) return 'register';
  if (path.includes('/verify-email')) return 'verify_email';
  if (path.includes('/forgot-password')) return 'forgot_password';
  if (path.includes('/reset-password')) return 'reset_password';
  if (path.includes('/refresh-token')) return 'refresh_token';
  
  // CRUD actions based on method
  switch(method) {
    case 'GET': 
      if (path.match(/\/[a-f0-9]{24}$/)) return 'read'; // Reading single resource
      return 'read'; // Reading list
    case 'POST': return 'create';
    case 'PUT':
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return method.toLowerCase();
  }
};

const determineResourceType = (path) => {
  const segments = path.split('/').filter(Boolean);
  
  // Check for common resource patterns
  if (segments.length >= 2) {
    // Handle nested resources like /admin/users/:id/orders
    if (segments[0] === 'admin' && segments.length >= 3) {
      return segments[1] === 'manage' ? 'admin' : segments[1];
    }
    return segments[0]; // First segment is usually the resource
  }
  
  return 'unknown';
};

const extractResourceId = (path) => {
  // Match MongoDB ObjectId in path
  const matches = path.match(/\/([a-f0-9]{24})(\/|$)/);
  return matches ? matches[1] : undefined;
};

const generateDescription = (req, statusCode) => {
  const method = req.method;
  const path = req.path;
  const status = statusCode;
  
  if (req.user) {
    return `${method} ${path} by ${req.user.email || 'user'} - ${status}`;
  }
  
  return `${method} ${path} - ${status}`;
};

const determineSeverity = (statusCode) => {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'error';
  if (statusCode >= 300) return 'warning';
  return 'info';
};

const shouldLogBody = (req) => {
  // Don't log sensitive data
  const sensitivePaths = ['/login', '/register', '/reset-password', '/change-password'];
  const isSensitive = sensitivePaths.some(path => req.path.includes(path));
  
  // Don't log file uploads (too large)
  const isFileUpload = req.headers['content-type']?.includes('multipart/form-data');
  
  return !isSensitive && !isFileUpload;
};

const sanitizeData = (data) => {
  if (!data) return data;
  
  const sensitiveFields = [
    'password', 'confirmPassword', 'oldPassword', 'newPassword',
    'token', 'accessToken', 'refreshToken', 'secret',
    'creditCard', 'cvv', 'cardNumber', 'expiry',
    'authorization', 'apiKey', 'privateKey'
  ];
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

export default activityLogger;