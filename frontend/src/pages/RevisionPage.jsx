import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import gsap from 'gsap';
import { animatePageEntrance, animateStaggerCards } from '../utils/animations';

export default function RevisionPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('WRONG'); // 'WRONG', 'BOOKMARKS', 'QUIZ_GEN'

  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generator form
  const [genSource, setGenSource] = useState('ALL');
  const [genCount, setGenCount] = useState(10);
  const [genDuration, setGenDuration] = useState(15);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadRevisionData() {
      try {
        setLoading(true);
        const [wRes, bRes] = await Promise.all([
          api.get('/revision/wrong-questions'),
          api.get('/revision/bookmarks'),
        ]);
        setWrongQuestions(wRes.data.data.wrongQuestions || []);
        setBookmarks(bRes.data.data.bookmarks || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load revision data.');
      } finally {
        setLoading(false);
      }
    }

    loadRevisionData();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        animatePageEntrance(containerRef.current);
        animateStaggerCards(containerRef.current, '.card');
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, activeTab]);

  async function handleToggleBookmark(qId) {
    try {
      const res = await api.post(`/revision/bookmarks/${qId}`);
      const isBookmarked = res.data.data.bookmarked;

      // Refresh bookmarks list
      const bRes = await api.get('/revision/bookmarks');
      setBookmarks(bRes.data.data.bookmarks || []);

      alert(isBookmarked ? 'Question added to Bookmarks!' : 'Bookmark removed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle bookmark.');
    }
  }

  async function handleStartRevisionQuiz(e) {
    e.preventDefault();
    setError('');
    setGenerating(true);

    try {
      const res = await api.post('/revision/generate-quiz', {
        source: genSource,
        questionCount: parseInt(genCount),
        duration: parseInt(genDuration),
      });

      const quizId = res.data.data.quiz.id;
      navigate(`/quizzes/${quizId}/take`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate revision quiz.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main ref={containerRef} style={{ paddingTop: '84px', paddingBottom: '4rem', backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container-app">
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <span className="badge badge-brand" style={{ marginBottom: '0.4rem' }}>
            Smart Revision Engine
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>Revision Vault & Practice Mode</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', margin: 0 }}>
            Automatically tracks incorrect test responses and bookmarked questions for targeted revision practice.
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('WRONG')}
            style={{
              padding: '0.65rem 1.15rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'WRONG' ? '2px solid var(--color-brand)' : '2px solid transparent',
              color: activeTab === 'WRONG' ? 'var(--color-brand)' : 'var(--color-muted)',
              fontWeight: activeTab === 'WRONG' ? 600 : 500,
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            Wrong Questions Vault ({wrongQuestions.length})
          </button>

          <button
            onClick={() => setActiveTab('BOOKMARKS')}
            style={{
              padding: '0.65rem 1.15rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'BOOKMARKS' ? '2px solid var(--color-brand)' : '2px solid transparent',
              color: activeTab === 'BOOKMARKS' ? 'var(--color-brand)' : 'var(--color-muted)',
              fontWeight: activeTab === 'BOOKMARKS' ? 600 : 500,
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            Bookmarked Questions ({bookmarks.length})
          </button>

          <button
            onClick={() => setActiveTab('QUIZ_GEN')}
            style={{
              padding: '0.65rem 1.15rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'QUIZ_GEN' ? '2px solid var(--color-brand)' : '2px solid transparent',
              color: activeTab === 'QUIZ_GEN' ? 'var(--color-brand)' : 'var(--color-muted)',
              fontWeight: activeTab === 'QUIZ_GEN' ? 600 : 500,
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            Revision Quiz Generator
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
            Loading revision vault...
          </div>
        ) : (
          <>
            {/* TAB 1: WRONG QUESTIONS VAULT */}
            {activeTab === 'WRONG' && (
              <div>
                {wrongQuestions.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
                    Zero incorrect questions recorded. Keep attempting practice tests to populate your revision vault.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {wrongQuestions.map((item, idx) => {
                      const q = item.question;
                      const optionsMap = {};
                      q.options?.forEach((o) => { optionsMap[o.optionKey] = o.optionText; });

                      return (
                        <div
                          key={item.answerId}
                          className="card"
                          style={{
                            padding: '1.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                              Question {idx + 1} · {q.subject?.name || 'General'}
                            </span>

                            <button
                              onClick={() => handleToggleBookmark(q.id)}
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.8125rem',
                              }}
                            >
                              Bookmark
                            </button>
                          </div>

                          <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
                            {q.questionText}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                            {['A', 'B', 'C', 'D'].map((key) => {
                              const isUserWrong = item.userSelectedOption === key;
                              const isRight = item.correctOption === key;

                              let border = '1px solid var(--color-border)';
                              let bg = 'var(--color-surface-2)';
                              let textColor = 'var(--color-text)';

                              if (isRight) {
                                border = '1px solid rgba(21,128,61,0.4)';
                                bg = 'var(--color-success-bg)';
                                textColor = 'var(--color-success)';
                              } else if (isUserWrong) {
                                border = '1px solid rgba(185,28,28,0.4)';
                                bg = 'var(--color-danger-bg)';
                                textColor = 'var(--color-danger)';
                              }

                              return (
                                <div
                                  key={key}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border,
                                    backgroundColor: bg,
                                    color: textColor,
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span>
                                    <strong>{key}.</strong> {optionsMap[key] || '—'}
                                  </span>
                                  {isRight && <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>✓ Correct</span>}
                                  {isUserWrong && <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Your Choice</span>}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--color-brand-light)', borderLeft: '4px solid var(--color-brand)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                              <strong style={{ color: 'var(--color-brand)' }}>Explanation: </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BOOKMARKED QUESTIONS */}
            {activeTab === 'BOOKMARKS' && (
              <div>
                {bookmarks.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
                    Zero bookmarked questions. Click "Bookmark" on any question card during revision or test review to save it here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {bookmarks.map((bm, idx) => {
                      const q = bm.question;
                      const optionsMap = {};
                      q.options?.forEach((o) => { optionsMap[o.optionKey] = o.optionText; });

                      return (
                        <div
                          key={bm.bookmarkId}
                          className="card"
                          style={{
                            padding: '1.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                              Bookmarked Question {idx + 1} · {q.subject?.name || 'General'}
                            </span>

                            <button
                              onClick={() => handleToggleBookmark(q.id)}
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.8125rem',
                                color: 'var(--color-danger)',
                                borderColor: 'rgba(185,28,28,0.2)',
                                backgroundColor: 'var(--color-danger-bg)',
                              }}
                            >
                              Remove Bookmark
                            </button>
                          </div>

                          <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
                            {q.questionText}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                            {['A', 'B', 'C', 'D'].map((key) => {
                              const isRight = q.correctOption === key;
                              return (
                                <div
                                  key={key}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: isRight ? '1px solid rgba(21,128,61,0.4)' : '1px solid var(--color-border)',
                                    backgroundColor: isRight ? 'var(--color-success-bg)' : 'var(--color-surface-2)',
                                    color: isRight ? 'var(--color-success)' : 'var(--color-text)',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span>
                                    <strong>{key}.</strong> {optionsMap[key] || '—'}
                                  </span>
                                  {isRight && <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>✓ Correct</span>}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--color-brand-light)', borderLeft: '4px solid var(--color-brand)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                              <strong style={{ color: 'var(--color-brand)' }}>Explanation: </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REVISION QUIZ GENERATOR */}
            {activeTab === 'QUIZ_GEN' && (
              <div
                className="card"
                style={{
                  padding: '1.75rem 2rem',
                  maxWidth: '560px',
                }}
              >
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
                  Generate Customized Revision Quiz
                </h2>

                <form onSubmit={handleStartRevisionQuiz}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Select Revision Source
                    </label>
                    <select
                      value={genSource}
                      onChange={(e) => setGenSource(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="ALL">Mixed Revision (Wrong Answers + Bookmarks + Weak Topics)</option>
                      <option value="WRONG">Wrong Questions Only ({wrongQuestions.length} available)</option>
                      <option value="BOOKMARKS">Bookmarked Questions Only ({bookmarks.length} available)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Question Count
                      </label>
                      <select
                        value={genCount}
                        onChange={(e) => setGenCount(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value={5}>5 Questions (Quick)</option>
                        <option value={10}>10 Questions (Standard)</option>
                        <option value={20}>20 Questions (Comprehensive)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Time Limit
                      </label>
                      <select
                        value={genDuration}
                        onChange={(e) => setGenDuration(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value={5}>5 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="btn btn-primary"
                    style={{
                      padding: '0.75rem 1.75rem',
                      fontSize: '0.9375rem',
                    }}
                  >
                    {generating ? 'Generating Revision Quiz...' : 'Start Revision Quiz →'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
