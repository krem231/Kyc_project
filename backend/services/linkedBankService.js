// services/linkedBankService.js
const LinkedBank = require('../models/LinkedBank');

// Lấy tất cả liên kết của user (bao gồm ACTIVE và INACTIVE)
const getAllLinkedBanks = async (userId) => {
  try {
    const links = await LinkedBank.find({ userId })
      .sort({ linkedAt: -1 })
      .lean(); // lean() để trả về plain object, nhanh hơn

    return links;
  } catch (error) {
    throw new Error('Lỗi khi lấy danh sách liên kết: ' + error.message);
  }
};

// Lấy danh sách chỉ các liên kết ACTIVE (bao gồm hạn mức)
const getActiveLinkedBanks = async (userId) => {
  try {
    const links = await LinkedBank.find({ userId, status: 'ACTIVE' })
      .sort({ linkedAt: -1 })
      .lean();

    return links; // Đã bao gồm maxDailyDepositLimit, remainingDailyDepositLimit, minDepositAmount
  } catch (error) {
    throw new Error('Lỗi khi lấy liên kết ACTIVE: ' + error.message);
  }
};

// Kiểm tra xem user có ít nhất một liên kết ACTIVE không
const hasActiveLink = async (userId) => {
  try {
    const activeLink = await LinkedBank.findOne({ userId, status: 'ACTIVE' });
    return !!activeLink;
  } catch (error) {
    throw new Error('Lỗi khi kiểm tra liên kết ACTIVE: ' + error.message);
  }
};

// Lấy số lượng liên kết ACTIVE hiện tại (dùng để kiểm tra giới hạn 3)
const getActiveLinkedCount = async (userId) => {
  try {
    return await LinkedBank.countDocuments({ userId, status: 'ACTIVE' });
  } catch (error) {
    throw new Error('Lỗi khi đếm liên kết ACTIVE: ' + error.message);
  }
};

// Lấy thông tin hạn mức của một liên kết cụ thể (theo ID)
const getDepositLimitsByLinkId = async (linkId) => {
  try {
    const link = await LinkedBank.findById(linkId).lean();
    if (!link) {
      throw new Error('Liên kết không tồn tại');
    }

    return {
      maxDailyDepositLimit: link.maxDailyDepositLimit,
      remainingDailyDepositLimit: link.remainingDailyDepositLimit,
      minDepositAmount: link.minDepositAmount
    };
  } catch (error) {
    throw new Error('Lỗi khi lấy hạn mức: ' + error.message);
  }
};

// Lấy hạn mức của tất cả liên kết ACTIVE của user (tổng hợp)
const getAllActiveDepositLimits = async (userId) => {
  try {
    const links = await LinkedBank.find({ userId, status: 'ACTIVE' }).lean();
    return links.map(link => ({
      linkId: link._id,
      bankAccountNumber: link.bankAccountNumber,
      maxDailyDepositLimit: link.maxDailyDepositLimit,
      remainingDailyDepositLimit: link.remainingDailyDepositLimit,
      minDepositAmount: link.minDepositAmount
    }));
  } catch (error) {
    throw new Error('Lỗi khi lấy hạn mức tất cả liên kết: ' + error.message);
  }
};

module.exports = {
  getAllLinkedBanks,
  getActiveLinkedBanks,          // Mới: Lấy ACTIVE với đầy đủ hạn mức
  hasActiveLink,
  getActiveLinkedCount,
  getDepositLimitsByLinkId,      // Mới: Lấy hạn mức theo ID
  getAllActiveDepositLimits      // Mới: Lấy hạn mức tất cả ACTIVE
};