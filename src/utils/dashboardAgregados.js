/**
 * Método de pago más usado dentro de una lista de ventas, con el porcentaje
 * que representa sobre el total de ventas del período.
 */
export function metodoMasUsado(ventas, metodoLabels, totalVentas) {
  const map = {};
  ventas.forEach(v => {
    const n = metodoLabels[v.metodo] || v.metodo || 'Otro';
    map[n] = (map[n] || 0) + 1;
  });
  const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  if (!top) return { nombre: '—', pct: '' };
  return {
    nombre: top[0],
    pct: totalVentas ? `${Math.round((top[1] / totalVentas) * 100)}% de las ventas` : '',
  };
}
