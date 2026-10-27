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
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await tutorService.askQuestion(
        input, language, selectedBook?.id || null, null, currentConversationId
      );
      
      let aiText = response.answer;
      
      // MAGIC: Check if AI wants to auto-load a book
      const loadMatch = aiText.match(/\[LOAD_BOOK:(\d+)\]/);
      if (loadMatch) {
        const bookId = parseInt(loadMatch[1]);
        const bookToLoad = allResources.find(b => b.id === bookId);
        if (bookToLoad) {
          setSelectedBook(bookToLoad);
          setSearchQuery(bookToLoad.title); // Update search bar to show it's loaded
        }
        // Remove the secret tag from the visible text
        aiText = aiText.replace(/\[LOAD_BOOK:\d+\]/, '').trim();
      }

      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        loadConversations();
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + (err.response?.data?.detail || 'Failed to get response.') }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = allResources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', position: 'relative', fontFamily: 'sans-serif' }}>
      
      {showSidebar && (
        <div style={{ width: '280px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: '1rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={handleNewChat} style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', cursor: 'pointer', fontWeight: 600, width: '100%', marginBottom: '1rem' }}>+ New Chat</button>
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => handleSelectConversation(conv)} style={{ background: currentConversationId === conv.id ? '#ccfbf1' : 'white', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid #e5e7eb', position: 'relative' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', paddingRight: '1.5rem', color: '#1f2937' }}>{conv.title}</div>
              <button onClick={(e) => handleDeleteConversation(conv.id, e)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>☰ History</button>

          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search textbooks, notes, past papers..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
            {showSearchResults && searchQuery && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {filteredResources.length === 0 ? (
                  <div style={{ padding: '0.5rem', color: '#6b7280' }}>No results found</div>
                ) : (
                  filteredResources.map(res => (
                    <div 
                      key={res.id} 
                      onMouseDown={() => { setSelectedBook(res); setSearchQuery(res.title); setShowSearchResults(false); }}
                      style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{res.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{res.source} • {res.subject || res.grade}</div>
                    </div>
                  ))
                )}
              </div>
            )}
            {selectedBook && (
              <button onClick={() => { setSelectedBook(null); setSearchQuery(''); }} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}></button>
            )}
          </div>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '140px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}>
            <option>English</option><option>isiZulu</option><option>isiXhosa</option><option>Afrikaans</option><option>Sesotho</option><option>Setswana</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#ffffff' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4b5563' }}>👋 Hello! I'm your AI tutor.</h3>
              <p>Ask me anything about your studies, or ask "How do I use this app?"</p>
              {selectedBook && <p style={{ marginTop: '1rem', color: '#0d9488', fontWeight: 600 }}> Currently using: {selectedBook.title}</p>}
            </div>
          )}
                    {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', 
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #0d9488, #8b5cf6)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', marginRight: '0.75rem', flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)'
                }}>AI</div>
              )}
              
              <div style={{ 
                maxWidth: '75%', 
                padding: '1rem 1.25rem', 
                borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem', 
                background: msg.role === 'user' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'white', 
                color: msg.role === 'user' ? 'white' : '#1f2937', 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.6, 
                fontSize: '0.95rem',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(13, 148, 136, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                border: msg.role === 'assistant' ? '1px solid #f1f5f9' : 'none'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}><p>Thinking...</p></div>}
          <div ref={messagesEndRef} />
        </div>

                <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder="Ask your tutor..." 
            disabled={loading} 
            style={{ 
              flex: 1, padding: '0.875rem 1.25rem', borderRadius: '999px', 
              border: '1px solid #e2e8f0', background: '#f8fafc',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', outline: 'none',
              transition: 'all 0.2s'
            }} 
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()} 
            style={{ 
              background: 'linear-gradient(135deg, #0d9488, #8b5cf6)', 
              color: 'white', border: 'none', borderRadius: '50%', 
              width: '48px', height: '48px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}