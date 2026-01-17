import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== FETCH USERS DEBUG ===');
      console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
      
      const res = await axios.get(`${API_BASE_URL}/api/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Users fetched successfully:', res.data.length);
      setUsers(res.data);
    } catch (err) {
      console.error('❌ Fetch users error:', err.response?.data || err.message);
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_BASE_URL}/api/`, formData, config);
      }
      
      fetchUsers();
      setFormData({});
      setEditingId(null);
      alert(editingId ? 'Cập nhật thành công!' : 'Thêm thành công!');
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    const { _id, __v, ...userData } = user;
    setFormData({
      ...userData,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
    });
    setEditingId(user._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa user này?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        alert('Xóa thành công!');
      } catch (err) {
        console.error('Delete error:', err.response?.data || err.message);
        alert('Error: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleBan = async (id, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    const actionText = isBanned ? 'Gỡ khóa' : 'Khóa';
    
    if (window.confirm(`${actionText} user này?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/${action}/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        alert(`${actionText} thành công!`);
      } catch (err) {
        console.error('Ban/Unban error:', err.response?.data || err.message);
        alert('Error: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="container">
      <h1>Quản lý User (Admin)</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>{editingId ? 'Cập nhật User' : 'Thêm User Mới'}</h2>
        
        <input 
          placeholder="Username" 
          value={formData.username || ''} 
          onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
          required 
        />
        
        <input 
          type="password" 
          placeholder="Password (bỏ trống nếu cập nhật)" 
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
        />
        
        <input 
          placeholder="Email" 
          value={formData.email || ''} 
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
          required 
        />
        
        <input 
          placeholder="Phone" 
          value={formData.phone || ''} 
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
          required 
        />
        
        <input 
          placeholder="ID Card" 
          value={formData.idCard || ''} 
          onChange={(e) => setFormData({ ...formData, idCard: e.target.value })} 
          required 
        />
        
        <input 
          type="date" 
          value={formData.dob || ''} 
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
          required 
        />
        
        <select 
          value={formData.role || 'user'} 
          onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
          required
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        
        <label>
          <input 
            type="checkbox" 
            checked={formData.isBanned || false} 
            onChange={(e) => setFormData({ ...formData, isBanned: e.target.checked })} 
          />
          Khóa tài khoản
        </label>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : (editingId ? 'Cập nhật' : 'Thêm')}
        </button>
        
        {editingId && (
          <button 
            type="button" 
            onClick={() => {
              setFormData({});
              setEditingId(null);
            }}
          >
            Hủy
          </button>
        )}
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>ID Card</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>DOB</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Banned</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{user.username}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{user.phone}</td>
                <td style={{ padding: '12px' }}>{user.idCard}</td>
                <td style={{ padding: '12px' }}>
                  {user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '–'}
                </td>
                <td style={{ padding: '12px' }}>{user.role}</td>
                <td style={{ padding: '12px' }}>
                  {user.isBanned ? '🔴 Yes' : '🟢 No'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleEdit(user)}>Sửa</button>
                    <button onClick={() => handleDelete(user._id)}>Xóa</button>
                    <button onClick={() => handleBan(user._id, user.isBanned)}>
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
          Không có user nào
        </p>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate('/welcome')}>Về trang thường</button>
        <button onClick={() => { 
          localStorage.clear(); 
          navigate('/login'); 
        }}>Đăng xuất</button>
      </div>
    </div>
  );
}

export default Admin;