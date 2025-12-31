// src/pages/TransactionHistory.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/UnifiedHistory.css';

function TransactionHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data
  const [allTransactions, setAllTransactions] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  // Filter
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  
  // Stats
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalSent: 0,
    totalReceived: 0,
    depositCount: 0,
    sentCount: 0,
    receivedCount: 0
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch all transactions with proper error handling
  const fetchAllTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch deposit history
      const depositRes = await axios.get(
        `${API_BASE_URL}/wallet/deposit/history?page=${currentPage}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch transfer history
      const transferRes = await axios.get(
        `${API_BASE_URL}/transactions/history?page=${currentPage}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const deposits = depositRes.data.transactions || [];
      const transfers = transferRes.data.transactions || [];

      // Transform deposit transactions
      const transformedDeposits = deposits.map(tx => ({
        ...tx,
        transactionType: 'DEPOSIT',
        direction: 'IN',
        displayType: 'Nạp tiền',
        icon: '💰',
        colorClass: 'deposit'
      }));

      // Transform transfer transactions
      const transformedTransfers = transfers.map(tx => ({
        ...tx,
        transactionType: 'TRANSFER',
        displayType: tx.role === 'SENDER' ? 'Chuyển tiền' : 'Nhận tiền',
        icon: tx.role === 'SENDER' ? '📤' : '📥',
        colorClass: tx.role === 'SENDER' ? 'sent' : 'received'
      }));

      // Merge and sort all transactions
      const merged = [...transformedDeposits, ...transformedTransfers]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllTransactions(merged);
      setTotalPages(Math.max(
        depositRes.data.pagination?.totalPages || 1,
        transferRes.data.pagination?.totalPages || 1
      ));

      // Calculate stats from fetched data instead of relying on backend stats
      const depositStats = transformedDeposits
        .filter(tx => tx.status === 'SUCCESS')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const sentStats = transformedTransfers
        .filter(tx => tx.role === 'SENDER' && tx.status === 'SUCCESS')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const receivedStats = transformedTransfers
        .filter(tx => tx.role === 'RECEIVER' && tx.status === 'SUCCESS')
        .reduce((sum, tx) => sum + tx.amount, 0);

      setStats({
        totalDeposit: depositStats,
        totalSent: sentStats,
        totalReceived: receivedStats,
        depositCount: transformedDeposits.filter(tx => tx.status === 'SUCCESS').length,
        sentCount: transformedTransfers.filter(tx => tx.role === 'SENDER' && tx.status === 'SUCCESS').length,
        receivedCount: transformedTransfers.filter(tx => tx.role === 'RECEIVER' && tx.status === 'SUCCESS').length
      });

    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.response?.data?.message || 'Không thể tải lịch sử giao dịch');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, navigate]);

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format money
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'SUCCESS': { text: 'Thành công', class: 'status-success', icon: '✓' },
      'FAILED': { text: 'Thất bại', class: 'status-failed', icon: '✗' },
      'PENDING': { text: 'Đang xử lý', class: 'status-pending', icon: '⏳' },
      'PENDING_OTP': { text: 'Chờ OTP', class: 'status-pending', icon: '⏳' },
      'PENDING_TRANSFER': { text: 'Đang chuyển', class: 'status-processing', icon: '🔄' }
    };
    const config = statusConfig[status] || { text: status, class: 'status-unknown', icon: '?' };
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = [...allTransactions];

    // Filter by type
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'DEPOSIT') {
        filtered = filtered.filter(tx => tx.transactionType === 'DEPOSIT');
      } else if (typeFilter === 'TRANSFER') {
        filtered = filtered.filter(tx => tx.transactionType === 'TRANSFER');
      } else if (typeFilter === 'SENT') {
        filtered = filtered.filter(tx => tx.transactionType === 'TRANSFER' && tx.role === 'SENDER');
      } else if (typeFilter === 'RECEIVED') {
        filtered = filtered.filter(tx => tx.transactionType === 'TRANSFER' && tx.role === 'RECEIVER');
      }
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'ALL') {
      const now = new Date();
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.createdAt);
        const diffDays = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'TODAY':
            return diffDays === 0;
          case 'WEEK':
            return diffDays <= 7;
          case 'MONTH':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Render transaction card with null safety
  const renderTransactionCard = (tx) => {
    // Generate safe transaction ID
    const txId = tx.id || tx._id || 'unknown';
    const displayId = typeof txId === 'string' ? txId.slice(-8).toUpperCase() : 'N/A';

    if (tx.transactionType === 'DEPOSIT') {
      return (
        <div key={txId} className={`transaction-card ${tx.colorClass}`}>
          <div className="transaction-icon-wrapper">
            <span className="transaction-icon">{tx.icon}</span>
          </div>
          
          <div className="transaction-content">
            <div className="transaction-header">
              <div className="transaction-main-info">
                <h3 className="transaction-title">{tx.displayType}</h3>
                <p className="transaction-subtitle">
                  Từ tài khoản: {tx.bankAccountNumber || 'N/A'}
                </p>
              </div>
              <div className="transaction-amount positive">
                +{formatMoney(tx.amount)}
              </div>
            </div>

            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Mã GD:</span>
                <span className="detail-value">{displayId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">{formatDate(tx.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                {getStatusBadge(tx.status)}
              </div>
            </div>

            {tx.status === 'SUCCESS' && (
              <div className="transaction-footer success">
                <span className="footer-icon">✓</span>
                <span>Tiền đã được cộng vào ví</span>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // TRANSFER transaction with null safety
      const isSender = tx.role === 'SENDER';
      const receiverUsername = tx.receiver?.username || 'N/A';
      const receiverPhone = tx.receiver?.phone || '';
      const senderUsername = tx.sender?.username || 'N/A';
      const senderPhone = tx.sender?.phone || '';
      const transactionId = tx.transactionId || displayId;
      
      return (
        <div key={txId} className={`transaction-card ${tx.colorClass}`}>
          <div className="transaction-icon-wrapper">
            <span className="transaction-icon">{tx.icon}</span>
          </div>
          
          <div className="transaction-content">
            <div className="transaction-header">
              <div className="transaction-main-info">
                <h3 className="transaction-title">{tx.displayType}</h3>
                <p className="transaction-subtitle">
                  {isSender ? (
                    <>
                      <span className="label">Đến: </span>
                      <span className="name">{receiverUsername}</span>
                      {receiverPhone && <span className="phone"> ({receiverPhone})</span>}
                    </>
                  ) : (
                    <>
                      <span className="label">Từ: </span>
                      <span className="name">{senderUsername}</span>
                      {senderPhone && <span className="phone"> ({senderPhone})</span>}
                    </>
                  )}
                </p>
              </div>
              <div className={`transaction-amount ${isSender ? 'negative' : 'positive'}`}>
                {isSender ? '-' : '+'}
                {formatMoney(tx.amount)}
              </div>
            </div>

            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Mã GD:</span>
                <span className="detail-value">{transactionId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">{formatDate(tx.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                {getStatusBadge(tx.status)}
              </div>
            </div>

            {tx.status === 'SUCCESS' && (
              <div className={`transaction-footer ${isSender ? 'sent' : 'received'}`}>
                <span className="footer-icon">{isSender ? '📤' : '📥'}</span>
                <span>
                  {isSender 
                    ? `Đã chuyển đến ${receiverUsername}`
                    : `Đã nhận từ ${senderUsername}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="unified-history-container">
      {/* Header */}
      <div className="history-header">
        <button onClick={() => navigate('/welcome')} className="back-button">
          ← Quay lại
        </button>
        <h1 className="history-title">
          <span className="title-icon">📊</span>
          Lịch sử giao dịch
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card deposit-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Tổng nạp tiền</p>
            <p className="stat-value-money">{formatMoney(stats.totalDeposit)}</p>
            <p className="stat-count">{stats.depositCount} giao dịch</p>
          </div>
        </div>

        <div className="stat-card sent-card">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <p className="stat-label">Tổng đã gửi</p>
            <p className="stat-value-money">{formatMoney(stats.totalSent)}</p>
            <p className="stat-count">{stats.sentCount} giao dịch</p>
          </div>
        </div>

        <div className="stat-card received-card">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <p className="stat-label">Tổng đã nhận</p>
            <p className="stat-value-money">{formatMoney(stats.totalReceived)}</p>
            <p className="stat-count">{stats.receivedCount} giao dịch</p>
          </div>
        </div>

        <div className="stat-card balance-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <p className="stat-label">Chênh lệch</p>
            <p className={`stat-value-money ${(stats.totalDeposit + stats.totalReceived - stats.totalSent) >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(stats.totalDeposit + stats.totalReceived - stats.totalSent)}
            </p>
            <p className="stat-count">Nạp + Nhận - Gửi</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">Loại GD:</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả</option>
            <option value="DEPOSIT">💰 Nạp tiền</option>
            <option value="TRANSFER">💸 Chuyển khoản</option>
            <option value="SENT">📤 Đã gửi</option>
            <option value="RECEIVED">📥 Đã nhận</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="PENDING">Đang xử lý</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Thời gian:</label>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả</option>
            <option value="TODAY">Hôm nay</option>
            <option value="WEEK">7 ngày qua</option>
            <option value="MONTH">30 ngày qua</option>
          </select>
        </div>

        <button onClick={fetchAllTransactions} className="refresh-button">
          🔄 Làm mới
        </button>
      </div>

      {/* Content */}
      <div className="history-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Đang tải lịch sử...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchAllTransactions} className="retry-button">
              Thử lại
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Chưa có giao dịch</h3>
            <p>Các giao dịch của bạn sẽ xuất hiện tại đây</p>
            <button onClick={() => navigate('/welcome')} className="empty-action-button">
              Thực hiện giao dịch
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="result-summary">
              <p>Hiển thị {filteredTransactions.length} giao dịch</p>
            </div>

            {/* Transactions List */}
            <div className="transactions-list">
              {filteredTransactions.map(tx => renderTransactionCard(tx))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ← Trước
                </button>
                
                <div className="pagination-info">
                  <span className="page-number">
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="history-footer">
        <button 
          onClick={() => navigate('/welcome')} 
          className="footer-button primary"
        >
          💰 Nạp tiền
        </button>
        <button 
          onClick={() => navigate('/welcome')} 
          className="footer-button secondary"
        >
          💸 Chuyển tiền
        </button>
        <button 
          onClick={() => window.print()} 
          className="footer-button tertiary"
        >
          🖨️ In lịch sử
        </button>
      </div>
    </div>
  );
}

export default TransactionHistory;