import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function QuizCatalogPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generator modal state
  const [activeTab, setActiveTab] = useState('SUBJECT'); // 'DAILY', 'SUBJECT', 'PYQ', 'MOCK'
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [subRes, qRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/quizzes?limit=10'),
        ]);
        setSubjects(subRes.data.data.subjects || []);
        setQuizzes(qRes.data.data.quizzes || []);
        if (subRes.data.data.subjects?.length > 0) {
          setSelectedSubjectId(subRes.data.data.subjects[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz catalog.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
        animateStaggerCards(containerRef.current, '.card');
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  async function handleStartQuiz(quizType, customParams = {}) {
    setError('');
    setGenerating(true);

    try {
      let finalQuizId = null;

      if (quizType === 'EXISTING' && customParams.quizId) {
        finalQuizId = customParams.quizId;
      } else {
        // Generate dynamic quiz
        const payload = {
          quizType,
          questionCount: parseInt(questionCount),
          duration: parseInt(duration),
          ...(quizType === 'SUBJECT' && { subjectId: selectedSubjectId }),
        };

        const res = await api.post('/quizzes/generate', payload);
        finalQuizId = res.data.data.quiz.id;
      }

      // Navigate to Quiz Taker
      navigate(`/quizzes/${finalQuizId}/take`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz. Make sure questions exist for this selection.');
    } finally {
      setGenerating(false);
    }
  }

  const categoryCards = [
    {
      id: 'DAILY',
      title: 'Daily Practice Set',
      tagline: 'Mixed syllabus revision',
      description: '10-question mixed practice set to maintain daily learning consistency.',
    },
    {
      id: 'SUBJECT',
      title: 'Subject Specific Quiz',
      tagline: 'Targeted core topics',
      description: 'Choose a specific subject (History, Polity, Geography, Science) for focused practice.',
    },
    {
      id: 'PYQ',
      title: 'Authentic PYQ Test',
      tagline: 'Official MPSC Papers',
      description: 'Practice real exam questions extracted from previous MPSC Group C question papers.',
    },
    {
      id: 'MOCK',
      title: 'Full Mock Test',
      tagline: 'Timed exam simulation',
      description: 'Full-length test simulating authentic MPSC Group C exam pattern and strict timer controls.',
    },
  ];

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container-app">
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Test Series & Practice Hub</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Select a practice mode below to test your MPSC Group C preparation with instant scoring and detailed solutions.
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(185,28,28,0.2)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Practice Mode Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {categoryCards.map((card) => {
            const isSelected = activeTab === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--color-brand-light)' : 'var(--color-surface)',
                  border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                <span className={isSelected ? "badge badge-brand" : "badge"} style={{ marginBottom: '0.5rem', backgroundColor: isSelected ? '#DBEAFE' : 'var(--color-surface-2)' }}>
                  {card.tagline}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem', marginBottom: '0.4rem', color: isSelected ? 'var(--color-brand)' : 'var(--color-text)' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5, margin: 0 }}>
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quiz Parameters Panel */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem 2rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
            Configure {categoryCards.find((c) => c.id === activeTab)?.title}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Subject Selector (if Subject mode) */}
            {activeTab === 'SUBJECT' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Select Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Count */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Question Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value={5}>5 Questions (Quick)</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={20}>20 Questions (Comprehensive)</option>
                <option value={30}>30 Questions (Full Set)</option>
              </select>
            </div>

            {/* Time Limit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Time Limit
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleStartQuiz(activeTab)}
            disabled={generating}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '0.9375rem',
            }}
          >
            {generating ? 'Generating Test...' : 'Start Test Now →'}
          </button>
        </div>

        {/* Available Presets */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>
            Preset Test Papers ({quizzes.length})
          </h2>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>Loading test series...</div>
          ) : quizzes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
              No preset quizzes configured yet. Use the configuration generator above to start custom practice sets instantly.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-brand">{q.quizType}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                        {q.duration} min
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
                      {q.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      {q.description || `${q.totalQuestions} questions · Total ${q.totalMarks} Marks`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartQuiz('EXISTING', { quizId: q.id })}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Start Test →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
