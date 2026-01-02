const Fund = require('../models/Fund');
const User = require('../models/User');
const mongoose = require('mongoose');

async function createFund({ ownerId, fundName, friendId }) {
  if (!ownerId || !friendId || !fundName) {
    throw new Error('Thiếu dữ liệu tạo quỹ');
  }

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    throw new Error('ID người tham gia không hợp lệ');
  }

  if (ownerId.toString() === friendId.toString()) {
    throw new Error('Không được tạo quỹ với chính mình');
  }

  const friend = await User.findById(friendId);
  if (!friend) {
    throw new Error('Không tìm thấy người tham gia');
  }

  const fund = await Fund.create({
    owner: ownerId,                 
    members: [ownerId, friendId],   
    balance: 0,
    name: fundName                  
  });

  return fund;
}

module.exports = createFund;
