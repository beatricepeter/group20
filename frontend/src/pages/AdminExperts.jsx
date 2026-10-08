import { useEffect, useRef, useState } from 'react';
import { refreshExperts, createExpert, updateExpert, deleteExpert, refreshVisitors } from '../lib/db';
import '../styles/DashboardPage.css';

const emptyForm = { id: null, firstName: '', lastName: '', department: '' };
const EXPERT_COLUMNS = ['First Name', 'Last Name', 'Department'];

function splitName(fullname) {
  const parts = String(fullname || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

async function downloadWorkbook(rows, filename) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');
  worksheet.addRow(EXPERT_COLUMNS);
  rows.forEach((row) => worksheet.addRow(EXPERT_COLUMNS.map((column) => row[column] || '')));

  const buffer = await workbook.xlsx.writeBuffer();
  const downloadUrl = URL.createObjectURL(new Blob([buffer]));
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export default function AdminExperts() {
  const [experts, setExperts] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const editing = !!form.id;

  useEffect(() => {
    Promise.all([refreshExperts(), refreshVisitors()]).then(([loadedExperts, loadedVisitors]) => {
      setExperts(loadedExperts);
      setVisitors(loadedVisitors);
    });
  }, []);

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    const fullname = `${form.firstName.trim()} ${form.lastName.trim()}`;

    try {
      if (editing) {
        const updated = await updateExpert(form.id, {
          fullname,
          department: form.department.trim(),
        });
        setExperts((prev) => prev.map((x) => (x.id === form.id ? updated : x)));
        setSuccess('Employee updated successfully.');
      } else {
        const created = await createExpert({
          fullname,
          department: form.department.trim(),
        });
        setExperts((prev) => [...prev, created]);
        setSuccess('Employee added successfully.');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Something went wrong while saving the employee.');
    }
  }

  function handleEdit(exp) {
    const { firstName, lastName } = splitName(exp.fullname);
    setForm({
      id: exp.id,
      firstName,
      lastName,
      department: exp.department || '',
    });
    setError('');
    setSuccess('');
  }

  async function handleDelete(exp) {
    setError('');
    setSuccess('');

    const hasVisitors = visitors.some((v) => v.expertId === exp.id);
    if (hasVisitors) {
      setError(`Unable to delete: ${exp.fullname} has visitor records in the system.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${exp.fullname}?`)) return;

    try {
      await deleteExpert(exp.id);
      setExperts((prev) => prev.filter((x) => x.id !== exp.id));
      setSuccess('Employee deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete employee.');
    }
  }

  function exportExperts() {
    downloadWorkbook(experts.map((expert) => {
      const { firstName, lastName } = splitName(expert.fullname);
      return {
        'First Name': firstName,
        'Last Name': lastName,
        Department: expert.department || '',
      };
    }), 'employees.xlsx');
  }

  function downloadTemplate() {
    downloadWorkbook([], 'employees-template.xlsx');
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setSuccess('');
    setImporting(true);

    try {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        throw new Error('Please choose an Excel Workbook (.xlsx) file.');
      }

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('The selected file does not contain a worksheet.');

      const headers = worksheet.getRow(1).values.slice(1).map((value) => (
        String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
      ));
      const fullnameColumn = headers.findIndex((header) => ['full name', 'fullname', 'name'].includes(header)) + 1;
      const firstNameColumn = headers.findIndex((header) => ['first name', 'firstname'].includes(header)) + 1;
      const lastNameColumn = headers.findIndex((header) => ['last name', 'lastname'].includes(header)) + 1;
      const departmentColumn = headers.indexOf('department') + 1;
      const hasSeparateNameColumns = firstNameColumn > 0 && lastNameColumn > 0;
      if (!fullnameColumn && !hasSeparateNameColumns) {
        throw new Error('The selected sheet must have either a "Full Name" column or both "First Name" and "Last Name" columns.');
      }

      const imported = [];
      const rowErrors = [];

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const firstName = firstNameColumn ? String(row.getCell(firstNameColumn).text || '').trim() : '';
        const lastName = lastNameColumn ? String(row.getCell(lastNameColumn).text || '').trim() : '';
        const separateName = `${firstName} ${lastName}`.trim();
        const hasSeparateNameValues = Boolean(firstName || lastName);
        const fullname = hasSeparateNameColumns && firstName && lastName
          ? separateName
          : !hasSeparateNameValues && fullnameColumn
            ? String(row.getCell(fullnameColumn).text || '').trim()
            : '';
        const department = departmentColumn ? String(row.getCell(departmentColumn).text || '').trim() : '';

        if (!fullname && !department) continue;
        if (!fullname || (hasSeparateNameValues && (!firstName || !lastName))) {
          rowErrors.push(rowNumber);
          continue;
        }

        try {
          imported.push(await createExpert({ fullname, department }));
        } catch {
          rowErrors.push(rowNumber);
        }
      }

      if (imported.length > 0) setExperts((previous) => [...previous, ...imported]);

      if (rowErrors.length > 0) {
        setError(`Imported ${imported.length} employee(s). Could not import spreadsheet row(s): ${rowErrors.join(', ')}.`);
      } else if (imported.length > 0) {
        setSuccess(`Imported ${imported.length} employee(s) successfully.`);
      } else {
        setError('No employees were imported. Check that the sheet has a "Full Name" column or both "First Name" and "Last Name" columns, with names filled in.');
      }
    } catch (err) {
      setError(err.message || 'Unable to read the selected spreadsheet.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Manage Employees</h1>
          <p>Add, edit, or remove employees that visitors can meet</p>
        </div>

        <div className="admin-section-panel">
          <div className="panel-header-row">
            <h2>{editing ? 'Edit Employee' : 'Add New Employee'}</h2>
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
              <label>Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="Enter employee department"
              />
            </div>
            <div className="dashboard-actions">
              <button type="submit" className="action-btn primary">
                {editing ? 'Update Employee' : 'Add Employee'}
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
            <h2>All Employees</h2>
            <span>{experts.length} Total</span>
          </div>

          <div className="dashboard-actions expert-import-actions">
            <button type="button" className="action-btn secondary" onClick={downloadTemplate}>
              Download Template
            </button>
            <button type="button" className="action-btn secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? 'Importing...' : 'Import Excel'}
            </button>
            <button type="button" className="action-btn secondary" onClick={exportExperts} disabled={experts.length === 0}>
              Export Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleImport}
              hidden
            />
          </div>

          {experts.length === 0 ? (
            <div className="empty-state">No employees added yet.</div>
          ) : (
            <div className="admin-section-table-wrap">
              <table className="admin-section-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Department</th>
                    <th>Visitors Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((exp, i) => {
                    const { firstName, lastName } = splitName(exp.fullname);
                    return (
                      <tr key={exp.id}>
                        <td>{i + 1}</td>
                        <td>{firstName}</td>
                        <td>{lastName}</td>
                        <td>{exp.department || '-'}</td>
                        <td>{visitors.filter((v) => v.expertId === exp.id).length}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="mini-action-button" onClick={() => handleEdit(exp)}>
                              Edit
                            </button>
                            <button className="mini-action-button danger" onClick={() => handleDelete(exp)}>
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
          )}
        </div>
      </div>
    </div>
  );
}
