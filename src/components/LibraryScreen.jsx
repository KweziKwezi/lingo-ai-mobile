import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';
import BookReader from './BookReader';

export default function LibraryScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');

  useEffect(() => { loadLibrary(); }, []);

  const loadLibrary = async () => {
    try { const data = await libraryService.getPublicLibrary(); setBooks(data); } 
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || book.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  if (selectedBook) return <BookReader book={selectedBook} onBack={() => setSelectedBook(null)} />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Public Library</h2>
        <p style={{ color: 'var(--text-muted)' }}>Browse textbooks uploaded by your institution.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by title or subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-modern" style={{ flex: 2, minWidth: '200px' }} />
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="input-modern" style={{ flex: 1, minWidth: '150px' }}>
          <option value="All">All Grades</option>
          {['8','9','10','11','12','University'].map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading library...</p> : filteredBooks.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No books found matching your search.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredBooks.map((book) => (
            <div key={book.id} onClick={() => setSelectedBook(book)} className="glass-card" style={{ cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '70px', height: '100px', overflow: 'hidden', position: 'relative', borderRadius: '8px', border: '1px solid #eee', flexShrink: 0, background: '#f8fafc', boxShadow: 'var(--shadow-sm)' }}>
                <iframe src={`${libraryService.getPdfUrl(book.id)}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} style={{ position: 'absolute', top: 0, left: 0, width: '350px', height: '500px', transform: 'scale(0.2)', transformOrigin: '0 0', border: 'none', pointerEvents: 'none' }} title={`Cover of ${book.title}`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{book.subject} • Grade {book.grade}</div>
                <span className="badge badge-teal">Read Now →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}