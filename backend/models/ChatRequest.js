const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  senderRole: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  text: { 
    type: String, 
    required: true 
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const chatRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['pending', 'connected', 'closed'], 
    default: 'pending' 
  },
  messages: [messageSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  connectedAt: { 
    type: Date 
  },
  closedAt: { 
    type: Date 
  }
}, {
  timestamps: true
});

// Index để query nhanh hơn
chatRequestSchema.index({ userId: 1, status: 1 });
chatRequestSchema.index({ adminId: 1, status: 1 });
chatRequestSchema.index({ status: 1, createdAt: -1 });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

module.exports = ChatRequest;