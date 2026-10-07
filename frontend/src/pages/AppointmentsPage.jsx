import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment, refreshAppointments } from '../lib/db';
import '../styles/AppointmentsPage.css';

const defaultDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    appointmentDate: defaultDateTime(),
    purpose: '',
    status: 'pending',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshAppointments().then(setAppointments).catch((err) => setError(err.message));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.visitorName.trim() || !formData.phone.trim() || !formData.appointmentDate || !formData.purpose.trim()) {
      setError('Please fill in the visitor name, phone number, appointment date, and purpose.');
      return;
    }

    setSaving(true);
    try {
      await createAppointment({
        visitorName: formData.visitorName.trim(),
        phone: formData.phone.trim(),
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        purpose: formData.purpose.trim(),
        status: formData.status,
      });
      setSuccess('Appointment created successfully.');
      setFormData({
        visitorName: '',
        phone: '',
        appointmentDate: defaultDateTime(),
        purpose: '',
        status: 'pending',
      });
      const latestAppointments = await refreshAppointments();
      setAppointments(latestAppointments);
    } catch (err) {
      setError(err.message || 'Unable to create appointment.');
    } finally {
      setSaving(false);
    }
  };

  const formatAppointmentDate = (value) => new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Dar_es_Salaam',
  }).format(new Date(value));

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div>
          <p className="appointments-eyebrow">Visitor scheduling</p>
          <h1>Appointments</h1>
          <p>Create and review appointments for visitors.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => navigate('/visitors')}>
          Back to visitors
        </button>
      </div>

      <div className="appointments-layout">
        <section className="appointments-card appointments-form-card">
          <h2>Create Appointment</h2>
          <form className="appointments-form" onSubmit={handleSubmit}>
            <label>
              Visitor name
              <input name="visitorName" value={formData.visitorName} onChange={handleChange} placeholder="Visitor name" required />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone number" required />
            </label>
            <label>
              Appointment date and time
              <input name="appointmentDate" type="datetime-local" value={formData.appointmentDate} onChange={handleChange} required />
            </label>
            <label>
              Purpose
              <textarea name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Describe the appointment" rows="4" required />
            </label>
            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            {error && <p className="appointments-error">{error}</p>}
            {success && <p className="appointments-success">{success}</p>}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </form>
        </section>

        <section className="appointments-card">
          <div className="appointments-section-heading">
            <h2>Appointment list</h2>
            <span>{appointments.length} appointment{appointments.length === 1 ? '' : 's'}</span>
          </div>
          {appointments.length === 0 ? (
            <p className="appointments-empty">No appointments have been created yet.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <article className="appointment-item" key={appointment.id}>
                  <div>
                    <h3>{appointment.visitorName}</h3>
                    <p>{appointment.phone}</p>
                  </div>
                  <div className="appointment-meta">
                    <span className={`appointment-status ${appointment.status}`}>{appointment.status}</span>
                    <strong>{formatAppointmentDate(appointment.appointmentDate)}</strong>
                    <p>{appointment.purpose || 'No purpose provided'}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
