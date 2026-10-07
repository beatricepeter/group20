import { useEffect, useMemo, useState } from 'react';
import { refreshVisitors, refreshExperts, refreshUsers } from '../lib/db';
import '../styles/AdminReports.css';

function parseDateTime(value) {
  const text = String(value || '');
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text.replace(' ', 'T')}+03:00`);
}

function formatDateTime(iso) {
  if (!iso) return '-';
  const date = parseDateTime(iso);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Dar_es_Salaam',
  });
}

export default function AdminReports() {
  const [visitors, setVisitors] = useState([]);
  const [experts, setExperts] = useState([]);
  const [users, setUsers] = useState([]);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    refreshVisitors().then(setVisitors);
    refreshExperts().then(setExperts);
    refreshUsers().then(setUsers);
  }, []);

  const filtered = useMemo(() => {
    return visitors
      .filter((v) => {
        const checkIn = parseDateTime(v.checkInDate);

        if (fromDate) {
          const from = new Date(`${fromDate}T00:00:00`);
          if (checkIn < from) return false;
        }
        if (toDate) {
          const to = new Date(`${toDate}T23:59:59`);
          if (checkIn > to) return false;
        }
        if (status === 'active' && v.checkOutDate) return false;
        if (status === 'checked-out' && !v.checkOutDate) return false;
        if (employeeSearch) {
          const search = employeeSearch.trim().toLowerCase();
          const employee = experts.find((item) => item.id === v.expertId);
          if (!employee?.fullname.toLowerCase().includes(search)) return false;
        }

        return true;
      })
      .sort((a, b) => parseDateTime(a.checkInDate) - parseDateTime(b.checkInDate));
  }, [visitors, experts, fromDate, toDate, status, employeeSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, status, employeeSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE;
  const pageRecords = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function handlePrint() {
    window.print();
  }

  function clearFilters() {
    setFromDate('');
    setToDate('');
    setStatus('all');
    setEmployeeSearch('');
  }

  const preparedBy = users.find((u) => u.role === 'admin')?.fullname || 'Administrator';

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section no-print">
          <h1> Visitor Reports</h1>
          <p>Filter records below, then print or save as PDF</p>
        </div>

        <div className="admin-section-panel no-print">
          <div className="panel-header-row">
            <h2>Filters</h2>
          </div>

          <div className="report-filters">
            <div className="form-group">
              <label>From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active (Inside)</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employee</label>
              <input
                type="search"
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search employees"
                aria-label="Search report by employee name"
              />
            </div>
          </div>

          <div className="dashboard-actions">
            <button className="action-btn secondary" onClick={clearFilters}>
              Clear Filters
            </button>
            <button className="action-btn primary" onClick={handlePrint}>
              🖨️ Print Report
            </button>
          </div>
        </div>

        {/* ---- This section is what actually gets printed ---- */}
        <div className="admin-section-panel print-area">
          <div className="report-letterhead">
            <h2>eGaz Visitor Management System</h2>
            <p>Visitor Report</p>
            <p className="report-meta">
              Generated: {formatDateTime(new Date().toISOString())}
              {' · '}
              Period: {fromDate || 'Start'} to {toDate || 'Today'}
              {status !== 'all' && <> · Status: {status === 'active' ? 'Active' : 'Checked Out'}</>}
              {employeeSearch && (
                <> · Employee search: {employeeSearch}</>
              )}
            </p>
          </div>

          <div className="admin-inline-section">
            <h3>Visitor Records ({filtered.length})</h3>
            {filtered.length === 0 ? (
              <div className="empty-state">No visitors match the selected filters.</div>
            ) : (
              <div className="admin-section-table-wrap">
                <table className="admin-section-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>ID Number</th>
                      <th>Employee</th>
                      <th>Purpose</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((v, i) => (
                      <tr key={v.id}>
                        <td>{pageStart + i + 1}</td>
                        <td>{v.fullName}</td>
                        <td>{v.phone}</td>
                        <td>{v.idNumber || '-'}</td>
                        <td>{v.personToVisit || '-'}</td>
                        <td>{v.purpose || '-'}</td>
                        <td>{formatDateTime(v.checkInDate)}</td>
                        <td>{v.checkOutDate ? formatDateTime(v.checkOutDate) : '-'}</td>
                        <td>
                          <span className={`status-pill ${v.checkOutDate ? 'checked-out' : 'active'}`}>
                            {v.checkOutDate ? 'Checked Out' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > PAGE_SIZE && (
              <div className="report-pagination no-print">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPageSafe === 1}
                >
                  Previous Page
                </button>
                <span className="report-page-indicator">
                  Page {currentPageSafe} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPageSafe === totalPages}
                >
                  Next Page
                </button>
              </div>
            )}
          </div>

          <div className="report-footer">
            <p>Prepared by: {preparedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
