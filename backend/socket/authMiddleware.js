const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    // Dùng CÙNG JWT_SECRET với authMiddleware
    const JWT_SECRET = 'WALLET_SECRET_KEY';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication error: Invalid token format'));
    }

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Lưu user info vào socket (format khớp với authMiddleware)
    socket.user = {
      id: user._id,
      _id: user._id, // Alias để tương thích
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    console.log(`🔐 Socket authenticated: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    return next(new Error('Authentication error: Failed to authenticate'));
  }
}

module.exports = socketAuth;