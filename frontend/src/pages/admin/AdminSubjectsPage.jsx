import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modals / Form states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '', icon: '' });
  
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topicForm, setTopicForm] = useState({ name: '', description: '' });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data.subjects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/admin/subjects', subjectForm);
      setMessage('Subject created successfully!');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', description: '', icon: '📚' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject.');
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"? All related topics will be deleted.`)) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      setMessage(`Subject "${name}" deleted successfully.`);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subject.');
    }
  };

  // Handle Create Topic
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/admin/topics', {
        subjectId: selectedSubjectId,
        ...topicForm,
      });
      setMessage('Topic added successfully!');
      setShowTopicModal(false);
      setTopicForm({ name: '', description: '' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create topic.');
    }
  };

  // Handle Delete Topic
  const handleDeleteTopic = async (id, name) => {
    if (!window.confirm(`Delete topic "${name}"?`)) return;
    try {
      await api.delete(`/admin/topics/${id}`);
      setMessage(`Topic "${name}" deleted.`);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete topic.');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Subject & Topic Management</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure exam subjects and syllabus topics.
          </p>
        </div>
        <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          + Add New Subject
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Subjects Grid */}
      {loading ? (
        <div style={{ color: 'var(--color-muted)' }}>Loading subjects...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {subjects.map((subject) => (
            <div key={subject.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Subject Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{subject.name}</h3>
                    <span className="badge badge-brand" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                      Code: {subject.code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSubject(subject.id, subject.name)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                  title="Delete Subject"
                >
                  🗑️ Delete
                </button>
              </div>

              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {subject.description || 'No description provided.'}
              </p>

              {/* Topics Section */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                    Topics ({subject.topics?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSubjectId(subject.id);
                      setShowTopicModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    + Add Topic
                  </button>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {subject.topics?.map((topic) => (
                    <li
                      key={topic.id}
                      style={{
                        background: 'var(--color-surface-2)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--color-text)' }}>{topic.name}</span>
                      <button
                        onClick={() => handleDeleteTopic(topic.id, topic.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {(!subject.topics || subject.topics.length === 0) && (
                    <li style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                      No topics added yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'var(--color-surface)', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Add New Subject</h2>
            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. History"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Subject Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HISTORY"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Icon (Emoji)</label>
                <input
                  type="text"
                  value={subjectForm.icon}
                  onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
                  placeholder="📜"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="Brief overview..."
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TOPIC MODAL */}
      {showTopicModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--color-surface)', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Add New Topic</h2>
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  placeholder="e.g. Indian Constitution"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowTopicModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
