function setupChatHandlers(io, socket) {
  const user = socket.user;

  socket.on('join-chat', (data) => {
    const { requestId } = data;
    
    if (!requestId) {
      socket.emit('error', { message: 'Request ID is required' });
      return;
    }

    socket.join(requestId);
    console.log(`💬 ${user.username} (${user.role}) joined chat room: ${requestId}`);
    
    socket.to(requestId).emit('user-joined-chat', {
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date()
    });

    socket.emit('chat-joined', {
      requestId,
      message: 'Successfully joined chat room'
    });
  });

  socket.on('leave-chat', (data) => {
    const { requestId } = data;
    
    if (!requestId) {
      socket.emit('error', { message: 'Request ID is required' });
      return;
    }

    socket.leave(requestId);
    console.log(`👋 ${user.username} left chat room: ${requestId}`);
    
    socket.to(requestId).emit('user-left-chat', {
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date()
    });
  });

  socket.on('typing', (data) => {
    const { requestId } = data;
    if (!requestId) return;

    socket.to(requestId).emit('user-typing', {
      userId: user._id,
      username: user.username,
      role: user.role,
      isTyping: true
    });
  });

  socket.on('stop-typing', (data) => {
    const { requestId } = data;
    if (!requestId) return;

    socket.to(requestId).emit('user-typing', {
      userId: user._id,
      username: user.username,
      role: user.role,
      isTyping: false
    });
  });

  socket.on('admin-viewing-request', (data) => {
    if (user.role !== 'admin') {
      socket.emit('error', { message: 'Admin only' });
      return;
    }

    const { requestId } = data;
    if (!requestId) return;

    socket.to('admins').emit('admin-viewing', {
      requestId,
      adminId: user._id,
      adminName: user.username,
      timestamp: new Date()
    });
  });

  socket.on('admin-stop-viewing-request', (data) => {
    if (user.role !== 'admin') return;

    const { requestId } = data;
    if (!requestId) return;

    socket.to('admins').emit('admin-stopped-viewing', {
      requestId,
      adminId: user._id
    });
  });

  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date(),
      userId: user._id
    });
  });

  socket.on('check-user-online', (data) => {
    const { userId } = data;
    if (!userId) return;

    const rooms = io.sockets.adapter.rooms;
    const isOnline = rooms.has(userId);

    socket.emit('user-online-status', {
      userId,
      isOnline,
      timestamp: new Date()
    });
  });

  socket.on('chat-error', (data) => {
    console.error(`Chat error from ${user.username}:`, data);
    socket.emit('error-acknowledged', {
      message: 'Error received and logged'
    });
  });
}

module.exports = { setupChatHandlers };