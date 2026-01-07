import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style/style.css';
function Welcome() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  
  const [selectedWallet, setSelectedWallet] = useState(null);
 const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
const [walletInfo, setWalletInfo] = useState({ balance: 0, currency: 'vnd', status: 'active', createdAt: '' });
  const [showFundForm, setShowFundForm] = useState(false);
  const [fundName, setFundName] = useState('');
  const [friendId, setFriendId] = useState('');
  const [creatingFund, setCreatingFund] = useState(false);
const [selectedLinkedBankId, setSelectedLinkedBankId] = useState('');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedDepositAccount, setSelectedDepositAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMessage, setDepositMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawAccount, setSelectedWithdrawAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isTransferProcessing, setIsTransferProcessing] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [isCheckingReceiver, setIsCheckingReceiver] = useState(false);
  const [receiverWallets, setReceiverWallets] = useState([]);
const [receiverWalletId, setReceiverWalletId] = useState('');
const [isLoadingReceiverWallets, setIsLoadingReceiverWallets] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);
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
    
  useEffect(() => {
    fetchWallets();
  }, [token]);
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
       await fetchWallets();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        'Không thể tạo ví'
      );
    }
  };
const handleDeleteWallet = async (walletId) => {
  if (!window.confirm('Bạn có chắc muốn xoá ví này không?')) return;

  try {
    await axios.delete(
      `http://localhost:5000/api/wallets/${walletId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Chỉ update UI sau khi BE xoá thành công
    setWallets(prev => prev.filter(w => w._id !== walletId));

  } catch (err) {
    console.error('DELETE WALLET ERROR:', err.response || err);
    alert(err.response?.data?.message || 'Không thể xoá ví');
  }
};

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

    const links = response.data.links || [];
    const activeLinks = links.filter(link => link.status === 'ACTIVE');

    setLinkedAccounts(activeLinks);

    console.log('LINKED ACCOUNTS RAW:', response.data);
    console.log('ACTIVE LINKS:', activeLinks);

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
  const handleOpenDeposit = (wallet) => {
  setSelectedWallet(wallet);
  setShowDepositModal(true);
  setSelectedDepositAccount('');
  fetchLinkedAccounts();
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
  const handleOpenWithdraw = (wallet) => {
  setSelectedWallet(wallet);
  setShowWithdrawModal(true);
  fetchLinkedAccounts();
  setSelectedWithdrawAccount('');
  setSelectedLinkedBankId(''); 
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
if (Number(withdrawAmount) > selectedWallet.balance) {
  setWithdrawMessage('Số dư ví không đủ');
  return;
}


    setIsProcessing(true);
    setWithdrawMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/withdraw`,
        {  walletId: selectedWallet._id,linkedBankId: selectedLinkedBankId, amount: Number(withdrawAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
const newBalance = response.data.data.wallet.balanceAfter;

  // 1️⃣ Update danh sách ví
  setWallets(prev =>
    prev.map(w =>
      w._id === selectedWallet._id
        ? { ...w, balance: newBalance }
        : w
    )
  );

  // 2️⃣ Update ví đang mở popup
  setSelectedWallet(prev => ({
    ...prev,
    balance: newBalance
  }));

  // ===============================
  // ⏱ Đóng popup
  // ===============================
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
const handleOpenTransfer = (wallet) => {
  setSelectedWallet(wallet);
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
  if (!transferPhone || transferPhone.length < 9) {
    setTransferMessage('Vui lòng nhập số điện thoại hợp lệ');
    return;
  }

  try {
    setIsCheckingReceiver(true);
    setTransferMessage('');
    setReceiverInfo(null);
    setReceiverWallets([]);
    setReceiverWalletId('');

    const token = localStorage.getItem('token');

    const res = await axios.post(
      `${API_BASE_URL}/wallet/check-receiver`,
      { phone: transferPhone },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReceiverInfo(res.data.receiver);
    setReceiverWallets(res.data.receiver.wallets);

  } catch (error) {
    console.error(error);
    setReceiverInfo(null);
    setReceiverWallets([]);
    setReceiverWalletId('');

    setTransferMessage(
      error.response?.data?.message ||
      'Không tìm thấy người nhận với số điện thoại này'
    );
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
const amount = Number(transferAmount);
const balance = Number(selectedWallet.balance);

console.log('TRANSFER CHECK', { amount, balance });

if (amount > balance) {
  setTransferMessage('Số dư ví không đủ');
  return;
}


    setIsTransferProcessing(true);
    setTransferMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/wallet/transfer`,
        { senderWalletId: selectedWallet._id,   // ✅ ví gửi duy nhất
    receiverWalletId,                     // ✅ ví nhận
    phone: transferPhone,
    amount: Number(transferAmount),
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

  const handleLinkBank = () => {
    navigate('/link-bank');
  };
return (

  <div className="page-container">

       {/* ===== HEADER ===== */}
    <div className="header">
      <h2>👋 Chào mừng {username}</h2>
      <button onClick={() => setShowFundForm(true)}>➕ Tạo quỹ chung</button>    <button onClick={() => navigate('/funds')}>
      👥 Quỹ chung
    </button>
    </div>

     {/* ===== USER ID ===== */}
    <div className="userIdBox">
      <span>ID của bạn:</span>
      <code className="userId">{userId || 'Không có ID'}</code>
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
     <ul className="walletList">
  {wallets.map(wallet => (
    <li key={wallet._id} className="walletItem">

      <span
        className="deleteIcon"
        onClick={() => handleDeleteWallet(wallet._id)}
      >
        🗑️
      </span>

      <p>
        <strong>Số dư:</strong>{' '}
        {(wallet.balance ?? 0).toLocaleString()} {wallet.currency}
      </p>

      <p><strong>Trạng thái:</strong> {wallet.status}</p>

      <p className="time">
        Tạo lúc:{' '}
        {wallet.create_at
          ? new Date(wallet.create_at).toLocaleString()
          : '—'}
      </p>

      {/* ===== NÚT RIÊNG CHO VÍ NÀY ===== */}
      <div className="wallet-actions">
        <button
          className="wallet-btn deposit"
          onClick={() => handleOpenDeposit(wallet)}
        >
          💰 Nạp tiền
        </button>

        <button
          className="wallet-btn withdraw"
          onClick={() => handleOpenWithdraw(wallet)}
        >
          🏦 Rút tiền
        </button>

        <button
          className="wallet-btn transfer"
          onClick={() => handleOpenTransfer(wallet)}
        >
          💸 Chuyển tiền
        </button>

        <button
          className="wallet-btn link"
          onClick={handleLinkBank}
        >
          🔗 Liên kết NH
        </button>
         <button className="wallet-btn saving" onClick={() =>
  navigate('/saving', {
    state: { walletId: wallet._id }
  })
}
>
    💼 Tiết kiệm
  </button>
      </div>

    </li>
  ))}
</ul>

    )}

    <button onClick={handleCreateWallet} className="mt-10">
      ➕ Tạo thêm ví
    </button>

    <hr className="divider" />

    <button onClick={handleLogout} className="logoutBtn">
      Đăng xuất
    </button>
        {/* ===== MODAL TẠO QUỸ ===== */}
    {showFundForm && (
      <div className="overlay">
        <div className="modal">
          <h3>➕ Tạo quỹ chung</h3>

          <input
            placeholder="Tên quỹ"
            value={fundName}
            onChange={e => setFundName(e.target.value)}
            className="input"
          />

          <input
            placeholder="ID người bạn"
            value={friendId}
            onChange={e => setFriendId(e.target.value)}
            className="input"
          />

          <div className="modal-actions">
            <button onClick={() => setShowFundForm(false)}>Huỷ</button>
            <button onClick={handleCreateFund} disabled={creatingFund}>
              {creatingFund ? 'Đang tạo...' : 'Tạo quỹ'}
            </button>
             
          </div>
        </div>
      </div>
    )}


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
                  onChange={(e) => {
  const selectedId = e.target.value;
  const selectedAcc = linkedAccounts.find(b => b._id === selectedId);

  setSelectedLinkedBankId(selectedId);                  // 👈 QUAN TRỌNG
  setSelectedWithdrawAccount(selectedAcc.bankAccountNumber);
}}

                  disabled={isProcessing}
                  className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {linkedAccounts.map((acc) => (
                    <option
  key={acc._id}
  value={acc._id}
  data-account={acc.bankAccountNumber}
>
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
                  Số dư hiện tại: {selectedWallet.balance.toLocaleString()} VND
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

        {/* ===== SĐT người nhận ===== */}
        <div className="request-info mb-4">
          <label className="block text-lg font-medium mb-2">
            Số điện thoại người nhận
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={transferPhone}
              onChange={handlePhoneChange}
              maxLength="11"
              disabled={isCheckingReceiver || isTransferProcessing}
              placeholder="Nhập số điện thoại"
              className="flex-1 p-3 border-2 rounded-lg"
            />

            <button
              onClick={handleCheckReceiver}
              disabled={isCheckingReceiver || transferPhone.length < 10}
              className={`px-4 py-3 rounded-lg font-medium ${
                isCheckingReceiver
                  ? 'bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isCheckingReceiver ? '...' : 'Kiểm tra'}
            </button>
          </div>
        </div>

        {/* ===== Thông tin người nhận ===== */}
        {receiverInfo && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-300">
            <p className="text-lg font-semibold text-green-800">
              {receiverInfo.username}
            </p>
            <p className="text-sm text-green-600">
              SĐT: {receiverInfo.phone}
            </p>
          </div>
        )}

        {/* ===== Dropdown ví người nhận ===== */}
        {receiverInfo && (
          <div className="request-info mb-4">
            <label className="block text-lg font-medium mb-2">
              Chọn ví người nhận
            </label>

            <select
              value={receiverWalletId}
              onChange={(e) => setReceiverWalletId(e.target.value)}
              disabled={isTransferProcessing}
              className="w-full p-3 border-2 rounded-lg"
            >
              <option value="">-- Chọn ví --</option>
              {receiverWallets.map(wallet => (
                <option key={wallet._id} value={wallet._id}>
                  {wallet.name || 'Ví chính'} • {wallet.balance.toLocaleString()} VND
                </option>
              ))}
            </select>

            {!receiverWalletId && (
              <p className="text-xs text-red-500 mt-1">
                Vui lòng chọn ví người nhận
              </p>
            )}
          </div>
        )}

        {/* ===== Nhập số tiền ===== */}
        <div className="request-info mb-4">
          <label className="block text-lg font-medium mb-2">
            Số tiền chuyển (VND)
          </label>

          <input
            type="text"
            value={formatVND(transferAmount)}
            onChange={handleTransferAmountChange}
            disabled={isTransferProcessing}
            className="w-full p-4 border-2 rounded-xl text-right text-2xl font-semibold"
          />

          <p className="text-sm text-gray-500 mt-1">
            Số dư hiện tại: {selectedWallet.balance.toLocaleString()} VND
          </p>
        </div>

        {/* ===== Nút xác nhận ===== */}
        <button
          onClick={handleTransferMoney}
          disabled={
            isTransferProcessing ||
            !receiverWalletId ||
            !transferAmount
          }
          className={`w-full py-4 rounded-xl font-semibold text-lg ${
            isTransferProcessing
              ? 'bg-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTransferProcessing ? 'Đang xử lý...' : 'Xác nhận chuyển tiền'}
        </button>

        {/* ===== Thông báo ===== */}
        {transferMessage && (
          <p className={`mt-4 text-center ${
            transferMessage.includes('thành công')
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {transferMessage}
          </p>
        )}

      </div>
    </div>
  </div>
)}


  </div>
);

}

export default Welcome;
