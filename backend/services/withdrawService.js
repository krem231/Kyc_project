const Wallet = require('../models/Wallet');
const LinkedBank = require('../models/LinkedBank');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:5001';

/**
 * Rút tiền từ ví về tài khoản ngân hàng
 * Chuẩn hoá giống luồng NẠP:
 * - FE gửi linkedBankId
 * - BE xác minh LinkedBank
 * - Lấy accountNumber từ DB (không tin FE)
 * - Gọi Bank API trước
 * - Thành công mới trừ tiền ví
 */
const withdrawToBank = async (userId, walletId, linkedBankId, amount, token) => {
  try {
    amount = Number(amount);

    // ======================
    // 1. Validate input
    // ======================
    if (!userId || !walletId || !linkedBankId || !amount || amount < 10000) {
      throw new Error('Thông tin rút tiền không hợp lệ hoặc số tiền tối thiểu là 10.000 VND');
    }

    // ======================
    // 2. Kiểm tra ngân hàng đã liên kết
    // ======================
    const linkedBank = await LinkedBank.findOne({
      _id: linkedBankId,
      userId,
      status: 'ACTIVE'
    });

    if (!linkedBank) {
      throw new Error('Ngân hàng không tồn tại hoặc chưa liên kết');
    }

    const accountNumber = linkedBank.bankAccountNumber;

    // ======================
    // 3. Kiểm tra ví tồn tại & ACTIVE
    // ⚠️ BẮT BUỘC theo walletId
    // ======================
    const wallet = await Wallet.findOne({
      _id: walletId,
      user_id: userId
    });

    if (!wallet) {
      throw new Error('Ví không tồn tại');
    }

    if (wallet.status !== 'ACTIVE') {
      throw new Error('Ví đã bị khóa hoặc không hoạt động');
    }

    // ======================
    // 4. Kiểm tra số dư
    // ======================
    if (wallet.balance < amount) {
      throw new Error(
        `Số dư không đủ. Hiện tại: ${wallet.balance.toLocaleString('vi-VN')} VND`
      );
    }

    const walletBalanceBefore = wallet.balance;
    const walletBalanceAfter = walletBalanceBefore - amount;

    // ======================
    // 5. Gọi Bank API (GIỐNG NẠP)
    // ======================
    const bankResponse = await axios.post(
      `${BANK_API_URL}/api/withdraw`,
      {
        accountNumber,
        walletId,
        amount,
        walletBalance: walletBalanceAfter
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!bankResponse.data?.success) {
      throw new Error(bankResponse.data?.message || 'Giao dịch ngân hàng thất bại');
    }

    // ======================
    // 6. Bank OK → Trừ tiền ví (atomic)
    // ======================
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: walletId,
        user_id: userId,
        balance: walletBalanceBefore // chống race condition
      },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!updatedWallet) {
      console.error('CRITICAL: Bank success but wallet update failed', {
        userId,
        walletId,
        amount
      });
      throw new Error('Lỗi hệ thống khi cập nhật ví. Vui lòng liên hệ hỗ trợ.');
    }

    // ======================
    // 7. Thành công
    // ======================
    return {
      success: true,
      message: 'Rút tiền thành công',
      data: {
        amount,
        wallet: {
          balanceBefore: walletBalanceBefore,
          balanceAfter: updatedWallet.balance,
          currency: wallet.currency
        },
        bankTransaction: bankResponse.data.data || bankResponse.data,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    let errorMessage = error.message || 'Đã có lỗi xảy ra khi rút tiền';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Lấy số dư ví (theo walletId)
 */
const getWalletBalance = async (userId, walletId) => {
  const wallet = await Wallet.findOne({
    _id: walletId,
    user_id: userId
  });

  if (!wallet) {
    throw new Error('Ví không tồn tại');
  }

  return {
    success: true,
    data: {
      balance: wallet.balance,
      currency: wallet.currency,
      status: wallet.status
    }
  };
};

/**
 * Lấy lịch sử rút tiền từ Bank API
 */
const getWithdrawHistory = async (userId, token, limit = 10) => {
  try {
    const response = await axios.get(
      `${BANK_API_URL}/api/transactions/history`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: 'WITHDRAW', limit },
        timeout: 10000
      }
    );

    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error('Get withdraw history error:', error.message);
    throw new Error('Không thể lấy lịch sử rút tiền từ ngân hàng');
  }
};

module.exports = {
  withdrawToBank,
  getWalletBalance,
  getWithdrawHistory
};
