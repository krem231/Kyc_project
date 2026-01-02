// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    } catch (e) {
      decoded = jwt.verify(token, 'WALLET_SECRET_KEY');
    }

    req.user = {
       id: decoded.id || decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = authMiddleware;
