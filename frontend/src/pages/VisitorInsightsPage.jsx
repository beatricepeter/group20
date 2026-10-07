import { useEffect, useState } from 'react';
import { refreshVisitors } from '../lib/db';
import '../styles/VisitorInsightsPage.css';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'all', label: 'All records' },
];

function parseDateTime(value) {
  const text = String(value || '');
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text.replace(' ', 'T')}+03:00`);
}

function getDateKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(date);
}

function getDateKeyDaysAgo(dateKey, daysAgo) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function getWeekday(value) {
  const date = parseDateTime(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'Africa/Dar_es_Salaam',
  }).format(date);
}

export default function VisitorInsightsPage() {
  const [visitors, setVisitors] = useState([]);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshVisitors()
      .then(setVisitors)
      .catch((err) => setError(err.message || 'Unable to load visitor insights.'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const todayKey = getDateKey(now);
  const periodDays = period === 'all' ? null : Number(period);
  const startKey = periodDays ? getDateKeyDaysAgo(todayKey, periodDays - 1) : null;
  const visibleVisitors = visitors.filter((visitor) => {
    if (!startKey) return true;
    const date = parseDateTime(visitor.checkInDate || visitor.visitorDate);
    if (Number.isNaN(date.getTime())) return false;
    const dateKey = getDateKey(date);
    return dateKey >= startKey && dateKey <= todayKey;
  });

  const activeVisitors = visibleVisitors.filter((visitor) => !visitor.checkOutDate).length;
  const checkedOutVisitors = visibleVisitors.length - activeVisitors;
  const uniqueCompanies = new Set(visibleVisitors.map((visitor) => visitor.company).filter(Boolean)).size;
  const rhythmCounts = periodDays
    ? Array.from({ length: periodDays }, (_, index) => {
        const dateKey = getDateKeyDaysAgo(todayKey, periodDays - index - 1);
        const date = new Date(`${dateKey}T00:00:00Z`);
        const weekday = WEEKDAYS[(date.getUTCDay() + 6) % 7];
        const count = visibleVisitors.filter((visitor) => {
          const visitorDate = parseDateTime(visitor.checkInDate || visitor.visitorDate);
          return !Number.isNaN(visitorDate.getTime()) && getDateKey(visitorDate) === dateKey;
        }).length;
        return {
          key: dateKey,
          label: periodDays === 7 || index % 5 === 0 || index === periodDays - 1
            ? (periodDays === 7 ? weekday.slice(0, 3) : dateKey.slice(8, 10))
            : '',
          title: `${weekday}, ${dateKey}`,
          count,
        };
      })
    : WEEKDAYS.map((day) => ({
        key: day,
        label: day.slice(0, 3),
        title: day,
        count: visibleVisitors.filter((visitor) => getWeekday(visitor.checkInDate || visitor.visitorDate) === day).length,
      }));
  const maxRhythmCount = Math.max(...rhythmCounts.map(({ count }) => count), 1);

  const purposeCounts = Object.entries(
    visibleVisitors.reduce((counts, visitor) => {
      const purpose = visitor.purpose?.trim() || 'Other';
      counts[purpose] = (counts[purpose] || 0) + 1;
      return counts;
    }, {})
  ).sort(([, firstCount], [, secondCount]) => secondCount - firstCount).slice(0, 4);

  const todayVisitors = visibleVisitors.filter((visitor) => {
    const date = parseDateTime(visitor.checkInDate || visitor.visitorDate);
    return !Number.isNaN(date.getTime()) && getDateKey(date) === todayKey;
  }).length;

  return (
    <main className="insights-page">
      <section className="insights-hero">
        <div>
          <span className="eyebrow">Operations overview</span>
          <h1>Visitor insights</h1>
          <p>Understand traffic patterns and keep the reception desk moving.</p>
        </div>
        <div className="insights-actions">
          <select id="insights-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
            {PERIODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      {loading && <div className="insights-state">Loading visitor insights...</div>}
      {error && <div className="insights-state insights-error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="insights-stat-grid" aria-label="Visitor summary">
            <article className="insights-stat-card accent-coral">
              <span className="stat-label">Visitors in period</span>
              <strong>{visibleVisitors.length}</strong>
              <span className="stat-note">All recorded check-ins</span>
            </article>
            <article className="insights-stat-card accent-teal">
              <span className="stat-label">Checked in now</span>
              <strong>{activeVisitors}</strong>
              <span className="stat-note">{checkedOutVisitors} already checked out</span>
            </article>
            <article className="insights-stat-card accent-gold">
              <span className="stat-label">Today</span>
              <strong>{todayVisitors}</strong>
              <span className="stat-note">Visits recorded today</span>
            </article>
            <article className="insights-stat-card accent-ink">
              <span className="stat-label">Companies</span>
              <strong>{uniqueCompanies}</strong>
              <span className="stat-note">Unique organisations</span>
            </article>
          </section>

          <section className="insights-grid">
            <article className="insights-panel traffic-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">Traffic rhythm</span><h2>{periodDays ? 'Visits by day' : 'Visits by weekday'}</h2></div>
                <span className="panel-badge">{visibleVisitors.length} total</span>
              </div>
              <div className={periodDays === 30 ? 'rhythm-chart-scroll' : ''}>
                <div className={`weekday-chart${periodDays === 30 ? ' daily-rhythm-chart' : ''}`}>
                  {rhythmCounts.map(({ key, label, title, count }) => (
                  <div className="weekday-column" key={key} title={`${title}: ${count} ${count === 1 ? 'visit' : 'visits'}`}>
                    <div className="bar-track"><div className="bar-fill" style={{ height: `${(count / maxRhythmCount) * 100}%` }}><span>{count}</span></div></div>
                    <span>{label}</span>
                  </div>
                ))}
                </div>
              </div>
            </article>

            <article className="insights-panel purpose-panel">
              <div className="panel-heading"><div><span className="panel-kicker">Visit intent</span><h2>Top purposes</h2></div></div>
              {purposeCounts.length === 0 ? <p className="empty-copy">No purpose data for this period.</p> : (
                <div className="purpose-list">
                  {purposeCounts.map(([purpose, count]) => (
                    <div className="purpose-row" key={purpose}>
                      <div className="purpose-label"><span>{purpose}</span><strong>{count}</strong></div>
                      <div className="purpose-track"><div style={{ width: `${(count / visibleVisitors.length) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
