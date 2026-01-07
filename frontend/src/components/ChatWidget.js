// src/components/ChatWidget.js - Fixed: Chỉ tạo request khi gửi tin nhắn đầu tiên
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../styles/ChatWidget.css';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatRequest, setChatRequest] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';
  const SOCKET_URL = 'http://localhost:5000';

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true // TỰ ĐỘNG CONNECT để nhận tin nhắn ngay
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Setup socket event listeners (separate from initialization)
  useEffect(() => {
    if (!socket) return;

    const handleChatAccepted = (data) => {
      console.log('📩 Chat accepted:', data);
      setIsConnected(true);
      addSystemMessage(`${data.admin.username} đã tham gia hỗ trợ bạn`);
    };

    const handleNewMessage = (data) => {
      console.log('📩 New message received:', data);
      // Luôn thêm tin nhắn mới vào, không cần check requestId
      // vì user chỉ có 1 chat active tại 1 thời điểm
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleUserTyping = (data) => {
      console.log('⌨️ User typing:', data);
      if (data.role === 'admin') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleChatClosed = (data) => {
      console.log('🔒 Chat closed:', data);
      addSystemMessage('Cuộc trò chuyện đã kết thúc');
      setIsConnected(false);
    };

    // Register event listeners
    socket.on('chat-accepted', handleChatAccepted);
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('chat-closed', handleChatClosed);

    // Cleanup
    return () => {
      socket.off('chat-accepted', handleChatAccepted);
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('chat-closed', handleChatClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Load existing chat when open widget
  useEffect(() => {
    if (isOpen) {
      loadExistingChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Join chat room when chatRequest is set
  useEffect(() => {
    if (chatRequest && socket && socket.connected) {
      console.log('🚪 Joining chat room:', chatRequest._id);
      socket.emit('join-chat', { requestId: chatRequest._id });
    }
  }, [chatRequest, socket]);

  const loadExistingChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Tìm chat đang active (pending hoặc connected)
        const activeChat = data.data.find(
          chat => chat.status === 'pending' || chat.status === 'connected'
        );
        
        if (activeChat) {
          setChatRequest(activeChat);
          setMessages(activeChat.messages || []);
          setIsConnected(activeChat.status === 'connected');
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const createChatRequest = async () => {
    if (isCreatingRequest) return; // Prevent double creation
    
    try {
      setIsCreatingRequest(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChatRequest(data.data);
        setMessages(data.data.messages || []);
        addSystemMessage('Đang chờ admin hỗ trợ...');
        
        // Connect socket và join room
        if (socket && !socket.connected) {
          socket.connect();
        }
        
        return data.data;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      addSystemMessage('⚠️ Không thể tạo yêu cầu hỗ trợ. Vui lòng thử lại.');
      return null;
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Nếu chưa có chatRequest, tạo mới trước
    let currentRequest = chatRequest;
    if (!currentRequest) {
      currentRequest = await createChatRequest();
      if (!currentRequest) {
        // Nếu không tạo được request, dừng lại
        return;
      }
    }

    // Lưu tin nhắn tạm thời vào state ngay lập tức (optimistic update)
    const tempMessage = {
      text: inputText,
      senderRole: 'user',
      timestamp: new Date(),
      _id: 'temp-' + Date.now()
    };
    setMessages(prev => [...prev, tempMessage]);
    const messageText = inputText;
    setInputText(''); // Clear input ngay

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chat/${currentRequest._id}/message`,
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
        // Replace temp message với real message từ server
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id ? data.data : msg
          )
        );
      } else {
        // Nếu lỗi, xóa temp message
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        addSystemMessage('⚠️ Không thể gửi tin nhắn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Xóa temp message khi lỗi
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      addSystemMessage('⚠️ Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleTyping = () => {
    if (socket && socket.connected && chatRequest) {
      socket.emit('typing', { requestId: chatRequest._id });
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { requestId: chatRequest._id });
      }, 1000);
    }
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      text,
      isSystem: true,
      timestamp: new Date()
    }]);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // KHÔNG tạo request ở đây nữa, chỉ mở/đóng widget
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-widget-button ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && messages.length > 0 && (
          <span className="chat-badge">{messages.length}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget-window">
          {/* Header */}
          <div className="chat-widget-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <span>🎧</span>
              </div>
              <div>
                <h3>Hỗ trợ khách hàng</h3>
                <p className="chat-status">
                  {isConnected ? (
                    <><span className="status-dot online"></span> Đang online</>
                  ) : chatRequest ? (
                    <><span className="status-dot waiting"></span> Đang chờ...</> 
                  ) : (
                    <><span className="status-dot offline"></span> Gửi tin nhắn để bắt đầu</>
                  )}
                </p>
              </div>
            </div>
            <button 
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-widget-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-empty-icon">💬</span>
                <h3>Chào mừng bạn!</h3>
                <p>Chúng tôi có thể giúp gì cho bạn?</p>
                <p className="chat-hint">💡 Gửi tin nhắn để được hỗ trợ</p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      msg.isSystem
                        ? 'system'
                        : msg.senderRole === 'admin'
                        ? 'received'
                        : 'sent'
                    }`}
                  >
                    {!msg.isSystem && msg.senderRole === 'admin' && (
                      <div className="message-avatar">👨‍💼</div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                      <div className="message-time">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="chat-message received">
                    <div className="message-avatar">👨‍💼</div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-widget-input">
            <input
              type="text"
              placeholder={
                isCreatingRequest 
                  ? "Đang tạo yêu cầu..." 
                  : "Nhập tin nhắn..."
              }
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={isCreatingRequest}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!inputText.trim() || isCreatingRequest}
            >
              {isCreatingRequest ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;