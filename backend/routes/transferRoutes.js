// routes/transferRoutes.js
const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/transfer', transferController.transferByPhone);
router.post('/check-receiver', authMiddleware, transferController.checkReceiver);
module.exports = router;