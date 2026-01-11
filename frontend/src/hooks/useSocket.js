// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

export const useSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect(token);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketService.on('new-notification', (data) => {
      console.log('🔔 New notification received:', data);
      setNotifications(prev => [data.notification, ...prev]);
      
      if (window.showNotificationToast) {
        window.showNotificationToast(data.notification);
      }
    });

    socketService.on('balance-updated', (data) => {
      console.log('💰 Balance updated:', data);
      setBalance(data.balance);
    });

    socketService.on('fund-updated', (data) => {
      console.log('📊 Fund updated:', data);
    });

    return () => {
      socketService.off('new-notification');
      socketService.off('balance-updated');
      socketService.off('fund-updated');
      socketService.disconnect();
    };
  }, [token]);

  return {
    isConnected,
    notifications,
    balance,
    socket: socketService
  };
};