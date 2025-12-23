const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import từ models

// Service cho đăng ký
async function registerUser(userData) {
  const { username, password, email, phone, idCard, dob } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, email, phone, idCard, dob, role: 'user' });
  await newUser.save();
  return 'User registered successfully';
}

// Service cho đăng nhập
async function loginUser(username, password) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, 'secretkey', { expiresIn: '1h' });
  return { token, username: user.username, role: user.role };
}

module.exports = { registerUser, loginUser };