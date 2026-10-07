import { useEffect, useMemo, useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountType, setAccountType] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [credentialDraft, setCredentialDraft] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState(null);

  const PAGE_SIZE = 6;

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

  const filteredAccounts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesType = accountType === 'all'
        || (accountType === 'user' && account.kind === 'user')
        || (accountType === 'expert' && account.kind === 'expert');
      const searchableText = account.name.toLowerCase();
      return matchesType && (!search || searchableText.includes(search));
    });
  }, [accounts, accountType, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [accountType, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE;
  const pageAccounts = filteredAccounts.slice(pageStart, pageStart + PAGE_SIZE);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || null;

  function openAccount(id) {
    setSelectedAccountId(id);
    setCredentialDraft({ username: '', password: '' });
  }

  function changeAccount(id, changes) {
    setAccounts((current) => current.map((account) => (
      account.id === id ? { ...account, ...changes } : account
    )));
  }

  async function saveAccount(account, credentials) {
    setError('');
    setSuccess('');
    setSavingId(account.id);

    try {
      if (account.kind === 'user') {
        await updateUser(account.id, {
          fullname: account.name,
          username: credentials.username || account.username,
          password: credentials.password,
          role: account.role,
          canDeleteVisitors: account.permissions.includes('visitors.delete'),
          permissions: account.permissions,
        });
      } else {
        await updateExpert(account.id, {
          fullname: account.name,
          department: account.department,
          username: credentials.username || account.username,
          password: credentials.password,
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

          <div className="permission-filters">
            <label className="permission-search">
              Search admin or employee name
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name"
                aria-label="Search admin or employee name"
              />
            </label>
            <label className="permission-filter">
              Account type
              <select
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
              >
                <option value="all">All accounts</option>
                <option value="user">Users</option>
                <option value="expert">Employees</option>
              </select>
            </label>
          </div>

          <div className="permission-account-list">
            {pageAccounts.map((account) => (
              <button
                type="button"
                className="permission-account"
                key={`${account.kind}-${account.id}`}
                onClick={() => openAccount(account.id)}
                aria-label={`Open permissions for ${account.name}`}
              >
                <span>{account.name}</span>
              </button>
            ))}
            {accounts.length === 0 && !error && <p>Loading accounts...</p>}
          </div>

          {totalPages > 1 && (
            <div className="permission-pagination no-print">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPageSafe === 1}
              >
                Previous
              </button>
              <span className="permission-page-indicator">
                Page {currentPageSafe} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPageSafe === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <div className="permission-drawer-backdrop" onMouseDown={() => setSelectedAccountId(null)}>
          <aside
            className="permission-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="permission-drawer-header">
              <div>
                <span className="permission-drawer-label">Account details</span>
                <h2 id="permission-drawer-title">{selectedAccount.name}</h2>
              </div>
              <button
                type="button"
                className="permission-drawer-close"
                onClick={() => setSelectedAccountId(null)}
                aria-label="Close account details"
              >
                ×
              </button>
            </div>
            <div className="permission-drawer-content">
              <div className="permission-drawer-row">
                <span>Account type</span>
                <strong>{selectedAccount.kind === 'expert' ? 'Employee' : 'User'}</strong>
              </div>
              <div className="permission-drawer-row">
                <span>Username</span>
                <strong>{selectedAccount.username || 'Not set'}</strong>
              </div>
              <div className="permission-drawer-row">
                <span>Role</span>
                <strong>{selectedAccount.role || 'Not set'}</strong>
              </div>
              {selectedAccount.kind === 'expert' && (
                <div className="permission-drawer-row">
                  <span>Department</span>
                  <strong>{selectedAccount.department || 'Not set'}</strong>
                </div>
              )}

              <div className="permission-drawer-fields">
                <label>
                  Username
                  <input
                    type="text"
                    value={credentialDraft.username}
                    onChange={(event) => setCredentialDraft((draft) => ({
                      ...draft,
                      username: event.target.value,
                    }))}
                    placeholder="Enter username"
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={credentialDraft.password}
                    onChange={(event) => setCredentialDraft((draft) => ({
                      ...draft,
                      password: event.target.value,
                    }))}
                    placeholder="Enter password"
                  />
                </label>
              </div>

              <div className="permission-drawer-permissions">
                <h3>Permissions</h3>
                <div className="permission-groups">
                  {PERMISSION_GROUPS.map((group) => (
                    <fieldset className="permission-group" key={group.title}>
                      <legend>{group.title}</legend>
                      {group.items.map(([permission, label]) => (
                        <label key={permission}>
                          <input
                            type="checkbox"
                            checked={selectedAccount.permissions.includes(permission)}
                            onChange={(event) => {
                              const selected = new Set(selectedAccount.permissions);
                              if (event.target.checked) selected.add(permission);
                              else selected.delete(permission);
                              changeAccount(selectedAccount.id, { permissions: [...selected] });
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
                  disabled={savingId === selectedAccount.id}
                  onClick={() => saveAccount(selectedAccount, credentialDraft)}
                >
                  {savingId === selectedAccount.id ? 'Saving...' : 'Save permissions'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}