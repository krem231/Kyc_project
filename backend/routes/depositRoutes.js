// routes/depositRoutes.js
const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const authMiddleware = require('../middlewares/authMiddleware');

// Yêu cầu OTP để nạp tiền
router.post('/deposit/request', authMiddleware, depositController.requestOTP);

// Xác thực OTP và hoàn tất nạp
router.post('/deposit/verify', authMiddleware, depositController.verifyOTP);

// Lịch sử nạp tiền
router.get('/deposit/history', authMiddleware, depositController.getHistory);

module.exports = router;