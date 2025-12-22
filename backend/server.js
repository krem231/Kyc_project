const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Joi = require('joi');

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối MongoDB
const mongoURI = 'mongodb+srv://luan11t90_db_user:mmbvl123456@cluster0.oaqzcwv.mongodb.net/kyc_pm';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// Model User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  idCard: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' } // Thêm role
});
const User = mongoose.model('User', userSchema);

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^0\d{9}$/).required().messages({ 'string.pattern.base': 'SĐT phải 10 số bắt đầu bằng 0' }),
  idCard: Joi.string().length(12).pattern(/^\d+$/).required().messages({ 'string.length': 'CCCD phải 12 chữ số', 'string.pattern.base': 'CCCD chỉ chứa số' }),
  dob: Joi.date().iso().max('now').required().custom((value, helpers) => {
    const age = new Date().getFullYear() - new Date(value).getFullYear();
    if (age < 18) return helpers.message('Bạn phải trên 18 tuổi');
    return value;
  }),
  role: Joi.string().valid('user').optional() // Chỉ cho phép 'user' khi đăng ký
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// Route đăng ký (role default 'user')
app.post('/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { username, password, email, phone, idCard, dob } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword, email, phone, idCard, dob, role: 'user' });
  try {
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    if (err.code === 11000) return res.status(400).send('Username, email hoặc CCCD đã tồn tại');
    res.status(400).send('Error: ' + err.message);
  }
});

// Route đăng nhập (trả về role)
app.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).send('Invalid credentials');
  }
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, 'secretkey', { expiresIn: '1h' });
  res.json({ token, username: user.username, role: user.role });
});

app.listen(5000, () => console.log('Server running on port 5000'));