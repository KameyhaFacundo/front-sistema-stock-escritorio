// Matching por nombre (aproximado) contra productos/proveedores ya cargados
// en el sistema — usado tanto por el escáner de facturas con IA como por la
// importación de compras desde Excel, para no pedirle al usuario que
// seleccione todo a mano cuando el nombre ya coincide razonablemente.

export function matchProducto(nombre, productos) {
  const n = (nombre || '').toLowerCase().trim();
  if (!n) return null;
  return (
    productos.find(p => p.nombre.toLowerCase() === n) ||
    productos.find(p => p.nombre.toLowerCase().includes(n)) ||
    productos.find(p => n.includes(p.nombre.toLowerCase())) ||
    null
  );
}

// Margen por defecto cuando no hay forma de saber a qué precio se vende algo
// (ver MARGEN_DEFAULT_PORCENTAJE más abajo).
const MARGEN_DEFAULT_PORCENTAJE = 0.30;

/**
 * Precio de venta sugerido para una línea de compra importada (escáner de IA
 * o Excel): si el producto ya existe en el catálogo, respeta el precio de
 * venta que ya tiene cargado (igual que al elegirlo a mano en el formulario).
 * Si es un producto nuevo sin precio de referencia, sugiere costo + 30% en
 * vez de dejarlo en $0 — el usuario lo revisa y ajusta antes de confirmar.
 */
export function precioVentaSugerido(costo, productoMatch) {
  const existente = productoMatch?.precioFinal ?? productoMatch?.precio;
  if (existente) return existente;
  const c = Number(costo) || 0;
  return c ? Math.round(c * (1 + MARGEN_DEFAULT_PORCENTAJE) * 100) / 100 : '';
}

export function matchProveedor(nombre, proveedores) {
  const n = (nombre || '').toLowerCase().trim();
  if (!n) return null;
  return (
    proveedores.find(p => p.nombre.toLowerCase() === n) ||
    proveedores.find(p => p.nombre.toLowerCase().includes(n)) ||
    proveedores.find(p => n.includes(p.nombre.toLowerCase())) ||
    null
  );
}
