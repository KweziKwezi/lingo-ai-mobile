import { useState, useEffect } from 'react';
import { bookService, tutorService } from '../services/api';

export default function StudyTools() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await bookService.getBooks();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  const generateQuiz = async () => {
    if (!selectedBook) return;
    setLoading(true);
    setQuiz(null);
    setResults(null);
    setUserAnswers({});

    try {
      const res = await tutorService.generateQuiz(selectedBook.id, numQuestions);
      setQuiz(res.questions);
    } catch (err) {
      alert('Failed to generate quiz: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await tutorService.gradeQuiz(quiz, userAnswers);
      setResults(res);
    } catch (err) {
      alert('Failed to grade quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Study Tools</h2>
        <p style={{ color: 'var(--text-muted)' }}>Generate AI-powered quizzes from your documents.</p>
      </div>

      {!quiz ? (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Select a Document</label>
            <select
              value={selectedBook?.id || ''}
              onChange={(e) => {
                const book = books.find(b => b.id === parseInt(e.target.value));
                setSelectedBook(book || null);
              }}
              className="input-modern"
            >
              <option value="">Choose a book...</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.subject})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Number of Questions</label>
            <input
              type="range"
              min="3"
              max="15"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>
              {numQuestions} Questions
            </div>
          </div>

          <button
            onClick={generateQuiz}
            disabled={!selectedBook || loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            {loading ? 'Generating Quiz...' : '🎯 Generate Quiz'}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {!results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {quiz.map((q, idx) => (
                <div key={q.id} className="glass-card">
                  <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--primary)',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '28px',
                      marginRight: '0.75rem',
                      fontSize: '0.9rem'
                    }}>{idx + 1}</span>
                    {q.question}
                  </div>

                  {q.type === 'mcq' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          background: userAnswers[q.id] === optIdx ? 'rgba(15, 118, 110, 0.08)' : '#f8fafc',
                          border: userAnswers[q.id] === optIdx ? '2px solid var(--primary)' : '2px solid transparent',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={userAnswers[q.id] === optIdx}
                            onChange={() => setUserAnswers({ ...userAnswers, [q.id]: optIdx })}
                            style={{ marginRight: '0.75rem' }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(q.type === 'short' || q.type === 'long') && (
                    <textarea
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                      className="input-modern"
                      placeholder="Type your answer here..."
                      rows={4}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  )}
                </div>
              ))}

              <button
                onClick={submitQuiz}
                disabled={loading || Object.keys(userAnswers).length < quiz.length}
                className="btn-primary"
                style={{
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                {loading ? 'Grading...' : `Submit Quiz (${Object.keys(userAnswers).length}/${quiz.length})`}
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}>{results.total_score === results.max_score ? '' : results.total_score >= results.max_score * 0.7 ? '🎉' : '📚'}</div>
              
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Quiz Complete!
              </h2>
              <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                You scored <strong style={{ color: 'var(--primary)' }}>{results.total_score}</strong> out of <strong>{results.max_score}</strong>
              </p>

              <div style={{
                background: results.total_score >= results.max_score * 0.7 ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${results.total_score >= results.max_score * 0.7 ? '#86efac' : '#fecaca'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Detailed Feedback:</h3>
                {results.graded_questions.map((q, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${q.is_correct ? '#16a34a' : '#dc2626'}`
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                      Question {idx + 1}: {q.is_correct ? '✅ Correct' : '❌ Incorrect'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {q.feedback}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setQuiz(null); setResults(null); setUserAnswers({}); }}
                className="btn-primary"
                style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700 }}
              >
                Generate Another Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}