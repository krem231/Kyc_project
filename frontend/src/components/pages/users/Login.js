import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().required('Bắt buộc'),
  password: yup.string().required('Bắt buộc')
});

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);
      if (res.data.role === 'admin') {
        navigate('/choose'); // Sang trang chọn cho admin
      } else {
        navigate('/welcome'); // User thường
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data || err.message));
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
        <button type="submit">Đăng nhập</button>
      </form>
      <p>Chưa có tài khoản? <button onClick={() => navigate('/register')}>Đăng ký</button></p>
    </div>
  );
}

export default Login;