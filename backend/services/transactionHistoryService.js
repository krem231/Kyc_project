// services/transactionHistoryService.js
const Transaction = require('../models/Transaction');

/**
 * Lấy lịch sử tất cả giao dịch chuyển tiền (gửi + nhận)
 */
const getTransferHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Tìm tất cả giao dịch mà user là người gửi HOẶC người nhận
  const transactions = await Transaction.find({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ],
    type: 'TRANSFER',
    status: { $in: ['SUCCESS', 'PENDING', 'FAILED'] }
  })
    .populate('senderId', 'username phone email')
    .populate('receiverId', 'username phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Thêm lean() để tăng performance

  const total = await Transaction.countDocuments({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ],
    type: 'TRANSFER'
  });

  // Transform data để thêm thông tin role
  // CRITICAL FIX: Filter out transactions with null references
  const transformedTransactions = transactions
    .filter(tx => tx.senderId && tx.receiverId) // Lọc bỏ transactions có null references
    .map(tx => {
      const isSender = tx.senderId._id.toString() === userId.toString();
      
      return {
        id: tx._id,
        transactionId: tx.transactionId,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        
        // Thông tin vai trò
        role: isSender ? 'SENDER' : 'RECEIVER',
        direction: isSender ? 'OUT' : 'IN',
        
        // Thông tin người gửi
        sender: {
          id: tx.senderId._id,
          username: tx.senderId.username || 'Unknown',
          phone: tx.senderId.phone || '',
          email: tx.senderId.email || ''
        },
        
        // Thông tin người nhận
        receiver: {
          id: tx.receiverId._id,
          username: tx.receiverId.username || 'Unknown',
          phone: tx.receiverId.phone || '',
          email: tx.receiverId.email || ''
        },
        
        // Thông tin đối tác giao dịch (người còn lại)
        counterparty: isSender ? {
          id: tx.receiverId._id,
          username: tx.receiverId.username || 'Unknown',
          phone: tx.receiverId.phone || '',
          label: 'Người nhận'
        } : {
          id: tx.senderId._id,
          username: tx.senderId.username || 'Unknown',
          phone: tx.senderId.phone || '',
          label: 'Người gửi'
        },
        
        // Metadata bổ sung
        metadata: tx.metadata || {}
      };
    });

  return {
    transactions: transformedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Lấy lịch sử giao dịch GỬI tiền (người dùng là sender)
 */
const getSentTransfers = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({
    senderId: userId,
    type: 'TRANSFER'
  })
    .populate('receiverId', 'username phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments({
    senderId: userId,
    type: 'TRANSFER'
  });

  // CRITICAL FIX: Filter out transactions with null receiver
  const transformedTransactions = transactions
    .filter(tx => tx.receiverId) // Lọc bỏ receiver null
    .map(tx => ({
      id: tx._id,
      transactionId: tx.transactionId,
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt,
      role: 'SENDER',
      direction: 'OUT',
      receiver: {
        id: tx.receiverId._id,
        username: tx.receiverId.username || 'Unknown',
        phone: tx.receiverId.phone || '',
        email: tx.receiverId.email || ''
      },
      metadata: tx.metadata || {}
    }));

  return {
    transactions: transformedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Lấy lịch sử giao dịch NHẬN tiền (người dùng là receiver)
 */
const getReceivedTransfers = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({
    receiverId: userId,
    type: 'TRANSFER'
  })
    .populate('senderId', 'username phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments({
    receiverId: userId,
    type: 'TRANSFER'
  });

  // CRITICAL FIX: Filter out transactions with null sender
  const transformedTransactions = transactions
    .filter(tx => tx.senderId) // Lọc bỏ sender null
    .map(tx => ({
      id: tx._id,
      transactionId: tx.transactionId,
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt,
      role: 'RECEIVER',
      direction: 'IN',
      sender: {
        id: tx.senderId._id,
        username: tx.senderId.username || 'Unknown',
        phone: tx.senderId.phone || '',
        email: tx.senderId.email || ''
      },
      metadata: tx.metadata || {}
    }));

  return {
    transactions: transformedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Lấy thống kê giao dịch
 */
const getTransactionStats = async (userId) => {
  try {
    // Tổng số giao dịch
    const totalTransactions = await Transaction.countDocuments({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      type: 'TRANSFER'
    });

    // Số giao dịch đã gửi
    const sentCount = await Transaction.countDocuments({
      senderId: userId,
      type: 'TRANSFER',
      status: 'SUCCESS'
    });

    // Số giao dịch đã nhận
    const receivedCount = await Transaction.countDocuments({
      receiverId: userId,
      type: 'TRANSFER',
      status: 'SUCCESS'
    });

    // Tổng tiền đã gửi
    const sentAmountResult = await Transaction.aggregate([
      {
        $match: {
          senderId: userId,
          type: 'TRANSFER',
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Tổng tiền đã nhận
    const receivedAmountResult = await Transaction.aggregate([
      {
        $match: {
          receiverId: userId,
          type: 'TRANSFER',
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Giao dịch thất bại
    const failedCount = await Transaction.countDocuments({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      type: 'TRANSFER',
      status: 'FAILED'
    });

    // Giao dịch đang chờ
    const pendingCount = await Transaction.countDocuments({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      type: 'TRANSFER',
      status: 'PENDING'
    });

    return {
      total: totalTransactions,
      sent: {
        count: sentCount,
        amount: sentAmountResult[0]?.total || 0
      },
      received: {
        count: receivedCount,
        amount: receivedAmountResult[0]?.total || 0
      },
      failed: failedCount,
      pending: pendingCount
    };
  } catch (error) {
    console.error('Error in getTransactionStats:', error);
    throw new Error('Không thể lấy thống kê giao dịch');
  }
};

/**
 * Lấy chi tiết 1 giao dịch
 */
const getTransactionDetail = async (userId, transactionId) => {
  try {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .populate('senderId', 'username phone email')
      .populate('receiverId', 'username phone email')
      .lean();

    if (!transaction) {
      throw new Error('Không tìm thấy giao dịch hoặc bạn không có quyền xem');
    }

    // CRITICAL FIX: Check for null references
    if (!transaction.senderId || !transaction.receiverId) {
      throw new Error('Dữ liệu giao dịch không hợp lệ');
    }

    const isSender = transaction.senderId._id.toString() === userId.toString();

    return {
      id: transaction._id,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      
      role: isSender ? 'SENDER' : 'RECEIVER',
      direction: isSender ? 'OUT' : 'IN',
      
      sender: {
        id: transaction.senderId._id,
        username: transaction.senderId.username || 'Unknown',
        phone: transaction.senderId.phone || '',
        email: transaction.senderId.email || ''
      },
      
      receiver: {
        id: transaction.receiverId._id,
        username: transaction.receiverId.username || 'Unknown',
        phone: transaction.receiverId.phone || '',
        email: transaction.receiverId.email || ''
      },
      
      metadata: transaction.metadata || {}
    };
  } catch (error) {
    console.error('Error in getTransactionDetail:', error);
    throw error;
  }
};

module.exports = {
  getTransferHistory,
  getSentTransfers,
  getReceivedTransfers,
  getTransactionStats,
  getTransactionDetail
};