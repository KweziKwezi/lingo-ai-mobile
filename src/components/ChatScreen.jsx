import { useState, useEffect, useRef } from 'react';
import { tutorService, bookService, chatService, api, pastPaperService } from '../services/api';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [language, setLanguage] = useState('English');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allResources, setAllResources] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadResources();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadResources = async () => {
    try {
      const [publicBooks, userBooks, pastPapers] = await Promise.all([
        api.get('/library').then(res => res.data.map(b => ({...b, source: 'Public Library'}))),
        bookService.getBooks().then(res => res.map(b => ({...b, source: 'My Documents'}))),
        pastPaperService.getPastPapers().then(res => res.map(p => ({...p, source: 'Past Papers'})))
      ]);
      const combined = [...publicBooks, ...userBooks, ...pastPapers];
      const uniqueResources = combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      setAllResources(uniqueResources);
    } catch (err) { console.error('Failed to load resources:', err); }
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) { console.error(err); }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setSelectedBook(null);
    setSearchQuery('');
    setShowSidebar(false);
  };

  const handleSelectConversation = async (conv) => {
    try {
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      setCurrentConversationId(conv.id);
      setShowSidebar(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await chatService.deleteConversation(convId);
      setConversations(conversations.filter(c => c.id !== convId));
      if (currentConversationId === convId) handleNewChat();
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    console.log('📤 Sending message:', input);
    console.log(' Selected book:', selectedBook);
    console.log('🔑 Book ID:', selectedBook?.id);
    
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await tutorService.askQuestion(
        input, 
        language, 
        selectedBook?.id || null,  // Make sure we're passing the ID
        null, 
        currentConversationId
      );
      
      console.log('📥 Received response:', response);
      
      let aiText = response.answer;
      
      // Check for LOAD_BOOK tag
      const loadMatch = aiText.match(/\[LOAD_BOOK:(\d+)\]/);
      if (loadMatch) {
        const bookId = parseInt(loadMatch[1]);
        console.log('🎯 Auto-loading book ID:', bookId);
        const bookToLoad = allResources.find(b => b.id === bookId);
        if (bookToLoad) {
          setSelectedBook(bookToLoad);
          setSearchQuery(bookToLoad.title);
        }
        // Remove the tag from visible text
        aiText = aiText.replace(/\[LOAD_BOOK:\d+\]/, '').trim();
      }

      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadConversations();
      }
    } catch (err) {
      console.error(' Error:', err);
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + (err.response?.data?.detail || 'Failed to get response.') }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = allResources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', height: 'calc(100vh - 180px)', position: 'relative' }}>
      
      {/* Sidebar */}
      {showSidebar && (
        <div className="glass-card fade-in" style={{ 
          width: '300px', 
          marginRight: '1rem',
          padding: '1.25rem',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          maxHeight: '100%',
          overflow: 'hidden'
        }}>
          <button onClick={handleNewChat} className="btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>
            + New Chat
          </button>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => handleSelectConversation(conv)} 
                className="glass-card"
                style={{ 
                  padding: '0.875rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  border: currentConversationId === conv.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: currentConversationId === conv.id ? 'rgba(15, 118, 110, 0.05)' : 'white',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (currentConversationId !== conv.id) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { if (currentConversationId !== conv.id) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-main)', paddingRight: '1.5rem' }}>
                  {conv.title.length > 30 ? conv.title.substring(0, 30) + '...' : conv.title}
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
                    fontSize: '1.1rem',
                    padding: '0.25rem'
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
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.25rem', 
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.05), rgba(99, 102, 241, 0.05))',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="btn-secondary"
            style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
          >
            ☰ History
          </button>

          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search textbooks, notes, past papers..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="input-modern"
            />
            {showSearchResults && searchQuery && (
              <div className="glass-card fade-in" style={{ 
                position: 'absolute', 
                top: '110%', 
                left: 0, 
                right: 0, 
                background: 'white',
                maxHeight: '250px', 
                overflowY: 'auto', 
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)'
              }}>
                {filteredResources.length === 0 ? (
                  <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No results found</div>
                ) : (
                  filteredResources.map(res => (
                    <div 
                      key={res.id} 
                      onMouseDown={() => { 
                        console.log('✅ Selecting book:', res);
                        setSelectedBook(res); 
                        setSearchQuery(res.title); 
                        setShowSearchResults(false); 
                      }}
                      style={{ 
                        padding: '0.875rem 1rem', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 118, 110, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{res.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {res.source} • {res.subject || res.grade}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {selectedBook && (
              <button 
                onClick={() => { setSelectedBook(null); setSearchQuery(''); }} 
                style={{ 
                  position: 'absolute', 
                  right: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            className="input-modern"
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'white' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem', padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 700 }}>
                Hello! I'm your AI tutor.
              </h3>
              <p style={{ fontSize: '1rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                Ask me anything about your studies, or ask "How do I use this app?"
              </p>
              {selectedBook && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #f0fdfa, #eef2ff)', 
                  borderRadius: 'var(--radius-lg)',
                  display: 'inline-block'
                }}>
                  <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                    📚 Currently using: {selectedBook.title}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', 
                marginBottom: '1.5rem',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  marginRight: '0.75rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                  border: '2px solid white'
                }}>
                  AI
                </div>
              )}
              
                              <div style={{ 
                maxWidth: '80%', 
                padding: '1.25rem 2rem',  // Increased horizontal padding from 1.5rem to 2rem
                borderRadius: msg.role === 'user' ? '1.5rem 1.5rem 0.5rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.5rem', 
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'white', 
                color: msg.role === 'user' ? 'white' : 'var(--text-main)', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: 1.7, 
                fontSize: '1rem',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(15, 118, 110, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none'
              }}>
                {msg.content}
              </div>

              {msg.role === 'user' && <div style={{ width: '40px', flexShrink: 0 }} />}
            </div>
          ))}
          
          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-light)',
                borderTop: '3px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '1.25rem', 
          borderTop: '1px solid var(--border-light)', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center' 
        }}>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder="Ask your tutor a question..." 
            disabled={loading} 
            className="input-modern"
            style={{ flex: 1 }}
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()} 
            className="btn-primary"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}