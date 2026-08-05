import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapGrupoTalle(g) {
  return {
    id:     g.id,
    nombre: g.nombre,
    talles: (g.talles ?? []).map(t => ({
      id:            t.id,
      valor:         t.valor,
      orden:         t.orden,
      cantidadCurva: t.cantidad_curva ?? null,
    })),
  };
}

export const gruposTallesService = {
  async getAll() {
    const res = await api.get('grupos-talles', { params: { per_page: PAGE_SIZES.DEFAULT } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapGrupoTalle);
  },

  async create(nombre) {
    const res = await api.post('grupos-talles', { nombre });
    return mapGrupoTalle(res.data.data);
  },

  async update(id, nombre) {
    const res = await api.put(`grupos-talles/${id}`, { nombre });
    return mapGrupoTalle(res.data.data);
  },

  async delete(id) {
    await api.delete(`grupos-talles/${id}`);
  },
};
