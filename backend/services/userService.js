// services/userService.js (cập nhật với parse DOB và check)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet'); // Import model Wallet mới

// Service cho đăng ký
async function registerUser(userData) {
  const { username, password, email, phone, idCard, dob } = userData;

  // Parse DOB để đảm bảo là Date valid (Joi đã check nhưng confirm)
  const parsedDob = new Date(dob);
  if (isNaN(parsedDob.getTime())) {
    throw new Error('Ngày sinh không hợp lệ');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, email, phone, idCard, dob: parsedDob, role: 'user' });
  await newUser.save();

  // Tạo ví điện tử tự động cho user mới
  const newWallet = new Wallet({
    userId: newUser._id
  });
  await newWallet.save();

  return 'User registered successfully with wallet created';
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
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, 'WALLET_SECRET_KEY', { expiresIn: '1h' });
  return { token, username: user.username, role: user.role };
}

module.exports = { registerUser, loginUser };