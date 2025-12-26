// models/DepositTransaction.js
const mongoose = require('mongoose');

const DepositTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankAccountNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['PENDING_OTP', 'PENDING_TRANSFER', 'SUCCESS', 'FAILED'],
    default: 'PENDING_OTP'
  },
  otpRequestedAt: { // Thời gian yêu cầu OTP
    type: Date
  },
  transactionId: { // Mã từ ngân hàng nếu có
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  note: String
});

DepositTransactionSchema.index({ userId: 1, createdAt: -1 });
DepositTransactionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('DepositTransaction', DepositTransactionSchema);