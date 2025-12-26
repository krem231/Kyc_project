// src/pages/Users/Welcome.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/DepositModal.css';

function Welcome() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const [walletInfo, setWalletInfo] = useState({ balance: 0, currency: 'VND', status: 'ACTIVE', createdAt: '' });
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  // State cho popup nạp tiền
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedDepositAccount, setSelectedDepositAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMessage, setDepositMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // State cho popup rút tiền
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawAccount, setSelectedWithdrawAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== STATE CHO POPUP CHUYỂN TIỀN ===== 
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isTransferProcessing, setIsTransferProcessing] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [isCheckingReceiver, setIsCheckingReceiver] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    } else {
      fetchWalletInfo();
      fetchLinkedAccounts();
    }
  }, [navigate]);

  const fetchWalletInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletInfo(response.data.wallet);
    } catch (error) {
      console.error('Lỗi fetch wallet:', error);
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/link-bank/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeLinks = (response.data.links || []).filter(link => link.status === 'ACTIVE');
      setLinkedAccounts(activeLinks);
    } catch (error) {
      console.error('Lỗi fetch linked accounts:', error);
    }
  };

  // Hàm format số tiền VND (5.000.000)
  const formatVND = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/\./g, '');
    if (isNaN(number)) return value;
    return Number(number).toLocaleString('vi-VN');
  };

  // Xử lý khi người dùng nhập tiền nạp
  const handleDepositAmountChange = (e) => {
    let input = e.target.value.replace(/\./g, '');
    input = input.replace(/[^0-9]/g, '');
    setDepositAmount(input);
  };

  // Xử lý khi người dùng nhập tiền rút
  const handleWithdrawAmountChange = (e) => {
    let input = e.target.value.replace(/\./g, '');
    input = input.replace(/[^0-9]/g, '');
    setWithdrawAmount(input);
  };

  // ===== XỬ LÝ NHẬP TIỀN CHUYỂN =====
  const handleTransferAmountChange = (e) => {
    let input = e.target.value.replace(/\./g, '');
    input = input.replace(/[^0-9]/g, '');
    setTransferAmount(input);
  };

  // ===== XỬ LÝ NHẬP SỐ ĐIỆN THOẠI =====
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/[^0-9]/g, '');
    setTransferPhone(input);
    setReceiverInfo(null); // Reset receiver info khi đổi SĐT
    setTransferMessage(''); // Clear message
  };

  // ========== NẠP TIỀN ==========
  const handleOpenDeposit = () => {
    setShowDepositModal(true);
    setSelectedDepositAccount('');
    setDepositAmount('');
    setOtp('');
    setDepositMessage('');
    setOtpRequested(false);
    setTransactionId('');
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
  };

  const handleRequestDepositOTP = async () => {
    if (!selectedDepositAccount || !depositAmount || Number(depositAmount) <= 0) {
      setDepositMessage('Vui lòng chọn tài khoản và nhập số tiền hợp lệ');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/wallet/deposit/request`,
        { bankAccountNumber: selectedDepositAccount, amount: Number(depositAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDepositMessage(response.data.message || 'OTP đã được gửi đến điện thoại của bạn');
      setOtpRequested(true);
      setTransactionId(response.data.transactionId);
    } catch (error) {
      setDepositMessage(error.response?.data?.message || 'Lỗi khi yêu cầu OTP');
    }
  };

  const handleVerifyDepositOTP = async () => {
    if (!otp || otp.length !== 6) {
      setDepositMessage('Vui lòng nhập OTP 6 chữ số');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/wallet/deposit/verify`,
        { transactionId, otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDepositMessage(response.data.message);
      setWalletInfo(prev => ({ ...prev, balance: response.data.newBalance }));
      fetchWalletInfo();
      setTimeout(() => handleCloseDepositModal(), 2000);
    } catch (error) {
      setDepositMessage(error.response?.data?.message || 'OTP không hợp lệ hoặc giao dịch thất bại');
    }
  };

  // ========== RÚT TIỀN ==========
  const handleOpenWithdraw = () => {
    setShowWithdrawModal(true);
    setSelectedWithdrawAccount('');
    setWithdrawAmount('');
    setWithdrawMessage('');
    setIsProcessing(false);
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const handleWithdrawMoney = async () => {
    if (!selectedWithdrawAccount || !withdrawAmount || Number(withdrawAmount) <= 0) {
      setWithdrawMessage('Vui lòng chọn tài khoản và nhập số tiền hợp lệ');
      return;
    }

    if (Number(withdrawAmount) < 10000) {
      setWithdrawMessage('Số tiền rút tối thiểu là 10.000 VND');
      return;
    }

    if (Number(withdrawAmount) > walletInfo.balance) {
      setWithdrawMessage('Số dư ví không đủ');
      return;
    }

    setIsProcessing(true);
    setWithdrawMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/withdraw`,
        { accountNumber: selectedWithdrawAccount, amount: Number(withdrawAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWithdrawMessage(response.data.message || 'Rút tiền thành công!');
      
      if (response.data.data?.wallet?.balanceAfter !== undefined) {
        setWalletInfo(prev => ({ ...prev, balance: response.data.data.wallet.balanceAfter }));
      } else if (response.data.data?.walletBalance !== undefined) {
        setWalletInfo(prev => ({ ...prev, balance: response.data.data.walletBalance }));
      }
      
      fetchWalletInfo();
      setTimeout(() => handleCloseWithdrawModal(), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Lỗi khi rút tiền';
      setWithdrawMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== CHUYỂN TIỀN ==========
  const handleOpenTransfer = () => {
    setShowTransferModal(true);
    setTransferPhone('');
    setTransferAmount('');
    setTransferMessage('');
    setReceiverInfo(null);
    setIsTransferProcessing(false);
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setTransferPhone('');
    setTransferAmount('');
    setTransferMessage('');
    setReceiverInfo(null);
  };

  // Kiểm tra người nhận
  const handleCheckReceiver = async () => {
    if (!transferPhone || transferPhone.length < 10) {
      setTransferMessage('Vui lòng nhập đúng số điện thoại (10-11 số)');
      return;
    }

    setIsCheckingReceiver(true);
    setTransferMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/wallet/check-receiver`,
        { phone: transferPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReceiverInfo(response.data.receiver);
        setTransferMessage('✓ Đã xác nhận người nhận');
      }
    } catch (error) {
      setTransferMessage(error.response?.data?.message || 'Không tìm thấy người nhận');
      setReceiverInfo(null);
    } finally {
      setIsCheckingReceiver(false);
    }
  };

  const handleTransferMoney = async () => {
    // Validation
    if (!transferPhone || transferPhone.length < 10) {
      setTransferMessage('Vui lòng nhập đúng số điện thoại người nhận');
      return;
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferMessage('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (Number(transferAmount) < 1000) {
      setTransferMessage('Số tiền chuyển tối thiểu là 1.000 VND');
      return;
    }

    if (Number(transferAmount) > walletInfo.balance) {
      setTransferMessage('Số dư ví không đủ');
      return;
    }

    setIsTransferProcessing(true);
    setTransferMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/wallet/transfer`,
        { 
          phone: transferPhone, 
          amount: Number(transferAmount) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật số dư
      if (response.data.data?.senderBalanceAfter !== undefined) {
        setWalletInfo(prev => ({ ...prev, balance: response.data.data.senderBalanceAfter }));
      }
      
      fetchWalletInfo();
      
      // Hiển thị thông tin giao dịch
      if (response.data.data) {
        const { receiverUsername, receiverPhone, amount } = response.data.data;
        setTransferMessage(
          `✓ Chuyển ${amount.toLocaleString()} VND cho ${receiverUsername || receiverPhone} thành công!`
        );
      } else {
        setTransferMessage('✓ Chuyển tiền thành công!');
      }
      
      setTimeout(() => handleCloseTransferModal(), 3000);
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Lỗi khi chuyển tiền';
      setTransferMessage(errorMsg);
    } finally {
      setIsTransferProcessing(false);
    }
  };

  // ========== CÁC CHỨC NĂNG KHÁC ==========
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleLinkBank = () => {
    navigate('/link-bank');
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-lg max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Chào mừng {username}!</h1>

      <div className="wallet-section bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Ví điện tử của bạn</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-100 rounded-md">
            <p className="text-lg font-medium">Số dư:</p>
            <p className="text-2xl font-bold">{walletInfo.balance.toLocaleString()} {walletInfo.currency}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-md">
            <p className="text-lg font-medium">Trạng thái:</p>
            <p className="text-xl font-bold">{walletInfo.status}</p>
          </div>
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-lg font-medium">Tạo lúc:</p>
            <p className="text-lg">{new Date(walletInfo.createdAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleOpenDeposit}
            className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 font-medium"
          >
            💰 Nạp tiền vào ví
          </button>
          <button
            onClick={handleOpenWithdraw}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 font-medium"
          >
            🏦 Rút tiền về ngân hàng
          </button>
          <button
            onClick={handleOpenTransfer}
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 font-medium"
          >
            💸 Chuyển tiền
          </button>
          <button
            onClick={handleLinkBank}
            className="bg-purple-500 text-white px-6 py-3 rounded-md hover:bg-purple-600 font-medium"
          >
            🔗 Quản lý liên kết ngân hàng
          </button>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600"
      >
        Đăng xuất
      </button>

      {/* ========== POPUP NẠP TIỀN ========== */}
      {showDepositModal && (
        <div className="otp-overlay" onClick={handleCloseDepositModal}>
          <div className="otp-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseDepositModal}>✕</button>
            <div className="otp-header">
              <div className="otp-icon-large">💰</div>
              <h2>Nạp tiền vào ví</h2>
            </div>
            <div className="otp-content">
              <div className="request-info">
                <label className="block text-lg font-medium mb-2">Tài khoản nguồn:</label>
                <select
                  value={selectedDepositAccount}
                  onChange={(e) => setSelectedDepositAccount(e.target.value)}
                  disabled={otpRequested}
                  className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {linkedAccounts.map((acc) => (
                    <option key={acc._id} value={acc.bankAccountNumber}>
                      {acc.bankAccountNumber}
                    </option>
                  ))}
                </select>
              </div>

              {!otpRequested && (
                <div className="request-info mb-4">
                  <label className="block text-lg font-medium mb-2">Số tiền nạp (VND):</label>
                  <input
                    type="text"
                    value={formatVND(depositAmount)}
                    onChange={handleDepositAmountChange}
                    placeholder="0"
                    className="w-full p-4 border-2 border-gray-300 rounded-xl text-right text-3xl font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {depositAmount && (
                    <p className="text-right text-lg text-gray-600 mt-3">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(depositAmount))}
                    </p>
                  )}
                </div>
              )}

              {!otpRequested ? (
                <button
                  onClick={handleRequestDepositOTP}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-semibold text-lg shadow-lg"
                >
                  Gửi yêu cầu nạp tiền
                </button>
              ) : (
                <>
                  <div className="otp-code-section mb-6">
                    <label className="block text-lg font-medium mb-3 text-center">Nhập mã OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full p-5 border-2 border-gray-300 rounded-xl text-center text-4xl tracking-widest font-bold focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>
                  <button
                    onClick={handleVerifyDepositOTP}
                    className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 font-semibold text-lg shadow-lg"
                  >
                    Xác nhận nạp tiền
                  </button>
                </>
              )}

              {depositMessage && (
                <p className={`mt-6 text-center text-lg font-medium ${depositMessage.includes('thành công') || depositMessage.includes('gửi') ? 'text-green-600' : 'text-red-600'}`}>
                  {depositMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== POPUP RÚT TIỀN ========== */}
      {showWithdrawModal && (
        <div className="otp-overlay" onClick={handleCloseWithdrawModal}>
          <div className="otp-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseWithdrawModal}>✕</button>
            <div className="otp-header">
              <div className="otp-icon-large">🏦</div>
              <h2>Rút tiền về ngân hàng</h2>
            </div>
            <div className="otp-content">
              <div className="request-info">
                <label className="block text-lg font-medium mb-2">Tài khoản đích:</label>
                <select
                  value={selectedWithdrawAccount}
                  onChange={(e) => setSelectedWithdrawAccount(e.target.value)}
                  disabled={isProcessing}
                  className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {linkedAccounts.map((acc) => (
                    <option key={acc._id} value={acc.bankAccountNumber}>
                      {acc.bankAccountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="request-info mb-4">
                <label className="block text-lg font-medium mb-2">Số tiền rút (VND):</label>
                <input
                  type="text"
                  value={formatVND(withdrawAmount)}
                  onChange={handleWithdrawAmountChange}
                  placeholder="0"
                  disabled={isProcessing}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl text-right text-3xl font-semibold focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                {withdrawAmount && (
                  <p className="text-right text-lg text-gray-600 mt-3">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(withdrawAmount))}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Số dư hiện tại: {walletInfo.balance.toLocaleString()} VND
                </p>
              </div>

              <button
                onClick={handleWithdrawMoney}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
              </button>

              {withdrawMessage && (
                <p className={`mt-6 text-center text-lg font-medium ${withdrawMessage.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
                  {withdrawMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== POPUP CHUYỂN TIỀN ========== */}
      {showTransferModal && (
        <div className="otp-overlay" onClick={handleCloseTransferModal}>
          <div className="otp-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseTransferModal}>✕</button>
            
            <div className="otp-header">
              <div className="otp-icon-large">💸</div>
              <h2>Chuyển tiền</h2>
            </div>

            <div className="otp-content">
              {/* Số điện thoại người nhận */}
              <div className="request-info mb-4">
                <label className="block text-lg font-medium mb-2">Số điện thoại người nhận:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transferPhone}
                    onChange={handlePhoneChange}
                    placeholder="Nhập số điện thoại"
                    disabled={isTransferProcessing}
                    maxLength="11"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    onClick={handleCheckReceiver}
                    disabled={isCheckingReceiver || isTransferProcessing || transferPhone.length < 10}
                    className={`px-4 py-3 rounded-lg font-medium ${
                      isCheckingReceiver || isTransferProcessing || transferPhone.length < 10
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isCheckingReceiver ? '...' : 'Kiểm tra'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {transferPhone.length}/10-11 số
                </p>
              </div>

              {/* Hiển thị thông tin người nhận */}
              {receiverInfo && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✓</span>
                    <p className="text-sm font-medium text-green-700">Người nhận:</p>
                  </div>
                  <p className="text-xl font-bold text-green-800">
                    {receiverInfo.username}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    SĐT: {receiverInfo.phone}
                  </p>
                </div>
              )}

              {/* Số tiền chuyển */}
              <div className="request-info mb-4">
                <label className="block text-lg font-medium mb-2">Số tiền chuyển (VND):</label>
                <input
                  type="text"
                  value={formatVND(transferAmount)}
                  onChange={handleTransferAmountChange}
                  placeholder="0"
                  disabled={isTransferProcessing}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl text-right text-3xl font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                {transferAmount && (
                  <p className="text-right text-lg text-gray-600 mt-3">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(transferAmount))}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Số dư hiện tại: {walletInfo.balance.toLocaleString()} VND
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Số tiền tối thiểu: 1.000 VND
                </p>
              </div>

              {/* Nút xác nhận */}
              <button
                onClick={handleTransferMoney}
                disabled={isTransferProcessing || !transferPhone || !transferAmount}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg ${
                  isTransferProcessing || !transferPhone || !transferAmount
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isTransferProcessing ? 'Đang xử lý...' : 'Xác nhận chuyển tiền'}
              </button>

              {/* Thông báo */}
              {transferMessage && (
                <p className={`mt-6 text-center text-lg font-medium ${
                  transferMessage.includes('thành công') || transferMessage.includes('✓')
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transferMessage}
                </p>
              )}

              {/* Ghi chú */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Lưu ý:</strong>
                </p>
                <ul className="text-xs text-yellow-700 mt-2 ml-4 list-disc">
                  <li>Nhấn "Kiểm tra" để xác nhận thông tin người nhận</li>
                  <li>Kiểm tra kỹ số điện thoại người nhận trước khi chuyển</li>
                  <li>Giao dịch không thể hoàn tác sau khi thành công</li>
                  <li>Phí chuyển tiền: Miễn phí</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Welcome;
