import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

const schema = yup.object({
  username: yup.string().required('Bắt buộc'),
  password: yup.string().required('Bắt buộc')
});

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({ 
    resolver: yupResolver(schema) 
  });
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const onSubmit = async (data) => {
    if (!recaptchaToken) {
      alert('Vui lòng xác nhận bạn không phải robot!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/login', {
        ...data,
        recaptchaToken
      });
      
      // Nếu yêu cầu OTP
      if (res.data.requireOTP) {
        navigate('/verify-otp', {
          state: {
            email: res.data.email,
            tempUserId: res.data.tempUserId
          }
        });
      } else {
        // Trường hợp không cần OTP (nếu có)
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role);
        
        if (res.data.role === 'admin') {
          navigate('/choose');
        } else {
          navigate('/welcome');
        }
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.response?.data || err.message));
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Username" {...register('username')} />
        <p className="error">{errors.username?.message}</p>
        
        <input type="password" placeholder="Password" {...register('password')} />
        <p className="error">{errors.password?.message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={onRecaptchaChange}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
      
      <p>
        Chưa có tài khoản? 
        <button type="button" onClick={() => navigate('/register')}>Đăng ký</button>
      </p>
    </div>
  );
}

export default Login;