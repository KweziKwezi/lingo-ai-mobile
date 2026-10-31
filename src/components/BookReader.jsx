import { useState, useEffect } from 'react';
import { libraryService } from '../services/api';

export default function BookReader({ book, onBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [pdfUrl, setPdfUrl] = useState('');
  
  const [targetLang, setTargetLang] = useState('isiZulu');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(null);

  useEffect(() => {
    setPdfUrl(libraryService.getPdfUrl(book.id));
    setIsPdfLoading(true); 
    setPageNum(1);
  }, [book.id]);

  useEffect(() => {
    setTranslatedText('');
    setShowTranslation(false);
    setIsPdfLoading(true);
  }, [pageNum]);

    const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslatedText('');
    setShowTranslation(true);
    
    try {
      // Fetch text for the EXACT page number
      const pageData = await libraryService.getPageText(book.id, pageNum);
      
      if (!pageData.text || pageData.text.trim().length < 5) {
        setTranslatedText("⚠️ No text could be extracted from this exact page. It might be an image, a blank page, or a complex layout that the AI cannot read.");
        setIsTranslating(false);
        return;
      }

      const res = await libraryService.translateText(pageData.text, targetLang);
      setTranslatedText(res.translated_text);
    } catch (err) {
      setTranslatedText("❌ Translation failed. Please try again.");
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleContextMenu = (e) => e.preventDefault();

  const goToPage = (newPage) => {
    if (newPage >= 1) {
      setPageNum(newPage);
    }
  };

  return (
    <div className="fade-in" onContextMenu={handleContextMenu} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 180px)',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)'
    }}>
      
      {/* Header */}
      <div style={{ 
        padding: '1rem 1.25rem', 
        background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.05), rgba(99, 102, 241, 0.05))',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          ← Back
        </button>
        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem', textAlign: 'center', flex: 1, margin: '0 1rem' }}>
          {book.title}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Page {pageNum}{totalPages ? ` of ${totalPages}` : ''}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* PDF Viewer */}
        <div style={{ 
          flex: showTranslation ? 1 : 1, 
          height: '100%', 
          background: '#525659',
          position: 'relative'
        }}>
          
          {isPdfLoading && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#525659', 
              color: 'white', 
              zIndex: 10 
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(255,255,255,0.2)',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Loading page {pageNum}...</p>
            </div>
          )}

          {/* CRITICAL FIX: key forces iframe reload when page changes */}
          <iframe 
            key={`${book.id}-page-${pageNum}`}
            src={`${pdfUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Book Reader"
            onLoad={() => setIsPdfLoading(false)} 
          />
        </div>

        {/* Translation Panel */}
        {showTranslation && (
          <div className="glass-card fade-in" style={{ 
            width: '400px', 
            marginLeft: '1rem',
            padding: 0,
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid var(--primary-light)'
          }}>
            <div style={{ 
              padding: '1.25rem', 
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.05rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🌍 Translation ({targetLang})</span>
              <button 
                onClick={() => setShowTranslation(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.25rem', 
              lineHeight: 1.8, 
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              background: 'white',
              whiteSpace: 'pre-wrap'
            }}>
              {isTranslating ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--border-light)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }} />
                  <p>Translating page {pageNum}...</p>
                </div>
              ) : (
                translatedText
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ 
        padding: '1rem 1.25rem', 
        background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,255,255,0.95))',
        borderTop: '1px solid var(--border-light)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        
        {/* Page Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => goToPage(pageNum - 1)} 
            disabled={pageNum <= 1}
            className="btn-secondary"
            style={{ padding: '0.625rem 1rem' }}
          >
            ← Prev
          </button>
          <input 
            type="number" 
            value={pageNum} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1) goToPage(val);
            }}
            className="input-modern"
            style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
          />
          <button 
            onClick={() => goToPage(pageNum + 1)} 
            className="btn-secondary"
            style={{ padding: '0.625rem 1rem' }}
          >
            Next →
          </button>
        </div>

        {/* Translation Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={targetLang} 
            onChange={(e) => { setTargetLang(e.target.value); setShowTranslation(false); }}
            className="input-modern"
            style={{ width: '140px' }}
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
            className="btn-primary"
            style={{
              padding: '0.625rem 1.25rem'
            }}
          >
            {isTranslating ? '🔄 Translating...' : '🌍 Translate Page'}
          </button>
        </div>
      </div>
    </div>
  );
}