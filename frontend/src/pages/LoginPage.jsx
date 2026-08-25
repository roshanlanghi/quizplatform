import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance } from '../utils/animations';

export default function LoginPage() {
  const containerRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);

      const targetPath = location.state?.from?.pathname || (user.role === 'ADMIN' ? '/admin' : '/dashboard');
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to log in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main ref={containerRef} style={{ paddingTop: '64px', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: 'var(--color-bg)' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.25rem 2rem',
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '7px',
              backgroundColor: 'var(--color-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.125rem',
              color: '#FFFFFF',
              marginBottom: '0.75rem',
            }}
          >
            M
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Log In to Your Account</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Access your MPSC Group C tests and analytics
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid rgba(185,28,28,0.2)',
              color: 'var(--color-danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.35rem', padding: '0.75rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </main>
  );
}
