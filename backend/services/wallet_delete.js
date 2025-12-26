const Wallet=require('../models/wallet')

async function del_wallet(walletID){
	const wallet=await Wallet.findOneAndDelete({walletID})
	await wallet.save();
	return wallet();
}