// src/middleware/connectionMonitor.js
import mongoose from 'mongoose';

let requestCount = 0;
let activeRequests = 0;
let maxConcurrent = 0;

export const connectionMonitor = (req, res, next) => {
  // Track request count
  requestCount++;
  activeRequests++;
  
  // Track peak concurrent requests
  if (activeRequests > maxConcurrent) {
    maxConcurrent = activeRequests;
    console.log(`📊 New peak concurrent requests: ${maxConcurrent}`);
  }
  
  // Store start time
  req.requestStartTime = Date.now();
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log when request completes
  res.on('finish', () => {
    activeRequests--;
    const duration = Date.now() - req.requestStartTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐢 Slow request (${duration}ms): ${req.method} ${req.url}`);
    }
    
    // Check MongoDB connection pool
    const poolSize = mongoose.connection?.client?.topology?.connections?.()?.size || 0;
    if (poolSize > 50) {
      console.warn(`⚠️ MongoDB connection pool high: ${poolSize}`);
    }
  });
  
  next();
};

// Add endpoint to check status
export const getConnectionStatus = () => {
  const mem = process.memoryUsage();
  const poolSize = mongoose.connection?.client?.topology?.connections?.()?.size || 0;
  
  return {
    requests: {
      total: requestCount,
      active: activeRequests,
      peak: maxConcurrent
    },
    memory: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      percent: Math.round((mem.heapUsed / mem.heapTotal) * 100)
    },
    mongodb: {
      poolSize,
      state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  };
};