import api from '../api/client';

export const superAdminService = {
  impersonar: async () => {
    const { data } = await api.get('/super-admin/impersonate');
    return data;
  },
  volver: async () => {
    const { data } = await api.post('/super-admin/unimpersonate');
    return data;
  },
};
