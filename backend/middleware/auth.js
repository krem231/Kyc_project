const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ 
        success: false,
        message: 'Vui lòng đăng nhập' 
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Token not found in header');
      return res.status(401).json({ 
        success: false,
        message: 'Token không hợp lệ' 
      });
    }

    console.log('Token:', token.substring(0, 20) + '...');

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('Token verified, user:', decoded);

    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token không hợp lệ' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Authentication error' 
    });
  }
};

module.exports = authMiddleware;