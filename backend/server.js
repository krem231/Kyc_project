const express = require('express');
const cors = require('cors');
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
const app = express();
app.use(express.json());
app.use(cors());
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
app.listen(5000, () => console.log('Server running on port 5000'));