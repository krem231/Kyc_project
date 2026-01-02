// controllers/transferController.js
const transferService = require('../services/transferService');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

/**
 * Chuẩn hoá số điện thoại
 * - Ép string
 * - Bỏ khoảng trắng
 * - Bỏ ký tự không phải số
 */
const normalizePhone = (phone) => {
  return phone
    ?.toString()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^0-9]/g, '');
};

/**
 * POST /api/wallet/transfer
 * Chuyển tiền theo số điện thoại
 * FE gửi:
 * {
 *   phone,
 *   amount,
 *   senderWalletId,   // selectedWallet._id
 *   receiverWalletId
 * }
 */
const transferByPhone = async (req, res) => {
  try {
    console.log('🔥 TRANSFER API HIT');
    console.log('BODY:', req.body);
    console.log('USER:', req.user);

    const {
      phone,
      amount,
      senderWalletId,
      receiverWalletId
    } = req.body;

    const senderId = req.user?.id;

    // ✅ Validate đầu vào
    if (!senderId || !phone || !amount || !senderWalletId || !receiverWalletId) {
      console.log('❌ MISSING FIELD DEBUG:', {
        senderId,
        phone,
        amount,
        senderWalletId,
        receiverWalletId
      });

      return res.status(400).json({
        success: false,
        message: 'Thiếu số điện thoại, số tiền, ví gửi hoặc ví nhận'
      });
    }

    const cleanPhone = normalizePhone(phone);

    console.log('===== TRANSFER CONTROLLER DEBUG =====');
    console.log('Sender ID:', senderId);
    console.log('Sender Wallet ID:', senderWalletId);
    console.log('Receiver Wallet ID:', receiverWalletId);
    console.log('Raw phone:', phone);
    console.log('Clean phone:', cleanPhone);
    console.log('Amount:', amount);
    console.log('=====================================');

    // ✅ GỌI SERVICE ĐÚNG KIỂU OBJECT
    const result = await transferService.transferByPhone({
      senderId,
      senderWalletId,
      phone: cleanPhone,
      receiverWalletId,
      amount: Number(amount)
    });

    return res.status(200).json({
      success: true,
      message: 'Chuyển tiền thành công',
      data: {
        receiverUsername: result.receiverUsername,
        receiverPhone: result.receiverPhone,
        amount: Number(amount),
        senderBalanceAfter: result.senderBalanceAfter,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ TRANSFER ERROR:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Chuyển tiền thất bại'
    });
  }
};

/**
 * POST /api/wallet/check-receiver
 * Kiểm tra người nhận theo số điện thoại
 * FE gửi: { phone }
 */
const checkReceiver = async (req, res) => {
  try {
    console.log('🔥 CHECK RECEIVER API HIT');
    console.log('BODY:', req.body);
    console.log('USER:', req.user);

    const { phone } = req.body;
    const senderId = req.user?.id;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại'
      });
    }

    const cleanPhone = normalizePhone(phone);

    console.log('===== CHECK RECEIVER DEBUG =====');
    console.log('Raw phone:', phone);
    console.log('Clean phone:', cleanPhone);
    console.log('Sender ID:', senderId);
    console.log('================================');

    const receiver = await User.findOne({ phone: cleanPhone });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với số điện thoại này'
      });
    }

    if (receiver._id.toString() === senderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển tiền cho chính mình'
      });
    }

    // ✅ Lấy ví ACTIVE của người nhận
    const wallets = await Wallet.find({
      user_id: receiver._id,
      status: 'active'
    }).select('_id balance currency');

    if (!wallets || wallets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Người nhận không có ví khả dụng'
      });
    }

    return res.json({
      success: true,
      receiver: {
        _id: receiver._id,
        username: receiver.username,
        phone: receiver.phone,
        wallets
      }
    });
  } catch (error) {
    console.error('❌ CHECK RECEIVER ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra người nhận'
    });
  }
};

module.exports = {
  transferByPhone,
  checkReceiver
};
