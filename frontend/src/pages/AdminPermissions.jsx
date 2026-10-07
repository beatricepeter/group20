import { useEffect, useState } from 'react';
import { refreshUsers, updateUser, refreshExperts, updateExpert } from '../lib/db';
import '../styles/DashboardPage.css';

const PERMISSION_GROUPS = [
  {
    title: 'User management',
    items: [
      ['users.create', 'Create / add users'],
      ['users.edit', 'Edit user details'],
      ['users.deactivate', 'Deactivate / suspend users'],
      ['users.delete', 'Delete / remove users'],
      ['users.reset_password', 'Reset password / activation link'],
      ['users.bulk_import', 'Bulk user import'],
      ['users.sso_mapping', 'SSO mapping'],
    ],
  },
  {
    title: 'Role management',
    items: [
      ['roles.create_custom', 'Create custom roles'],
      ['roles.edit_permissions', 'Edit role permissions'],
      ['roles.clone', 'Duplicate / clone roles'],
      ['roles.delete_custom', 'Delete custom roles'],
      ['roles.assign_multiple', 'Assign multiple roles'],
    ],
  },
  {
    title: 'Visitors and reports',
    items: [
      ['visitors.view', 'View visitors'],
      ['visitors.register', 'Register visitors'],
      ['visitors.delete', 'Delete visitor records'],
    ],
  },
];

export default function AdminPermissions() {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    Promise.all([refreshUsers(), refreshExperts()])
      .then(([users, experts]) => {
        setAccounts([
          ...users.map((user) => ({
            id: user.id,
            name: user.fullname,
            kind: 'user',
            username: user.username,
            role: user.role,
            permissions: user.permissions || (user.canDeleteVisitors ? ['visitors.delete'] : []),
          })),
          ...experts.map((expert) => ({
            id: expert.id,
            name: expert.fullname,
            kind: 'expert',
            username: expert.username || '',
            department: expert.department || '',
            permissions: expert.permissions || (expert.canDeleteVisitors ? ['visitors.delete'] : []),
          })),
        ]);
      })
      .catch((err) => setError(err.message || 'Unable to load account permissions.'));
  }, []);

  function changeAccount(id, changes) {
    setAccounts((current) => current.map((account) => (
      account.id === id ? { ...account, ...changes } : account
    )));
  }

  async function saveAccount(account) {
    setError('');
    setSuccess('');
    setSavingId(account.id);

    try {
      if (account.kind === 'user') {
        await updateUser(account.id, {
          fullname: account.name,
          username: account.username,
          password: '',
          role: account.role,
          canDeleteVisitors: account.permissions.includes('visitors.delete'),
          permissions: account.permissions,
        });
      } else {
        await updateExpert(account.id, {
          fullname: account.name,
          department: account.department,
          username: account.username,
          password: account.password || '',
          canDeleteVisitors: account.permissions.includes('visitors.delete'),
          permissions: account.permissions,
        });
        changeAccount(account.id, { password: '' });
      }
      setSuccess(`Permissions saved for ${account.name}.`);
    } catch (err) {
      setError(err.message || `Unable to save permissions for ${account.name}.`);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Manage Permissions</h1>
          <p>Select the user and role operations available to each account.</p>
        </div>

        <div className="admin-section-panel">
          <div className="panel-header-row">
            <h2>User and Employee Access</h2>
            <span>{accounts.length} Accounts</span>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <div className="permission-account-list">
            {accounts.map((account) => (
              <details className="permission-account" key={`${account.kind}-${account.id}`}>
                <summary>
                  <span>{account.name}</span>
                  <span>{account.kind === 'expert' ? 'Employee' : account.role}</span>
                  <span>{account.username}</span>
                </summary>
                <div className="permission-account-content">
                  {account.kind === 'expert' && (
                    <div className="permission-account-fields">
                      <label>
                        Employee username
                        <input
                          type="text"
                          placeholder="Set username"
                          value={account.username}
                          onChange={(event) => changeAccount(account.id, { username: event.target.value })}
                        />
                      </label>
                      <label>
                        Employee password
                        <input
                          type="password"
                          placeholder={account.username ? 'Set or change password' : 'Set password'}
                          value={account.password || ''}
                          onChange={(event) => changeAccount(account.id, { password: event.target.value })}
                        />
                      </label>
                    </div>
                  )}
                  <div className="permission-groups">
                    {PERMISSION_GROUPS.map((group) => (
                      <fieldset className="permission-group" key={group.title}>
                        <legend>{group.title}</legend>
                        {group.items.map(([permission, label]) => (
                          <label key={permission}>
                            <input
                              type="checkbox"
                              checked={account.permissions.includes(permission)}
                              onChange={(event) => {
                                const selected = new Set(account.permissions);
                                if (event.target.checked) selected.add(permission);
                                else selected.delete(permission);
                                changeAccount(account.id, { permissions: [...selected] });
                              }}
                            />
                            {label}
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                  <button
                    className="mini-action-button"
                    disabled={savingId === account.id}
                    onClick={() => saveAccount(account)}
                  >
                    {savingId === account.id ? 'Saving...' : 'Save permissions'}
                  </button>
                </div>
              </details>
            ))}
            {accounts.length === 0 && !error && <p>Loading accounts...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}