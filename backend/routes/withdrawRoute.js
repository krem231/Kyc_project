// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/withdrawController');
const authMiddleware = require('../middleware/auth');
router.use(authMiddleware);

router.post('/withdraw', walletController.withdraw);

router.get('/balance', walletController.getBalance);

router.get('/withdraw-history', walletController.getWithdrawHistory);

module.exports = router;