// routes/walletRoutes.js (tạo mới nếu chưa có)
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/wallet', authMiddleware, walletController.getWallet);

module.exports = router;