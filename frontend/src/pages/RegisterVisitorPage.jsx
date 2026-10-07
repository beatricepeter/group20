import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { refreshExperts, createVisitor, findVisitorByIdentity } from '../lib/db';
import '../styles/RegisterVisitorPage.css';

const DEFAULT_COMPANY = 'E-Government of Zanzibar';

export default function RegisterVisitorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPermission = (permission) => (
    user?.role === 'admin' || user?.permissions?.includes(permission) || (permission === 'visitors.delete' && Boolean(user?.canDeleteVisitors))
  );
  const canViewVisitors = hasPermission('visitors.view');
  const [experts, setExperts] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: DEFAULT_COMPANY,
    idType: 'NIDA',
    idNumber: '',
    expertId: '',
    purpose: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const lookupRequestRef = useRef(0);

  useEffect(() => {
    refreshExperts().then(setExperts);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isIdentityChange = name === 'idNumber';

    if (isIdentityChange) {
      lookupRequestRef.current += 1;
      setLookingUp(false);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (isIdentityChange || name === 'idType') setLookupMessage('');
  };

  const handleIdentityLookup = useCallback(async (value = formData.idNumber) => {
    const idNumber = value.trim();
    if (!idNumber) return;

    const requestId = ++lookupRequestRef.current;
    setLookingUp(true);
    setLookupMessage('');
    try {
      const visitor = await findVisitorByIdentity(idNumber);
      if (requestId !== lookupRequestRef.current) return;
      const [legacyFirstName = '', ...legacyLastName] = String(visitor.fullName || '').trim().split(/\s+/);
      setFormData((prev) => ({
        ...prev,
        firstName: visitor.firstName || legacyFirstName || prev.firstName,
        lastName: visitor.lastName || legacyLastName.join(' ') || prev.lastName,
        email: visitor.email || prev.email || '',
        phone: visitor.phone || prev.phone || '',
        company: DEFAULT_COMPANY,
      }));
      setLookupMessage('Previous visitor details loaded. Confirm them and enter this visit\'s purpose.');
    } catch (err) {
      if (requestId !== lookupRequestRef.current) return;
      if (err.status === 404) {
        setLookupMessage('No previous visitor found for this ID. You can continue registering manually.');
      } else {
        setLookupMessage('Unable to look up this ID right now.');
      }
    } finally {
      if (requestId === lookupRequestRef.current) setLookingUp(false);
    }
  }, [formData.idNumber]);

  useEffect(() => {
    const idNumber = formData.idNumber.trim();
    if (!idNumber) return undefined;

    const timer = setTimeout(() => {
      handleIdentityLookup(idNumber);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.idNumber, handleIdentityLookup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()
      || !formData.phone || !formData.expertId || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const expert = experts.find((x) => x.id === formData.expertId);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      // checkInDate is intentionally omitted — the backend sets it to
      // the current server time when it's not provided.
      await createVisitor({
        ...formData,
        fullName,
        company: DEFAULT_COMPANY,
        personToVisit: expert ? expert.fullname : '',
        recordedBy: user?.name || '',
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate(canViewVisitors ? '/visitors' : '/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Unable to register visitor. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="register-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Visitor Registered!</h2>
          <p>{formData.firstName} {formData.lastName} has been successfully registered</p>
          <p className="redirect-text">Redirecting to list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <div className="form-header">
          <h1> Register New Visitor</h1>
          <p>Please enter visitor details</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+255 000 000 000"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ID Type</label>
              <select name="idType" value={formData.idType} onChange={handleChange}>
                <option value="NIDA">NIDA</option>
                <option value="Passport">Passport</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>ID Number</label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                onBlur={handleIdentityLookup}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleIdentityLookup();
                }}
                placeholder="ID/Passport Number"
              />
            </div>
          </div>

          {lookupMessage && <div className="lookup-message">{lookupMessage}</div>}
          {lookingUp && <div className="lookup-message">Looking up visitor details...</div>}

          <div className="form-row">
            <div className="form-group full-width">
              <label>Company/Organization</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                readOnly
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Employee to Visit</label>
              <select name="expertId" value={formData.expertId} onChange={handleChange}>
                <option value="">-- Select an employee --</option>
                {experts.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.fullname} {exp.department ? `(${exp.department})` : ''}
                  </option>
                ))}
              </select>
              {experts.length === 0 && (
                <small style={{ color: '#c33' }}>
                  No employees available yet. Ask an admin to add one first.
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Purpose of Visit </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Enter purpose of visit"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-submit">
               Register Visitor
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(canViewVisitors ? '/visitors' : '/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
