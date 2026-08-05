import api from '../api/client';
import { PAGE_SIZES } from '../constants';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export function mapProducto(p) {
  return {
    id:               p.id,
    nombre:           p.producto,
    codigo:           p.codigo || `PROD-${p.id}`,
    categoria:        p.categoria?.categoria || 'Sin categoría',
    cColor:           COLORS[(p.id_categoria - 1) % COLORS.length] ?? COLORS[0],
    activo:           p.estado ?? true,
    // stock_disponible ya contempla combos (mínimo de stock/cantidad entre sus
    // componentes) — para un producto normal coincide con el stock real.
    stock:            p.stock_disponible ?? p.stock ?? 0,
    stockPropio:      p.stock ?? 0,
    stockTotal:       p.stock_total ?? p.stock ?? 0,
    alerta:           p.stock_minimo ?? 5,
    id_proveedor:     p.id_proveedor || null,
    proveedor:        p.proveedor?.persona || null,
    precioFinal:      parseFloat(p.precio ?? 0),
    costo:            parseFloat(p.costo ?? 0),
    id_categoria:     p.id_categoria,
    fechaVencimiento: p.fecha_vencimiento || null,
    esCombo:          p.es_combo ?? false,
    // Solo relevante para ferretería — el resto de los rubros siempre queda en
    // 'unidad', que es el default tanto acá como en el backend.
    unidadMedida:     p.unidad_medida || 'unidad',
    imagenUrl:        p.imagen_url || null,
    componentes: (p.componentes ?? []).map(c => ({
      id_producto: c.id_producto,
      cantidad:    c.cantidad,
      nombre:      c.producto?.producto || '',
      codigo:      c.producto?.codigo || '',
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
      idTalle:     v.id_talle,
      talle:       v.talle,
      ordenTalle:  v.orden_talle,
      cantidadCurva: v.cantidad_curva ?? null,
      stock:       v.stock ?? 0,
      alerta:      v.stock_minimo ?? 5,
    })),
  };
}

export const productosService = {
  async getAll(params = {}) {
    const res = await api.get('productos', { params: { per_page: PAGE_SIZES.PRODUCTOS, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapProducto);
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
};
