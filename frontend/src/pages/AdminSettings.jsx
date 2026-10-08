import { useEffect, useState } from 'react';
import {
  createDepartment,
  deleteDepartment,
  getSystemSettings,
  refreshDepartments,
  updateSystemSettings,
} from '../lib/db';
import '../styles/AdminSettings.css';

export default function AdminSettings() {
  const [autoCheckoutTime, setAutoCheckoutTime] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getSystemSettings(), refreshDepartments()])
      .then(([settings, latestDepartments]) => {
        if (!active) return;
        setAutoCheckoutTime(settings.autoCheckoutTime);
        setDepartments(latestDepartments);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load organisation settings.');
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

  async function addDepartment(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingDepartment(true);

    try {
      const department = await createDepartment(departmentName.trim());
      setDepartments((current) => [...current, department].sort((first, second) => (
        first.name.localeCompare(second.name)
      )));
      setDepartmentName('');
      setSuccess(`Department "${department.name}" added.`);
    } catch (err) {
      setError(err.message || 'Unable to add department.');
    } finally {
      setSavingDepartment(false);
    }
  }

  async function removeDepartment(department) {
    if (!confirm(`Remove "${department.name}" from the department list?`)) return;

    setError('');
    setSuccess('');
    setDeletingDepartmentId(department.id);
    try {
      await deleteDepartment(department.id);
      setDepartments((current) => current.filter((item) => item.id !== department.id));
      setSuccess(`Department "${department.name}" removed.`);
    } catch (err) {
      setError(err.message || 'Unable to remove department.');
    } finally {
      setDeletingDepartmentId(null);
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
            <p>Loading organisation settings...</p>
          ) : (
            <>
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

              <div className="admin-settings-departments">
                <div className="panel-header-row">
                  <h2>Organisation Setup</h2>
                </div>
                <p>Add the departments that employees can be assigned to.</p>
                <form className="admin-settings-department-form" onSubmit={addDepartment}>
                  <label htmlFor="new-department">Department name</label>
                  <div>
                    <input
                      id="new-department"
                      type="text"
                      value={departmentName}
                      onChange={(event) => setDepartmentName(event.target.value)}
                      placeholder="e.g. Human Resources"
                      maxLength={255}
                      required
                    />
                    <button type="submit" disabled={savingDepartment || !departmentName.trim()}>
                      {savingDepartment ? 'Adding...' : 'Add department'}
                    </button>
                  </div>
                </form>
                {departments.length === 0 ? (
                  <p className="admin-settings-empty">No departments have been added yet.</p>
                ) : (
                  <ul className="admin-settings-department-list">
                    {departments.map((department) => (
                      <li key={department.id}>
                        <span>{department.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDepartment(department)}
                          disabled={deletingDepartmentId === department.id}
                          aria-label={`Remove ${department.name}`}
                        >
                          {deletingDepartmentId === department.id ? 'Removing...' : 'Remove'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
