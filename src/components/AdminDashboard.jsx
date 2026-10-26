import { useState, useEffect } from 'react';
import { adminService, pastPaperService } from '../services/api';

export default function AdminDashboard() {
  // Form states
  const [uploadMode, setUploadMode] = useState('textbook'); // 'textbook' or 'past_paper'
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('textbook');
  const [file, setFile] = useState(null);
  
  // Past paper specific states
  const [institutionType, setInstitutionType] = useState('High School');
  const [institutionName, setInstitutionName] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Lists
  const [books, setBooks] = useState([]);
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    loadLibrary();
    loadPapers();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await adminService.getPublicLibrary();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load library:', err);
    }
  };

  const loadPapers = async () => {
    try {
      const data = await pastPaperService.getPastPapers();
      setPapers(data);
    } catch (err) {
      console.error('Failed to load past papers:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please fill in required fields and select a file.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (uploadMode === 'past_paper') {
        await pastPaperService.uploadPastPaper(
          file, 
          institutionType, 
          institutionName, 
          title, // subject_or_module
          moduleCode, 
          year
        );
        setMessage('Past paper successfully added to the Hub!');
      } else {
        await adminService.uploadLibraryBook(file, title, grade, subject, type);
        setMessage('Book successfully added to the Public Library!');
      }
      
      // Reset form
      setTitle('');
      setGrade('');
      setSubject('');
      setInstitutionName('');
      setModuleCode('');
      setFile(null);
      
      // Refresh lists
      loadLibrary();
      loadPapers();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Are you logged in as the admin?';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId, itemTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${itemTitle}"?`)) return;
    try {
      await adminService.deleteLibraryBook(bookId);
      loadLibrary();
      loadPapers();
    } catch (err) {
      alert('Failed to delete. Please try again.');
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#0d9488', marginBottom: '1.5rem' }}>🛡️ Admin Dashboard</h2>

      {/* Upload Form */}
      <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>Upload Content</h3>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => setUploadMode('textbook')} 
              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: uploadMode === 'textbook' ? '#0d9488' : '#e5e7eb', color: uploadMode === 'textbook' ? 'white' : '#6b7280', fontWeight: 600, cursor: 'pointer' }}
            >
              📚 Public Textbook
            </button>
            <button 
              type="button" 
              onClick={() => setUploadMode('past_paper')} 
              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: uploadMode === 'past_paper' ? '#8b5cf6' : '#e5e7eb', color: uploadMode === 'past_paper' ? 'white' : '#6b7280', fontWeight: 600, cursor: 'pointer' }}
            >
              📝 Past Exam Paper
            </button>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              {uploadMode === 'textbook' ? 'Book Title' : 'Subject / Module Name'}
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={uploadMode === 'textbook' ? "e.g., Grade 12 Life Sciences" : "e.g., Mathematics or Calculus I"} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          {uploadMode === 'past_paper' && (
            <>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Level</label>
                  <select value={institutionType} onChange={(e) => setInstitutionType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}>
                    <option value="High School">High School</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Year</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  {institutionType === 'High School' ? 'School / Board Name' : 'University Name'}
                </label>
                <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder={institutionType === 'High School' ? "e.g., DBE / IEB" : "e.g., University of Cape Town"} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              {institutionType === 'University' && (
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Module Code (Optional)</label>
                  <input type="text" value={moduleCode} onChange={(e) => setModuleCode(e.target.value)} placeholder="e.g., MAT101" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              )}
            </>
          )}

          {uploadMode === 'textbook' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}>
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
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Mathematics" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>PDF or PPTX File</label>
            <input type="file" accept=".pdf,.pptx" onChange={(e) => setFile(e.target.files[0])} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }} />
          </div>

          {message && <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem' }}>{message}</div>}
          {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ background: uploadMode === 'past_paper' ? '#8b5cf6' : '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Ingesting & Uploading...' : (uploadMode === 'past_paper' ? 'Publish to Past Papers Hub' : 'Publish to Library')}
          </button>
        </form>
      </div>

      {/* Current Public Library List */}
      <div style={{ marginBottom: '2rem' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {new Date(book.uploaded_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(book.id, book.title); }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Past Papers List */}
      <div>
        <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Current Past Papers ({papers.length})</h3>
        {papers.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No past papers published yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {papers.map((paper) => (
              <div key={paper.id} style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>{paper.subject} ({paper.year})</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {paper.institution_name} • {paper.institution_type} {paper.module_code ? `• ${paper.module_code}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {new Date(paper.uploaded_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(paper.id, paper.subject); }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}