import { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../lib/db';
import '../styles/AdminSettings.css';

export default function AdminSettings() {
  const [autoCheckoutTime, setAutoCheckoutTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    getSystemSettings()
      .then((settings) => {
        if (active) setAutoCheckoutTime(settings.autoCheckoutTime);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load system settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const settings = await updateSystemSettings({ autoCheckoutTime });
      setAutoCheckoutTime(settings.autoCheckoutTime);
      setSuccess('Automatic checkout time saved.');
    } catch (err) {
      setError(err.message || 'Unable to save system settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="dashboard-container admin-settings-page">
      <div className="dashboard-content">
        <section className="welcome-section">
          <h1>System Settings</h1>
          <p>Set when visitors still checked in are automatically checked out.</p>
        </section>

        <section className="admin-section-panel">
          <div className="panel-header-row">
            <h2>Automatic visitor checkout</h2>
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}
          {success && <div className="admin-settings-success" role="status">{success}</div>}

          {loading ? (
            <p>Loading system settings...</p>
          ) : (
            <form className="admin-settings-form" onSubmit={saveSettings}>
              <label htmlFor="auto-checkout-time">Daily checkout time (Tanzania time)</label>
              <p>All visitors who are still checked in will be checked out automatically at this time.</p>
              <input
                id="auto-checkout-time"
                type="time"
                value={autoCheckoutTime}
                onChange={(event) => setAutoCheckoutTime(event.target.value)}
                required
              />
              <button className="mini-action-button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save checkout time'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
