// services/fundService.js
const Fund = require('../models/Fund');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { getIO } = require('../socket');

const contributeToFund = async ({ userId, walletId, fundId, amount }) => {
  amount = Number(amount);

  if (!userId || !walletId || !fundId || !amount) {
    throw new Error('Thiếu thông tin đóng góp quỹ');
  }

  if (amount <= 0) {
    throw new Error('Số tiền không hợp lệ');
  }

  const fund = await Fund.findById(fundId).populate('owner', 'username phone');
  if (!fund) {
    throw new Error('Không tìm thấy quỹ');
  }

  if (fund.status !== 'active') {
    throw new Error('Quỹ không hoạt động');
  }

  const isMember = fund.members.some(m => m.toString() === userId.toString());
  if (!isMember) {
    throw new Error('Bạn không phải thành viên của quỹ này');
  }

  const wallet = await Wallet.findOne({
    _id: walletId,
    user_id: userId,
    status: { $in: ['active', 'ACTIVE'] }
  });

  if (!wallet) {
    throw new Error('Ví không tồn tại hoặc không khả dụng');
  }

  if (wallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: walletId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!updatedWallet) {
    throw new Error('Không thể trừ tiền ví');
  }

  fund.balance += amount;
  await fund.save();

  const user = await User.findById(userId);

  // GỬI THÔNG BÁO
  try {
    const contributorNotif = await createNotification({
      userId: userId,
      type: 'FUND_CONTRIBUTION',
      title: '🤝 Đóng góp quỹ thành công',
      message: `Bạn đã đóng góp ${amount.toLocaleString('vi-VN')} VND vào quỹ chung`,
      amount: -amount,
      metadata: { fundId: fundId, fundBalance: fund.balance }
    });

    const io = getIO();
    
    io.to(userId.toString()).emit('new-notification', {
      notification: contributorNotif,
      balanceChange: -amount
    });

    io.to(userId.toString()).emit('balance-updated', {
      walletId: walletId,
      balance: updatedWallet.balance,
      change: -amount
    });

    // THÔNG BÁO CHO TẤT CẢ THÀNH VIÊN KHÁC
    for (const memberId of fund.members) {
      if (memberId.toString() !== userId.toString()) {
        const memberNotif = await createNotification({
          userId: memberId,
          type: 'FUND_CONTRIBUTION',
          title: '📊 Có người đóng góp quỹ',
          message: `${user.username} đã đóng góp ${amount.toLocaleString('vi-VN')} VND vào quỹ chung`,
          amount: amount,
          relatedUser: {
            userId: userId,
            username: user.username,
            phone: user.phone
          },
          metadata: { fundId: fundId, fundBalance: fund.balance }
        });

        io.to(memberId.toString()).emit('new-notification', {
          notification: memberNotif
        });

        io.to(memberId.toString()).emit('fund-updated', {
          fundId: fundId,
          balance: fund.balance,
          change: amount
        });
      }
    }

  } catch (notifError) {
    console.error('Error sending fund notifications:', notifError);
  }

  return {
    success: true,
    message: 'Đóng góp quỹ thành công',
    data: {
      amount,
      fundBalance: fund.balance,
      walletBalanceAfter: updatedWallet.balance
    }
  };
};

module.exports = { contributeToFund };