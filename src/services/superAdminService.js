import api from '../api/client';

export const superAdminService = {
  async getEmpresas() {
    const res = await api.get('super-admin/empresas');
    return res.data.data ?? [];
  },

  async getEmpresa(id) {
    const res = await api.get(`super-admin/empresas/${id}`);
    return res.data.data;
  },

  async updateEmpresa(id, data) {
    await api.put(`super-admin/empresas/${id}`, data);
  },

  async crearUsuario(empresaId, data) {
    const res = await api.post(`super-admin/empresas/${empresaId}/usuarios`, data);
    return res.data.data;
  },

  async eliminarUsuario(id) {
    await api.delete(`super-admin/usuarios/${id}`);
  },

  async toggleAdmin(id) {
    const res = await api.put(`super-admin/usuarios/${id}/toggle-admin`);
    return res.data.is_admin;
  },

  async registrarPago(empresaId, data) {
    const res = await api.post(`super-admin/empresas/${empresaId}/registrar-pago`, data);
    return res.data;
  },

  async acreditarFacturas(empresaId, data) {
    const res = await api.post(`super-admin/empresas/${empresaId}/facturas`, data);
    return res.data;
  },

  async extenderTrial(id, dias) {
    const res = await api.post(`super-admin/empresas/${id}/extender-trial`, { dias });
    return res.data.trial_ends_at;
  },

  async toggleSuspendida(id) {
    const res = await api.put(`super-admin/empresas/${id}/toggle-suspendida`);
    return res.data.suspendida;
  },

  async resetearPassword(userId, password) {
    await api.put(`super-admin/usuarios/${userId}/reset-password`, { password });
  },

  async actualizarUsuario(userId, data) {
    const res = await api.put(`super-admin/usuarios/${userId}`, data);
    return res.data.data;
  },

  async getAlertasTrial() {
    const res = await api.get('super-admin/alertas-trial');
    return res.data.data ?? [];
  },

  async getHistorialPagos() {
    const res = await api.get('super-admin/historial-pagos');
    return res.data.data ?? [];
  },

  async getIngresos() {
    const res = await api.get('super-admin/ingresos');
    return res.data.data;
  },

  async impersonar(empresaId, idUsuario) {
    const res = await api.post(`super-admin/empresas/${empresaId}/impersonar`, idUsuario ? { id_usuario: idUsuario } : {});
    return res.data;
  },

  async getActividad(params = {}) {
    const res = await api.get('super-admin/actividad', { params });
    return res.data.data ?? [];
  },
};
