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

/**
 * Más vendidos (agregado real del backend, sin el límite de 300 filas que
 * tiene el fetch de ventas usado para el resto del dashboard) + productos
 * sin ventas en los últimos `dias` días, para detectar capital parado.
 */
export async function getRankingProductos(params = {}) {
  try {
    const { data } = await api.get('dashboard/ranking-productos', { params });
    return data.data ?? data;
  } catch (e) {
    console.error('Error cargando ranking de productos:', e);
    return null;
  }
}

const dashboardService = { getStats: getDashboardStats, getRankingProductos };
export default dashboardService;
