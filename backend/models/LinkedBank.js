const mongoose = require('mongoose');
const LinkedBankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankAccountNumber: {
    type: String,
    required: true
  },
  bankUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },

  // === Thông tin hạn mức nạp tiền (mỗi tài khoản liên kết riêng) ===
  maxDailyDepositLimit: {
    type: Number,
    default: 100000000 // 100 triệu VND/ngày cho mỗi tài khoản liên kết
  },
  remainingDailyDepositLimit: {
    type: Number,
    default: 100000000 // Ban đầu = max, sẽ giảm khi nạp thành công
  },
  minDepositAmount: {
    type: Number,
    default: 10000 // Tối thiểu 10.000 VND
  },
  lastResetDate: {
    type: Date,
    default: Date.now // Ngày cuối cùng reset hạn mức (dùng để kiểm tra sang ngày mới)
  },
  bankName: {
    type: String,
    default: 'Ngân hàng liên kết'
  }
});

LinkedBankSchema.index({ userId: 1 });
LinkedBankSchema.index({ userId: 1, status: 1 });
LinkedBankSchema.index({ userId: 1, bankAccountNumber: 1 }, { unique: true });

LinkedBankSchema.methods.resetDailyLimitIfNeeded = async function() {
  const today = new Date();
  const lastReset = this.lastResetDate;

  // Nếu không cùng ngày → reset
  if (
    today.getFullYear() !== lastReset.getFullYear() ||
    today.getMonth() !== lastReset.getMonth() ||
    today.getDate() !== lastReset.getDate()
  ) {
    this.remainingDailyDepositLimit = this.maxDailyDepositLimit;
    this.lastResetDate = today;
    await this.save();
  }
};

module.exports = mongoose.model('LinkedBank', LinkedBankSchema);