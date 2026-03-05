// config/websocket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import AdminVendor from '../models/AdminVendor.js'; // Add this import

let io;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io', // Add this from socket.js
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Support both auth methods (from websocket.js and socket.js)
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1] ||
                    socket.handshake.query.token;
      
      if (!token) {
        console.log('❌ Socket auth: No token provided');
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database (from socket.js)
      const user = await AdminVendor.findById(decoded.id).select('-password');

      if (!user) {
        console.log('❌ Socket auth: User not found');
        return next(new Error('User not found'));
      }

      // Check if user is active (from socket.js)
      if (user.status !== 'active') {
        console.log('❌ Socket auth: User inactive');
        return next(new Error('User account inactive'));
      }

      // Attach user to socket (from both)
      socket.user = user;
      socket.userId = user._id;
      socket.userRole = user.role;
      socket.userEmail = user.email;
      
      console.log(`✅ Socket authenticated: ${user.email} (${user.role})`);
      next();
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.user.email} (${socket.user.role})`);

    // Join user's personal room (from socket.js)
    socket.join(`user:${socket.user._id}`);
    console.log(`   Joined room: user:${socket.user._id}`);
    
    // Also join with hyphen format for backward compatibility (from websocket.js)
    socket.join(`user-${socket.user._id}`);

    // Join role-based room (from socket.js)
    socket.join(`role:${socket.user.role}`);
    console.log(`   Joined room: role:${socket.user.role}`);
    
    // Also join with hyphen format (from websocket.js)
    socket.join(`role-${socket.user.role}`);

    // Join all admins room if user is admin (from websocket.js)
    if (socket.user.role === 'admin' || socket.user.role === 'super_admin') {
      socket.join('admins');
    }

    // Send connection confirmation (from socket.js)
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId: socket.user._id,
      role: socket.user.role
    });

    // Handle joining vendor-specific room (from websocket.js)
    socket.on('join-vendor', (vendorId) => {
      if (socket.user.role === 'vendor' || socket.user.role === 'admin') {
        socket.join(`vendor-${vendorId}`);
        socket.join(`vendor:${vendorId}`);
        console.log(`🔌 User ${socket.user._id} joined vendor room: ${vendorId}`);
      }
    });

    // Handle joining order-specific room (from websocket.js)
    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
      socket.join(`order:${orderId}`);
      console.log(`🔌 User ${socket.user._id} joined order room: ${orderId}`);
    });

    // Handle joining custom rooms (from socket.js)
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`   Joined custom room: ${room}`);
    });

    // Handle leaving rooms (from socket.js)
    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`   Left room: ${room}`);
    });

    // Handle read receipts (from websocket.js)
    socket.on('notification:read', (notificationId) => {
      socket.to(`user-${socket.user._id}`).emit('notification:read', notificationId);
      socket.to(`user:${socket.user._id}`).emit('notification:read', notificationId);
    });

    // Handle typing indicators (from websocket.js)
    socket.on('typing', ({ room, isTyping }) => {
      socket.to(room).emit('user:typing', {
        userId: socket.user._id,
        email: socket.user.email,
        isTyping
      });
    });

    // Handle ping/pong (from socket.js)
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ pong: Date.now() });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.user.email} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.user.email}:`, error);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
    io.to(`user-${userId}`).emit(event, data); // Support both formats
    console.log(`📤 Emitted ${event} to user:${userId}`);
  } catch (error) {
    console.error('Error emitting to user:', error);
  }
};

/**
 * Emit event to a specific role
 */
export const emitToRole = (role, event, data) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit(event, data);
    io.to(`role-${role}`).emit(event, data); // Support both formats
    console.log(`📤 Emitted ${event} to role:${role}`);
  } catch (error) {
    console.error('Error emitting to role:', error);
  }
};

/**
 * Emit event to all admins
 */
export const emitToAdmins = (event, data) => {
  try {
    const io = getIO();
    io.to('admins').emit(event, data);
    console.log(`📤 Emitted ${event} to admins`);
  } catch (error) {
    console.error('Error emitting to admins:', error);
  }
};

/**
 * Emit event to a specific vendor room
 */
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

/**
 * Emit event to a specific order room
 */
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

/**
 * Emit event to all connected clients
 */
export const emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
    console.log(`📤 Emitted ${event} to all clients`);
  } catch (error) {
    console.error('Error emitting to all:', error);
  }
};

// Alias for backward compatibility
export const broadcast = emitToAll;

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToAdmins,
  emitToVendor,
  emitToOrder,
  emitToAll,
  broadcast
};