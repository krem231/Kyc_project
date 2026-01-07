const socketIo = require('socket.io');
const socketAuth = require('./authMiddleware');
const { setupChatHandlers } = require('./chatSocket');

/**
 * Khởi tạo và cấu hình Socket.IO
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} Socket.IO instance
 */
function initializeSocket(server) {
  const io = socketIo(server, {
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

  // Connection handler
  io.on('connection', (socket) => {
    
    // Join personal room (để nhận thông báo riêng)
    const userId = socket.user._id.toString();
    socket.join(userId);
    
    // Nếu là admin, join vào admin room
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`👨‍💼 Admin ${socket.user.username} joined admins room`);
    }

    // Setup chat-related event handlers
    setupChatHandlers(io, socket);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Log server events
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  return io;
}

/**
 * Helper functions để emit events từ controller
 */
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

module.exports = {
  initializeSocket,
  emitToRoom,
  emitToUser,
  emitToAdmins,
  broadcastToAll
};