const jwt = require('jsonwebtoken');

const JWT_SECRETS = [
  'WALLET_SECRET_KEY',
  'secretkey'
];

function verifyWithMultipleSecrets(token) {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {}
  }
  return null;
}

module.exports = function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const decoded = verifyWithMultipleSecrets(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};
