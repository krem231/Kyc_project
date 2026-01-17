const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  recaptchaToken: Joi.string().optional(), 
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
  password: Joi.string().required(),
  recaptchaToken: Joi.string().optional() 
});

const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^0\d{9}$/).required(),
  idCard: Joi.string().length(12).pattern(/^\d+$/).required(),
  dob: Joi.date().iso().max('now').required().custom((value, helpers) => {
    const age = new Date().getFullYear() - new Date(value).getFullYear();
    if (age < 18) return helpers.message('Bạn phải trên 18 tuổi');
    return value;
  }),
  role: Joi.string().valid('admin', 'user').required(),
  isBanned: Joi.boolean().optional() // Cho ban/unban
});

// Schema dành riêng cho Update (các trường là optional)
const updateUserSchema = userSchema.fork(
  ['username', 'password', 'email', 'phone', 'idCard', 'dob', 'role', 'isBanned'], 
  (schema) => schema.optional()
);

module.exports = { registerSchema, loginSchema, userSchema, updateUserSchema };