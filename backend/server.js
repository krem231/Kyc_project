const express = require('express');
const http = require('http'); // ← THÊM
const cors = require('cors');
const { connectDB } = require('./config/db'); 
const userRoutes = require('./routes/userRoutes');
const walletLinkRoutes = require('./routes/walletLinkRoutes');
const walletRoutes = require('./routes/walletRoutes');
const linkedBankRoutes = require('./routes/linkedBankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoute');
const transferRoutes = require('./routes/transferRoutes');
const transactionHistoryRoutes = require('./routes/transactionHistoryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app); // ← THÊM: Tạo HTTP server
const io = initializeSocket(server);   // ← Bây giờ mới gọi initializeSocket

// Middleware
app.use(express.json());
app.use(cors());

// Middleware để attach io vào request (để controller có thể emit events)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Kết nối DB
connectDB();

// Routes
app.use('/api', userRoutes);
app.use('/api', walletRoutes);
app.use('/api', walletLinkRoutes);
app.use('/api/link-bank', linkedBankRoutes);
app.use('/api/wallet', depositRoutes); 
app.use('/api/', withdrawRoutes); 
app.use('/api/wallet', transferRoutes);
app.use('/api/transactions', transactionHistoryRoutes);
app.use('/api/chat', chatRoutes);

// Chạy server với Socket.IO
server.listen(5000, () => {  // ← THAY ĐỔI: server.listen thay vì app.listen
  console.log('🚀 Server running on port 5000');
  console.log('📡 Socket.IO ready for connections');
});