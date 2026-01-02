const createFund = require('../services/create_fund');
const Fund = require('../models/Fund');

async function createFundController(req, res) {
  console.log('BODY:', req.body);
  console.log('USER:', req.user);

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Chưa xác thực người dùng'
      });
    }

    const ownerId = req.user.id;
    const { fundName, friendId } = req.body;

    if (!fundName || !friendId) {
      return res.status(400).json({
        error: 'Thiếu tên quỹ hoặc người tham gia'
      });
    }

    const fund = await createFund({
      ownerId,
      fundName,
      friendId
    });

    return res.status(201).json({
      message: 'Tạo quỹ chung thành công',
      fund
    });

  } catch (err) {
    console.error('CREATE FUND ERROR:', err);
    return res.status(400).json({
      error: err.message
    });
  }
}
async function getFundsController(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Chưa xác thực người dùng'
      });
    }

    const userId = req.user.id;

    console.log('GET FUNDS - USER ID:', userId);

    const funds = await Fund.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).sort({ create_at: -1 });

    console.log('FUNDS FOUND:', funds.length);

    return res.json({
      success: true,
      data: funds
    });

  } catch (err) {
    console.error('GET FUNDS ERROR:', err);
    return res.status(500).json({
      error: 'Lỗi server'
    });
  }
}
module.exports = { createFundController,getFundsController };
