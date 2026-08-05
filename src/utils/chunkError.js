// Cada mensaje es de un motor distinto para el mismo problema (hash de
// chunk viejo, ya no existe tras un deploy nuevo): Chrome, Firefox, y
// Safari (que en vez de un error de red devuelve el HTML de fallback
// del SPA y se queja del MIME type al intentar ejecutarlo como script).
const CHUNK_ERROR_MESSAGES = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'is not a valid JavaScript MIME type',
  'Unable to preload module',
];

export function isChunkLoadError(error) {
  return CHUNK_ERROR_MESSAGES.some((msg) => error?.message?.includes(msg));
}

const RELOAD_KEY = '__chunk_reload_attempted__';

// Un solo intento de recarga por sesión de pestaña — evita el loop infinito
// si el chunk sigue faltando después de recargar (ej: caché de index.html
// desactualizado). Devuelve true si disparó la recarga (el llamador no debe
// renderizar nada más), false si ya se había intentado antes.
export function reloadOnceForChunkError() {
  if (sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.removeItem(RELOAD_KEY);
    return false;
  }
  sessionStorage.setItem(RELOAD_KEY, '1');
  window.location.reload();
  return true;
}
