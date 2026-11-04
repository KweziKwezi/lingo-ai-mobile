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
    <div className="st-page">
      {/* Header */}
      <header className="st-header">
        <h1 className="st-title">Quiz Generator</h1>
        <p className="st-subtitle">Create custom quizzes from your documents instantly.</p>
      </header>

      {/* Upload Card */}
      <section className="st-card">
        <h3 className="st-card-title"><span className="st-card-icon">📤</span> Upload New Document</h3>

        <div className="st-grid-2">
          <input
            id="st-upload-title"
            className="st-input"
            type="text"
            placeholder="Document title (e.g., Biology Ch1)"
            aria-label="Document title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
          />
          <input
            id="st-upload-subject"
            className="st-input"
            type="text"
            placeholder="Subject (optional)"
            aria-label="Subject"
            value={uploadSubject}
            onChange={(e) => setUploadSubject(e.target.value)}
          />
        </div>

        <div className="st-actions">
          <div style={{ position: 'relative', display: 'flex' }}>
            <input
              className="st-file-input"
              type="file"
              id="st-file-upload"
              accept=".pdf,.pptx"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
            <label htmlFor="st-file-upload" className="st-btn st-btn--secondary st-btn--block">
              <span className="st-file-name">{uploadFile ? uploadFile.name : 'Choose file'}</span>
            </label>
          </div>

          <button
            className="st-btn st-btn--primary"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & select'}
          </button>
        </div>
      </section>

      {/* Quiz Settings Card */}
      <section className="st-card">
        <h3 className="st-card-title"><span className="st-card-icon">⚙️</span> Quiz Settings</h3>

        <div className="st-field">
          <div className="st-label-row">
            <label className="st-label" htmlFor="st-doc-select">Select document</label>
          </div>
          <select
            id="st-doc-select"
            className="st-select"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
          >
            <option value="">Choose a document...</option>
            {books.map(book => <option key={book.id} value={book.id}>{book.label || book.title}</option>)}
          </select>
        </div>

        <div className="st-field" style={{ marginBottom: 0 }}>
          <div className="st-label-row">
            <label className="st-label" htmlFor="st-num-questions">Number of questions</label>
            <span className="st-value">{numQuestions}</span>
          </div>
          <input
            id="st-num-questions"
            className="st-range"
            type="range"
            min="1"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </div>

        <button
          className="st-btn st-btn--success st-btn--block st-btn--lg st-generate"
          onClick={generateQuiz}
          disabled={loading || !selectedBookId}
        >
          {loading ? 'Generating...' : '🎯 Generate quiz'}
        </button>
      </section>

      {/* Quiz Display */}
      {quiz && !graded && (
        <section className="st-card">
          <h3 className="st-card-title"><span className="st-card-icon">📝</span> Your Quiz</h3>
          {quiz.map((q, index) => (
            <div key={q.id || index} className="st-question">
              <h4 className="st-question-text">{index + 1}. {q.question}</h4>
              <div className="st-options">
                {q.options?.map((opt, i) => (
                  <label key={i} className="st-option">
                    <input
                      type="radio"
                      name={`q-${index}`}
                      value={opt}
                      onChange={() => setAnswers({ ...answers, [q.id || index]: opt })}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            className="st-btn st-btn--secondary st-btn--block st-btn--lg"
            onClick={submitQuiz}
            disabled={loading}
          >
            {loading ? 'Grading...' : 'Submit & grade quiz'}
          </button>
        </section>
      )}

      {/* Graded Results */}
      {graded && (
        <section className="st-card">
          <div className="st-score">
            <h2 className="st-score-value">Score: {score}</h2>
            <p className="st-score-note">Review your answers below.</p>
          </div>

          {quiz.map((q, index) => {
            const given = answers[q.id || index];
            const isCorrect = given === q.correct_answer;
            return (
              <div key={q.id || index} className="st-result">
                <h4 className="st-question-text">{index + 1}. {q.question}</h4>

                <div className="st-answer st-answer--correct">
                  <span className="st-badge">Correct</span>
                  <span>{q.correct_answer}</span>
                </div>
                <div className={`st-answer ${isCorrect ? 'st-answer--correct' : 'st-answer--wrong'}`}>
                  <span className="st-badge">Your answer</span>
                  <span>{given || 'No answer'}</span>
                </div>

                <button className="st-btn st-btn--secondary st-btn--sm" onClick={() => askAi(q)}>
                  🤖 Ask AI to explain
                </button>
              </div>
            );
          })}

          <button
            className="st-btn st-btn--muted st-btn--block st-reset"
            onClick={() => { setGraded(false); setQuiz(null); }}
          >
            Generate new quiz
          </button>
        </section>
      )}

      {/* AI Chat Modal */}
      {showAiChat && activeQuestion && (
        <div className="st-modal-backdrop" role="dialog" aria-modal="true" aria-label="AI tutor explanation">
          <div className="st-modal">
            <div className="st-modal-head">
              <h3 className="st-modal-title">AI tutor explanation</h3>
              <button className="st-modal-close" onClick={() => setShowAiChat(false)} aria-label="Close">×</button>
            </div>

            {aiResponse && <div className="st-modal-response">{aiResponse}</div>}

            <div className="st-modal-row">
              <input
                className="st-input"
                type="text"
                placeholder="Ask why the answer is correct..."
                aria-label="Your question for the AI tutor"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAi()}
              />
              <button className="st-btn st-btn--primary" onClick={sendAi} disabled={aiLoading}>
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
