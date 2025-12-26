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
    const userData = {
      _id: req.user.id
    };
    const wallet = await new_wallet(userData);
    res.status(201).json({
      message: 'Wallet created successfully',
      
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
}
async function deleteWallet(req, res){
  try{
    const userData={_id: req.user.id};
    const wallet= await delete_wallet(userData);
    res.status(201).json({
      message: 'wallet delete!'

    })
  }catch(err){
    res.status(400).json({
      err: err.message
    });
  }
}

module.exports = { getWallets, createWallet,deleteWallet};
