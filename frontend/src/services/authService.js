import axiosInstance from '../api/axios';

export const authService = {
  async login(email, password) {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },

  async register(email, password, name) {
    const response = await axiosInstance.post('/auth/register', { email, password, name });
    return response.data;
  },
};
