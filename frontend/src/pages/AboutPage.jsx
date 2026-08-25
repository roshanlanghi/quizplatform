import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

const TEAM_VALUES = [
  { title: 'Focused on MPSC Group C', desc: 'Built exclusively for MPSC Group C aspirants with content structured strictly around the official syllabus.' },
  { title: 'Authentic Content Integrity', desc: 'Real Previous Year Questions are strictly separated from AI practice content. Every extracted question is human-reviewed by admins.' },
  { title: 'AI as a Support Engine', desc: 'AI accelerates question extraction and custom quiz generation — but never replaces verified exam solutions or human review.' },
  { title: 'Mobile-First Accessibility', desc: 'Designed for aspirants on the go. Fully responsive and optimized for mobile devices and tablets.' },
];

export default function AboutPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
        animateStaggerCards(containerRef.current, '.card');
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', backgroundColor: 'var(--color-bg)' }}>
      {/* Hero */}
      <section
        style={{
          padding: '3.5rem 0 3rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container-app">
          <span className="badge badge-brand" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
            About MPSC Prep AI
          </span>
          <h1 style={{ maxWidth: 640, margin: '0 auto 0.75rem', fontSize: '2.25rem', fontWeight: 700 }}>
            Built to Help You Crack <span style={{ color: 'var(--color-brand)' }}>MPSC Group C</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', fontSize: '1rem', maxWidth: 620 }}>
            MPSC Prep AI is an educational platform dedicated to official Previous Year Questions, daily test series, diagnostic analytics, and structured revision.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container-app" style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>Our Core Mission</h2>
          <p style={{ color: 'var(--color-muted)', lineHeight: 1.7, fontSize: '0.9375rem', marginBottom: '1rem' }}>
            Every MPSC Group C aspirant deserves access to structured, high-quality preparation material. Our mission is to make that possible through verified Previous Year Questions, daily practice sets, and data-driven diagnostic insights.
          </p>
          <p style={{ color: 'var(--color-muted)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
            We prioritize accuracy and transparency: AI serves as an acceleration engine, but authentic PYQs are always verified by administrators before publication.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container-app">
          <h2 style={{ textAlign: 'center', marginBottom: '2.25rem', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }}>Our Preparation Principles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {TEAM_VALUES.map(({ title, desc }) => (
              <div key={title} className="card">
                <h3 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>{title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Status Callout */}
      <section className="section" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container-app" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Platform Architecture</h2>
          <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            Built on robust web standards with strict separation of student-facing practice engines and admin moderation controls.
          </p>
          <div
            style={{
              backgroundColor: 'var(--color-brand-light)',
              border: '1px solid rgba(30, 64, 175, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text)',
              textAlign: 'center',
            }}
          >
            <strong style={{ color: 'var(--color-brand)' }}>Technology Stack:</strong> React · Node.js · Express · PostgreSQL · Prisma ORM · Vite
          </div>
        </div>
      </section>
    </main>
  );
}
