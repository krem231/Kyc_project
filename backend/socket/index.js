const socketIo = require('socket.io');
const socketAuth = require('./authMiddleware');
const { setupChatHandlers } = require('./chatSocket');

// ✨ THÊM BIẾN NÀY
let io = null;

/**
 * Khởi tạo và cấu hình Socket.IO
 */
function initializeSocket(server) {
  io = socketIo(server, {  // ← Lưu vào biến io
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // Join personal room
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log(`📍 User ${socket.user.username} joined room: ${userId}`);
    
    // Nếu là admin
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`👨‍💼 Admin ${socket.user.username} joined admins room`);
    }

    setupChatHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  return io;
}

// ✨ THÊM FUNCTION NÀY
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}

// Helper functions
function emitToRoom(io, room, event, data) {
  io.to(room).emit(event, data);
}

function emitToUser(io, userId, event, data) {
  io.to(userId.toString()).emit(event, data);
}

function emitToAdmins(io, event, data) {
  io.to('admins').emit(event, data);
}

function broadcastToAll(io, event, data) {
  io.emit(event, data);
}

// ✨ THÊM getIO VÀO EXPORT
module.exports = {
  initializeSocket,
  getIO,  // ← THÊM DÒNG NÀY
  emitToRoom,
  emitToUser,
  emitToAdmins,
  broadcastToAll
};