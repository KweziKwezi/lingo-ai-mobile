import { useState } from 'react';

const helpContent = {
  chat: {
    title: " AI Tutor",
    icon: "",
    text: "1. Use the search bar at the top to find a textbook, your notes, or a past paper.\n2. Select it from the dropdown to attach it to the chat.\n3. Ask questions! The AI will answer using that specific document.\n4. Use the 'History' button to view past conversations.\n5. Try saying 'Load the math textbook' and the AI will automatically select it for you!"
  },
  library: {
    title: "📚 Public Library",
    icon: "📖",
    text: "Browse textbooks uploaded by your institution.\n1. Use the search bar to find a specific subject or title.\n2. Use the dropdown to filter by Grade level.\n3. Click on any book card to open the secure PDF reader.\n4. Use the translation feature to translate pages into your language."
  },
  pastpapers: {
    title: "📝 Past Papers Hub",
    icon: "📄",
    text: "Find and practice with past exam papers.\n1. Search by subject, university name, or module code.\n2. Filter by High School/University and Year.\n3. Click 'View & Translate' to read the paper with translation tools.\n4. Click 'Ask AI Tutor' to instantly upload that paper to your chat for help!\n5. Download PDFs to study offline."
  },
  tools: {
    title: "🛠️ Study Tools",
    icon: "🎯",
    text: "Generate AI-powered quizzes from your documents.\n1. Select a book from your 'My Documents' dropdown.\n2. Choose how many questions you want (3-15).\n3. Click 'Generate Quiz' and the AI will create unique questions.\n4. Answer the questions and submit.\n5. Get instant grading with detailed feedback!"
  },
  upload: {
    title: "📤 Upload Documents",
    icon: "⬆️",
    text: "Upload your own PDFs or PowerPoint slides.\n1. Fill in the details (Title, Grade, Subject).\n2. Choose the document type (Textbook, Slides, or Notes).\n3. Click the upload area to select your file.\n4. Click 'Upload Document' to process it.\n5. If you select 'Past Paper (Public)', it will be shared with everyone!"
  },
  admin: {
    title: "🛡️ Admin Dashboard",
    icon: "🔐",
    text: "Manage the public library and past papers.\n1. Toggle between 'Textbook' and 'Past Paper' modes.\n2. Fill in the specific details for the document.\n3. For past papers, specify if it's High School or University level.\n4. Click 'Publish' to make it available to all students.\n5. Use the trash icon to delete unwanted documents."
  }
};

export default function HelpButton({ activeTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent[activeTab] || { 
    title: "How to Use", 
    icon: "❓",
    text: "Select a tab to see specific instructions for that feature." 
  };

  return (
    <>
      {/* Floating Help Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: 'white',
          border: 'none',
          boxShadow: '0 6px 20px rgba(15, 118, 110, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(15, 118, 110, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 118, 110, 0.4)';
        }}
        title="Need help?"
      >
        ?
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card fade-in"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: 'none',
              position: 'relative',
              background: 'white'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              ✕
            </button>

            {/* Icon */}
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(99, 102, 241, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1.25rem',
              margin: '0 auto'
            }}>
              {content.icon}
            </div>

            {/* Title */}
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '1rem',
              fontSize: '1.75rem',
              fontWeight: 800,
              textAlign: 'center',
              color: 'var(--text-main)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {content.title}
            </h3>

            {/* Content */}
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.8, 
              color: 'var(--text-muted)',
              fontSize: '1rem',
              marginBottom: '1.75rem',
              padding: '1.25rem',
              background: 'rgba(15, 118, 110, 0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}>
              {content.text}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700
              }}
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}