import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Welcome() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI tạo quỹ
  const [showFundForm, setShowFundForm] = useState(false);
  const [fundName, setFundName] = useState('');
  const [friendId, setFriendId] = useState('');
  const [creatingFund, setCreatingFund] = useState(false);

  /* ================= Redirect nếu chưa login ================= */
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  /* ================= Fetch wallets ================= */
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/wallets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWallets(Array.isArray(res.data) ? res.data : []);
      } catch {
        setWallets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, [token]);

  /* ================= Tạo ví ================= */
  const handleCreateWallet = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/wallets',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.wallet) {
        setWallets(prev => [...prev, res.data.wallet]);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        'Không thể tạo ví'
      );
    }
  };

  /* ================= Xoá ví (UI) ================= */
  const handleDeleteWallet = (walletId) => {
    if (!window.confirm('Bạn có chắc muốn xoá ví này không?')) return;
    setWallets(prev => prev.filter(w => w._id !== walletId));
  };

  /* ================= Tạo quỹ chung ================= */
  const handleCreateFund = async () => {
    if (!fundName || !friendId) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setCreatingFund(true);

      await axios.post(
        'http://localhost:5000/api/funds',
        { fundName, friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('🎉 Tạo quỹ chung thành công');
      setFundName('');
      setFriendId('');
      setShowFundForm(false);
    } catch (err) {
      alert(
         err.response?.data?.message ||
        err.message 
      );
    } finally {
      setCreatingFund(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 650, margin: '40px auto', fontFamily: 'Arial' }}>
      {/* ===== HEADER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>👋 Chào mừng {username}</h2>

        <button onClick={() => setShowFundForm(true)}>
          ➕ Tạo quỹ chung
        </button>
      </div>

      {/* ===== USER ID ===== */}
      <div style={styles.userIdBox}>
        <span>ID của bạn:</span>
        <code style={styles.userId}>
          {userId || 'Không có ID'}
        </code>
        <button
          disabled={!userId}
          onClick={() => {
            navigator.clipboard.writeText(userId);
            alert('Đã copy ID!');
          }}
        >
          📋 Copy
        </button>
      </div>

      {/* ===== WALLET LIST ===== */}
      <h3>Ví của bạn</h3>

      {loading ? (
        <p>Đang tải ví...</p>
      ) : wallets.length === 0 ? (
        <p>👉 Bạn chưa có ví nào</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {wallets.map(wallet => (
            <li key={wallet._id} style={styles.walletItem}>
              <span
                style={styles.deleteIcon}
                onClick={() => handleDeleteWallet(wallet._id)}
              >
                🗑️
              </span>

              <p>
                <strong>Số dư:</strong>{' '}
                {(wallet.balance ?? 0).toLocaleString()} {wallet.currency}
              </p>

              <p><strong>Trạng thái:</strong> {wallet.status}</p>

              <p style={styles.time}>
                Tạo lúc:{' '}
                {wallet.create_at
                  ? new Date(wallet.create_at).toLocaleString()
                  : '—'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleCreateWallet} style={{ marginTop: 10 }}>
        ➕ Tạo thêm ví
      </button>

      <hr style={{ margin: '20px 0' }} />

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Đăng xuất
      </button>

      {/* ===== MODAL TẠO QUỸ ===== */}
      {showFundForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>➕ Tạo quỹ chung</h3>

            <input
              placeholder="Tên quỹ"
              value={fundName}
              onChange={e => setFundName(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="ID người bạn"
              value={friendId}
              onChange={e => setFriendId(e.target.value)}
              style={styles.input}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowFundForm(false)}>Huỷ</button>
              <button onClick={handleCreateFund} disabled={creatingFund}>
                {creatingFund ? 'Đang tạo...' : 'Tạo quỹ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  userIdBox: {
    background: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    margin: '10px 0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14
  },
  userId: {
    background: '#fff',
    padding: '2px 6px',
    borderRadius: 4
  },
  walletItem: {
    border: '1px solid #ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative'
  },
  deleteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: 'pointer',
    color: 'red'
  },
  time: {
    fontSize: 12,
    color: '#666'
  },
  logoutBtn: {
    background: 'red',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: {
    background: '#fff',
    padding: 20,
    borderRadius: 8,
    width: 350
  },
  input: {
    width: '100%',
    marginBottom: 10
  }
};

export default Welcome;
