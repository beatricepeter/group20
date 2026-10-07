import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { refreshVisitors } from '../lib/db';
import useIdleRefresh from '../hooks/useIdleRefresh';
import '../styles/DashboardPage.css';

export default function DashboardPage({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    todayVisitors: 0,
    activeVisitors: 0
  });

  const currentRole = role || user?.role || 'admin';
  const panelTitle = currentRole === 'admin' ? 'Admin Panel' : 'Reception Desk';
  const canViewVisitors = user?.role === 'admin' || user?.permissions?.includes('visitors.view');
  const canRegisterVisitors = user?.role === 'admin' || user?.permissions?.includes('visitors.register');

  const parseDateTime = (value) => {
    const text = String(value || '');
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text.replace(' ', 'T')}+03:00`);
  };

  const recentVisitors = [...visitors]
    .sort((firstVisitor, secondVisitor) => parseDateTime(secondVisitor.checkInDate) - parseDateTime(firstVisitor.checkInDate))
    .slice(0, 5);

  const loadDashboard = async () => {
    if (!canViewVisitors) return;
    const savedVisitors = await refreshVisitors();
    setVisitors(savedVisitors);

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Dar_es_Salaam',
    }).format(new Date());
    const todayVisitors = savedVisitors.filter(v =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(parseDateTime(v.checkInDate)) === today
    );
    const activeVisitors = savedVisitors.filter(v => !v.checkOutDate);

    setStats({
      totalVisitors: savedVisitors.length,
      todayVisitors: todayVisitors.length,
      activeVisitors: activeVisitors.length
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useIdleRefresh(loadDashboard);

  const formatDateTime = (dateString) => {
    const date = parseDateTime(dateString);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', { ...options, timeZone: 'Africa/Dar_es_Salaam' });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}! </h1>
          <p>{panelTitle}</p>
        </div>

        {canViewVisitors && <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-info">
              <h3>{stats.totalVisitors}</h3>
              <p>Total Visitors</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-info">
              <h3>{stats.todayVisitors}</h3>
              <p>Today's Visitors</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-info">
              <h3>{stats.activeVisitors}</h3>
              <p>Active Visitors</p>
            </div>
          </div>
        </div>}

        <div className="dashboard-actions">
          {canRegisterVisitors && (
            <button
              className="action-btn primary"
              onClick={() => navigate('/register')}
            >
               Register New Visitor
            </button>
          )}
          {canViewVisitors && (
            <button
              className="action-btn secondary"
              onClick={() => navigate('/visitors')}
            >
               View All Visitors
            </button>
          )}
        </div>

        {canViewVisitors && <div className="recent-section">
          <h2>Recent Visitors</h2>
          {visitors.length === 0 ? (
            <p className="no-data">No visitors registered yet</p>
          ) : (
            <div className="recent-list">
              {recentVisitors.map(visitor => (
                <div key={visitor.id} className="recent-item">
                  <div className="visitor-info">
                    <strong>{visitor.fullName}</strong>
                    <span className="phone">{visitor.phone}</span>
                  </div>
                  <div className="visitor-date">
                    {formatDateTime(visitor.checkInDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}
