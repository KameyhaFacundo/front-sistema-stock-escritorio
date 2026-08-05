// ── Persistencia del cobro Point/QR pendiente (sobrevive a un F5) ──────
const INTENTO_STORAGE_KEY = 'pos_intento_pendiente';
const INTENTO_MAX_EDAD_MS = 20 * 60 * 1000;

export function guardarIntentoActivo(data) {
  try { localStorage.setItem(INTENTO_STORAGE_KEY, JSON.stringify({ ...data, ts: Date.now() })); } catch { /* noop */ }
}

export function leerIntentoActivo() {
  try {
    const raw = localStorage.getItem(INTENTO_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > INTENTO_MAX_EDAD_MS) { localStorage.removeItem(INTENTO_STORAGE_KEY); return null; }
    return data;
  } catch { return null; }
}

export function limpiarIntentoActivo() {
  try { localStorage.removeItem(INTENTO_STORAGE_KEY); } catch { /* noop */ }
}
