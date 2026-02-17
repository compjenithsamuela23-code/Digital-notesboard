import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const DisplayBoard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [liveStatus, setLiveStatus] = useState('OFF');
  const [liveLink, setLiveLink] = useState(null);
  const [categories, setCategories] = useState([]);
  const [emergencyIndex, setEmergencyIndex] = useState(null);

  // helper to extract youtube id
  const getYouTubeID = (url) => {
    const r = /(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/;
    const m = url && url.match(r);
    return m ? m[1] : null;
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return null;
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  };

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/status');
        setLiveStatus(res.data.status || 'OFF');
        setLiveLink(res.data.link || null);
      } catch (err) {
        // ignore
      }
    };

    fetchLive();
    const iv = setInterval(fetchLive, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('liveUpdate', (data) => {
      setLiveStatus(data.status || 'OFF');
      setLiveLink(data.link || null);
    });
    return () => socket.off('liveUpdate');
  }, [socket]);

  // Color Themes
  const themes = {
    light: {
      primary: '#6366f1', // Indigo
      secondary: '#8b5cf6', // Violet
      accent: '#10b981', // Emerald
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      adminBtn: '#dc2626' // Red for admin button
    },
    dark: {
      primary: '#818cf8',
      secondary: '#a78bfa',
      accent: '#34d399',
      background: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      adminBtn: '#ef4444' // Red for admin button
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  // Clock and Weather (moved up so hooks order is stable)
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Attempt to fetch basic weather using IP-based location (best-effort)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const ipRes = await axios.get('https://ipapi.co/json/');
        const { latitude, longitude } = ipRes.data;
        if (latitude && longitude) {
          const w = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
          setWeather(w.data.current_weather || null);
        }
      } catch (err) {
        // ignore failures - show N/A
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchCategories();

    // Socket.io for real-time updates
    if (socket) {
      socket.on('announcementUpdate', (data) => {
        fetchAnnouncements(); // Refresh announcements on any update
      });
    }

    return () => {
      if (socket) {
        socket.off('announcementUpdate');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (isPlaying && announcements.length > 1) {
      // If an emergency announcement is active, don't auto-rotate
      if (emergencyIndex !== null) {
        return; // An emergency announcement is active — stop auto-rotation
      }

      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
      }, 8000); // 8 seconds per slide
      return () => clearInterval(interval);
    }
  }, [isPlaying, announcements.length, currentIndex, announcements, emergencyIndex]);

  // Ensure emergency announcement (priority 0) is shown first and blocks rotation
  useEffect(() => {
    if (!announcements || announcements.length === 0) {
      setEmergencyIndex(null);
      return;
    }

    const idx = announcements.findIndex(a => a && a.priority === 0);
    if (idx !== -1) {
      setEmergencyIndex(idx);
      // show emergency immediately
      setCurrentIndex(idx);
    } else {
      // no emergency present
      setEmergencyIndex(null);
      // ensure currentIndex is within bounds when emergency is removed
      setCurrentIndex(prev => Math.min(prev, Math.max(0, announcements.length - 1)));
    }
  }, [announcements]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/announcements/public');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const nextSlide = () => {
    if (announcements.length > 0) {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }
  };

  const prevSlide = () => {
    if (announcements.length > 0) {
      setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
    }
  };

  const handleAdminLogin = () => {
    navigate('/admin/login');
  };

  if (announcements.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: theme.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        padding: '20px',
        margin: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '800px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '20px',
            color: theme.primary
          }}>
          </div>
          <h1 style={{
            fontSize: '3rem',
            color: theme.text,
            marginBottom: '15px',
            fontWeight: '800'
          }}>
            Digital Notice Board
          </h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.3rem',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Welcome to the Digital Notice Board System. No announcements at the moment.
          </p>

          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '15px 30px',
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s',
                minWidth: '180px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button
              onClick={handleAdminLogin}
              style={{
                padding: '15px 30px',
                backgroundColor: theme.adminBtn,
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s',
                minWidth: '180px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Admin Login
            </button>
          </div>

          <div style={{
            marginTop: '50px',
            padding: '25px',
            backgroundColor: theme.card,
            borderRadius: '20px',
            maxWidth: '500px',
            margin: '50px auto 0',
            border: `1px solid ${theme.border}`
          }}>
            <p style={{
              color: theme.textSecondary,
              fontSize: '0.95rem',
              marginBottom: '10px'
            }}>
              <strong>Tip:</strong> This system supports real-time updates, image uploads, and priority-based announcements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex];

  // (moved above) clock/weather hooks are declared earlier to preserve hook order

  const isAdmin = !!localStorage.getItem('admin');

  const handleLogout = () => {
    localStorage.removeItem('admin');
    window.location.reload();
  };

  // Emergency mode: if emergencyIndex is not null, set red theme
  const isEmergency = emergencyIndex !== null;
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: isEmergency ? '#b91c1c' : theme.background,
      transition: 'all 0.3s ease',
      padding: 0,
      margin: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      boxSizing: 'border-box',
      color: isEmergency ? '#fff' : theme.text
    }}>
      {/* Top Bar */}
      <div style={{
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.background
      }}>
        {/* Left - Admin */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {isAdmin ? (
            <button onClick={handleLogout} style={{ padding: '10px 18px', backgroundColor: theme.adminBtn, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
          ) : (
            <button onClick={handleAdminLogin} style={{ padding: '10px 18px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Admin Login</button>
          )}
        </div>

        {/* Center - Title */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, color: isEmergency ? '#fff' : theme.text }}>
            {isEmergency ? '🚨 EMERGENCY NOTICE 🚨' : 'SMART NOTICE BOARD'}
          </h1>
        </div>

        {/* Right - Time / Date / Weather */}
        <div style={{ textAlign: 'right', minWidth: '220px' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{now.toLocaleTimeString()}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{now.toLocaleDateString()}</div>
          <div style={{ fontSize: '0.9rem', marginTop: '6px', color: theme.textSecondary }}>{weather ? `${weather.temperature}°C • Wind ${weather.windspeed}km/h` : 'Weather: N/A'}</div>
        </div>
      </div>

      {/* Main area: top spacer + bottom half split for video/announcement */}
      <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        {/* Top spacer (can be used for extra content) */}
        <div style={{ flex: 1 }} />

        {/* Bottom half - full-width split 50/50 */}
        <div style={{ height: '50vh', display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}>
          {/* Left: Live video - occupy entire half without card chrome */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
            {liveStatus === 'ON' && liveLink && getYouTubeID(liveLink) ? (
              <iframe
                title="Live Stream"
                src={`https://www.youtube.com/embed/${getYouTubeID(liveLink)}?autoplay=1&mute=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div style={{ color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', opacity: 0.6 }}></div>
                <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>No Live Broadcast</div>
              </div>
            )}
          </div>

          {/* Right: Announcement - full half, minimal framing */}
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: isEmergency ? '40px' : '28px',
            boxSizing: 'border-box',
            backgroundColor: isEmergency ? '#991b1b' : theme.card,
            border: isEmergency ? '6px solid #fff' : undefined,
            borderRadius: isEmergency ? '24px' : undefined,
            boxShadow: isEmergency ? '0 0 40px 10px #dc2626' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%'
            }}>
              <div style={{
                color: isEmergency ? '#fff' : theme.textSecondary,
                fontWeight: 900,
                marginBottom: '10px',
                fontSize: isEmergency ? '2.2rem' : '1.1rem',
                letterSpacing: isEmergency ? '2px' : undefined,
                textShadow: isEmergency ? '0 0 10px #dc2626, 0 0 20px #fff' : undefined,
                animation: isEmergency ? 'pulse 1.2s infinite' : undefined
              }}>
                {isEmergency ? 'EMERGENCY ANNOUNCEMENT' : `PRIORITY ${currentAnnouncement.priority || 1}`} {currentAnnouncement.category && getCategoryName(currentAnnouncement.category) ? `• ${getCategoryName(currentAnnouncement.category)}` : ''}
              </div>
              <h2 style={{
                fontSize: isEmergency ? '3.2rem' : '2.6rem',
                margin: '6px 0 20px',
                color: isEmergency ? '#fff' : theme.text,
                lineHeight: 1.05,
                textShadow: isEmergency ? '0 0 10px #fff, 0 0 20px #dc2626' : undefined,
                fontWeight: isEmergency ? 900 : 700
              }}>{currentAnnouncement.title}</h2>
              {currentAnnouncement.image && (
                <div style={{ marginBottom: '20px' }}>
                  <img src={currentAnnouncement.image.startsWith('http') ? currentAnnouncement.image : `http://localhost:5001${currentAnnouncement.image}`} alt="Announcement" style={{ width: '100%', height: 'auto', objectFit: 'contain', border: isEmergency ? '4px solid #fff' : undefined, boxShadow: isEmergency ? '0 0 20px #fff' : undefined }} />
                </div>
              )}
              <div style={{
                fontSize: isEmergency ? '2.1rem' : '1.6rem',
                color: isEmergency ? '#fff' : theme.textSecondary,
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                textShadow: isEmergency ? '0 0 10px #fff' : undefined,
                fontWeight: isEmergency ? 700 : 400,
                textAlign: 'center',
                padding: isEmergency ? '10px 0' : undefined
              }}>{currentAnnouncement.content}</div>
            </div>
            {isEmergency && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: 20,
                background: '#fff',
                color: '#b91c1c',
                fontWeight: 900,
                fontSize: '1.2rem',
                padding: '8px 18px',
                borderRadius: '12px',
                boxShadow: '0 0 10px #fff',
                letterSpacing: '1px',
                zIndex: 2
              }}>
                EMERGENCY MODE
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div style={{
          marginTop: '50px',
          textAlign: 'center',
          color: isEmergency ? '#fff' : theme.textSecondary,
          fontSize: '0.9rem',
          padding: '20px',
          borderTop: `1px solid ${isEmergency ? '#fff' : theme.border}`,
          width: '100%',
          background: isEmergency ? 'rgba(220,38,38,0.2)' : undefined
        }}>
          <p>Digital Notice Board System v2.0 • Real-time Updates • Image Support • Priority Management</p>
          <p style={{ marginTop: '10px', opacity: 0.7 }}>
            Click the <strong>Admin</strong> button to manage announcements
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default DisplayBoard;