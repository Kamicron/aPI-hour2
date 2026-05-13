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

  async forgotPassword(email) {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, password) {
    const response = await axiosInstance.post('/auth/reset-password', { token, password });
    return response.data;
  },
};
