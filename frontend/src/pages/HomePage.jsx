import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';
import ChoreographedHero from '../components/ChoreographedHero';

const METRICS = [
  { label: 'Authentic PYQs Available', value: '5,000+' },
  { label: 'Syllabus Subjects Covered', value: '10' },
  { label: 'Daily Practice Tests', value: '365+' },
  { label: 'Active MPSC Aspirants', value: '10,000+' },
];

const FEATURES = [
  {
    title: 'Verified Previous Year Questions',
    desc: 'Access authentic MPSC Group C PYQs organised systematically by exam year, paper code, subject, and topic.',
  },
  {
    title: 'AI-Assisted Practice Engine',
    desc: 'Generate targeted practice sets that focus dynamically on your weak subjects and lower-accuracy topics.',
  },
  {
    title: 'Diagnostic Performance Analytics',
    desc: 'In-depth accuracy tracking, time spent per question analysis, and syllabus coverage reporting.',
  },
  {
    title: 'Daily Exam Quizzes',
    desc: 'Fresh practice tests added daily combining authentic PYQ questions with syllabus-aligned practice material.',
  },
  {
    title: 'Full-Length Timed Mock Tests',
    desc: 'Simulate the exact MPSC Group C exam environment with strict countdown timers and real-time score calculation.',
  },
  {
    title: 'Revision Vault & Bookmarks',
    desc: 'Save challenging questions and automatically aggregate incorrect attempts for rapid targeted revision.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Free Account', desc: 'Register in seconds to unlock syllabus subjects, PYQs, and daily test series.' },
  { step: '02', title: 'Attempt Daily Tests', desc: 'Solve authentic PYQs and subject tests with clear timer controls and option selectors.' },
  { step: '03', title: 'Review Explanations', desc: 'Inspect answer keys, view step-by-step solutions, and bookmark key questions.' },
  { step: '04', title: 'Strengthen Weak Topics', desc: 'Use AI revision quizzes to eliminate weak areas and boost your exam score.' },
];

const SUBJECTS_PREVIEW = [
  { code: 'HIST', name: 'History of India & Maharashtra', questionsCount: '1,200+ PYQs' },
  { code: 'GEOG', name: 'Geography & Environment', questionsCount: '1,100+ PYQs' },
  { code: 'POL', name: 'Indian Constitution & Polity', questionsCount: '950+ PYQs' },
  { code: 'ECON', name: 'Indian Economy & Planning', questionsCount: '850+ PYQs' },
  { code: 'SCI', name: 'General Science & Tech', questionsCount: '1,000+ PYQs' },
  { code: 'MATH', name: 'Mental Ability & Quantitative', questionsCount: '900+ PYQs' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then((res) => setApiStatus(res.data.status))
      .catch(() => setApiStatus('offline'));
  }, []);

  const primaryCtaTarget = isAuthenticated
    ? user?.role === 'ADMIN'
      ? '/admin'
      : '/dashboard'
    : '/register';

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        // ScrollTrigger animation for features and workflow cards
        const sections = containerRef.current.querySelectorAll('.reveal-on-scroll');
        sections.forEach((sec) => {
          gsap.fromTo(
            sec,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  const primaryCtaLabel = isAuthenticated
    ? user?.role === 'ADMIN'
      ? 'Go to Admin Panel →'
      : 'Go to Student Dashboard →'
    : 'Start Free Practice →';

  return (
    <main ref={containerRef} style={{ paddingTop: '64px', backgroundColor: 'var(--color-bg)' }}>
      {/* ── Choreographed GSAP Scroll Hero ───────────────────────────────────── */}
      <ChoreographedHero ctaTarget={primaryCtaTarget} ctaLabel={primaryCtaLabel} />

      {/* ── Section 1: System Status & Metrics Bar ────────────────────────────── */}
      <section className="reveal-on-scroll" style={{ padding: '3.5rem 0', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container-app">
          {apiStatus && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.25rem' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: apiStatus === 'ok' ? 'var(--color-success)' : 'var(--color-danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: apiStatus === 'ok' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  padding: '0.25rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${apiStatus === 'ok' ? 'rgba(21,128,61,0.2)' : 'rgba(185,28,28,0.2)'}`,
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: apiStatus === 'ok' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                Platform Status: {apiStatus === 'ok' ? 'Systems Operational' : 'Offline'}
              </span>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {METRICS.map(({ label, value }) => (
              <div
                key={label}
                className="card"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem 1.25rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.5rem', fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Syllabus Coverage Preview Grid ────────────────────────── */}
      <section className="section reveal-on-scroll" style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-brand" style={{ marginBottom: '0.75rem' }}>
              MPSC Group C Syllabus
            </span>
            <h2 className="section-title">Structured Subject Coverage</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
              Practice authentic Previous Year Questions organized rigorously by subject and exam topic.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {SUBJECTS_PREVIEW.map(({ code, name, questionsCount }) => (
              <div key={code} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="badge badge-brand" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    {code}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
                    {name}
                  </h3>
                </div>
                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>
                    {questionsCount}
                  </span>
                  <Link to="/quizzes" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-brand)', textDecoration: 'none' }}>
                    Practice →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Editorial Features Grid ────────────────────────────────── */}
      <section className="section reveal-on-scroll" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-brand" style={{ marginBottom: '0.75rem' }}>
              Built for Serious Aspirants
            </span>
            <h2 className="section-title">Comprehensive Preparation Tools</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
              Designed strictly around MPSC exam guidelines to build real exam confidence and accuracy.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(({ title, desc }) => (
              <div key={title} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-brand)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--color-text)' }}>{title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: 4-Step Preparation Workflow ───────────────────────────── */}
      <section className="section reveal-on-scroll" style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-brand" style={{ marginBottom: '0.75rem' }}>
              Execution Methodology
            </span>
            <h2 className="section-title">How MPSC Prep AI Works</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 600 }}>
              A systematic 4-step workflow to boost your preparation consistency and accuracy.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div
                key={step}
                className="card"
                style={{
                  borderLeft: '3px solid var(--color-brand)',
                  padding: '1.75rem 1.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--color-brand)',
                    marginBottom: '0.75rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  STEP {step}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>{title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: High-Impact Final CTA Banner ──────────────────────────── */}
      <section
        className="reveal-on-scroll"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="container-app" style={{ textAlign: 'center', maxWidth: '680px' }}>
          <span className="badge badge-brand" style={{ marginBottom: '1rem' }}>
            Ready to Begin?
          </span>
          <h2 className="section-title" style={{ fontSize: '2rem' }}>
            Start your MPSC Group C preparation today
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Access authentic Previous Year Questions, daily subject practice, and personalized diagnostic performance reports.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={primaryCtaTarget} className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
              {primaryCtaLabel}
            </Link>
            <Link to="/quizzes" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Explore Quizzes →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
