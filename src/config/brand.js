// ── Brand & app configuration ──────────────────────────────────────────────
// All values come from environment variables so each deployment (client) can
// be customised without touching source code. Set them in .env (local) or in
// the hosting platform's env settings (e.g. Vercel).

export const APP_NAME      = import.meta.env.VITE_APP_NAME      || 'Kamex Solutions';
export const APP_TAGLINE   = import.meta.env.VITE_APP_TAGLINE   || 'Sistema de gestión de inventario';
export const COMPANY_NAME  = import.meta.env.VITE_COMPANY_NAME  || 'Mi Negocio';
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

// En el build de escritorio, escritorio-launcher/scripts/build-resources.js
// manda su propio package.json.version acá — así el "v0.1.2" del pie del
// sidebar es siempre el mismo número que el instalador/actualizador, no un
// valor fijo suelto en el código.
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Logo completo (isotipo + wordmark). El wordmark oscuro se pierde sobre
// fondos oscuros, así que hay una variante clara para modo oscuro — usar el
// hook useLogo() en vez de importar estas constantes directamente en
// componentes. El archivo real tiene que existir en public/ (ver
// clients/README.md para el flujo de armar el build de un cliente puntual).
export const LOGO_URL      = import.meta.env.VITE_LOGO_URL      || '/img/kamex_negro.png';
export const LOGO_URL_DARK = import.meta.env.VITE_LOGO_URL_DARK || '/img/kamex_blanco.png';

// Primary brand color and its hover/active shade.
// Must be a valid CSS hex color string (e.g. #5c6ef8).
const hexColorRx = /^#[0-9a-fA-F]{6}$/;

function validHex(val, fallback) {
  const clean = val?.trim();
  return hexColorRx.test(clean) ? clean : fallback;
}

export const PRIMARY_COLOR = validHex(import.meta.env.VITE_PRIMARY_COLOR, '#5c6ef8');
export const PRIMARY_HOVER = validHex(import.meta.env.VITE_PRIMARY_HOVER, '#4a5cf0');

// Cobrar con Point (lector de tarjeta Mercado Pago) deshabilitado temporalmente
// a pedido — no afecta a QR. Para reactivarlo, poner VITE_POINT_HABILITADO=true
// en el .env de este build (y POINT_HABILITADO=true en el .env del backend,
// ver PagoPointController::crearIntento).
export const POINT_HABILITADO = import.meta.env.VITE_POINT_HABILITADO === 'true';

// Módulo opcional, apagado por default — el ejemplo de referencia para
// "este cliente puntual quiere ver un módulo que otros no": no hace falta
// tocar código ni tener una base compartida con flags por empresa, alcanza
// con poner VITE_CATALOGO_HABILITADO=true en el .env de ESE build (ver
// clients/README.md). El backend (CatalogoController) y la ruta pública
// /catalogo/:slug ya funcionan siempre — esto solo prende el acceso desde
// Configuración para poder activarlo/copiar el link.
export const CATALOGO_HABILITADO = import.meta.env.VITE_CATALOGO_HABILITADO === 'true';
