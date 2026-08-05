import api from '../api/client';

export function mapPermiso(p) {
  return { id: p.id, codigo: p.codigo, nombre: p.nombre, grupo: p.grupo };
}

export const permisosService = {
  async getAgrupados() {
    const res = await api.get('permisos/agrupados');
    const grupos = res.data.data || {};
    return Object.entries(grupos).map(([grupo, permisos]) => ({
      grupo,
      permisos: permisos.map(mapPermiso),
    }));
  },

  async getUsuario(id) {
    const res = await api.get(`permisos/usuario/${id}`);
    const { permisos_directos, permisos_rol } = res.data.data;
    return {
      idsDirectos: (permisos_directos || []).map(p => p.id),
      idsRol: (permisos_rol || []).map(p => p.id),
    };
  },

  async asignar(id, permisoIds) {
    const res = await api.post(`permisos/usuario/${id}`, { permisos: permisoIds });
    return (res.data.data || []).map(mapPermiso);
  },

  async getHistorial(id) {
    const res = await api.get(`permisos/usuario/${id}/historial`);
    const items = res.data.data ?? [];
    return items.map(h => ({
      id: h.id,
      agregados: h.permisos_agregados || [],
      quitados: h.permisos_quitados || [],
      actor: h.usuario_actor?.des_usu || null,
      fecha: h.created_at,
    }));
  },
};
