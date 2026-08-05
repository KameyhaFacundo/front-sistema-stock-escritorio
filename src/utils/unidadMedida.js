// Solo ferretería puede tener productos en una unidad distinta de 'unidad'
// (kg/metro/litro) — para cualquier otro rubro esto ni se usa, todo producto
// tiene 'unidad' y abrevUnidad devuelve 'u' como siempre.
const UNIDAD_ABREV = { unidad: 'u', kg: 'kg', metro: 'm', litro: 'L' };

export const esFraccionable = (unidadMedida) => !!unidadMedida && unidadMedida !== 'unidad';

export const abrevUnidad = (unidadMedida) => UNIDAD_ABREV[unidadMedida] || 'u';
