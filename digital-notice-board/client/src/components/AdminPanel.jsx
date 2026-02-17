import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const AdminPanel = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 1,
    duration: 7,
    isActive: true,
    category: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 16);
    })()
  });
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const [liveLinkInput, setLiveLinkInput] = useState('');
  const [liveStatus, setLiveStatus] = useState('OFF');
  const [liveLink, setLiveLink] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchAnnouncements();
    fetchLiveStatus();
    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    if (!socket) return;
    socket.on('liveUpdate', (data) => {
      setLiveStatus(data.status || 'OFF');
      setLiveLink(data.link || null);
    });

    return () => {
      socket.off('liveUpdate');
    };
  }, [socket]);

  const fetchLiveStatus = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/status');
      setLiveStatus(res.data.status || 'OFF');
      setLiveLink(res.data.link || null);
    } catch (err) {
      console.error('Error fetching live status', err);
    }
  };

  const startLive = async () => {
    if (!liveLinkInput) {
      alert('Paste YouTube Link!');
      return;
    }
    try {
      await axios.post('http://localhost:5001/api/start', { link: liveLinkInput });
      setLiveStatus('ON');
      setLiveLink(liveLinkInput);
      setLiveLinkInput('');
      alert('LIVE STARTED');
    } catch (err) {
      console.error('Error starting live', err);
      alert('Failed to start live');
    }
  };

  const stopLive = async () => {
    try {
      await axios.post('http://localhost:5001/api/stop');
      setLiveStatus('OFF');
      setLiveLink(null);
      alert('LIVE STOPPED');
    } catch (err) {
      console.error('Error stopping live', err);
      alert('Failed to stop live');
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

  const addCategory = async () => {
    if (!newCategory.trim()) {
      alert('Enter category name');
      return;
    }
    try {
      await axios.post('http://localhost:5001/api/categories', { name: newCategory });
      setNewCategory('');
      fetchCategories();
      alert('Category added');
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('priority', formData.priority.toString());
      data.append('duration', formData.duration.toString());
      data.append('active', formData.isActive.toString());
      data.append('category', formData.category);
      data.append('startAt', formData.startAt);
      data.append('endAt', formData.endAt);
      
      if (image) {
        data.append('image', image);
      }

      if (editingId) {
        await axios.put(`http://localhost:5001/api/announcements/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5001/api/announcements', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      resetForm();
      fetchAnnouncements();
      setImagePreview(null);
      alert(`Announcement ${editingId ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving announcement:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.error || 'Error saving announcement. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axios.delete(`http://localhost:5001/api/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting announcement');
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      duration: announcement.duration || 7,
      isActive: announcement.isActive !== false,
      category: announcement.category || '',
      startAt: announcement.startAt ? new Date(announcement.startAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endAt: announcement.endAt ? new Date(announcement.endAt).toISOString().slice(0, 16) : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 16); })()
    });
    setImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      priority: 1,
      duration: 7,
      isActive: true,
      category: '',
      startAt: new Date().toISOString().slice(0, 16),
      endAt: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 16); })()
    });
    setImage(null);
    setImagePreview(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userEmail');
    navigate('/admin/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#0f172a',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
              Admin Panel
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1rem' }}>
              Manage Announcements & Content
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(96, 165, 250, 0.2)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              Admin
            </span>
            <button
              onClick={() => navigate('/admin/history')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              Announcement History
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              View Display
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '30px 20px',
        minHeight: 'calc(100vh - 80px)'
      }}>
        {/* Form Card */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          marginBottom: '40px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            color: '#ffffff', 
            fontSize: '1.8rem',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {editingId ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Paste YouTube Link to broadcast"
              value={liveLinkInput}
              onChange={(e) => setLiveLinkInput(e.target.value)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="button"
              onClick={startLive}
              style={{ padding: '12px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              Start Live
            </button>
            <button
              type="button"
              onClick={stopLive}
              style={{ padding: '12px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              Stop Live
            </button>
            <div style={{ color: '#94a3b8', marginLeft: '10px', fontSize: '0.95rem' }}>
              Status: {liveStatus}
            </div>
          </div>

          {/* Category Management */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#e2e8f0', marginBottom: '15px' }}>
              Manage Categories
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="button"
                onClick={addCategory}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Add
              </button>
            </div>
            {categories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    {cat.name}
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 0,
                        marginLeft: '5px'
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  appearance: 'none'
                }}
              >
                <option value="">Select category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1e293b' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s'
                }}
                placeholder="Enter announcement title"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}>
                Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="5"
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  transition: 'all 0.3s'
                }}
                placeholder="Enter announcement content"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            {/* Image Upload Field */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}>
                Upload Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '2px dashed #475569',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#94a3b8',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#475569'}
              />
              {imagePreview && (
                <div style={{ marginTop: '15px' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      borderRadius: '12px',
                      border: '2px solid #475569'
                    }} 
                  />
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>
                    Image will be displayed on the notice board
                  </p>
                </div>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '25px', 
              marginBottom: '25px' 
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '2px solid #334155',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s',
                    appearance: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                >
                  <option value={0} style={{ backgroundColor: '#1e293b' }}>
                    Emergency (Stays until removed)
                  </option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num} style={{ backgroundColor: '#1e293b' }}>
                      {num === 1 ? 'Priority 1 (Highest)' : 
                       num === 2 ? 'Priority 2' :
                       num === 3 ? 'Priority 3' :
                       num === 4 ? 'Priority 4' :
                       'Priority 5 (Lowest)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}>
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '2px solid #334155',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            {/* Start and End DateTime Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}>
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '2px solid #334155',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}>
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '2px solid #334155',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '35px',
              padding: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ 
                  marginRight: '15px',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="isActive" style={{ 
                cursor: 'pointer',
                color: '#e2e8f0',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                <span style={{ color: formData.isActive ? '#10b981' : '#94a3b8' }}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span> - Visible on display board
              </label>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '18px 36px',
                  background: loading 
                    ? '#475569' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1,
                  justifyContent: 'center'
                }}
                onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => !loading && (e.target.style.transform = 'translateY(0)')}
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}></span>
                    Saving...
                  </>
                ) : (
                  <>
                    {editingId ? 'Update Announcement' : 'Create Announcement'}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '18px 36px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={e => {
                    e.target.style.color = '#e2e8f0';
                    e.target.style.borderColor = '#64748b';
                    e.target.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.color = '#94a3b8';
                    e.target.style.borderColor = '#475569';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <span>❌</span>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#ffffff', 
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              All Announcements <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>{announcements.length}</span>
            </h2>
            
            {announcements.length > 0 && (
              <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Click on any announcement to edit
              </div>
            )}
          </div>

          {announcements.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px',
              border: '2px dashed #475569',
              borderRadius: '15px',
              backgroundColor: 'rgba(15, 23, 42, 0.3)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>
                📭
              </div>
              <h3 style={{ color: '#e2e8f0', marginBottom: '15px' }}>
                No Announcements Yet
              </h3>
              <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
                Create your first announcement using the form above. 
                It will appear here and on the public display board.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '25px'
            }}>
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: `2px solid ${ann.isActive !== false ? '#334155' : '#475569'}`,
                    transition: 'all 0.3s',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(ann)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = ann.isActive !== false ? '#3b82f6' : '#94a3b8';
                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = ann.isActive !== false ? '#334155' : '#475569';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Emergency Button */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newPriority = ann.priority === 0 ? 1 : 0;
                      const form = new FormData();
                      form.append('priority', newPriority);
                      form.append('title', ann.title);
                      form.append('content', ann.content);
                      form.append('duration', ann.duration);
                      form.append('isActive', ann.isActive);
                      form.append('category', ann.category || '');
                      form.append('startAt', ann.startAt || '');
                      form.append('endAt', ann.endAt || '');
                      try {
                        await axios.put(`http://localhost:5001/api/announcements/${ann.id}`, form, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        fetchAnnouncements();
                        alert(newPriority === 0 ? 'Marked as Emergency!' : 'Emergency removed.');
                      } catch (err) {
                        alert('Failed to update emergency status.');
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 15,
                      left: 15,
                      backgroundColor: ann.priority === 0 ? '#b91c1c' : '#f59e42',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      zIndex: 2,
                      boxShadow: ann.priority === 0 ? '0 0 10px #b91c1c' : '0 0 6px #f59e42',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = ann.priority === 0 ? '#991b1b' : '#fbbf24'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ann.priority === 0 ? '#b91c1c' : '#f59e42'}
                  >
                    {ann.priority === 0 ? 'Unset Emergency' : 'Mark as Emergency'}
                  </button>
                  {/* Priority Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    {ann.priority}
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: ann.isActive !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: ann.isActive !== false ? '#10b981' : '#ef4444',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    marginBottom: '20px',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: ann.isActive !== false ? '#10b981' : '#ef4444',
                      borderRadius: '50%'
                    }} />
                    {ann.isActive !== false ? 'Active' : 'Inactive'}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    color: '#ffffff',
                    marginBottom: '15px',
                    fontSize: '1.4rem',
                    fontWeight: '600',
                    paddingRight: '50px',
                    minHeight: '60px'
                  }}>
                    {ann.title}
                  </h3>

                  {/* Image Thumbnail if available */}
                  {ann.image && (
                    <div style={{
                      marginBottom: '15px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '120px',
                      border: '1px solid #334155'
                    }}>
                      <img
                        src={ann.image.startsWith('http')
                          ? ann.image
                          : `http://localhost:5001${ann.image}`}
                        alt="Thumbnail"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}

                  {/* Content Preview */}
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '70px'
                  }}>
                    {ann.content}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '20px',
                    borderTop: '1px solid #334155'
                  }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(ann);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ann.id);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0f172a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;