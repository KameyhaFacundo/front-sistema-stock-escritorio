import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapCompra(c) {
  return {
    id:           c.id,
    proveedor:    c.proveedor?.persona || 'Sin proveedor',
    id_proveedor: c.id_proveedor,
    fecha:        c.fecha ? String(c.fecha).slice(0, 10) : '',
    total:        parseFloat(c.monto_total ?? 0),
    estado:       c.estado || 'pendiente',
    metodo_pago:  c.metodo_pago || 'efectivo',
    usuario:      c.usuario?.des_usu || null,
    anuladoPor:      c.usuario_anulacion?.des_usu || null,
    fechaAnulacion:  c.fecha_anulacion || null,
    lineas:       (c.lineas || []).map(l => {
      // Cuánto de esta línea ya se devolvió al proveedor en devoluciones
      // parciales previas — se suma de todas las devoluciones de la compra,
      // no se guarda un contador (mismo criterio que mapVenta()).
      const cantidadDevuelta = (c.devoluciones || [])
        .flatMap(d => d.lineas || [])
        .filter(dl => dl.id_linea_compra === l.id_linea)
        .reduce((s, dl) => s + parseFloat(dl.cantidad ?? 0), 0);
      return {
        id:            l.id_linea,
        id_producto:   l.id_producto,
        nombre:        l.producto?.producto || 'Producto',
        cantidad:      l.cantidad,
        precio_compra: parseFloat(l.precio_compra ?? 0),
        precio_venta:  l.precio_venta != null ? parseFloat(l.precio_venta) : null,
        subtotal:      parseFloat(l.precio_compra ?? 0) * l.cantidad,
        cantidadDevuelta,
        disponibleDevolver: Math.max(0, l.cantidad - cantidadDevuelta),
      };
    }),
  };
}

export const comprasService = {
  async getAll(params = {}) {
    const res = await api.get('compras', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapCompra);
  },

  async getById(id) {
    const res = await api.get(`compras/${id}`);
    return mapCompra(res.data.data);
  },

  async create(data) {
    const res = await api.post('compras', data);
    return mapCompra(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`compras/${id}`, data);
    return mapCompra(res.data.data);
  },

  async changeStatus(id, estado) {
    const res = await api.put(`compras/${id}/change-status`, { estado });
    return mapCompra(res.data.data);
  },

  async delete(id) {
    await api.delete(`compras/${id}`);
  },

  // Devolución parcial de mercadería al proveedor — una o varias líneas, cada
  // una con su propia cantidad. El backend no devuelve la compra actualizada
  // acá (devuelve la devolución en sí) — quien llama refresca la compra
  // aparte con getById() para ver el estado nuevo.
  async crearDevolucion(id, { lineas, motivo }) {
    const res = await api.post(`compras/${id}/devolucion`, {
      lineas: lineas.map(l => ({ id_linea_compra: l.idLineaCompra, cantidad: l.cantidad })),
      ...(motivo ? { motivo } : {}),
    });
    return { cajaAjustada: res.data.data?.caja_ajustada, message: res.data.message };
  },
};
