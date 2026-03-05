// config/db.js - FOLLOWING MONGODB DOCUMENTATION
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unimarket';
    
    console.log(`🔄 Connecting to MongoDB...`);
    
    // Connection options as per MongoDB spec [citation:4]
    const options = {
      // Core pool settings from the specification
      maxPoolSize: 100,              // Maximum connections (default 100)
      minPoolSize: 20,                // Minimum connections to maintain
      maxIdleTimeMS: 30000,           // Close idle connections after 30s
      waitQueueTimeoutMS: 5000,       // How long threads wait for connection
      
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 20000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Force IPv4
      family: 4
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // ============================================
    // PROPER POOL MONITORING - Using connPoolStats
    // ============================================
    
    // Function to get REAL pool stats using database command
    const getPoolStats = async () => {
      try {
        const db = mongoose.connection.db;
        
        // This is the CORRECT way per MongoDB docs [citation:1][citation:6]
        const stats = await db.command({ connPoolStats: 1 });
        
        
        // Per-pool breakdown if available [citation:6]
        if (stats.pools) {
          Object.keys(stats.pools).forEach(poolName => {
            const pool = stats.pools[poolName];
            if (pool.poolInUse !== undefined) {
              console.log(`   Pool ${poolName}: ${pool.poolInUse} in use, ${pool.poolAvailable} available`);
            }
          });
        }
        
        return stats;
      } catch (err) {
        console.log('⚠️ Could not get pool stats:', err.message);
      }
    };

    // Get stats after connection
    setTimeout(async () => {
      await getPoolStats();
    }, 3000);
    
    // Monitor pool every 30 seconds using the documented method
    setInterval(async () => {
      await getPoolStats();
    }, 30000);
    
    // ============================================
    // CONNECTION POOL EVENT MONITORING
    // From the Connection Monitoring and Pooling spec [citation:4]
    // ============================================
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected - pool ready');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

// ============================================
// EXPORT A FUNCTION TO CHECK POOL STATUS ANYTIME
// ============================================

export const getConnectionPoolStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { connected: false, message: 'Not connected' };
    }
    
    // This is the DOCUMENTED WAY to get pool stats [citation:7]
    const stats = await mongoose.connection.db.command({ connPoolStats: 1 });
    
    return {
      connected: true,
      totalInUse: stats.totalInUse || 0,
      totalAvailable: stats.totalAvailable || 0,
      totalCreated: stats.totalCreated || 0,
      totalRefreshing: stats.totalRefreshing || 0,
      pools: stats.pools || {},
      hosts: stats.hosts || {},
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: mongoose.connection.readyState === 1,
      error: error.message,
      note: 'Use db.command({ connPoolStats: 1 }) for real stats'
    };
  }
};

// ============================================
// FOR DRIVERS THAT DON'T SUPPORT connPoolStats
// Fallback to connection pool monitoring spec [citation:4]
// ============================================

export const estimatePoolStatus = () => {
  try {
    // This is an ESTIMATE, not real pool stats
    const topology = mongoose.connection?.client?.topology;
    
    if (!topology) {
      return { connected: false };
    }
    
    // These property names come from the Connection Pooling spec [citation:4]
    // But actual availability depends on driver version
    let total = 0;
    let available = 0;
    let pending = 0;
    
    // Try to get the first server
    const servers = topology.s?.servers;
    if (servers) {
      const firstServer = Array.from(servers.values())[0];
      if (firstServer?.pool) {
        // These are the spec property names [citation:4]
        total = firstServer.pool.totalConnectionCount || 
                firstServer.pool.size || 0;
        available = firstServer.pool.availableConnectionCount || 
                    firstServer.pool.available || 0;
        pending = firstServer.pool.pendingConnectionCount || 
                  firstServer.pool.pending || 0;
      }
    }
    
    return {
      connected: true,
      estimated: true,
      totalConnections: total,
      availableConnections: available,
      pendingConnections: pending,
      note: 'Use getConnectionPoolStats() for real stats'
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// Simple function to log status
export const logPoolStatus = async () => {
  const stats = await getConnectionPoolStats();
  
  if (stats.connected && !stats.error) {
    
    if (stats.pools && Object.keys(stats.pools).length > 0) {
      console.log(`\n   📦 Pool Details:`);
      Object.entries(stats.pools).forEach(([name, pool]) => {
        if (pool.poolInUse !== undefined) {
          console.log(`      ${name}: ${pool.poolInUse} in use, ${pool.poolAvailable} available`);
        }
      });
    }
  } else {
    console.log(`\n📊 Pool Status: ${stats.message || 'Unknown'}`);
    const estimate = estimatePoolStatus();
    if (estimate.connected) {
      console.log(`   (Estimated) Total: ${estimate.totalConnections}, Available: ${estimate.availableConnections}`);
    }
  }
};

export default connectDB;