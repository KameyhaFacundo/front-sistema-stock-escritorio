/**
 * Calcula el badge de vencimiento de un producto ("Vencido", "Vence en Nd") y
 * su color, o [null, null] si no vence pronto (o no tiene fecha).
 *
 * Parsea la fecha manualmente en horario local: `new Date('YYYY-MM-DD')` se
 * interpreta como medianoche UTC, lo que puede adelantar/atrasar un día el
 * resultado según el huso horario del usuario.
 */
export function getVencimientoBadge(fechaVencimiento, ahora = new Date()) {
  if (!fechaVencimiento) return [null, null];
  const [y, m, d] = String(fechaVencimiento).slice(0, 10).split('-').map(Number);
  const fv = new Date(y, m - 1, d);
  const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const dias = Math.round((fv - hoyLocal) / 86400000);
  if (dias < 0) return ['Vencido', '#ef4444'];
  if (dias <= 7) return [`Vence en ${dias}d`, '#f97316'];
  if (dias <= 30) return [`Vence en ${dias}d`, '#f59e0b'];
  return [null, null];
}
