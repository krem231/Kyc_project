import React from 'react';
import { useNavigate } from 'react-router-dom';

function Choose() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Chọn chức năng (Admin)</h1>
      
      <button onClick={() => navigate('/admin')}>Quản lý User</button>
      <button onClick={() => navigate('/welcome')}>Trang thường</button>
      
      <button onClick={() => {
        localStorage.clear();
        navigate('/login');
      }}>Đăng xuất</button>
    </div>
  );
}

export default Choose;