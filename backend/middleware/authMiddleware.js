const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRETS = [
  'WALLET_SECRET_KEY', // token má»›i (deploy)
  'secretkey'          // token cÅ© (báº£n khung)
];

function verifyToken(token) {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      // ignore, thá»­ secret tiáº¿p theo
    }
  }
  return null;
}

async function socketAuth(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = {
      id: user._id,
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    console.log(`ðŸ” Socket authenticated: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication error'));
  }
}

module.exports = socketAuth;