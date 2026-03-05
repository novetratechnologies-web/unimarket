// middleware/payloadLimiter.js
export const payloadLimiter = (req, res, next) => {
  // Limit based on endpoint
  const endpoint = req.path;
  const method = req.method;
  
  // Define limits per endpoint
  const limits = {
    '/api/products': { max: 50, time: 60000 }, // 50 products per minute
    '/api/orders': { max: 30, time: 60000 },
    '/api/admin/activities': { max: 100, time: 60000 },
    '/api/admin/users': { max: 50, time: 60000 },
    'default': { max: 100, time: 60000 }
  };
  
  // Get limit for this endpoint
  const limit = Object.keys(limits).find(key => endpoint.startsWith(key)) 
    ? limits[Object.keys(limits).find(key => endpoint.startsWith(key))] 
    : limits.default;
  
  // Store in request for later use
  req.payloadLimit = limit;
  
  // Check if client requested too many items
  if (req.query.limit && parseInt(req.query.limit) > limit.max) {
    req.query.limit = limit.max; // Force limit down
    console.warn(`⚠️ Reduced limit from ${req.query.limit} to ${limit.max} for ${endpoint}`);
  }
  
  next();
};