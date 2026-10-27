import { useState } from 'react';

const helpContent = {
  chat: {
    title: "🤖 AI Tutor",
    text: "1. Use the search bar at the top to find a textbook, your notes, or a past paper.\n2. Select it from the dropdown to 'attach' it to the chat.\n3. Ask questions! The AI will answer using that specific document.\n4. Use the 'History' button to view past conversations."
  },
  library: {
    title: "📚 Public Library",
    text: "Browse textbooks uploaded by your admin.\n1. Use the search bar to find a specific subject.\n2. Use the dropdown to filter by Grade.\n3. Click 'Read' to open the secure PDF reader with translation tools."
  },
  pastpapers: {
    title: " Past Papers Hub",
    text: "Find and practice with past exam papers.\n1. Search by subject, university name, or module code.\n2. Filter by High School/University and Year.\n3. Click 'Ask AI Tutor' to instantly upload that paper to your chat for help!"
  },
  tools: {
    title: "🛠️ Study Tools",
    text: "Generate quizzes and flashcards from your uploaded documents.\n1. Select a book from your 'My Documents'.\n2. Choose the number of questions.\n3. The AI will grade your answers and give detailed feedback!"
  },
  upload: {
    title: "️ Upload Documents",
    text: "Upload your own PDFs or PowerPoint slides.\n1. Fill in the details (Title, Grade, Subject).\n2. If you select 'Past Paper (Public)', it will be shared with everyone!\n3. Otherwise, it stays private in your 'My Documents'."
  },
  admin: {
    title: "🛡️ Admin Dashboard",
    text: "Manage the public library and past papers.\n1. Toggle between 'Textbook' and 'Past Paper' modes.\n2. Fill in the specific details for the document.\n3. Click 'Publish' to make it available to all students."
  }
};

export default function HelpButton({ activeTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent[activeTab] || { title: "Help", text: "Select a tab to see instructions." };

  return (
    <>
      {/* Floating Button (Always visible, cannot be removed) */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '90px', right: '20px', // Above the bottom nav
          width: '50px', height: '50px', borderRadius: '50%',
          background: '#0d9488', color: 'white', border: 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', zIndex: 1000
        }}
        title="How to use this tab"
      >
        ?
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001, padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            style={{
              background: 'white', borderRadius: '1rem', padding: '2rem',
              maxWidth: '400px', width: '100%', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginTop: 0, color: '#0d9488' }}>{content.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#4b5563' }}>{content.text}</p>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                border: 'none', background: '#0d9488', color: 'white',
                fontWeight: 600, cursor: 'pointer', marginTop: '1rem'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}