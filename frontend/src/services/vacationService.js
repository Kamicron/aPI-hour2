import api from '../api/axios';

const vacationService = {
  getAllVacations: async () => {
    const response = await api.get('/vacations');
    return response.data;
  },

  getVacationsByUserId: async (userId) => {
    const response = await api.get(`/vacations/user/${userId}`);
    return response.data;
  },

  getVacationsByUserIdAndStatus: async (userId, status) => {
    const response = await api.get(`/vacations/user/${userId}/status/${status}`);
    return response.data;
  },

  getVacationById: async (id) => {
    const response = await api.get(`/vacations/${id}`);
    return response.data;
  },

  createVacation: async (vacationData) => {
    const response = await api.post('/vacations', vacationData);
    return response.data;
  },

  updateVacation: async (id, vacationData) => {
    const response = await api.put(`/vacations/${id}`, vacationData);
    return response.data;
  },

  deleteVacation: async (id) => {
    const response = await api.delete(`/vacations/${id}`);
    return response.data;
  }
};

export default vacationService;
