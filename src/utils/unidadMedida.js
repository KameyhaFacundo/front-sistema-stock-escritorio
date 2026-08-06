// Solo ferretería puede tener productos en una unidad distinta de 'unidad'
// (kg/metro/litro) — para cualquier otro rubro esto ni se usa, todo producto
// tiene 'unidad' y abrevUnidad devuelve 'u' como siempre.
const UNIDAD_ABREV = { unidad: 'u', kg: 'kg', metro: 'm', litro: 'L' };

// Mismas 4 unidades que el Select de "Unidad de medida" del formulario de
// productos — usado para escribir/leer la columna "Unidad" en export/import
// de Excel (Productos y Compras).
export const UNIDAD_LABEL = { unidad: 'Unidad', kg: 'Kilogramo (kg)', metro: 'Metro (m)', litro: 'Litro (L)' };

export const parseUnidad = (raw) => {
  const v = String(raw || '').toLowerCase();
  if (v.includes('kg') || v.includes('kilo')) return 'kg';
  if (v.includes('litro') || v === 'l') return 'litro';
  if (v.includes('metro') || v === 'm') return 'metro';
  return 'unidad';
};

export const esFraccionable = (unidadMedida) => !!unidadMedida && unidadMedida !== 'unidad';

export const abrevUnidad = (unidadMedida) => UNIDAD_ABREV[unidadMedida] || 'u';
