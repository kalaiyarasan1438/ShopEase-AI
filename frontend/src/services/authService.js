import api from './api';

const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },

  register: async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/api/auth/refresh', { refreshToken });
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/api/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, newPassword) => {
    const { data } = await api.post('/api/auth/reset-password', { token, newPassword });
    return data;
  },

  changePassword: async (payload) => {
    const { data } = await api.put('/api/auth/change-password', payload);
    return data;
  },
};

export default authService;
