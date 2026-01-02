import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

function FundList() {
  console.log('✅ FundList component rendered');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      console.log('📡 Calling /api/funds');

      const res = await axios.get(`${API_BASE_URL}/funds`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 FUNDS API RAW:', res.data);

      const fundsData =
        res.data?.data ||
        res.data?.funds ||
        (Array.isArray(res.data) ? res.data : []);

      setFunds(fundsData);
    } catch (error) {
      console.error('❌ Fetch funds error:', error);
      setFunds([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <h2>👥 Danh sách quỹ chung</h2>
        <button onClick={() => navigate(-1)}>⬅ Quay lại</button>
      </div>

      {loading && <p>Đang tải danh sách quỹ...</p>}

      {!loading && funds.length === 0 && (
        <p>👉 Bạn chưa tham gia hoặc tạo quỹ nào</p>
      )}

      {!loading && funds.length > 0 && (
        <ul className="walletList">
          {funds.map(fund => (
            <li key={fund._id} className="walletItem">

              <p>
                <strong>ID quỹ:</strong>{' '}
                <code className="userId">{fund._id}</code>
              </p>

              <p>
                <strong>Owner ID:</strong> {fund.owner}
              </p>

              <p>
                <strong>Số thành viên:</strong>{' '}
                {fund.members?.length || 0}
              </p>

              <p>
                <strong>Số dư:</strong>{' '}
                {(fund.balance || 0).toLocaleString()} {fund.currency}
              </p>

              <p>
                <strong>Trạng thái:</strong> {fund.status}
              </p>

              <p className="time">
                Tạo lúc:{' '}
                {fund.create_at
                  ? new Date(fund.create_at).toLocaleString()
                  : '—'}
              </p>

              <div className="wallet-actions">
                <button
                  className="wallet-btn transfer"
                  onClick={() => navigate(`/funds/${fund._id}`)}
                >
                  📂 Chi tiết quỹ
                </button>

                <button
                  className="wallet-btn link"
                  onClick={() => {
                    navigator.clipboard.writeText(fund._id);
                    alert('Đã copy ID quỹ');
                  }}
                >
                  📋 Copy ID
                </button>
              </div>

            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FundList;
