// routes/linkedBankRoutes.js
const express = require('express');
const router = express.Router();
const linkedBankController = require('../controllers/linkedBankController');
const authMiddleware = require('../middleware/auth');

router.get('/list', authMiddleware, linkedBankController.listLinked);
router.get('/check', authMiddleware, linkedBankController.checkLinked);
router.get('/active', authMiddleware, linkedBankController.getActiveLinked);
router.get('/limits/:id', authMiddleware, linkedBankController.getDepositLimits);

module.exports = router;