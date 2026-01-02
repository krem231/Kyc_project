const Wallet = require('../models/Wallet');
const User = require('../models/User');
const mongoose = require('mongoose');

const transferByPhone = async (payload) => {
  console.log('🔥 transferByPhone RAW PAYLOAD:', payload);
  console.log('🔥 payload type:', typeof payload);

  const {
    senderId,
    senderWalletId,
    phone: receiverPhone,
    receiverWalletId,
    amount
  } = payload;

  console.log('===== SERVICE FIELD DEBUG =====');
  console.log('senderId:', senderId);
  console.log('senderWalletId:', senderWalletId);
  console.log('receiverPhone:', receiverPhone);
  console.log('receiverWalletId:', receiverWalletId);
  console.log('amount:', amount);
  console.log('================================');

  // ✅ Validate
  if (!senderId || !senderWalletId || !receiverPhone || !receiverWalletId || !amount) {
    throw new Error('Thiếu thông tin chuyển tiền');
  }

  /* ======================================================
     🔥 DEBUG QUAN TRỌNG: IN RA TẤT CẢ VÍ CỦA USER
     ====================================================== */
  const allSenderWallets = await Wallet.find({
    user_id: senderId // ⚠️ ĐỔI FIELD NẾU MODEL KHÁC
  });

  console.log('🔥 ALL WALLETS OF SENDER:', allSenderWallets);

  /* ======================================================
     ✅ TÌM VÍ GỬI (FIX LỖI NULL)
     ====================================================== */
  const senderWallet = await Wallet.findOne({
    _id: new mongoose.Types.ObjectId(senderWalletId),
    user_id: new mongoose.Types.ObjectId(senderId),
    status: { $in: ['active', 'ACTIVE'] } // chống lệch enum
  });

  console.log('FOUND SENDER WALLET:', senderWallet);

  if (!senderWallet) {
    throw new Error('Ví gửi không hợp lệ hoặc không khả dụng');
  }

  if (senderWallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

  /* ======================================================
     ✅ TÌM NGƯỜI NHẬN
     ====================================================== */
  const receiver = await User.findOne({ phone: receiverPhone });
  if (!receiver) {
    throw new Error('Không tìm thấy người nhận');
  }

  const receiverWallet = await Wallet.findOne({
    _id: new mongoose.Types.ObjectId(receiverWalletId),
    user_id: receiver._id,
    status: { $in: ['active', 'ACTIVE'] }
  });

  if (!receiverWallet) {
    throw new Error('Ví nhận không hợp lệ');
  }

  /* ======================================================
     ✅ CẬP NHẬT SỐ DƯ
     ====================================================== */
  senderWallet.balance -= amount;
  receiverWallet.balance += amount;

  await senderWallet.save();
  await receiverWallet.save();

  return {
    receiverUsername: receiver.username,
    receiverPhone: receiver.phone,
    senderBalanceAfter: senderWallet.balance
  };
};

module.exports = {
  transferByPhone
};
