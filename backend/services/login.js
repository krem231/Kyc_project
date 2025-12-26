const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
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
  return { token, id:user._id.toString(),username: user.username, role: user.role };
}
module.exports=loginUser