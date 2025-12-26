// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Người gửi tiền (người thực hiện giao dịch)
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Người nhận tiền (có thể là cùng sender nếu nạp/rút ngân hàng)
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Số tiền giao dịch
  amount: {
    type: Number,
    required: true,
    min: 1000
  },

  currency: {
    type: String,
    default: 'VND'
  },

  // Loại giao dịch
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'],
    required: true
  },

  // Trạng thái giao dịch
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  },

  // Mô tả hoặc lý do giao dịch
  description: {
    type: String,
    default: ''
  },

  // ID giao dịch duy nhất (tùy chọn, để tra cứu nhanh)
  transactionId: {
    type: String,
    unique: true,
    sparse: true // cho phép null
  },

  // Thông tin bổ sung (ví dụ: số tài khoản ngân hàng khi rút/nạp)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Thời gian tạo
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Thời gian cập nhật (nếu có thay đổi trạng thái)
  updatedAt: {
    type: Date
  }
});

// Tự động cập nhật updatedAt
transactionSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Tạo transactionId tự động nếu chưa có (ví dụ: TR-20251226-XXXXX)
transactionSchema.pre('save', function() {
  if (!this.transactionId) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.transactionId = `TR-${datePart}-${randomPart}`;
  }
});

// Index để query nhanh
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);