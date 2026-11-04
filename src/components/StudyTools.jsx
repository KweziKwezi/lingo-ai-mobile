import { useState, useEffect } from 'react';
import { bookService, libraryService, tutorService } from '../services/api';
import './StudyTools.css';

export default function StudyTools() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');

  const [showAiChat, setShowAiChat] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const [myBooks, publicBooks] = await Promise.all([
          bookService.getBooks(),
          libraryService.getPublicLibrary()
        ]);
        const allDocs = [
          ...(myBooks || []).map(b => ({ ...b, label: `📁 My Upload: ${b.title}` })),
          ...(publicBooks || []).map(b => ({ ...b, label: `📚 Public: ${b.title}` }))
        ];
        setBooks(allDocs);
      } catch (err) { console.error("Failed to fetch books", err); }
    };
    fetchBooks();
  }, []);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) return alert("Please enter a title and select a file.");
    setUploading(true);
    try {
      const newBook = await bookService.uploadFile(uploadFile, uploadTitle, '12', uploadSubject || 'General', 'textbook');
      alert("Upload successful! It is now selected.");
      const [myBooks, publicBooks] = await Promise.all([bookService.getBooks(), libraryService.getPublicLibrary()]);
      setBooks([...(myBooks || []).map(b => ({ ...b, label: `📁 My Upload: ${b.title}` })), ...(publicBooks || []).map(b => ({ ...b, label: `📚 Public: ${b.title}` }))]);
      setSelectedBookId(newBook.id);
      setUploadFile(null); setUploadTitle(''); setUploadSubject('');
    } catch (err) { alert("Upload failed."); } finally { setUploading(false); }
  };

  const generateQuiz = async () => {
    if (!selectedBookId) return alert("Please select a document.");
    setLoading(true); setGraded(false); setQuiz(null);
    try {
      // FIX: Wrap in Number() to ensure backend receives an integer
      const data = await tutorService.generateQuiz(selectedBookId, Number(numQuestions));
      setQuiz(data.questions || data);
    } catch (err) { alert("Failed to generate quiz."); } finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const data = await tutorService.gradeQuiz(quiz, answers);
      setScore(data.score); setGraded(true);
    } catch (err) { alert("Failed to grade."); } finally { setLoading(false); }
  };

  const askAi = (q) => { setActiveQuestion(q); setShowAiChat(true); setAiResponse(''); setAiQuestion(''); };

  const sendAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Question: "${activeQuestion.question}". Correct: "${activeQuestion.correct_answer}". Student answered: "${answers[activeQuestion.id] || 'None'}". Student asks: "${aiQuestion}". Explain clearly.`;
      const res = await tutorService.askQuestion(prompt, 'English', selectedBookId, null, null);
      setAiResponse(res.answer);
    } catch (err) { setAiResponse("Error processing."); } finally { setAiLoading(false); }
  };

  return (
    <div className="st-page">
      
      <div className="st-header">
        <h1>Quiz Generator</h1>
        <p>Create custom quizzes from your documents instantly.</p>
      </div>

      <div className="st-card">
        <h3 className="st-card-title">
          <span className="st-card-title-icon">📤</span> Upload New Document
        </h3>
        
        <div className="st-upload-grid">
          <input 
            id="upload-title"
            type="text" 
            placeholder="Document Title (e.g., Biology Ch1)" 
            value={uploadTitle} 
            onChange={(e) => setUploadTitle(e.target.value)} 
            className="st-input" 
          />
          <input 
            id="upload-subject"
            type="text" 
            placeholder="Subject (Optional)" 
            value={uploadSubject} 
            onChange={(e) => setUploadSubject(e.target.value)} 
            className="st-input" 
          />
        </div>

        <div className="st-upload-row">
          <input 
            type="file" 
            id="file-upload" 
            accept=".pdf,.pptx" 
            onChange={(e) => setUploadFile(e.target.files[0])} 
            style={{ display: 'none' }} 
          />
          <label 
            htmlFor="file-upload" 
            className="st-btn st-btn-secondary st-file-label"
          >
            {uploadFile ? uploadFile.name : 'Choose File...'}
          </label>
          
          <button onClick={handleUpload} disabled={uploading} className="st-btn st-btn-primary">
            {uploading ? 'Uploading...' : 'Upload & Select'}
          </button>
        </div>
      </div>

      <div className="st-card">
        <h3 className="st-card-title">
          <span className="st-card-title-icon">⚙️</span> Quiz Settings
        </h3>
        
        <label htmlFor="doc-select" className="st-label">Select Document</label>
        <select 
          id="doc-select"
          value={selectedBookId} 
          onChange={(e) => setSelectedBookId(e.target.value)} 
          className="st-select"
        >
          <option value="">Choose a document...</option>
          {books.map(book => <option key={book.id} value={book.id}>{book.label || book.title}</option>)}
        </select>

        <div className="st-label-row" style={{ marginTop: '24px' }}>
          <label htmlFor="q-range" className="st-label" style={{margin: 0}}>Number of Questions</label>
          <span className="st-val">{numQuestions}</span>
        </div>
        <input 
          id="q-range"
          type="range" 
          min="1" 
          max="20" 
          value={numQuestions} 
          onChange={(e) => setNumQuestions(e.target.value)} 
          className="st-range" 
        />

        <button 
          onClick={generateQuiz} 
          disabled={loading || !selectedBookId} 
          className="st-btn st-btn-success st-btn-full"
        >
          {loading ? 'Generating...' : '🎯 Generate Quiz'}
        </button>
      </div>

      {quiz && !graded && (
        <div className="st-card">
          <h3 className="st-card-title">📝 Your Quiz</h3>
          {quiz.map((q, index) => (
            <div key={q.id || index} className="st-q-block">
              <h4 className="st-q-title">{index + 1}. {q.question}</h4>
              <div>
                {q.options?.map((opt, i) => {
                  const isSelected = answers[q.id || index] === opt;
                  return (
                    <label key={i} className={`st-option ${isSelected ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${index}`} 
                        value={opt} 
                        onChange={() => setAnswers({...answers, [q.id || index]: opt})} 
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button 
            onClick={submitQuiz} 
            disabled={loading} 
            className="st-btn st-btn-secondary st-btn-full"
          >
            {loading ? 'Grading...' : 'Submit & Grade Quiz'}
          </button>
        </div>
      )}

      {graded && (
        <div className="st-card">
          <div className="st-score-display">
            <h2>Score: {score}</h2>
            <p style={{ color: 'var(--st-muted)', margin: 0 }}>Great job! Review your answers below.</p>
          </div>
          {quiz.map((q, index) => {
            const isCorrect = answers[q.id || index] === q.correct_answer;
            return (
              <div key={q.id || index} className="st-result-block">
                <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>{index + 1}. {q.question}</h4>
                <div className="st-result-correct" style={{ marginBottom: '8px' }}>✅ Correct: {q.correct_answer}</div>
                <div className={isCorrect ? 'st-result-correct' : 'st-result-wrong'} style={{ marginBottom: '16px' }}>
                  Your Answer: {answers[q.id || index] || 'No answer'}
                </div>
                <button onClick={() => askAi(q)} className="st-btn st-btn-secondary" style={{ padding: '0 16px', height: '40px', fontSize: '14px' }}>
                  🤖 Ask AI to explain
                </button>
              </div>
            );
          })}
          <button 
            onClick={() => { setGraded(false); setQuiz(null); }} 
            className="st-btn st-btn-muted st-btn-full" 
            style={{ marginTop: '16px' }}
          >
            Generate New Quiz
          </button>
        </div>
      )}

      {showAiChat && activeQuestion && (
        <div className="st-modal-overlay" onClick={() => setShowAiChat(false)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-header">
              <h3>AI Tutor Explanation</h3>
              <button onClick={() => setShowAiChat(false)} className="st-modal-close">×</button>
            </div>
            
            {aiResponse && (
              <div className="st-ai-response">
                {aiResponse}
              </div>
            )}

            <div className="st-ai-input-row">
              <input 
                type="text" 
                placeholder="Ask why the answer is correct..." 
                value={aiQuestion} 
                onChange={(e) => setAiQuestion(e.target.value)} 
                className="st-input" 
                style={{ flex: 1 }} 
                onKeyDown={(e) => e.key === 'Enter' && sendAi()} 
              />
              <button 
                onClick={sendAi} 
                disabled={aiLoading} 
                className="st-btn st-btn-primary"
                style={{ padding: '0 24px' }}
              >
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}