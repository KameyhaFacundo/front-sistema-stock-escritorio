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
    estadoDeuda:  c.estado_deuda || 'pagado',
    montoPagado:  parseFloat(c.monto_pagado ?? 0),
    usuario:      c.usuario?.des_usu || null,
    comprobanteUrl: c.comprobante_url || null,
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
        codigo:        l.producto?.codigo || null,
        unidadMedida:  l.producto?.unidad_medida || 'unidad',
        // El backend castea 'cantidad' como decimal:2, que Laravel serializa
        // como STRING ("1.00") — sin este parseFloat, sumar cantidades con "+"
        // concatena texto en vez de sumar números (ver mismo fix en mapVenta()).
        cantidad:      parseFloat(l.cantidad ?? 0),
        precio_compra: parseFloat(l.precio_compra ?? 0),
        precio_venta:  l.precio_venta != null ? parseFloat(l.precio_venta) : null,
        subtotal:      parseFloat(l.precio_compra ?? 0) * parseFloat(l.cantidad ?? 0),
        cantidadDevuelta,
        disponibleDevolver: Math.max(0, parseFloat(l.cantidad ?? 0) - cantidadDevuelta),
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

  // Igual que getAll(), pero conserva la metadata de paginación (total,
  // página actual/última) en vez de descartarla — Compras.jsx la necesita
  // para paginar/buscar/filtrar de verdad contra el backend en vez de traer
  // como mucho PAGE_SIZES.DEFAULT compras y filtrar ese array capado del
  // lado del cliente (con más compras que eso en el historial, las más
  // viejas quedaban invisibles para cualquier búsqueda/filtro).
  async getAllPaginado(params = {}) {
    const res = await api.get('compras', { params });
    const body = res.data.data;
    const items = body?.data ?? [];
    return {
      items: items.map(mapCompra),
      total: body?.total ?? items.length,
      currentPage: body?.current_page ?? 1,
      lastPage: body?.last_page ?? 1,
    };
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

  async subirComprobante(id, file) {
    const formData = new FormData();
    formData.append('comprobante', file);
    const res = await api.post(`compras/${id}/comprobante`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapCompra(res.data.data);
  },

  async eliminarComprobante(id) {
    const res = await api.delete(`compras/${id}/comprobante`);
    return mapCompra(res.data.data);
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
