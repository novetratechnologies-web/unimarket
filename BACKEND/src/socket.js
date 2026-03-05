// backend/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import AdminVendor from './models/AdminVendor.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token;
      
      if (!token) {
        console.log('❌ Socket auth: No token provided');
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await AdminVendor.findById(decoded.id).select('-password');

      if (!user) {
        console.log('❌ Socket auth: User not found');
        return next(new Error('User not found'));
      }

      // Check if user is active
      if (user.status !== 'active') {
        console.log('❌ Socket auth: User inactive');
        return next(new Error('User account inactive'));
      }

      // Attach user to socket
      socket.user = user;
      console.log(`✅ Socket authenticated: ${user.email}`);
      next();
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.user.email} (${socket.user.role})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);
    console.log(`   Joined room: user:${socket.user._id}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);
    console.log(`   Joined room: role:${socket.user.role}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId: socket.user._id,
      role: socket.user.role
    });

    // Handle joining specific rooms
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`   Joined custom room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`   Left room: ${room}`);
    });

    // Handle ping/pong for connection health
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

// Helper function to get io instance
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper function to emit to a specific user
export const emitToUser = (userId, event, data) => {
  try {
    const io = getIo();
    io.to(`user:${userId}`).emit(event, data);
    console.log(`📤 Emitted ${event} to user:${userId}`);
  } catch (error) {
    console.error('Error emitting to user:', error);
  }
};

// Helper function to emit to a role
export const emitToRole = (role, event, data) => {
  try {
    const io = getIo();
    io.to(`role:${role}`).emit(event, data);
    console.log(`📤 Emitted ${event} to role:${role}`);
  } catch (error) {
    console.error('Error emitting to role:', error);
  }
};

// Helper function to emit to all
export const emitToAll = (event, data) => {
  try {
    const io = getIo();
    io.emit(event, data);
    console.log(`📤 Emitted ${event} to all clients`);
  } catch (error) {
    console.error('Error emitting to all:', error);
  }
};

export default {
  initializeSocket,
  getIo,
  emitToUser,
  emitToRole,
  emitToAll
};