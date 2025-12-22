import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="container">
      <h1>Chào mừng {username}!</h1>
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}

export default Welcome;