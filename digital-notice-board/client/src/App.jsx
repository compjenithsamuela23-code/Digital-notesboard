import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import DisplayBoard from './components/DisplayBoard';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import AdminHistory from './components/AdminHistory';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DisplayBoard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/history" element={<AdminHistory />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;