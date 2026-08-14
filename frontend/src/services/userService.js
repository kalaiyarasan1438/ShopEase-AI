import api from './api';

const userService = {
  getUserStats: async () => {
    const response = await api.get('/api/users/me/stats');
    return response.data;
  },
};

export default userService;
