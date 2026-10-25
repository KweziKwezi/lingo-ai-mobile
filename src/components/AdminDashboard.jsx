import { useState, useEffect } from 'react';
import { adminService } from '../services/api';

export default function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('textbook');
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [books, setBooks] = useState([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await adminService.getPublicLibrary();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load library:', err);
    }
  };

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
      const res = await adminService.uploadLibraryBook(file, title, grade, subject, type);
      setMessage(res.message);
      setTitle('');
      setGrade('');
      setSubject('');
      setFile(null);
      loadLibrary();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Are you logged in as the admin?';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#0d9488', marginBottom: '1.5rem' }}>🛡️ Admin Library Dashboard</h2>

      <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>Upload to Public Library</h3>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Book Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Grade 12 Life Sciences" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Grade</label>
              <select 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
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
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Subject</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="e.g., Mathematics" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Document Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            >
              <option value="textbook">Textbook</option>
              <option value="slides">Slides</option>
              <option value="notes">Notes</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>PDF or PPTX File</label>
            <input 
              type="file" 
              accept=".pdf,.pptx"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>

          {message && <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem' }}>{message}</div>}
          {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', 
              padding: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Ingesting & Uploading...' : 'Publish to Library'}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Current Public Library ({books.length})</h3>
        {books.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No books published yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {books.map((book) => (
              <div key={book.id} style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>{book.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Grade {book.grade} • {book.subject} • {book.type}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(book.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}