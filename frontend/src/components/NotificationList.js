// src/components/NotificationList.js
import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/notificationService';
import NotificationItem from './NotificationItem';
import './Notification/NotificationList.css';

const NotificationList = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications({ limit: 50 });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return React.createElement(
    'div',
    { className: 'notification-overlay', onClick: onClose },
    React.createElement(
      'div',
      { className: 'notification-panel', onClick: (e) => e.stopPropagation() },
      React.createElement(
        'div',
        { className: 'notification-header' },
        React.createElement('h3', null, 'Thông báo'),
        React.createElement('button', { className: 'close-btn', onClick: onClose }, '✕')
      ),
      React.createElement(
        'div',
        { className: 'notification-list' },
        loading
          ? React.createElement('div', { className: 'loading' }, 'Đang tải...')
          : notifications.length === 0
          ? React.createElement('div', { className: 'empty' }, 'Không có thông báo')
          : notifications.map(notif =>
              React.createElement(NotificationItem, {
                key: notif._id,
                notification: notif
              })
            )
      )
    )
  );
};

export default NotificationList;