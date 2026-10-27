import { useState } from 'react';
import { bookService } from '../services/api';

export default function UploadScreen() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('textbook');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !grade || !subject) {
      setError('Please fill in all fields and select a file.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await bookService.uploadFile(file, title, grade, subject, type);
      setMessage(`✅ ${res.message}`);
      setTitle('');
      setGrade('');
      setSubject('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Upload Document</h2>
        <p style={{ color: 'var(--text-muted)' }}>Add textbooks, notes, or slides to your personal library.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-modern"
              placeholder="e.g., Grade 12 Mathematics Textbook"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="input-modern"
              >
                <option value="">Select Grade</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="University">University</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-modern"
                placeholder="e.g., Mathematics"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Document Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-modern"
            >
              <option value="textbook">Textbook</option>
              <option value="slides">Slides/Presentation</option>
              <option value="notes">Study Notes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>PDF or PowerPoint File</label>
            <div style={{
              border: '2px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              transition: 'all 0.2s'
            }}>
              <input
                type="file"
                accept=".pdf,.pptx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {file ? file.name : 'Click to upload file'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  PDF or PPTX (max 50MB)
                </div>
              </label>
            </div>
          </div>

          {message && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#166534',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Uploading & Processing...' : '📤 Upload Document'}
          </button>
        </form>
      </div>
    </div>
  );
}