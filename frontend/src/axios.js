import axios from 'axios';

const baseURL = window.location.hostname === 'localhost' ? 'http://localhost:3300' : 'https://docseditor-cdrg.onrender.com';

const api = axios.create({
  baseURL: baseURL, 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;