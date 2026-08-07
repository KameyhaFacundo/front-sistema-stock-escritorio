import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapProveedor(p) {
  return {
    id:        p.id,
    nombre:    p.persona,
    codigo:    p.codigo || '',
    cuit:      p.cuit || '',
    direccion: p.direccion || '',
    telefono:  p.telefono || '',
    email:     p.email || '',
    activo:    p.estado ?? true,
  };
}

export const proveedoresService = {
  async getAll(params = {}) {
    const res = await api.get('proveedores', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapProveedor);
  },

  async getById(id) {
    const res = await api.get(`proveedores/${id}`);
    return mapProveedor(res.data.data);
  },

  async create(data) {
    const res = await api.post('proveedores', data);
    return mapProveedor(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`proveedores/${id}`, data);
    return mapProveedor(res.data.data);
  },

  async delete(id) {
    await api.delete(`proveedores/${id}`);
  },
};
