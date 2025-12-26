// src/pages/Users/LinkBank.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/LinkBank.css'; // Có thể dùng chung CSS với ManageCards nếu muốn

const API_BASE_URL = 'http://localhost:5000/api';
const MAX_LINKS = 3;

function LinkBank() {
  const navigate = useNavigate();

  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState(''); // Cho phép chữ + số
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchLinkedAccounts();
    }
  }, [navigate]);

  const fetchLinkedAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/link-bank/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeLinks = (response.data.links || [])
        .filter((link) => link.status === 'ACTIVE')
        .sort((a, b) => new Date(b.linkedAt) - new Date(a.linkedAt));
      setLinkedAccounts(activeLinks);
      setError('');
    } catch (err) {
      console.error('Lỗi fetch linked accounts:', err);
      setError('Không thể tải danh sách tài khoản liên kết');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (linkedAccounts.length >= MAX_LINKS) {
      setError('Bạn đã liên kết tối đa 3 tài khoản ngân hàng');
      return;
    }
    setShowModal(true);
    setAccountNumber('');
    setOtp('');
    setMessage('');
    setOtpRequested(false);
    setModalLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAccountNumber('');
    setOtp('');
    setMessage('');
    setOtpRequested(false);
    setModalLoading(false);
  };

  const handleRequestOTP = async () => {
    if (!accountNumber || accountNumber.length < 8 || accountNumber.length > 20) {
      setMessage('Vui lòng nhập số tài khoản hợp lệ (8-20 ký tự)');
      return;
    }
    try {
      setModalLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/link-bank/request`,
        { accountNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'OTP đã được gửi đến số điện thoại đăng ký');
      setOtpRequested(true);
      if (response.data.otp) {
        console.log('🔑 OTP (dev):', response.data.otp);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi yêu cầu OTP');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessage('Vui lòng nhập đúng 6 số OTP');
      return;
    }
    try {
      setModalLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/link-bank/verify`,
        { accountNumber, otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'Liên kết thành công!');
      setTimeout(() => {
        handleCloseModal();
        fetchLinkedAccounts();
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi xác thực OTP');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnlink = async (accountId) => {
    if (!window.confirm('Bạn có chắc muốn hủy liên kết tài khoản này?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/unlink/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setError('');
      fetchLinkedAccounts();
    } catch (err) {
      console.error('Lỗi hủy liên kết:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Không thể hủy liên kết');
    }
  };

  const formatAccountNumber = (number) => {
    // Chỉ format nếu là 12 chữ số thuần, nếu có chữ thì giữ nguyên
    if (/^\d{12}$/.test(number)) {
      return number.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return number; // Giữ nguyên nếu có chữ hoặc không đủ 12 số
  };

  if (loading) {
    return (
      <div className="link-bank-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="link-bank-container">
      {/* Header */}
      <div className="link-bank-header">
        <button onClick={() => navigate('/welcome')} className="back-button">
          ← Quay lại
        </button>
        <h1 className="page-title">🏦 Quản lý liên kết ngân hàng</h1>
        <button
          onClick={handleOpenModal}
          className="add-button"
          disabled={linkedAccounts.length >= MAX_LINKS}
        >
          + Thêm liên kết
        </button>
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Empty state */}
      {linkedAccounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <h2>Chưa có tài khoản liên kết</h2>
          <p>Bạn chưa liên kết tài khoản ngân hàng nào. Hãy thêm tài khoản đầu tiên!</p>
          <button onClick={handleOpenModal} className="create-first-btn">
            Liên kết ngay
          </button>
        </div>
      ) : (
        <>
          {/* Info banner */}
          <div className="info-banner">
            <p>
              📌 Bạn đã liên kết <strong>{linkedAccounts.length}/{MAX_LINKS}</strong> tài khoản
            </p>
          </div>

          {/* Cards grid */}
          <div className="cards-grid">
            {linkedAccounts.map((account) => (
              <div key={account._id} className="card-item">
                <div className="card-header">
                  <div className="bank-logo">🏦</div>
                  <div className="card-status active">Hoạt động</div>
                </div>
                <div className="card-body">
                  <div className="card-field">
                    <label>Ngân hàng</label>
                    <div className="card-bank-name">{account.bankName || 'Ngân hàng liên kết'}</div>
                  </div>
                  <div className="card-field">
                    <label>Số tài khoản</label>
                    <div className="card-number">{formatAccountNumber(account.bankAccountNumber)}</div>
                  </div>
                  <div className="card-field">
                    <label>Hạn mức nạp hôm nay</label>
                    <div className="card-balance">
                      {account.remainingDailyDepositLimit?.toLocaleString() ||
                        account.maxDailyDepositLimit?.toLocaleString() ||
                        'N/A'}{' '}
                      ₫
                    </div>
                    <small className="text-gray-500">
                      Tối đa: {account.maxDailyDepositLimit?.toLocaleString() || 'N/A'} ₫
                    </small>
                  </div>
                  <div className="card-field">
                    <label>Ngày liên kết</label>
                    <div className="card-date">
                      {new Date(account.linkedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="action-btn unlink-btn" onClick={() => handleUnlink(account._id)}>
                    🔗 Hủy liên kết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏦 Liên kết tài khoản ngân hàng</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {!otpRequested ? (
                <>
                  <div className="form-group">
                    <label>Số tài khoản ngân hàng</label>
                    <input
                      type="text"
                      placeholder="Nhập số tài khoản (chữ + số)"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.trim())}
                      className="form-input"
                      maxLength={30}
                    />
                    <small className="form-hint">{accountNumber.length}/30 ký tự</small>
                  </div>
                  <button
                    onClick={handleRequestOTP}
                    disabled={modalLoading || !accountNumber.trim()}
                    className="btn-primary"
                  >
                    {modalLoading ? 'Đang gửi...' : 'Gửi OTP'}
                  </button>
                </>
              ) : (
                <>
                  <div className="otp-info">
                    <p>📱 OTP đã được gửi đến số điện thoại đăng ký</p>
                    <p className="account-display">
                      Tài khoản: <strong>{formatAccountNumber(accountNumber)}</strong>
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Mã OTP</label>
                    <input
                      type="text"
                      placeholder="Nhập 6 số OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="form-input otp-input"
                      maxLength={6}
                    />
                    <small className="form-hint">{otp.length}/6 số</small>
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={handleVerifyOTP}
                      disabled={modalLoading || otp.length !== 6}
                      className="btn-primary"
                    >
                      {modalLoading ? 'Đang xác thực...' : 'Xác nhận'}
                    </button>
                    <button
                      onClick={() => setOtpRequested(false)}
                      disabled={modalLoading}
                      className="btn-secondary"
                    >
                      Gửi lại OTP
                    </button>
                  </div>
                </>
              )}
              {message && (
                <div
                  className={`modal-message ${
                    message.includes('thành công') || message.includes('gửi') ? 'success' : 'error'
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkBank;