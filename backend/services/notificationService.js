// services/notificationService.js
const Notification = require('../models/Notification');

const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      amount: data.amount || 0,
      transactionId: data.transactionId,
      relatedUser: data.relatedUser,
      metadata: data.metadata || {}
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const createTransferNotifications = async (transferData, transactionId, io) => {
  console.log('\n═══════════════════════════════════════');
  console.log('📨 createTransferNotifications STARTED');
  console.log('═══════════════════════════════════════');
  
  const { senderId, receiverId, senderInfo, receiverInfo, amount } = transferData;

  try {
    // 1. Tạo thông báo cho người GỬI
    console.log('📝 Creating sender notification...');
    const senderNotification = await createNotification({
      userId: senderId,
      type: 'TRANSFER_SENT',
      title: '💸 Chuyển tiền thành công',
      message: `Bạn đã chuyển ${amount.toLocaleString('vi-VN')} VND cho ${receiverInfo.username}`,
      amount: -amount,
      transactionId,
      relatedUser: {
        userId: receiverId,
        username: receiverInfo.username,
        phone: receiverInfo.phone
      }
    });
    
    console.log('✅ Sender notification created:', senderNotification._id);

    // 2. Tạo thông báo cho người NHẬN
    console.log('📝 Creating receiver notification...');
    const receiverNotification = await createNotification({
      userId: receiverId,
      type: 'TRANSFER_RECEIVED',
      title: '💰 Nhận tiền thành công',
      message: `Bạn đã nhận ${amount.toLocaleString('vi-VN')} VND từ ${senderInfo.username}`,
      amount: amount,
      transactionId,
      relatedUser: {
        userId: senderId,
        username: senderInfo.username,
        phone: senderInfo.phone
      }
    });
    
    console.log('✅ Receiver notification created:', receiverNotification._id);

    // 3. Emit Socket.IO
    if (io) {
      const senderRoom = senderId.toString();
      const receiverRoom = receiverId.toString();
      
      console.log('\n📡 EMITTING SOCKET EVENTS:');
      console.log('   Sender room:', senderRoom);
      console.log('   Receiver room:', receiverRoom);
      
      // Emit to sender
      io.to(senderRoom).emit('new-notification', {
        notification: senderNotification.toObject(),
        balanceChange: -amount
      });
      console.log('   ✅ Emitted to sender');

      // Emit to receiver
      io.to(receiverRoom).emit('new-notification', {
        notification: receiverNotification.toObject(),
        balanceChange: amount
      });
      console.log('   ✅ Emitted to receiver');
      
      console.log('═══════════════════════════════════════');
      console.log('✅✅✅ NOTIFICATIONS SENT SUCCESSFULLY');
      console.log('═══════════════════════════════════════\n');
    } else {
      console.error('❌ IO is null - cannot emit notifications');
    }

    return {
      senderNotification,
      receiverNotification
    };
  } catch (error) {
    console.error('❌ Error in createTransferNotifications:', error);
    throw error;
  }
};

const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, skip = 0, unreadOnly = false } = options;

  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return { notifications, total, unreadCount };
};

const markAsRead = async (notificationIds, userId) => {
  await Notification.updateMany(
    { _id: { $in: notificationIds }, userId },
    { $set: { isRead: true } }
  );
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

const deleteNotification = async (notificationId, userId) => {
  await Notification.deleteOne({ _id: notificationId, userId });
};

module.exports = {
  createNotification,
  createTransferNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};