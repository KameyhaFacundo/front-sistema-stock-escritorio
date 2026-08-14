// Matching por nombre (aproximado) contra productos/proveedores ya cargados
// en el sistema — usado tanto por el escáner de facturas con IA como por la
// importación de compras desde Excel, para no pedirle al usuario que
// seleccione todo a mano cuando el nombre ya coincide razonablemente.

// codigo es opcional (tercer parámetro) — si viene, matchea PRIMERO por
// código exacto (mucho más confiable: no depende de que el texto del nombre
// coincida letra por letra, ver ImportarExcelModal.jsx) y solo si no
// encuentra nada cae al matching aproximado por nombre de siempre.
export function matchProducto(nombre, productos, codigo) {
  const c = (codigo || '').toLowerCase().trim();
  if (c) {
    const porCodigo = productos.find(p => (p.codigo || '').toLowerCase().trim() === c);
    if (porCodigo) return porCodigo;
  }
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
 * o Excel): siempre costo + 30%, sin importar si el producto ya existe en el
 * catálogo. Antes, si ya existía, se respetaba el precio de venta que ya
 * tenía cargado — pero ese precio quedaba calculado contra un costo VIEJO,
 * no el de esta compra: si el costo nuevo subió mucho, el margen daba
 * negativo (venta por debajo del costo) sin que nadie lo pidiera. Se revisa
 * y ajusta antes de confirmar de cualquier forma, así que directamente se
 * parte siempre del mismo 30% en vez de dejarlo en $0 (producto nuevo) o en
 * un margen roto (producto existente con costo desactualizado).
 */
export function precioVentaSugerido(costo) {
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
