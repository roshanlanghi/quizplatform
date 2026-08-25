import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// ─── Processing Status Config ─────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PROCESSING: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  EXTRACTED: { label: 'Extracted', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  FAILED: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}30`,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

function DropZone({ label, accept, file, onChange, id }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onChange(dropped);
    },
    [onChange]
  );

  return (
    <div
      id={id}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-brand)' : file ? 'var(--color-success, #10b981)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        background: dragging
          ? 'rgba(99,102,241,0.05)'
          : file
          ? 'rgba(16,185,129,0.05)'
          : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) onChange(e.target.files[0]); }}
      />
      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
        {file ? '📄' : '📂'}
      </div>
      {file ? (
        <>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {file.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
            {formatBytes(file.size)} · Click to change
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
            PDF, JPG, PNG · Max 20 MB
          </div>
        </>
      )}
    </div>
  );
}

// ─── Upload Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ value }) {
  return (
    <div style={{ background: 'var(--color-border)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: 'linear-gradient(90deg, var(--color-brand), #818cf8)',
          borderRadius: '999px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  examId: '',
  stageId: '',
  year: new Date().getFullYear().toString(),
  title: '',
  language: 'MARATHI',
  totalMarks: '100',
  duration: '60',
};

export default function AdminPapersPage() {
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [listError, setListError] = useState('');

  const [exams, setExams] = useState([]);
  const [stages, setStages] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [paperFile, setPaperFile] = useState(null);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [processingIds, setProcessingIds] = useState(new Set());
  const [processError, setProcessError] = useState('');
  const pollRef = useRef(null);

  const [deletingId, setDeletingId] = useState(null);


  // ── Fetch papers
  async function fetchPapers() {
    try {
      setLoadingPapers(true);
      const res = await api.get('/admin/papers');
      const fetched = res.data.data.papers;
      setPapers(fetched);
      // Sync processingIds with current DB status
      const stillProcessing = new Set(
        fetched.filter((p) => p.processingStatus === 'PROCESSING').map((p) => p.id)
      );
      setProcessingIds(stillProcessing);
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load papers.');
    } finally {
      setLoadingPapers(false);
    }
  }

  // ── Fetch exams
  async function fetchExams() {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data.exams || []);
    } catch {
      // non-fatal
    } finally {
      setLoadingExams(false);
    }
  }

  useEffect(() => {
    fetchPapers();
    fetchExams();
  }, []);

  // ── Poll while any paper is PROCESSING ───────────────────────────────────────
  useEffect(() => {
    if (processingIds.size === 0) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/admin/papers');
        const fetched = res.data.data.papers;
        setPapers(fetched);
        const stillProcessing = new Set(
          fetched.filter((p) => p.processingStatus === 'PROCESSING').map((p) => p.id)
        );
        setProcessingIds(stillProcessing);
        if (stillProcessing.size === 0) clearInterval(pollRef.current);
      } catch {
        clearInterval(pollRef.current);
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [processingIds.size]);

  // ── When exam changes, load its stages
  useEffect(() => {
    if (!form.examId) { setStages([]); return; }
    const exam = exams.find((e) => e.id === form.examId);
    setStages(exam?.stages || []);
    setForm((f) => ({ ...f, stageId: '' }));
  }, [form.examId, exams]);

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!paperFile) {
      setUploadError('Please select a question paper file (PDF, DOCX, DOC, TXT, or image).');
      return;
    }
    if (!form.examId || !form.stageId) {
      setUploadError('Please select an exam and stage.');
      return;
    }

    const data = new FormData();
    data.append('paperFile', paperFile);
    if (answerKeyFile) data.append('answerKeyFile', answerKeyFile);
    Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v); });

    setUploading(true);
    setUploadProgress(0);

    try {
      await api.post('/admin/papers/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setUploadProgress(pct);
        },
      });

      setUploadSuccess('Paper uploaded successfully! Status set to PENDING.');
      setForm(INITIAL_FORM);
      setPaperFile(null);
      setAnswerKeyFile(null);
      setShowForm(false);
      fetchPapers();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(paperId) {
    if (!window.confirm('Delete this paper? This will also remove the stored file and cannot be undone.')) return;
    setDeletingId(paperId);
    try {
      await api.delete(`/admin/papers/${paperId}`);
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete paper.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleProcess(paperId) {
    setProcessError('');
    try {
      await api.post(`/admin/papers/${paperId}/process`);
      // Optimistically set status to PROCESSING in local state
      setPapers((prev) =>
        prev.map((p) => p.id === paperId ? { ...p, processingStatus: 'PROCESSING' } : p)
      );
      setProcessingIds((prev) => new Set([...prev, paperId]));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start processing.';
      setProcessError(msg);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-muted)',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Question Papers</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Upload, manage, and process MPSC question paper PDFs.
          </p>
        </div>
        <button
          id="btn-toggle-upload-form"
          onClick={() => {
            setShowForm((v) => !v);
            setUploadError('');
            setUploadSuccess('');
          }}
          style={{
            padding: '0.6rem 1.25rem',
            background: showForm ? 'var(--color-surface-2)' : 'var(--color-brand)',
            color: showForm ? 'var(--color-text)' : '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Upload Paper'}
        </button>
      </div>

      {/* ── Global Success Toast ─────────────────────── */}
      {uploadSuccess && (
        <div
          style={{
            padding: '0.9rem 1.25rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#10b981',
            fontWeight: 600,
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          ✅ {uploadSuccess}
        </div>
      )}

      {/* ── Upload Form Panel ────────────────────────── */}
      {showForm && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            📤 Upload Question Paper
          </h2>

          <form onSubmit={handleUpload} id="form-upload-paper">
            {/* Row 1: Exam + Stage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle} htmlFor="examId">Exam *</label>
                <select
                  id="examId"
                  name="examId"
                  value={form.examId}
                  onChange={handleFormChange}
                  required
                  style={inputStyle}
                  disabled={loadingExams}
                >
                  <option value="">{loadingExams ? 'Loading...' : 'Select exam…'}</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="stageId">Stage *</label>
                <select
                  id="stageId"
                  name="stageId"
                  value={form.stageId}
                  onChange={handleFormChange}
                  required
                  style={inputStyle}
                  disabled={!form.examId}
                >
                  <option value="">{form.examId ? 'Select stage…' : 'Select exam first'}</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Year + Language */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle} htmlFor="year">Year *</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  value={form.year}
                  onChange={handleFormChange}
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="language">Language</label>
                <select
                  id="language"
                  name="language"
                  value={form.language}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="MARATHI">Marathi</option>
                  <option value="ENGLISH">English</option>
                  <option value="BILINGUAL">Bilingual</option>
                </select>
              </div>
            </div>

            {/* Row 3: Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle} htmlFor="title">Paper Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleFormChange}
                required
                placeholder="e.g. MPSC Group C Prelims 2024 — General Studies Paper 1"
                style={inputStyle}
              />
            </div>

            {/* Row 4: Total Marks + Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle} htmlFor="totalMarks">Total Marks</label>
                <input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  value={form.totalMarks}
                  onChange={handleFormChange}
                  min="1"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="duration">Duration (min)</label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  value={form.duration}
                  onChange={handleFormChange}
                  min="1"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 5: File drop zones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Question Paper File *</label>
                <DropZone
                  id="dropzone-paper"
                  label="Drop PDF, DOCX, DOC, TXT or image here, or click to browse"
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                  file={paperFile}
                  onChange={setPaperFile}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Answer Key (optional)</label>
                <DropZone
                  id="dropzone-answer-key"
                  label="Drop PDF, DOCX, DOC, TXT or image here, or click to browse"
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                  file={answerKeyFile}
                  onChange={setAnswerKeyFile}
                />
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                ⚠️ {uploadError}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} />
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-submit-upload"
              type="submit"
              disabled={uploading}
              style={{
                padding: '0.7rem 2rem',
                background: uploading ? 'var(--color-surface-2)' : 'var(--color-brand)',
                color: uploading ? 'var(--color-muted)' : '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Uploading…' : '📤 Upload Paper'}
            </button>
          </form>
        </div>
      )}

      {/* ── Papers List Error ─────────────────────────────────── */}
      {listError && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
          }}
        >
          {listError}
        </div>
      )}

      {/* ── Process Error ─────────────────────────────────────── */}
      {processError && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {processError}</span>
          <button onClick={() => setProcessError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* CSS animation for processing spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Papers Table ─────────────────────────────── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontWeight: 700 }}>
            {loadingPapers ? 'Loading…' : `${papers.length} Paper${papers.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loadingPapers ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            Loading paper records…
          </div>
        ) : papers.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📁</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No papers uploaded yet</div>
            <p style={{ fontSize: '0.85rem' }}>Click <strong>+ Upload Paper</strong> to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Paper Title', 'Exam / Stage', 'Year', 'Language', 'File Size', 'Status', 'Questions', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--color-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600, maxWidth: '280px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.title}>
                        {p.title}
                      </div>
                      {p.mimeType && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                          {p.mimeType}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600 }}>{p.exam?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{p.stage?.name || '—'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{p.year}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      {p.language?.charAt(0) + p.language?.slice(1).toLowerCase() || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatBytes(p.fileSize)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <StatusBadge status={p.processingStatus} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.6rem',
                          background: 'rgba(99,102,241,0.12)',
                          color: 'var(--color-brand)',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {p._count?.questions ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Process button — show for PENDING or FAILED */}
                        {['PENDING', 'FAILED'].includes(p.processingStatus) && (
                          <button
                            id={`btn-process-paper-${p.id}`}
                            onClick={() => handleProcess(p.id)}
                            style={{
                              padding: '0.35rem 0.8rem',
                              background: 'rgba(59,130,246,0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59,130,246,0.25)',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⚙️ Process
                          </button>
                        )}
                        {/* Processing spinner */}
                        {p.processingStatus === 'PROCESSING' && (
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span> Processing…
                          </span>
                        )}
                        {/* Review link — show when EXTRACTED */}
                        {p.processingStatus === 'EXTRACTED' && (
                          <Link
                            to={`/admin/papers/${p.id}/review`}
                            id={`btn-review-paper-${p.id}`}
                            style={{
                              padding: '0.35rem 0.8rem',
                              background: 'rgba(16,185,129,0.1)',
                              color: '#10b981',
                              border: '1px solid rgba(16,185,129,0.25)',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            👁 Review
                          </Link>
                        )}
                        {/* Delete button */}
                        <button
                          id={`btn-delete-paper-${p.id}`}
                          disabled={deletingId === p.id || p.processingStatus === 'PROCESSING'}
                          onClick={() => handleDelete(p.id)}
                          style={{
                            padding: '0.35rem 0.8rem',
                            background: 'rgba(239,68,68,0.1)',
                            color: 'var(--color-danger)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: (deletingId === p.id || p.processingStatus === 'PROCESSING') ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            opacity: p.processingStatus === 'PROCESSING' ? 0.4 : 1,
                          }}
                        >
                          {deletingId === p.id ? 'Deleting…' : '🗑 Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
