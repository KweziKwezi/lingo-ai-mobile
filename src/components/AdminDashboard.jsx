import { useState, useEffect } from 'react';
import { adminService, pastPaperService } from '../services/api';

export default function AdminDashboard() {
  const [uploadMode, setUploadMode] = useState('textbook');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('textbook');
  const [file, setFile] = useState(null);
  
  const [institutionType, setInstitutionType] = useState('High School');
  const [institutionName, setInstitutionName] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
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
    } catch (err) { console.error('Failed to load library:', err); }
  };

  const loadPapers = async () => {
    try {
      const data = await pastPaperService.getPastPapers();
      setPapers(data);
    } catch (err) { console.error('Failed to load past papers:', err); }
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
          file, institutionType, institutionName, title, moduleCode, year
        );
        setMessage('✅ Past paper successfully added to the Hub!');
      } else {
        await adminService.uploadLibraryBook(file, title, grade, subject, type);
        setMessage('✅ Book successfully added to the Public Library!');
      }
      
      setTitle('');
      setGrade('');
      setSubject('');
      setInstitutionName('');
      setModuleCode('');
      setFile(null);
      
      loadLibrary();
      loadPapers();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Are you logged in as the admin?';
      setError('❌ ' + detail);
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
      setMessage('✅ Item deleted successfully');
    } catch (err) {
      setError('❌ Failed to delete. Please try again.');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>️ Admin Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage public textbooks and past exam papers.</p>
      </div>

      {/* Upload Form */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Upload New Content</h3>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem',
            padding: '0.375rem',
            background: '#f1f5f9',
            borderRadius: 'var(--radius-md)'
          }}>
            <button 
              type="button" 
              onClick={() => setUploadMode('textbook')} 
              style={{ 
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: uploadMode === 'textbook' ? 'white' : 'transparent',
                color: uploadMode === 'textbook' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: uploadMode === 'textbook' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              📚 Public Textbook
            </button>
            <button 
              type="button" 
              onClick={() => setUploadMode('past_paper')} 
              style={{ 
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: uploadMode === 'past_paper' ? 'white' : 'transparent',
                color: uploadMode === 'past_paper' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: uploadMode === 'past_paper' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              📝 Past Exam Paper
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {uploadMode === 'textbook' ? 'Book Title' : 'Subject / Module Name'}
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="input-modern"
              placeholder={uploadMode === 'textbook' ? "e.g., Grade 12 Life Sciences" : "e.g., Advanced Programming"} 
            />
          </div>

          {uploadMode === 'past_paper' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Level</label>
                  <select 
                    value={institutionType} 
                    onChange={(e) => setInstitutionType(e.target.value)} 
                    className="input-modern"
                  >
                    <option value="High School">High School</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    className="input-modern"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {institutionType === 'High School' ? 'School / Board Name' : 'University Name'}
                </label>
                <input 
                  type="text" 
                  value={institutionName} 
                  onChange={(e) => setInstitutionName(e.target.value)} 
                  className="input-modern"
                  placeholder={institutionType === 'High School' ? "e.g., DBE / IEB" : "e.g., University of Cape Town"} 
                />
              </div>
              {institutionType === 'University' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Module Code (Optional)</label>
                  <input 
                    type="text" 
                    value={moduleCode} 
                    onChange={(e) => setModuleCode(e.target.value)} 
                    className="input-modern"
                    placeholder="e.g., MAT101" 
                  />
                </div>
              )}
            </>
          )}

          {uploadMode === 'textbook' && (
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
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>PDF or PowerPoint File</label>
            <div style={{
              border: '2px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-light)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <input
                type="file"
                accept=".pdf,.pptx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="admin-file-upload"
              />
              <label htmlFor="admin-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📁</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.375rem' }}>
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
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>✅</span> {message}
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>❌</span> {error}
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
            {loading ? '⏳ Uploading & Processing...' : (uploadMode === 'past_paper' ? '📝 Publish to Past Papers Hub' : '📚 Publish to Library')}
          </button>
        </form>
      </div>

      {/* Current Public Library */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>
          📚 Public Library ({books.length})
        </h3>
        {books.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No books published yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {books.map((book) => (
              <div key={book.id} className="glass-card" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{book.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Grade {book.grade} • {book.subject} • {book.type}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(book.uploaded_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => handleDelete(book.id, book.title)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '1.3rem',
                      padding: '0.375rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Past Papers */}
      <div className="glass-card">
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>
           Past Papers ({papers.length})
        </h3>
        {papers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No past papers published yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {papers.map((paper) => (
              <div key={paper.id} className="glass-card" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {paper.subject} ({paper.year})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {paper.institution_name} • {paper.institution_type} {paper.module_code && `• ${paper.module_code}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(paper.uploaded_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => handleDelete(paper.id, paper.subject)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '1.3rem',
                      padding: '0.375rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ️
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