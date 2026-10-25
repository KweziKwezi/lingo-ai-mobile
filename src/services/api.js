import axios from 'axios';

const API_URL = 'https://lingo-ai-backend.onrender.com';

const api = axios.create({
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
  }
};
export const libraryService = {
  getPublicLibrary: async () => {
    const response = await api.get('/library');
    return response.data;
  },
  getBookContent: async (bookId) => {
    const response = await api.get(`/library/${bookId}/content`);
    return response.data;
  }
};