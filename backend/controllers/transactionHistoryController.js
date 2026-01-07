// controllers/transactionHistoryController.js
const transactionHistoryService = require('../services/transactionHistoryService');

/**
 * Lấy tất cả lịch sử giao dịch (gửi + nhận)
 * GET /api/transactions/history?page=1&limit=10
 */
const getTransferHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await transactionHistoryService.getTransferHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get transfer history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử giao dịch'
    });
  }
};

/**
 * Lấy lịch sử giao dịch ĐÃ GỬI
 * GET /api/transactions/sent?page=1&limit=10
 */
const getSentTransfers = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await transactionHistoryService.getSentTransfers(userId, page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get sent transfers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử gửi tiền'
    });
  }
};

/**
 * Lấy lịch sử giao dịch ĐÃ NHẬN
 * GET /api/transactions/received?page=1&limit=10
 */
const getReceivedTransfers = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await transactionHistoryService.getReceivedTransfers(userId, page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get received transfers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử nhận tiền'
    });
  }
};

/**
 * Lấy thống kê giao dịch
 * GET /api/transactions/stats
 */
const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await transactionHistoryService.getTransactionStats(userId);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê giao dịch'
    });
  }
};

/**
 * Lấy chi tiết 1 giao dịch
 * GET /api/transactions/:id
 */
const getTransactionDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã giao dịch'
      });
    }

    const transaction = await transactionHistoryService.getTransactionDetail(userId, transactionId);

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction detail error:', error);
    const statusCode = error.message.includes('không có quyền') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi khi lấy chi tiết giao dịch'
    });
  }
};

module.exports = {
  getTransferHistory,
  getSentTransfers,
  getReceivedTransfers,
  getTransactionStats,
  getTransactionDetail
};