// routes/linkedBankRoutes.js
const express = require('express');
const router = express.Router();
const linkedBankController = require('../controllers/linkedBankController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy danh sách tất cả liên kết của user hiện tại (bao gồm ACTIVE và INACTIVE)
router.get('/list', authMiddleware, linkedBankController.listLinked);

// Kiểm tra user có ít nhất một liên kết ACTIVE không
router.get('/check', authMiddleware, linkedBankController.checkLinked);

// Lấy danh sách chỉ các liên kết ACTIVE (với thông tin hạn mức)
router.get('/active', authMiddleware, linkedBankController.getActiveLinked);

// Lấy thông tin hạn mức của một liên kết cụ thể (theo ID)
router.get('/limits/:id', authMiddleware, linkedBankController.getDepositLimits);

module.exports = router;