// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const JWT_SECRET = 'WALLET_SECRET_KEY'; // Secret riêng cho ví
    const decoded = jwt.verify(token, JWT_SECRET);
    
  req.user = {
    id: decoded.id,        // Sửa: dùng decoded.id (khớp với payload)
    username: decoded.username,  // Thêm nếu cần
    role: decoded.role
  };

    next();
  } catch (error) {
    console.error('Lỗi verify token:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

module.exports = authMiddleware;