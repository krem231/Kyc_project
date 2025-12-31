// routes/transactionHistoryRoutes.js
const express = require('express');
const router = express.Router();
const transactionHistoryController = require('../controllers/transactionHistoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/history', transactionHistoryController.getTransferHistory);
router.get('/sent', transactionHistoryController.getSentTransfers);
router.get('/received', transactionHistoryController.getReceivedTransfers);
router.get('/stats', transactionHistoryController.getTransactionStats);
router.get('/:id', transactionHistoryController.getTransactionDetail);

module.exports = router;