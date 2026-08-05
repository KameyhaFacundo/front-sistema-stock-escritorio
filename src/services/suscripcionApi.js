import api from '../api/client'

export const crearPagoApi = async (plan, ciclo) => {
  const response = await api.post('suscripcion/crear', { plan, ciclo })
  return response.data
}
