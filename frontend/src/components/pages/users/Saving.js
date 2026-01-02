import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

function Saving() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [walletId, setWalletId] = useState('');
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('3');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // =====================
  // LẤY WALLET ID (URL -> state)
  // =====================
  useEffect(() => {
    // 1️⃣ ưu tiên URL
    const params = new URLSearchParams(location.search);
    const walletIdFromUrl = params.get('walletId');

    if (walletIdFromUrl) {
      setWalletId(walletIdFromUrl);
      return;
    }

    // 2️⃣ fallback location.state
    if (location.state?.walletId) {
      setWalletId(location.state.walletId);
    }
  }, [location]);

  useEffect(() => {
    if (walletId) {
      fetchSavings();
    }
  }, [walletId]);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      console.log('📤 FE walletId:', walletId);

      const res = await axios.get(`${API_BASE_URL}/saving`, {
        params: { walletId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSavings(res.data.data || []);
    } catch (error) {
      console.error('❌ Fetch saving error:', error.response?.data || error.message);
      setSavings([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // CREATE SAVING
  // =====================
  const handleCreateSaving = async () => {
    if (!walletId) {
      setMessage('Không xác định được ví. Vui lòng chọn lại.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setIsCreating(true);
    setMessage('');

    try {
      await axios.post(
        `${API_BASE_URL}/saving`,
        {
          walletId,
          amount: Number(amount),
          term: Number(term)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('✅ Gửi tiết kiệm thành công');
      setAmount('');
      setTerm('3');

      fetchSavings();

      setTimeout(() => {
        setShowCreateModal(false);
        setMessage('');
      }, 1200);
    } catch (error) {
      console.error('❌ Create saving error:', error.response?.data || error.message);
      setMessage(
        error.response?.data?.message ||
        'Lỗi khi gửi tiết kiệm'
      );
    } finally {
      setIsCreating(false);
    }
  };
  const handleWithdrawSaving = async (savingId) => {
  if (!window.confirm('Bạn có chắc chắn muốn rút sổ tiết kiệm này?')) return;
  console.log('🔥 CLICK RÚT:', savingId);
  try {
    const token = localStorage.getItem('token');

    const res = await axios.post(
      `${API_BASE_URL}/saving/withdraw`,
      { savingId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMessage(`✅ ${res.data.message}`);
    fetchSavings();      // reload sổ
   
  } catch (err) {
    setMessage(
      err.response?.data?.message || '❌ Rút tiết kiệm thất bại'
    );
  }
};


  // =====================
  // RENDER
  // =====================
  if (!walletId) {
    return (
      <div className="page-container">
        <p>⚠️ Không xác định được ví. Vui lòng quay lại chọn ví.</p>
        <button onClick={() => navigate(-1)}>⬅ Quay lại</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="header">
        <h2>💼 Sổ tiết kiệm của ví</h2>
        <button onClick={() => setShowCreateModal(true)}>
          ➕ Gửi tiết kiệm
        </button>
      </div>

      {loading ? (
        <p>Đang tải sổ tiết kiệm...</p>
      ) : savings.length === 0 ? (
        <p>👉 Ví này chưa có sổ tiết kiệm</p>
      ) : (
    <ul className="walletList">
  { savings.map(s => {
  const isMatured = new Date() >= new Date(s.endDate);
  const canWithdraw = s.status === 'ACTIVE';

  return (
    <li key={s._id} className="walletItem">
      <p><strong>Số tiền gửi:</strong> {s.amount.toLocaleString()} VND</p>
      <p><strong>Lãi:</strong> {s.interestAmount.toLocaleString()} VND</p>
      <p><strong>Tổng nhận:</strong> {s.totalReceive.toLocaleString()} VND</p>
      <p><strong>Kỳ hạn:</strong> {s.term} tháng</p>
      <p><strong>Trạng thái:</strong> {s.status}</p>

      <p className="time">
        Ngày gửi: {new Date(s.startDate).toLocaleDateString()}
      </p>
      <p className="time">
        Ngày đáo hạn: {new Date(s.endDate).toLocaleDateString()}
      </p>

      {canWithdraw && (
        <button
          className="withdraw-btn"
          onClick={() => handleWithdrawSaving(s._id)}
        >
          💸 Rút tiết kiệm
          {!isMatured && (
            <span className="text-red-500"> (Trước hạn)</span>
          )}
        </button>
      )}
    </li>
  );
})}

</ul>

      )}

      <button onClick={() => navigate(-1)} className="mt-10">
        ⬅ Quay lại
      </button>

      {/* ===== MODAL CREATE ===== */}
      {showCreateModal && (
        <div className="overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>➕ Gửi tiết kiệm</h3>

            <div className="input read-only">
              <strong>Ví:</strong>
              <div className="wallet-id-box">{walletId}</div>
            </div>

            <input
              className="input"
              placeholder="Số tiền gửi (VND)"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
            />

            <select
              className="input"
              value={term}
              onChange={e => setTerm(e.target.value)}
            >
              <option value="1">1 tháng</option>
              <option value="3">3 tháng</option>
              <option value="6">6 tháng</option>
              <option value="12">12 tháng</option>
            </select>

            <p className="text-sm text-gray-500">
              Lãi suất tạm tính: <strong>2%</strong>
            </p>

            {message && (
              <p className={message.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {message}
              </p>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Huỷ</button>
              <button onClick={handleCreateSaving} disabled={isCreating}>
                {isCreating ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Saving;
