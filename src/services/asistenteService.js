import api from '../api/client';

export const asistenteService = {
  async preguntar(mensaje, historial = []) {
    const { data } = await api.post('asistente/preguntar', { mensaje, historial });
    return data.data?.respuesta ?? null;
  },
};
