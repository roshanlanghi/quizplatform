import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--color-muted)', padding: '2rem 0' }}>Loading dashboard statistics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
        {error}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Registered Users', value: stats?.totalUsers || 0, color: '#6366f1' },
    { label: 'Active Students', value: stats?.activeStudents || 0, color: '#22c55e' },
    { label: 'Total Questions', value: stats?.totalQuestions || 0, color: '#8b5cf6' },
    { label: 'Approved Questions', value: stats?.approvedQuestions || 0, color: '#10b981' },
    { label: 'Pending Review Questions', value: stats?.pendingQuestions || 0, color: '#f59e0b' },
    { label: 'AI Generated Questions', value: stats?.aiQuestions || 0, color: '#ec4899' },
    { label: 'Total Subjects', value: stats?.totalSubjects || 0, color: '#3b82f6' },
    { label: 'Uploaded Papers', value: stats?.totalPapers || 0, color: '#14b8a6' },
  ];

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Overview of platform users, question bank content, and processing metrics.
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/admin/subjects" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
            Manage Subjects & Topics
          </Link>
          <Link to="/admin/questions" className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
            View Question Bank
          </Link>
          <Link to="/admin/papers" className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
            View Question Papers
          </Link>
        </div>
      </div>
    </div>
  );
}
