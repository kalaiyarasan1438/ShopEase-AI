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

  verifyOtp: async (email, otp) => {
    const { data } = await api.post('/api/auth/verify-otp', { email, otp });
    return data;
  },

  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const { data } = await api.post('/api/auth/reset-password-otp', { email, otp, newPassword });
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

  oauthGoogle: async (idToken) => {
    const { data } = await api.post('/api/auth/oauth/google', { idToken });
    return data;
  },
};

export default authService;
