const Wallet=require('../models/wallet')

async function create_wallet(userData){
const userId = userData._id;
const walletCount = await Wallet.countDocuments({
    user_id: userId
  });
  if (walletCount >= 3) {
    const error = new Error('Bạn chỉ được tạo tối đa 3 ví. Vui lòng xoá bớt ví cũ.');
    error.statusCode = 400;
    throw error;
  }
	 const wallet=await Wallet.create({
	 	user_id:userData._id
	 })
	 return wallet;
}
module.exports = create_wallet;
