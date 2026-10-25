import { useState, useEffect } from 'react';
import { bookService, tutorService } from '../services/api';
export default function StudyTools() {
  const [mode, setMode] = useState('quiz'); // 'quiz' or 'flashcard'
  const [topic, setTopic] = useState('');
  const [numItems, setNumItems] = useState(5);
  const [language, setLanguage] = useState('English');
  const [selectedBook, setSelectedBook] = useState('');
  const [books, setBooks] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Flashcard specific state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz specific state
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Load books on mount
  useEffect(() => {
    bookService.getBooks().then(setBooks).catch(() => {});
  }, []);
  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setSelectedAnswers({});
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const result = await tutorService.generateStudyMaterial(
        topic, language, selectedBook || null, mode, numItems
      );
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (qIndex, optIndex, correctIndex) => {
    if (selectedAnswers[qIndex] !== undefined) return; // Prevent changing answer
    setSelectedAnswers({ ...selectedAnswers, [qIndex]: optIndex });
  };

  return (
    <div>
      <div className="tools-header">
        <button className={`tool-tab ${mode === 'quiz' ? 'active' : ''}`} onClick={() => { setMode('quiz'); setData(null); }}>📝 Quiz</button>
        <button className={`tool-tab ${mode === 'flashcard' ? 'active' : ''}`} onClick={() => { setMode('flashcard'); setData(null); }}>️ Flashcards</button>
      </div>

      <div className="upload-card" style={{marginBottom: '1.5rem'}}>
        <div className="form-group">
          <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Topic (Optional)</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Photosynthesis, Quadratic Equations" className="input" />
        </div>
        
        <div className="form-row">
          <div>
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select">
              <option>English</option><option>isiZulu</option><option>isiXhosa</option>
              <option>Afrikaans</option><option>Sesotho</option><option>Setswana</option>
            </select>
          </div>
          <div>
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Number</label>
            <select value={numItems} onChange={(e) => setNumItems(Number(e.target.value))} className="select">
              <option value={3}>3</option><option value={5}>5</option><option value={10}>10</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Source Textbook (Optional)</label>
          <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="select">
            <option value="">General Knowledge</option>
            {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
          </select>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn">
          {loading ? `Generating ${mode === 'quiz' ? 'Quiz' : 'Flashcards'}...` : `Generate ${mode === 'quiz' ? 'Quiz' : 'Flashcards'}`}
        </button>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {/* QUIZ RENDER */}
      {mode === 'quiz' && data && Array.isArray(data) && (
        <div>
          {data.map((q, qIdx) => (
            <div key={qIdx} className="quiz-item">
              <div className="quiz-question">{qIdx + 1}. {q.question}</div>
              {q.options.map((opt, oIdx) => {
                let className = 'quiz-option';
                if (selectedAnswers[qIdx] !== undefined) {
                  if (oIdx === q.correct_answer) className += ' correct';
                  else if (oIdx === selectedAnswers[qIdx]) className += ' incorrect';
                }
                return (
                  <button key={oIdx} className={className} onClick={() => handleQuizAnswer(qIdx, oIdx, q.correct_answer)}>
                    {opt}
                  </button>
                );
              })}
              {selectedAnswers[qIdx] !== undefined && (
                <div className="quiz-explanation">💡 <strong>Explanation:</strong> {q.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FLASHCARD RENDER */}
      {mode === 'flashcard' && data && Array.isArray(data) && (
        <div>
          <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              <div className="flashcard-front">
                <div>{data[currentCardIndex].term}</div>
              </div>
              <div className="flashcard-back">
                <div>{data[currentCardIndex].definition}</div>
              </div>
            </div>
          </div>
          <div className="flashcard-nav">
            <button className="btn" style={{width: 'auto'}} onClick={() => { setCurrentCardIndex(Math.max(0, currentCardIndex - 1)); setIsFlipped(false); }} disabled={currentCardIndex === 0}>Previous</button>
            <span style={{fontWeight: 600, color: '#6b7280'}}>Card {currentCardIndex + 1} of {data.length}</span>
            <button className="btn" style={{width: 'auto'}} onClick={() => { setCurrentCardIndex(Math.min(data.length - 1, currentCardIndex + 1)); setIsFlipped(false); }} disabled={currentCardIndex === data.length - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}