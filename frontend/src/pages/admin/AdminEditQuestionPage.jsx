import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminEditQuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');

  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [language, setLanguage] = useState('MARATHI');
  const [status, setStatus] = useState('APPROVED');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuestion() {
      try {
        const [subjectsRes, questionRes] = await Promise.all([
          api.get('/subjects'),
          api.get(`/admin/questions/${id}`),
        ]);

        setSubjects(subjectsRes.data.data.subjects);
        const q = questionRes.data.data.question;

        setQuestionText(q.questionText || '');
        setCorrectOption(q.correctOption || 'A');
        setExplanation(q.explanation || '');
        setSubjectId(q.subjectId || '');
        setTopicId(q.topicId || '');
        setDifficulty(q.difficulty || 'MEDIUM');
        setLanguage(q.language || 'MARATHI');
        setStatus(q.status || 'APPROVED');

        const optsObj = { A: '', B: '', C: '', D: '' };
        q.options?.forEach((opt) => {
          optsObj[opt.optionKey] = opt.optionText;
        });
        setOptions(optsObj);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load question details.');
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [id]);

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const availableTopics = currentSubject?.topics || [];

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        questionText,
        options,
        correctOption,
        explanation,
        subjectId,
        topicId: topicId || null,
        difficulty,
        language,
        status,
      };

      await api.patch(`/admin/questions/${id}`, payload);
      navigate('/admin/questions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update question.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--color-muted)', padding: '2rem' }}>Loading question data...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Edit Question</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Modify statement, options, solution explanation, and tagging.
          </p>
        </div>
        <Link to="/admin/questions" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          ← Back to Question Bank
        </Link>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tagging */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>1. Metadata & Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Subject</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId('');
                }}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="">General Topic</option>
                {availableTopics.map((top) => (
                  <option key={top.id} value={top.id}>{top.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="APPROVED">Approved</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Question & Options */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>2. Content & Solution</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Question Statement</label>
            <textarea
              required
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Options & Correct Choice:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {['A', 'B', 'C', 'D'].map((key) => (
                <div
                  key={key}
                  style={{
                    background: correctOption === key ? 'rgba(99,102,241,0.12)' : 'var(--color-surface-2)',
                    border: `1px solid ${correctOption === key ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: correctOption === key ? 'var(--color-brand)' : 'var(--color-muted)' }}>Option {key}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOption === key}
                        onChange={() => setCorrectOption(key)}
                      />
                      Correct
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={options[key]}
                    onChange={(e) => setOptions({ ...options, [key]: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Explanation</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link to="/admin/questions" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {saving ? 'Updating...' : 'Update Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
