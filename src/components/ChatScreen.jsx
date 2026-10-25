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

      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadConversations();
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
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', position: 'relative', fontFamily: 'sans-serif' }}>
      
      {/* Chat History Sidebar */}
      {showSidebar && (
        <div style={{
          width: '280px',
          background: '#f9fafb',
          borderRight: '1px solid #e5e7eb',
          padding: '1rem',
          overflowY: 'auto',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <button
            onClick={handleNewChat}
            style={{ 
              background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', 
              padding: '0.75rem', cursor: 'pointer', fontWeight: 600, width: '100%', marginBottom: '1rem' 
            }}
          >
            + New Chat
          </button>

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
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', paddingRight: '1.5rem', color: '#1f2937' }}>
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
                  position: 'absolute', top: '0.5rem', right: '0.5rem',
                  background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem'
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem',
              padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'
            }}
          >
            ☰ History
          </button>

          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            style={{ flex: 1, minWidth: '150px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          >
            <option value="">General Knowledge</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title}</option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: '140px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          >
            <option>English</option>
            <option>isiZulu</option>
            <option>isiXhosa</option>
            <option>Afrikaans</option>
            <option>Sesotho</option>
            <option>Setswana</option>
          </select>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#ffffff' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4b5563' }}>👋 Hello! I'm your AI tutor.</h3>
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
                  maxWidth: '75%',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '1rem',
                  background: msg.role === 'user' ? '#0d9488' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
              <p>Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - FORCED FLEX LAYOUT TO PREVENT SQUISHING */}
        <div style={{ 
          padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white',
          display: 'flex', gap: '0.75rem', alignItems: 'center'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your tutor a question..."
            disabled={loading}
            // CRITICAL FIX: Force width and box-sizing to override global CSS
            style={{ 
              flex: 1, 
              minWidth: '100px', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.5rem', 
              border: '1px solid #d1d5db',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            // CRITICAL FIX: Force width to auto so it doesn't stretch 100%
            style={{ 
              background: '#0d9488', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.5rem', 
              padding: '0.75rem 1.5rem', 
              cursor: 'pointer', 
              fontWeight: 600,
              width: 'auto',
              flexShrink: 0
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}