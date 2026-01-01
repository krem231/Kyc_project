import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

const schema = yup.object({
  username: yup.string().min(3, 'Username ít nhất 3 ký tự').required('Bắt buộc'),
  password: yup.string().min(6, 'Password ít nhất 6 ký tự').required('Bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Bắt buộc'),
  phone: yup.string().matches(/^0\d{9}$/, 'SĐT 10 số bắt đầu bằng 0').required('Bắt buộc'),
  idCard: yup.string().length(12, 'CCCD 12 chữ số').matches(/^\d+$/, 'Chỉ chứa số').required('Bắt buộc'),
  dob: yup.date().max(new Date(), 'Ngày sinh không hợp lệ').required('Bắt buộc').test('age', 'Bạn phải trên 18 tuổi', value => {
    const age = new Date().getFullYear() - new Date(value).getFullYear();
    return age >= 18;
  })
});

function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ 
    resolver: yupResolver(schema) 
  });
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const onSubmit = async (data) => {
    if (!recaptchaToken) {
      alert('Vui lòng xác nhận bạn không phải robot!');
      return;
    }

    try {
      await axios.post('/api/register', {
        ...data,
        recaptchaToken
      });
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Unknown error';
      alert('Error: ' + errorMessage);
      // Reset reCAPTCHA khi lỗi
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
    }
  };

  return (
    <div className="container">
      <h1>Đăng ký</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Username" {...register('username')} />
        <p className="error">{errors.username?.message}</p>
        
        <input type="password" placeholder="Password" {...register('password')} />
        <p className="error">{errors.password?.message}</p>
        
        <input placeholder="Email" {...register('email')} />
        <p className="error">{errors.email?.message}</p>
        
        <input placeholder="SĐT (0xxxxxxxxx)" {...register('phone')} />
        <p className="error">{errors.phone?.message}</p>
        
        <input placeholder="CCCD (12 số)" {...register('idCard')} />
        <p className="error">{errors.idCard?.message}</p>
        
        <input type="date" {...register('dob')} />
        <p className="error">{errors.dob?.message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={onRecaptchaChange}
          />
        </div>
        
        <button type="submit">Đăng ký</button>
      </form>
      
      <p>
        Đã có tài khoản? 
        <button type="button" onClick={() => navigate('/login')}>Đăng nhập</button>
      </p>
    </div>
  );
}

export default Register;