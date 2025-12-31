const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// ==================== ĐẶT CÁC ROUTES CỤ THỂ TRƯỚC ====================

// Admin routes - ĐẶT TRƯỚC
router.get('/pending', authMiddleware, chatController.getPendingRequests);
router.get('/connected', authMiddleware, chatController.getConnectedChats);
router.get('/stats/pending-count', authMiddleware, chatController.getPendingCount);
router.get('/stats/my-active-chats', authMiddleware, chatController.getMyActiveChatsCount);

// User routes - ĐẶT TRƯỚC
router.post('/request', authMiddleware, chatController.createRequest);
router.get('/my-chats', authMiddleware, chatController.getUserChats);

// ==================== ĐẶT DYNAMIC ROUTES SAU ====================

// Dynamic routes - ĐẶT SAU CÙNG
router.get('/:requestId/messages', authMiddleware, chatController.getMessages);
router.post('/:requestId/message', authMiddleware, chatController.sendMessage);
router.post('/:requestId/accept', authMiddleware, chatController.acceptRequest);
router.post('/:requestId/close', authMiddleware, chatController.closeChat);
router.get('/:requestId', authMiddleware, chatController.getRequestDetails);

module.exports = router;