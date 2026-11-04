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

  // Fetch all available documents (Private uploads + Public Library)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const [myBooks, publicBooks] = await Promise.all([
          bookService.getBooks(),
          libraryService.getPublicLibrary()
        ]);
        // Combine them and add a type label for the dropdown
        const allDocs = [
          ...(myBooks || []).map(b => ({ ...b, label: `📁 My Upload: ${b.title}` })),
          ...(publicBooks || []).map(b => ({ ...b, label: `📚 Public Library: ${b.title}` }))
        ];
        setBooks(allDocs);
      } catch (err) {
        console.error("Failed to fetch books", err);
      }
    };
    fetchBooks();
  }, []);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) return alert("Please select a file and enter a title.");
    setUploading(true);
    try {
      // Upload the file (defaults to 'textbook' type)
      const newBook = await bookService.uploadFile(uploadFile, uploadTitle, '12', uploadSubject || 'General', 'textbook');
      alert("Upload successful! Generating quiz...");
      
      // Refresh books and auto-select the new one
      const [myBooks, publicBooks] = await Promise.all([bookService.getBooks(), libraryService.getPublicLibrary()]);
      const allDocs = [...(myBooks || []), ...(publicBooks || [])];
      setBooks(allDocs);
      setSelectedBookId(newBook.id);
      
      // Clear upload form
      setUploadFile(null);
      setUploadTitle('');
      setUploadSubject('');
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const generateQuiz = async () => {
    if (!selectedBookId) return alert("Please select or upload a document first.");
    setLoading(true);
    setGraded(false);
    setQuiz(null);
    setAnswers({});
    try {
      const data = await tutorService.generateQuiz(selectedBookId, numQuestions);
      setQuiz(data.questions || data); // Adjust based on your backend response structure
    } catch (err) {
      alert("Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const data = await tutorService.gradeQuiz(quiz, answers);
      setScore(data.score);
      setGraded(true);
    } catch (err) {
      alert("Failed to grade quiz.");
    } finally {
      setLoading(false);
    }
  };

  const askAiAboutQuestion = (questionObj) => {
    setActiveQuestion(questionObj);
    setShowAiChat(true);
    setAiResponse('');
    setAiQuestion('');
  };

  const sendAiQuestion = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      // Craft a specific prompt for the AI to explain the mistake
      const prompt = `The student is asking about this quiz question: "${activeQuestion.question}". 
      The correct answer is: "${activeQuestion.correct_answer}". 
      The student answered: "${answers[activeQuestion.id] || 'No answer'}". 
      Student's question: "${aiQuestion}". 
      Please explain clearly why the correct answer is right and why the student's answer was wrong (if applicable).`;
      
      const response = await tutorService.askQuestion(prompt, 'English', selectedBookId, null, null);
      setAiResponse(response.answer);
    } catch (err) {
      setAiResponse("Sorry, I couldn't process that.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Quiz Generator</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Upload a document or select an existing one to generate a custom quiz.</p>

      {/* Upload Section */}
      <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #e9ecef' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>📤 Upload a New Document for this Quiz</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" placeholder="Document Title (e.g., Biology Notes Ch1)" 
            value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
            style={{ flex: 2, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
          />
          <input 
            type="text" placeholder="Subject (Optional)" 
            value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
          />
          <input 
            type="file" accept=".pdf,.pptx" 
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={{ flex: 1, padding: '0.4rem' }}
          />
          <button 
            onClick={handleUpload} disabled={uploading}
            style={{ padding: '0.6rem 1rem', background: uploading ? '#9ca3af' : '#4f46e5', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Quiz Settings */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Select a Document</label>
        <select 
          value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc', marginBottom: '1rem', fontSize: '1rem' }}
        >
          <option value="">Choose a book or your uploaded doc...</option>
          {books.map(book => (
            <option key={book.id} value={book.id}>{book.label || book.title}</option>
          ))}
        </select>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Number of Questions: {numQuestions}</label>
        <input 
          type="range" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}
          style={{ width: '100%', marginBottom: '1.5rem' }}
        />

        <button 
          onClick={generateQuiz} disabled={loading || !selectedBookId}
          style={{ width: '100%', padding: '1rem', background: loading ? '#9ca3af' : '#10b981', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
        >
          {loading ? 'Generating...' : '🎯 Generate Quiz'}
        </button>
      </div>

      {/* Quiz Display */}
      {quiz && !graded && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{index + 1}. {q.question}</h3>
              {q.options?.map((opt, i) => (
                <label key={i} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" name={`q-${index}`} value={opt} 
                    onChange={() => setAnswers({...answers, [q.id || index]: opt})}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}
          <button 
            onClick={submitQuiz} disabled={loading}
            style={{ width: '100%', padding: '1rem', background: '#4f46e5', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Grading...' : 'Submit & Grade Quiz'}
          </button>
        </div>
      )}

      {/* Graded Results with "Ask AI" */}
      {graded && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ textAlign: 'center', color: '#10b981' }}>You scored {score}!</h2>
          {quiz.map((q, index) => (
            <div key={q.id || index} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>{index + 1}. {q.question}</h4>
              <p style={{ color: 'green', fontWeight: 600 }}>✅ Correct Answer: {q.correct_answer}</p>
              <p style={{ color: answers[q.id || index] === q.correct_answer ? 'green' : 'red', fontWeight: 600 }}>
                Your Answer: {answers[q.id || index] || 'No answer'}
              </p>
              <button 
                onClick={() => askAiAboutQuestion(q)}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🤖 Ask AI to explain this question
              </button>
            </div>
          ))}
          <button 
            onClick={() => { setGraded(false); setQuiz(null); }}
            style={{ width: '100%', padding: '1rem', background: '#6b7280', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            Generate New Quiz
          </button>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && activeQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Ask AI Tutor</h3>
              <button onClick={() => setShowAiChat(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Question: {activeQuestion.question}<br/>
              Correct: {activeQuestion.correct_answer}
            </p>
            
            {aiResponse && (
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                {aiResponse}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" placeholder="e.g., Why is B wrong?" 
                value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
                onKeyDown={(e) => e.key === 'Enter' && sendAiQuestion()}
              />
              <button 
                onClick={sendAiQuestion} disabled={aiLoading}
                style={{ padding: '0.75rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
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