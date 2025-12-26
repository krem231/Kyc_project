const Wallet=require('../models/wallet')

async function create_wallet(userData){

	 const wallet=await Wallet.create({
	 	user_id:userData._id
	 })
	 return wallet;
}
module.exports = create_wallet;
