const Wallet = require('../models/Wallet');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:5001';

/**
 * Rút tiền từ ví về tài khoản ngân hàng
 * Flow mới: Gọi Bank API trước → Thành công → Mới trừ tiền ví
 */
const withdrawToBank = async (userId, accountNumber, amount, token) => {
  try {
    // 1. Validate input cơ bản
    if (!userId || !accountNumber || !amount || amount < 10000) {
      throw new Error('Thông tin rút tiền không hợp lệ hoặc số tiền tối thiểu là 10.000 VND');
    }

    // 2. Kiểm tra ví tồn tại và ACTIVE
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Ví không tồn tại');
    }

    if (wallet.status !== 'ACTIVE') {
      throw new Error('Ví đã bị khóa hoặc không hoạt động');
    }

    // 3. Kiểm tra số dư đủ (chỉ đọc, chưa trừ)
    if (wallet.balance < amount) {
      throw new Error(
        `Số dư không đủ. Hiện tại: ${wallet.balance.toLocaleString('vi-VN')} VND, cần: ${amount.toLocaleString('vi-VN')} VND`
      );
    }

    const walletBalanceBefore = wallet.balance;
    const walletBalanceAfter = walletBalanceBefore - amount; // Tạm tính để gửi sang Bank

    // 4. Gọi Bank API trước để cộng tiền vào tài khoản ngân hàng
    const bankResponse = await axios.post(
      `${BANK_API_URL}/api/withdraw`,
      {
        accountNumber,
        walletId: wallet._id, // hoặc userId nếu Bank cần
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

    // Kiểm tra response từ Bank API
    if (!bankResponse.data.success) {
      throw new Error(bankResponse.data.message || 'Giao dịch ngân hàng thất bại');
    }

    // 5. Bank thành công → Bây giờ mới trừ tiền ví (atomic để tránh race condition)
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: wallet._id,
        balance: walletBalanceBefore // Đảm bảo balance chưa bị thay đổi bởi request khác
      },
      { $inc: { balance: -amount } },
      { new: true }
    );

    // Nếu update thất bại (do race condition hoặc lỗi DB) → ném lỗi
    if (!updatedWallet) {
      // Lúc này tiền đã vào ngân hàng → cần xử lý reconcile thủ công (hiếm xảy ra)
      console.error('CRITICAL: Failed to deduct wallet balance after bank credit', {
        userId,
        amount,
        walletBalanceBefore
      });
      throw new Error('Lỗi hệ thống khi cập nhật ví. Vui lòng liên hệ hỗ trợ.');
    }

    // 6. Thành công hoàn toàn
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
    // Xử lý lỗi từ Bank API hoặc các bước khác
    let errorMessage = error.message || 'Đã có lỗi xảy ra khi rút tiền';

    // Nếu lỗi từ Bank API (có response)
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Lấy số dư ví
 */
const getWalletBalance = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
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
    throw new Error('Không thể lấy lịch sử giao dịch từ ngân hàng');
  }
};

module.exports = {
  withdrawToBank,
  getWalletBalance,
  getWithdrawHistory
};