const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db'); // Import connectDB từ db.js
const routes = require('./routes'); // Import routes từ routes.js

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Kết nối DB
connectDB();

// Thêm log để chắc chắn routes được load
console.log('Routes loaded:', routes.stack.map(r => r.route).filter(Boolean));
// Attach routes
app.use('/', routes); // Attach tất cả routes từ routes.js

// Chạy server
app.listen(5000, () => console.log('Server running on port 5000'));