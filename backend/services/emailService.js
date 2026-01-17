const nodemailer = require('nodemailer');

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Tạo mã OTP 6 chữ số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi OTP qua email
async function sendOTPEmail(email, otp, username) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Mã xác thực đăng nhập - KYC System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { color: #dc3545; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Mã Xác Thực Đăng Nhập</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Bạn vừa yêu cầu đăng nhập vào hệ thống KYC. Đây là mã OTP của bạn:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Mã OTP có hiệu lực trong <strong>5 phút</strong></li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>Nếu bạn không yêu cầu đăng nhập, vui lòng bỏ qua email này</li>
            </ul>
            
            <p class="warning">⚠️ Nếu bạn không thực hiện hành động này, vui lòng đổi mật khẩu ngay!</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ KYC System</p>
            <p>© 2025 KYC Project. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

module.exports = { generateOTP, sendOTPEmail };