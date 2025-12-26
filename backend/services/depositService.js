// services/depositService.js (đã cập nhật để dùng hạn mức riêng cho từng tài khoản liên kết)
const axios = require('axios');
const LinkedBank = require('../models/LinkedBank');
const Wallet = require('../models/Wallet');
const DepositTransaction = require('../models/DepositTransaction');

const BANK_API_URL = 'http://localhost:5001/api/otp'; // Server ngân hàng

// Helper: Reset hạn mức nếu sang ngày mới
const resetDailyLimitIfNeeded = async (linkedBank) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

  const lastReset = new Date(linkedBank.lastResetDate);
  lastReset.setHours(0, 0, 0, 0);

  if (today.getTime() !== lastReset.getTime()) {
    linkedBank.remainingDailyDepositLimit = linkedBank.maxDailyDepositLimit;
    linkedBank.lastResetDate = new Date();
    await linkedBank.save();
  }
};

// Bước 1: Yêu cầu OTP để nạp tiền
const requestDepositOTP = async (userId, bankAccountNumber, amount) => {
  amount = Number(amount);
  if (isNaN(amount) || amount <= 0) throw new Error('Số tiền không hợp lệ');

  const linkedBank = await LinkedBank.findOne({
    userId,
    bankAccountNumber,
    status: 'ACTIVE'
  });

  if (!linkedBank) throw new Error('Tài khoản ngân hàng chưa liên kết hoặc không hoạt động');

  // Reset hạn mức nếu sang ngày mới
  await resetDailyLimitIfNeeded(linkedBank);

  // Kiểm tra số tiền tối thiểu
  if (amount < linkedBank.minDepositAmount) {
    throw new Error(`Số tiền nạp tối thiểu là ${linkedBank.minDepositAmount.toLocaleString()} VND`);
  }

  // Kiểm tra hạn mức còn lại của TÀI KHOẢN NÀY
  if (amount > linkedBank.remainingDailyDepositLimit) {
    throw new Error(
      `Hạn mức nạp hôm nay của tài khoản này chỉ còn ${linkedBank.remainingDailyDepositLimit.toLocaleString()} VND`
    );
  }

  // Gọi ngân hàng yêu cầu OTP
  try {
    const response = await axios.post(`${BANK_API_URL}/request-deposit`, {
      accountNumber: bankAccountNumber,
      walletId: userId,
      amount
    });

    // Tạo giao dịch pending
    const transaction = await DepositTransaction.create({
      userId,
      bankAccountNumber,
      amount,
      status: 'PENDING_OTP',
      otpRequestedAt: new Date()
    });

    return {
      success: true,
      message: response.data.message || 'OTP đã được gửi đến số điện thoại liên kết',
      transactionId: transaction._id,
      expiresIn: response.data.expiresIn || 300
    };
  } catch (error) {
    const msg = error.response?.data?.message || 'Không thể kết nối đến ngân hàng';
    throw new Error(msg);
  }
};

// Bước 2: Xác thực OTP và hoàn tất nạp
const verifyDepositOTP = async (userId, transactionId, otp) => {
  const transaction = await DepositTransaction.findOne({
    _id: transactionId,
    userId,
    status: 'PENDING_OTP'
  });

  if (!transaction) throw new Error('Giao dịch không tồn tại hoặc đã xử lý');

  const linkedBank = await LinkedBank.findOne({
    userId,
    bankAccountNumber: transaction.bankAccountNumber,
    status: 'ACTIVE'
  });

  if (!linkedBank) throw new Error('Tài khoản liên kết không hợp lệ');

  // Reset lại hạn mức (phòng trường hợp sang ngày mới giữa request và verify)
  await resetDailyLimitIfNeeded(linkedBank);

  try {
    // Gọi ngân hàng xác thực OTP
    const response = await axios.post(`${BANK_API_URL}/verify-deposit`, {
      accountNumber: transaction.bankAccountNumber,
      walletId: userId,
      amount: transaction.amount,
      otp
    });

    // Cập nhật số dư ví
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: transaction.amount } },
      { new: true }
    );

    if (!wallet) throw new Error('Ví không tồn tại');

    // Cập nhật hạn mức còn lại của tài khoản liên kết
    linkedBank.remainingDailyDepositLimit -= transaction.amount;
    await linkedBank.save();

    // Cập nhật trạng thái giao dịch
    transaction.status = 'SUCCESS';
    transaction.completedAt = new Date();
    await transaction.save();

    return {
      success: true,
      message: 'Nạp tiền thành công!',
      newBalance: wallet.balance,
      depositedAmount: transaction.amount,
      remainingDailyLimitForThisAccount: linkedBank.remainingDailyDepositLimit
    };
  } catch (error) {
    transaction.status = 'FAILED';
    transaction.note = error.response?.data?.message || error.message;
    await transaction.save();

    throw new Error(error.response?.data?.message || 'OTP không hợp lệ hoặc giao dịch thất bại');
  }
};

// Lấy lịch sử nạp tiền
const getDepositHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const transactions = await DepositTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await DepositTransaction.countDocuments({ userId });

  return {
    transactions: transactions.map(t => ({
      id: t._id,
      bankAccountNumber: t.bankAccountNumber,
      amount: t.amount,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  requestDepositOTP,
  verifyDepositOTP,
  getDepositHistory
};