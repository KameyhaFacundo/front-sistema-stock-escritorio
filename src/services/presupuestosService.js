import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapPresupuesto(p) {
  return {
    id:          p.id,
    cliente:     p.cliente?.persona || 'Consumidor Final',
    id_cliente:  p.id_cliente,
    fecha:       p.fecha ? String(p.fecha).slice(0, 10) : '',
    total:       parseFloat(p.monto_total ?? 0),
    estado:      p.estado || 'vigente',
    notas:       p.notas || '',
    usuario:     p.usuario?.des_usu || null,
    idVenta:     p.id_venta || null,
    lineas: (p.lineas || []).map(l => ({
      id:           l.id_linea,
      id_producto:  l.id_producto,
      nombre:       l.nombre || l.producto?.producto || 'Producto',
      cantidad:     parseFloat(l.cantidad ?? 0),
      precio_venta: parseFloat(l.precio_venta ?? 0),
      subtotal:     parseFloat(l.precio_venta ?? 0) * parseFloat(l.cantidad ?? 0),
    })),
  };
}

export const presupuestosService = {
  async getAll(params = {}) {
    const res = await api.get('presupuestos', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapPresupuesto);
  },

  async getById(id) {
    const res = await api.get(`presupuestos/${id}`);
    return mapPresupuesto(res.data.data);
  },

  async create(data) {
    const res = await api.post('presupuestos', data);
    return mapPresupuesto(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`presupuestos/${id}`, data);
    return mapPresupuesto(res.data.data);
  },

  async delete(id) {
    await api.delete(`presupuestos/${id}`);
  },

  // Devuelve la venta ya creada (no un presupuesto) — quien llama refresca
  // el listado de presupuestos aparte para ver el estado "convertido".
  async convertir(id, metodoPago) {
    const res = await api.post(`presupuestos/${id}/convertir`, { metodo_pago: metodoPago });
    return res.data;
  },
};
