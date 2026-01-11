// src/components/NotificationBell.js
import React, { useState, useEffect } from 'react';
import { useSocketContext } from '../socket/SocketContext';
import { notificationAPI } from '../services/notificationService';
import './Notification/NotificationBell.css';

const NotificationBell = ({ onOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { notifications } = useSocketContext();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    console.log('🔔 Bell - notifications changed:', notifications.length);
    if (notifications.length > 0) {
      setUnreadCount(prev => prev + 1);
    }
  }, [notifications]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return React.createElement(
    'div',
    { 
      className: 'notification-bell', 
      onClick: onOpen,
      style: { cursor: 'pointer', position: 'relative' }
    },
    React.createElement('span', { className: 'bell-icon' }, '🔔'),
    unreadCount > 0 && React.createElement(
      'span',
      { className: 'badge' },
      unreadCount > 99 ? '99+' : unreadCount
    )
  );
};

export default NotificationBell;