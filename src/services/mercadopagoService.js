import api from '../api/client';

export const mercadopagoService = {
  async getEstado() {
    const res = await api.get('mercadopago/estado');
    return { conectado: res.data.conectado, pointDeviceId: res.data.point_device_id };
  },

  async conectar() {
    const res = await api.get('mercadopago/conectar');
    return res.data.url;
  },

  async desconectar() {
    await api.delete('mercadopago/desconectar');
  },

  async getDispositivos() {
    const res = await api.get('mercadopago/dispositivos');
    return res.data.data ?? [];
  },

  async guardarDispositivo(pointDeviceId) {
    await api.put('mercadopago/dispositivo', { point_device_id: pointDeviceId });
  },

  async crearIntento(payload) {
    const res = await api.post('ventas/point/crear-intento', payload);
    return res.data.intento_id;
  },

  async crearIntentoQr(payload) {
    const res = await api.post('ventas/qr/crear-intento', payload);
    return { intentoId: res.data.intento_id, qrData: res.data.qr_data };
  },

  async getEstadoIntento(intentoId) {
    const res = await api.get(`ventas/point/intento/${intentoId}/estado`);
    return { estado: res.data.estado, idVenta: res.data.id_venta };
  },

  async cancelarIntento(intentoId) {
    const res = await api.post(`ventas/point/intento/${intentoId}/cancelar`);
    return res.data.estado;
  },
};
