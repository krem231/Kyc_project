const { userSchema, updateUserSchema } = require('../../validation/user.validation'); // Adjust path nếu cần (ví dụ từ admin folder)
const User = require('../../models/user'); // Adjust path nếu cần
const bcrypt = require('bcryptjs');

// Get all users (Read)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Không trả password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new user (Create)
exports.addUser = async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password, email, phone, idCard, dob, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword, email, phone, idCard, dob, role });
  try {
    await newUser.save();
    res.status(201).json({ message: 'User added' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate field' });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user (Update - tùy chỉnh thông tin)
exports.updateUser = async (req, res) => {
  const { error } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { password, ...updateData } = req.body;
  if (password) updateData.password = await bcrypt.hash(password, 10);

  try {
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (Delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Ban user 
exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User banned', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Unban user 
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unbanned', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};