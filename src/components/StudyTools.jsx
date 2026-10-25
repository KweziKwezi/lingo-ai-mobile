import { useState, useEffect } from 'react';
import { bookService, tutorService, sessionService } from '../services/api';

export default function StudyTools() {
  // View states
  const [view, setView] = useState('sessions'); // 'sessions', 'upload', 'quiz-setup', 'taking-quiz', 'results', 'history'
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  
  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadGrade, setUploadGrade] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadType, setUploadType] = useState('textbook');
  
  // Quiz states
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionService.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleDirectUpload = async () => {
    if (!uploadFile || !uploadTitle || !uploadGrade || !uploadSubject) {
      setError('Please fill all fields and select a file');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Upload the file
      const uploadResult = await bookService.uploadFile(
        uploadFile, uploadTitle, uploadGrade, uploadSubject, uploadType
      );
      
      // Create a session for this document
      const sessionResult = await sessionService.createSession(uploadResult.book_id, uploadTitle);
      
      // Set the current session and move to quiz setup
      setCurrentSession({
        id: sessionResult.session_id,
        book_id: uploadResult.book_id,
        title: uploadTitle
      });
      
      // Reset upload form
      setUploadFile(null);
      setUploadTitle('');
      setUploadGrade('');
      setUploadSubject('');
      
      setView('quiz-setup');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (session) => {
    setCurrentSession(session);
    setView('quiz-setup');
  };

  const handleViewHistory = async (session) => {
    setCurrentSession(session);
    try {
      const history = await sessionService.getSessionHistory(session.id);
      setQuizHistory(history);
      setView('history');
    } catch (err) {
      setError('Failed to load history');
    }
  };

  const handleGenerate = async () => {
    if (!currentSession) {
      setError('Please select or upload a document first');
      return;
    }
    
    setLoading(true);
    setError('');
    setUserAnswers({});
    setResults(null);
    
    try {
      const res = await tutorService.generateQuiz(currentSession.book_id, numQuestions);
      setQuestions(res.questions);
      setView('taking-quiz');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId, value) => {
    setUserAnswers({ ...userAnswers, [qId]: value });
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await tutorService.gradeQuiz(questions, userAnswers);
      setResults(res);
      
      // Save the quiz attempt
      if (currentSession) {
        await sessionService.saveQuizAttempt(
          currentSession.id,
          questions,
          userAnswers,
          res,
          res.total_score,
          res.max_score
        );
      }
      
      setView('results');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = 'Failed to grade quiz';
      
      if (Array.isArray(detail)) {
        errorMsg = detail.map(d => d.msg || d).join(', ');
      } else if (typeof detail === 'string') {
        errorMsg = detail;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetToSessions = () => {
    setView('sessions');
    setCurrentSession(null);
    setQuestions([]);
    setUserAnswers({});
    setResults(null);
    setError('');
    loadSessions(); // Refresh sessions list
  };

  const resetToQuizSetup = () => {
    setView('quiz-setup');
    setQuestions([]);
    setUserAnswers({});
    setResults(null);
    setError('');
  };

  // ==========================================
  // RENDER: SESSIONS LIST VIEW
  // ==========================================
  if (view === 'sessions') {
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: '#0d9488'}}>📚 Study Sessions</h2>
          <button onClick={() => setView('upload')} className="btn" style={{padding: '0.5rem 1rem'}}>
            + New Document
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="upload-card" style={{textAlign: 'center', padding: '3rem 1rem'}}>
            <h3 style={{color: '#6b7280', marginBottom: '1rem'}}>No study sessions yet</h3>
            <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>Upload a PDF or slide deck to get started</p>
            <button onClick={() => setView('upload')} className="btn">Upload Your First Document</button>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '1rem'}}>
            {sessions.map((session) => (
              <div key={session.id} className="upload-card" style={{padding: '1.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
                  <div>
                    <h3 style={{margin: '0 0 0.5rem 0', color: '#1f2937'}}>{session.title}</h3>
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                      <span style={{background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600}}>
                        Grade {session.grade}
                      </span>
                      <span style={{background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600}}>
                        {session.subject}
                      </span>
                    </div>
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button onClick={() => handleSelectSession(session)} className="btn" style={{flex: 1, padding: '0.5rem'}}>
                    Generate Quiz
                  </button>
                  <button onClick={() => handleViewHistory(session)} className="btn" style={{flex: 1, padding: '0.5rem', background: '#6b7280'}}>
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: UPLOAD VIEW
  // ==========================================
  if (view === 'upload') {
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: '#0d9488'}}>📤 Upload New Document</h2>
          <button onClick={resetToSessions} style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem'}}>
            ← Back to Sessions
          </button>
        </div>

        <div className="upload-card">
          <div className="form-group">
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Document Title</label>
            <input 
              type="text" 
              value={uploadTitle} 
              onChange={(e) => setUploadTitle(e.target.value)} 
              placeholder="e.g., Grade 10 Life Sciences Chapter 3" 
              className="input" 
            />
          </div>

          <div className="form-row">
            <div>
              <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Grade</label>
              <select value={uploadGrade} onChange={(e) => setUploadGrade(e.target.value)} className="select">
                <option value="">Select Grade</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="University">University</option>
              </select>
            </div>
            <div>
              <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Subject</label>
              <input 
                type="text" 
                value={uploadSubject} 
                onChange={(e) => setUploadSubject(e.target.value)} 
                placeholder="e.g., Mathematics" 
                className="input" 
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Document Type</label>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="select">
              <option value="textbook">Textbook</option>
              <option value="slides">Slides</option>
              <option value="notes">Notes</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Upload File (PDF or PPTX)</label>
            <input 
              type="file" 
              accept=".pdf,.pptx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="input"
              style={{padding: '0.5rem'}}
            />
          </div>

          {error && <div className="status-msg error">{error}</div>}

          <button onClick={handleDirectUpload} disabled={loading} className="btn" style={{width: '100%', padding: '1rem'}}>
            {loading ? 'Uploading...' : 'Upload & Create Session'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: QUIZ SETUP VIEW
  // ==========================================
  if (view === 'quiz-setup') {
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: '#0d9488'}}>📝 Generate Quiz</h2>
          <button onClick={resetToSessions} style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem'}}>
            ← Back to Sessions
          </button>
        </div>

        <div className="upload-card">
          <div style={{background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #16a34a'}}>
            <strong style={{color: '#166534'}}>📖 Document:</strong> {currentSession?.title}
          </div>

          <div className="form-group">
            <label style={{fontWeight: 600, marginBottom: '0.5rem', display: 'block'}}>Number of Questions</label>
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="select">
              <option value={3}>3 Questions (Quick)</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={10}>10 Questions (Full Test)</option>
            </select>
          </div>

          {error && <div className="status-msg error">{error}</div>}

          <button onClick={handleGenerate} disabled={loading} className="btn" style={{width: '100%', padding: '1rem'}}>
            {loading ? 'Generating Quiz...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: HISTORY VIEW
  // ==========================================
  if (view === 'history') {
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: '#0d9488'}}>📊 Quiz History</h2>
          <button onClick={resetToSessions} style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem'}}>
            ← Back to Sessions
          </button>
        </div>

        <div style={{background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #16a34a'}}>
          <strong style={{color: '#166534'}}>📖 Document:</strong> {currentSession?.title}
        </div>

        {quizHistory.length === 0 ? (
          <div className="upload-card" style={{textAlign: 'center', padding: '3rem 1rem'}}>
            <h3 style={{color: '#6b7280', marginBottom: '1rem'}}>No quiz attempts yet</h3>
            <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>Generate your first quiz to see results here</p>
            <button onClick={() => handleSelectSession(currentSession)} className="btn">Generate Quiz</button>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '1rem'}}>
            {quizHistory.map((attempt, index) => (
              <div key={attempt.id} className="upload-card" style={{padding: '1.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
                  <div>
                    <h3 style={{margin: '0 0 0.5rem 0', color: '#1f2937'}}>Quiz Attempt #{quizHistory.length - index}</h3>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      {new Date(attempt.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#0d9488'}}>
                      {attempt.score}/{attempt.max_score}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      {Math.round((attempt.score / attempt.max_score) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: RESULTS VIEW
  // ==========================================
  if (view === 'results' && results) {
    if (!results.graded_questions || !Array.isArray(results.graded_questions)) {
      return (
        <div className="upload-card" style={{textAlign: 'center'}}>
          <h2 style={{color: '#dc2626'}}>Grading Error</h2>
          <p>The AI could not format the grading results properly.</p>
          <button onClick={resetToQuizSetup} className="btn" style={{marginTop: '1rem'}}>Try Again</button>
        </div>
      );
    }

    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: '#0d9488'}}>📊 Quiz Results</h2>
          <button onClick={resetToSessions} style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem'}}>
            ← Back to Sessions
          </button>
        </div>

        <div className="results-header">
          <p style={{margin: 0, fontSize: '1.2rem'}}>Your Total Score</p>
          <h1 className="results-score">{results.total_score} <span className="results-max">/ {results.max_score}</span></h1>
          <p style={{margin: '0.5rem 0 0 0'}}>{Math.round((results.total_score / results.max_score) * 100)}%</p>
        </div>

        {results.graded_questions.map((q) => {
          const originalQ = questions.find(orig => orig.id === q.id);
          if (!originalQ) return null;

          return (
            <div key={q.id} className="quiz-question-card">
              <div className="quiz-q-header">
                <span className="quiz-q-type">{originalQ.type.toUpperCase()}</span>
                <span className="quiz-q-marks">{q.awarded_marks} / {originalQ.marks} marks</span>
              </div>
              <div className="quiz-q-text">{originalQ.question}</div>
              
              {originalQ.type === 'mcq' && (
                <div style={{color: '#4b5563', marginBottom: '1rem'}}>
                  <strong>Your answer:</strong> {originalQ.options[userAnswers[q.id]] || "Skipped"}
                </div>
              )}
              {(originalQ.type === 'short' || originalQ.type === 'long') && (
                <div style={{color: '#4b5563', marginBottom: '1rem', whiteSpace: 'pre-wrap'}}>
                  <strong>Your answer:</strong><br/>{userAnswers[q.id] || "Skipped"}
                </div>
              )}

              <div className={`feedback-box ${q.is_correct ? 'correct' : 'incorrect'}`}>
                <strong>{q.is_correct ? '✅ Correct!' : '❌ Incorrect'}</strong>
                {q.feedback}
                
                {/* Show the correct answer for wrong/missing answers */}
                {!q.is_correct && originalQ.model_answer && (
                  <div style={{marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b'}}>
                    <strong style={{color: '#92400e'}}>📖 Correct Answer:</strong>
                    <div style={{color: '#78350f', marginTop: '0.25rem'}}>{originalQ.model_answer}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
          <button onClick={resetToQuizSetup} className="btn" style={{flex: 1}}>Generate Another Quiz</button>
          <button onClick={resetToSessions} className="btn" style={{flex: 1, background: '#6b7280'}}>Back to Sessions</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TAKING QUIZ VIEW
  // ==========================================
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2 style={{margin: 0, color: '#0d9488'}}>Taking Quiz</h2>
        <button onClick={resetToQuizSetup} style={{background: 'none', border: '1px solid #dc2626', color: '#dc2626', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer'}}>
          Cancel
        </button>
      </div>

      <div style={{background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #16a34a'}}>
        <strong style={{color: '#166534'}}>📖 Document:</strong> {currentSession?.title}
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className="quiz-question-card">
          <div className="quiz-q-header">
            <span className="quiz-q-type">Question {index + 1} ({q.type})</span>
            <span className="quiz-q-marks">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          </div>
          <div className="quiz-q-text">{q.question}</div>

          {q.type === 'mcq' && q.options && q.options.map((opt, optIdx) => (
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
        style={{marginTop: '1rem', padding: '1rem', width: '100%'}}
      >
        {loading ? 'AI is Grading...' : 'Submit & Grade Quiz'}
      </button>
    </div>
  );
}