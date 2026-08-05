import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapLote(l) {
  return {
    id:               l.id,
    id_producto:      l.id_producto,
    id_sucursal:      l.id_sucursal,
    producto:         l.producto?.producto || '',
    codigo:           l.producto?.codigo || '',
    cantidad:         Number(l.cantidad ?? 0),
    fecha_vencimiento: l.fecha_vencimiento || null,
    fecha_compra:     l.fecha_compra || null,
    id_compra:        l.id_compra || null,
    created_at:       l.created_at,
  };
}

export const lotesService = {
  async getAll(params = {}) {
    const res = await api.get('lotes', { params: { per_page: PAGE_SIZES.PRODUCTOS, ...params } });
    return (res.data.data?.data ?? res.data.data ?? []).map(mapLote);
  },

  async getByProducto(idProducto) {
    const res = await api.get(`lotes/producto/${idProducto}`);
    return (res.data.data ?? []).map(mapLote);
  },

  async getProximosAVencer(dias = 7) {
    const res = await api.get('lotes/proximos-vencer', { params: { dias } });
    return (res.data.data ?? []).map(mapLote);
  },

  async create(data) {
    const res = await api.post('lotes', data);
    return mapLote(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`lotes/${id}`, data);
    return mapLote(res.data.data);
  },

  async delete(id) {
    await api.delete(`lotes/${id}`);
  },
};
