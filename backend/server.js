const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db'); 
const userRoutes = require('./routes/userRoutes');
const walletLinkRoutes = require('./routes/walletLinkRoutes');
const walletRoutes = require('./routes/walletRoutes');
const linkedBankRoutes = require('./routes/linkedBankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoute');
const transferRoutes = require('./routes/transferRoutes');
const app = express();

app.use(express.json());
app.use(cors());

// Kết nối DB
connectDB();

app.use('/api', userRoutes);
app.use('/api', walletRoutes);
app.use('/api', walletLinkRoutes);
app.use('/api/link-bank', linkedBankRoutes);
app.use('/api/wallet', depositRoutes); 
app.use('/api/', withdrawRoutes); 
app.use('/api/wallet', transferRoutes);

// Chạy server
app.listen(5000, () => console.log('Server running on port 5000'));