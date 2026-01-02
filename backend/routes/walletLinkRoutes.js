// routes/walletLinkRoutes.js
const express = require('express');
const router = express.Router();
const walletLinkController = require('../controllers/walletLinkController');
const authMiddleware = require('../middleware/auth');

router.post('/link-bank/request', authMiddleware, walletLinkController.requestLink);
router.post('/link-bank/verify', authMiddleware, walletLinkController.verifyLink);
router.get('/link-bank/check-pending', authMiddleware, walletLinkController.checkPending);
router.delete('/unlink/:id', authMiddleware, walletLinkController.unlinkAccount);

// Thêm route cho checkLinked và listLinked (nếu cần expose)
router.get('/link-bank/check-linked', authMiddleware, walletLinkController.checkLinked);
router.get('/link-bank/list', authMiddleware, walletLinkController.listLinked);

module.exports = router;