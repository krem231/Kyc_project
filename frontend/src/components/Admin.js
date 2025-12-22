import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
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
      <h1>Trang Admin</h1>
      <p>Chào mừng admin! Đây là khu vực quản lý (thêm chức năng như xem users sau).</p>
      <button onClick={() => navigate('/welcome')}>Vào trang thường</button>
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}

export default Admin;