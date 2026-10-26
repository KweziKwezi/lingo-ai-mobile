import { useState, useEffect } from 'react';
import { pastPaperService, bookService } from '../services/api';
import BookReader from './BookReader';

export default function PastPapersScreen() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [uploadingToChat, setUploadingToChat] = useState(null);

  useEffect(() => {
    loadPapers();
  }, [filterType, filterYear]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType !== 'All') filters.institution_type = filterType;
      if (filterYear !== 'All') filters.year = parseInt(filterYear);
      
      const data = await pastPaperService.getPastPapers(filters);
      setPapers(data);
    } catch (err) {
      console.error('Failed to load past papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async (paper) => {
    setUploadingToChat(paper.id);
    try {
      // Fetch the file and upload it to the user's personal chat library
      const response = await fetch(pastPaperService.downloadPastPaper(paper.id));
      const blob = await response.blob();
      const file = new File([blob], paper.filename, { type: 'application/pdf' });
      
      const res = await bookService.uploadFile(
        file, 
        `Past Paper: ${paper.subject}`, 
        paper.grade, 
        paper.subject, 
        'past_paper'
      );
      
      // Redirect to chat with this book pre-selected (handled by ChatScreen logic)
      alert(`"${paper.subject}" uploaded to your AI Tutor! Go to the AI Tutor tab to ask questions.`);
      // Note: In a real app, you'd use React Router to navigate to /chat with bookId=res.book_id
    } catch (err) {
      alert('Failed to upload to AI Tutor. Please try downloading and uploading manually.');
    } finally {
      setUploadingToChat(null);
    }
  };

  if (selectedPaper) {
    return <BookReader book={selectedPaper} onBack={() => setSelectedPaper(null)} />;
  }

  const years = ['All', ...new Set(papers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#0d9488', marginBottom: '1.5rem' }}>📚 Past Exam Papers Hub</h2>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', flex: 1 }}
        >
          <option value="All">All Levels</option>
          <option value="High School">High School</option>
          <option value="University">University</option>
        </select>
        
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', flex: 1 }}
        >
          {years.map(year => (
            <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
          ))}
        </select>
      </div>

      {/* Papers List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading past papers...</p>
      ) : papers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>No past papers found for these filters.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {papers.map((paper) => (
            <div key={paper.id} style={{ 
              background: 'white', padding: '1.25rem', borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>{paper.subject}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {paper.institution_name} • {paper.institution_type} • {paper.year}
                    {paper.module_code && ` • Code: ${paper.module_code}`}
                  </div>
                </div>
                <span style={{ 
                  background: paper.institution_type === 'University' ? '#ede9fe' : '#f0fdf4',
                  color: paper.institution_type === 'University' ? '#7c3aed' : '#16a34a',
                  padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                }}>
                  {paper.year}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSelectedPaper(paper)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #0d9488', background: 'white', color: '#0d9488', fontWeight: 600, cursor: 'pointer' }}
                >
                  👁️ View & Translate
                </button>
                <a 
                  href={pastPaperService.downloadPastPaper(paper.id)}
                  download
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}
                >
                  ⬇️ Download PDF
                </a>
                <button 
                  onClick={() => handleAskAI(paper)}
                  disabled={uploadingToChat === paper.id}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', background: uploadingToChat === paper.id ? '#9ca3af' : '#8b5cf6', color: 'white', fontWeight: 600, cursor: uploadingToChat === paper.id ? 'not-allowed' : 'pointer' }}
                >
                  {uploadingToChat === paper.id ? 'Uploading...' : '🤖 Ask AI Tutor'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}