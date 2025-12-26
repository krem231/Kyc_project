// services/walletLinkService.js
const axios = require('axios');
const LinkedBank = require('../models/LinkedBank');

const BANK_API_URL = 'http://localhost:5001/api/otp';

// Helper: Reset hạn mức nạp tiền nếu sang ngày mới
const resetDailyLimitIfNeeded = async (linkedBank) => {
  if (!linkedBank) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastReset = linkedBank.lastResetDate ? new Date(linkedBank.lastResetDate) : new Date(linkedBank.linkedAt);
  lastReset.setHours(0, 0, 0, 0);

  if (today.getTime() > lastReset.getTime()) {
    linkedBank.remainingDailyDepositLimit = linkedBank.maxDailyDepositLimit;
    linkedBank.lastResetDate = new Date();
    await linkedBank.save();
  }
};

// Request OTP liên kết từ ngân hàng
const requestBankOTP = async (accountNumber, userId) => {
  const activeCount = await LinkedBank.countDocuments({ userId, status: 'ACTIVE' });
  if (activeCount >= 3) {
    throw new Error('Bạn chỉ có thể liên kết tối đa 3 tài khoản ngân hàng.');
  }

  try {
    const response = await axios.post(`${BANK_API_URL}/request-link`, {
      accountNumber,
      walletId: userId,
      purpose: 'LINK_WALLET' // Gửi purpose để ngân hàng lưu OTP đúng
    });

    // Trả về thông tin từ ngân hàng
    const { otp, expiresIn } = response.data;

    return {
      message: 'OTP đã được gửi đến số điện thoại đăng ký',
      otp: otp || null, // Chỉ trả cho dev/debug
      expiresIn: expiresIn || 300 // 5 phút mặc định
    };
  } catch (error) {
    console.error('Lỗi request OTP liên kết:', error.response?.data || error.message);
    const msg = error.response?.data?.message;
    throw new Error(msg || 'Không thể kết nối đến ngân hàng');
  }
};

// Verify OTP và tạo liên kết mới
const verifyBankOTP = async (accountNumber, otp, userId) => {
  const activeCount = await LinkedBank.countDocuments({ userId, status: 'ACTIVE' });
  if (activeCount >= 3) {
    throw new Error('Bạn chỉ có thể liên kết tối đa 3 tài khoản ngân hàng.');
  }

  const existing = await LinkedBank.findOne({ userId, bankAccountNumber: accountNumber });
  if (existing) {
    throw new Error('Tài khoản ngân hàng này đã được liên kết trước đó');
  }

  try {
    // Gọi API verify từ ngân hàng
    const response = await axios.post(`${BANK_API_URL}/verify-link`, {
      accountNumber,
      walletId: userId,
      otp
    });

    const bankData = response.data.data;
    if (!bankData?.accountNumber || !bankData?.bankUserId) {
      throw new Error('Dữ liệu trả về từ ngân hàng không hợp lệ');
    }

    const newLink = await LinkedBank.create({
      userId,
      bankAccountNumber: bankData.accountNumber,
      bankUserId: bankData.bankUserId,
      status: 'ACTIVE',
      linkedAt: new Date(),
      maxDailyDepositLimit: 100000000,
      remainingDailyDepositLimit: 100000000,
      lastResetDate: new Date(),
      minDepositAmount: 10000,
      bankName: bankData.bankName || 'Ngân hàng liên kết'
    });

    return {
      success: true,
      message: 'Liên kết tài khoản ngân hàng thành công!',
      link: newLink
    };
  } catch (error) {
    console.error('Lỗi verify OTP liên kết:', error.response?.data || error.message);
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg || 'OTP không hợp lệ hoặc lỗi xác thực với ngân hàng');
  }
};

// Hủy liên kết - XÓA HOÀN TOÀN record khỏi DB
const unlinkBankAccount = async (userId, linkedId) => {
  const linkedBank = await LinkedBank.findOneAndDelete({
    _id: linkedId,
    userId,
    status: 'ACTIVE'
  });

  if (!linkedBank) {
    throw new Error('Liên kết không tồn tại hoặc đã bị hủy');
  }

  return { success: true, message: 'Hủy liên kết và xóa dữ liệu thành công' };
};

// Lấy danh sách tài khoản liên kết ACTIVE (và tự động reset hạn mức nếu cần)
const getLinkedAccounts = async (userId) => {
  let links = await LinkedBank.find({ userId, status: 'ACTIVE' })
    .sort({ linkedAt: -1 })
    .lean();

  // Reset hạn mức cho từng tài khoản nếu sang ngày mới
  for (const link of links) {
    const doc = await LinkedBank.findById(link._id);
    await resetDailyLimitIfNeeded(doc);

    link.remainingDailyDepositLimit = doc.remainingDailyDepositLimit;
    link.lastResetDate = doc.lastResetDate;
  }

  return links;
};

// Check pending OTP từ ngân hàng
const checkPendingOTPFromBank = async (walletId) => {
  try {
    const response = await axios.get(`${BANK_API_URL}/check-pending`, {
      params: { walletId }
    });
    return response.data.hasPending || false;
  } catch (error) {
    console.error('Lỗi check pending OTP:', error.response?.data || error.message);
    throw new Error('Không thể kiểm tra OTP pending từ ngân hàng');
  }
};

module.exports = {
  requestBankOTP,
  verifyBankOTP,
  unlinkBankAccount,
  getLinkedAccounts,
  checkPendingOTPFromBank
};