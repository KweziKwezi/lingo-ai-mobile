import { useState, useEffect } from 'react';
import { bookService, libraryService, tutorService } from '../services/api';

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

  // --- MODERN STYLING SYSTEM ---
  const theme = {
    primary: '#0d9488', // Teal
    primaryDark: '#0f766e',
    secondary: '#4f46e5', // Indigo
    bg: '#f8fafc', // Light slate
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    danger: '#ef4444'
  };

  const cardStyle = {
    background: theme.card,
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
    border: `1px solid ${theme.border}`,
    marginBottom: '1.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    border: `1px solid ${theme.border}`,
    fontSize: '0.95rem',
    color: theme.textMain,
    background: '#f8fafc',
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box'
  };

  const btnStyle = (color, disabled) => ({
    padding: '0.875rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    background: disabled ? '#cbd5e1' : color,
    color: 'white',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  });

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
      const data = await tutorService.generateQuiz(selectedBookId, numQuestions);
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
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: theme.bg, minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: theme.textMain, margin: 0, letterSpacing: '-0.025em' }}>Quiz Generator</h1>
        <p style={{ color: theme.textMuted, fontSize: '1.1rem', marginTop: '0.5rem' }}>Create custom quizzes from your documents instantly.</p>
      </div>

      {/* Upload Card */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.textMain, marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📤</span> Upload New Document
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <input type="text" placeholder="Document Title (e.g., Biology Ch1)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Subject (Optional)" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Hidden real file input */}
          <input 
            type="file" 
            id="file-upload" 
            accept=".pdf,.pptx" 
            onChange={(e) => setUploadFile(e.target.files[0])} 
            style={{ display: 'none' }} 
          />
          {/* Styled label acting as button */}
          <label 
            htmlFor="file-upload" 
            style={{ ...btnStyle(theme.secondary), flex: 1, cursor: 'pointer' }}
          >
            {uploadFile ? uploadFile.name.substring(0, 20) + '...' : 'Choose File...'}
          </label>
          
          <button onClick={handleUpload} disabled={uploading} style={{ ...btnStyle(theme.primary, uploading), flex: 1 }}>
            {uploading ? 'Uploading...' : 'Upload & Select'}
          </button>
        </div>
      </div>

      {/* Quiz Settings Card */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.textMain, marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚙️</span> Quiz Settings
        </h3>
        
        <label style={{ fontWeight: 600, color: theme.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Select Document</label>
        <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} style={{ ...inputStyle, marginBottom: '1.5rem', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231e293b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.8rem auto' }}>
          <option value="">Choose a document...</option>
          {books.map(book => <option key={book.id} value={book.id}>{book.label || book.title}</option>)}
        </select>

        <label style={{ fontWeight: 600, color: theme.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Number of Questions</span>
          <span style={{ color: theme.primary, fontWeight: 700 }}>{numQuestions}</span>
        </label>
        <input type="range" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} style={{ width: '100%', marginBottom: '2rem', accentColor: theme.primary, height: '6px', borderRadius: '5px', background: '#e2e8f0', outline: 'none' }} />

        <button onClick={generateQuiz} disabled={loading || !selectedBookId} style={{ ...btnStyle(theme.success, loading || !selectedBookId), width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
          {loading ? 'Generating...' : '🎯 Generate Quiz'}
        </button>
      </div>

      {/* Quiz Display */}
      {quiz && !graded && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 0, marginBottom: '1.5rem' }}>📝 Your Quiz</h3>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: index !== quiz.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: theme.textMain }}>{index + 1}. {q.question}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.options?.map((opt, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name={`q-${index}`} value={opt} onChange={() => setAnswers({...answers, [q.id || index]: opt})} style={{ marginRight: '1rem', accentColor: theme.primary, transform: 'scale(1.2)' }} />
                    <span style={{ fontSize: '1rem', color: theme.textMain }}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submitQuiz} disabled={loading} style={{ ...btnStyle(theme.secondary, loading), width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Grading...' : 'Submit & Grade Quiz'}
          </button>
        </div>
      )}

      {/* Graded Results */}
      {graded && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: theme.success, margin: 0 }}>Score: {score}</h2>
            <p style={{ color: theme.textMuted }}>Great job! Review your answers below.</p>
          </div>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem' }}>{index + 1}. {q.question}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: theme.success, fontWeight: 600 }}>✅ Correct: {q.correct_answer}</span>
              </div>
              <div style={{ color: answers[q.id || index] === q.correct_answer ? theme.success : theme.danger, fontWeight: 600, marginBottom: '1rem' }}>
                Your Answer: {answers[q.id || index] || 'No answer'}
              </div>
              <button onClick={() => askAi(q)} style={{ ...btnStyle(theme.secondary), padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                🤖 Ask AI to explain
              </button>
            </div>
          ))}
          <button onClick={() => { setGraded(false); setQuiz(null); }} style={{ ...btnStyle(theme.textMuted), width: '100%', marginTop: '1rem' }}>
            Generate New Quiz
          </button>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && activeQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>AI Tutor Explanation</h3>
              <button onClick={() => setShowAiChat(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: theme.textMuted }}>×</button>
            </div>
            
            {aiResponse && (
              <div style={{ background: '#f0fdfa', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', border: `1px solid #ccfbf1`, color: '#134e4a', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {aiResponse}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input type="text" placeholder="Ask why the answer is correct..." value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && sendAi()} />
              <button onClick={sendAi} disabled={aiLoading} style={{ ...btnStyle(theme.primary, aiLoading), padding: '0 1.5rem' }}>
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}