import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';
import BookReader from './BookReader';

export default function LibraryScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await libraryService.getPublicLibrary();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedBook) {
    return <BookReader book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#0d9488', marginBottom: '1.5rem' }}>📚 Public Library</h2>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading library...</p>
      ) : books.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>No books available yet. Check back soon!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {books.map((book) => (
            <div 
              key={book.id} 
              onClick={() => setSelectedBook(book)}
              style={{ 
                background: 'white', padding: '1.25rem', borderRadius: '0.75rem', 
                border: '1px solid #e5e7eb', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{book.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Grade {book.grade} • {book.subject} • {book.type}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                Read Now →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}