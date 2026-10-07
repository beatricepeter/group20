import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const canViewVisitors = isAdmin || user.permissions?.includes('visitors.view');
  const canRegisterVisitors = isAdmin || user.permissions?.includes('visitors.register');
  const homePath = isAdmin ? '/admin-dashboard' : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon"></span>
        <span className="brand-text">Visitors System</span>
      </div>

      <div className="navbar-links">
        <button
          className={`nav-link ${isActive(homePath)}`}
          onClick={() => navigate(homePath)}
        >
           Home
        </button>

        {!isAdmin && (
          <>
            {canViewVisitors && (
              <button
                className={`nav-link ${isActive('/visitors')}`}
                onClick={() => navigate('/visitors')}
              >
                 Visitors
              </button>
            )}
            {canRegisterVisitors && (
              <button
                className={`nav-link ${isActive('/register')}`}
                onClick={() => navigate('/register')}
              >
                 Register
              </button>
            )}
            {canViewVisitors && (
              <button
                className={`nav-link ${isActive('/appointments')}`}
                onClick={() => navigate('/appointments')}
              >
                 Appointments
              </button>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <button
              className={`nav-link ${isActive('/admin/experts')}`}
              onClick={() => navigate('/admin/experts')}
            >
               Employees
            </button>
            <button
              className={`nav-link ${isActive('/admin/users')}`}
              onClick={() => navigate('/admin/users')}
            >
               Users
            </button>
            <button
              className={`nav-link ${isActive('/admin/permissions')}`}
              onClick={() => navigate('/admin/permissions')}
            >
               Permissions
            </button>
            <button
              className={`nav-link ${isActive('/admin/reports')}`}
              onClick={() => navigate('/admin/reports')}
            >
               Reports
            </button>
            <button
              className={`nav-link ${isActive('/insights')}`}
              onClick={() => navigate('/insights')}
            >
               Insights
            </button>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-name">{user.name}</span>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="logout-icon" aria-hidden="true">🚪</span>
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
}
