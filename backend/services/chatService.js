// services/chatService.js - FIXED VERSION
const ChatRequest = require('../models/ChatRequest');
const User = require('../models/User');

class ChatService {
  /**
   * Tạo yêu cầu hỗ trợ mới từ user
   */
  async createChatRequest(userId) {
    try {
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Kiểm tra user đã có request đang active chưa
      const existingRequest = await ChatRequest.findOne({
        userId,
        status: { $in: ['pending', 'connected'] }
      }).populate('userId', 'username email phone');

      if (existingRequest) {
        // Trả về request hiện tại
        return existingRequest;
      }

      // Tạo request mới
      const chatRequest = await ChatRequest.create({ 
        userId,
        status: 'pending'
      });
      
      // Populate và return
      const populatedRequest = await ChatRequest.findById(chatRequest._id)
        .populate('userId', 'username email phone');
      
      return populatedRequest;
    } catch (error) {
      throw new Error(`Create chat request failed: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả requests đang chờ (cho admin)
   */
  async getPendingRequests() {
    try {
      return await ChatRequest.find({ status: 'pending' })
        .populate('userId', 'username email phone')
        .sort({ createdAt: 1 })
        .lean();
    } catch (error) {
      throw new Error(`Get pending requests failed: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả chats đang kết nối của một admin
   */
  async getConnectedRequests(adminId) {
    try {
      return await ChatRequest.find({ 
        adminId, 
        status: 'connected' 
      })
        .populate('userId', 'username email phone')
        .populate('adminId', 'username email')
        .sort({ connectedAt: -1 })
        .lean();
    } catch (error) {
      throw new Error(`Get connected requests failed: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả chats của một user
   */
  async getUserChats(userId) {
    try {
      return await ChatRequest.find({ userId })
        .populate('adminId', 'username')
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      throw new Error(`Get user chats failed: ${error.message}`);
    }
  }

  /**
   * Admin chấp nhận request hỗ trợ
   */
  async acceptRequest(requestId, adminId) {
    try {
      // Tìm request
      const chatRequest = await ChatRequest.findById(requestId);
      
      if (!chatRequest) {
        throw new Error('Chat request not found');
      }

      // Kiểm tra status phải là pending
      if (chatRequest.status !== 'pending') {
        throw new Error('This chat request is no longer available');
      }

      // Kiểm tra admin có tồn tại và có role admin không
      const admin = await User.findOne({ 
        _id: adminId, 
        role: 'admin' 
      });
      
      if (!admin) {
        throw new Error('Admin not found or insufficient permissions');
      }

      // Cập nhật request
      chatRequest.adminId = adminId;
      chatRequest.status = 'connected';
      chatRequest.connectedAt = new Date();
      
      // Thêm tin nhắn hệ thống
      chatRequest.messages.push({
        senderId: adminId,
        senderRole: 'admin',
        text: `${admin.username} đã tham gia cuộc trò chuyện`,
        isSystem: true,
        timestamp: new Date()
      });

      await chatRequest.save();
      
      // Populate và return - ĐÂY LÀ CÁCH ĐÚNG
      const populatedRequest = await ChatRequest.findById(chatRequest._id)
        .populate('userId', 'username email phone')
        .populate('adminId', 'username email');
      
      return populatedRequest;
    } catch (error) {
      throw new Error(`Accept request failed: ${error.message}`);
    }
  }

  /**
   * Gửi tin nhắn trong chat
   */
  async sendMessage(requestId, senderId, text) {
    try {
      // Validate input
      if (!text || !text.trim()) {
        throw new Error('Message text cannot be empty');
      }

      const chatRequest = await ChatRequest.findById(requestId);
      
      if (!chatRequest) {
        throw new Error('Chat request not found');
      }

      if (chatRequest.status === 'closed') {
        throw new Error('Cannot send message to closed chat');
      }

      // Kiểm tra quyền gửi tin nhắn
      const isUser = chatRequest.userId.toString() === senderId;
      const isAdmin = chatRequest.adminId && chatRequest.adminId.toString() === senderId;

      if (!isUser && !isAdmin) {
        throw new Error('You do not have permission to send messages in this chat');
      }

      // Lấy thông tin người gửi
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      // Tạo tin nhắn mới
      const newMessage = {
        senderId,
        senderRole: sender.role,
        text: text.trim(),
        isSystem: false,
        timestamp: new Date()
      };

      chatRequest.messages.push(newMessage);
      await chatRequest.save();

      // Trả về tin nhắn với thông tin sender
      const savedMessage = chatRequest.messages[chatRequest.messages.length - 1];
      
      return {
        _id: savedMessage._id,
        senderId: savedMessage.senderId,
        senderRole: savedMessage.senderRole,
        text: savedMessage.text,
        isSystem: savedMessage.isSystem,
        timestamp: savedMessage.timestamp,
        senderName: sender.username
      };
    } catch (error) {
      throw new Error(`Send message failed: ${error.message}`);
    }
  }

  /**
   * Lấy lịch sử tin nhắn của một chat
   */
  async getMessages(requestId, userId) {
    try {
      const chatRequest = await ChatRequest.findById(requestId)
        .populate('messages.senderId', 'username role');
      
      if (!chatRequest) {
        throw new Error('Chat request not found');
      }

      // Kiểm tra quyền truy cập
      const isUser = chatRequest.userId.toString() === userId;
      const isAdmin = chatRequest.adminId && chatRequest.adminId.toString() === userId;

      if (!isUser && !isAdmin) {
        throw new Error('You do not have permission to view this chat');
      }

      return chatRequest.messages;
    } catch (error) {
      throw new Error(`Get messages failed: ${error.message}`);
    }
  }

  /**
   * Đóng chat
   */
  async closeChat(requestId, userId) {
    try {
      const chatRequest = await ChatRequest.findById(requestId);
      
      if (!chatRequest) {
        throw new Error('Chat request not found');
      }

      if (chatRequest.status === 'closed') {
        throw new Error('Chat is already closed');
      }

      // Kiểm tra quyền đóng chat
      const isUser = chatRequest.userId.toString() === userId;
      const isAdmin = chatRequest.adminId && chatRequest.adminId.toString() === userId;

      if (!isUser && !isAdmin) {
        throw new Error('You do not have permission to close this chat');
      }

      // Lấy thông tin người đóng
      const user = await User.findById(userId);

      // Cập nhật status
      chatRequest.status = 'closed';
      chatRequest.closedAt = new Date();

      // Thêm tin nhắn hệ thống
      chatRequest.messages.push({
        senderId: userId,
        senderRole: user.role,
        text: `${user.username} đã kết thúc cuộc trò chuyện`,
        isSystem: true,
        timestamp: new Date()
      });

      await chatRequest.save();

      // Populate và return
      const populatedRequest = await ChatRequest.findById(chatRequest._id)
        .populate('userId', 'username email')
        .populate('adminId', 'username email');
      
      return populatedRequest;
    } catch (error) {
      throw new Error(`Close chat failed: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết của một chat request
   */
  async getRequestById(requestId, userId) {
    try {
      const chatRequest = await ChatRequest.findById(requestId)
        .populate('userId', 'username email phone')
        .populate('adminId', 'username email')
        .populate('messages.senderId', 'username role');
      
      if (!chatRequest) {
        throw new Error('Chat request not found');
      }

      // Kiểm tra quyền truy cập
      const isUser = chatRequest.userId._id.toString() === userId;
      const isAdmin = chatRequest.adminId && chatRequest.adminId._id.toString() === userId;

      if (!isUser && !isAdmin) {
        throw new Error('You do not have permission to view this chat');
      }

      return chatRequest;
    } catch (error) {
      throw new Error(`Get request details failed: ${error.message}`);
    }
  }

  /**
   * Lấy số lượng requests đang pending
   */
  async getPendingCount() {
    try {
      return await ChatRequest.countDocuments({ status: 'pending' });
    } catch (error) {
      throw new Error(`Get pending count failed: ${error.message}`);
    }
  }

  /**
   * Lấy số lượng chats active của một admin
   */
  async getAdminActiveChatsCount(adminId) {
    try {
      return await ChatRequest.countDocuments({ 
        adminId, 
        status: 'connected' 
      });
    } catch (error) {
      throw new Error(`Get admin active chats count failed: ${error.message}`);
    }
  }
}

module.exports = new ChatService();