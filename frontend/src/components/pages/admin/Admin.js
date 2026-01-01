import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTable } from 'react-table';

function Admin() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!localStorage.getItem('token') || role !== 'admin') {
      navigate('/login');
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== FETCH USERS DEBUG ===');
      console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
      
      const res = await axios.get('/api/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Users fetched successfully:', res.data.length);
      setUsers(res.data);
    } catch (err) {
      console.error('❌ Fetch users error:', err.response?.data || err.message);
      alert('Error: ' + (err.response?.data.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      if (editingId) {
        await axios.put(`/api/${editingId}`, formData, config);
      } else {
        await axios.post('/api/', formData, config);
      }
      
      fetchUsers();
      setFormData({});
      setEditingId(null);
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      alert('Error: ' + (err.response?.data.message || err.message));
    }
  };

  const handleEdit = (user) => {
    const { _id, __v, ...userData } = user; // Loại bỏ _id và __v
    setFormData({
      ...userData,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
    });
    setEditingId(user._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (err) {
        console.error('Delete error:', err.response?.data || err.message);
        alert('Error: ' + (err.response?.data.message || err.message));
      }
    }
  };

  const handleBan = async (id, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    if (window.confirm(`${isBanned ? 'Unban' : 'Ban'} user?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`/api/${action}/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (err) {
        console.error('Ban/Unban error:', err.response?.data || err.message);
        alert('Error: ' + (err.response?.data.message || err.message));
      }
    }
  };

  const columns = React.useMemo(() => [
    { Header: 'Username', accessor: 'username' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Phone', accessor: 'phone' },
    { Header: 'ID Card', accessor: 'idCard' },
    { 
      Header: 'DOB', 
      accessor: 'dob',
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('vi-VN') : ''
    },
    { Header: 'Role', accessor: 'role' },
    { 
      Header: 'Banned', 
      accessor: 'isBanned',
      Cell: ({ value }) => value ? 'Yes' : 'No'
    },
    { 
      Header: 'Actions', 
      Cell: ({ row }) => (
        <>
          <button onClick={() => handleEdit(row.original)}>Sửa</button>
          <button onClick={() => handleDelete(row.original._id)}>Xóa</button>
          <button onClick={() => handleBan(row.original._id, row.original.isBanned)}>
            {row.original.isBanned ? 'Unban' : 'Ban'}
          </button>
        </>
      )
    }
  ], []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ 
    columns, 
    data: users 
  });

  return (
    <div className="container">
      <h1>Quản lý User (Admin)</h1>

      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Username" 
          value={formData.username || ''} 
          onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password (optional for update)" 
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
          Banned:
          <input 
            type="checkbox" 
            checked={formData.isBanned || false} 
            onChange={(e) => setFormData({ ...formData, isBanned: e.target.checked })} 
          />
        </label>
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm'}</button>
      </form>

      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <button onClick={() => navigate('/welcome')}>Về trang thường</button>
      <button onClick={() => { 
        localStorage.clear(); 
        navigate('/login'); 
      }}>Đăng xuất</button>
    </div>
  );
}

export default Admin;