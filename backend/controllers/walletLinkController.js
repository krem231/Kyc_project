// controllers/walletLinkController.js
const walletLinkService = require('../services/walletLinkService');
const LinkedBank = require('../models/LinkedBank'); 
const requestLink = async (req, res) => {
  try {
    const { accountNumber } = req.body;
    const userId = req.user.id; 
    if (!accountNumber) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số tài khoản' });
    }
    const result = await walletLinkService.requestBankOTP(accountNumber, userId);
    res.status(200).json({
      success: true,
      message: result.message,
      otp: result.otp, // Trả OTP cho FE (dev purpose)
      expiresIn: result.expiresIn
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify liên kết (gọi verify OTP và lưu)
const verifyLink = async (req, res) => {
  try {
    const { accountNumber, otp } = req.body;
    const userId = req.user.id;
    if (!accountNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    const result = await walletLinkService.verifyBankOTP(accountNumber, otp, userId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.link
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const checkPending = async (req, res) => {
  try {
    const walletId = req.user.id;
    const hasPending = await walletLinkService.checkPendingOTPFromBank(walletId);
    res.status(200).json({ success: true, hasPending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkLinked = async (req, res) => {
  try {
    const existingLink = await LinkedBank.findOne({
      userId: req.user.id,
      status: 'ACTIVE',
    });
    res.status(200).json({ success: true, isLinked: !!existingLink });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List linked accounts (sử dụng service để lấy ACTIVE và reset hạn mức)
const listLinked = async (req, res) => {
  try {
    const userId = req.user.id;
    const links = await walletLinkService.getLinkedAccounts(userId);
    res.status(200).json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const unlinkAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await walletLinkService.unlinkBankAccount(userId, id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  requestLink,
  verifyLink,
  checkPending,
  checkLinked,
  unlinkAccount,
  listLinked
};