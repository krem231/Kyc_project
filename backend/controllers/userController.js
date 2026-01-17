const { registerSchema, loginSchema } = require('../validation/user.validation');
const { registerUser, loginUser } = require('../services/userService');
const { generateOTP, sendOTPEmail } = require('../services/emailService');
const OTP = require('../models/otp.model');

// Đăng ký
async function register(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }
  
  // Loại bỏ recaptchaToken trước khi validate
  const { recaptchaToken, ...userData } = req.body;
  
  const { error } = registerSchema.validate(userData);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const message = await registerUser(userData);
    res.status(201).send(message);
  } catch (err) {
    if (err.code === 11000) return res.status(400).send('Username, email hoặc CCCD đã tồn tại');
    res.status(400).send('Error: ' + err.message);
  }
}

// Đăng nhập - Bước 1: Xác thực và gửi OTP
async function login(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send('Yêu cầu phải có dữ liệu body JSON');
  }
  
  // Loại bỏ recaptchaToken trước khi validate
  const { recaptchaToken, ...loginData } = req.body;
  
  const { error } = loginSchema.validate(loginData);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    // Xác thực username/password
    const user = await loginUser(loginData.username, loginData.password);
    
    // DEBUG: Kiểm tra user object
    console.log('User object:', user);
    console.log('User email:', user.email);
    
    if (!user.email) {
      throw new Error('Email không tồn tại trong user object');
    }
    
    // Tạo OTP
    const otp = generateOTP();
    
    // Xóa OTP cũ của user này (nếu có)
    await OTP.deleteMany({ email: user.email });
    
    // Lưu OTP mới vào database
    const otpRecord = await OTP.create({
      email: user.email,
      otp: otp
    });
    
    console.log('OTP created:', otpRecord);
    
    // Gửi OTP qua email
    await sendOTPEmail(user.email, otp, user.username);
    
    // Trả về thông báo yêu cầu nhập OTP (KHÔNG trả token)
    res.json({
      message: 'OTP đã được gửi đến email của bạn',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Ẩn bớt email
      requireOTP: true,
      tempUserId: user._id // Dùng để verify OTP sau
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).send(err.message);
  }
}

// Xác thực OTP - Bước 2
async function verifyOTP(req, res) {
  const { tempUserId, otp } = req.body;

  console.log('=== VERIFY OTP DEBUG ===');
  console.log('tempUserId:', tempUserId);
  console.log('otp from user:', otp);
  console.log('otp type:', typeof otp);

  if (!tempUserId || !otp) {
    return res.status(400).json({ message: 'Thiếu thông tin xác thực' });
  }

  try {
    // Tìm user
    const User = require('../models/User');
    const user = await User.findById(tempUserId);
    
    if (!user) {
      console.log('❌ User not found:', tempUserId);
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    console.log('✅ User found:', user.email);

    // Kiểm tra tất cả OTP của user này
    const allOTPs = await OTP.find({ email: user.email });
    console.log('All OTPs in DB for this email:', allOTPs);

    // Kiểm tra OTP
    const otpRecord = await OTP.findOne({ 
      email: user.email, 
      otp: otp.toString(),
      verified: false
    });

    console.log('OTP record found:', otpRecord);

    if (!otpRecord) {
      console.log('❌ OTP not found or expired');
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Đánh dấu OTP đã verify
    otpRecord.verified = true;
    await otpRecord.save();

    console.log('✅ OTP verified successfully');

    // Tạo JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'WALLET_SECRET_KEY',
      { expiresIn: '24h' }
    );

    // ✅ FIX: Trả về đầy đủ thông tin bao gồm userId
    res.json({
      message: 'Đăng nhập thành công',
      token,
      username: user.username,
      role: user.role,
      userId: user._id.toString(),
      id: user._id.toString()
    });

  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ message: 'Lỗi xác thực OTP: ' + err.message });
  }
}

// Gửi lại OTP
async function resendOTP(req, res) {
  const { tempUserId } = req.body;

  if (!tempUserId) {
    return res.status(400).json({ message: 'Thiếu thông tin user' });
  }

  try {
    const User = require('../models/user.model');
    const user = await User.findById(tempUserId);
    
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Xóa OTP cũ
    await OTP.deleteMany({ email: user.email });

    // Tạo OTP mới
    const otp = generateOTP();
    
    await OTP.create({
      email: user.email,
      otp: otp
    });
    
    await sendOTPEmail(user.email, otp, user.username);
    
    res.json({ message: 'OTP mới đã được gửi' });

  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Lỗi gửi lại OTP' });
  }
}

module.exports = { register, login, verifyOTP, resendOTP };