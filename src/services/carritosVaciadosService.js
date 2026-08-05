import api from '../api/client';

export function mapCarritoVaciado(c) {
  return {
    id:       c.id,
    fecha:    c.created_at,
    items:    c.items || [],
    total:    Number(c.total ?? 0),
    usuario:  c.usuario?.des_usu || null,
    sucursal: c.sucursal?.nombre || null,
  };
}

export const carritosVaciadosService = {
  // Se llama automáticamente al confirmar "Vaciar carrito" en el POS — no
  // requiere ningún permiso especial, cualquier usuario logueado puede
  // generar el registro (ver CarritoVaciadoController::store en el backend).
  async registrar({ items, total }) {
    await api.post('carritos-vaciados', { items, total });
  },

  async getAll(params = {}) {
    const res = await api.get('carritos-vaciados', { params: { per_page: 100, ...params } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapCarritoVaciado);
  },
};
