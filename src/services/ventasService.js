import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapVenta(v) {
  return {
    id:         v.id,
    ticketId:   v.numero_ticket || `VTA-${v.id}`,
    numero:     v.numero_ticket || `VTA-${v.id}`,
    fecha:      v.fecha ? String(v.fecha).slice(0, 10) : '',
    hora:       v.hora || '',
    items:      (v.lineas || []).map(l => {
      // Cuánto de esta línea ya se devolvió en devoluciones parciales previas —
      // se suma de todas las devoluciones de la venta, no se guarda un contador.
      const cantidadDevuelta = (v.devoluciones || [])
        .flatMap(d => d.lineas || [])
        .filter(dl => dl.id_linea_venta === l.id_linea)
        .reduce((s, dl) => s + parseFloat(dl.cantidad ?? 0), 0);
      return {
        id:        l.id_linea,
        idProducto: l.id_producto,
        // Línea de "monto libre" (sin id_producto): el nombre queda en la propia
        // línea, no hay Producto del que leerlo.
        nombre:    l.producto?.producto || l.nombre || 'Producto',
        categoria: l.producto?.categoria?.categoria || 'Sin categoría',
        // El backend castea 'cantidad' como decimal:2, que Laravel serializa como
        // STRING ("1.00") — sin este parseFloat, sumar cantidades con "+" en
        // pantallas como el Dashboard concatena texto en vez de sumar números
        // (ej. "1.00" + "1.00" = "01.001.00" en vez de 2).
        cantidad:  parseFloat(l.cantidad ?? 0),
        unidadMedida: l.producto?.unidad_medida || 'unidad',
        precio:    parseFloat(l.precio_venta ?? 0),
        // precio_original = precio de lista antes de cualquier descuento por
        // línea (ver LineaVenta::$fillable en el backend) — si nunca se tocó,
        // el backend lo guarda igual al precio_venta, así que cae en 0
        // diferencia y el ticket no muestra ningún descuento de más.
        precioOriginal: l.precio_original != null ? parseFloat(l.precio_original) : parseFloat(l.precio_venta ?? 0),
        costo:     parseFloat(l.producto?.costo ?? 0),
        subtotal:  parseFloat(l.precio_venta ?? 0) * parseFloat(l.cantidad ?? 0),
        cantidadDevuelta,
        disponibleDevolver: Math.max(0, parseFloat(l.cantidad ?? 0) - cantidadDevuelta),
      };
    }),
    total:      parseFloat(v.monto_total ?? 0),
    metodo:     v.metodo_pago || 'efectivo',
    pagos:      Array.isArray(v.pagos)
                  ? v.pagos.map(p => ({ metodo: p.metodo, monto: parseFloat(p.monto ?? 0) }))
                  : [{ metodo: v.metodo_pago || 'efectivo', monto: parseFloat(v.monto_total ?? 0) }],
    cliente:    v.cliente?.persona || 'Consumidor Final',
    id_cliente: v.id_cliente,
    estado:     v.estado || 'confirmada',
    usuario:    v.usuario?.des_usu || null,
    // Solo presente si esta venta ya tiene una factura electrónica emitida
    // (ver Home.jsx::handleEmitirFactura) — usado para ofrecer la Nota de
    // Crédito al anular/devolver (ModalNotaCredito en Dashboard.jsx).
    factura: v.factura ? {
      id:             v.factura.id,
      numeroCompleto: v.factura.numero_completo,
      tipoComprobante: v.factura.tipo_comprobante,
      cae:            v.factura.cae,
      total:          parseFloat(v.factura.total ?? 0),
      estado:         v.factura.estado,
    } : null,
  };
}

export const ventasService = {
  async getAll(params = {}) {
    const res = await api.get('ventas', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapVenta);
  },

  async getById(id) {
    const res = await api.get(`ventas/${id}`);
    return mapVenta(res.data.data);
  },

  async create(data) {
    const res = await api.post('ventas', data);
    return mapVenta(res.data.data);
  },

  async anular(id) {
    const res = await api.post(`ventas/${id}/anular`);
    return { venta: mapVenta(res.data.data), message: res.data.message };
  },

  // Devolución parcial — una o varias líneas, cada una con su propia cantidad
  // (a diferencia de anular(), que es toda la venta). El backend no devuelve
  // la venta actualizada acá (devuelve la devolución en sí) — quien llama
  // tiene que refrescar la venta aparte con getById() para ver el estado nuevo.
  async crearDevolucion(id, { lineas, motivo, formaReintegro }) {
    const res = await api.post(`ventas/${id}/devolucion`, {
      lineas: lineas.map(l => ({ id_linea_venta: l.idLineaVenta, cantidad: l.cantidad })),
      ...(motivo ? { motivo } : {}),
      // Cómo se resuelve con el cliente la diferencia a favor, si la hay
      // (ver ModalDevolucionVenta en Dashboard.jsx) — el backend asume
      // 'efectivo' si no se manda nada, así que esto es opcional acá.
      ...(formaReintegro ? { forma_reintegro: formaReintegro } : {}),
    });
    return {
      idDevolucion: res.data.data?.id,
      cajaAjustada: res.data.data?.caja_ajustada,
      montoDevuelto: parseFloat(res.data.data?.monto_devuelto ?? 0),
      message: res.data.message,
    };
  },
};
