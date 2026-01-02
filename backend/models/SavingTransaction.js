const mongoose = require('mongoose');

const SavingTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  amount: {
    type: Number,
    required: true
  },

  term: {
    type: Number, // số tháng
    required: true
  },

  interestRate: {
    type: Number,
    default: 0.02 // 2%
  },

  interestAmount: {
    type: Number,
    required: true
  },

  totalReceive: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['ACTIVE', 'MATURED', 'CANCELLED'],
    default: 'ACTIVE'
  },

  startDate: {
    type: Date,
    default: Date.now
  },

  endDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SavingTransaction', SavingTransactionSchema);
