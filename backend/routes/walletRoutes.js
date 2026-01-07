const express = require('express');
const { getWallets, createWallet,deleteWallet } = require('../controllers/wallet_controller');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/wallets', auth, getWallets);
router.post('/wallets', auth,createWallet);
router.delete('/wallets/:id',auth, deleteWallet);

module.exports = router;
