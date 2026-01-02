// controllers/linkedBankController.js
const linkedBankService = require('../services/linkedBankService');

// Lấy danh sách tất cả liên kết của user (bao gồm ACTIVE và INACTIVE)
const listLinked = async (req, res) => {
  try {
    const userId = req.user.id;
    const links = await linkedBankService.getAllLinkedBanks(userId);

    // Tính activeCount
    const activeCount = links.filter(link => link.status === 'ACTIVE').length;
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách liên kết thành công',
      total: links.length,
      activeCount,
      data: links
    });
  } catch (error) {
    console.error('Lỗi listLinked:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách liên kết'
    });
  }
};

// Kiểm tra user có ít nhất một liên kết ACTIVE không
const checkLinked = async (req, res) => {
  try {
    const userId = req.user.id;
    const isLinked = await linkedBankService.hasActiveLink(userId);

    res.status(200).json({
      success: true,
      isLinked
    });
  } catch (error) {
    console.error('Lỗi checkLinked:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi kiểm tra liên kết'
    });
  }
};

// Lấy danh sách chỉ liên kết ACTIVE (với thông tin hạn mức đầy đủ)
const getActiveLinked = async (req, res) => {
  try {
    const userId = req.user.id;
    const activeLinks = await linkedBankService.getActiveLinkedBanks(userId);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách liên kết ACTIVE thành công',
      total: activeLinks.length,
      data: activeLinks // Bao gồm maxDailyDepositLimit, remainingDailyDepositLimit, minDepositAmount
    });
  } catch (error) {
    console.error('Lỗi getActiveLinked:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy liên kết ACTIVE'
    });
  }
};

// Lấy thông tin hạn mức của một liên kết cụ thể (theo ID)
const getDepositLimits = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const limits = await linkedBankService.getDepositLimitsByLinkId(id, userId);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin hạn mức thành công',
      data: limits
    });
  } catch (error) {
    console.error('Lỗi getDepositLimits:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy hạn mức'
    });
  }
};

module.exports = {
  listLinked,
  checkLinked,
  getActiveLinked,
  getDepositLimits
};