import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Socket Context Provider (if available)
let SocketProvider = ({ children }) => children;

try {
  const { SocketProvider: SP } = require('./socket/SocketContext');
  SocketProvider = SP;
} catch (error) {
  console.warn('SocketContext not available:', error.message);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // ✅ KHÔNG dùng React.StrictMode - nó gây mount 2 lần
  <BrowserRouter>
    <SocketProvider>
      <App />
    </SocketProvider>
  </BrowserRouter>
);