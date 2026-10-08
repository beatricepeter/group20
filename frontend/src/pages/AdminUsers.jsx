import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { refreshUsers, createUser, updateUser, deleteUser } from '../lib/db';
import '../styles/DashboardPage.css';

const emptyForm = { id: null, firstName: '', lastName: '', username: '', password: '', role: 'receptionist' };

export default function AdminUsers() {
  const { user: session } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editing = !!form.id;

  useEffect(() => {
    refreshUsers().then(setUsers);
  }, []);

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullname = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!fullname || !form.username.trim()) {
      setError('First name, last name, and username are required.');
      return;
    }
    if (!editing && !form.password) {
      setError('Password is required for new users.');
      return;
    }

    const usernameTaken = users.some(
      (u) => u.username.toLowerCase() === form.username.trim().toLowerCase() && u.id !== form.id
    );
    if (usernameTaken) {
      setError('Username has already been taken. Please choose a different one.');
      return;
    }

    try {
      if (editing) {
        const target = users.find((u) => u.id === form.id);
        const payload = {
          fullname,
          username: form.username.trim(),
          password: form.password ? form.password : '',
          role: form.id === session.id ? target.role : form.role, // can't self-promote/demote here
        };
        const updated = await updateUser(form.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === form.id ? updated : u)));
        setSuccess('User information updated successfully.');
      } else {
        const payload = {
          fullname,
          username: form.username.trim(),
          password: form.password,
          role: form.role,
        };
        const created = await createUser(payload);
        setUsers((prev) => [...prev, created]);
        setSuccess('User added successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Something went wrong while saving the user.');
    }
  }

  function handleEdit(u) {
    const [firstName = '', ...lastNameParts] = String(u.fullname || '').trim().split(/\s+/);
    setForm({
      id: u.id,
      firstName,
      lastName: lastNameParts.join(' '),
      username: u.username,
      password: '',
      role: u.role,
    });
    setError('');
    setSuccess('');
  }

  async function handleRoleChange(target, newRole) {
    setError('');
    setSuccess('');

    if (target.id === session.id) {
      setError('Unable to change your own role.');
      return;
    }

    const admins = users.filter((x) => x.role === 'admin');
    if (target.role === 'admin' && newRole !== 'admin' && admins.length <= 1) {
      setError('Unable to delete the last admin.');
      return;
    }

    try {
      const updated = await updateUser(target.id, {
        fullname: target.fullname,
        username: target.username,
        password: '',
        role: newRole,
      });
      setUsers((prev) => prev.map((x) => (x.id === target.id ? updated : x)));
      setSuccess('Role updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update role.');
    }
  }

  async function handleAccessChange(target) {
    setError('');
    setSuccess('');

    if (target.id === session.id) {
      setError('Unable to revoke your own access.');
      return;
    }

    const enabled = target.enabled === false;
    if (!enabled && target.username.toLowerCase() === 'admin') {
      setError('The default admin account must remain active.');
      return;
    }
    if (!enabled && target.role === 'admin') {
      const activeAdmins = users.filter((account) => account.role === 'admin' && account.enabled !== false);
      if (activeAdmins.length <= 1) {
        setError('Unable to revoke access from the last active admin.');
        return;
      }
    }

    const action = enabled ? 'restore access to' : 'revoke access from';
    if (!confirm(`Are you sure you want to ${action} ${target.fullname}?`)) return;

    try {
      const updated = await updateUser(target.id, {
        fullname: target.fullname,
        username: target.username,
        password: '',
        role: target.role,
        canDeleteVisitors: target.canDeleteVisitors,
        permissions: target.permissions,
        enabled,
      });
      setUsers((current) => current.map((account) => (account.id === target.id ? updated : account)));
      setSuccess(enabled
        ? `Access restored for ${target.fullname}.`
        : `Access revoked for ${target.fullname}.`);
    } catch (err) {
      setError(err.message || `Unable to ${action} ${target.fullname}.`);
    }
  }

  async function handleDelete(target) {
    setError('');
    setSuccess('');

    if (target.id === session.id) {
      setError('Unable to delete your own account.');
      return;
    }

    const admins = users.filter((x) => x.role === 'admin');
    if (target.role === 'admin' && admins.length <= 1) {
      setError('Unable to delete the last admin.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${target.fullname}?`)) return;

    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((x) => x.id !== target.id));
      setSuccess('User deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete user.');
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1> Manage Users</h1>
          <p>Add receptionists, promote admins, or remove accounts</p>
        </div>

        <div className="admin-section-panel">
          <div className="panel-header-row">
            <h2>{editing ? 'Edit User' : 'Add New User'}</h2>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <form onSubmit={handleSubmit} className="receptionist-form">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div className="form-group">
              <label>Username </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Enter username for the user"
              />
            </div>
            <div className="form-group">
              <label>{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Enter password for the user"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                disabled={editing && form.id === session.id}
              >
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="dashboard-actions">
              <button type="submit" className="action-btn primary">
                {editing ? ' Update User' : ' Add User'}
              </button>
              {editing && (
                <button type="button" className="action-btn secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-section-panel admin-inline-section">
          <div className="panel-header-row">
            <h2>All Users</h2>
            <span>{users.length} Total</span>
          </div>

          <div className="admin-section-table-wrap">
            <table className="admin-section-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isSelf = u.id === session.id;
                  const isDefaultAdmin = u.username.toLowerCase() === 'admin';
                  return (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>{u.fullname}</td>
                      <td>{u.username}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          <option value="receptionist">Receptionist</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-pill ${u.enabled === false ? 'checked-out' : 'active'}`}>
                          {u.enabled === false ? 'Revoked' : 'Active'}
                        </span>
                      </td>
                      <td>{u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="mini-action-button" onClick={() => handleEdit(u)}>
                             Edit
                          </button>
                          <button
                            className={`mini-action-button${u.enabled === false ? '' : ' danger'}`}
                            disabled={isSelf || (isDefaultAdmin && u.enabled !== false)}
                            onClick={() => handleAccessChange(u)}
                            title={isDefaultAdmin ? 'The default admin account must remain active' : undefined}
                          >
                            {u.enabled === false ? 'Restore' : 'Revoke'}
                          </button>
                          <button
                            className="mini-action-button danger"
                            disabled={isSelf}
                            onClick={() => handleDelete(u)}
                          >
                             Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
