import { useState } from 'react';
import { bookService } from '../services/api';

export default function UploadScreen() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('textbook');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (ext === 'pdf' || ext === 'pptx') { setFile(selectedFile); setMessage(''); }
      else { setMessage('❌ Only PDF and PPTX files are allowed'); setFile(null); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !grade || !subject) { setMessage('❌ Please fill all fields and select a file'); return; }
    setLoading(true); setMessage('');
    try {
      await bookService.uploadFile(file, title, grade, subject, type);
      setMessage('✅ Successfully uploaded! AI is processing your file...');
      setFile(null); setTitle(''); setGrade(''); setSubject('');
    } catch (err) { setMessage('❌ ' + (err.response?.data?.detail || 'Upload failed')); }
    finally { setLoading(false); }
  };

  return (
    <div className="upload-card">
      <h2 className="upload-title">Upload Study Material</h2>
      <form onSubmit={handleSubmit}>
        <div className="file-drop">
          <input type="file" accept=".pdf,.pptx" onChange={handleFileChange} style={{display: 'none'}} id="file-upload" />
          <label htmlFor="file-upload" style={{cursor: 'pointer'}}>
            <svg width="48" height="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p style={{color: '#4b5563', marginTop: '0.5rem'}}>{file ? file.name : 'Click to select file'}</p>
          </label>
        </div>

        <input type="text" placeholder="Title (e.g., Grade 10 Mathematics)" value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
        
        <div className="form-row">
          <input type="text" placeholder="Grade (e.g., 10)" value={grade} onChange={(e) => setGrade(e.target.value)} className="input" required />
          <select value={type} onChange={(e) => setType(e.target.value)} className="select">
            <option value="textbook">Textbook</option>
            <option value="slides">Class Slides</option>
            <option value="notes">Notes</option>
            <option value="past_paper">Past Paper (Public)</option>
          </select>
        </div>

        <input type="text" placeholder="Subject (e.g., Mathematics)" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" required />

        {message && <div className={`status-msg ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</div>}

        <button type="submit" disabled={loading} className="btn">{loading ? 'Uploading...' : 'Upload to AI Library'}</button>
      </form>
    </div>
  );
}