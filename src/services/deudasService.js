import api from '../api/client';

export function mapDeuda(c) {
  return {
    id:             c.id,
    proveedor:      c.proveedor?.persona || 'Sin proveedor',
    id_proveedor:   c.id_proveedor,
    fecha:          c.fecha ? String(c.fecha).slice(0, 10) : '',
    total:          parseFloat(c.monto_total ?? 0),
    pagado:         parseFloat(c.monto_pagado ?? 0),
    saldo:          parseFloat(c.monto_total ?? 0) - parseFloat(c.monto_pagado ?? 0),
    estado_deuda:   c.estado_deuda,
    metodo_pago:    c.metodo_pago,
    pagos:          (c.pagos || []).map(p => ({
      id:          p.id,
      monto:       parseFloat(p.monto),
      fecha:       p.fecha ? String(p.fecha).slice(0, 10) : '',
      metodo_pago: p.metodo_pago,
      nota:        p.nota || '',
    })),
  };
}

export const deudasService = {
  async getAll(params = {}) {
    const res = await api.get('deudas', { params });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return { deudas: items.map(mapDeuda), totalDeuda: res.data.total_deuda ?? 0 };
  },

  async resumen() {
    const res = await api.get('deudas/resumen');
    return res.data.data ?? [];
  },

  async pagar(idCompra, { monto, fecha, metodo_pago, nota }) {
    const res = await api.post(`deudas/${idCompra}/pagar`, { monto, fecha, metodo_pago, nota });
    return mapDeuda(res.data.data);
  },
};
