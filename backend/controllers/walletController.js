// controllers/walletController.js (tạo mới nếu chưa có)
const Wallet = require('../models/Wallet');

const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id }); // req.user từ authMiddleware
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Ví không tồn tại' });
    }
    res.status(200).json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        createdAt: wallet.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWallet };