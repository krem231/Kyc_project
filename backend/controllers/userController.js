// controllers/userController.js (cập nhật với error handling tốt hơn)
const Joi = require('joi');
const { registerUser, loginUser } = require('../services/userService');

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

// đăng ký
async function register(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }

  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const message = await registerUser(req.body);
    res.status(201).send(message);
  } catch (err) {
    console.error('Register error:', err); // Log lỗi để debug
    if (err.name === 'MongoServerError' && err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]; // Lấy field gây duplicate
      return res.status(400).send(`${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`);
    } else if (err.name === 'ValidationError') {
      return res.status(400).send(Object.values(err.errors).map(e => e.message).join(', '));
    }
    res.status(500).send('Lỗi server: ' + err.message);
  }
}

// đăng nhập
async function login(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }

  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const result = await loginUser(req.body.username, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

module.exports = { register, login };