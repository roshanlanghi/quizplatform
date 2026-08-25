import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminCreateQuestionPage() {
  const navigate = useNavigate();

  // Reference data
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form states
  const [examId, setExamId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [year, setYear] = useState('2024');

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');

  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [language, setLanguage] = useState('MARATHI');
  const [sourceType, setSourceType] = useState('PYQ');
  const [_status, setStatus] = useState('APPROVED');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [examsRes, subjectsRes] = await Promise.all([
          api.get('/exams'),
          api.get('/subjects'),
        ]);

        const fetchedExams = examsRes.data.data.exams;
        setExams(fetchedExams);
        if (fetchedExams.length > 0) {
          setExamId(fetchedExams[0].id);
          if (fetchedExams[0].stages?.length > 0) {
            setStageId(fetchedExams[0].stages[0].id);
          }
        }

        const fetchedSubjects = subjectsRes.data.data.subjects;
        setSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) {
          setSubjectId(fetchedSubjects[0].id);
        }
      } catch {
        setError('Failed to load initial data. Check server connection.');
      }
    }
    loadData();
  }, []);

  // Filter topics based on chosen subject
  const currentSubject = subjects.find((s) => s.id === subjectId);
  const availableTopics = currentSubject?.topics || [];

  const handleSubmit = async (e, forceDuplicate = false) => {
    if (e) e.preventDefault();
    setError('');
    setDuplicateWarning(false);
    setLoading(true);

    try {
      const payload = {
        questionText,
        options,
        correctOption,
        explanation,
        examId,
        stageId,
        subjectId,
        topicId: topicId || null,
        year: parseInt(year),
        difficulty,
        language,
        status,
        sourceType,
        allowDuplicate: forceDuplicate,
      };

      await api.post('/admin/questions', payload);
      navigate('/admin/questions');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateWarning(true);
      } else {
        setError(err.response?.data?.message || 'Failed to save question.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Manual Question Entry</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Add authentic PYQs or Practice questions with 4 options and solution explanation.
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

      {duplicateWarning && (
        <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-warning)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Duplicate Question Warning</h4>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            An identical or nearly identical question already exists in the database. Are you sure you want to create a duplicate?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={(e) => handleSubmit(e, true)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              Yes, Save Duplicate
            </button>
            <button onClick={() => setDuplicateWarning(false)} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Question Metadata */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>1. Question Metadata & Tagging</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Exam</label>
              <select
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value);
                  const selected = exams.find((ex) => ex.id === e.target.value);
                  if (selected?.stages?.length > 0) setStageId(selected.stages[0].id);
                }}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Exam Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {exams.find((ex) => ex.id === examId)?.stages?.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Topic (Optional)</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
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

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="MARATHI">Marathi</option>
                <option value="ENGLISH">English</option>
                <option value="BILINGUAL">Bilingual</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="PYQ">Authentic PYQ</option>
                <option value="PRACTICE">Practice Question</option>
                <option value="MOCK">Mock Test Question</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Question Content & 4 Options */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>2. Question Text & Options</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Question Statement</label>
            <textarea
              required
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter question text here..."
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Four Options (Select radio button for Correct Answer):
            </label>
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
                    <span style={{ fontWeight: 800, color: correctOption === key ? 'var(--color-brand)' : 'var(--color-muted)' }}>
                      Option {key}
                    </span>
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
                    placeholder={`Option ${key} text...`}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Explanation / Solution (Optional)</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide detailed solution explanation..."
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link to="/admin/questions" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {loading ? 'Saving Question...' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
