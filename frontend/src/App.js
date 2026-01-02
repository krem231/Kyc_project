import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/pages/users/Register';
import Login from './components/pages/users/Login';
import Welcome from './components/Welcome';
import Choose from './components/pages/admin/Choose';
import LinkBank from './components/pages/users/LinkBank';
import Saving from './components/pages/users/Saving';
import FundList from './components/pages/users/fundList';
import Admin from './components/pages/admin/Admin';
import './App.css';


function App() {
  return (
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

    </Routes>
  );
}

export default App;