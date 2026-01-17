import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSocketContext } from './socket/SocketContext';
import './App.css';

// Components
import NotificationBell from './components/NotificationBell';
import NotificationList from './components/NotificationList';
import NotificationToast from './components/NotificationToast';
import ChatWidget from './components/ChatWidget';

// Pages
import Register from './components/pages/users/Register';
import Login from './components/pages/users/Login';
import VerifyOTP from './components/pages/users/VerifyOTP';

import Welcome from './components/Welcome';
import Choose from './components/pages/admin/Choose';
import LinkBank from './components/pages/users/LinkBank';
import Saving from './components/pages/users/Saving';
import FundList from './components/pages/users/fundList';
import Admin from './components/pages/admin/Admin';
import TransactionHistory from './components/pages/users/TransactionHistory';

function App() {
  console.log('📄 [App] Component rendering...');
  
  const location = useLocation();
  const currentPath = location.pathname;

  const { isConnected, notifications, balance } = useSocketContext();
  
  console.log('📡 [App] Socket connected:', isConnected);
  console.log('📡 [App] Notifications count:', notifications.length);
  console.log('📡 [App] Balance:', balance);
  
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log('🎯 [App useEffect] Triggered!');
    console.log('Notifications array:', notifications);
    console.log('Notifications length:', notifications.length);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
    
    if (notifications.length > 0) {
      const latest = notifications[0];
      console.log('✅ [App] Setting toast with latest notification:', latest);
      
      setToastNotification(latest);
      
      const timer = setTimeout(() => {
        console.log('⏰ [App] Auto-hiding toast');
        setToastNotification(null);
      }, 6000);
      
      return () => {
        console.log('🧹 [App] Clearing auto-hide timer');
        clearTimeout(timer);
      };
    }
  }, [notifications]);

  const publicPaths = ['/login', '/register', '/verify-otp', '/choose', '/admin', '/'];
  const showMainLayout = !publicPaths.includes(currentPath);

  console.log('🔌 [App] Current toast notification:', toastNotification);
  console.log('🔌 [App] Should show toast:', !!toastNotification);

  return (
    <div className="app">
      {showMainLayout && (
        <header className="app-header">
          <h1>My Wallet App</h1>
          <div className="header-right">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </div>

            {balance !== null && (
              <div className="balance-display">
                💰 {balance.toLocaleString('vi-VN')} VND
              </div>
            )}

            <NotificationBell onOpen={() => setShowNotificationPanel(true)} />
          </div>
        </header>
      )}

      <main className={showMainLayout ? 'app-content' : ''}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/choose" element={<Choose />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/link-bank" element={<LinkBank />} />
          <Route path="/saving" element={<Saving />} />
          <Route path="/funds" element={<FundList />} />
          <Route path="/history" element={<TransactionHistory />} />
        </Routes>
      </main>

      {showMainLayout && <ChatWidget />}
      
      <NotificationList
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />
      
      {toastNotification ? (
        <>
          {console.log('🎨 [App] Rendering NotificationToast component')}
          <NotificationToast
            notification={toastNotification}
            onClose={() => {
              console.log('❌ [App] Toast closed by user');
              setToastNotification(null);
            }}
          />
        </>
      ) : (
        console.log('⚠️ [App] No toast to render')
      )}
    </div>
  );
}

export default App;