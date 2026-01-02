const Wallet = require('../models/Wallet');
const SavingTransaction = require('../models/SavingTransaction');

const INTEREST_RATE = 0.02;

/**
 * Gửi tiết kiệm
 */
const createSaving = async ({ userId, walletId, amount, term }) => {
  amount = Number(amount);
  term = Number(term);

  if (!walletId || !amount || !term) {
    throw new Error('Thiếu thông tin gửi tiết kiệm');
  }

  if (amount <= 0) {
    throw new Error('Số tiền không hợp lệ');
  }

  // 1️⃣ Tìm ví
  const wallet = await Wallet.findOne({
    _id: walletId,
    user_id: userId
  });

  if (!wallet) {
    throw new Error('Ví không tồn tại');
  }

  if (wallet.status !== 'activate') {
    throw new Error('Ví không hoạt động');
  }

  if (wallet.balance < amount) {
    throw new Error('Số dư không đủ');
  }

  // 2️⃣ Tính lãi
  const interestAmount = Math.floor(amount * INTEREST_RATE);
  const totalReceive = amount + interestAmount;

  // 3️⃣ Tính ngày đáo hạn
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + term);

  // 4️⃣ Trừ tiền ví (atomic)
  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      _id: walletId,
      balance: { $gte: amount }
    },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!updatedWallet) {
    throw new Error('Không thể trừ tiền ví');
  }

  // 5️⃣ Tạo sổ tiết kiệm
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

module.exports = {
  createSaving
};
