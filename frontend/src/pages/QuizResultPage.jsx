import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const containerRef = useRef(null);

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'CORRECT', 'INCORRECT', 'UNATTEMPTED'

  useEffect(() => {
    async function loadAttemptResult() {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/attempts/${attemptId}`);
        setAttempt(res.data.data.attempt);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    }

    loadAttemptResult();
  }, [attemptId]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
        animateStaggerCards(containerRef.current, '.card');
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>Calculating score & diagnostic analytics...</div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)' }}>
          {error || 'Quiz result not found.'}
        </div>
      </div>
    );
  }

  const { quiz, answers = [] } = attempt;

  const formatTimeSpent = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Performance rating badge
  const accuracy = attempt.accuracy || 0;
  let statusBadge = { label: 'Needs Revision', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', border: 'rgba(185,28,28,0.2)' };
  if (accuracy >= 80) {
    statusBadge = { label: 'Excellent Mastery', color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'rgba(21,128,61,0.2)' };
  } else if (accuracy >= 60) {
    statusBadge = { label: 'Good Performance', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'rgba(180,83,9,0.2)' };
  }

  // Filtered answers
  const filteredAnswers = answers.filter((ans) => {
    if (activeFilter === 'CORRECT') return ans.isCorrect;
    if (activeFilter === 'INCORRECT') return !ans.isCorrect && ans.selectedOption;
    if (activeFilter === 'UNATTEMPTED') return !ans.selectedOption;
    return true;
  });

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container">
        {/* Navigation Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/quizzes" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            ← Back to Test Series
          </Link>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            Attempted on {new Date(attempt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Hero Result Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.border}`,
                display: 'inline-block',
                marginBottom: '0.5rem',
              }}
            >
              {statusBadge.label}
            </span>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, marginTop: '0.25rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
              {quiz?.title || 'Quiz Result'}
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', margin: 0 }}>
              Test completed in {formatTimeSpent(attempt.timeSpentSeconds)}
            </p>
          </div>

          {/* Score & Accuracy Metrics */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1 }}>
                {attempt.score} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 500 }}>/ {attempt.maxScore}</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginTop: '0.35rem', letterSpacing: '0.03em' }}>
                Final Score
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: statusBadge.color, lineHeight: 1 }}>
                {attempt.accuracy}%
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginTop: '0.35rem', letterSpacing: '0.03em' }}>
                Accuracy Rate
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(21,128,61,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', lineHeight: 1 }}>{attempt.correctCount}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-success)', marginTop: '0.35rem' }}>Correct Answers</div>
          </div>

          <div style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(185,28,28,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-danger)', lineHeight: 1 }}>{attempt.incorrectCount}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-danger)', marginTop: '0.35rem' }}>Incorrect Answers</div>
          </div>

          <div style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid rgba(180,83,9,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)', lineHeight: 1 }}>{attempt.unattemptedCount}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning)', marginTop: '0.35rem' }}>Unattempted / Skipped</div>
          </div>
        </div>

        {/* Solution Key Header & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Solution Key & Detailed Explanations
          </h2>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['ALL', 'CORRECT', 'INCORRECT', 'UNATTEMPTED'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="btn"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8125rem',
                  backgroundColor: activeFilter === f ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: activeFilter === f ? '#FFFFFF' : 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredAnswers.map((ans, idx) => {
            const q = ans.question;
            const optionsMap = {};
            q.options?.forEach((o) => { optionsMap[o.optionKey] = o.optionText; });

            const isUnattempted = !ans.selectedOption;
            const isCorrect = ans.isCorrect;

            let badgeClass = 'badge badge-danger';
            let badgeText = 'Incorrect';

            if (isUnattempted) {
              badgeClass = 'badge badge-warning';
              badgeText = 'Skipped';
            } else if (isCorrect) {
              badgeClass = 'badge badge-success';
              badgeText = 'Correct';
            }

            return (
              <div
                key={ans.id}
                className="card"
                style={{
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                    Question {idx + 1}
                  </span>

                  <span className={badgeClass}>
                    {badgeText}
                  </span>
                </div>

                <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
                  {q.questionText}
                </p>

                {/* Options Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const isUserChoice = ans.selectedOption === key;
                    const isRightChoice = q.correctOption === key;

                    let border = '1px solid var(--color-border)';
                    let bg = 'var(--color-surface-2)';
                    let textColor = 'var(--color-text)';

                    if (isRightChoice) {
                      border = '1px solid rgba(21,128,61,0.4)';
                      bg = 'var(--color-success-bg)';
                      textColor = 'var(--color-success)';
                    } else if (isUserChoice && !isRightChoice) {
                      border = '1px solid rgba(185,28,28,0.4)';
                      bg = 'var(--color-danger-bg)';
                      textColor = 'var(--color-danger)';
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border,
                          backgroundColor: bg,
                          color: textColor,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          <strong>{key}.</strong> {optionsMap[key] || '—'}
                        </span>

                        {isRightChoice && <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>✓ Correct</span>}
                        {isUserChoice && !isRightChoice && <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Your Choice</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Block */}
                {q.explanation && (
                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: 'var(--color-brand-light)',
                      borderLeft: '4px solid var(--color-brand)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--color-text)',
                    }}
                  >
                    <strong style={{ color: 'var(--color-brand)' }}>Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
