const walletService = require('../services/withdrawService');

/**
 * POST /api/wallet/withdraw
 * Rút tiền từ ví về tài khoản ngân hàng
 */
const withdraw = async (req, res) => {
  try {
    const { walletId, linkedBankId, amount } = req.body;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Validate input
    if (!walletId || !linkedBankId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin rút tiền'
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ'
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const result = await walletService.withdrawToBank(
      userId,
      walletId,
      linkedBankId,
      amount,
      token
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đã có lỗi xảy ra khi rút tiền'
    });
  }
};
/**
 * GET /api/wallet/balance
 * Lấy số dư ví
 */
const getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await walletService.getWalletBalance(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đã có lỗi khi lấy thông tin số dư'
    });
  }
};

/**
 * GET /api/wallet/withdraw-history
 * Lấy lịch sử rút tiền từ Bank API
 */
const getWithdrawHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const limit = parseInt(req.query.limit) || 10;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const result = await walletService.getWithdrawHistory(userId, token, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đã có lỗi khi lấy lịch sử giao dịch'
    });
  }
};

module.exports = {
  withdraw,
  getBalance,
  getWithdrawHistory
};