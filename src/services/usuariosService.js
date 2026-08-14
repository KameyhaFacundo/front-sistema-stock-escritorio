import api from '../api/client';
import { PAGE_SIZES } from '../constants';

export function mapUsuario(u) {
  return {
    id:          u.nro_usu,
    nombre:      u.des_usu,
    email:       u.email,
    rol:         u.rol?.nombre || 'Sin rol',
    id_rol:      u.id_rol,
    isAdmin:     u.rol?.codigo === 'admin',
    id_sucursal: u.id_sucursal ?? null,
    sucursal:    u.sucursal?.nombre || null,
    createdAt:   u.created_at ? String(u.created_at).slice(0, 10) : null,
    emailVerificado: !!u.email_verified_at,
  };
}

export function mapRol(r) {
  return { id: r.id, nombre: r.nombre, codigo: r.codigo };
}

export const usuariosService = {
  async getAll(params = {}) {
    const res = await api.get('users', { params: { per_page: PAGE_SIZES.DEFAULT, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapUsuario);
  },

  async create(data) {
    const res = await api.post('users', data);
    return mapUsuario(res.data.data);
  },

  async update(id, data) {
    const res = await api.put(`users/${id}`, data);
    return mapUsuario(res.data.data);
  },

  async delete(id) {
    await api.delete(`users/${id}`);
  },

  // Self-service: el propio usuario logueado edita su nombre/email. Devuelve
  // la respuesta cruda (no mapUsuario) porque el caller necesita el flag
  // email_pendiente, no solo los datos del usuario.
  async actualizarPerfil(data) {
    const res = await api.put('users/mi-perfil', data);
    return res.data;
  },

  async cambiarPassword(passwordActual, passwordNuevo) {
    await api.post('users/cambiar-password', { password_actual: passwordActual, password_nuevo: passwordNuevo });
  },

  // PIN corto para autorizar descuentos en el POS sin tipear la contraseña
  // completa (ver ventasService.autorizarDescuento) — se confirma con la
  // contraseña de login para cambiarlo, mismo criterio que cambiarPassword.
  async cambiarPin(password, pin) {
    await api.post('users/cambiar-pin', { password, pin });
  },

  // Segundo paso del cambio de email — sin JWT (el token es la prueba de
  // identidad), se llama desde la página pública /confirmar-email.
  async confirmarCambioEmail(id, token) {
    const res = await api.post('confirmar-email', { id, token });
    return res.data;
  },
};

export const rolesService = {
  async getAll() {
    const res = await api.get('roles', { params: { per_page: PAGE_SIZES.HISTORIAL } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapRol);
  },
};
