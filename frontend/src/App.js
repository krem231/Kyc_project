import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/pages/users/Register';
import Login from './components/pages/users/Login';
import VerifyOTP from './components/pages/users/VerifyOTP';
import Welcome from './components/pages/users/Welcome';
import Choose from './components/pages/admin/Choose';
import Admin from './components/pages/admin/Admin';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/choose" element={<Choose />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;