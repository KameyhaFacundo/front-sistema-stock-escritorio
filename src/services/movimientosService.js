import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapMovimiento(m) {
  return {
    id:       m.id,
    fecha:    m.fecha,
    hora:     m.hora || '',
    producto: m.producto,
    codigo:   m.codigo || '',
    tipo:     m.tipo,
    subTipo:  m.sub_tipo || '',
    // La columna es DECIMAL(12,2) para poder vender por peso/longitud en
    // ferretería — para el resto de los rubros siempre es un entero, pero
    // Laravel serializa cualquier DECIMAL como string ("5.00"), no como
    // número. Number() lo deja en 5 para enteros y en 2.5 (no "2.50") para
    // los fraccionarios, sin necesidad de saber el rubro del tenant acá.
    cantidad: Number(m.cantidad ?? 0),
    nota:     m.nota || '',
    usuario:  m.usuario?.des_usu || null,
    sucursal: m.sucursal?.nombre || null,
  };
}

export const movimientosService = {
  async getAll({ search = '', fecha = '', tipo = '' } = {}) {
    const params = { per_page: PAGE_SIZES.DEFAULT };
    if (search) params.search = search;
    if (fecha)  params.fecha  = fecha;
    if (tipo)   params.tipo   = tipo;
    const res   = await api.get('movimientos', { params });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapMovimiento);
  },

  async create(data) {
    const res = await api.post('movimientos', {
      id_producto: data.id_producto ?? null,
      producto:    data.producto,
      codigo:      data.codigo  ?? '',
      tipo:        data.tipo,
      sub_tipo:    data.subTipo ?? '',
      cantidad:    data.cantidad,
      nota:        data.nota    ?? '',
      fecha:       data.fecha,
      hora:        data.hora    ?? '',
    });
    return mapMovimiento(res.data.data);
  },

  // Ajuste masivo (importación Excel o "Ajuste masivo" por filtro) en UNA
  // sola request — reemplaza el patrón anterior de un create() por fila en
  // lotes paralelos de a 8: con el servidor PHP embebido de un solo hilo,
  // esas N requests se procesaban una por una igual del lado del servidor.
  // Cada item se procesa de forma independiente en el backend (uno con
  // stock insuficiente no tumba el resto). Ver MovimientosController::bulkStore().
  async bulkCreate(items) {
    const res = await api.post('movimientos/bulk', {
      items: items.map(i => ({
        id_producto: i.id_producto ?? null,
        producto:    i.producto,
        codigo:      i.codigo ?? '',
        sub_tipo:    i.subTipo ?? '',
        cantidad:    i.cantidad,
        nota:        i.nota ?? '',
      })),
    });
    const data = res.data.data;
    return { aplicados: data.aplicados, fallidos: data.fallidos, indicesFallidos: data.indices_fallidos ?? [] };
  },

  async transferir({ idProducto, cantidad, idSucursalOrigen, idSucursalDestino }) {
    const res = await api.post('movimientos/transferencia', {
      id_producto: idProducto,
      cantidad,
      id_sucursal_origen: idSucursalOrigen,
      id_sucursal_destino: idSucursalDestino,
    });
    return res.data.data;
  },
};

