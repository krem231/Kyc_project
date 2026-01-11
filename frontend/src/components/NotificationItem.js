// src/components/NotificationItem.js
import React from 'react';
import './Notification/NotificationItem.css';

const NotificationItem = ({ notification }) => {
  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now - notifDate) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return notifDate.toLocaleDateString('vi-VN');
  };

  const getIcon = (type) => {
    const icons = {
      TRANSFER_SENT: '💸',
      TRANSFER_RECEIVED: '💰',
      DEPOSIT: '💳',
      WITHDRAW: '🏧',
      SAVINGS_DEPOSIT: '🏦',
      FUND_CONTRIBUTION: '🤝',
      SYSTEM: '📢'
    };
    return icons[type] || '🔔';
  };

  return React.createElement(
    'div',
    { className: `notification-item ${notification.isRead ? 'read' : 'unread'}` },
    React.createElement('div', { className: 'notif-icon' }, getIcon(notification.type)),
    React.createElement(
      'div',
      { className: 'notif-content' },
      React.createElement('h4', null, notification.title),
      React.createElement('p', null, notification.message),
      notification.amount !== 0 &&
        React.createElement(
          'span',
          { className: `notif-amount ${notification.amount > 0 ? 'positive' : 'negative'}` },
          `${notification.amount > 0 ? '+' : ''}${notification.amount.toLocaleString('vi-VN')} VND`
        ),
      React.createElement('span', { className: 'notif-time' }, formatTime(notification.createdAt))
    )
  );
};

export default NotificationItem;