import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [aiFilter, setAiFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        ...(statusFilter && { status: statusFilter }),
        ...(subjectFilter && { subjectId: subjectFilter }),
        ...(aiFilter && { aiGenerated: aiFilter }),
        page: pagination.page,
        limit: 10,
      };

      const res = await api.get('/admin/questions', { params });
      setQuestions(res.data.data.questions);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter, subjectFilter, aiFilter, pagination.page]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/questions/${id}/approve`);
      setMessage('Question approved!');
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve question.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/questions/${id}/reject`);
      setMessage('Question rejected.');
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject question.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setMessage('Question deleted.');
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)', border: '1px solid rgba(34,197,94,0.3)' }}>APPROVED</span>;
      case 'PENDING_REVIEW':
        return <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.3)' }}>PENDING REVIEW</span>;
      case 'REJECTED':
        return <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' }}>REJECTED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Question Bank Overview</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            View, filter, create, and manage extracted & manual questions.
          </p>
        </div>
        <Link to="/admin/questions/new" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          + Add New Question
        </Link>
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-muted)' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-muted)' }}>Subject:</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.85rem' }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-muted)' }}>Type:</label>
          <select
            value={aiFilter}
            onChange={(e) => setAiFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.85rem' }}
          >
            <option value="">All Types</option>
            <option value="false">Authentic PYQs</option>
            <option value="true">AI Generated</option>
          </select>
        </div>

        {(statusFilter || subjectFilter || aiFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setSubjectFilter('');
              setAiFilter('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Questions Data Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>Loading question bank...</div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No questions found</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
              Add authentic PYQs or practice questions manually using the button below.
            </p>
            <Link to="/admin/questions/new" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
              + Add Question Now
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Question Statement</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Subject / Topic</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', maxWidth: '380px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem', lineHeight: 1.4 }}>{q.questionText}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 600 }}>
                      Correct Answer: Option {q.correctOption}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600 }}>{q.subject?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{q.topic?.name || 'General'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {q.aiGenerated ? (
                      <span className="badge" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>AI Generated</span>
                    ) : (
                      <span className="badge badge-brand">Authentic PYQ</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{getStatusBadge(q.status)}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {q.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(q.id)}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--color-success)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          title="Approve Question"
                        >
                          Approve
                        </button>
                      )}
                      {q.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(q.id)}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-warning)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          title="Reject Question"
                        >
                          Reject
                        </button>
                      )}
                      <Link
                        to={`/admin/questions/${q.id}/edit`}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        title="Edit Question"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(q.id)}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        title="Delete Question"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
