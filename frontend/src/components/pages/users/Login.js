// src/pages/Users/Login.js (đã sửa URL đúng + UX tốt hơn)

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().required('Username là bắt buộc'),
  password: yup.string().required('Password là bắt buộc')
});

function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: yupResolver(schema) 
  });
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = React.useState('');

  const onSubmit = async (data) => {
    setErrorMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', data);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);

      if (res.data.role === 'admin') {
        navigate('/choose');
      } else {
        navigate('/welcome');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Đăng nhập</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-xl">
        <div className="mb-5">
          <input 
            placeholder="Username" 
            {...register('username')} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div className="mb-6">
          <input 
            type="password" 
            placeholder="Password" 
            {...register('password')} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {errorMessage && (
          <div className="mb-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg disabled:bg-gray-400 transition"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Chưa có tài khoản?{' '}
        <button 
          onClick={() => navigate('/register')} 
          className="text-blue-600 hover:underline font-medium"
        >
          Đăng ký ngay
        </button>
      </p>
    </div>
  );
}

export default Login;