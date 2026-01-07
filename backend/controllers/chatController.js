const chatService = require('../services/chatService');

class ChatController {
  /**
   * @route   POST /api/chat/request
   * @desc    User tạo yêu cầu hỗ trợ
   * @access  Private (User)
   */
  async createRequest(req, res) {
    try {
      const userId = req.user.id; // authMiddleware trả về req.user.id
      
      const chatRequest = await chatService.createChatRequest(userId);
      
      // Emit socket event để thông báo cho admin
      if (req.io) {
        req.io.emit('new-chat-request', {
          request: chatRequest,
          user: {
            id: chatRequest.userId._id,
            username: chatRequest.userId.username,
            email: chatRequest.userId.email
          }
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Chat request created successfully',
        data: chatRequest
      });
    } catch (error) {
      console.error('Create request error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/pending
   * @desc    Admin lấy danh sách requests đang chờ
   * @access  Private (Admin)
   */
  async getPendingRequests(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      const requests = await chatService.getPendingRequests();
      
      return res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      console.error('Get pending requests error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/connected
   * @desc    Admin lấy danh sách chats đang kết nối
   * @access  Private (Admin)
   */
  async getConnectedChats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      const adminId = req.user.id;
      const chats = await chatService.getConnectedRequests(adminId);
      
      return res.json({
        success: true,
        count: chats.length,
        data: chats
      });
    } catch (error) {
      console.error('Get connected chats error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/my-chats
   * @desc    User lấy danh sách chats của mình
   * @access  Private (User)
   */
  async getUserChats(req, res) {
    try {
      const userId = req.user.id;
      const chats = await chatService.getUserChats(userId);
      
      return res.json({
        success: true,
        count: chats.length,
        data: chats
      });
    } catch (error) {
      console.error('Get user chats error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   POST /api/chat/:requestId/accept
   * @desc    Admin chấp nhận request
   * @access  Private (Admin)
   */
  async acceptRequest(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      const { requestId } = req.params;
      const adminId = req.user.id;
      
      const chatRequest = await chatService.acceptRequest(requestId, adminId);
      
      // Emit socket event thông báo cho user
      if (req.io) {
        req.io.to(chatRequest.userId._id.toString()).emit('chat-accepted', {
          requestId: chatRequest._id,
          admin: {
            id: adminId,
            username: req.user.username
          },
          chat: chatRequest
        });

        // Broadcast cho các admin khác biết request đã được xử lý
        req.io.emit('request-accepted', {
          requestId: chatRequest._id
        });
      }

      return res.json({
        success: true,
        message: 'Chat request accepted successfully',
        data: chatRequest
      });
    } catch (error) {
      console.error('Accept request error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   POST /api/chat/:requestId/message
   * @desc    Gửi tin nhắn trong chat
   * @access  Private
   */
  async sendMessage(req, res) {
    try {
      const { requestId } = req.params;
      const { text } = req.body;
      const senderId = req.user.id;

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      const message = await chatService.sendMessage(requestId, senderId, text);
      
      // Emit socket event cho tất cả người trong room
      if (req.io) {
        req.io.to(requestId).emit('new-message', {
          requestId,
          message: {
            ...message,
            senderName: req.user.username,
            senderRole: req.user.role
          }
        });
      }

      return res.json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/:requestId/messages
   * @desc    Lấy lịch sử tin nhắn
   * @access  Private
   */
  async getMessages(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;
      
      const messages = await chatService.getMessages(requestId, userId);
      
      return res.json({
        success: true,
        count: messages.length,
        data: messages
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   POST /api/chat/:requestId/close
   * @desc    Đóng chat
   * @access  Private
   */
  async closeChat(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;
      
      const chatRequest = await chatService.closeChat(requestId, userId);
      
      // Emit socket event
      if (req.io) {
        req.io.to(requestId).emit('chat-closed', {
          requestId,
          closedBy: {
            id: userId,
            username: req.user.username,
            role: req.user.role
          },
          chat: chatRequest
        });
      }

      return res.json({
        success: true,
        message: 'Chat closed successfully',
        data: chatRequest
      });
    } catch (error) {
      console.error('Close chat error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/:requestId
   * @desc    Lấy thông tin chi tiết chat request
   * @access  Private
   */
  async getRequestDetails(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;
      
      const chatRequest = await chatService.getRequestById(requestId, userId);
      
      return res.json({
        success: true,
        data: chatRequest
      });
    } catch (error) {
      console.error('Get request details error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/stats/pending-count
   * @desc    Lấy số lượng requests đang chờ
   * @access  Private (Admin)
   */
  async getPendingCount(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      const count = await chatService.getPendingCount();
      
      return res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get pending count error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @route   GET /api/chat/stats/my-active-chats
   * @desc    Lấy số lượng chats đang active của admin
   * @access  Private (Admin)
   */
  async getMyActiveChatsCount(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      const adminId = req.user.id;
      const count = await chatService.getAdminActiveChatsCount(adminId);
      
      return res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get active chats count error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ChatController();