import api from '../api/client';

export function mapDeudaCliente(v) {
  return {
    id:           v.id,
    numero:       v.numero_ticket || `VTA-${v.id}`,
    cliente:      v.cliente?.persona || 'Consumidor Final',
    id_cliente:   v.id_cliente,
    fecha:        v.fecha ? String(v.fecha).slice(0, 10) : '',
    total:        parseFloat(v.monto_total ?? 0),
    cobrado:      parseFloat(v.monto_cobrado ?? 0),
    saldo:        parseFloat(v.monto_total ?? 0) - parseFloat(v.monto_cobrado ?? 0),
    estado_pago:  v.estado_pago,
    vendedor:     v.usuario?.des_usu || null,
    pagos:        (v.pagos || []).map(p => ({
      id:          p.id,
      monto:       parseFloat(p.monto),
      fecha:       p.fecha ? String(p.fecha).slice(0, 10) : '',
      metodo_pago: p.metodo_pago,
      nota:        p.nota || '',
    })),
    lineas: (v.lineas || []).map(l => ({
      nombre:         l.producto?.producto || 'Producto',
      cantidad:       l.cantidad,
      precio:         parseFloat(l.precio_venta ?? 0),
      precioOriginal: parseFloat(l.precio_original ?? l.precio_venta ?? 0),
      precioActual:   parseFloat(l.producto?.precio ?? 0),
      subtotal:       l.cantidad * parseFloat(l.precio_venta ?? 0),
    })),
  };
}

export const deudasClientesService = {
  async getAll(params = {}) {
    const res = await api.get('deudas-clientes', { params });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return { deudas: items.map(mapDeudaCliente), totalDeuda: res.data.total_deuda ?? 0 };
  },

  async resumen() {
    const res = await api.get('deudas-clientes/resumen');
    return res.data.data ?? [];
  },

  async cobrar(idVenta, { monto, fecha, metodo_pago, nota }) {
    const res = await api.post(`deudas-clientes/${idVenta}/cobrar`, { monto, fecha, metodo_pago, nota });
    return mapDeudaCliente(res.data.data);
  },

  async actualizarPrecios(idVenta) {
    const res = await api.post(`deudas-clientes/${idVenta}/actualizar-precios`);
    return mapDeudaCliente(res.data.data);
  },

  async revertirPrecios(idVenta) {
    const res = await api.post(`deudas-clientes/${idVenta}/revertir-precios`);
    return mapDeudaCliente(res.data.data);
  },
};
