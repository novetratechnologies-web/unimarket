// middleware/resourceMonitor.js - PROFESSIONAL MEMORY DIAGNOSTIC TOOL
import os from 'os';
import v8 from 'v8';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Thresholds
  HEAP_THRESHOLD: 85,           // % of heap limit
  RSS_THRESHOLD: 85,             // % of system RAM
  SYSTEM_MEMORY_THRESHOLD: 90,    // % of total system RAM
  CPU_THRESHOLD: 80,              // % CPU per core
  
  // Request tracking
  SLOW_REQUEST_THRESHOLD: 1000,   // ms
  MEMORY_HEAVY_THRESHOLD: 50,     // MB growth per request
  
  // Leak detection
  LEAK_DETECTION_SAMPLES: 20,     // Number of samples for leak detection
  LEAK_GROWTH_THRESHOLD: 15,      // % growth over time
  LEAK_TIME_WINDOW: 300000,       // 5 minutes in ms
  
  // Sampling
  HEAP_SNAPSHOT_INTERVAL: 60000,  // 1 minute
  METRICS_LOG_INTERVAL: 300000,   // 5 minutes
  SAMPLE_RETENTION: 1000,         // Keep 1000 samples
  
  // Debug
  ENABLE_MODULE_TRACKING: true,   // Track memory by module
  LOG_DIR: path.join(process.cwd(), 'logs', 'memory')
};

// ============================================
// ENHANCED TRACKING STORES
// ============================================

// Request tracking
const requestLog = [];
const errorLog = [];
const slowEndpoints = new Map();
const errorEndpoints = new Map();

// Memory tracking
const memorySamples = [];
const heapSpaceHistory = [];
const gcEventLog = [];

// Module-level memory tracking (if enabled)
const moduleMemory = new Map(); // Track memory by module/route

// Leak detection
let leakDetectionSamples = [];
let leakWarningIssued = false;
let lastGCFlag = false;

// Ensure log directory exists
if (!fs.existsSync(CONFIG.LOG_DIR)) {
  fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
}

// ============================================
// ADVANCED HELPER FUNCTIONS
// ============================================

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const getHeapSpaces = () => {
  try {
    return v8.getHeapSpaceStatistics().map(space => ({
      name: space.space_name,
      used: space.space_used_size,
      usedFormatted: formatBytes(space.space_used_size),
      total: space.space_total_size,
      totalFormatted: formatBytes(space.space_total_size),
      percent: Math.round((space.space_used_size / space.space_total_size) * 100)
    }));
  } catch (err) {
    return [];
  }
};

const getHeapStatistics = () => {
  try {
    const stats = v8.getHeapStatistics();
    return {
      totalHeapSize: stats.total_heap_size,
      totalHeapSizeFormatted: formatBytes(stats.total_heap_size),
      usedHeapSize: stats.used_heap_size,
      usedHeapSizeFormatted: formatBytes(stats.used_heap_size),
      heapSizeLimit: stats.heap_size_limit,
      heapSizeLimitFormatted: formatBytes(stats.heap_size_limit),
      totalPhysicalSize: stats.total_physical_size,
      totalAvailableSize: stats.total_available_size,
      mallocedMemory: stats.malloced_memory,
      peakMallocedMemory: stats.peak_malloced_memory,
      numberOfNativeContexts: stats.number_of_native_contexts,
      numberOfDetachedContexts: stats.number_of_detached_contexts
    };
  } catch (err) {
    return {};
  }
};

const getModuleMemoryUsage = () => {
  if (!CONFIG.ENABLE_MODULE_TRACKING) return [];
  
  const modules = [];
  for (const [name, data] of moduleMemory.entries()) {
    modules.push({
      name,
      count: data.count,
      totalGrowth: formatBytes(data.totalGrowth),
      avgGrowthPerRequest: formatBytes(data.avgGrowth),
      lastRequest: data.lastRequest
    });
  }
  return modules.sort((a, b) => b.totalGrowth - a.totalGrowth);
};

/**
 * Advanced leak detection with statistical analysis
 */
const detectMemoryLeak = () => {
  const samples = leakDetectionSamples;
  if (samples.length < CONFIG.LEAK_DETECTION_SAMPLES) return null;

  // Calculate moving average
  const values = samples.map(s => s.heapUsed);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate trend using linear regression
  const x = Array.from({ length: values.length }, (_, i) => i);
  const xMean = (values.length - 1) / 2;
  
  const slope = x.reduce((sum, xi, i) => sum + (xi - xMean) * (values[i] - mean), 0) /
                x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  
  const growthRate = (slope * samples.length / mean) * 100;
  const timeSpan = (samples[samples.length - 1].timestamp - samples[0].timestamp);
  
  // Detect leak if consistent upward trend
  const isLeaking = growthRate > CONFIG.LEAK_GROWTH_THRESHOLD && 
                    slope > 0 && 
                    timeSpan < CONFIG.LEAK_TIME_WINDOW &&
                    !leakWarningIssued;

  if (isLeaking) {
    leakWarningIssued = true;
    return {
      detected: true,
      growthRate: growthRate.toFixed(2) + '%',
      estimatedLeakPerHour: formatBytes(Math.abs(slope) * 3600000),
      timeSpan: formatDuration(timeSpan),
      confidence: Math.min(100, Math.round((1 - stdDev / mean) * 100)),
      samples: samples.length,
      message: `🚨 MEMORY LEAK DETECTED! Growing at ${growthRate.toFixed(2)}% over ${formatDuration(timeSpan)}`
    };
  }

  // Reset warning flag if trend reverses
  if (slope < 0) {
    leakWarningIssued = false;
  }

  return null;
};

const formatDuration = (ms) => {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  if (ms < 3600000) return (ms / 60000).toFixed(1) + 'm';
  return (ms / 3600000).toFixed(1) + 'h';
};

/**
 * Track memory by module/endpoint
 */
const trackModuleMemory = (req, startMemory, endMemory, duration) => {
  if (!CONFIG.ENABLE_MODULE_TRACKING) return;
  
  const moduleName = req.route?.path || req.path || 'unknown';
  const key = `${req.method} ${moduleName}`;
  
  const current = moduleMemory.get(key) || {
    count: 0,
    totalGrowth: 0,
    avgGrowth: 0,
    maxGrowth: 0,
    lastRequest: null,
    totalDuration: 0,
    avgDuration: 0
  };
  
  const growth = endMemory - startMemory;
  
  current.count++;
  current.totalGrowth += growth;
  current.avgGrowth = current.totalGrowth / current.count;
  current.maxGrowth = Math.max(current.maxGrowth, growth);
  current.lastRequest = new Date().toISOString();
  current.totalDuration += duration;
  current.avgDuration = Math.round(current.totalDuration / current.count);
  
  moduleMemory.set(key, current);
};

// ============================================
// MAIN MONITOR MIDDLEWARE
// ============================================

const resourceMonitor = (req, res, next) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  // Track request
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Get comprehensive metrics
  const memoryUsage = process.memoryUsage();
  const cpuLoad = os.loadavg()[0];
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const systemMemoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  const heapStats = getHeapStatistics();
  const heapSpaces = getHeapSpaces();
  
  // Calculate RSS as percentage of system memory (REAL memory usage)
  const rssPercent = (memoryUsage.rss / totalMemory) * 100;
  
  // Store CORRECT metrics
  req.resourceMetrics = {
    requestId,
    memory: {
      // Heap metrics (V8 managed memory)
      heapUsed: memoryUsage.heapUsed,
      heapUsedFormatted: formatBytes(memoryUsage.heapUsed),
      heapTotal: memoryUsage.heapTotal,
      heapTotalFormatted: formatBytes(memoryUsage.heapTotal),
      heapPercent: Math.round((memoryUsage.heapUsed / heapStats.heapSizeLimit) * 100), // % of heap limit
      
      // RSS (actual physical memory used by Node)
      rss: memoryUsage.rss,
      rssFormatted: formatBytes(memoryUsage.rss),
      rssPercent: Math.round(rssPercent), // % of system RAM
      
      // External memory
      external: memoryUsage.external,
      externalFormatted: formatBytes(memoryUsage.external),
      
      // ArrayBuffers
      arrayBuffers: memoryUsage.arrayBuffers || 0,
      arrayBuffersFormatted: formatBytes(memoryUsage.arrayBuffers || 0),
      
      spaces: heapSpaces,
      heapStats
    },
    cpu: {
      loadAvg: cpuLoad,
      percent: Math.round(cpuLoad * 100 / os.cpus().length)
    },
    system: {
      memoryPercent: Math.round(systemMemoryPercent),
      freeMemory: formatBytes(freeMemory),
      totalMemory: formatBytes(totalMemory),
      usedMemory: formatBytes(totalMemory - freeMemory)
    }
  };

  // Track response
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDiff = (endMemory - startMemory) / 1024 / 1024; // MB
    
    // Track module memory
    trackModuleMemory(req, startMemory, endMemory, duration);
    
    // Store request log
    const requestData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: Math.round(duration),
      memoryDelta: Math.round(memoryDiff * 100) / 100,
      rssAfter: formatBytes(process.memoryUsage().rss),
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100)
    };
    
    requestLog.unshift(requestData);
    if (requestLog.length > CONFIG.SAMPLE_RETENTION) requestLog.pop();
    
    // Sample for leak detection (using RSS for accuracy)
    leakDetectionSamples.push({
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      rss: memoryUsage.rss,
      external: memoryUsage.external
    });
    
    if (leakDetectionSamples.length > CONFIG.LEAK_DETECTION_SAMPLES) {
      leakDetectionSamples.shift();
    }
    
    // Track memory samples over time
    memorySamples.push({
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      rss: memoryUsage.rss,
      external: memoryUsage.external
    });
    
    if (memorySamples.length > CONFIG.SAMPLE_RETENTION) {
      memorySamples.shift();
    }
    
    // Track slow requests
    if (duration > CONFIG.SLOW_REQUEST_THRESHOLD) {
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      const current = slowEndpoints.get(endpoint) || { count: 0, totalTime: 0, maxTime: 0 };
      current.count++;
      current.totalTime += duration;
      current.maxTime = Math.max(current.maxTime, duration);
      current.avgTime = Math.round(current.totalTime / current.count);
      slowEndpoints.set(endpoint, current);
      
      console.warn(`🐢 Slow request:`, {
        requestId,
        endpoint,
        duration: `${Math.round(duration)}ms`,
        memoryDelta: `${memoryDiff.toFixed(2)}MB`
      });
    }
    
    // Track memory-heavy requests
    if (memoryDiff > CONFIG.MEMORY_HEAVY_THRESHOLD) {
      console.warn(`🐘 Memory heavy:`, {
        requestId,
        method: req.method,
        url: req.url,
        memoryDelta: `${memoryDiff.toFixed(2)}MB`,
        rssAfter: formatBytes(process.memoryUsage().rss)
      });
    }
  });

  // Track errors
  res.on('error', (err) => {
    const errorData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      error: err.message,
      stack: err.stack,
      ip: req.ip
    };
    
    errorLog.unshift(errorData);
    if (errorLog.length > 500) errorLog.pop();
    
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const current = errorEndpoints.get(endpoint) || { count: 0, lastError: '' };
    current.count++;
    current.lastError = err.message;
    current.lastSeen = new Date().toISOString();
    errorEndpoints.set(endpoint, current);
  });

  // Check for system overload using CORRECT metrics
  const isOverloaded = 
    req.resourceMetrics.memory.rssPercent > CONFIG.RSS_THRESHOLD || // RSS % of system RAM
    req.resourceMetrics.memory.heapPercent > CONFIG.HEAP_THRESHOLD || // Heap % of limit
    systemMemoryPercent > CONFIG.SYSTEM_MEMORY_THRESHOLD ||
    req.resourceMetrics.cpu.percent > CONFIG.CPU_THRESHOLD;

  if (isOverloaded) {
    const leakWarning = detectMemoryLeak();
    
    // Log with CORRECT metrics
    console.warn(`⚠️ SYSTEM OVERLOAD DETECTED:`, {
      requestId,
      // CORRECT METRICS:
      rssPercent: `${req.resourceMetrics.memory.rssPercent}%`, // Actual Node memory
      heapPercent: `${req.resourceMetrics.memory.heapPercent}%`, // Heap usage
      systemMemory: `${req.resourceMetrics.system.memoryPercent}%`, // System RAM
      cpu: `${req.resourceMetrics.cpu.percent}%`,
      rssUsed: req.resourceMetrics.memory.rssFormatted,
      heapUsed: req.resourceMetrics.memory.heapUsedFormatted,
      leakWarning: leakWarning?.message
    });

    // Save snapshot for debugging
    if (req.resourceMetrics.memory.rssPercent > 80) {
      saveMemorySnapshot(req);
    }

    // Only reject requests for non-critical endpoints when REALLY overloaded
    if (req.resourceMetrics.memory.rssPercent > 90 && 
        (req.path.includes('/api/analytics') || 
         req.path.includes('/api/reports') ||
         req.path.includes('/api/export'))) {
      
      console.warn(`🚫 Rejecting request due to critical overload: ${req.method} ${req.url}`);
      
      return res.status(503).json({
        success: false,
        error: 'System under heavy load',
        retryAfter: 30,
        message: 'Server is currently overloaded. Please try again later.',
        requestId,
        metrics: {
          memory: req.resourceMetrics.memory.rssFormatted,
          memoryPercent: req.resourceMetrics.memory.rssPercent,
          systemMemoryPercent: req.resourceMetrics.system.memoryPercent
        }
      });
    }
  }

  next();
};

// ============================================
// EXPORTED METRICS FUNCTIONS
// ============================================

const getSystemMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuLoad = os.loadavg();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const heapSpaces = getHeapSpaces();
  const heapStats = getHeapStatistics();
  const leakWarning = detectMemoryLeak();
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      status: leakWarning ? 'LEAK_DETECTED' : 'HEALTHY',
      uptime: Math.round(process.uptime() / 60) + ' minutes',
      pid: process.pid,
      version: process.version
    },
    memory: {
      heap: {
        used: formatBytes(memoryUsage.heapUsed),
        total: formatBytes(memoryUsage.heapTotal),
        percent: Math.round((memoryUsage.heapUsed / heapStats.heapSizeLimit) * 100),
        limit: formatBytes(heapStats.heapSizeLimit)
      },
      rss: {
        used: formatBytes(memoryUsage.rss),
        percent: Math.round((memoryUsage.rss / totalMemory) * 100),
        ofSystem: Math.round((memoryUsage.rss / totalMemory) * 100) + '%'
      },
      external: formatBytes(memoryUsage.external),
      spaces: heapSpaces,
      heapStats
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: formatBytes(totalMemory),
        free: formatBytes(freeMemory),
        used: formatBytes(totalMemory - freeMemory),
        percent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100)
      },
      loadavg: cpuLoad.map(l => l.toFixed(2)),
      uptime: Math.round(os.uptime() / 3600) + ' hours'
    },
    warnings: {
      memoryLeak: leakWarning
    },
    topModules: getModuleMemoryUsage().slice(0, 10)
  };
};

const getRequestStats = () => {
  const avgDuration = requestLog.length 
    ? Math.round(requestLog.reduce((sum, r) => sum + r.duration, 0) / requestLog.length)
    : 0;
  
  const avgMemoryDelta = requestLog.length
    ? (requestLog.reduce((sum, r) => sum + Math.abs(r.memoryDelta), 0) / requestLog.length).toFixed(2)
    : 0;
  
  const statusCodes = {};
  requestLog.forEach(r => {
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
  });
  
  return {
    total: requestLog.length,
    recent: requestLog.slice(0, 50),
    averages: {
      duration: `${avgDuration}ms`,
      memoryDelta: `${avgMemoryDelta}MB`
    },
    statusCodes,
    slowEndpoints: Array.from(slowEndpoints.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgTime: `${data.avgTime}ms`,
        maxTime: `${data.maxTime}ms`
      }))
      .sort((a, b) => b.count - a.count),
    errorEndpoints: Array.from(errorEndpoints.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        lastError: data.lastError,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.count - a.count)
  };
};

const getErrorLog = (limit = 100) => {
  return errorLog.slice(0, limit);
};

const getMemoryAnalysis = () => {
  const mem = process.memoryUsage();
  const heapSpaces = getHeapSpaces();
  const leakWarning = detectMemoryLeak();
  const totalMemory = os.totalmem();
  
  // Analyze memory growth over time
  const growth = {};
  if (memorySamples.length > 1) {
    const first = memorySamples[0];
    const last = memorySamples[memorySamples.length - 1];
    const timeSpan = (last.timestamp - first.timestamp) / 1000 / 60; // minutes
    
    growth.total = {
      heap: formatBytes(last.heapUsed - first.heapUsed),
      rss: formatBytes(last.rss - first.rss),
      timeSpan: Math.round(timeSpan) + 'm',
      ratePerMinute: {
        heap: formatBytes((last.heapUsed - first.heapUsed) / timeSpan),
        rss: formatBytes((last.rss - first.rss) / timeSpan)
      }
    };
  }
  
  return {
    current: {
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      rss: formatBytes(mem.rss),
      rssPercent: Math.round((mem.rss / totalMemory) * 100),
      external: formatBytes(mem.external)
    },
    spaces: heapSpaces,
    growth,
    analysis: {
      leakWarning,
      topModules: getModuleMemoryUsage().slice(0, 10),
      recommendations: generateRecommendations(mem, leakWarning)
    },
    samples: memorySamples.slice(-20).map(s => ({
      time: new Date(s.timestamp).toISOString(),
      heap: formatBytes(s.heapUsed),
      rss: formatBytes(s.rss)
    }))
  };
};

const generateRecommendations = (mem, leakWarning) => {
  const recs = [];
  
  if (mem.rss > os.totalmem() * 0.8) {
    recs.push('⚠️ RSS is >80% of system memory - consider scaling horizontally');
  }
  
  if (mem.heapUsed / mem.heapTotal > 0.8) {
    recs.push('⚠️ Heap usage >80% - increase --max-old-space-size or fix leaks');
  }
  
  if (leakWarning) {
    recs.push('🚨 MEMORY LEAK DETECTED - check these modules:');
    getModuleMemoryUsage().slice(0, 5).forEach(m => {
      recs.push(`   - ${m.name}: growing ${m.avgGrowth} per request`);
    });
  }
  
  if (slowEndpoints.size > 10) {
    recs.push('🐢 Multiple slow endpoints detected - check database indexes');
  }
  
  return recs;
};

const saveMemorySnapshot = (req) => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      requestId: req.requestId
    },
    metrics: getSystemMetrics(),
    topModules: getModuleMemoryUsage().slice(0, 20)
  };
  
  const filename = path.join(CONFIG.LOG_DIR, `snapshot-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
  console.log(`💾 Memory snapshot saved to ${filename}`);
};

const clearMetrics = () => {
  requestLog.length = 0;
  errorLog.length = 0;
  slowEndpoints.clear();
  errorEndpoints.clear();
  memorySamples.length = 0;
  leakDetectionSamples = [];
  leakWarningIssued = false;
  moduleMemory.clear();
  return { message: 'All metrics cleared' };
};

// ============================================
// EXPORTS
// ============================================

export default resourceMonitor;

export { 
  getSystemMetrics,
  getRequestStats, 
  getErrorLog, 
  getMemoryAnalysis,
  getModuleMemoryUsage,
  clearMetrics 
};