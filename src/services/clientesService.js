import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapCliente(c) {
  return {
    id:        c.id,
    nombre:    c.persona,
    cuit:      c.cuit || '',
    direccion: c.direccion || '',
    telefono:  c.telefono || '',
    email:     c.email || '',
    condicionIva: c.condicion_iva || '',
    activo:    c.estado ?? true,
    puntos:    c.puntos ?? 0,
  };
}

export const clientesService = {
  async getAll(params = {}) {
    const res = await api.get('clientes', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapCliente);
  },

  async getById(id) {
    const res = await api.get(`clientes/${id}`);
    return mapCliente(res.data.data);
  },

  async create(data) {
    const res = await api.post('clientes', data);
    return mapCliente(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`clientes/${id}`, data);
    return mapCliente(res.data.data);
  },

  async delete(id) {
    await api.delete(`clientes/${id}`);
  },

  async getPuntos(id) {
    const res = await api.get(`clientes/${id}/puntos`);
    return res.data.data;
  },
};
