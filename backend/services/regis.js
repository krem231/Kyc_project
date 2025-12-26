const bcrypt = require('bcryptjs');
const wallet=require('./create_wallet')
const User = require('../models/User');
async function registerUser(userData) {
  const { username, password, email, phone, idCard, dob } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, email, phone, idCard, dob, role: 'user' });
  await newUser.save();
try {
  await wallet(newUser);
} catch (err) {
  console.error(err.message);
}
  return 'User registered successfully';
}
module.exports = registerUser;