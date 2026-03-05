// middleware/timeoutHandler.js
import { getQueueStatus } from './requestQueue.js';

// Track active connections
const activeConnections = new Map();
let connectionCounter = 0;

export const connectionTracker = (req, res, next) => {
  const connectionId = ++connectionCounter;
  
  // Track this connection
  activeConnections.set(connectionId, {
    id: connectionId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    startTime: Date.now(),
    requestId: req.id
  });

  // Remove when finished
  res.on('finish', () => {
    activeConnections.delete(connectionId);
  });

  res.on('close', () => {
    activeConnections.delete(connectionId);
  });

  next();
};

// Request timeout middleware
export const requestTimeoutMiddleware = (req, res, next) => {
  // Set timeout for this request (30 seconds)
  req.setTimeout(30000, () => {
    console.error(`❌ Request timeout: ${req.method} ${req.url}`);
    
    // Check if headers already sent
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout',
        message: 'The request took too long to process',
        code: 'REQUEST_TIMEOUT'
      });
    }
    
    // Destroy the connection
    req.destroy();
  });

  // Set response timeout
  res.setTimeout(30000, () => {
    console.error(`❌ Response timeout: ${req.method} ${req.url}`);
    
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Response timeout',
        message: 'The response took too long to send',
        code: 'RESPONSE_TIMEOUT'
      });
    }
  });

  next();
};

// Get active connections
export const getActiveConnections = () => {
  const now = Date.now();
  return Array.from(activeConnections.values()).map(conn => ({
    ...conn,
    duration: now - conn.startTime,
    age: `${Math.round((now - conn.startTime) / 1000)}s`
  }));
};

// Middleware to limit concurrent requests per IP
export const ipConcurrencyLimiter = (maxPerIP = 5) => {
  const ipConnections = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const current = ipConnections.get(ip) || 0;

    if (current >= maxPerIP) {
      return res.status(429).json({
        success: false,
        error: 'Too many concurrent requests',
        message: `Maximum ${maxPerIP} concurrent requests allowed from your IP`,
        code: 'CONCURRENCY_LIMIT_EXCEEDED'
      });
    }

    ipConnections.set(ip, current + 1);

    res.on('finish', () => {
      const updated = ipConnections.get(ip) - 1;
      if (updated <= 0) {
        ipConnections.delete(ip);
      } else {
        ipConnections.set(ip, updated);
      }
    });

    next();
  };
};