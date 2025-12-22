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
  phone: yup.string().matches(/^0\d{9}$/, 'SĐT 10 số bắt đầu bằng 0').required('Bắt buộc'),
  idCard: yup.string().length(12, 'CCCD 12 chữ số').matches(/^\d+$/, 'Chỉ chứa số').required('Bắt buộc'),
  dob: yup.date().max(new Date(), 'Ngày sinh không hợp lệ').required('Bắt buộc').test('age', 'Bạn phải trên 18 tuổi', value => {
    const age = new Date().getFullYear() - new Date(value).getFullYear();
    return age >= 18;
  })
});

function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await axios.post('http://localhost:5000/register', data);
      console.log('Đăng ký thành công - Redirecting...'); // Debug
      navigate('/login');
    } catch (err) {
      alert('Error: ' + (err.response?.data || err.message));
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
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default Register;