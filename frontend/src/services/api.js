import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const profileAPI = {
  create: (data) => api.post('/profile', data),
  getMe: () => api.get('/profile/me'),
  update: (data) => api.put('/profile/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/profile/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadResume: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/profile/me/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addLink: (data) => api.post('/profile/me/links', data),
  deleteLink: (id) => api.delete(`/profile/me/links/${id}`),
  addSkill: (data) => api.post('/profile/me/skills', data),
  deleteSkill: (id) => api.delete(`/profile/me/skills/${id}`),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  uploadImage: (projectId, file, caption = '') => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/projects/${projectId}/images?caption=${encodeURIComponent(caption)}`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (projectId, imageId) => api.delete(`/projects/${projectId}/images/${imageId}`),
};

export const portfolioAPI = {
  createLink: (data) => api.post('/portfolio/links', data),
  getLinks: () => api.get('/portfolio/links'),
  deactivateLink: (id) => api.delete(`/portfolio/links/${id}`),
  viewByToken: (token) => api.get(`/portfolio/view/${token}`),
  getMyReviews: () => api.get('/portfolio/reviews/me'),
  addReview: (profileId, data) => api.post(`/portfolio/reviews/${profileId}`, data),
  getDashboard: () => api.get('/portfolio/dashboard'),
  getAllProfiles: () => api.get('/portfolio/all-profiles'),
};

export const seedAPI = { run: () => api.post('/seed/run') };

export default api;
