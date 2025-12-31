// src/pages/admin/Admin.js - Fixed Real-time Updates
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../../../styles/Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connectedChats, setConnectedChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';
  const SOCKET_URL = 'http://localhost:5000';

  // Initialize socket - AUTO CONNECT
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true // TỰ ĐỘNG CONNECT
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Admin socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Admin socket error:', error);
    });

    setSocket(newSocket);

    // Load initial data
    fetchPendingRequests();
    fetchConnectedChats();

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Xử lý request mới từ user
    const handleNewChatRequest = (data) => {
      console.log('🔔 New chat request:', data);
      fetchPendingRequests(); // Refresh danh sách
      showNotification(`${data.user.username} cần hỗ trợ!`);
    };

    // Xử lý tin nhắn mới
    const handleNewMessage = (data) => {
      console.log('📩 Admin received new message:', data);
      
      // Nếu đang xem chat này, thêm tin nhắn vào
      if (selectedChat && data.requestId === selectedChat._id) {
        setMessages(prev => {
          // Tránh duplicate bằng cách check _id VÀ text VÀ timestamp
          const isDuplicate = prev.some(m => 
            m._id === data.message._id || 
            (m.text === data.message.text && 
             Math.abs(new Date(m.timestamp) - new Date(data.message.timestamp)) < 1000)
          );
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }
          
          return [...prev, data.message];
        });
      }
      
      // Cập nhật last message trong danh sách connected chats
      setConnectedChats(prev => 
        prev.map(chat => 
          chat._id === data.requestId 
            ? { ...chat, messages: [...(chat.messages || []), data.message] }
            : chat
        )
      );
    };

    // Xử lý khi request được accept bởi admin khác
    const handleRequestAccepted = (data) => {
      console.log('✅ Request accepted by another admin:', data);
      // Remove từ pending list
      setPendingRequests(prev => 
        prev.filter(req => req._id !== data.requestId)
      );
    };

    // Xử lý typing indicator
    const handleUserTyping = (data) => {
      console.log('⌨️ User typing:', data);
      // TODO: Implement typing indicator UI
    };

    // Xử lý chat closed
    const handleChatClosed = (data) => {
      console.log('🔒 Chat closed:', data);
      fetchConnectedChats(); // Refresh danh sách
      if (selectedChat && data.requestId === selectedChat._id) {
        setSelectedChat(null);
        setMessages([]);
      }
    };

    // Register listeners
    socket.on('new-chat-request', handleNewChatRequest);
    socket.on('new-message', handleNewMessage);
    socket.on('request-accepted', handleRequestAccepted);
    socket.on('user-typing', handleUserTyping);
    socket.on('chat-closed', handleChatClosed);

    // Cleanup
    return () => {
      socket.off('new-chat-request', handleNewChatRequest);
      socket.off('new-message', handleNewMessage);
      socket.off('request-accepted', handleRequestAccepted);
      socket.off('user-typing', handleUserTyping);
      socket.off('chat-closed', handleChatClosed);
    };
  }, [socket, selectedChat]);

  // Join room when selecting a chat
  useEffect(() => {
    if (selectedChat && socket && socket.connected) {
      console.log('🚪 Admin joining chat room:', selectedChat._id);
      socket.emit('join-chat', { requestId: selectedChat._id });
    }
  }, [selectedChat, socket]);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending:', error);
    }
  };

  const fetchConnectedChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/connected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConnectedChats(data.data);
      }
    } catch (error) {
      console.error('Error fetching connected:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Request accepted:', data.data);
        
        // Remove từ pending
        setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        
        // Thêm vào connected chats ngay lập tức
        const acceptedChat = data.data;
        setConnectedChats(prev => [acceptedChat, ...prev]);
        
        // Select chat này
        setSelectedChat(acceptedChat);
        setMessages(acceptedChat.messages || []);
        
        // Join socket room
        if (socket && socket.connected) {
          socket.emit('join-chat', { requestId: acceptedChat._id });
        }
      } else {
        alert(data.message || 'Không thể chấp nhận request');
      }
    } catch (error) {
      console.error('Error accepting:', error);
      alert('Lỗi khi chấp nhận request: ' + error.message);
    }
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/${chat._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;

    const messageText = inputText.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Optimistic update - Hiện tin nhắn ngay
    const tempMessage = {
      _id: tempId,
      text: messageText,
      senderRole: 'admin',
      timestamp: new Date(),
      isTemp: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setInputText(''); // Clear ngay

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chat/${selectedChat._id}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: messageText })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Replace temp message với real message
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? { ...data.data, isTemp: false } : msg
          )
        );
      } else {
        // Remove temp message nếu lỗi
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        alert('Không thể gửi tin nhắn');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      alert('Lỗi khi gửi tin nhắn');
    }
  };

  const handleCloseChat = async (chatId) => {
    if (!window.confirm('Bạn có chắc muốn kết thúc chat này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/chat/${chatId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      fetchConnectedChats();
      setSelectedChat(null);
      setMessages([]);
    } catch (error) {
      console.error('Error closing chat:', error);
      alert('Lỗi khi đóng chat');
    }
  };

  const showNotification = (message) => {
    // Request permission nếu chưa có
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Yêu cầu hỗ trợ mới', {
        body: message,
        icon: '/icon.png'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>🎧 Admin Chat Dashboard</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/welcome')} className="btn-secondary">
            Vào trang thường
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Sidebar */}
        <div className="admin-sidebar">
          {/* Pending Requests */}
          <div className="requests-section">
            <h3>
              🔔 Yêu cầu chờ ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="empty-message">Không có yêu cầu mới</p>
            ) : (
              <div className="requests-list">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-info">
                      <div className="user-avatar">👤</div>
                      <div>
                        <h4>{request.userId.username}</h4>
                        <p className="user-email">{request.userId.email}</p>
                        <p className="request-time">
                          {new Date(request.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="btn-accept"
                    >
                      Chấp nhận
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connected Chats */}
          <div className="connected-section">
            <h3>
              💬 Đang chat ({connectedChats.length})
            </h3>
            {connectedChats.length === 0 ? (
              <p className="empty-message">Chưa có chat nào</p>
            ) : (
              <div className="chat-list">
                {connectedChats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="user-avatar">👤</div>
                    <div className="chat-info">
                      <h4>{chat.userId.username}</h4>
                      <p className="last-message">
                        {chat.messages && chat.messages.length > 0
                          ? chat.messages[chat.messages.length - 1].text.substring(0, 30) + '...'
                          : 'Bắt đầu chat...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="admin-chat-window">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-window-header">
                <div className="chat-user-info">
                  <div className="user-avatar-large">👤</div>
                  <div>
                    <h3>{selectedChat.userId.username}</h3>
                    <p>{selectedChat.userId.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCloseChat(selectedChat._id)}
                  className="btn-close-chat"
                >
                  Kết thúc
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div
                    key={msg._id || `msg-${index}-${msg.timestamp}`}
                    className={`message ${
                      msg.isSystem
                        ? 'system'
                        : msg.senderRole === 'admin'
                        ? 'admin'
                        : 'user'
                    }`}
                  >
                    {!msg.isSystem && msg.senderRole === 'user' && (
                      <div className="message-avatar">👤</div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  onClick={handleSendMessage}
                  className="btn-send"
                  disabled={!inputText.trim()}
                >
                  Gửi
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <span className="icon">💬</span>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Hoặc chấp nhận yêu cầu mới từ danh sách bên trái</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;