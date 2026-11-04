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

  // Inline explanation states
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});

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
    setLoading(true); setGraded(false); setQuiz(null); setAnswers({}); setExplanations({});
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

  const getExplanation = async (q, index) => {
    const qId = q.id || index;
    
    // Toggle off if already open
    if (explanations[qId]) {
      const newExplanations = { ...explanations };
      delete newExplanations[qId];
      setExplanations(newExplanations);
      return;
    }

    setExplainingId(qId);
    try {
      const correctAnswer = q.correct_answer || q.answer || 'Not provided';
      const given = answers[qId] || 'No answer provided';
      
      const prompt = `The student got this question wrong or wants an explanation. 
Question: "${q.question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${given}"

Please provide a clear, encouraging, and concise explanation of:
1. Why the student's answer is incorrect (or what they missed).
2. Why the correct answer is the right one, referencing the document context if possible.
Keep it under 3-4 sentences.`;

      const res = await tutorService.askQuestion(prompt, 'English', selectedBookId, null, null);
      const aiText = res.answer || res.message || (typeof res === 'string' ? res : 'Could not generate explanation.');
      
      setExplanations(prev => ({ ...prev, [qId]: aiText }));
    } catch (err) {
      console.error("Explanation error:", err);
      setExplanations(prev => ({ ...prev, [qId]: "Sorry, I couldn't generate an explanation right now. Please try again." }));
    } finally {
      setExplainingId(null);
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
            const qId = q.id || index;
            const currentAnswer = answers[qId];
            return (
              <div key={qId} className="st-question">
                <h4 className="st-question-text">{index + 1}. {q.question}</h4>
                
                {q.options && q.options.length > 0 ? (
                  <div className="st-options">
                    {q.options.map((opt, i) => {
                      const isChecked = currentAnswer === opt;
                      return (
                        <label key={i} className={`st-option ${isChecked ? 'st-option--selected' : ''}`}>
                          <input
                            type="radio"
                            name={`question-${qId}`}
                            value={opt}
                            checked={isChecked}
                            onChange={() => setAnswers({ ...answers, [qId]: opt })}
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
                      onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
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
            const qId = q.id || index;
            const given = answers[qId];
            const correctAnswer = q.correct_answer || q.answer || 'Not provided';
            const isCorrect = given === correctAnswer;

            return (
              <div key={qId} className="st-result">
                <h4 className="st-question-text">{index + 1}. {q.question}</h4>

                <div className={`st-answer ${isCorrect ? 'st-answer--correct' : 'st-answer--wrong'}`}>
                  <span className="st-badge">{isCorrect ? 'Your Answer' : 'Your Answer (Incorrect)'}</span>
                  <span>{given || 'No answer'}</span>
                </div>

                {!isCorrect && (
                  <div className="st-answer st-answer--correct">
                    <span className="st-badge">Correct Answer</span>
                    <span>{correctAnswer}</span>
                  </div>
                )}

                <button 
                  className="st-btn st-btn--secondary st-btn--sm" 
                  onClick={() => getExplanation(q, index)}
                  disabled={explainingId === qId}
                  style={{ marginTop: '12px' }}
                >
                  {explainingId === qId ? '⏳ Thinking...' : (explanations[qId] ? '❌ Hide Explanation' : '💡 Explain my mistake')}
                </button>

                {explanations[qId] && (
                  <div className="st-explanation">
                    {explanations[qId]}
                  </div>
                )}
              </div>
            );
          })}

          <button
            className="st-btn st-btn--muted st-btn--block st-reset"
            onClick={() => { setGraded(false); setQuiz(null); setExplanations({}); }}
          >
            Generate new quiz
          </button>
        </section>
      )}
    </div>
  );
}