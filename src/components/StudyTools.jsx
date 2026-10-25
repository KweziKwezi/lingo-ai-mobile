import { useState, useEffect } from 'react';
import { bookService, tutorService } from '../services/api';

export default function StudyTools() {
  const [step, setStep] = useState('setup'); // setup, taking_quiz, results
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    bookService.getBooks().then(setBooks).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedBook) { setError('Please select a textbook first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await tutorService.generateQuiz(selectedBook, numQuestions);
      setQuestions(res.questions);
      setUserAnswers({});
      setResults(null);
      setStep('taking_quiz');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate quiz.');
    } finally { setLoading(false); }
  };

  const handleAnswerChange = (qId, value) => {
    setUserAnswers({ ...userAnswers, [qId]: value });
  };

  const handleSubmitQuiz = async () => {
    setLoading(true); setError('');
    try {
      const res = await tutorService.gradeQuiz(questions, userAnswers);
      setResults(res);
      setStep('results');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade quiz.');
    } finally { setLoading(false); }
  };

  const resetQuiz = () => {
    setStep('setup');
    setQuestions([]);
    setUserAnswers({});
    setResults(null);
    setError('');
  };

  // --- RENDER: SETUP SCREEN ---
  if (step === 'setup') {
    return (
      <div className="upload-card quiz-setup">
        <h2>📝 AI Quiz Generator</h2>
        <p>Upload a PDF or Slide in the "Upload" tab first, then select it below to generate a custom quiz.</p>
        
        <div className="form-group" style={{textAlign: 'left'}}>
          <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Select Textbook</label>
          <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="select">
            <option value="">-- Choose a book --</option>
            {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
          </select>
        </div>

        <div className="form-group" style={{textAlign: 'left'}}>
          <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Number of Questions</label>
          <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="select">
            <option value={3}>3 Questions (Quick)</option>
            <option value={5}>5 Questions (Standard)</option>
            <option value={10}>10 Questions (Full Test)</option>
          </select>
        </div>

        {error && <div className="status-msg error">{error}</div>}
        <button onClick={handleGenerate} disabled={loading || !selectedBook} className="btn">
          {loading ? 'Generating Quiz...' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  // --- RENDER: RESULTS SCREEN ---
  if (step === 'results' && results) {
    return (
      <div>
        <div className="results-header">
          <p style={{margin: 0, fontSize: '1.2rem'}}>Your Total Score</p>
          <h1 className="results-score">{results.total_score} <span className="results-max">/ {results.max_score}</span></h1>
          <p style={{margin: '0.5rem 0 0 0'}}>{Math.round((results.total_score / results.max_score) * 100)}%</p>
        </div>

        {results.graded_questions.map((q) => {
          const originalQ = questions.find(orig => orig.id === q.id);
          return (
            <div key={q.id} className="quiz-question-card">
              <div className="quiz-q-header">
                <span className="quiz-q-type">{originalQ.type}</span>
                <span className="quiz-q-marks">{q.awarded_marks} / {originalQ.marks} marks</span>
              </div>
              <div className="quiz-q-text">{originalQ.question}</div>
              
              {originalQ.type === 'mcq' && (
                <div style={{color: '#4b5563', marginBottom: '1rem'}}>
                  <strong>Your answer:</strong> {originalQ.options[userAnswers[q.id]]}
                </div>
              )}
              {(originalQ.type === 'short' || originalQ.type === 'long') && (
                <div style={{color: '#4b5563', marginBottom: '1rem', whiteSpace: 'pre-wrap'}}>
                  <strong>Your answer:</strong><br/>{userAnswers[q.id]}
                </div>
              )}

              <div className={`feedback-box ${q.is_correct ? 'correct' : 'incorrect'}`}>
                <strong>{q.is_correct ? '✅ Correct!' : '❌ Incorrect'}</strong>
                {q.feedback}
              </div>
            </div>
          );
        })}

        <button onClick={resetQuiz} className="btn" style={{marginTop: '1rem'}}>Take Another Quiz</button>
      </div>
    );
  }

  // --- RENDER: TAKING QUIZ SCREEN ---
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2 style={{margin: 0, color: '#0d9488'}}>Taking Quiz</h2>
        <button onClick={resetQuiz} className="btn-outline" style={{background: 'none', border: '1px solid #dc2626', color: '#dc2626', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer'}}>Cancel</button>
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className="quiz-question-card">
          <div className="quiz-q-header">
            <span className="quiz-q-type">Question {index + 1} ({q.type})</span>
            <span className="quiz-q-marks">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          </div>
          <div className="quiz-q-text">{q.question}</div>

          {q.type === 'mcq' && q.options.map((opt, optIdx) => (
            <button 
              key={optIdx} 
              className={`quiz-option ${userAnswers[q.id] === optIdx ? 'selected' : ''}`}
              onClick={() => handleAnswerChange(q.id, optIdx)}
            >
              {opt}
            </button>
          ))}

          {q.type === 'short' && (
            <textarea 
              className="quiz-textarea" 
              placeholder="Type your short answer here..."
              value={userAnswers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            />
          )}

          {q.type === 'long' && (
            <textarea 
              className="quiz-textarea" 
              style={{minHeight: '150px'}}
              placeholder="Type your detailed answer here..."
              value={userAnswers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}

      {error && <div className="status-msg error">{error}</div>}

      <button 
        onClick={handleSubmitQuiz} 
        disabled={loading} 
        className="btn" 
        style={{marginTop: '1rem', padding: '1rem'}}
      >
        {loading ? 'AI is Grading...' : 'Submit & Grade Quiz'}
      </button>
    </div>
  );
}