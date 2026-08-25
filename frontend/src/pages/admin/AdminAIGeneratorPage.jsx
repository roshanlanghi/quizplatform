import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminAIGeneratorPage() {
  const [subjects, setSubjects] = useState([]);
  const [, setLoadingSubjects] = useState(true);

  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [pyqRatio, setPyqRatio] = useState(70); // 70% PYQ, 30% AI
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [language, setLanguage] = useState('MARATHI');
  const [title, setTitle] = useState('');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoadingSubjects(true);
        const res = await api.get('/subjects');
        const subs = res.data.data.subjects || [];
        setSubjects(subs);
        if (subs.length > 0) setSubjectId(subs[0].id);
      } catch {
        setError('Failed to load subjects list.');
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const topics = selectedSubject?.topics || [];

  async function handleGenerateQuiz(e) {
    e.preventDefault();
    setError('');
    setGeneratedResult(null);
    setGenerating(true);

    try {
      const payload = {
        subjectId,
        ...(topicId && { topicId }),
        questionCount: parseInt(questionCount),
        duration: parseInt(duration),
        pyqRatio: parseInt(pyqRatio),
        difficulty,
        language,
        title: title.trim() || undefined,
      };

      const res = await api.post('/admin/ai/generate-quiz', payload);
      setGeneratedResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI quiz.');
    } finally {
      setGenerating(false);
    }
  }

  const aiRatio = 100 - pyqRatio;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'rgba(99,102,241,0.15)', color: 'var(--color-brand)' }}>
            AI Practice Engine
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>AI Quiz Generator Console</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Generate custom practice quizzes by blending authentic PYQs with AI-generated practice questions.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Generated Success Panel */}
      {generatedResult && (
        <div
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge" style={{ background: '#10b981', color: '#fff', marginBottom: '0.5rem' }}>
                Quiz Successfully Generated
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{generatedResult.quiz.title}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                Duration: {generatedResult.quiz.duration} Mins · Total Questions: {generatedResult.quiz.quizQuestions?.length}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ padding: '0.65rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: 'var(--color-brand)' }}>{generatedResult.breakdown.pyqCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700 }}>Authentic PYQs</div>
              </div>
              <div style={{ padding: '0.65rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: '#ec4899' }}>{generatedResult.breakdown.aiGeneratedCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700 }}>AI Practice Questions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generator Configuration Form */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          maxWidth: '720px',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          AI Quiz Parameters
        </h2>

        <form onSubmit={handleGenerateQuiz}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Select Target Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Topic (Optional)
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Topics</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: PYQ vs AI Mix Ratio Slider */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase' }}>
                Question Mix Ratio
              </label>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontWeight: 800 }}>
                <span style={{ color: '#10b981' }}>{pyqRatio}% Authentic PYQs</span>
                <span style={{ color: 'var(--color-brand)' }}>{aiRatio}% AI Practice</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={pyqRatio}
              onChange={(e) => setPyqRatio(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              <span>0% PYQ (100% AI)</span>
              <span>50% / 50%</span>
              <span>100% PYQ (0% AI)</span>
            </div>
          </div>

          {/* Row 3: Question Count, Duration, Difficulty, Language */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Question Count
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="MARATHI">Marathi (मराठी)</option>
                <option value="ENGLISH">English</option>
                <option value="BILINGUAL">Bilingual</option>
              </select>
            </div>
          </div>

          {/* Row 4: Custom Quiz Title */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Quiz Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., MPSC Indian Polity AI Challenge Set #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={generating}
            style={{
              padding: '0.85rem 2.5rem',
              background: 'var(--color-brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            {generating ? 'Generating AI Quiz...' : 'Generate AI Practice Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}
