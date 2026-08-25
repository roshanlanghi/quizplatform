import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
  ],
  Practice: [
    { label: 'PYQ Question Bank', to: '/quizzes' },
    { label: 'Revision Vault', to: '/revision' },
    { label: 'Performance Analytics', to: '/analytics' },
  ],
  Syllabus: [
    { label: 'History', to: '/quizzes' },
    { label: 'Geography', to: '/quizzes' },
    { label: 'Indian Polity', to: '/quizzes' },
    { label: 'General Science', to: '/quizzes' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: '3rem 0 1.5rem',
        marginTop: 'auto',
      }}
    >
      <div className="container-app">
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: '300px' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                }}
              >
                M
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '1rem' }}>MPSC Prep AI</span>
            </Link>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              AI-assisted competitive exam preparation platform with authentic Previous Year Questions, structured revision, and diagnostic performance analytics.
            </p>
          </div>

          {/* Link Groups */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
                {group}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      style={{ color: 'var(--color-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.target.style.color = 'var(--color-brand)')}
                      onMouseLeave={(e) => (e.target.style.color = 'var(--color-muted)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-muted)',
          }}
        >
          <span>© {new Date().getFullYear()} MPSC Prep AI. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link to="/about" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>About Platform</Link>
            <Link to="/quizzes" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Question Bank</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
