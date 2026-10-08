import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const hasPermission = (permission) => (
    isAdmin || user.permissions?.includes(permission) || (permission === 'visitors.delete' && Boolean(user.canDeleteVisitors))
  );
  const canViewVisitors = hasPermission('visitors.view');
  const canRegisterVisitors = hasPermission('visitors.register');
  const canAccessAppointments = hasPermission('visitors.create_appointment');
  const canAssignUserRoles = user.permissions?.includes('users.assign_roles');
  const homePath = isAdmin ? '/admin-dashboard' : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');
  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="sidebar-menu-toggle"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? '×' : '☰'}
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}
      <nav className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">V</span>
          <span>Visitors System</span>
        </div>

        <div className="sidebar-links">
          <button
            className={`nav-link ${isActive(homePath)}`}
            onClick={() => goTo(homePath)}
          >
            <span aria-hidden="true">⌂</span> Home
          </button>

          {!isAdmin && (
            <>
              {canViewVisitors && (
                <button
                  className={`nav-link ${isActive('/visitors')}`}
                  onClick={() => goTo('/visitors')}
                >
                  <span aria-hidden="true">◷</span> Visitors
                </button>
              )}
              {canRegisterVisitors && (
                <button
                  className={`nav-link ${isActive('/register')}`}
                  onClick={() => goTo('/register')}
                >
                  <span aria-hidden="true">＋</span> Register
                </button>
              )}
              {canAccessAppointments && (
                <button
                  className={`nav-link ${isActive('/appointments')}`}
                  onClick={() => goTo('/appointments')}
                >
                  <span aria-hidden="true">▣</span> Appointments
                </button>
              )}
              {canAssignUserRoles && (
                <button
                  className={`nav-link ${isActive('/assign-roles')}`}
                  onClick={() => goTo('/assign-roles')}
                >
                  <span aria-hidden="true">⚿</span> Assign Roles
                </button>
              )}
            </>
          )}

          {isAdmin && (
            <>
              {user.permissions?.includes('visitors.view') && (
                <button
                  className={`nav-link ${isActive('/admin/visitors')}`}
                  onClick={() => goTo('/admin/visitors')}
                >
                  <span aria-hidden="true">◷</span> View Visitors
                </button>
              )}
              <button
                className={`nav-link ${isActive('/admin/experts')}`}
                onClick={() => goTo('/admin/experts')}
              >
                <span aria-hidden="true">♙</span> Employees
              </button>
              <button
                className={`nav-link ${isActive('/admin/users')}`}
                onClick={() => goTo('/admin/users')}
              >
                <span aria-hidden="true">♧</span> Users
              </button>
              <button
                className={`nav-link ${isActive('/admin/permissions')}`}
                onClick={() => goTo('/admin/permissions')}
              >
                <span aria-hidden="true">⚿</span> Permissions
              </button>
              <button
                className={`nav-link ${isActive('/admin/reports')}`}
                onClick={() => goTo('/admin/reports')}
              >
                <span aria-hidden="true">▤</span> Reports
              </button>
              <button
                className={`nav-link ${isActive('/admin/settings')}`}
                onClick={() => goTo('/admin/settings')}
              >
                <span aria-hidden="true">⚙</span> Settings
              </button>
              <button
                className={`nav-link ${isActive('/insights')}`}
                onClick={() => goTo('/insights')}
              >
                <span aria-hidden="true">◫</span> Insights
              </button>
            </>
          )}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-identity">
            <span className="sidebar-user-avatar" aria-hidden="true">
              {user.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
            </span>
            <span className="sidebar-user-name">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span className="logout-icon" aria-hidden="true">↪</span>
            <span>Log out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
