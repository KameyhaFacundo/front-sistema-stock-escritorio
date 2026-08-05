import api from '../api/client';

export const catalogoService = {
  async getPublico(slug) {
    const res = await api.get(`catalogo/${slug}`);
    return res.data.data;
  },
};
