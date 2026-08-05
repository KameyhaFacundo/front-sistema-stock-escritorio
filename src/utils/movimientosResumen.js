/**
 * Agrupa una lista de movimientos de stock por producto, separando entradas
 * (cantidad positiva) de salidas (cantidad negativa). El resultado no
 * representa el stock real del producto — solo el movimiento neto del
 * período filtrado (ver comentario en Movimientos.jsx sobre por qué la
 * columna se llama "Movimiento neto" y no "Stock final").
 */
export function agruparPorProducto(movimientos) {
  const mapa = {};
  movimientos.forEach(m => {
    const key = m.codigo;
    if (!mapa[key]) mapa[key] = { id: key, codigo: m.codigo, producto: m.producto, entradas: 0, salidas: 0 };
    if (m.cantidad > 0) mapa[key].entradas += m.cantidad;
    else                mapa[key].salidas  += m.cantidad;
  });
  return Object.values(mapa);
}
