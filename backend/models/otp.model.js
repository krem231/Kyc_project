const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Tự động xóa sau 5 phút (300 giây)
  },
  verified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('OTP', otpSchema);