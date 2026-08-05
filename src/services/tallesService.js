import api from '../api/client';

export function mapTalle(t) {
  return {
    id:            t.id,
    idGrupoTalle:  t.id_grupo_talle,
    valor:         t.valor,
    orden:         t.orden,
    // Cuántas unidades de este talle vienen en una curva/bulto al comprarle
    // al proveedor — null si no se configuró (Compras > Comprar por curva).
    cantidadCurva: t.cantidad_curva ?? null,
  };
}

export const tallesService = {
  async create(idGrupoTalle, valor, orden = 0, cantidadCurva = null) {
    const res = await api.post('talles', {
      id_grupo_talle: idGrupoTalle, valor, orden,
      ...(cantidadCurva != null ? { cantidad_curva: cantidadCurva } : {}),
    });
    return mapTalle(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`talles/${id}`, data);
    return mapTalle(res.data.data);
  },

  async delete(id) {
    await api.delete(`talles/${id}`);
  },
};
