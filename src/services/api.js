import axios from 'axios';

const API_URL = 'https://lingo-ai-backend.onrender.com';

// ADDED 'export' HERE SO OTHER FILES CAN USE IT
export const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (name, email, password) => {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const bookService = {
  getBooks: async () => {
    const response = await api.get('/books?my_books_only=true');
    return response.data;
  },
  uploadFile: async (file, title, grade, subject, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('grade', grade);
    formData.append('subject', subject);
    formData.append('type', type);

    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

export const tutorService = {
  askQuestion: async (question, language, bookId = null, chapter = null, conversationId = null) => {
    const response = await api.post('/ask', {
      question,
      language,
      book_id: bookId,
      chapter,
      conversation_id: conversationId
    });
    return response.data;
  },
  generateStudyMaterial: async (topic, language, bookId, type, numItems) => {
    const response = await api.post('/generate-study-material', {
      topic,
      language,
      book_id: bookId,
      type,
      num_items: numItems,
    });
    return response.data;
  },
  generateQuiz: async (bookId, numQuestions) => {
    const response = await api.post('/generate-quiz', {
      book_id: bookId,
      num_questions: numQuestions,
    });
    return response.data;
  },
  gradeQuiz: async (questions, userAnswers) => {
    const response = await api.post('/grade-quiz', {
      questions: questions,
      user_answers: userAnswers,
    });
    return response.data;
  }
};

export const sessionService = {
  createSession: async (bookId, title) => {
    const response = await api.post('/sessions', {
      book_id: bookId,
      title: title,
    });
    return response.data;
  },
  getSessions: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },
  getSessionHistory: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/history`);
    return response.data;
  },
  saveQuizAttempt: async (sessionId, questions, userAnswers, results, score, maxScore) => {
    const response = await api.post(`/sessions/${sessionId}/save-attempt`, {
      session_id: sessionId,
      questions: questions,
      user_answers: userAnswers,
      results: results,
      score: score,
      max_score: maxScore,
    });
    return response.data;
  }
};

export const chatService = {
  createConversation: async (bookId, title) => {
    const response = await api.post('/conversations', {
      book_id: bookId,
      title: title,
    });
    return response.data;
  },
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },
  getMessages: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },
  addMessage: async (conversationId, role, content) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      conversation_id: conversationId,
      role: role,
      content: content,
    });
    return response.data;
  },
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  }
};

export const pastPaperService = {
  getPastPapers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.institution_type) params.append('institution_type', filters.institution_type);
    if (filters.year) params.append('year', filters.year);
    
    const response = await api.get(`/past-papers?${params.toString()}`);
    return response.data;
  },
  
  downloadPastPaper: (bookId) => {
    return `${API_URL}/past-papers/${bookId}/download`;
  },

  uploadPastPaper: async (file, institution_type, institution_name, subject_or_module, module_code, year) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institution_type', institution_type);
    formData.append('institution_name', institution_name);
    formData.append('subject_or_module', subject_or_module);
    formData.append('module_code', module_code);
    formData.append('year', year);
    
    const response = await api.post('/admin/upload-past-paper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

export const adminService = {
  uploadLibraryBook: async (file, title, grade, subject, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('grade', grade);
    formData.append('subject', subject);
    formData.append('type', type);
    
    const response = await api.post('/admin/upload-library', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPublicLibrary: async () => {
    const response = await api.get('/library');
    return response.data;
  },

  deleteLibraryBook: async (bookId) => {
    const response = await api.delete(`/admin/library/${bookId}`);
    return response.data;
  }
};