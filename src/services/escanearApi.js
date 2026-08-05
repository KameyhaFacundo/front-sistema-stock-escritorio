import api from '../api/client';

export const escanearFacturaApi = async (imagenBase64, mimeType = 'image/jpeg') => {
  try {
    const response = await api.post('compras/escanear', { imagen: imagenBase64, mime_type: mimeType });
    return response.data;
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.error || 'Error al escanear la factura';
    throw new Error(msg);
  }
};
