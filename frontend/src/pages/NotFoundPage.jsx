import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px',
        textAlign: 'center',
        background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 70%), var(--color-bg)`,
      }}
    >
      <div style={{ padding: '2rem' }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: '0.5rem',
          }}
          className="gradient-text"
        >
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
