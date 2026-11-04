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
    setLoading(true); setGraded(false); setQuiz(null); setAnswers({});
    try {
      const data = await tutorService.generateQuiz(selectedBookId, Number(numQuestions));
      setQuiz(data.questions || data);
    } catch (err) { 
      console.error("Quiz generation error:", err);
      alert("Failed to generate quiz. Please try again."); 
    } finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const data = await tutorService.gradeQuiz(quiz, answers);
      setScore(data.score); setGraded(true);
    } catch (err) { alert("Failed to grade."); } finally { setLoading(false); }
  };

  // FIX: Accept index to reliably look up the student's answer
  const askAi = (q, index) => { 
    setActiveQuestion({ ...q, index }); 
    setShowAiChat(true); 
    setAiResponse(''); 
    setAiQuestion(''); 
  };

  const sendAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const q = activeQuestion;
      const studentAnswer = answers[q.id || q.index] || 'No answer provided';
      const correctAnswer = q.correct_answer || q.answer || 'Not provided in data';
      
      // FIX: Highly specific prompt to force the AI to explain right vs wrong
      const prompt = `You are an expert, encouraging tutor. The student is asking about this quiz question: "${q.question}". 
The correct answer is: "${correctAnswer}". 
The student answered: "${studentAnswer}". 
Student's specific question: "${aiQuestion}". 

Please provide a clear, step-by-step explanation:
1. State clearly what the correct answer is and WHY it is correct based on the document context.
2. Gently explain WHY the student's answer was wrong or incomplete (if applicable).
3. Keep the tone helpful, educational, and easy to understand.`;
      
      const res = await tutorService.askQuestion(prompt, 'English', selectedBookId, null, null);
      // Handle different possible response shapes from the backend safely
      const aiText = res.answer || res.message || (typeof res === 'string' ? res : JSON.stringify(res));
      setAiResponse(aiText);
    } catch (err) { 
      console.error("AI Ask Error:", err);
      setAiResponse("Sorry, I couldn't process that right now. Please check your connection and try again."); 
    } finally { 
      setAiLoading(false); 
    }
  };

  return (
    <div className="st-page">
      <header className="st-header">
        <h1 className="st-title">Quiz Generator</h1>
        <p className="st-subtitle">Create custom quizzes from your documents instantly.</p>
      </header>

      <section className="st-card">
        <h3 className="st-card-title"><span className="st-card-icon">📤</span> Upload New Document</h3>
        <div className="st-grid-2">
          <input id="st-upload-title" className="st-input" type="text" placeholder="Document title (e.g., Biology Ch1)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
          <input id="st-upload-subject" className="st-input" type="text" placeholder="Subject (optional)" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} />
        </div>
        <div className="st-actions">
          <div style={{ position: 'relative', display: 'flex' }}>
            <input className="st-file-input" type="file" id="st-file-upload" accept=".pdf,.pptx" onChange={(e) => setUploadFile(e.target.files[0])} />
            <label htmlFor="st-file-upload" className="st-btn st-btn--secondary st-btn--block">
              <span className="st-file-name">{uploadFile ? uploadFile.name : 'Choose file'}</span>
            </label>
          </div>
          <button className="st-btn st-btn--primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload & select'}
          </button>
        </div>
      </section>

      <section className="st-card">
        <h3 className="st-card-title"><span className="st-card-icon">⚙️</span> Quiz Settings</h3>
        <div className="st-field">
          <div className="st-label-row">
            <label className="st-label" htmlFor="st-doc-select">Select document</label>
          </div>
          <select id="st-doc-select" className="st-select" value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}>
            <option value="">Choose a document...</option>
            {books.map(book => <option key={book.id} value={book.id}>{book.label || book.title}</option>)}
          </select>
        </div>
        <div className="st-field" style={{ marginBottom: 0 }}>
          <div className="st-label-row">
            <label className="st-label" htmlFor="st-num-questions">Number of questions</label>
            <span className="st-value">{numQuestions}</span>
          </div>
          <input id="st-num-questions" className="st-range" type="range" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} />
        </div>
        <button className="st-btn st-btn--success st-btn--block st-btn--lg st-generate" onClick={generateQuiz} disabled={loading || !selectedBookId}>
          {loading ? 'Generating...' : '🎯 Generate quiz'}
        </button>
      </section>

      {quiz && !graded && (
        <section className="st-card">
          <h3 className="st-card-title"><span className="st-card-icon">📝</span> Your Quiz</h3>
          {quiz.map((q, index) => {
            const currentAnswer = answers[q.id || index];
            return (
              <div key={q.id || index} className="st-question">
                <h4 className="st-question-text">{index + 1}. {q.question}</h4>
                
                {/* FIX: Fallback to text input if backend doesn't provide options */}
                {q.options && q.options.length > 0 ? (
                  <div className="st-options">
                    {q.options.map((opt, i) => {
                      const isChecked = currentAnswer === opt;
                      return (
                        <label key={i} className={`st-option ${isChecked ? 'st-option--selected' : ''}`}>
                          <input
                            type="radio"
                            name={`question-${q.id || index}`}
                            value={opt}
                            checked={isChecked}
                            onChange={() => setAnswers({ ...answers, [q.id || index]: opt })}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="st-field">
                    <textarea
                      className="st-input"
                      style={{ height: '100px', padding: '12px', resize: 'vertical', fontFamily: 'inherit' }}
                      placeholder="Type your answer here..."
                      value={currentAnswer || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id || index]: e.target.value })}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <button className="st-btn st-btn--secondary st-btn--block st-btn--lg" onClick={submitQuiz} disabled={loading}>
            {loading ? 'Grading...' : 'Submit & grade quiz'}
          </button>
        </section>
      )}

      {graded && (
        <section className="st-card">
          <div className="st-score">
            <h2 className="st-score-value">Score: {score}</h2>
            <p className="st-score-note">Review your answers below.</p>
          </div>

          {quiz.map((q, index) => {
            const given = answers[q.id || index];
            const correctAnswer = q.correct_answer || q.answer || 'Not provided';
            const isCorrect = given === correctAnswer;
            return (
              <div key={q.id || index} className="st-result">
                <h4 className="st-question-text">{index + 1}. {q.question}</h4>

                <div className="st-answer st-answer--correct">
                  <span className="st-badge">Correct</span>
                  <span>{correctAnswer}</span>
                </div>
                <div className={`st-answer ${isCorrect ? 'st-answer--correct' : 'st-answer--wrong'}`}>
                  <span className="st-badge">Your answer</span>
                  <span>{given || 'No answer'}</span>
                </div>

                {/* FIX: Pass index to askAi */}
                <button className="st-btn st-btn--secondary st-btn--sm" onClick={() => askAi(q, index)}>
                  🤖 Ask AI to explain
                </button>
              </div>
            );
          })}

          <button className="st-btn st-btn--muted st-btn--block st-reset" onClick={() => { setGraded(false); setQuiz(null); }}>
            Generate new quiz
          </button>
        </section>
      )}

      {showAiChat && activeQuestion && (
        <div className="st-modal-backdrop" role="dialog" aria-modal="true" aria-label="AI tutor explanation" onClick={() => setShowAiChat(false)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-head">
              <h3 className="st-modal-title">AI Tutor Explanation</h3>
              <button className="st-modal-close" onClick={() => setShowAiChat(false)} aria-label="Close">×</button>
            </div>

            {aiResponse && <div className="st-modal-response">{aiResponse}</div>}

            <div className="st-modal-row">
              <input
                className="st-input"
                type="text"
                placeholder="Ask why the answer is correct..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAi()}
              />
              <button className="st-btn st-btn--primary" onClick={sendAi} disabled={aiLoading} style={{ padding: '0 24px' }}>
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}