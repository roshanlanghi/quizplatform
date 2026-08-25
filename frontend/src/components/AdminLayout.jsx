import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const ADMIN_LINKS = [
  { label: 'Dashboard Overview', to: '/admin' },
  { label: 'Subjects & Topics', to: '/admin/subjects' },
  { label: 'Question Bank', to: '/admin/questions' },
  { label: 'Question Papers', to: '/admin/papers' },
  { label: 'AI Quiz Generator', to: '/admin/ai-generator' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="admin-layout-container" style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Top Main Navbar */}
      <Navbar />

      <div style={{ display: 'flex', paddingTop: '64px', minHeight: 'calc(100vh - 64px)' }}>
        {/* Mobile Overlay Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="admin-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 140,
            }}
          />
        )}

        {/* Admin Sidebar */}
        <aside
          className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{
            width: '260px',
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: '64px',
            bottom: 0,
            left: 0,
            zIndex: 150,
            transition: 'transform 0.2s ease',
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                }}
              >
                A
              </div>
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  Admin Control
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 600 }}>
                  MPSC Prep AI
                </span>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="admin-close-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                fontSize: '1.125rem',
                cursor: 'pointer',
                display: 'none',
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.75rem 0.5rem' }}>
              Administration
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {ADMIN_LINKS.map(({ label, to }) => {
                const isActive = pathname === to || (to !== '/admin' && pathname.startsWith(to));
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
                        backgroundColor: isActive ? 'var(--color-brand-light)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info / Logout Footer */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                System Admin
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-danger)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.25rem',
              }}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="admin-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
          {/* Sub Header Bar */}
          <header
            style={{
              height: '52px',
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.5rem',
              position: 'sticky',
              top: '64px',
              zIndex: 80,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="admin-header-title" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                Administration Portal / <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>Management Console</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/" className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}>
                View Student Portal
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-danger)',
                  borderColor: 'rgba(185, 28, 28, 0.2)',
                  backgroundColor: 'var(--color-danger-bg)',
                }}
              >
                Logout
              </button>

              {/* Mobile Toggler Button on Right */}
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Toggle Admin Sidebar"
                aria-expanded={sidebarOpen}
                className="admin-toggler-btn"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  width: 36,
                  height: 36,
                  display: 'none',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 16, height: 2, backgroundColor: 'var(--color-text)', borderRadius: 1 }} />
                <span style={{ width: 16, height: 2, backgroundColor: 'var(--color-text)', borderRadius: 1 }} />
                <span style={{ width: 16, height: 2, backgroundColor: 'var(--color-text)', borderRadius: 1 }} />
              </button>
            </div>
          </header>

          {/* Page View Outlet */}
          <main style={{ padding: '1.75rem', flex: 1, backgroundColor: 'var(--color-bg)' }}>
            <Outlet />
          </main>
        </div>

        <style>{`
          @media (min-width: 769px) {
            .admin-main-content {
              margin-left: 260px;
            }
            .admin-sidebar {
              top: 64px !important;
              left: 0 !important;
              right: auto !important;
              transform: translateX(0) !important;
            }
            .admin-toggler-btn {
              display: none !important;
            }
          }

          @media (max-width: 768px) {
            .admin-main-content {
              margin-left: 0 !important;
            }
            .admin-sidebar {
              top: 64px !important;
              left: auto !important;
              right: 0 !important;
              transform: translateX(100%);
              box-shadow: -4px 0 20px rgba(0,0,0,0.15);
            }
            .admin-sidebar.open {
              transform: translateX(0) !important;
            }
            .admin-toggler-btn {
              display: flex !important;
            }
            .admin-close-btn {
              display: block !important;
            }
            .admin-header-title {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
