import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapCategoria(c) {
  return {
    id:     c.id,
    nombre: c.categoria,
  };
}

export const categoriasService = {
  async getAll() {
    const res = await api.get('categorias', { params: { per_page: PAGE_SIZES.DEFAULT } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapCategoria);
  },

  async create(nombre) {
    const res = await api.post('categorias', { categoria: nombre });
    return mapCategoria(res.data.data);
  },

  async update(id, nombre) {
    const res = await api.put(`categorias/${id}`, { categoria: nombre });
    return mapCategoria(res.data.data);
  },

  async delete(id) {
    await api.delete(`categorias/${id}`);
  },
};
