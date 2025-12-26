// services/transferService.js
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const transferByPhone = async (senderId, receiverPhone, amount) => {
  if (amount < 1000) {
    throw new Error('Số tiền chuyển tối thiểu là 1.000 VND');
  }

  // Tìm người nhận
  const receiver = await User.findOne({ phone: receiverPhone });
  if (!receiver) {
    throw new Error('Không tìm thấy người nhận với số điện thoại này');
  }

  if (receiver._id.toString() === senderId.toString()) {
    throw new Error('Không thể chuyển tiền cho chính mình');
  }

  // Lấy ví cả hai
  const senderWallet = await Wallet.findOne({ userId: senderId });
  const receiverWallet = await Wallet.findOne({ userId: receiver._id });

  if (!senderWallet || senderWallet.status !== 'ACTIVE') {
    throw new Error('Ví của bạn không khả dụng');
  }

  if (!receiverWallet || receiverWallet.status !== 'ACTIVE') {
    throw new Error('Ví người nhận không khả dụng');
  }

  if (senderWallet.balance < amount) {
    throw new Error(`Số dư không đủ. Hiện tại: ${senderWallet.balance.toLocaleString('vi-VN')} VND`);
  }

  // Atomic: trừ tiền người gửi (kiểm tra balance thực tế)
  const updatedSender = await Wallet.findOneAndUpdate(
    { userId: senderId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!updatedSender) {
    throw new Error('Giao dịch thất bại do số dư thay đổi. Vui lòng thử lại');
  }

  // Cộng tiền người nhận
  await Wallet.findOneAndUpdate(
    { userId: receiver._id },
    { $inc: { balance: amount } }
  );

  // Lưu lịch sử giao dịch
  await Transaction.create({
    senderId,
    receiverId: receiver._id,
    amount,
    type: 'TRANSFER',
    description: `Chuyển tiền từ ${senderId} đến ${receiver.username} (SĐT: ${receiverPhone})`,
    metadata: { phone: receiverPhone }
  });

  return {
    receiverUsername: receiver.username,
    receiverPhone,
    amount,
    senderBalanceAfter: updatedSender.balance
  };
};

module.exports = { transferByPhone };