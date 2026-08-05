import api from '../api/client';

/**
 * Obtiene estadísticas agregadas del dashboard desde el backend,
 * evitando cargar todas las ventas en memoria.
 */
export async function getDashboardStats(params = {}) {
  try {
    const { data } = await api.get('dashboard/stats', { params });
    return data.data ?? data;
  } catch (e) {
    console.error('Error cargando dashboard stats:', e);
    return null;
  }
}

const dashboardService = { getStats: getDashboardStats };
export default dashboardService;
