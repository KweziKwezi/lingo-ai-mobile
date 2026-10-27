import { useState, useEffect } from 'react';
import { pastPaperService, bookService } from '../services/api';
import BookReader from './BookReader';

export default function PastPapersScreen() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [uploadingToChat, setUploadingToChat] = useState(null);

  useEffect(() => { loadPapers(); }, [filterType, filterYear]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType !== 'All') filters.institution_type = filterType;
      if (filterYear !== 'All') filters.year = parseInt(filterYear);
      const data = await pastPaperService.getPastPapers(filters); setPapers(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAskAI = async (paper) => {
    setUploadingToChat(paper.id);
    try {
      const response = await fetch(pastPaperService.downloadPastPaper(paper.id));
      const blob = await response.blob();
      const file = new File([blob], paper.filename, { type: 'application/pdf' });
      await bookService.uploadFile(file, `Past Paper: ${paper.subject}`, paper.grade, paper.subject, 'past_paper');
      alert(`"${paper.subject}" uploaded to your AI Tutor!`);
    } catch (err) { alert('Failed to upload.'); } finally { setUploadingToChat(null); }
  };

  if (selectedPaper) return <BookReader book={selectedPaper} onBack={() => setSelectedPaper(null)} />;

  const years = ['All', ...new Set(papers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
  const filteredPapers = papers.filter(paper => 
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (paper.institution_name && paper.institution_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (paper.module_code && paper.module_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Past Papers Hub</h2>
        <p style={{ color: 'var(--text-muted)' }}>Practice with past exams and get AI help.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search subject, university, or module..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-modern" style={{ flex: 2, minWidth: '200px' }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-modern" style={{ flex: 1, minWidth: '150px' }}>
          <option value="All">All Levels</option><option value="High School">High School</option><option value="University">University</option>
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-modern" style={{ flex: 1, minWidth: '120px' }}>
          {years.map(year => <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>)}
        </select>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</p> : filteredPapers.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No past papers found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredPapers.map((paper) => (
            <div key={paper.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>{paper.subject}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {paper.institution_name} • {paper.institution_type} {paper.module_code && `• ${paper.module_code}`}
                  </div>
                </div>
                <span className={`badge ${paper.institution_type === 'University' ? 'badge-purple' : 'badge-teal'}`}>{paper.year}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => setSelectedPaper(paper)} className="btn-secondary" style={{ flex: 1 }}>👁️ View & Translate</button>
                <a href={pastPaperService.downloadPastPaper(paper.id)} download className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬇️ Download</a>
                <button onClick={() => handleAskAI(paper)} disabled={uploadingToChat === paper.id} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
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