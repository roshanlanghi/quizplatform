import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function ChoreographedHero({
  ctaTarget = '/register',
  ctaLabel = 'Start Free Practice →',
}) {
  const pinContainerRef = useRef(null);
  const contentRef = useRef(null);
  const headlineRef = useRef(null);
  const galleryRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const headlineWords = [
    { text: 'Prepare.', color: '#FFFFFF' },
    { text: 'Practice.', color: '#FFFFFF' },
    { text: 'Progress.', color: '#60A5FA' },
  ];

  useLayoutEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (isReduced || isMobile || !pinContainerRef.current) return;

    const ctx = gsap.context(() => {
      // Single Master ScrollTrigger Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: 'top top',
          end: '+=250vh',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1: Scroll Indicator Fade (0.00 -> 0.20)
      if (scrollIndicatorRef.current) {
        tl.to(
          scrollIndicatorRef.current,
          {
            opacity: 0,
            y: 15,
            duration: 0.2,
            ease: 'power1.in',
          },
          0
        );
      }

      // Phase 2: Feature Cards Stagger (0.20 -> 0.65)
      if (galleryRef.current) {
        tl.fromTo(
          galleryRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.4,
            ease: 'power2.out',
          },
          0.2
        );
      }

      // Phase 3: Content Motion (0.65 -> 1.00)
      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            y: -24,
            opacity: 0.9,
            duration: 0.35,
            ease: 'power1.out',
          },
          0.65
        );
      }
    }, pinContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pinContainerRef}
      className="hero-section-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        backgroundColor: '#090D16',
      }}
    >
      {/* Viewport Hero Area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minHeight: '100svh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '7rem 2rem 3.5rem',
        }}
      >
        {/* Premium Geometric Mesh & Glow Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37, 99, 235, 0.22), transparent 70%), radial-gradient(ellipse 60% 40% at 85% 85%, rgba(30, 64, 175, 0.15), transparent 60%), #090D16',
          }}
        >
          {/* Subtle Grid Lines Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '4rem 4rem',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent 80%)',
            }}
          />

          {/* Ambient Glow Spheres */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        {/* Main Content Layout (2-Column Grid) */}
        <div
          ref={contentRef}
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '1240px',
            margin: '0 auto',
            willChange: 'transform, opacity',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '3rem',
            alignItems: 'center',
          }}
          className="hero-grid-layout"
        >
          {/* Left Column: Typography & CTAs */}
          <div className="hero-text-column">
            {/* Category Tag */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#93C5FD',
                }}
              >
                MPSC GROUP C
              </span>
            </div>

            {/* Staggered Word Headline */}
            <div ref={headlineRef} style={{ marginBottom: '1rem' }}>
              <h1
                style={{
                  fontSize: 'clamp(2.25rem, 5.2vw, 4.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {headlineWords.map(({ text, color }, idx) => (
                  <span
                    key={idx}
                    className="word"
                    style={{
                      color: color,
                      display: 'block',
                    }}
                  >
                    {text}
                  </span>
                ))}
              </h1>
            </div>

            {/* Short Supporting Text */}
            <p
              style={{
                fontSize: 'clamp(0.9375rem, 1.4vw, 1.2rem)',
                color: '#E2E8F0',
                maxWidth: '520px',
                fontWeight: 400,
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0',
                wordBreak: 'break-word',
              }}
            >
              Smarter preparation for competitive examinations.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Link
                to={ctaTarget}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-brand, #2563EB)',
                  border: '1px solid rgba(147, 197, 253, 0.4)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                className="hero-primary-cta"
              >
                <span>{ctaLabel}</span>
              </Link>

              <Link
                to="/quizzes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  color: '#CBD5E1',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '0.75rem 1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s ease',
                }}
                className="hero-secondary-cta"
              >
                <span>Explore Test Series →</span>
              </Link>
            </div>

            {/* Integrated Feature Cards Row */}
            <div
              ref={galleryRef}
              className="hero-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.65rem',
                maxWidth: '520px',
              }}
            >
              <div
                className="hero-card"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  padding: '0.65rem 0.75rem',
                  color: '#FFFFFF',
                }}
              >
                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#93C5FD', display: 'block', letterSpacing: '0.04em' }}>
                  Authentic Papers
                </span>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', margin: '0.2rem 0 0', whiteSpace: 'nowrap' }}>
                  5,000+ PYQs
                </h4>
              </div>

              <div
                className="hero-card"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  padding: '0.65rem 0.75rem',
                  color: '#FFFFFF',
                }}
              >
                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#86EFAC', display: 'block', letterSpacing: '0.04em' }}>
                  Syllabus
                </span>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', margin: '0.2rem 0 0', whiteSpace: 'nowrap' }}>
                  10 Subjects
                </h4>
              </div>

              <div
                className="hero-card"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  padding: '0.65rem 0.75rem',
                  color: '#FFFFFF',
                }}
              >
                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#FDE047', display: 'block', letterSpacing: '0.04em' }}>
                  Target AI
                </span>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', margin: '0.2rem 0 0', whiteSpace: 'nowrap' }}>
                  Smart Engine
                </h4>
              </div>
            </div>
          </div>

          {/* Right Column: 3D AI Artwork */}
          <div className="hero-visual-column" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                padding: '6px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(255, 255, 255, 0.06))',
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(37, 99, 235, 0.25)',
                maxWidth: '400px',
                width: '100%',
              }}
            >
              <img
                src="/images/hero-artwork.jpg"
                alt="MPSC AI Preparation Visual"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator (Bottom Center) */}
        <div
          ref={scrollIndicatorRef}
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#64748B',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            willChange: 'opacity, transform',
          }}
          className="hero-scroll-indicator"
        >
          <span>SCROLL</span>
          <span style={{ fontSize: '0.9rem', animation: 'scrollPulse 1.5s infinite ease-in-out' }}>↓</span>
        </div>
      </div>

      <style>{`
        @keyframes scrollPulse {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(5px); opacity: 0.3; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 960px) {
          .hero-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .hero-visual-column {
            order: -1;
            max-width: 280px !important;
            margin: 0 auto;
          }
          .hero-cta-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .hero-primary-cta, .hero-secondary-cta {
            width: 100% !important;
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .hero-section-wrapper {
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .hero-scroll-indicator {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .hero-cards-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.4rem !important;
          }
          .hero-card {
            padding: 0.5rem 0.4rem !important;
          }
          .hero-card h4 {
            font-size: 0.75rem !important;
          }
          .hero-card span {
            font-size: 0.5625rem !important;
          }
        }
      `}</style>
    </div>
  );
}
