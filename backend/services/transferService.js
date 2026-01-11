// services/transferService.js
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { createTransferNotifications } = require('./notificationService');
const { getIO } = require('../socket');

const transferByPhone = async (payload) => {
  const {
    senderId,
    senderWalletId,
    phone: receiverPhone,
    receiverWalletId,
    amount
  } = payload;

  console.log('\n🔄 Transfer Process Started');
  console.log('Sender ID:', senderId);
  console.log('Amount:', amount);

  if (!senderId || !senderWalletId || !receiverPhone || !receiverWalletId || !amount) {
    throw new Error('Thiếu thông tin chuyển tiền');
  }

  // Tìm ví người gửi
  const senderWallet = await Wallet.findOne({
    _id: new mongoose.Types.ObjectId(senderWalletId),
    user_id: new mongoose.Types.ObjectId(senderId),
    status: { $in: ['active', 'ACTIVE'] }
  });

  if (!senderWallet) {
    throw new Error('Ví gửi không hợp lệ');
  }

  if (senderWallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

  // Tìm người nhận
  const receiver = await User.findOne({ phone: receiverPhone });
  if (!receiver) {
    throw new Error('Không tìm thấy người nhận');
  }

  // Tìm người gửi
  const sender = await User.findById(senderId);
  if (!sender) {
    throw new Error('Không tìm thấy người gửi');
  }

  // Tìm ví người nhận
  const receiverWallet = await Wallet.findOne({
    _id: new mongoose.Types.ObjectId(receiverWalletId),
    user_id: receiver._id,
    status: { $in: ['active', 'ACTIVE'] }
  });

  if (!receiverWallet) {
    throw new Error('Ví nhận không hợp lệ');
  }

  // Thực hiện chuyển tiền
  senderWallet.balance -= amount;
  receiverWallet.balance += amount;

  await senderWallet.save();
  await receiverWallet.save();

  console.log('✅ Wallets updated');

  // Lưu giao dịch
  const transaction = await Transaction.create({
    senderId: senderId,
    receiverId: receiver._id,
    amount: amount,
    type: 'TRANSFER',
    status: 'SUCCESS',
    description: `Chuyển tiền từ ${sender.username} đến ${receiver.username}`,
    metadata: {
      senderWalletId: senderWalletId,
      receiverWalletId: receiverWalletId,
      phone: receiverPhone
    }
  });

  console.log('✅ Transaction created:', transaction._id);

  // GỬI THÔNG BÁO
  try {
    console.log('\n🔔 Starting notification process...');
    
    const io = getIO();
    console.log('✅ Got IO instance');
    
    await createTransferNotifications(
      {
        senderId: senderId,
        receiverId: receiver._id,
        senderInfo: {
          username: sender.username,
          phone: sender.phone
        },
        receiverInfo: {
          username: receiver.username,
          phone: receiver.phone
        },
        amount: amount
      },
      transaction._id,
      io
    );

    // Emit balance update
    io.to(senderId.toString()).emit('balance-updated', {
      walletId: senderWalletId,
      balance: senderWallet.balance,
      change: -amount
    });

    io.to(receiver._id.toString()).emit('balance-updated', {
      walletId: receiverWalletId,
      balance: receiverWallet.balance,
      change: amount
    });

  } catch (notifError) {
    console.error('❌ Notification error:', notifError);
  }

  return {
    receiverUsername: receiver.username,
    receiverPhone: receiver.phone,
    senderBalanceAfter: senderWallet.balance,
    receiverBalanceAfter: receiverWallet.balance
  };
};

module.exports = { transferByPhone };