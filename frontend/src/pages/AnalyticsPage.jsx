import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function AnalyticsPage() {
  const containerRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.get('/analytics/detailed');
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load detailed analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
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

  if (loading) {
    return (
      <main style={{ paddingTop: '84px', minHeight: '80vh', backgroundColor: 'var(--color-bg)' }}>
        <div className="container-app" style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Calculating diagnostic performance metrics...</div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ paddingTop: '84px', minHeight: '80vh', backgroundColor: 'var(--color-bg)' }}>
        <div className="container-app">
          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)' }}>
            {error || 'Analytics unavailable.'}
          </div>
        </div>
      </main>
    );
  }

  const {
    difficultyBreakdown = {},
    topicPerformance = [],
    summary = {},
  } = data;

  const formatSecs = (secs) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container-app">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-brand" style={{ marginBottom: '0.4rem' }}>
            Diagnostic Analytics
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>Deep Performance Diagnostics</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', margin: 0 }}>
            Comprehensive analysis of your answering speed, difficulty mastery, and topic-level accuracy.
          </p>
        </div>

        {/* ── DIFFICULTY BREAKDOWN & SPEED STATS ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* EASY */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Easy Questions
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.35rem', lineHeight: 1 }}>
              {difficultyBreakdown.EASY?.accuracy || 0}%
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              {difficultyBreakdown.EASY?.correct || 0} / {difficultyBreakdown.EASY?.total || 0} correct
            </div>
          </div>

          {/* MEDIUM */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Medium Questions
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.35rem', lineHeight: 1 }}>
              {difficultyBreakdown.MEDIUM?.accuracy || 0}%
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              {difficultyBreakdown.MEDIUM?.correct || 0} / {difficultyBreakdown.MEDIUM?.total || 0} correct
            </div>
          </div>

          {/* HARD */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Hard Questions
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '0.35rem', lineHeight: 1 }}>
              {difficultyBreakdown.HARD?.accuracy || 0}%
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              {difficultyBreakdown.HARD?.correct || 0} / {difficultyBreakdown.HARD?.total || 0} correct
            </div>
          </div>

          {/* SPEED / TIME */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Average Speed
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: '0.35rem', lineHeight: 1 }}>
              {summary.avgTimePerQuestionSeconds || 0}s
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              per question · Total {formatSecs(summary.totalPracticeTimeSeconds)}
            </div>
          </div>
        </div>

        {/* ── TOPIC PERFORMANCE MATRIX ────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>
            Topic Mastery Matrix
          </h2>

          {topicPerformance.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
              No topic performance data recorded yet. Attempt practice quizzes to populate your matrix.
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text)', fontWeight: 600 }}>Subject & Topic</th>
                    <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text)', fontWeight: 600 }}>Attempted</th>
                    <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text)', fontWeight: 600 }}>Correct</th>
                    <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text)', fontWeight: 600 }}>Accuracy</th>
                    <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topicPerformance.map((t) => {
                    let badgeClass = 'badge badge-brand';
                    let tagLabel = 'NORMAL';

                    if (t.statusTag === 'STRONG') {
                      badgeClass = 'badge badge-success';
                      tagLabel = 'STRONG (≥80%)';
                    } else if (t.statusTag === 'WEAK') {
                      badgeClass = 'badge badge-danger';
                      tagLabel = 'WEAK (<60%)';
                    }

                    return (
                      <tr key={t.topicId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <strong style={{ display: 'block', color: 'var(--color-text)', fontWeight: 600 }}>{t.topicName}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{t.subjectName}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 500 }}>{t.totalAttempted}</td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--color-success)' }}>{t.correctCount}</td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 700 }}>{t.accuracy}%</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span className={badgeClass}>
                            {tagLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
