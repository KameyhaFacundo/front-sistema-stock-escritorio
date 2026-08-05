/**
 * Compras en estado "pendiente" con más de 7 días de antigüedad — se usan
 * para el banner de aviso en la lista de Compras.
 */
export function pendientesViejas(compras, ahora = new Date()) {
  const corte = new Date(ahora);
  corte.setDate(corte.getDate() - 7);
  return compras.filter(c => c.estado === 'pendiente' && new Date(c.fecha) < corte);
}
