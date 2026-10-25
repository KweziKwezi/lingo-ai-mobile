import { useState, useEffect, useRef } from 'react';
import { tutorService, bookService, chatService } from '../services/api';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [books, setBooks] = useState([]);
  const [language, setLanguage] = useState('English');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    bookService.getBooks().then(setBooks).catch(() => {});
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowSidebar(false);
  };

  const handleSelectConversation = async (conv) => {
    try {
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs.map(m => ({
        role: m.role,
        content: m.content
      })));
      setCurrentConversationId(conv.id);
      setSelectedBook(conv.book_id || '');
      setShowSidebar(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await chatService.deleteConversation(convId);
      setConversations(conversations.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await tutorService.askQuestion(
        input,
        language,
        selectedBook || null,
        null,
        currentConversationId
      );

      const assistantMessage = { role: 'assistant', content: response.answer };
      setMessages([...newMessages, assistantMessage]);

      // If this is a new conversation, save the conversation ID
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadConversations(); // Refresh the sidebar
      }
    } catch (err) {
      console.error('Error:', err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          background: '#0d9488',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        {showSidebar ? '✕ Close' : '☰ History'}
      </button>

      {/* Chat History Sidebar */}
      {showSidebar && (
        <div style={{
          width: '300px',
          background: '#f9fafb',
          borderRight: '1px solid #e5e7eb',
          padding: '1rem',
          overflowY: 'auto',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 5
        }}>
          <button
            onClick={handleNewChat}
            className="btn"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            + New Chat
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  background: currentConversationId === conv.id ? '#ccfbf1' : 'white',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  position: 'relative'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  {conv.title}
                </div>
                {conv.book_title && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    📖 {conv.book_title}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: showSidebar ? '300px' : '0',
        transition: 'margin-left 0.3s'
      }}>
        {/* Book & Language Selector */}
        <div style={{ 
          padding: '1rem', 
          background: '#f9fafb', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="select"
            style={{ flex: 1 }}
          >
            <option value="">General Knowledge</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="select"
            style={{ width: '150px' }}
          >
            <option>English</option>
            <option>isiZulu</option>
            <option>isiXhosa</option>
            <option>Afrikaans</option>
            <option>Sesotho</option>
            <option>Setswana</option>
          </select>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
              <h3>👋 Hello! I'm your AI tutor.</h3>
              <p>Ask me anything about your textbooks or general knowledge!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  background: msg.role === 'user' ? '#0d9488' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <div className="loading-spinner"></div>
              <p>Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e5e7eb', 
          background: 'white',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your tutor a question..."
            className="input"
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}