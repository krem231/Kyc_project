const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db'); 
const userRoutes = require('./routes/userRoutes'); 
const walletRoutes = require('./routes/walletRoutes'); 
const fundRoutes = require('./routes/fundRoutes');

const app = express();
app.use(express.json());
app.use(cors());
connectDB();
app.use('/api', userRoutes);
console.log('Routes loaded:', userRoutes.stack.map(r => r.route).filter(Boolean));
app.use('/api', walletRoutes);
app.use('/api', fundRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));