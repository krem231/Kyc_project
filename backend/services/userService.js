const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Service cho đăng ký
async function registerUser(userData) {
  const { username, password, email, phone, idCard, dob } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ 
    username, 
    password: hashedPassword, 
    email, 
    phone, 
    idCard, 
    dob, 
    role: 'user' 
  });
  await newUser.save();
  return 'User registered successfully';
}

// Service cho đăng nhập - TRẢ VỀ USER OBJECT THAY VÌ TOKEN
async function loginUser(username, password) {
  const user = await User.findOne({ username });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isBanned) {
    throw new Error('Account is banned');
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  // TRẢ VỀ USER OBJECT ĐẦY ĐỦ (bao gồm email, _id)
  return {
    _id: user._id,
    username: user.username,
    email: user.email, // ← QUAN TRỌNG: Phải có email
    role: user.role
  };
}

module.exports = { registerUser, loginUser };