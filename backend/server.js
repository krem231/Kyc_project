const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db'); // Import connectDB từ db.js
const userRoutes = require('./routes/userRoutes'); // Import routes mới

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Kết nối DB
connectDB();

// Attach routes với prefix '/api' để tạo API riêng (ví dụ: /api/register)
app.use('/api', userRoutes);

// Thêm log để chắc chắn routes được load
console.log('Routes loaded:', userRoutes.stack.map(r => r.route).filter(Boolean));

// Chạy server
app.listen(5000, () => console.log('Server running on port 5000'));