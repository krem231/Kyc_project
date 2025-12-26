// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'FROZEN'],
    default: 'ACTIVE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để query nhanh theo userId
walletSchema.index({ userId: 1 });

// Đổi tên model và chỉ định rõ tên collection là "wallet" (số ít)
const Wallet = mongoose.model('Wallet', walletSchema, 'wallet');

module.exports = Wallet;