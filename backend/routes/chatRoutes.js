const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/pending', authMiddleware, chatController.getPendingRequests);
router.get('/connected', authMiddleware, chatController.getConnectedChats);
router.get('/stats/pending-count', authMiddleware, chatController.getPendingCount);
router.get('/stats/my-active-chats', authMiddleware, chatController.getMyActiveChatsCount);

router.post('/request', authMiddleware, chatController.createRequest);
router.get('/my-chats', authMiddleware, chatController.getUserChats);

router.get('/:requestId/messages', authMiddleware, chatController.getMessages);
router.post('/:requestId/message', authMiddleware, chatController.sendMessage);
router.post('/:requestId/accept', authMiddleware, chatController.acceptRequest);
router.post('/:requestId/close', authMiddleware, chatController.closeChat);
router.get('/:requestId', authMiddleware, chatController.getRequestDetails);

module.exports = router;