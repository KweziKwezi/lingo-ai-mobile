import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';

export default function BookReader({ book, onBack }) {
  const [chunks, setChunks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContent();
  }, [book.id]);

  const loadContent = async () => {
    try {
      const data = await libraryService.getBookContent(book.id);
      if (data.chunks && data.chunks.length > 0) {
        setChunks(data.chunks);
      } else {
        setError('No content found for this book.');
      }
    } catch (err) {
      setError('Failed to load book content.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < chunks.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // SECURITY: Prevent right-click, copying, and dragging
  const securityProps = {
    onContextMenu: (e) => e.preventDefault(),
    onCopy: (e) => e.preventDefault(),
    onCut: (e) => e.preventDefault(),
    onDragStart: (e) => e.preventDefault(),
    style: { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading book content...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        {error}
        <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Back to Library
        </button>
      </div>
    );
  }

  const currentChunk = chunks[currentIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Reader Header */}
      <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Library
        </button>
        <div style={{ fontWeight: 600, color: '#1f2937', textAlign: 'center', flex: 1, margin: '0 1rem' }}>
          {book.title}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Section {currentIndex + 1} of {chunks.length}
        </div>
      </div>

      {/* Reader Content (SECURED) */}
      <div 
        {...securityProps}
        style={{ 
          flex: 1, overflowY: 'auto', padding: '2rem', background: '#ffffff', 
          lineHeight: 1.8, fontSize: '1.1rem', color: '#374151', whiteSpace: 'pre-wrap'
        }}
      >
        {currentChunk.text}
      </div>

      {/* Reader Navigation */}
      <div style={{ padding: '1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', 
            background: currentIndex === 0 ? '#f3f4f6' : 'white', 
            color: currentIndex === 0 ? '#9ca3af' : '#1f2937',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 600
          }}
        >
          ← Previous
        </button>
        
        <button 
          onClick={handleNext} 
          disabled={currentIndex === chunks.length - 1}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', 
            background: currentIndex === chunks.length - 1 ? '#9ca3af' : '#0d9488', 
            color: 'white', cursor: currentIndex === chunks.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 600
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}