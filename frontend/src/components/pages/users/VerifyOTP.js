import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { email, tempUserId } = location.state || {};

  useEffect(() => {
    if (!tempUserId) {
      alert('Session không hợp lệ. Vui lòng đăng nhập lại.');
      navigate('/login');
    }
  }, [tempUserId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const cleanOTP = otp.trim(); // Xóa khoảng trắng
    
    if (cleanOTP.length !== 6) {
      alert('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/verify-otp', {
        tempUserId,
        otp: cleanOTP
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);

      alert('Đăng nhập thành công!');
      
      if (res.data.role === 'admin') {
        navigate('/choose');
      } else {
        navigate('/welcome');
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post('/api/resend-otp', { tempUserId });
      alert('OTP mới đã được gửi đến email của bạn!');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="container" style={{ maxWidth: '500px' }}>
      <h1>🔐 Xác thực OTP</h1>
      
      <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          📧 Mã OTP đã được gửi đến email:<br/>
          <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerify}>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <input
            type="text"
            placeholder="Nhập 6 chữ số OTP"
            value={otp}
            onChange={handleOtpChange}
            maxLength={6}
            style={{
              fontSize: '24px',
              letterSpacing: '10px',
              textAlign: 'center',
              width: '100%',
              padding: '15px'
            }}
            autoFocus
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || otp.length !== 6}
          style={{ opacity: (loading || otp.length !== 6) ? 0.5 : 1 }}
        >
          {loading ? 'Đang xác thực...' : 'Xác nhận'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {canResend ? (
          <button 
            onClick={handleResend} 
            disabled={loading}
            style={{ background: '#28a745' }}
          >
            Gửi lại OTP
          </button>
        ) : (
          <p style={{ color: '#666', fontSize: '14px' }}>
            Gửi lại OTP sau {countdown}s
          </p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <button 
          type="button"
          onClick={() => navigate('/login')}
          style={{ background: '#6c757d' }}
        >
          ← Quay lại đăng nhập
        </button>
      </div>

      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '20px',
        fontSize: '13px'
      }}>
        <strong>💡 Lưu ý:</strong>
        <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
          <li>Mã OTP có hiệu lực trong 5 phút</li>
          <li>Kiểm tra cả hộp thư spam nếu không thấy email</li>
          <li>Không chia sẻ mã OTP với bất kỳ ai</li>
        </ul>
      </div>
    </div>
  );
}

export default VerifyOTP;