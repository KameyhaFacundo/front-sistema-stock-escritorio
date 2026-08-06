import api from '../api/client';

export const sistemaService = {
  async getLanIp() {
    const res = await api.get('sistema/lan-ip');
    return res.data.data;
  },
};
