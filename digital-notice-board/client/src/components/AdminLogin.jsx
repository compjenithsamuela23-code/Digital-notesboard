import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      console.log('Login response:', response.data);

      if (response.data.success || response.data.message === 'Login successful') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('userEmail', email);
        navigate('/admin');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '2.5rem'
          }}>
          </div>
          <h1 style={{
            color: '#ffffff',
            marginBottom: '10px',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            Admin Portal
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem'
          }}>
            Digital Notice Board Management System
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#e2e8f0',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '2px solid #334155',
                borderRadius: '10px',
                fontSize: '16px',
                color: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              placeholder="Enter admin email"
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#e2e8f0',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '2px solid #334155',
                borderRadius: '10px',
                fontSize: '16px',
                color: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              placeholder="Enter your password"
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '25px',
              fontSize: '14px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}></span>
                Authenticating...
              </>
            ) : (
              <>
                Access Admin Panel
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          paddingTop: '25px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid #475569',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.3s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              e.target.style.color = '#e2e8f0';
              e.target.style.borderColor = '#64748b';
            }}
            onMouseLeave={e => {
              e.target.style.color = '#94a3b8';
              e.target.style.borderColor = '#475569';
            }}
          >
            <span>←</span>
            Back to Notice Board
          </button>
          
          <p style={{
            color: '#64748b',
            fontSize: '0.85rem',
            marginTop: '20px',
            lineHeight: '1.5'
          }}>
            <strong>Note:</strong> Contact system administrator if you need access credentials.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;