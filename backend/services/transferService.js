const Wallet = require('../models/Wallet');
const User = require('../models/User');
const mongoose = require('mongoose');

const transferByPhone = async (payload) => {
  const {
    senderId,
    senderWalletId,
    phone: receiverPhone,
    receiverWalletId,
    amount
  } = payload;

  if (!senderId || !senderWalletId || !receiverPhone || !receiverWalletId || !amount) {
    throw new Error('Thiếu thông tin chuyển tiền');
  }

  const allSenderWallets = await Wallet.find({
    user_id: senderId 
  });
 const senderWallet = await Wallet.findOne({
    _id: new mongoose.Types.ObjectId(senderWalletId),
    user_id: new mongoose.Types.ObjectId(senderId),
    status: { $in: ['active', 'ACTIVE'] } 
  });

  console.log('FOUND SENDER WALLET:', senderWallet);

  if (!senderWallet) {
    throw new Error('Ví gửi không hợp lệ hoặc không khả dụng');
  }

  if (senderWallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

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
