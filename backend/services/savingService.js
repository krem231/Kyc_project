// services/savingService.js
const Wallet = require('../models/Wallet');
const SavingTransaction = require('../models/SavingTransaction');
const { createNotification } = require('./notificationService');
const { getIO } = require('../socket');

const INTEREST_RATE = 0.02;

const createSaving = async ({ userId, walletId, amount, term }) => {
  amount = Number(amount);
  term = Number(term);

  if (!walletId || !amount || !term) {
    throw new Error('Thiếu thông tin gửi tiết kiệm');
  }

  if (amount <= 0) {
    throw new Error('Số tiền không hợp lệ');
  }

  const wallet = await Wallet.findOne({
    _id: walletId,
    user_id: userId
  });

  if (!wallet) {
    throw new Error('Ví không tồn tại');
  }

  if (wallet.status !== 'active') {
    throw new Error('Ví không hoạt động');
  }

  if (wallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

  const interestAmount = Math.floor(amount * INTEREST_RATE);
  const totalReceive = amount + interestAmount;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + term);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: walletId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!updatedWallet) {
    throw new Error('Không thể trừ tiền ví');
  }

  const saving = await SavingTransaction.create({
    walletId,
    userId,
    amount,
    term,
    interestRate: INTEREST_RATE,
    interestAmount,
    totalReceive,
    startDate,
    endDate
  });

  // GỬI THÔNG BÁO
  try {
    const notification = await createNotification({
      userId: userId,
      type: 'SAVINGS_DEPOSIT',
      title: '🏦 Gửi tiết kiệm thành công',
      message: `Bạn đã gửi ${amount.toLocaleString('vi-VN')} VND vào kỳ hạn ${term} tháng. Lãi suất ${(INTEREST_RATE * 100)}%/tháng`,
      amount: -amount,
      metadata: {
        savingId: saving._id,
        term: term,
        interestRate: INTEREST_RATE,
        interestAmount: interestAmount,
        totalReceive: totalReceive,
        endDate: endDate
      }
    });

    const io = getIO();
    io.to(userId.toString()).emit('new-notification', {
      notification: notification,
      balanceChange: -amount
    });

    io.to(userId.toString()).emit('balance-updated', {
      walletId: walletId,
      balance: updatedWallet.balance,
      change: -amount
    });

  } catch (notifError) {
    console.error('Error sending saving notification:', notifError);
  }

  return {
    success: true,
    message: 'Gửi tiết kiệm thành công',
    data: {
      savingId: saving._id,
      amount,
      interestAmount,
      totalReceive,
      term,
      startDate,
      endDate,
      walletBalanceAfter: updatedWallet.balance
    }
  };
};

module.exports = { createSaving };