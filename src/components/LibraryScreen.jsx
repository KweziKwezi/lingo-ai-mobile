import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';
import BookReader from './BookReader';

export default function LibraryScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');

  useEffect(() => { loadLibrary(); }, []);

  const loadLibrary = async () => {
    try {
      const data = await libraryService.getPublicLibrary();
      setBooks(data);
    } catch (err) { console.error('Failed to load library:', err); }
    finally { setLoading(false); }
  };

  // Filter logic
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || book.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  if (selectedBook) return <BookReader book={selectedBook} onBack={() => setSelectedBook(null)} />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#0d9488', marginBottom: '1.5rem' }}>📚 Public Library</h2>
      
      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search by title or subject..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minWidth: '200px' }}
        />
        <select 
          value={gradeFilter} 
          onChange={(e) => setGradeFilter(e.target.value)}
          style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minWidth: '150px' }}
        >
          <option value="All">All Grades</option>
          <option value="8">Grade 8</option>
          <option value="9">Grade 9</option>
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
          <option value="University">University</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading library...</p>
      ) : filteredBooks.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>No books found matching your search.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredBooks.map((book) => (
            <div 
              key={book.id} 
              onClick={() => setSelectedBook(book)}
              style={{ 
                background: 'white', padding: '1rem', borderRadius: '0.75rem', 
                border: '1px solid #e5e7eb', cursor: 'pointer',
                display: 'flex', gap: '1rem', alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* PDF Cover Thumbnail (Iframe Hack) */}
              <div style={{ width: '80px', height: '110px', overflow: 'hidden', position: 'relative', borderRadius: '4px', border: '1px solid #ddd', flexShrink: 0, background: '#f3f4f6' }}>
                <iframe
                  src={`${libraryService.getPdfUrl(book.id)}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '400px', height: '550px', // 5x the container size
                    transform: 'scale(0.2)',
                    transformOrigin: '0 0',
                    border: 'none', pointerEvents: 'none' // Prevents clicking inside the thumbnail
                  }}
                  title={`Cover of ${book.title}`}
                />
              </div>

              {/* Book Details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{book.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Grade {book.grade} • {book.subject} • {book.type}
                </div>
              </div>
              
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Read →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}