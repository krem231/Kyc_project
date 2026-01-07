const Wallet = require('../models/wallet');
const mongoose = require('mongoose');
const new_wallet=require('../services/create_wallet')
const delete_wallet=require('../services/wallet_delete')
async function getWallets(req, res) {
  try {
    const userId = req.user.id;
    const wallets = await Wallet.find({
      user_id: userId   
    });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function createWallet(req, res) {
  try {
    const userData = { _id: req.user.id };

    const wallet = await new_wallet(userData);

    res.status(201).json({
      message: 'Tạo ví thành công',
      wallet
    });

  } catch (err) {
    res.status(err.statusCode || 400).json({
      message: err.message || 'Không thể tạo ví'
    });
  }
}
async function deleteWallet(req, res) {
  try {
    const walletId = req.params.id;
    const userId = req.user.id;

    const wallet = await Wallet.findOneAndDelete({
      _id: walletId,
      user_id: userId
    });

    if (!wallet) {
      return res.status(404).json({
        message: 'Ví không tồn tại hoặc không có quyền'
      });
    }

    res.json({
      message: 'Xoá ví thành công',
      walletId: wallet._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getWallets, createWallet,deleteWallet};
