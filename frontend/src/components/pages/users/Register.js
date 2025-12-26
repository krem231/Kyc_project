// src/pages/Users/Register.js (đã sửa URL đúng + validation đẹp hơn)

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().min(3, 'Username ít nhất 3 ký tự').required('Bắt buộc'),
  password: yup.string().min(6, 'Password ít nhất 6 ký tự').required('Bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Bắt buộc'),
  phone: yup.string().matches(/^0\d{9}$/, 'SĐT phải 10 số bắt đầu bằng 0').required('Bắt buộc'),
  idCard: yup.string().length(12, 'CCCD phải đúng 12 chữ số').matches(/^\d+$/, 'CCCD chỉ chứa số').required('Bắt buộc'),
  dob: yup.date()
    .max(new Date(), 'Ngày sinh không được trong tương lai')
    .required('Bắt buộc')
    .test('age', 'Bạn phải trên 18 tuổi', value => {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    })
});

function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: yupResolver(schema) 
  });
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const onSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await axios.post('http://localhost:5000/api/register', data);
      setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Đăng ký tài khoản</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-xl space-y-5">
        <div>
          <input placeholder="Username" {...register('username')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <input type="password" placeholder="Password" {...register('password')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <input placeholder="Email" {...register('email')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input placeholder="SĐT (bắt đầu bằng 0, 10 số)" {...register('phone')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <input placeholder="CCCD (12 số)" {...register('idCard')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.idCard && <p className="text-red-600 text-sm mt-1">{errors.idCard.message}</p>}
        </div>

        <div>
          <input type="date" {...register('dob')} className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.dob && <p className="text-red-600 text-sm mt-1">{errors.dob.message}</p>}
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg disabled:bg-gray-400 transition"
        >
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
}

export default Register;