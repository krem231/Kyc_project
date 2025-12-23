// src/components/Choose.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Choose() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Chọn chế độ</h1>
      <button onClick={() => navigate('/welcome')}>Vào trang thường</button>
      <button onClick={() => navigate('/admin')}>Vào trang admin</button>
    </div>
  );
}

export default Choose;