import axios from 'axios';
import { API_BASE_URL } from './utils';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Statistics
  getStats: () => api.get('/api/stats'),

  // Unidentified Bodies
  reportUnidentifiedBody: (formData) => api.post('/api/report-unidentified-body', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUnidentifiedBodies: () => api.get('/api/unidentified-bodies'),
  getUnidentifiedBody: (pid) => api.get(`/api/record/${pid}`),

  // Missing Persons
  reportMissingPerson: (formData) => api.post('/api/report-missing-person', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMissingPersons: () => api.get('/api/missing-persons'),
  getMissingPerson: (pid) => api.get(`/api/record/${pid}`),

  // Search
  searchMatch: (params) => api.post('/api/search-missing-person', params),
  searchByImage: (formData) => api.post('/api/search-missing-person', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
