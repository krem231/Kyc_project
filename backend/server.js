// server.js
const express = require('express');
const cors = require('cors');
const http = require('http');

const { connectDB } = require('./db');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const fundRoutes = require('./routes/fundRoutes');
const linkedBankRoutes = require('./routes/linkedBankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoute');
const transferRoutes = require('./routes/transferRoutes');
const walletLinkRoutes = require('./routes/walletLinkRoutes');
const savingRoutes = require('./routes/savingRoutes');
const web3 = require('./routes/web3Route');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // ← THÊM

const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  req.io = io;
  next();
});

connectDB();

app.use('/api', walletLinkRoutes);
app.use('/api', savingRoutes);
app.use('/api', userRoutes);
app.use('/api', walletRoutes);
app.use('/api', fundRoutes);
app.use('/api/link-bank', linkedBankRoutes);
app.use('/api/wallet', depositRoutes);
app.use('/api/', withdrawRoutes);
app.use('/api/wallet', transferRoutes);
app.use('/api/', web3);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes); // ← THÊM

server.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
  console.log('📡 Socket.IO ready for connections');
});