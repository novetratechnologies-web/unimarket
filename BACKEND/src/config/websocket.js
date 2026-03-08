// config/websocket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import AdminVendor from '../models/AdminVendor.js';
import User from '../models/User.js'; // Import User model for regular users

let io;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server) => {
  // Get allowed origins from environment variables
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
  const frontendUrl = process.env.FRONTEND_URL; // Production URL
  
  // Build allowed origins array
  let allowedOrigins = [];
  
  if (process.env.NODE_ENV === 'production') {
    // In production, use FRONTEND_URL (main app) and ADMIN_URL (admin app)
    allowedOrigins = [
      frontendUrl,
      adminUrl
    ].filter(Boolean); // Remove any undefined values
  } else {
    // In development, use both local URLs
    allowedOrigins = [
      clientUrl,
      adminUrl,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
  }
  
  console.log('📡 WebSocket allowed origins:', allowedOrigins);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware - handles both User and AdminVendor
  io.use(async (socket, next) => {
    try {
      // Support multiple auth methods
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1] ||
                    socket.handshake.query.token;
      
      if (!token) {
        console.log('❌ Socket auth: No token provided');
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = null;
      
      // Try to find user in both collections
      if (decoded.role === 'admin' || decoded.role === 'super_admin' || decoded.role === 'vendor') {
        // Check AdminVendor first
        user = await AdminVendor.findById(decoded.id).select('-password');
      } else {
        // Check regular User first
        user = await User.findById(decoded.id).select('-password');
      }
      
      // If not found, try the other model
      if (!user) {
        if (decoded.role === 'admin' || decoded.role === 'super_admin' || decoded.role === 'vendor') {
          // Already tried AdminVendor, now try User
          user = await User.findById(decoded.id).select('-password');
        } else {
          // Already tried User, now try AdminVendor
          user = await AdminVendor.findById(decoded.id).select('-password');
        }
      }

      if (!user) {
        console.log('❌ Socket auth: User not found in any model');
        return next(new Error('User not found'));
      }

      // Check if user is active
      if (user.status && user.status !== 'active') {
        return next(new Error('User account inactive'));
      }
      if (user.isActive === false) {
        return next(new Error('User account inactive'));
      }

      // Determine which app this connection is from based on origin
      const origin = socket.handshake.headers.origin;
      const appType = origin?.includes('5174') || origin === adminUrl ? 'admin' : 'main';
      
      console.log(`📡 WebSocket connection from ${appType} app: ${origin}`);

      // Attach user to socket
      socket.user = {
        id: user._id,
        _id: user._id,
        email: user.email,
        role: user.role || 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        appType // Track which app this came from
      };
      socket.userId = user._id;
      socket.userRole = user.role || 'user';
      socket.userEmail = user.email;
      socket.appType = appType;
      
      console.log(`✅ Socket authenticated: ${user.email} (${socket.userRole}) from ${appType} app`);
      next();
      
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const appType = socket.appType || 'unknown';
    console.log(`🔌 [${appType}] Client connected: ${socket.user.email} (${socket.user.role})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);
    socket.join(`user-${socket.user._id}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);
    socket.join(`role-${socket.user.role}`);

    // Join app-specific room
    socket.join(`app:${appType}`);

    // Join admin room if applicable
    if (socket.user.role === 'admin' || socket.user.role === 'super_admin') {
      socket.join('admins');
    }

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId: socket.user._id,
      role: socket.user.role,
      appType
    });

    // Handle joining vendor room
    socket.on('join-vendor', (vendorId) => {
      if (socket.user.role === 'vendor' || socket.user.role === 'admin' || socket.user.role === 'super_admin') {
        socket.join(`vendor-${vendorId}`);
        socket.join(`vendor:${vendorId}`);
        console.log(`🔌 [${appType}] User joined vendor room: ${vendorId}`);
      }
    });

    // Handle joining order room
    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
      socket.join(`order:${orderId}`);
      console.log(`🔌 [${appType}] User joined order room: ${orderId}`);
    });

    // Handle custom room join
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`🔌 [${appType}] Joined custom room: ${room}`);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`🔌 [${appType}] Left room: ${room}`);
    });

    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ pong: Date.now(), appType });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [${appType}] Client disconnected: ${socket.user.email} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`❌ [${appType}] Socket error for ${socket.user.email}:`, error);
    });
  });

  return io;
};

// Export all the emit functions (same as before)
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

export const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
    io.to(`user-${userId}`).emit(event, data);
    console.log(`📤 Emitted ${event} to user:${userId}`);
  } catch (error) {
    console.error('Error emitting to user:', error);
  }
};

export const emitToRole = (role, event, data) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit(event, data);
    io.to(`role-${role}`).emit(event, data);
    console.log(`📤 Emitted ${event} to role:${role}`);
  } catch (error) {
    console.error('Error emitting to role:', error);
  }
};

export const emitToAdmins = (event, data) => {
  try {
    const io = getIO();
    io.to('admins').emit(event, data);
    console.log(`📤 Emitted ${event} to admins`);
  } catch (error) {
    console.error('Error emitting to admins:', error);
  }
};

export const emitToVendor = (vendorId, event, data) => {
  try {
    const io = getIO();
    io.to(`vendor-${vendorId}`).emit(event, data);
    io.to(`vendor:${vendorId}`).emit(event, data);
    console.log(`📤 Emitted ${event} to vendor:${vendorId}`);
  } catch (error) {
    console.error('Error emitting to vendor:', error);
  }
};

export const emitToOrder = (orderId, event, data) => {
  try {
    const io = getIO();
    io.to(`order-${orderId}`).emit(event, data);
    io.to(`order:${orderId}`).emit(event, data);
    console.log(`📤 Emitted ${event} to order:${orderId}`);
  } catch (error) {
    console.error('Error emitting to order:', error);
  }
};

export const emitToApp = (appType, event, data) => {
  try {
    const io = getIO();
    io.to(`app:${appType}`).emit(event, data);
    console.log(`📤 Emitted ${event} to ${appType} app`);
  } catch (error) {
    console.error('Error emitting to app:', error);
  }
};

export const emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
    console.log(`📤 Emitted ${event} to all clients`);
  } catch (error) {
    console.error('Error emitting to all:', error);
  }
};

export const broadcast = emitToAll;

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToAdmins,
  emitToVendor,
  emitToOrder,
  emitToApp,
  emitToAll,
  broadcast
};