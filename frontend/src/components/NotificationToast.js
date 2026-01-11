// src/components/NotificationToast.js
import React, { useEffect } from 'react';
import './Notification/NotificationToast.css';
const NotificationToast = ({ notification, onClose, duration = 5000 }) => {
  console.log('═══════════════════════════════════════');
  console.log('🍞 [Toast] Component rendered!');
  console.log('🍞 [Toast] Notification:', notification);
  console.log('═══════════════════════════════════════');

  useEffect(() => {
    console.log('⏰ [Toast] Setting auto-close timer:', duration, 'ms');
    
    const timer = setTimeout(() => {
      console.log('⏰ [Toast] Auto-closing');
      onClose();
    }, duration);

    return () => {
      console.log('🧹 [Toast] Clearing timer');
      clearTimeout(timer);
    };
  }, [duration, onClose]);

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

  if (!notification) {
    console.log('⚠️ [Toast] No notification data, not rendering');
    return null;
  }

  console.log('✅ [Toast] Rendering toast component');

  return React.createElement(
    'div',
    { 
      className: 'notification-toast',
      style: {
        // Inline styles để đảm bảo hiển thị
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: 'white',
        border: '2px solid #007bff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        zIndex: 999999,
        minWidth: '320px',
        maxWidth: '420px'
      }
    },
    React.createElement(
      'div',
      { className: 'toast-icon', style: { fontSize: '36px' } },
      getIcon(notification.type)
    ),
    React.createElement(
      'div',
      { className: 'toast-content', style: { flex: 1 } },
      React.createElement('h4', { style: { margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold' } }, notification.title),
      React.createElement('p', { style: { margin: '0 0 10px 0', fontSize: '14px' } }, notification.message),
      notification.amount !== 0 &&
        React.createElement(
          'span',
          {
            className: `toast-amount ${notification.amount > 0 ? 'positive' : 'negative'}`,
            style: {
              display: 'inline-block',
              fontSize: '15px',
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '4px',
              background: notification.amount > 0 ? '#d4edda' : '#f8d7da',
              color: notification.amount > 0 ? '#28a745' : '#dc3545'
            }
          },
          `${notification.amount > 0 ? '+' : ''}${notification.amount.toLocaleString('vi-VN')} VND`
        )
    ),
    React.createElement(
      'button',
      { 
        className: 'toast-close',
        style: {
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#f0f0f0',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          cursor: 'pointer',
          fontSize: '18px'
        },
        onClick: (e) => {
          e.stopPropagation();
          console.log('❌ [Toast] Closed by user');
          onClose();
        }
      },
      '✕'
    )
  );
};

export default NotificationToast;