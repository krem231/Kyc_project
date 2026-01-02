const express = require('express');
const router = express.Router();
const savingController = require('../controllers/savingController');
const authMiddleware = require('../middleware/auth');

router.post('/saving', authMiddleware, savingController.createSaving);
router.get('/saving', authMiddleware, savingController.listSavings);
router.post('/saving/withdraw', authMiddleware, savingController.withdrawSaving);

module.exports = router;
