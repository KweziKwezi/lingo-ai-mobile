import { useState, useEffect } from 'react';
import { bookService, tutorService } from '../services/api';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [language, setLanguage] = useState('isiZulu');

  useEffect(() => {
    bookService.getBooks().then(setBooks).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setLoading(true);
    try {
      const response = await tutorService.askQuestion(input, language, selectedBook || null);
      setMessages((prev) => [...prev, { role: 'ai', text: response.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error: ' + (err.response?.data?.detail || err.message) }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="chat-controls" style={{height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column'}}>
      <div className="chat-controls" style={{flexShrink: 0}}>
        <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="select">
          <option value="">General Knowledge (Any Book)</option>
          {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select">
          <option>English</option><option>isiZulu</option><option>isiXhosa</option>
          <option>Afrikaans</option><option>Sesotho</option><option>Setswana</option>
        </select>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {loading && <div className="message-row ai"><div className="message-bubble ai">Thinking...</div></div>}
      </div>

      <div className="chat-input-area">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask a question..." className="input" disabled={loading} />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn send-btn">Send</button>
      </div>
    </div>
  );
}