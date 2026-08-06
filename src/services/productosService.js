import api from '../api/client';
import { PAGE_SIZES } from '../constants';

// Los dos primeros originales eran indigo/celeste (sin relación con la marca) —
// reemplazados por dorado y un marrón tostado, a juego con la paleta cálida
// (el terracota queda afuera de esta lista porque ya es el color primario —
// P/PRIMARY_COLOR — usado en el resto de la UI, se vería igual a todo lo demás).
const COLORS = ['#D4A017', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#8B5E34', '#f97316', '#ec4899'];

export function mapProducto(p) {
  return {
    id:               p.id,
    nombre:           p.producto,
    codigo:           p.codigo || `PROD-${p.id}`,
    codigoBarras:     p.codigo_barras || '',
    categoria:        p.categoria?.categoria || 'Sin categoría',
    cColor:           COLORS[(p.id_categoria - 1) % COLORS.length] ?? COLORS[0],
    activo:           p.estado ?? true,
    // parseFloat en todo lo que sea cantidad, no solo precio/costo: el
    // backend castea estas columnas como decimal:2, que Laravel serializa
    // como STRING ("5.00") — sin esto, sumar con "+" en cualquier pantalla
    // (ver el bug de "01.001.001.00" en el Dashboard, mismo origen)
    // concatena texto en vez de sumar números.
    // stock_disponible ya contempla combos (mínimo de stock/cantidad entre sus
    // componentes) — para un producto normal coincide con el stock real.
    stock:            parseFloat(p.stock_disponible ?? p.stock ?? 0),
    stockPropio:      parseFloat(p.stock ?? 0),
    stockTotal:       parseFloat(p.stock_total ?? p.stock ?? 0),
    alerta:           parseFloat(p.stock_minimo ?? 5),
    id_proveedor:     p.id_proveedor || null,
    proveedor:        p.proveedor?.persona || null,
    precioFinal:      parseFloat(p.precio ?? 0),
    costo:            parseFloat(p.costo ?? 0),
    // Fecha del último cambio de precio/costo (ver HistorialPrecio) — null si
    // nunca se modificó desde que se creó el producto.
    ultimaModificacionPrecio: p.ultima_modificacion_precio || null,
    id_categoria:     p.id_categoria,
    fechaVencimiento: p.fecha_vencimiento || null,
    esCombo:          p.es_combo ?? false,
    // Solo relevante para ferretería — el resto de los rubros siempre queda en
    // 'unidad', que es el default tanto acá como en el backend.
    unidadMedida:     p.unidad_medida || 'unidad',
    imagenUrl:        p.imagen_url || null,
    componentes: (p.componentes ?? []).map(c => ({
      id_producto: c.id_producto,
      cantidad:    parseFloat(c.cantidad ?? 0),
      nombre:      c.producto?.producto || '',
      codigo:      c.producto?.codigo || '',
      costo:       parseFloat(c.producto?.costo ?? 0),
      precioFinal: parseFloat(c.producto?.precio ?? 0),
    })),
    // Solo relevante para indumentaria — el resto de los rubros nunca tiene esto.
    tieneVariantes:   p.tiene_variantes ?? false,
    idGrupoTalle:     p.id_grupo_talle || null,
    grupoTalleNombre: p.grupo_talle?.nombre || null,
    idTalle:          p.id_talle || null,
    talle:            p.talle?.valor || null,
    variantes: (p.variantes ?? []).map(v => ({
      id:          v.id,
      codigo:      v.codigo,
      codigoBarras: v.codigo_barras || '',
      idTalle:     v.id_talle,
      talle:       v.talle,
      ordenTalle:  v.orden_talle,
      cantidadCurva: v.cantidad_curva ?? null,
      stock:       parseFloat(v.stock ?? 0),
      alerta:      parseFloat(v.stock_minimo ?? 5),
    })),
  };
}

export const productosService = {
  async getAll(params = {}) {
    const res = await api.get('productos', { params: { per_page: PAGE_SIZES.PRODUCTOS, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapProducto);
  },

  // Igual que getAll(), pero conserva la metadata de paginación (total,
  // página actual/última) en vez de descartarla — getAll() la tira porque a
  // sus llamadores (búsquedas tipo autocomplete, top-N) nunca les importó
  // cuántos resultados hay en total. La tabla principal de Productos si
  // necesita paginar de verdad contra el backend.
  async getAllPaginado(params = {}) {
    const res = await api.get('productos', { params });
    const body = res.data.data;
    const items = body?.data ?? [];
    return {
      items: items.map(mapProducto),
      total: body?.total ?? items.length,
      currentPage: body?.current_page ?? 1,
      lastPage: body?.last_page ?? 1,
    };
  },

  async getById(id, params = {}) {
    const res = await api.get(`productos/${id}`, { params });
    return mapProducto(res.data.data);
  },

  async create(data) {
    const res = await api.post('productos', data);
    return mapProducto(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`productos/${id}`, data);
    return mapProducto(res.data.data);
  },

  async delete(id) {
    await api.delete(`productos/${id}`);
  },

  async subirImagen(id, file) {
    const formData = new FormData();
    formData.append('imagen', file);
    const res = await api.post(`productos/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapProducto(res.data.data);
  },

  async eliminarImagen(id) {
    const res = await api.delete(`productos/${id}/imagen`);
    return mapProducto(res.data.data);
  },

  async generarImagenIa(id) {
    const res = await api.post(`productos/${id}/imagen-ia`);
    return mapProducto(res.data.data);
  },

  async generarImagenComboIa(id) {
    const res = await api.post(`productos/${id}/imagen-combo-ia`);
    return mapProducto(res.data.data);
  },

  async getHistorialPrecios(id) {
    const res = await api.get(`productos/${id}/historial-precios`);
    const items = res.data.data ?? [];
    return items.map(h => ({
      id:             h.id,
      campo:          h.campo || 'precio',
      precioAnterior: parseFloat(h.precio_anterior),
      precioNuevo:    parseFloat(h.precio_nuevo),
      fecha:          h.created_at,
      usuario:        h.usuario?.des_usu || null,
    }));
  },

  // A qué proveedores se le compró este producto y a qué precio cada vez —
  // solo compras confirmadas (ver ProductosController::historialCompras).
  async getHistorialCompras(id) {
    const res = await api.get(`productos/${id}/historial-compras`);
    const items = res.data.data ?? [];
    return items.map(l => ({
      idLinea:         l.id_linea,
      precioCompra:    parseFloat(l.precio_compra),
      cantidad:        parseFloat(l.cantidad),
      fecha:           l.compra?.fecha,
      idCompra:        l.compra?.id,
      proveedorNombre: l.compra?.proveedor?.persona || 'Proveedor eliminado',
    }));
  },
};
