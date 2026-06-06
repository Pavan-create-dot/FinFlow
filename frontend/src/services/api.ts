import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

const fetcher = axios.create({
  baseURL: API_BASE,
});

// Add interceptor for JWT
fetcher.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    login: (data: any) => fetcher.post('/auth/login', data),
    register: (data: any) => fetcher.post('/auth/register', data),
  },
  statements: {
    upload: (formData: FormData) => fetcher.post('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: () => fetcher.get('/statements'),
  },
  transactions: {
    list: (params?: any) => fetcher.get('/transactions', { params }),
    update: (id: string, data: { categoryId: string | null }) => fetcher.patch(`/transactions/${id}`, data),
    summary: () => fetcher.get('/analytics/summary'),
  },
  categories: {
    list: () => fetcher.get('/categories'),
  },
  ai: {
    insights: () => fetcher.get('/ai/insights'),
  }
};
