import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { refreshVisitors, checkoutVisitor, deleteVisitor } from '../lib/db';
import useIdleRefresh from '../hooks/useIdleRefresh';
import '../styles/VisitorsPage.css';

export default function VisitorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPermission = (permission) => (
    user?.role === 'admin' || user?.permissions?.includes(permission) || (permission === 'visitors.delete' && Boolean(user?.canDeleteVisitors))
  );
  const canRegisterVisitors = hasPermission('visitors.register');
  const canDeleteVisitors = hasPermission('visitors.delete');
  const canViewVisitorDetails = user?.role === 'admin' || hasPermission('visitors.view');
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [error, setError] = useState('');

  const parseDateTime = (value) => {
    const text = String(value || '');
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text.replace(' ', 'T')}+03:00`);
  };

  const getVisitorCheckInDate = (visitor) => visitor?.checkInDate || visitor?.visitorDate;

  const getLocalDateKey = (value) => {
    const date = parseDateTime(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(date);
  };

  const getWeekdayName = (value) => {
    const date = parseDateTime(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'Africa/Dar_es_Salaam'
    });
  };

  // Helper function to format date with time
  const formatDateTime = (dateString) => {
    const date = parseDateTime(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
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

  const filteredVisitors = (() => {
    let result = visitors;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(v =>
        v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone.includes(searchTerm) ||
        (v.personToVisit || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fromDate || toDate) {
      result = result.filter((visitor) => {
        const visitorDate = getLocalDateKey(getVisitorCheckInDate(visitor));
        return visitorDate && (!fromDate || visitorDate >= fromDate) && (!toDate || visitorDate <= toDate);
      });
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter(v => !v.checkOutDate);
    } else if (filterStatus === 'checked-out') {
      result = result.filter(v => v.checkOutDate);
    }

    return [...result].sort((firstVisitor, secondVisitor) => {
      const firstIsCheckedOut = Boolean(firstVisitor.checkOutDate);
      const secondIsCheckedOut = Boolean(secondVisitor.checkOutDate);

      if (firstIsCheckedOut !== secondIsCheckedOut) {
        return Number(firstIsCheckedOut) - Number(secondIsCheckedOut);
      }

      return parseDateTime(secondVisitor.checkInDate) - parseDateTime(firstVisitor.checkInDate);
    });
  })();

  const loadVisitors = async () => {
    const latestVisitors = await refreshVisitors();
    setVisitors(latestVisitors);
    setSelectedVisitor((selected) => selected
      ? latestVisitors.find((visitor) => visitor.id === selected.id) || null
      : null);
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  useIdleRefresh(loadVisitors);

  const handleCheckOut = async (id) => {
    setError('');
    try {
      const updated = await checkoutVisitor(id);
      setVisitors((prev) => prev.map((v) => (v.id === id ? updated : v)));
      setSelectedVisitor(null);
    } catch (err) {
      setError(err.message || 'Unable to check out this visitor.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this visitor?')) return;
    setError('');
    try {
      await deleteVisitor(id);
      setVisitors((prev) => prev.filter((v) => v.id !== id));
      setSelectedVisitor(null);
    } catch (err) {
      setError(err.message || 'Unable to delete this visitor.');
    }
  };

  return (
    <div className="visitors-container">
      <div className="visitors-header">
        <h1> Visitors List</h1>
        {canRegisterVisitors && (
          <button
            className="btn-new"
            onClick={() => navigate('/register')}
          >
             New Visitor
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="visitors-controls">
        <input
          type="text"
          className="search-box"
          placeholder="Search by name, phone, or employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({visitors.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({visitors.filter(v => !v.checkOutDate).length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'checked-out' ? 'active' : ''}`}
            onClick={() => setFilterStatus('checked-out')}
          >
            Checked Out ({visitors.filter(v => v.checkOutDate).length})
          </button>
          <div className="date-filter">
            <label>
              <span>From</span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                aria-label="From check-in date"
              />
            </label>
            <label>
              <span>To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="To check-in date"
              />
            </label>
            {(fromDate || toDate) && (
              <button
                type="button"
                className="filter-btn"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

      </div>

      {filteredVisitors.length === 0 ? (
        <div className="no-data-message">
          <p> No visitors found</p>
        </div>
      ) : (
        <div className="visitors-list">
          {filteredVisitors.map(visitor => (
            <div
              key={visitor.id}
              className={`visitor-card ${!visitor.checkOutDate ? 'active' : 'checked-out'}`}
              onClick={canViewVisitorDetails
                ? () => setSelectedVisitor(selectedVisitor?.id === visitor.id ? null : visitor)
                : undefined}
              role={canViewVisitorDetails ? 'button' : undefined}
              tabIndex={canViewVisitorDetails ? 0 : undefined}
              onKeyDown={canViewVisitorDetails ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedVisitor(selectedVisitor?.id === visitor.id ? null : visitor);
                }
              } : undefined}
            >
              <div className="visitor-card-header">
                <div className="visitor-name-section">
                  <h3>{visitor.fullName}</h3>
                  <span className={`status-badge ${!visitor.checkOutDate ? 'in' : 'out'}`}>
                    {!visitor.checkOutDate ? 'Check In' : 'Check Out'}
                  </span>
                </div>
                {canViewVisitorDetails && (
                  <span className="details-indicator" aria-hidden="true">
                    {selectedVisitor?.id === visitor.id ? '▼' : '▶'}
                  </span>
                )}
              </div>

              <div className="visitor-info-brief">
                <span>📞 {visitor.phone}</span>
                <span>Employee: {visitor.personToVisit || 'N/A'}</span>
                <span>Day: {getWeekdayName(getVisitorCheckInDate(visitor)) || 'N/A'}</span>
                <span className="visitor-status-time">
                  {!visitor.checkOutDate
                    ? `Check-in: ${formatDateTime(getVisitorCheckInDate(visitor))}`
                    : `Check-out: ${formatDateTime(visitor.checkOutDate)}`}
                </span>
              </div>

              {canViewVisitorDetails && selectedVisitor?.id === visitor.id && (
                <div className="visitor-details">
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{visitor.phone}</span>
                  </div>
                  {visitor.email && (
                    <div className="detail-row">
                      <span className="label">Email:</span>
                      <span className="value">{visitor.email}</span>
                    </div>
                  )}
                  {visitor.company && (
                    <div className="detail-row">
                      <span className="label">Company:</span>
                      <span className="value">{visitor.company}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Visiting (Employee):</span>
                    <span className="value">{visitor.personToVisit || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Purpose:</span>
                    <span className="value">{visitor.purpose}</span>
                  </div>
                  {visitor.idNumber && (
                    <div className="detail-row">
                      <span className="label">ID:</span>
                      <span className="value">{visitor.idType ? `${visitor.idType} - ` : ''}{visitor.idNumber}</span>
                    </div>
                  )}
                  {visitor.recordedBy && (
                    <div className="detail-row">
                      <span className="label">Recorded by:</span>
                      <span className="value">{visitor.recordedBy}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Check-in:</span>
                    <span className="value">{formatDateTime(visitor.checkInDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Day:</span>
                    <span className="value">{getWeekdayName(getVisitorCheckInDate(visitor)) || 'N/A'}</span>
                  </div>
                  {visitor.checkOutDate && (
                    <div className="detail-row">
                      <span className="label">Check-out:</span>
                      <span className="value">{formatDateTime(visitor.checkOutDate)}</span>
                    </div>
                  )}
                  {visitor.checkoutReference && (
                    <div className="detail-row">
                      <span className="label">Checkout by:</span>
                      <span className="value">{visitor.checkoutReference}</span>
                    </div>
                  )}

                </div>
              )}

              {(!visitor.checkOutDate || canDeleteVisitors) && (
                <div className="visitor-actions" onClick={(event) => event.stopPropagation()}>
                  {!visitor.checkOutDate && (
                    <button className="btn-checkout" onClick={() => handleCheckOut(visitor.id)}>
                      ✔️ Mark as Checked Out
                    </button>
                  )}
                  {canDeleteVisitors && (
                    <button className="btn-delete" onClick={() => handleDelete(visitor.id)}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
