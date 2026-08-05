// ── Borrador del carrito del POS — sobrevive a un F5 o a que se cierre la
// pestaña sin querer. No es "modo offline": solo evita perder lo que el
// cajero ya cargó si hay un corte breve o un accidente.
const CARRITO_STORAGE_KEY = 'pos_carrito_borrador';
const CARRITO_MAX_EDAD_MS = 2 * 60 * 60 * 1000; // 2 horas

export function guardarCarritoDraft(cart) {
  try {
    if (!cart || cart.length === 0) {
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify({ cart, ts: Date.now() }));
  } catch { /* noop */ }
}

export function leerCarritoDraft() {
  try {
    const raw = localStorage.getItem(CARRITO_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > CARRITO_MAX_EDAD_MS) { localStorage.removeItem(CARRITO_STORAGE_KEY); return []; }
    return Array.isArray(data.cart) ? data.cart : [];
  } catch { return []; }
}
