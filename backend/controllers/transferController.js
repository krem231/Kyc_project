// controllers/transferController.js
const transferService = require('../services/transferService');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const transferByPhone = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const senderId = req.user.id; // từ authMiddleware

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại và số tiền'
      });
    }

    const result = await transferService.transferByPhone(senderId, phone.trim(), Number(amount));

    res.status(200).json({
      success: true,
      message: 'Chuyển tiền thành công',
      data: {
        receiverUsername: result.receiverUsername,
        receiverPhone: result.receiverPhone,
        amount,
        senderBalanceAfter: result.senderBalanceAfter,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Chuyển tiền thất bại'
    });
  }
};

const checkReceiver = async (req, res) => {
  try {
    const { phone } = req.body;
    const senderId = req.user.id;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại'
      });
    }

    const receiver = await User.findOne({ phone: phone.trim() });
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với số điện thoại này'
      });
    }

    if (receiver._id.toString() === senderId) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển cho chính mình'
      });
    }

    const wallet = await Wallet.findOne({ userId: receiver._id });
    if (!wallet || wallet.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Ví người nhận không khả dụng'
      });
    }

    res.json({
      success: true,
      receiver: {
        username: receiver.username,
        phone: receiver.phone
      }
    });
  } catch (error) {
    console.error('Check receiver error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra người nhận'
    });
  }
};

module.exports = { transferByPhone, checkReceiver };