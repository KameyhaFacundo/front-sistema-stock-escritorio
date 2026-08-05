export const CAMPOS_DEFAULT = [
  { key: 'codigo', visible: true,  x: 0.02, y: 0.02, w: 0.46, h: 0.16, fontSize: 8,  bold: false, align: 'left',   color: '#94a3b8', bgColor: null },
  { key: 'talle',  visible: true,  x: 0.52, y: 0.02, w: 0.46, h: 0.16, fontSize: 10, bold: true,  align: 'center', color: '#4f46e5', bgColor: null },
  { key: 'nombre', visible: true,  x: 0.02, y: 0.20, w: 0.96, h: 0.38, fontSize: 10, bold: true,  align: 'center', color: '#0f172a', bgColor: null },
  { key: 'precio', visible: true,  x: 0.00, y: 0.60, w: 1.00, h: 0.38, fontSize: 18, bold: true,  align: 'center', color: '#0f172a', bgColor: null },
];

export const CAMPO_LABELS = {
  codigo: 'Código',
  talle:  'Talle',
  nombre: 'Nombre',
  precio: 'Precio',
};

export const CAMPO_EJEMPLO = {
  codigo: '#PROD-001',
  talle:  'L',
  nombre: 'PRODUCTO EJEMPLO',
  precio: '$999,00',
};

export const migrarCampos = (campos) => {
  if (!campos || !campos.length) return CAMPOS_DEFAULT;
  const migrados = campos.map(c => {
    if (c.x !== undefined) return c;
    const def = CAMPOS_DEFAULT.find(d => d.key === c.key);
    return def ? { ...def, visible: c.visible !== undefined ? c.visible : def.visible } : null;
  }).filter(Boolean);
  const keys = new Set(migrados.map(c => c.key));
  const extras = CAMPOS_DEFAULT.filter(c => !keys.has(c.key));
  return [...migrados, ...extras];
};
