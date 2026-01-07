
const express = require('express');
const cors = require('cors');
const http = require('http'); // ← THÊM

const { connectDB } = require('./db'); 
const userRoutes = require('./routes/userRoutes'); 
const walletRoutes = require('./routes/walletRoutes'); 
const fundRoutes = require('./routes/fundRoutes');
const linkedBankRoutes = require('./routes/linkedBankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoute');
const transferRoutes = require('./routes/transferRoutes');
const walletLinkRoutes = require('./routes/walletLinkRoutes');
const savingRoutes=require('./routes/savingRoutes')
const web3=require('./routes/web3Route')
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./socket');
const app = express();
const server = http.createServer(app); // ← THÊM: Tạo HTTP server
const io = initializeSocket(server);
app.use(express.json());
app.use(cors());
// Middleware để attach io vào request (để controller có thể emit events)
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
app.use('api/',web3);
app.use('/api/chat', chatRoutes);

// Chạy server với Socket.IO
server.listen(5000, () => {  // ← THAY ĐỔI: server.listen thay vì app.listen
  console.log('🚀 Server running on port 5000');
  console.log('📡 Socket.IO ready for connections');
});