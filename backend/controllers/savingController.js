const mongoose = require('mongoose');
const SavingTransaction = require('../models/SavingTransaction');
const savingService = require('../services/savingService');
const Wallet = require('../models/Wallet'); // ✅ BẮT BUỘC

const createSaving = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletId, amount, term } = req.body;

    const result = await savingService.createSaving({
      userId,
      walletId,
      amount,
      term
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const listSavings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletId } = req.query;

    console.log('walletId nhận được:', walletId, typeof walletId);

    if (!walletId || !mongoose.Types.ObjectId.isValid(walletId)) {
      return res.status(400).json({
        success: false,
        message: 'walletId không hợp lệ'
      });
    }

    const savings = await SavingTransaction.find({
      userId: new mongoose.Types.ObjectId(userId),
      walletId: new mongoose.Types.ObjectId(walletId)
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: savings
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const withdrawSaving = async (req, res) => {
  try {
    const { savingId } = req.body;
    const userId = req.user.id;

    console.log('🔥 Withdraw savingId:', savingId);

    if (!mongoose.Types.ObjectId.isValid(savingId)) {
      return res.status(400).json({ message: 'savingId không hợp lệ' });
    }

    const saving = await SavingTransaction.findById(savingId);
    if (!saving) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tiết kiệm' });
    }


    const wallet = await Wallet.findById(saving.walletId);

    const now = new Date();
    const isMatured = now >= new Date(saving.endDate);

    const receiveAmount = isMatured
      ? saving.totalReceive
      : saving.amount;

    const message = isMatured
      ? 'Rút tiết kiệm đúng hạn'
      : 'Rút tiết kiệm trước hạn (không có lãi)';

    // ✅ CHỈ CỘNG TIỀN
    wallet.balance += receiveAmount;
  

    // ✅ CẬP NHẬT SỔ
console.log('🔥 wallet.status before save:', wallet.status);
    saving.status = 'CANCELLED'; // hoặc 'MATURED' nếu bạn muốn
    saving.withdrawDate = now;
    await saving.save();

    console.log('✅ Withdraw success:', receiveAmount);

    return res.json({
      success: true,
      message,
      receiveAmount,
      walletBalanceAfter: wallet.balance
    });

  } catch (err) {
    console.error('❌ WITHDRAW SAVING ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};


module.exports = {
  createSaving,
  listSavings, withdrawSaving
};
