import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container">
      <h1>Chào mừng, {username}!</h1>
      <p>Role: {role}</p>
      
      {role === 'admin' && (
        <button onClick={() => navigate('/choose')}>Quản lý Admin</button>
      )}
      
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}

export default Welcome;