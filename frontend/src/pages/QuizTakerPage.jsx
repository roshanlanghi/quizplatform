import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import gsap from 'gsap';
import { animateQuestionChange, animateProgressBar } from '../utils/animations';

export default function QuizTakerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: { selectedOption, isMarkedForReview, timeSpentSeconds } }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const questionCardRef = useRef(null);
  const progressBarRef = useRef(null);
  const prevIndexRef = useRef(0);

  // Trigger question transition animation when currentIndex changes
  useEffect(() => {
    if (questionCardRef.current && quiz) {
      const direction = currentIndex >= prevIndexRef.current ? 'next' : 'prev';
      prevIndexRef.current = currentIndex;
      animateQuestionChange(questionCardRef.current, direction);
    }
  }, [currentIndex, quiz]);

  // Trigger progress bar animation
  useEffect(() => {
    if (progressBarRef.current && quiz?.quizQuestions?.length) {
      const total = quiz.quizQuestions.length;
      const pct = Math.round(((currentIndex + 1) / total) * 100);
      animateProgressBar(progressBarRef.current, pct);
    }
  }, [currentIndex, quiz]);

  // 1. Fetch quiz & start attempt
  useEffect(() => {
    async function initQuiz() {
      try {
        setLoading(true);
        const [quizRes, startRes] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.post(`/quizzes/${id}/start`),
        ]);

        const qData = quizRes.data.data.quiz;
        const startData = startRes.data.data;

        setQuiz(qData);
        setAttemptId(startData.attemptId);

        // Set duration in seconds
        const totalSecs = (qData.duration || 15) * 60;
        setTimeLeft(totalSecs);
        startTimeRef.current = Date.now();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize quiz attempt.');
      } finally {
        setLoading(false);
      }
    }

    initQuiz();
  }, [id]);

  // Submit Handler
  const handleSubmitQuiz = useCallback(
    async (_isAutoSubmit = false) => {
      if (submitting) return;
      setSubmitting(true);
      clearInterval(timerRef.current);

      try {
        const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Format answers array
        const answersPayload = Object.entries(userAnswers).map(([qId, val]) => ({
          questionId: qId,
          selectedOption: val.selectedOption || null,
          isMarkedForReview: !!val.isMarkedForReview,
          timeSpentSeconds: val.timeSpentSeconds || 0,
        }));

        const res = await api.post(`/quizzes/${id}/submit`, {
          attemptId,
          answers: answersPayload,
          timeSpentSeconds,
        });

        const finalAttemptId = res.data.data.attempt.id;
        navigate(`/quizzes/results/${finalAttemptId}`, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit quiz.');
        setSubmitting(false);
      }
    },
    [id, attemptId, userAnswers, submitting, navigate]
  );

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || !attemptId || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitQuiz(true); // Auto-submit when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, attemptId, handleSubmitQuiz]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>Initializing online examination interface...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)' }}>
          {error || 'Quiz not found.'}
        </div>
      </div>
    );
  }

  const questions = quiz.quizQuestions.map((qq) => qq.question);
  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers[currentQuestion.id] || {};

  // Formatter for timer (mm:ss)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Option select handler
  const handleSelectOption = (optKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOption: optKey,
      },
    }));
  };

  // Clear answer
  const handleClearAnswer = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOption: null,
      },
    }));
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        isMarkedForReview: !prev[currentQuestion.id]?.isMarkedForReview,
      },
    }));
  };

  // Counts for summary
  const totalCount = questions.length;
  const answeredCount = Object.values(userAnswers).filter((a) => a.selectedOption).length;
  const reviewCount = Object.values(userAnswers).filter((a) => a.isMarkedForReview).length;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', paddingTop: '64px', paddingBottom: '4rem' }}>
      {/* ── STICKY TOP EXAMINATION HEADER ───────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: '64px',
          zIndex: 90,
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Animated Progress Bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
          <div
            ref={progressBarRef}
            style={{ height: '100%', backgroundColor: 'var(--color-brand)', width: '0%' }}
          />
        </div>

        <div
          className="container quiz-header-content"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.65rem',
            paddingBottom: '0.65rem',
            gap: '0.75rem',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              {quiz.title}
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 500 }}>
              Question {currentIndex + 1} of {totalCount}
            </span>
          </div>

          <div className="quiz-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Mobile Palette Toggle */}
            <button
              onClick={() => setShowMobilePalette((prev) => !prev)}
              className="quiz-mobile-palette-btn btn btn-outline"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                display: 'none',
              }}
            >
              Question Palette
            </button>

            {/* Countdown Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: timeLeft < 120 ? 'var(--color-danger-bg)' : 'var(--color-brand-light)',
                border: `1px solid ${timeLeft < 120 ? 'rgba(185,28,28,0.2)' : 'rgba(30,64,175,0.15)'}`,
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                color: timeLeft < 120 ? 'var(--color-danger)' : 'var(--color-brand)',
                fontWeight: 700,
                fontSize: '0.9375rem',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Time Left: {formatTime(timeLeft)}</span>
            </div>

            {/* Submit Quiz Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--color-success)',
                padding: '0.45rem 1.15rem',
                fontSize: '0.875rem',
              }}
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN QUIZ LAYOUT AREA ─────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        <div className="quiz-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          {/* LEFT: QUESTION PANEL */}
          <div
            ref={questionCardRef}
            className="quiz-card"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-brand)' }}>
                  Question {currentIndex + 1}
                </span>
                {currentQuestion.subject && (
                  <span className="badge badge-brand">
                    {currentQuestion.subject.name}
                  </span>
                )}
              </div>

              {currentAnswer.isMarkedForReview && (
                <span className="badge badge-warning">
                  Marked for Review
                </span>
              )}
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.75rem', color: 'var(--color-text)' }}>
              {currentQuestion.questionText}
            </h3>

            {/* Option Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {currentQuestion.options.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.optionKey;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.optionKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                      padding: '0.875rem 1.125rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'var(--color-brand-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '48px',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--color-brand)' : '#94A3B8'}`,
                        backgroundColor: isSelected ? 'var(--color-brand)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--color-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                      }}
                    >
                      {opt.optionKey}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--color-brand)' : 'var(--color-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {opt.optionText}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Question Actions Toolbar */}
            <div className="quiz-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
              <div className="quiz-actions-left" style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleToggleReview}
                  className="btn btn-outline"
                  style={{
                    padding: '0.50rem 0.9375rem',
                    fontSize: '0.8125rem',
                    borderColor: currentAnswer.isMarkedForReview ? 'var(--color-warning)' : 'var(--color-border)',
                    backgroundColor: currentAnswer.isMarkedForReview ? 'var(--color-warning-bg)' : 'var(--color-surface)',
                    color: currentAnswer.isMarkedForReview ? 'var(--color-warning)' : 'var(--color-text)',
                  }}
                >
                  {currentAnswer.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                </button>

                {currentAnswer.selectedOption && (
                  <button
                    onClick={handleClearAnswer}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.50rem 0.875rem',
                      fontSize: '0.8125rem',
                    }}
                  >
                    Clear Response
                  </button>
                )}
              </div>

              <div className="quiz-actions-right" style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn btn-outline"
                  style={{
                    padding: '0.50rem 1.125rem',
                    fontSize: '0.875rem',
                    opacity: currentIndex === 0 ? 0.5 : 1,
                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="btn btn-primary"
                  style={{
                    padding: '0.50rem 1.25rem',
                    fontSize: '0.875rem',
                    opacity: currentIndex === questions.length - 1 ? 0.5 : 1,
                    cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: QUESTION PALETTE CONTAINER */}
          <div
            className={`quiz-palette-container ${showMobilePalette ? 'mobile-visible' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              height: 'fit-content',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Question Palette
              </h3>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="quiz-palette-close-btn"
                style={{
                  display: 'none',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Palette Grid Buttons */}
            <div className="quiz-palette-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {questions.map((q, idx) => {
                const ans = userAnswers[q.id] || {};
                const isCurrent = idx === currentIndex;
                const isAnswered = !!ans.selectedOption;
                const isReview = !!ans.isMarkedForReview;

                let bg = 'var(--color-surface-2)';
                let color = 'var(--color-text)';
                let border = '1px solid var(--color-border)';

                if (isReview) {
                  bg = 'var(--color-warning-bg)';
                  color = 'var(--color-warning)';
                  border = '1px solid rgba(180,83,9,0.3)';
                } else if (isAnswered) {
                  bg = 'var(--color-success-bg)';
                  color = 'var(--color-success)';
                  border = '1px solid rgba(21,128,61,0.3)';
                }

                if (isCurrent) {
                  border = '2px solid var(--color-brand)';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobilePalette(false);
                    }}
                    style={{
                      aspectRatio: '1',
                      minHeight: '38px',
                      backgroundColor: bg,
                      color,
                      border,
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Status Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-success)' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-warning)' }} />
                <span>Marked for Review ({reviewCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />
                <span>Unattempted ({totalCount - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION SUBMIT DIALOG */}
      {showConfirmModal && (
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
              maxWidth: '420px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              Submit Test Paper?
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to finish and submit your test response?
            </p>

            <div style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span>Total Questions:</span>
                <strong style={{ color: 'var(--color-text)' }}>{totalCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--color-success)' }}>
                <span>Answered Questions:</span>
                <strong>{answeredCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
                <span>Marked for Review:</span>
                <strong>{reviewCount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Return to Test
              </button>
              <button
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  backgroundColor: 'var(--color-success)',
                  flex: 1,
                }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 991px) {
          .quiz-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .quiz-mobile-palette-btn {
            display: inline-flex !important;
          }
          .quiz-palette-container.mobile-visible {
            position: fixed !important;
            inset: 0 !important;
            z-index: 999 !important;
            border-radius: 0 !important;
            overflow-y: auto !important;
            padding: 1.5rem !important;
            background: var(--color-surface) !important;
          }
          .quiz-palette-container.mobile-visible .quiz-palette-close-btn {
            display: block !important;
          }
        }

        @media (max-width: 640px) {
          .quiz-header-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
          }
          .quiz-header-actions {
            justify-content: space-between !important;
            width: 100% !important;
          }
          .quiz-card {
            padding: 1.25rem !important;
          }
          .quiz-actions-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .quiz-actions-left,
          .quiz-actions-right {
            display: flex !important;
            width: 100% !important;
          }
          .quiz-actions-left button,
          .quiz-actions-right button {
            flex: 1 !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
