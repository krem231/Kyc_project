// src/socket/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    console.log('🚀 [SocketProvider] Mounting...');
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    console.log('🔑 Token found:', !!token);
    console.log('🔑 UserId found:', userId);
    
    if (!token) {
      console.log('⚠️ No token, skipping socket');
      return;
    }

    console.log('🔌 Creating socket connection...');
    
    const socketInstance = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('✅✅✅ SOCKET CONNECTED:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
      
      if (error.message.includes('Invalid token')) {
        console.error('🔴 Token invalid - user needs to login again');
      }
    });

    socketInstance.on('new-notification', (data) => {
      console.log('\n');
      console.log('╔═══════════════════════════════════════╗');
      console.log('🔔 NOTIFICATION EVENT FIRED!');
      console.log('╚═══════════════════════════════════════╝');
      console.log('Data received:', data);
      console.log('Notification object:', data.notification);
      console.log('Title:', data.notification?.title);
      console.log('Message:', data.notification?.message);
      console.log('Amount:', data.notification?.amount);
      console.log('Type:', data.notification?.type);
      console.log('╚═══════════════════════════════════════╝');
      console.log('\n');
      
      setNotifications(prevNotifs => {
        const newNotifs = [data.notification, ...prevNotifs];
        console.log('📝 Notifications updated. New count:', newNotifs.length);
        console.log('📝 Latest notification:', data.notification);
        return newNotifs;
      });
      
      try {
        window.dispatchEvent(new CustomEvent('new-notification', { 
          detail: data.notification 
        }));
        console.log('✅ Custom event dispatched');
      } catch (err) {
        console.error('Error dispatching event:', err);
      }
    });

    socketInstance.on('balance-updated', (data) => {
      console.log('💰 Balance updated:', data);
      setBalance(data.balance);
    });

    setSocket(socketInstance);
    console.log('✅ Socket instance saved to state');

    return () => {
      console.log('🧹 Cleaning up socket...');
      if (socketInstance) {
        socketInstance.off('new-notification');
        socketInstance.off('balance-updated');
        socketInstance.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    setNotifications,
    balance,
    setBalance
  };

  console.log('🔄 SocketProvider rendering. Notifications count:', notifications.length);

  return React.createElement(
    SocketContext.Provider,
    { value },
    children
  );
};

export default SocketContext;