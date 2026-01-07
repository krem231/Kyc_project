const jwt = require('jsonwebtoken');

const JWT_SECRETS = [
  'WALLET_SECRET_KEY', // hệ mới (deploy)
  'secretkey'          // hệ cũ (khung)
];

function verifyWithMultipleSecrets(token) {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      // thử secret tiếp theo
    }
  }
  return null;
}

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const decoded = verifyWithMultipleSecrets(token);

    if (!decoded) {
      console.error('Lỗi verify token: invalid signature');
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
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
