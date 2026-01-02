// controllers/depositController.js
const depositService = require('../services/depositService');

const requestOTP = async (req, res) => {
  try {
    const { bankAccountNumber, amount } = req.body;
    const userId = req.user.id;

    if (!bankAccountNumber || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }

    const result = await depositService.requestDepositOTP(userId, bankAccountNumber, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { transactionId, otp } = req.body;
    const userId = req.user.id;

    if (!transactionId || !otp) {
      return res.status(400).json({ success: false, message: 'Thiếu transactionId hoặc OTP' });
    }

    const result = await depositService.verifyDepositOTP(userId, transactionId, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const history = await depositService.getDepositHistory(userId, page, limit);
    res.status(200).json({ success: true, ...history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestOTP,
  verifyOTP,
  getHistory
};