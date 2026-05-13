import axiosInstance from '../api/axios';

export const sessionService = {
  getCurrentSession: async () => {
    const response = await axiosInstance.get('/session/current');
    return response.data;
  },

  startSession: async () => {
    const response = await axiosInstance.post('/session/start');
    return response.data;
  },

  pauseSession: async () => {
    const response = await axiosInstance.post('/session/pause');
    return response.data;
  },

  resumeSession: async () => {
    const response = await axiosInstance.post('/session/resume');
    return response.data;
  },

  stopSession: async () => {
    const response = await axiosInstance.post('/session/stop');
    return response.data;
  }
};
