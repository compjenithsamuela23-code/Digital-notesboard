import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const DisplayBoard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const { socket } = useSocket();

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
      border: '#e2e8f0'
    },
    dark: {
      primary: '#818cf8',
      secondary: '#a78bfa',
      accent: '#34d399',
      background: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155'
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  useEffect(() => {
    fetchAnnouncements();
    
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
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
      }, 8000); // 8 seconds per slide
      return () => clearInterval(interval);
    }
  }, [isPlaying, announcements.length]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/announcements/public');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
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

  if (announcements.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '20px',
            color: theme.primary
          }}>
            📋
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            color: theme.text,
            marginBottom: '15px',
            fontWeight: '700'
          }}>
            Notice Board
          </h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.2rem',
            marginBottom: '30px',
            maxWidth: '500px'
          }}>
            No announcements at the moment. Check back soon!
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '12px 24px',
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.background,
      transition: 'all 0.3s ease',
      padding: '20px'
    }}>
      {/* Floating Controls */}
      <div style={{
        position: 'fixed',
        top: '25px',
        right: '25px',
        display: 'flex',
        gap: '12px',
        zIndex: 1000,
        backgroundColor: theme.card,
        padding: '12px',
        borderRadius: '50px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme.primary,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme.secondary,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Current Announcement Card */}
        <div style={{
          backgroundColor: theme.card,
          borderRadius: '25px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          {/* Header with gradient */}
          <div style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            padding: '35px 40px',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem'
                  }}>
                    📢
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      fontWeight: '500',
                      letterSpacing: '1px'
                    }}>
                      LIVE ANNOUNCEMENT
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      Slide {currentIndex + 1} of {announcements.length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{
                textAlign: 'right',
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '15px 20px',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  marginBottom: '5px'
                }}>
                  {new Date().toLocaleDateString('en-US', { 
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.9
                }}>
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ padding: '45px' }}>
            {/* Priority Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: theme.accent + '20',
              color: theme.accent,
              padding: '10px 20px',
              borderRadius: '50px',
              marginBottom: '25px',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: theme.accent,
                borderRadius: '50%'
              }} />
              PRIORITY LEVEL {currentAnnouncement.priority || 1}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '3.2rem',
              color: theme.text,
              marginBottom: '25px',
              fontWeight: '800',
              lineHeight: '1.2'
            }}>
              {currentAnnouncement.title}
            </h1>

            {/* Image if available */}
            {currentAnnouncement.image && (
              <div style={{
                marginBottom: '30px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={currentAnnouncement.image.startsWith('http') 
                    ? currentAnnouncement.image 
                    : `http://localhost:5001${currentAnnouncement.image}`}
                  alt="Announcement"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div style={{
              fontSize: '1.6rem',
              lineHeight: '1.8',
              color: theme.textSecondary,
              whiteSpace: 'pre-line',
              marginBottom: '40px'
            }}>
              {currentAnnouncement.content}
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '30px',
              borderTop: `1px solid ${theme.border}`
            }}>
              <button
                onClick={prevSlide}
                style={{
                  padding: '16px 32px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = theme.secondary;
                  e.currentTarget.style.transform = 'translateX(-5px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = theme.primary;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>←</span> Previous
              </button>

              {/* Progress Dots */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    style={{
                      width: currentIndex === index ? '30px' : '12px',
                      height: '12px',
                      borderRadius: '6px',
                      backgroundColor: currentIndex === index ? theme.primary : theme.border,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      padding: 0
                    }}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                style={{
                  padding: '16px 32px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = theme.secondary;
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = theme.primary;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                Next <span style={{ fontSize: '1.3rem' }}>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px',
          marginTop: '40px'
        }}>
          {announcements.slice(0, 3).map((ann, index) => (
            <div
              key={ann.id}
              onClick={() => setCurrentIndex(index)}
              style={{
                backgroundColor: theme.card,
                padding: '25px',
                borderRadius: '20px',
                cursor: 'pointer',
                border: `2px solid ${index === currentIndex ? theme.primary : 'transparent'}`,
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
              }}
            >
              {/* Priority Indicator */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '30px',
                height: '30px',
                backgroundColor: theme.primary,
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                {ann.priority}
              </div>

              <h3 style={{
                color: theme.text,
                marginBottom: '15px',
                fontSize: '1.3rem',
                fontWeight: '600',
                paddingRight: '40px'
              }}>
                {ann.title}
              </h3>
              
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.95rem',
                lineHeight: '1.5',
                marginBottom: '20px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {ann.content}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: theme.textSecondary
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: ann.isActive !== false ? theme.accent : '#ef4444',
                    borderRadius: '50%'
                  }} />
                  {ann.isActive !== false ? 'Active' : 'Inactive'}
                </div>
                <div>
                  {new Date(ann.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DisplayBoard;