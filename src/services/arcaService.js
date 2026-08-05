import api from '../api/client';

/**
 * ARCA / Facturación Electrónica.
 */

// tipo_comprobante es un código numérico de ARCA — 1/6/11 son facturas A/B/C,
// 3/8/13 son las notas de crédito correspondientes (ver ArcaService::TIPO_*
// en el backend, que es la fuente de verdad de este mapeo).
const TIPO_LABELS = {
  1: 'Factura A', 6: 'Factura B', 11: 'Factura C',
  3: 'Nota de Crédito A', 8: 'Nota de Crédito B', 13: 'Nota de Crédito C',
};

// La fecha viaja como "YYYYMMDD" (formato que exige ARCA), no como fecha SQL
// — se convierte a "YYYY-MM-DD" acá para que el resto del front (fmtDate,
// filtros de rango) la trate igual que cualquier otra fecha de la app.
function ymdToIso(ymd) {
  if (!ymd || String(ymd).length !== 8) return null;
  const s = String(ymd);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export function mapFactura(f) {
  if (!f) return null;
  return {
    id:                    f.id,
    idVenta:               f.id_venta,
    idComprobanteAsociado: f.id_comprobante_asociado,
    esNotaCredito:         f.id_comprobante_asociado != null,
    tipoComprobante:       f.tipo_comprobante,
    tipoLabel:             TIPO_LABELS[f.tipo_comprobante] || `Comprobante ${f.tipo_comprobante}`,
    puntoVenta:            f.punto_venta,
    numero:                f.numero,
    // Una factura "pendiente" (ver EmitirFacturaJob en el backend) todavía
    // no tiene número real — ARCA es quien lo asigna recién al resolverse.
    numeroCompleto:        f.numero_completo || (f.numero != null ? `#${f.numero}` : null),
    cae:                   f.cae,
    vencimientoCae:        ymdToIso(f.vencimiento_cae),
    fecha:                 ymdToIso(f.fecha),
    total:                 parseFloat(f.total ?? 0),
    neto:                  parseFloat(f.neto ?? 0),
    iva:                   parseFloat(f.iva ?? 0),
    clienteNombre:         f.cliente_nombre || 'Consumidor Final',
    numeroDocumento:       f.numero_documento,
    estado:                f.estado,
    errorMensaje:          f.error_mensaje || null,
    qrUrl:                 f.qr_url || null,
    comprobanteAsociado:   f.comprobante_asociado ? mapFactura(f.comprobante_asociado) : null,
    notasCredito:          (f.notas_credito ?? []).map(mapFactura),
    yaAcreditado:          f.ya_acreditado != null ? parseFloat(f.ya_acreditado) : null,
    disponible:            f.disponible != null ? parseFloat(f.disponible) : null,
    devolucionVenta:       f.devolucion_venta ? {
      id:            f.devolucion_venta.id,
      motivo:        f.devolucion_venta.motivo,
      montoDevuelto: parseFloat(f.devolucion_venta.monto_devuelto ?? 0),
      fecha:         f.devolucion_venta.created_at,
      usuario:       f.devolucion_venta.usuario?.des_usu || null,
    } : null,
  };
}

export async function emitirFactura(payload) {
  const { data } = await api.post('facturas/emitir', payload);
  return data;
}

export async function getFacturas(params) {
  const { data } = await api.get('facturas', { params });
  const items = data.data?.data ?? data.data ?? [];
  return items.map(mapFactura);
}

export async function getFactura(id) {
  const { data } = await api.get(`facturas/${id}`);
  return mapFactura(data.data);
}

export async function getUltimaFactura() {
  const { data } = await api.get('facturas/ultima');
  return data.data ?? data;
}

export async function getEstadoArca() {
  const { data } = await api.get('facturas/estado');
  return data;
}

// Nota de crédito parcial (o total) contra una factura ya emitida — para
// cuando se anula o se devuelve (parcial) una venta facturada. idDevolucionVenta
// es opcional: si viene de una devolución parcial, queda linkeada para poder
// mostrar su detalle (fecha, monto, motivo) junto al comprobante en Facturas.
export async function emitirNotaCredito(idFactura, monto, idDevolucionVenta) {
  const { data } = await api.post(`facturas/${idFactura}/nota-credito`, {
    monto,
    ...(idDevolucionVenta ? { id_devolucion_venta: idDevolucionVenta } : {}),
  });
  return data;
}

const arcaService = { emitirFactura, getFacturas, getFactura, getUltimaFactura, getEstadoArca, emitirNotaCredito };
export default arcaService;
