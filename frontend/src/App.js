import React from 'react';
import { Routes, Route, useLocation} from 'react-router-dom';
import Register from './components/pages/users/Register';
import Login from './components/pages/users/Login';
import Welcome from './components/Welcome';
import Choose from './components/pages/admin/Choose';
import LinkBank from './components/pages/users/LinkBank';
import Saving from './components/pages/users/Saving';
import FundList from './components/pages/users/fundList';
import Admin from './components/pages/admin/Admin';
import TransactionHistory from './components/pages/users/TransactionHistory';
import ChatWidget from './components/ChatWidget';
import './App.css';


function App() {

const location = useLocation();
  const currentPath = location.pathname;
  
    // ChatWidget hiện ở mọi trang trừ login, register, choose, admin
  const showChat = !['/login', '/register', '/choose', '/admin', '/'].includes(currentPath);

  return (
    <>
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/choose" element={<Choose />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/link-bank" element={<LinkBank />} />
      <Route path="/" element={<Login />} />
      <Route path="/saving" element={<Saving />} />
      <Route path="/funds" element={<FundList />} />
<Route path="/history" element={<TransactionHistory />} />

    </Routes>
      {showChat && <ChatWidget />}
    </>
  );
}

export default App;