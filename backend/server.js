require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');

const { connectDB } = require('./db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const fundRoutes = require('./routes/fundRoutes');
const linkedBankRoutes = require('./routes/linkedBankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoute');
const transferRoutes = require('./routes/transferRoutes');
const walletLinkRoutes = require('./routes/walletLinkRoutes');
const savingRoutes = require('./routes/savingRoutes');
const web3Routes = require('./routes/web3Route');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Kết nối DB
connectDB();

// Routes
app.use('/api', walletLinkRoutes);
app.use('/api', savingRoutes);
app.use('/api', userRoutes);
app.use('/api', walletRoutes);
app.use('/api', fundRoutes);
app.use('/api/link-bank', linkedBankRoutes);
app.use('/api/wallet', depositRoutes);
app.use('/api', withdrawRoutes);
app.use('/api/wallet', transferRoutes);
app.use('/api', web3Routes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message 
  });
});

// Chạy server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📡 Socket.IO ready for connections');
});