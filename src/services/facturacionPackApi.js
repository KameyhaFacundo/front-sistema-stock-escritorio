import api from '../api/client'

export const crearPagoPackApi = async (pack) => {
  const response = await api.post('facturacion-pack/crear', { pack })
  return response.data
}
