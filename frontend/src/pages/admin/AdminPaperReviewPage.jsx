import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPTS = ['A', 'B', 'C', 'D'];

const STATUS_CFG = {
  PENDING_REVIEW: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  APPROVED:       { label: 'Approved',        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  REJECTED:       { label: 'Rejected',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING_REVIEW;
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`,
      textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── PDF / Image Viewer Panel ─────────────────────────────────────────────────

function PaperViewer({ paperId, mimeType }) {
  // Build authenticated URL — include JWT from localStorage
  const _token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  // We'll use an object/iframe with Authorization header via fetch + blob URL
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paperId) return;
    let revoked = false;

    async function loadFile() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/admin/papers/${paperId}/file`, {
          responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: res.headers['content-type'] || mimeType });
        const url = URL.createObjectURL(blob);
        if (!revoked) setBlobUrl(url);
      } catch (err) {
        if (!revoked) setError(err.response?.data?.message || 'Could not load paper file.');
      } finally {
        if (!revoked) setLoading(false);
      }
    }

    loadFile();
    return () => {
      revoked = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [paperId]);

  const isImage = mimeType && mimeType.startsWith('image/');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      {/* Viewer header */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)' }}>
        📄 Paper Preview
        {blobUrl && (
          <a href={blobUrl} download target="_blank" rel="noreferrer"
            style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600 }}>
            ↓ Download
          </a>
        )}
      </div>

      {/* Viewer body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--color-muted)' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-brand)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontSize: '0.85rem' }}>Loading paper…</span>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-danger)', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div style={{ fontSize: '0.875rem' }}>{error}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Upload a paper to preview it here.</div>
          </div>
        )}
        {!loading && !error && blobUrl && (
          isImage
            ? <img src={blobUrl} alt="Paper" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} />
            : <iframe src={blobUrl} title="Paper Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
        )}
      </div>
    </div>
  );
}

// ─── Inline Question Editor ───────────────────────────────────────────────────

function QuestionCard({ question, subjects, onApprove, onReject, onUpdate, approving, rejecting }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Build option map from array
  const optionMap = {};
  question.options?.forEach((o) => { optionMap[o.optionKey] = o.optionText; });

  // Edit state — initialize from question
  const [draft, setDraft] = useState({
    questionText: question.questionText,
    options: { A: optionMap.A || '', B: optionMap.B || '', C: optionMap.C || '', D: optionMap.D || '' },
    correctOption: question.correctOption,
    explanation: question.explanation || '',
    subjectId: question.subjectId || '',
    topicId: question.topicId || '',
    difficulty: question.difficulty,
  });

  // When question changes (e.g. after external update), reset draft
  useEffect(() => {
    const map = {};
    question.options?.forEach((o) => { map[o.optionKey] = o.optionText; });
    setDraft({
      questionText: question.questionText,
      options: { A: map.A || '', B: map.B || '', C: map.C || '', D: map.D || '' },
      correctOption: question.correctOption,
      explanation: question.explanation || '',
      subjectId: question.subjectId || '',
      topicId: question.topicId || '',
      difficulty: question.difficulty,
    });
    setEditing(false);
  }, [question.id]);

  const selectedSubject = subjects.find((s) => s.id === draft.subjectId);
  const topicsForSubject = selectedSubject?.topics || [];

  function setDraftField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    if (field === 'subjectId') setDraft((d) => ({ ...d, subjectId: value, topicId: '' }));
  }

  async function handleSave() {
    setSaveError('');
    setSaving(true);
    try {
      const payload = {
        questionText: draft.questionText.trim(),
        options: draft.options,
        correctOption: draft.correctOption,
        explanation: draft.explanation.trim() || null,
        subjectId: draft.subjectId || undefined,
        topicId: draft.topicId || null,
        difficulty: draft.difficulty,
      };
      await api.patch(`/admin/questions/${question.id}`, payload);
      onUpdate(question.id, {
        ...question,
        questionText: payload.questionText,
        explanation: payload.explanation,
        correctOption: payload.correctOption,
        difficulty: payload.difficulty,
        subjectId: payload.subjectId,
        topicId: payload.topicId,
        subject: subjects.find((s) => s.id === payload.subjectId),
        topic: topicsForSubject.find((t) => t.id === payload.topicId),
        options: OPTS.map((k) => ({ optionKey: k, optionText: draft.options[k] })),
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const inp = {
    width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.85rem', boxSizing: 'border-box',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', color: 'var(--color-text)', outline: 'none',
  };
  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '0.875rem',
      transition: 'border-color 0.2s',
    }}>
      {/* ── Card header ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusBadge status={question.status} />
          {question.subject && (
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-brand)', borderRadius: '999px', fontWeight: 600 }}>
              {question.subject.name}
            </span>
          )}
          {question.topic && (
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'var(--color-surface-2)', color: 'var(--color-muted)', borderRadius: '999px' }}>
              {question.topic.name}
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{question.difficulty}</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {/* Edit toggle */}
          {!editing && (
            <button id={`btn-edit-${question.id}`} onClick={() => setEditing(true)}
              style={{ padding: '0.3rem 0.75rem', background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
              ✏️ Edit
            </button>
          )}
          {/* Approve/Reject — only for PENDING_REVIEW */}
          {question.status === 'PENDING_REVIEW' && !editing && (
            <>
              <button id={`btn-approve-${question.id}`} disabled={approving || rejecting} onClick={() => onApprove(question.id)}
                style={{ padding: '0.3rem 0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                {approving ? '…' : '✓ Approve'}
              </button>
              <button id={`btn-reject-${question.id}`} disabled={approving || rejecting} onClick={() => onReject(question.id)}
                style={{ padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                {rejecting ? '…' : '✕ Reject'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── READ MODE ───────────────────────────── */}
      {!editing && (
        <>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.875rem', color: 'var(--color-text)' }}>
            {question.questionText}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.625rem' }}>
            {OPTS.map((key) => {
              const isCorrect = question.correctOption === key;
              return (
                <div key={key} style={{
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                  border: isCorrect ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid var(--color-border)',
                  background: isCorrect ? 'rgba(16,185,129,0.07)' : 'var(--color-surface-2)',
                  fontSize: '0.83rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                }}>
                  <span style={{ fontWeight: 700, color: isCorrect ? '#10b981' : 'var(--color-muted)', minWidth: '1.1rem' }}>{key}.</span>
                  <span style={{ color: isCorrect ? '#10b981' : 'var(--color-text)' }}>{optionMap[key] || '—'}</span>
                </div>
              );
            })}
          </div>
          {question.explanation && (
            <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-muted)', borderLeft: '3px solid var(--color-brand)' }}>
              <strong style={{ color: 'var(--color-brand)' }}>Explanation: </strong>{question.explanation}
            </div>
          )}
        </>
      )}

      {/* ── EDIT MODE ───────────────────────────── */}
      {editing && (
        <div>
          {/* Question text */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={lbl}>Question Text</label>
            <textarea
              value={draft.questionText}
              onChange={(e) => setDraftField('questionText', e.target.value)}
              rows={4}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
          </div>

          {/* Options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {OPTS.map((key) => (
              <div key={key}>
                <label style={lbl}>Option {key}</label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={draft.correctOption === key}
                    onChange={() => setDraftField('correctOption', key)}
                    title={`Mark ${key} as correct`}
                    style={{ accentColor: '#10b981', flexShrink: 0 }}
                  />
                  <input
                    value={draft.options[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, options: { ...d.options, [key]: e.target.value } }))}
                    style={{ ...inp, flex: 1, border: draft.correctOption === key ? '1.5px solid rgba(16,185,129,0.5)' : undefined }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Meta row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <div>
              <label style={lbl}>Difficulty</label>
              <select value={draft.difficulty} onChange={(e) => setDraftField('difficulty', e.target.value)} style={inp}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Subject</label>
              <select value={draft.subjectId}
                onChange={(e) => { setDraft((d) => ({ ...d, subjectId: e.target.value, topicId: '' })); }}
                style={inp}>
                <option value="">— Select —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Topic</label>
              <select value={draft.topicId} onChange={(e) => setDraftField('topicId', e.target.value)} style={inp} disabled={!draft.subjectId}>
                <option value="">— Select —</option>
                {topicsForSubject.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={lbl}>Explanation (optional)</label>
            <textarea
              value={draft.explanation}
              onChange={(e) => setDraftField('explanation', e.target.value)}
              rows={2}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {saveError && (
            <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
              ⚠️ {saveError}
            </div>
          )}

          {/* Save / Cancel */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button id={`btn-save-${question.id}`} disabled={saving} onClick={handleSave}
              style={{ padding: '0.4rem 1.25rem', background: saving ? 'var(--color-surface-2)' : 'var(--color-brand)', color: saving ? 'var(--color-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : '💾 Save'}
            </button>
            <button onClick={() => { setEditing(false); setSaveError(''); }}
              style={{ padding: '0.4rem 1rem', background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

export default function AdminPaperReviewPage() {
  const { id } = useParams();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [actionState, setActionState] = useState({});
  const [bulking, setBulking] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const [showViewer, setShowViewer] = useState(true);

  async function fetchData() {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        api.get(`/admin/papers/${id}/questions?limit=200`),
        api.get('/subjects'),
      ]);
      setPaper(qRes.data.data.paper);
      setQuestions(qRes.data.data.questions);
      setSubjects(sRes.data.data.subjects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [id]);

  const handleUpdate = useCallback((qId, updated) => {
    setQuestions((prev) => prev.map((q) => q.id === qId ? updated : q));
  }, []);

  async function approveQuestion(qId) {
    setActionState((s) => ({ ...s, [qId]: 'approving' }));
    try {
      await api.post(`/admin/questions/${qId}/approve`);
      setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, status: 'APPROVED' } : q));
    } catch (err) { alert(err.response?.data?.message || 'Approve failed.'); }
    finally { setActionState((s) => ({ ...s, [qId]: null })); }
  }

  async function rejectQuestion(qId) {
    setActionState((s) => ({ ...s, [qId]: 'rejecting' }));
    try {
      await api.post(`/admin/questions/${qId}/reject`);
      setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, status: 'REJECTED' } : q));
    } catch (err) { alert(err.response?.data?.message || 'Reject failed.'); }
    finally { setActionState((s) => ({ ...s, [qId]: null })); }
  }

  async function handleBulkApprove() {
    if (!window.confirm('Approve ALL pending questions from this paper?')) return;
    setBulking(true); setBulkResult('');
    const pending = questions.filter((q) => q.status === 'PENDING_REVIEW');
    let count = 0;
    for (const q of pending) { try { await api.post(`/admin/questions/${q.id}/approve`); count++; } catch {} }
    setQuestions((prev) => prev.map((q) => q.status === 'PENDING_REVIEW' ? { ...q, status: 'APPROVED' } : q));
    setBulkResult(`✅ Approved ${count} / ${pending.length} questions.`);
    setBulking(false);
  }

  async function handleBulkReject() {
    if (!window.confirm('Reject ALL pending questions from this paper?')) return;
    setBulking(true); setBulkResult('');
    const pending = questions.filter((q) => q.status === 'PENDING_REVIEW');
    let count = 0;
    for (const q of pending) { try { await api.post(`/admin/questions/${q.id}/reject`); count++; } catch {} }
    setQuestions((prev) => prev.map((q) => q.status === 'PENDING_REVIEW' ? { ...q, status: 'REJECTED' } : q));
    setBulkResult(`❌ Rejected ${count} / ${pending.length} questions.`);
    setBulking(false);
  }

  const total    = questions.length;
  const pending  = questions.filter((q) => q.status === 'PENDING_REVIEW').length;
  const approved = questions.filter((q) => q.status === 'APPROVED').length;
  const rejected = questions.filter((q) => q.status === 'REJECTED').length;

  const displayed = filter === 'ALL' ? questions : questions.filter((q) => q.status === filter);

  const pill = (label, count, color) => (
    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.78rem', fontWeight: 700, border: `1px solid ${color}30` }}>
      {label}: {count}
    </span>
  );

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>Loading review…</div>;
  if (error)   return <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>{error}</div>;

  return (
    <div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Back + title ──────────────────────────── */}
      <Link to="/admin/papers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
        ← Back to Papers
      </Link>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.2rem' }}>Review Extracted Questions</h1>
            {paper && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                {paper.title} · {paper.year} · {paper.language}
              </p>
            )}
          </div>
          {/* Toggle PDF panel */}
          <button onClick={() => setShowViewer((v) => !v)}
            style={{ padding: '0.4rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            {showViewer ? '🙈 Hide Paper' : '📄 Show Paper'}
          </button>
        </div>
      </div>

      {/* ── Split layout ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: showViewer ? '1fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT — PDF viewer (sticky) */}
        {showViewer && (
          <div style={{ position: 'sticky', top: '1rem', height: 'calc(100vh - 160px)', minHeight: '500px' }}>
            <PaperViewer paperId={id} mimeType={paper?.mimeType} />
          </div>
        )}

        {/* RIGHT — Questions panel */}
        <div>
          {/* Stats + bulk actions bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {pill('Total', total, '#6366f1')}
              {pill('Pending', pending, '#f59e0b')}
              {pill('Approved', approved, '#10b981')}
              {pill('Rejected', rejected, '#ef4444')}
            </div>
            {pending > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button id="btn-bulk-approve" disabled={bulking} onClick={handleBulkApprove}
                  style={{ padding: '0.35rem 0.85rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.78rem', cursor: bulking ? 'not-allowed' : 'pointer' }}>
                  {bulking ? 'Working…' : `✓ Approve All (${pending})`}
                </button>
                <button id="btn-bulk-reject" disabled={bulking} onClick={handleBulkReject}
                  style={{ padding: '0.35rem 0.85rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.78rem', cursor: bulking ? 'not-allowed' : 'pointer' }}>
                  ✕ Reject All ({pending})
                </button>
              </div>
            )}
          </div>

          {/* Bulk result */}
          {bulkResult && (
            <div style={{ padding: '0.65rem 1rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', color: '#10b981', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.875rem' }}>
              {bulkResult}
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const cnt = f === 'ALL' ? total : f === 'PENDING_REVIEW' ? pending : f === 'APPROVED' ? approved : rejected;
              const label = f === 'PENDING_REVIEW' ? 'Pending' : f === 'ALL' ? 'All' : f === 'APPROVED' ? 'Approved' : 'Rejected';
              return (
                <button key={f} id={`filter-${f}`} onClick={() => setFilter(f)}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: filter === f ? 'var(--color-brand)' : 'var(--color-surface)', color: filter === f ? '#fff' : 'var(--color-muted)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {label} ({cnt})
                </button>
              );
            })}
          </div>

          {/* Question cards */}
          {displayed.length === 0
            ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No questions in this view.</div>
              </div>
            )
            : displayed.map((q, idx) => (
              <div key={q.id} style={{ position: 'relative' }}>
                {/* Question number badge */}
                <div style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', fontSize: '0.7rem', color: 'var(--color-muted)', background: 'var(--color-surface-2)', borderRadius: '999px', padding: '0.15rem 0.5rem', fontWeight: 700 }}>
                  #{idx + 1}
                </div>
                <QuestionCard
                  key={q.id}
                  question={q}
                  subjects={subjects}
                  onApprove={approveQuestion}
                  onReject={rejectQuestion}
                  onUpdate={handleUpdate}
                  approving={actionState[q.id] === 'approving'}
                  rejecting={actionState[q.id] === 'rejecting'}
                />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
