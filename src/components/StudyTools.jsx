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
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');

  // AI Chat States
  const [showAiChat, setShowAiChat] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Common Styles
  const inputStyle = {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: '#fff'
  };

  const primaryBtnStyle = {
    padding: '0.75rem 1.5rem',
    background: '#0d9488', // Teal color
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.95rem',
    whiteSpace: 'nowrap'
  };

  const secondaryBtnStyle = {
    padding: '0.75rem 1.5rem',
    background: '#4b5563',
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.95rem'
  };

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
    if (!uploadFile || !uploadTitle) return alert("Please select a file and enter a title.");
    setUploading(true);
    try {
      const newBook = await bookService.uploadFile(uploadFile, uploadTitle, '12', uploadSubject || 'General', 'textbook');
      alert("Upload successful! It is now selected for your quiz.");
      
      const [myBooks, publicBooks] = await Promise.all([bookService.getBooks(), libraryService.getPublicLibrary()]);
      const allDocs = [...(myBooks || []).map(b => ({ ...b, label: `📁 My Upload: ${b.title}` })), ...(publicBooks || []).map(b => ({ ...b, label: `📚 Public: ${b.title}` }))];
      setBooks(allDocs);
      setSelectedBookId(newBook.id);
      
      setUploadFile(null); setUploadTitle(''); setUploadSubject('');
    } catch (err) { alert("Upload failed: " + (err.response?.data?.detail || "Unknown error")); } 
    finally { setUploading(false); }
  };

  const generateQuiz = async () => {
    if (!selectedBookId) return alert("Please select or upload a document first.");
    setLoading(true); setGraded(false); setQuiz(null); setAnswers({});
    try {
      const data = await tutorService.generateQuiz(selectedBookId, numQuestions);
      setQuiz(data.questions || data);
    } catch (err) { alert("Failed to generate quiz."); } 
    finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const data = await tutorService.gradeQuiz(quiz, answers);
      setScore(data.score); setGraded(true);
    } catch (err) { alert("Failed to grade quiz."); } 
    finally { setLoading(false); }
  };

  const askAiAboutQuestion = (q) => { setActiveQuestion(q); setShowAiChat(true); setAiResponse(''); setAiQuestion(''); };

  const sendAiQuestion = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `The student is asking about this quiz question: "${activeQuestion.question}". The correct answer is: "${activeQuestion.correct_answer}". The student answered: "${answers[activeQuestion.id] || 'No answer'}". Student's question: "${aiQuestion}". Please explain clearly why the correct answer is right and why the student's answer was wrong.`;
      const response = await tutorService.askQuestion(prompt, 'English', selectedBookId, null, null);
      setAiResponse(response.answer);
    } catch (err) { setAiResponse("Sorry, I couldn't process that."); } 
    finally { setAiLoading(false); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>Quiz Generator</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.05rem' }}>Upload a document or select an existing one to generate a custom quiz.</p>

      {/* Upload Section */}
      <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#374151' }}>📤 Upload a New Document</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <input type="text" placeholder="Document Title (e.g., Biology Ch1)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Subject (Optional)" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} style={inputStyle} />
          <input type="file" accept=".pdf,.pptx" onChange={(e) => setUploadFile(e.target.files[0])} style={{ ...inputStyle, padding: '0.5rem', fontSize: '0.9rem' }} />
          <button onClick={handleUpload} disabled={uploading} style={{ ...primaryBtnStyle, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? '...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Quiz Settings */}
      <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem', border: '1px solid #f3f4f6' }}>
        <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Select a Document</label>
        <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} style={{ ...inputStyle, marginBottom: '1.5rem', appearance: 'auto' }}>
          <option value="">Choose a book or your uploaded doc...</option>
          {books.map(book => <option key={book.id} value={book.id}>{book.label || book.title}</option>)}
        </select>

        <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Number of Questions: <span style={{color: '#0d9488'}}>{numQuestions}</span></label>
        <input type="range" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} style={{ width: '100%', marginBottom: '2rem', accentColor: '#0d9488' }} />

        <button onClick={generateQuiz} disabled={loading || !selectedBookId} style={{ width: '100%', padding: '1rem', background: loading ? '#9ca3af' : '#10b981', color: 'white', borderRadius: '10px', border: 'none', fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
          {loading ? 'Generating...' : '🎯 Generate Quiz'}
        </button>
      </div>

      {/* Quiz Display */}
      {quiz && !graded && (
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: index !== quiz.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>{index + 1}. {q.question}</h3>
              {q.options?.map((opt, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.2s' }}>
                  <input type="radio" name={`q-${index}`} value={opt} onChange={() => setAnswers({...answers, [q.id || index]: opt})} style={{ marginRight: '0.75rem', accentColor: '#0d9488', transform: 'scale(1.2)' }} />
                  <span style={{fontSize: '1rem'}}>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button onClick={submitQuiz} disabled={loading} style={{ width: '100%', padding: '1rem', background: '#4f46e5', color: 'white', borderRadius: '10px', border: 'none', fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Grading...' : 'Submit & Grade Quiz'}
          </button>
        </div>
      )}

      {/* Graded Results */}
      {graded && (
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#10b981', fontSize: '2rem', marginBottom: '2rem' }}>You scored {score}!</h2>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>{index + 1}. {q.question}</h4>
              <p style={{ color: '#059669', fontWeight: 600, marginBottom: '0.5rem' }}>✅ Correct Answer: {q.correct_answer}</p>
              <p style={{ color: answers[q.id || index] === q.correct_answer ? '#059669' : '#dc2626', fontWeight: 600, marginBottom: '1rem' }}>
                Your Answer: {answers[q.id || index] || 'No answer'}
              </p>
              <button onClick={() => askAiAboutQuestion(q)} style={{ padding: '0.6rem 1.2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                🤖 Ask AI to explain this
              </button>
            </div>
          ))}
          <button onClick={() => { setGraded(false); setQuiz(null); }} style={{ width: '100%', padding: '1rem', background: '#6b7280', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' }}>
            Generate New Quiz
          </button>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && activeQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{margin: 0}}>Ask AI Tutor</h3>
              <button onClick={() => setShowAiChat(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
              <strong>Question:</strong> {activeQuestion.question}<br/>
              <strong style={{color: '#059669'}}>Correct:</strong> {activeQuestion.correct_answer}
            </div>
            
            {aiResponse && (
              <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', border: '1px solid #a7f3d0', color: '#065f46' }}>
                {aiResponse}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input type="text" placeholder="e.g., Why is B wrong?" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && sendAiQuestion()} />
              <button onClick={sendAiQuestion} disabled={aiLoading} style={{ ...primaryBtnStyle, padding: '0.75rem 1.5rem' }}>
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}