import { useState } from 'react';
import ChatScreen from './ChatScreen';
import UploadScreen from './UploadScreen';
import StudyTools from './StudyTools';
import AdminDashboard from './AdminDashboard';
import PastPapersScreen from './PastPapersScreen'; // Ensure this is imported if you have it

export default function MainApp({ onLogout, isAdmin }) { // <-- Add isAdmin here
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app-root">
      <header className="main-header">
        <h1>Lingo AI</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <main className="main-content">
        {activeTab === 'chat' ? <ChatScreen /> :
         activeTab === 'tools' ? <StudyTools /> :
         activeTab === 'upload' ? <UploadScreen /> :
         activeTab === 'pastpapers' ? <PastPapersScreen /> :
         activeTab === 'admin' && isAdmin ? <AdminDashboard /> : null} {/* Only show if admin */}
      </main>

      <nav className="bottom-nav">
        <button onClick={() => setActiveTab('chat')} className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          AI Tutor
        </button>
        <button onClick={() => setActiveTab('tools')} className={`nav-btn ${activeTab === 'tools' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          Study Tools
        </button>
        <button onClick={() => setActiveTab('pastpapers')} className={`nav-btn ${activeTab === 'pastpapers' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Past Papers
        </button>
        <button onClick={() => setActiveTab('upload')} className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}>
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          Upload
        </button>
        
        {/* ONLY SHOW ADMIN TAB IF isAdmin IS TRUE */}
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Admin
          </button>
        )}
      </nav>
    </div>
  );
}