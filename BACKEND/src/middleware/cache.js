// FILE: src/middleware/cache.js

import { createClient } from 'redis';
import { logger } from '../utils/logger.js'

// ============================================
// REPLACE memory-cache WITH CUSTOM LRU CACHE (Same API)
// ============================================

class MemoryCache {
  constructor(maxSize = 100 * 1024 * 1024) { // 100MB default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.expiryTimers = new Map();
  }

  // Get item from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      this.currentSize -= item.size;
      if (this.expiryTimers.has(key)) {
        clearTimeout(this.expiryTimers.get(key));
        this.expiryTimers.delete(key);
      }
      this.misses++;
      return null;
    }
    
    // Move to front (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    
    return item.value;
  }

  // Put item in cache
  put(key, value, ttlMs = 300000) { // Default 5 minutes in milliseconds
    const valueStr = JSON.stringify(value);
    const size = valueStr.length;
    
    // Don't cache items larger than 10% of max size
    if (size > this.maxSize * 0.1) {
      console.warn(`⚠️ Item too large for cache: ${key} (${Math.round(size/1024)}KB)`);
      return;
    }
    
    // Ensure we have space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
    
    // Clear any existing expiry timer
    if (this.expiryTimers.has(key)) {
      clearTimeout(this.expiryTimers.get(key));
      this.expiryTimers.delete(key);
    }
    
    const expires = ttlMs ? Date.now() + ttlMs : null;
    
    // Set expiry timer if TTL provided
    if (ttlMs) {
      const timer = setTimeout(() => {
        this.del(key);
      }, ttlMs);
      timer.unref(); // Don't keep process alive
      this.expiryTimers.set(key, timer);
    }
    
    this.cache.set(key, {
      value,
      size,
      expires,
      timestamp: Date.now()
    });
    
    this.currentSize += size;
  }

  // Delete item from cache
  del(key) {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(key);
      
      if (this.expiryTimers.has(key)) {
        clearTimeout(this.expiryTimers.get(key));
        this.expiryTimers.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();
  }

  // Evict least recently used item
  evictLRU() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      const item = this.cache.get(firstKey);
      this.currentSize -= item.size;
      this.cache.delete(firstKey);
      
      if (this.expiryTimers.has(firstKey)) {
        clearTimeout(this.expiryTimers.get(firstKey));
        this.expiryTimers.delete(firstKey);
      }
    }
  }

  // Get cache stats
  stats() {
    return {
      size: this.cache.size,
      memoryUsed: `${Math.round(this.currentSize / 1024 / 1024)}MB`,
      maxSize: `${Math.round(this.maxSize / 1024 / 1024)}MB`,
      usagePercent: `${Math.round((this.currentSize / this.maxSize) * 100)}%`,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? `${Math.round((this.hits / (this.hits + this.misses)) * 100)}%`
        : '0%'
    };
  }
}

// Initialize memory cache (replace mcache)
const mcache = new MemoryCache();

// ============================================
// REDIS CLIENT WITH IMPROVED CONFIGURATION
// ============================================

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.error('❌ Max Redis reconnection attempts reached');
          return new Error('Max reconnection attempts');
        }
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries}/5)`);
        return delay;
      },
      connectTimeout: 10000,
      keepAlive: 30000
    }
  });
  
  redisClient.connect().catch(err => {
    console.error('❌ Redis connection failed:', err.message);
    redisClient = null;
  });
  
  // Handle Redis events
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });
  
  redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
  
  redisClient.on('end', () => console.log('📴 Redis Client Disconnected'));
}

// ============================================
// CACHE MIDDLEWARE - FIXED MEMORY LEAKS
// ============================================

/**
 * Cache responses - FIXED: No monkey patching that persists
 */
export const cache = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated users with specific roles
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}:${req.user?._id || 'public'}`;
    
    // Try Redis first
    if (redisClient && redisClient.isReady) {
      redisClient.get(key).then(cachedBody => {
        if (cachedBody) {
          try {
            const parsed = JSON.parse(cachedBody);
            return res.status(200).json(parsed);
          } catch (e) {
            console.error('Cache parse error:', e);
          }
        }
        
        // Store original and restore after one use
        const originalJson = res.json;
        
        // Override json method ONCE for this request only
        res.json = function(body) {
          // Restore original json first to prevent double patching
          res.json = originalJson;
          
          // Cache successful responses
          if (res.statusCode === 200) {
            redisClient.setEx(key, duration, JSON.stringify(body))
              .catch(err => console.error('Redis cache error:', err));
          }
          
          // Call original json
          return originalJson.call(this, body);
        };
        
        next();
      }).catch(err => {
        console.error('Redis error:', err);
        next();
      });
    } else {
      // Fallback to memory cache (now with LRU)
      const cachedBody = mcache.get(key);
      
      if (cachedBody) {
        return res.status(200).json(cachedBody);
      }
      
      // Store original and restore after one use
      const originalJson = res.json;
      
      // Override json method ONCE for this request only
      res.json = function(body) {
        // Restore original json first
        res.json = originalJson;
        
        // Cache successful responses
        if (res.statusCode === 200) {
          mcache.put(key, body, duration * 1000);
        }
        
        // Call original json
        return originalJson.call(this, body);
      };
      
      next();
    }
  };
};

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get value from cache
 */
export const cacheGet = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      return mcache.get(key) || null;
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 */
export const cacheSet = async (key, value, duration = 300) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, duration, JSON.stringify(value));
    } else {
      mcache.put(key, value, duration * 1000);
    }
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete specific cache key
 */
export const cacheDel = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.del(key);
    } else {
      mcache.del(key);
    }
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Clear cache for specific pattern
 */
export const clearCache = (pattern) => {
  return async (req, res, next) => {
    try {
      await clearCacheByPattern(pattern);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
    next();
  };
};

/**
 * Clear cache by pattern (utility function)
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️ Cleared ${keys.length} Redis cache keys for pattern: ${pattern}`);
      }
    } else {
      // Memory cache - clear all since pattern deletion not supported
      mcache.clear();
      console.log(`🗑️ Cleared memory cache for pattern: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error('Clear cache by pattern error:', error);
    return false;
  }
};

/**
 * Clear multiple cache patterns
 */
export const clearCachePatterns = async (patterns) => {
  try {
    for (const pattern of patterns) {
      await clearCacheByPattern(pattern);
    }
    return true;
  } catch (error) {
    console.error('Clear cache patterns error:', error);
    return false;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  return async (req, res, next) => {
    try {
      if (redisClient && redisClient.isReady) {
        const keys = await redisClient.keys('cache:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log(`🗑️ Cleared ${keys.length} Redis cache keys`);
        }
      } else {
        mcache.clear();
        console.log('🗑️ Cleared memory cache');
      }
    } catch (error) {
      console.error('Clear all cache error:', error);
    }
    next();
  };
};

/**
 * Check if key exists in cache
 */
export const cacheHas = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } else {
      return mcache.get(key) !== null;
    }
  } catch (error) {
    console.error('Cache check error:', error);
    return false;
  }
};

/**
 * Get cache TTL (time to live)
 */
export const cacheTtl = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      return await redisClient.ttl(key);
    } else {
      // Memory cache doesn't support TTL retrieval
      return -1;
    }
  } catch (error) {
    console.error('Cache TTL error:', error);
    return -1;
  }
};

/**
 * Increment cache value
 */
export const cacheIncr = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      return await redisClient.incr(key);
    } else {
      // Memory cache increment
      const current = mcache.get(key) || 0;
      const newValue = current + 1;
      mcache.put(key, newValue);
      return newValue;
    }
  } catch (error) {
    console.error('Cache increment error:', error);
    return null;
  }
};

/**
 * Get multiple cache keys
 */
export const cacheMGet = async (keys) => {
  try {
    if (redisClient && redisClient.isReady) {
      const values = await redisClient.mget(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } else {
      return keys.map(key => mcache.get(key) || null);
    }
  } catch (error) {
    console.error('Cache multi-get error:', error);
    return [];
  }
};

/**
 * Set multiple cache keys
 */
export const cacheMSet = async (keyValuePairs, duration = 300) => {
  try {
    if (redisClient && redisClient.isReady) {
      const pipeline = redisClient.multi();
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pipeline.setEx(key, duration, JSON.stringify(value));
      }
      await pipeline.exec();
    } else {
      for (const [key, value] of Object.entries(keyValuePairs)) {
        mcache.put(key, value, duration * 1000);
      }
    }
    return true;
  } catch (error) {
    console.error('Cache multi-set error:', error);
    return false;
  }
};

// ============================================
// CACHE STATS
// ============================================

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  return async (req, res, next) => {
    try {
      let stats = {
        type: redisClient ? 'redis' : 'memory',
        keys: 0,
        status: redisClient?.isReady ? 'connected' : 'disconnected',
        memoryStats: mcache.stats ? mcache.stats() : null
      };

      if (redisClient && redisClient.isReady) {
        const keys = await redisClient.keys('cache:*');
        stats.keys = keys.length;
        
        // Get Redis info
        try {
          const info = await redisClient.info();
          const infoLines = info.split('\r\n');
          infoLines.forEach(line => {
            if (line.includes('used_memory_human:')) {
              stats.memory = line.split(':')[1];
            }
            if (line.includes('keyspace_hits:')) {
              stats.hits = parseInt(line.split(':')[1]) || 0;
            }
            if (line.includes('keyspace_misses:')) {
              stats.misses = parseInt(line.split(':')[1]) || 0;
            }
          });
          
          if (stats.hits + stats.misses > 0) {
            stats.hitRate = ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%';
          }
        } catch (infoError) {
          console.error('Error getting Redis info:', infoError);
        }
      }

      req.cacheStats = stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      req.cacheStats = { error: error.message };
    }
    next();
  };
};

/**
 * Conditional cache middleware
 */
export const conditionalCache = (ttl = 60, condition = null, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user is authenticated and we don't want to cache user-specific data
    if (req.user && req.query.skipCache === 'true') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : generateCacheKey(req);

    try {
      // Check if Redis is available
      const useRedis = redisClient && redisClient.isReady;
      
      // Try to get cached response
      let cachedResponse = null;
      
      if (useRedis) {
        cachedResponse = await redisClient.get(cacheKey);
      } else {
        // Fallback to memory cache
        const memoryCached = mcache.get(cacheKey);
        cachedResponse = memoryCached ? JSON.stringify(memoryCached) : null;
      }
      
      if (cachedResponse) {
        logger.debug('Cache hit', { cacheKey, source: useRedis ? 'redis' : 'memory' });
        
        // Parse cached response
        const parsed = JSON.parse(cachedResponse);
        
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL', ttl);
        res.setHeader('X-Cache-Source', useRedis ? 'redis' : 'memory');
        
        return res.status(parsed.status || 200).json(parsed.data);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Check condition if provided
        const shouldCache = condition ? condition(req, res, data) : true;
        
        if (shouldCache && res.statusCode >= 200 && res.statusCode < 300) {
          // Prepare response for caching
          const responseToCache = {
            status: res.statusCode,
            data: data,
            timestamp: new Date().toISOString()
          };
          
          // Calculate dynamic TTL based on response data
          const dynamicTTL = calculateDynamicTTL(ttl, req, data);
          
          // Store in cache
          const cacheValue = JSON.stringify(responseToCache);
          
          if (useRedis) {
            redisClient.setEx(cacheKey, dynamicTTL, cacheValue)
              .then(() => {
                logger.debug('Response cached in Redis', { 
                  cacheKey, 
                  ttl: dynamicTTL,
                  statusCode: res.statusCode 
                });
              })
              .catch(err => {
                logger.error('Failed to cache response in Redis', { 
                  cacheKey, 
                  error: err.message 
                });
              });
          } else {
            // Fallback to memory cache
            mcache.put(cacheKey, responseToCache, dynamicTTL * 1000);
            logger.debug('Response cached in memory', { 
              cacheKey, 
              ttl: dynamicTTL,
              statusCode: res.statusCode 
            });
          }
          
          // Set cache headers
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Key', cacheKey);
          res.setHeader('X-Cache-TTL', dynamicTTL);
          res.setHeader('X-Cache-Source', useRedis ? 'redis' : 'memory');
        } else {
          res.setHeader('X-Cache', 'BYPASS');
          logger.debug('Cache bypassed', { 
            cacheKey, 
            reason: condition ? 'Condition failed' : 'Non-cacheable response' 
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

/**
 * Calculate dynamic TTL based on response data
 */
const calculateDynamicTTL = (baseTTL, req, data) => {
  // Default to base TTL
  let ttl = baseTTL;
  
  // Adjust based on response size (smaller responses can be cached longer)
  if (data) {
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 100000) { // > 100KB
      ttl = Math.floor(baseTTL * 0.5); // Cache for half the time
    } else if (dataSize < 10000) { // < 10KB
      ttl = Math.floor(baseTTL * 1.5); // Cache for 1.5x time
    }
  }
  
  // Adjust based on time of day (cache longer at night)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) { // Night time
    ttl = Math.floor(ttl * 2);
  }
  
  // Adjust for weekend
  const day = new Date().getDay();
  if (day === 0 || day === 6) { // Weekend
    ttl = Math.floor(ttl * 1.5);
  }
  
  return Math.max(60, Math.min(ttl, 86400)); // Between 1 minute and 24 hours
};

/**
 * Warm up cache with data
 */
export const warmCache = async (key, data, duration = 300) => {
  return await cacheSet(key, data, duration);
};

/**
 * Warm multiple cache keys
 */
export const warmCacheMultiple = async (keyValuePairs, duration = 300) => {
  return await cacheMSet(keyValuePairs, duration);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate cache key
 */
export const generateCacheKey = (req, prefix = 'cache') => {
  const parts = [
    prefix,
    req.originalUrl || req.url,
    req.user?._id || 'public',
    req.user?.role || 'guest'
  ];
  return parts.join(':').replace(/\s+/g, '_');
};

/**
 * Clear cache by prefix
 */
export const clearCacheByPrefix = async (prefix) => {
  return await clearCacheByPattern(`${prefix}:*`);
};

// ============================================
// EXPORT ALL - EXACTLY AS BEFORE
// ============================================

export default {
  // Middleware
  cache,
  clearCache,
  clearAllCache,
  getCacheStats,
  
  // Cache operations
  cacheGet,
  cacheSet,
  cacheDel,
  cacheHas,
  cacheTtl,
  cacheIncr,
  cacheMGet,
  cacheMSet,
  
  // Utility functions
  clearCacheByPattern,
  clearCachePatterns,
  clearCacheByPrefix,
  generateCacheKey,
  warmCache,
  warmCacheMultiple,
  conditionalCache
};