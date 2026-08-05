import api from '../api/client';

export const twoFactorService = {
  async getEstado() {
    const res = await api.get('2fa/estado');
    return { activo: res.data.activo, disponible: res.data.disponible };
  },

  async activar() {
    const res = await api.post('2fa/activar');
    return res.data.otpauth_url;
  },

  async confirmar(codigo) {
    await api.post('2fa/confirmar', { codigo });
  },

  async desactivar(password) {
    await api.post('2fa/desactivar', { password });
  },
};
