import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';

export default function BookReader({ book, onBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
    const [isPdfLoading, setIsPdfLoading] = useState(true);
  
  // Translation states
  const [targetLang, setTargetLang] = useState('isiZulu');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

    useEffect(() => {
    setPdfUrl(libraryService.getPdfUrl(book.id));
    setIsPdfLoading(true); // Reset spinner when opening a new book
  }, [book.id]);

  // Clear translation when changing pages
  useEffect(() => {
    setTranslatedText('');
    setShowTranslation(false);
  }, [pageNum]);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      // 1. Fetch the raw text for this specific page
      const pageData = await libraryService.getPageText(book.id, pageNum);
      
      if (!pageData.text) {
        setTranslatedText("No text could be extracted from this page (it might be an image).");
        setShowTranslation(true);
        return;
      }

      // 2. Translate it
      const res = await libraryService.translateText(pageData.text, targetLang);
      setTranslatedText(res.translated_text);
      setShowTranslation(true);
    } catch (err) {
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // SECURITY: Prevent right-click on the whole reader
  const handleContextMenu = (e) => e.preventDefault();

  return (
    <div onContextMenu={handleContextMenu} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}>
          ← Library
        </button>
        <div style={{ fontWeight: 600, color: '#1f2937' }}>{book.title}</div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {pageNum} {numPages ? `of ${numPages}` : ''}</div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
                {/* PDF Viewer (Left Side) */}
        <div style={{ flex: showTranslation ? 1 : 1, height: '100%', background: '#525659', position: 'relative' }}>
          
          {/* Loading Spinner Overlay */}
          {isPdfLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#525659', color: 'white', zIndex: 10 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Loading PDF...</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>This may take a moment for large files</p>
            </div>
          )}

          <iframe 
            // CRITICAL FIX: Removed key={pageNum} to prevent full iframe reloads on page turns!
            src={`${pdfUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Book Reader"
            onLoad={() => setIsPdfLoading(false)} // Hides spinner when PDF finishes loading
          />
        </div>

        {/* Translation Panel (Right Side - Only shows when active) */}
        {showTranslation && (
          <div style={{ 
            width: '350px', borderLeft: '1px solid #e5e7eb', background: '#f0fdf4', 
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #bbf7d0', fontWeight: 600, color: '#166534' }}>
              Translation ({targetLang}) - Page {pageNum}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', lineHeight: 1.6, color: '#1f2937', whiteSpace: 'pre-wrap' }}>
              {isTranslating ? (
                <p style={{ textAlign: 'center', color: '#16a34a' }}>🤖 Translating page...</p>
              ) : (
                translatedText
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        
        {/* Page Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => setPageNum(Math.max(1, pageNum - 1))} 
            disabled={pageNum <= 1}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', background: 'white', cursor: pageNum <= 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Prev
          </button>
          <input 
            type="number" 
            value={pageNum} 
            onChange={(e) => setPageNum(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          />
          <button 
            onClick={() => setPageNum(pageNum + 1)} 
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
          >
            Next →
          </button>
        </div>

        {/* Translation Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={targetLang} 
            onChange={(e) => { setTargetLang(e.target.value); setShowTranslation(false); }}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          >
            <option value="isiZulu">isiZulu</option>
            <option value="isiXhosa">isiXhosa</option>
            <option value="Afrikaans">Afrikaans</option>
            <option value="Sesotho">Sesotho</option>
            <option value="Setswana">Setswana</option>
          </select>
          
          <button 
            onClick={handleTranslate} 
            disabled={isTranslating}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', 
              background: isTranslating ? '#9ca3af' : '#16a34a', color: 'white', 
              cursor: isTranslating ? 'not-allowed' : 'pointer', fontWeight: 600 
            }}
          >
            {isTranslating ? 'Translating...' : 'Translate Page'}
          </button>
          
          {showTranslation && (
            <button onClick={() => setShowTranslation(false)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #16a34a', background: 'white', color: '#16a34a', cursor: 'pointer' }}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}