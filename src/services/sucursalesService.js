import api from '../api/client';

export function mapSucursal(s) {
  return {
    id:          s.id,
    nombre:      s.nombre,
    direccion:   s.direccion || '',
    telefono:    s.telefono || '',
    activo:      s.activo ?? true,
    esPrincipal: s.es_principal ?? false,
  };
}

export const sucursalesService = {
  async getAll() {
    const res = await api.get('sucursales');
    const items = res.data.data ?? [];
    return items.map(mapSucursal);
  },

  async create(data) {
    const res = await api.post('sucursales', data);
    return mapSucursal(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`sucursales/${id}`, data);
    return mapSucursal(res.data.data);
  },

  async delete(id) {
    await api.delete(`sucursales/${id}`);
  },
};
