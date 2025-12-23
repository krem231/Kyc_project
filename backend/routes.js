const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
//const User = require('./User'); // Import User từ db.js
const User = require('./models/User');

const router = express.Router();

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

// Route Đăng ký
router.post('/register', async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }
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

// Route Đăng nhập
router.post('/login', async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }
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

module.exports = router;