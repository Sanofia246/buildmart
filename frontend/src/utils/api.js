import axios from 'axios';

const api = axios.create({
  baseURL: 'https://buildmart-backend-9z4b.onrender.com/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bm_token');
      localStorage.removeItem('bm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
