// config/redis.js
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// REDIS CONFIGURATION
// ============================================

const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB) || 0,
  
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis max retries reached');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE) || 30000,
    noDelay: true
  },
  
  commandsQueueMaxLength: parseInt(process.env.REDIS_COMMANDS_QUEUE_MAX_LENGTH) || 5000,
  
  // 🔥 IMPORTANT: This must be false to match rate-limit-redis expectations
  disableOfflineQueue: false,
  
  pingInterval: 1000
};

// ============================================
// CREATE REDIS CLIENT
// ============================================

let client;

try {
  client = createClient(redisConfig);
} catch (error) {
  console.error('❌ Failed to create Redis client:', error);
  // Create a mock client for development when Redis is not available
  client = createMockClient();
}

// ============================================
// CONNECTION EVENT HANDLERS
// ============================================

client.on('connect', () => {
  console.log('🔄 Redis client connecting...');
});

client.on('ready', () => {
  console.log('✅ Redis client connected and ready');
});

client.on('error', (err) => {
  console.error('❌ Redis client error:', err.message);
});

client.on('end', () => {
  console.log('📴 Redis client disconnected');
});

client.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

// ============================================
// CONNECT TO REDIS
// ============================================

const connectRedis = async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.log('⚠️ Continuing without Redis - rate limiting will use memory store');
    
    // Replace with mock client if connection fails
    if (!client.isMock) {
      client = createMockClient();
    }
    return false;
  }
};

// Create a mock client for when Redis is not available
function createMockClient() {
  console.log('🔄 Creating mock Redis client for development');
  
  const mockStorage = new Map();
  
  return {
    isMock: true,
    
    // 🔥 ADDED: Call method for rate-limit-redis compatibility
    call: async (command, ...args) => {
      console.log(`📝 Mock Redis command: ${command}`, args);
      
      // Basic command implementation
      switch (command.toUpperCase()) {
        case 'GET':
          return mockStorage.get(args[0]) || null;
        case 'SET':
          mockStorage.set(args[0], args[1]);
          return 'OK';
        case 'DEL':
          if (Array.isArray(args[0])) {
            args[0].forEach(key => mockStorage.delete(key));
            return args[0].length;
          }
          return mockStorage.delete(args[0]) ? 1 : 0;
        case 'INCR':
          const val = (parseInt(mockStorage.get(args[0])) || 0) + 1;
          mockStorage.set(args[0], val.toString());
          return val;
        case 'EXPIRE':
          return 1;
        case 'TTL':
          return -1;
        case 'PING':
          return 'PONG';
        default:
          return null;
      }
    },
    
    // Connection methods
    connect: async () => true,
    disconnect: async () => true,
    quit: async () => true,
    
    // String operations
    get: async (key) => mockStorage.get(key) || null,
    set: async (key, value, options) => {
      mockStorage.set(key, value);
      return 'OK';
    },
    setEx: async (key, seconds, value) => {
      mockStorage.set(key, value);
      return 'OK';
    },
    del: async (keys) => {
      if (Array.isArray(keys)) {
        keys.forEach(key => mockStorage.delete(key));
        return keys.length;
      }
      return mockStorage.delete(keys) ? 1 : 0;
    },
    incr: async (key) => {
      const val = (parseInt(mockStorage.get(key)) || 0) + 1;
      mockStorage.set(key, val.toString());
      return val;
    },
    decr: async (key) => {
      const val = (parseInt(mockStorage.get(key)) || 0) - 1;
      mockStorage.set(key, val.toString());
      return val;
    },
    exists: async (key) => mockStorage.has(key) ? 1 : 0,
    expire: async (key, seconds) => 1,
    ttl: async (key) => -1,
    
    // Hash operations
    hGet: async (key, field) => {
      const hash = mockStorage.get(key);
      return hash?.[field] || null;
    },
    hSet: async (key, field, value) => {
      const hash = mockStorage.get(key) || {};
      hash[field] = value;
      mockStorage.set(key, hash);
      return 1;
    },
    hGetAll: async (key) => mockStorage.get(key) || {},
    hDel: async (key, field) => {
      const hash = mockStorage.get(key);
      if (hash && field in hash) {
        delete hash[field];
        return 1;
      }
      return 0;
    },
    
    // List operations
    lPush: async (key, value) => {
      const list = mockStorage.get(key) || [];
      list.unshift(value);
      mockStorage.set(key, list);
      return list.length;
    },
    rPush: async (key, value) => {
      const list = mockStorage.get(key) || [];
      list.push(value);
      mockStorage.set(key, list);
      return list.length;
    },
    lPop: async (key) => {
      const list = mockStorage.get(key) || [];
      const value = list.shift();
      mockStorage.set(key, list);
      return value || null;
    },
    rPop: async (key) => {
      const list = mockStorage.get(key) || [];
      const value = list.pop();
      mockStorage.set(key, list);
      return value || null;
    },
    lRange: async (key, start, stop) => {
      const list = mockStorage.get(key) || [];
      return list.slice(start, stop + 1);
    },
    lLen: async (key) => {
      const list = mockStorage.get(key) || [];
      return list.length;
    },
    
    // Set operations
    sAdd: async (key, value) => {
      const set = mockStorage.get(key) || new Set();
      set.add(value);
      mockStorage.set(key, set);
      return 1;
    },
    sRem: async (key, value) => {
      const set = mockStorage.get(key);
      if (set) {
        return set.delete(value) ? 1 : 0;
      }
      return 0;
    },
    sMembers: async (key) => {
      const set = mockStorage.get(key) || new Set();
      return Array.from(set);
    },
    
    // Key operations
    keys: async (pattern) => {
      const keys = Array.from(mockStorage.keys());
      if (pattern === '*') return keys;
      // Simple pattern matching (only supports * wildcard)
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return keys.filter(key => regex.test(key));
    },
    
    // Server operations
    ping: async () => 'PONG',
    flushDb: async () => {
      mockStorage.clear();
      return 'OK';
    },
    
    // Batch operations
    multi: () => ({
      exec: async () => []
    }),
    
    // Status
    isOpen: true,
    isReady: true
  };
}

// ============================================
// CONNECTION PROMISE
// ============================================

const connectionPromise = connectRedis();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Set cache with expiration
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, stringValue);
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
};

/**
 * Get cache
 */
const getCache = async (key) => {
  try {
    const value = await client.get(key);
    if (!value) return null;
    
    // Try to parse JSON, return as-is if not JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

/**
 * Delete cache by pattern
 */
const deletePattern = async (pattern) => {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Redis deletePattern error:', error);
    return 0;
  }
};

/**
 * Check if key exists
 */
const keyExists = async (key) => {
  try {
    return await client.exists(key);
  } catch (error) {
    console.error('Redis keyExists error:', error);
    return false;
  }
};

/**
 * Get cache with fallback
 */
const getOrSet = async (key, fetchFn, ttl = 3600) => {
  try {
    // Try to get from cache
    const cached = await getCache(key);
    if (cached) return cached;

    // If not in cache, fetch data
    const data = await fetchFn();
    
    // Store in cache
    await setCache(key, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Redis getOrSet error:', error);
    // If cache fails, just fetch data
    return await fetchFn();
  }
};

/**
 * Increment counter
 */
const increment = async (key, ttl = null) => {
  try {
    const value = await client.incr(key);
    if (ttl) {
      await client.expire(key, ttl);
    }
    return value;
  } catch (error) {
    console.error('Redis increment error:', error);
    return null;
  }
};

/**
 * Rate limiting helper
 */
const rateLimit = async (key, maxRequests, windowSeconds) => {
  try {
    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }
    
    const ttl = await client.ttl(key);
    
    return {
      success: current <= maxRequests,
      current,
      remaining: Math.max(0, maxRequests - current),
      reset: ttl > 0 ? ttl : windowSeconds
    };
  } catch (error) {
    console.error('Redis rateLimit error:', error);
    // If Redis fails, allow the request (fail open)
    return {
      success: true,
      current: 0,
      remaining: maxRequests,
      reset: windowSeconds
    };
  }
};

/**
 * Store session data
 */
const setSession = async (sessionId, data, ttl = 86400) => {
  return setCache(`session:${sessionId}`, data, ttl);
};

/**
 * Get session data
 */
const getSession = async (sessionId) => {
  return getCache(`session:${sessionId}`);
};

/**
 * Delete session
 */
const deleteSession = async (sessionId) => {
  try {
    await client.del(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('Redis deleteSession error:', error);
    return false;
  }
};

/**
 * Store user token
 */
const setUserToken = async (userId, token, ttl = 604800) => {
  return setCache(`token:${userId}:${token}`, { userId, token }, ttl);
};

/**
 * Verify user token
 */
const verifyUserToken = async (userId, token) => {
  return getCache(`token:${userId}:${token}`);
};

/**
 * Remove user token
 */
const removeUserToken = async (userId, token) => {
  try {
    await client.del(`token:${userId}:${token}`);
    return true;
  } catch (error) {
    console.error('Redis removeUserToken error:', error);
    return false;
  }
};

/**
 * Remove all user tokens
 */
const removeAllUserTokens = async (userId) => {
  return deletePattern(`token:${userId}:*`);
};

/**
 * Store job data
 */
const setJob = async (jobId, data, ttl = 3600) => {
  return setCache(`job:${jobId}`, data, ttl);
};

/**
 * Get job data
 */
const getJob = async (jobId) => {
  return getCache(`job:${jobId}`);
};

/**
 * Update job status
 */
const updateJobStatus = async (jobId, status, result = null) => {
  const job = await getJob(jobId) || {};
  job.status = status;
  job.updatedAt = new Date();
  if (result) job.result = result;
  return setJob(jobId, job);
};

// ============================================
// QUEUE OPERATIONS
// ============================================

/**
 * Add to queue
 */
const addToQueue = async (queueName, data) => {
  try {
    const id = Date.now().toString();
    const item = {
      id,
      data,
      addedAt: new Date(),
      attempts: 0
    };
    await client.rPush(`queue:${queueName}`, JSON.stringify(item));
    return id;
  } catch (error) {
    console.error('Redis addToQueue error:', error);
    return null;
  }
};

/**
 * Get from queue
 */
const getFromQueue = async (queueName) => {
  try {
    const item = await client.lPop(`queue:${queueName}`);
    if (item) {
      return JSON.parse(item);
    }
    return null;
  } catch (error) {
    console.error('Redis getFromQueue error:', error);
    return null;
  }
};

/**
 * Get queue length
 */
const getQueueLength = async (queueName) => {
  try {
    return await client.lLen(`queue:${queueName}`);
  } catch (error) {
    console.error('Redis getQueueLength error:', error);
    return 0;
  }
};

// ============================================
// HEALTH CHECK
// ============================================

const healthCheck = async () => {
  try {
    await client.ping();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mock: client.isMock || false
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================
// FLUSH DATABASE (USE WITH CAUTION!)
// ============================================

const flushDb = async () => {
  if (process.env.NODE_ENV === 'production' && !client.isMock) {
    console.warn('⚠️ Attempted to flush Redis in production - blocked');
    return false;
  }
  
  try {
    await client.flushDb();
    console.log('🗑️ Redis database flushed');
    return true;
  } catch (error) {
    console.error('Redis flushDb error:', error);
    return false;
  }
};

// ============================================
// EXPORT
// ============================================

export default client;

export {
  connectionPromise,
  setCache,
  getCache,
  deletePattern,
  keyExists,
  getOrSet,
  increment,
  rateLimit,
  setSession,
  getSession,
  deleteSession,
  setUserToken,
  verifyUserToken,
  removeUserToken,
  removeAllUserTokens,
  setJob,
  getJob,
  updateJobStatus,
  addToQueue,
  getFromQueue,
  getQueueLength,
  healthCheck,
  flushDb
};