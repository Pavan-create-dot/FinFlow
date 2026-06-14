import axios from 'axios';

const rawApiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';
const sanitizeBaseUrl = (url: string) => {
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  if (cleanUrl.endsWith('/api/v1')) return cleanUrl;
  return `${cleanUrl}/api/v1`;
};

const API_BASE = sanitizeBaseUrl(rawApiUrl);

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
