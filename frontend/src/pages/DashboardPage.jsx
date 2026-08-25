import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const dashRes = await api.get('/users/dashboard');
        setDashData(dashRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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

  const formatTimeSpent = (secs) => {
    if (!secs) return '0m';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <main style={{ paddingTop: '80px', minHeight: '80vh', backgroundColor: 'var(--color-bg)' }}>
        <div className="container-app" style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading student dashboard...</div>
        </div>
      </main>
    );
  }

  const {
    todayProgress = {},
    streak = 0,
    subjectPerformance = [],
    weakAreas = [],
    featuredQuiz,
    recentActivity = [],
  } = dashData || {};

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container-app">
        {/* ── WELCOME BANNER ──────────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem 2rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge badge-brand">MPSC Group C Aspirant</span>
              <span className="badge badge-warning">
                {streak} Day Streak
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Welcome back, <span style={{ color: 'var(--color-brand)' }}>{user?.name}</span>
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Track your daily test performance, subject mastery, and syllabus weak areas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="btn btn-outline"
                style={{ padding: '0.625rem 1.25rem' }}
              >
                Admin Panel
              </Link>
            )}
            <Link
              to="/quizzes"
              className="btn btn-primary"
              style={{ padding: '0.625rem 1.5rem' }}
            >
              Start Practice Quiz
            </Link>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* ── TODAY'S METRICS GRID ────────────────────────────────────────── */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Today's Performance Summary
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1 }}>
              {todayProgress.questionsAttempted || 0}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.4rem' }}>
              Questions Attempted
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', lineHeight: 1 }}>
              {todayProgress.accuracy || 0}%
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.4rem' }}>
              Accuracy Rate
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {todayProgress.correctAnswers || 0}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.4rem' }}>
              Correct Answers
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {formatTimeSpent(todayProgress.timeSpentSeconds)}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.4rem' }}>
              Time Spent Today
            </div>
          </div>
        </div>

        {/* ── WEAK AREAS BANNER ───────────────────────────────────────────── */}
        {weakAreas.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <span className="badge badge-danger" style={{ marginBottom: '0.35rem' }}>
                Weak Subjects Identified
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-danger)', margin: 0 }}>
                Target Revision Needed: {weakAreas.map((w) => w.name).join(', ')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                Your overall accuracy in these topics is below 60%. Generate a revision test to strengthen baseline concepts.
              </p>
            </div>

            <button
              onClick={() => navigate('/quizzes')}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--color-danger)',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
              }}
            >
              Practice Weak Topics
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT GRID ────────────────────────────────────────────── */}
        <div className="dashboard-main-grid">
          {/* LEFT COLUMN: SUBJECT BREAKDOWN */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Subject Mastery Breakdown
            </h2>

            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {subjectPerformance.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
                  No subject statistics recorded yet. Attempt your first quiz to generate analytics.
                </div>
              ) : (
                subjectPerformance.map((sub) => {
                  let barColor = 'var(--color-brand)';
                  let badgeClass = 'badge badge-brand';
                  let tagLabel = 'NORMAL';

                  if (sub.statusTag === 'STRONG') {
                    barColor = 'var(--color-success)';
                    badgeClass = 'badge badge-success';
                    tagLabel = 'STRONG';
                  } else if (sub.statusTag === 'NEEDS_FOCUS') {
                    barColor = 'var(--color-danger)';
                    badgeClass = 'badge badge-danger';
                    tagLabel = 'NEEDS FOCUS';
                  } else if (sub.statusTag === 'UNTESTED') {
                    barColor = '#94A3B8';
                    badgeClass = 'badge';
                    tagLabel = 'UNTESTED';
                  }

                  return (
                    <div key={sub.subjectId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{sub.name}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={badgeClass}>{tagLabel}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)', minWidth: '40px', textAlign: 'right' }}>
                            {sub.accuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${sub.accuracy}%`,
                            backgroundColor: barColor,
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                        {sub.correctCount} / {sub.totalAttempted} correct answers
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: FEATURED QUIZ & RECENT ACTIVITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* FEATURED TODAY'S QUIZ CARD */}
            {featuredQuiz && (
              <div
                style={{
                  backgroundColor: 'var(--color-brand-light)',
                  border: '1px solid rgba(30, 64, 175, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                }}
              >
                <span className="badge badge-brand" style={{ marginBottom: '0.75rem' }}>
                  Featured Today's Test
                </span>

                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
                  {featuredQuiz.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
                  {featuredQuiz.duration} Mins · {featuredQuiz.totalQuestions} Questions
                </p>

                <Link
                  to={`/quizzes/${featuredQuiz.id}/take`}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Start Test Now →
                </Link>
              </div>
            )}

            {/* RECENT ATTEMPTS FEED */}
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.875rem' }}>
                Recent Quiz Attempts
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentActivity.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    No recent attempts recorded. Select a quiz to begin practice.
                  </div>
                ) : (
                  recentActivity.map((act) => (
                    <div
                      key={act.attemptId}
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{act.quizTitle}</span>
                        <span className={act.accuracy >= 60 ? "badge badge-success" : "badge badge-danger"}>
                          {act.accuracy}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        <span>Score: {act.score} / {act.maxScore}</span>
                        <Link
                          to={`/quizzes/results/${act.attemptId}`}
                          style={{ color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          View Solutions →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.75rem;
        }

        @media (max-width: 900px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </main>
  );
}
