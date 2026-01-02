// routes/transferRoutes.js
const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/auth');

/*router.use(authMiddleware);*/

router.post('/transfer', transferController.transferByPhone);
router.post('/check-receiver', transferController.checkReceiver);
module.exports = router;