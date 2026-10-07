import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import '../styles/LoginPage.css';
import logo from '../assets/logo3.png';
import recep from '../assets/recep.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    const authenticatedUser = await login(username, password);

    if (!authenticatedUser) {
      setError('Invalid username or password');
      return;
    }

    if (authenticatedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    navigate('/admin-dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-shell">
        <div className="login-visual">
          <img src={recep} alt="Reception desk" />
          <div className="visual-overlay">
            <span className="visual-badge">Welcome</span>
            <h2>Visitor Management System</h2>
            <p>Track visitors, manage appointments, and keep reception operations smooth.</p>
          </div>
        </div>

        <div className="login-box">
          <div className="login-header">
            <div className="logo-container">
              <img src={logo} alt="Logo" />
            </div>
            <h1>Visitors System</h1>
            <p>Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  <span className={`eye-icon${showPassword ? ' eye-icon-visible' : ''}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
