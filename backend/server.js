require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const userRoutes = require('./routes/admin/user.route');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Kết nối DB
connectDB();

// Routes
app.use('/api', userRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});