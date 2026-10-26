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
  
  // Search states
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
      // Fetch Public Library, User's Books, and Past Papers
      const [publicBooks, userBooks, pastPapers] = await Promise.all([
        api.get('/library').then(res => res.data.map(b => ({...b, source: 'Public Library'}))),
        bookService.getBooks().then(res => res.map(b => ({...b, source: 'My Documents'}))),
        pastPaperService.getPastPapers().then(res => res.map(p => ({...p, source: 'Past Papers'})))
      ]);
      
      // Combine and remove duplicates based on ID
      const combined = [...publicBooks, ...userBooks, ...pastPapers];
      const uniqueResources = combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      setAllResources(uniqueResources);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
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
      setMessages([...newMessages, { role: 'assistant', content: response.answer }]);
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

  // Filter resources based on search query
  const filteredResources = allResources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', position: 'relative', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar (Chat History) */}
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

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Header with Search & Language */}
        <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>☰ History</button>

          {/* Search Bar */}
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search textbooks, notes, past papers..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} // Delay to allow clicks
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
              <button onClick={() => { setSelectedBook(null); setSearchQuery(''); }} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            )}
          </div>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '140px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}>
            <option>English</option><option>isiZulu</option><option>isiXhosa</option><option>Afrikaans</option><option>Sesotho</option><option>Setswana</option>
          </select>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#ffffff' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4b5563' }}>👋 Hello! I'm your AI tutor.</h3>
              <p>Search for a book above to chat about it, or ask me anything!</p>
              {selectedBook && <p style={{ marginTop: '1rem', color: '#0d9488', fontWeight: 600 }}> Currently using: {selectedBook.title}</p>}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
              <div style={{ maxWidth: '75%', padding: '0.875rem 1.25rem', borderRadius: '1rem', background: msg.role === 'user' ? '#0d9488' : '#f3f4f6', color: msg.role === 'user' ? 'white' : '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.5, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}><p>Thinking...</p></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask your tutor a question..." disabled={loading} style={{ flex: 1, minWidth: '100px', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }} />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600, width: 'auto', flexShrink: 0 }}>Send</button>
        </div>
      </div>
    </div>
  );
}