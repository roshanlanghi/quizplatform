import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Close mobile drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    ...(isAuthenticated
      ? [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Quizzes', to: '/quizzes' },
          { label: 'Revision', to: '/revision' },
          { label: 'Analytics', to: '/analytics' },
          ...(user?.role === 'ADMIN' ? [{ label: 'Admin Panel', to: '/admin' }] : []),
        ]
      : []),
  ];

  const isHome = pathname === '/';

  return (
    <>
      {/* Fixed Header Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          borderBottom: isHome ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--color-border)',
          backgroundColor: isHome ? 'rgba(15, 23, 42, 0.5)' : 'var(--color-surface)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div
          className="container-app"
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '100%',
            padding: '0 1.5rem',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                backgroundColor: 'var(--color-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9375rem',
                color: '#FFFFFF',
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: isHome ? '#FFFFFF' : 'var(--color-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              MPSC Prep <span style={{ color: 'var(--color-brand)' }}>AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul
            style={{
              display: 'flex',
              gap: '0.25rem',
              listStyle: 'none',
              alignItems: 'center',
              margin: '0 0.5rem',
            }}
            className="desktop-nav"
          >
            {navLinks.map(({ label, to }) => {
              const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
              return (
                <li key={to}>
                  <Link
                    to={to}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isHome
                        ? isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'
                        : isActive ? 'var(--color-brand)' : 'var(--color-muted)',
                      backgroundColor: isActive
                        ? isHome ? 'rgba(255, 255, 255, 0.12)' : 'var(--color-brand-light)'
                        : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    className="nav-link-item"
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Action Menu */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            {/* Theme Toggle Button (Subtle & Non-distracting) */}
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: isHome ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isHome ? '#E2E8F0' : 'var(--color-muted)',
                border: isHome ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Toggle Light / Dark Theme"
            >
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  className="desktop-nav"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-brand)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {user?.name}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="desktop-nav btn btn-outline"
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="desktop-nav" style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to="/login"
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={menuOpen}
              className="hamburger-btn"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                width: 36,
                height: 36,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: 'var(--color-text)',
                  borderRadius: 1,
                  transition: 'transform 0.15s ease',
                  transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
                }}
              />
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: 'var(--color-text)',
                  borderRadius: 1,
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: 'var(--color-text)',
                  borderRadius: 1,
                  transition: 'transform 0.15s ease',
                  transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {isAuthenticated && (
              <div
                style={{
                  padding: '0.75rem 0.875rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text)' }}>{user?.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{user?.email}</span>
                </div>
                <span className="badge badge-brand">
                  {user?.role}
                </span>
              </div>
            )}

            {navLinks.map(({ label, to }) => {
              const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
                    backgroundColor: isActive ? 'var(--color-brand-light)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>→</span>
                </Link>
              );
            })}

            <button
              onClick={toggleTheme}
              className="btn btn-outline"
              style={{
                width: '100%',
                marginTop: '0.25rem',
                justifyContent: 'center',
              }}
            >
              Switch to {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  color: 'var(--color-danger)',
                }}
              >
                Log Out
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}

        <style>{`
          @media (max-width: 880px) {
            .desktop-nav { display: none !important; }
            .hamburger-btn { display: flex !important; }
          }
          @media (min-width: 881px) {
            .hamburger-btn { display: none !important; }
          }
          .nav-link-item:hover {
            color: var(--color-brand) !important;
            background-color: var(--color-brand-light) !important;
          }
        `}</style>
      </header>

      {/* Mobile Bottom Quick-Navigation Bar (for Authenticated Students) */}
      {isAuthenticated && (
        <div
          className="mobile-bottom-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '56px',
            padding: '0 0.5rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: pathname === '/dashboard' ? 'var(--color-brand)' : 'var(--color-muted)',
            }}
          >
            Home
          </Link>

          <Link
            to="/quizzes"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: pathname.startsWith('/quizzes') ? 'var(--color-brand)' : 'var(--color-muted)',
            }}
          >
            Quizzes
          </Link>

          <Link
            to="/revision"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: pathname === '/revision' ? 'var(--color-brand)' : 'var(--color-muted)',
            }}
          >
            Revision
          </Link>

          <Link
            to="/analytics"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: pathname === '/analytics' ? 'var(--color-brand)' : 'var(--color-muted)',
            }}
          >
            Analytics
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: pathname.startsWith('/admin') ? 'var(--color-brand)' : 'var(--color-muted)',
              }}
            >
              Admin
            </Link>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 881px) {
          .mobile-bottom-bar { display: none !important; }
        }
      `}</style>
    </>
  );
}
