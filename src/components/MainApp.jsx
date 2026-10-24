import { useState } from 'react';
import ChatScreen from './ChatScreen';
import UploadScreen from './UploadScreen';

export default function MainApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app-root">
      <header className="main-header">
       <h1>Lingo AI</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <main className="main-content">
        {activeTab === 'chat' ? <ChatScreen /> : <UploadScreen />}
      </main>

      <nav className="bottom-nav">
        <button onClick={() => setActiveTab('chat')} className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          AI Tutor
        </button>
        <button onClick={() => setActiveTab('upload')} className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          Upload
        </button>
      </nav>
    </div>
  );
}