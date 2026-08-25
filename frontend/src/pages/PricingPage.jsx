import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkout Modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  useEffect(() => {
    async function loadPlansData() {
      try {
        setLoading(true);
        const plansRes = await api.get('/subscriptions/plans');
        setPlans(plansRes.data.data.plans || []);

        if (isAuthenticated) {
          try {
            const meRes = await api.get('/subscriptions/me');
            setCurrentSub(meRes.data.data.subscription || null);
          } catch {
            // Ignore if sub fails
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load subscription plans.');
      } finally {
        setLoading(false);
      }
    }

    loadPlansData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
        animateStaggerCards(containerRef.current, '.card');
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  async function handleCheckout(plan) {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setSelectedPlan(plan);
    setError('');
    setCheckoutSuccess('');
  }

  async function handleConfirmPayment() {
    if (!selectedPlan) return;

    setProcessing(true);
    setError('');

    try {
      // 1. Initiate checkout
      const checkoutRes = await api.post('/subscriptions/checkout', {
        planId: selectedPlan.id,
      });

      const { orderId } = checkoutRes.data.data;

      // 2. Server-side payment verification
      const verifyRes = await api.post('/subscriptions/verify', {
        orderId,
        paymentId: `pay_sim_${Date.now()}`,
        planId: selectedPlan.id,
      });

      setCheckoutSuccess(
        `${selectedPlan.name} active! Valid through ${new Date(
          verifyRes.data.data.subscription.endDate
        ).toLocaleDateString('en-IN')}`
      );

      setCurrentSub(verifyRes.data.data.subscription);
      setTimeout(() => {
        setSelectedPlan(null);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  }

  const activePlanCode = currentSub?.plan?.code || 'FREE';

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <section
        style={{
          textAlign: 'center',
          paddingBottom: '2rem',
        }}
      >
        <div className="container-app">
          <span className="badge badge-brand" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
            Flexible Subscription Plans
          </span>
          <h1 style={{ maxWidth: 640, margin: '0 auto 0.75rem', fontSize: '2rem', fontWeight: 700 }}>
            Choose Your <span style={{ color: 'var(--color-brand)' }}>MPSC Preparation Plan</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 600 }}>
            Unlock unlimited PYQ test series, AI practice quizzes, timed mock exams, and weak area analytics.
          </p>
        </div>
      </section>

      {error && (
        <div className="container-app" style={{ maxWidth: 800, margin: '0 auto 1.5rem' }}>
          <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(185,28,28,0.2)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
            {error}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <section style={{ paddingTop: 0 }}>
        <div className="container-app">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
              Loading subscription plans...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                maxWidth: 1040,
                margin: '0 auto',
              }}
            >
              {plans.map((plan) => {
                const isCurrent = activePlanCode === plan.code;
                const isPopular = plan.code === 'PREMIUM_QUARTERLY';
                const isBestValue = plan.code === 'PREMIUM_YEARLY';

                let badgeLabel = null;
                if (isCurrent) badgeLabel = 'Current Active Plan';
                else if (isPopular) badgeLabel = 'Most Popular';
                else if (isBestValue) badgeLabel = 'Best Value';

                return (
                  <div
                    key={plan.id}
                    className="card"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: `2px solid ${
                        isCurrent
                          ? 'var(--color-success)'
                          : isPopular || isBestValue
                          ? 'var(--color-brand)'
                          : 'var(--color-border)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.75rem 1.5rem',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isPopular || isBestValue ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    }}
                  >
                    {badgeLabel && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-0.75rem',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: isCurrent
                            ? 'var(--color-success)'
                            : 'var(--color-brand)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.85rem',
                          borderRadius: 'var(--radius-full)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badgeLabel}
                      </span>
                    )}

                    <div>
                      <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
                        {plan.name}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                        {plan.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                          ₹{plan.price}
                        </span>
                        <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                          / {plan.interval?.toLowerCase()}
                        </span>
                      </div>

                      {/* Features List */}
                      <ul style={{ listStyle: 'none', margin: '0 0 1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {plan.features?.map((f) => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                            <span style={{ color: 'var(--color-success)', flexShrink: 0, fontWeight: 700 }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleCheckout(plan)}
                      disabled={isCurrent}
                      className={isCurrent ? "btn btn-outline" : isPopular || isBestValue ? "btn btn-primary" : "btn btn-secondary"}
                      style={{
                        width: '100%',
                        cursor: isCurrent ? 'default' : 'pointer',
                        color: isCurrent ? 'var(--color-success)' : undefined,
                        borderColor: isCurrent ? 'var(--color-success)' : undefined,
                      }}
                    >
                      {isCurrent ? 'Active Plan' : plan.price === 0 ? 'Use Free Plan' : 'Subscribe Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CHECKOUT VERIFICATION MODAL */}
      {selectedPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              Confirm Plan Subscription
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
              Instant server-side payment verification for MPSC Prep AI.
            </p>

            <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Selected Plan:</span>
                <strong style={{ color: 'var(--color-text)' }}>{selectedPlan.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Billing Interval:</span>
                <span style={{ fontWeight: 600 }}>{selectedPlan.interval}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Total Amount:</span>
                <strong style={{ fontSize: '1.125rem', color: 'var(--color-brand)' }}>₹{selectedPlan.price}</strong>
              </div>
            </div>

            {checkoutSuccess && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {checkoutSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedPlan(null)}
                disabled={processing}
                className="btn btn-outline"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="btn btn-primary"
              >
                {processing ? 'Verifying Payment...' : 'Verify & Activate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
