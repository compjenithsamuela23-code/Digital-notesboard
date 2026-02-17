import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/history');
      setHistory(res.data);
    } catch (err) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 16 }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            padding: '10px 22px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            marginRight: '18px',
            fontSize: '1rem',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Back to Admin Panel
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Announcement History</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: 'white',
            fontWeight: '500',
            fontSize: '1rem',
            marginLeft: 12
          }}
        >
          <option value="all">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="restored">Restored</option>
        </select>
        <input
          type="text"
          placeholder="Search by title or content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: 'white',
            fontWeight: '500',
            fontSize: '1rem',
            marginLeft: 12,
            minWidth: 220
          }}
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : history.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '1.2rem' }}>No announcement history yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
          {history
            .filter(item =>
              (filter === 'all' || item.action === filter) &&
              (item.title?.toLowerCase().includes(search.toLowerCase()) || item.content?.toLowerCase().includes(search.toLowerCase()))
            )
            .map((item, idx) => (
            <div key={item.id + (item.actionAt || item.deletedAt || idx)} style={{ background: '#1e293b', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8 }}>{item.title}</div>
              <div style={{ color: '#94a3b8', marginBottom: 8 }}>{item.content}</div>
              {item.image && (
                <img src={item.image.startsWith('http') ? item.image : `http://localhost:5001${item.image}`} alt="Announcement" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
              )}
              <div style={{ color: item.action === 'created' ? '#22d3ee' : item.action === 'updated' ? '#facc15' : item.action === 'deleted' ? '#38bdf8' : '#10b981', marginBottom: 8 }}>
                {item.action ? item.action.charAt(0).toUpperCase() + item.action.slice(1) : 'Action'}: {new Date(item.actionAt || item.deletedAt).toLocaleString()}
                {item.user && (
                  <span style={{ color: '#f472b6', marginLeft: 10, fontWeight: 500 }}>
                    by {item.user}
                  </span>
                )}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Originally created: {new Date(item.createdAt).toLocaleString()}</div>
              <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Priority: {item.priority}</div>
              <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Category: {item.category || 'None'}</div>
              {/* Restore button for deleted announcements */}
              {item.action === 'deleted' && (
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:5001/api/history/restore/${item.id}`);
                      fetchHistory();
                      alert('Announcement restored!');
                    } catch (err) {
                      alert('Failed to restore announcement.');
                    }
                  }}
                  style={{
                    marginTop: 12,
                    padding: '8px 18px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
