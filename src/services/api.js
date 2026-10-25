import axios from 'axios';

// ⚠️ If testing on a physical phone, change 'localhost' to your PC's IP address (e.g., '192.168.1.50')
   const API_URL = 'https://lingo-ai-backend.onrender.com'; // Replace with your actual Render URL

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
  askQuestion: async (question, language, bookId = null) => {
    const response = await api.post('/ask', {
      question,
      language,
      book_id: bookId,
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
  }
};