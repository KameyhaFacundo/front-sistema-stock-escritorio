// ── Utilidades de formato ──────────────────────────────────────────────────

/** $ 1.234,56 */
export const fmtMoney = (n) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * "2026-06-04" (solo fecha, sin hora) lo interpreta el motor JS como UTC —
 * en Argentina (UTC-3) eso corre el día mostrado uno para atrás. Forzamos
 * mediodía local para las fechas "puras" y dejamos los timestamps completos
 * (con hora) como vienen, para que la conversión UTC→local siga siendo correcta.
 */
function parseFechaLocal(d) {
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(String(d).trim());
  return soloFecha ? new Date(`${d}T12:00:00`) : new Date(d);
}

/** 04/06/2026 */
export const fmtDate = (d) =>
  d ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseFechaLocal(d)) : '';

/** 12:31 a.m. */
export const fmtTime = (d) =>
  d ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(d)) : '';

/** "HH:mm" (24h) para la hora actual */
export function nowHora() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Jueves, 4 De Junio De 2026 */
export const fmtDayLabel = (d) => {
  const date = parseFechaLocal(d);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(date)
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * "YYYY-MM-DD" de una fecha en hora LOCAL — el sentido inverso de
 * parseFechaLocal: `date.toISOString().slice(0,10)` convierte a UTC antes de
 * cortar, así que en Argentina (UTC-3) cualquier Date con hora local entre
 * ~21:00 y medianoche se corre al día siguiente. Usar SIEMPRE esto (nunca
 * `new Date().toISOString().slice(0,10)`) para obtener "hoy" o cualquier
 * fecha como string — si no, una venta cargada a las 22hs queda fechada
 * para mañana.
 */
export function toLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** dd/mm/aaaa (input date) */
export const fmtInputDate = (d) => {
  if (!d) return '';
  // Ya viene como "YYYY-MM-DD..." (string o timestamp con fecha primero) —
  // devolverlo tal cual, sin pasar por Date, para no correr el día vía UTC.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return toLocalDateStr(d instanceof Date ? d : new Date(d));
};
