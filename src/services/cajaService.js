import api from '../api/client';

export function mapTurno(t) {
  if (!t) return null;
  return {
    id:                 t.id,
    abierta:            t.estado === 'abierta',
    estado:             t.estado,
    fecha:              t.fecha,
    usuario:            t.usuario?.des_usu || null,
    horaApertura:       t.hora_apertura,
    horaCierre:         t.hora_cierre,
    montoInicial:       parseFloat(t.monto_inicial ?? 0),
    montoFinal:         t.monto_final != null ? parseFloat(t.monto_final) : null,
    montoEsperado:      t.monto_esperado != null ? parseFloat(t.monto_esperado) : null,
    diferencia:         t.diferencia != null ? parseFloat(t.diferencia) : null,
    ventasEfectivo:     parseFloat(t.ventas_efectivo ?? 0),
    ventasTarjeta:      parseFloat(t.ventas_tarjeta ?? 0),
    ventasTransferencia: parseFloat(t.ventas_transferencia ?? 0),
    ventasQr:           parseFloat(t.ventas_qr ?? 0),
    ventasFiado:        parseFloat(t.ventas_fiado ?? 0),
    efectivoActual:     parseFloat(t.efectivo_actual ?? 0),
    ventasCount:        t.ventas_count ?? 0,
    ventasMonto:        parseFloat(t.ventas_sum_monto_total ?? 0),
    movimientosDetalle: (t.movimientos || []).map(m => ({
      id:    m.id,
      tipo:  m.tipo,
      monto: parseFloat(m.monto),
      motivo: m.motivo || '',
      hora:  m.hora,
    })),
  };
}

export const cajaService = {
  async turnoActivo() {
    const res = await api.get('caja/turno-activo');
    return mapTurno(res.data.data);
  },

  async historial(params = {}) {
    const res = await api.get('caja/historial', { params });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapTurno);
  },

  async abrir(montoInicial) {
    const res = await api.post('caja/abrir', { monto_inicial: montoInicial });
    return mapTurno(res.data.data);
  },

  async cerrar(montoContado = null) {
    const body = montoContado != null ? { monto_contado: montoContado } : {};
    const res  = await api.put('caja/cerrar', body);
    return mapTurno(res.data.data);
  },

  async agregarMovimiento(tipo, monto, motivo = '') {
    const res = await api.post('caja/movimiento', { tipo, monto, motivo });
    return mapTurno(res.data.data.turno);
  },
};
