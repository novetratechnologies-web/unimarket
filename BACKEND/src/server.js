// server.js - FIXED VERSION
// REMOVE THIS LINE: import './disable-natural-redis.js';
import http from 'http';
import dotenv from "dotenv";
dotenv.config();

import app, { initializeSession } from "./app.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import { initializeSocket } from './config/websocket.js';
import passport from "passport";
import os from 'os';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const getNetworkIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
};

const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Add to your server.js right after MongoDB connects
    setInterval(async () => {
      try {
        // Method 1: Check server status for connection count
        const status = await mongoose.connection.db.admin().serverStatus();

        
        // Method 2: Check current operations
        const ops = await mongoose.connection.db.admin().command({ currentOp: 1 });
        
      } catch (err) {
        console.log('❌ Status check failed:', err.message);
      }
    }, 5000);

    // 2. Initialize session with the mongoose connection
    console.log('🔄 Initializing session store...');
    const sessionMiddleware = initializeSession(mongoose.connection);
    app.use(sessionMiddleware);
    console.log('✅ Session store initialized');

    // 3. Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
    console.log('✅ Passport initialized');

    // 4. Create HTTP server
    const server = http.createServer(app);

    // 5. Initialize Socket.IO
    const io = initializeSocket(server);
    console.log('✅ Socket.IO initialized');
    
    // 6. Make io available to routes
    app.set('io', io);

    // 7. Start server
    server.listen(PORT, HOST, () => {
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Local (IPv4): http://127.0.0.1:${PORT}`);
      
      const networkIPs = getNetworkIPs();
      if (networkIPs.length > 0) {
        console.log(`   Network: http://${networkIPs[0]}:${PORT}`);
        if (networkIPs.length > 1) {
          networkIPs.slice(1).forEach(ip => {
            console.log(`           http://${ip}:${PORT}`);
          });
        }
      }
      
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Socket.IO available at http://localhost:${PORT}/socket.io`);
    });

    // 8. Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received: closing server...`);
      
      if (io) {
        io.close(() => console.log('✅ Socket.IO closed'));
      }
      
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB closed');
          process.exit(0);
        });
      });

      // Force exit after timeout
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully exiting');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();