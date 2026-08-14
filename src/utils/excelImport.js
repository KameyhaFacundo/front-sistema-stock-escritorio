// Lee un .xlsx de un proveedor y devuelve las líneas de producto que
// encuentra — usado por "Importar Excel" en Compras. No usa IA (es
// parseo directo de celdas), así que no tiene costo de tokens ni
// depende de ningún proveedor externo.

const ALIAS_NOMBRE    = ['nombre', 'producto', 'artículo', 'articulo', 'descripcion', 'descripción', 'detalle'];
const ALIAS_CANTIDAD  = ['cantidad', 'cant', 'cant.', 'unidades', 'qty'];
const ALIAS_PRECIO    = ['precio', 'costo', 'precio unitario', 'precio_unitario', 'valor', 'importe'];
const ALIAS_CODIGO    = ['codigo', 'código', 'cod', 'sku'];

function normalizar(v) {
  return String(v ?? '').trim().toLowerCase();
}

function parseNumero(v) {
  if (typeof v === 'number') return v;
  const limpio = String(v ?? '').replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : null;
}

/**
 * Busca en la fila de encabezados a qué columna corresponde nombre/cantidad/
 * precio. Si no encuentra ninguno reconocible, devuelve null (el llamador
 * debe asumir el orden posicional A/B/C y arrancar desde la primera fila).
 */
function detectarColumnas(filaEncabezado) {
  const celdas = filaEncabezado.map(normalizar);
  // Coincidencia parcial (no exacta): un encabezado real de proveedor rara vez
  // va a decir literalmente "precio" — suele ser "Precio Unit.", "P. Unitario
  // ($)", etc. Buscamos el alias como substring, no como texto idéntico.
  const buscar = (alias) => celdas.findIndex(c => c && alias.some(a => c.includes(a)));

  const iNombre   = buscar(ALIAS_NOMBRE);
  const iCantidad = buscar(ALIAS_CANTIDAD);
  const iPrecio   = buscar(ALIAS_PRECIO);
  // Código es opcional (no cuenta para decidir si hay encabezado reconocible
  // más abajo) pero, si está, matchea contra el catálogo de forma exacta —
  // mucho más confiable que el nombre, que necesita coincidir letra por
  // letra para matchear (ver matchProducto en comprasMatching.js).
  const iCodigo   = buscar(ALIAS_CODIGO);

  if (iNombre === -1 && iCantidad === -1 && iPrecio === -1) return null;
  return {
    nombre:   iNombre   !== -1 ? iNombre   : 0,
    cantidad: iCantidad !== -1 ? iCantidad : 1,
    precio:   iPrecio   !== -1 ? iPrecio   : 2,
    codigo:   iCodigo,
  };
}

/**
 * exportarExcel() siempre antepone un banner de título + subtítulo + una
 * fila en blanco antes del encabezado real de columnas (ver excelExport.js).
 * Esas filas decorativas usan celdas combinadas (merge) — y ExcelJS, al leer
 * una celda combinada, repite el MISMO valor en cada celda del rango en vez
 * de dejar las demás vacías. Por eso no alcanza con contar celdas no vacías
 * (el título repetido 4 veces parecía una fila de 4 columnas reales): hay
 * que contar valores DISTINTOS. La fila en blanco tiene 0, el título/
 * subtítulo combinado tiene 1 (repetido), y la fila de encabezado real
 * tiene uno por columna. Así se puede reimportar el propio archivo que
 * generó "Exportar" sin que el preámbulo lo arruine.
 */
export function indiceEncabezado(filas) {
  const i = filas.findIndex(fila => {
    const distintos = new Set(fila.map(c => String(c ?? '').trim()).filter(v => v !== ''));
    return distintos.size >= 2;
  });
  return i === -1 ? 0 : i;
}

/** Parser de una línea CSV consciente de comillas (soporta "campos, con comas"). */
export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

async function leerFilasXlsx(file) {
  const ExcelJS = (await import('exceljs')).default;
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  if (!sheet) return [];
  const filas = [];
  sheet.eachRow((row) => {
    filas.push(row.values.slice(1).map(v => {
      const raw = (v && typeof v === 'object' && 'result' in v) ? v.result : v;
      return raw === null || raw === undefined ? '' : String(raw);
    }));
  });
  return filas;
}

/**
 * Lee un archivo .csv o .xlsx/.xls y devuelve sus filas como matriz de
 * strings — así el mismo código de importación sirve para cualquiera de
 * los dos formatos (ej. reimportar el propio .xlsx que genera "Exportar").
 * @param {File} file
 * @returns {Promise<string[][]>}
 */
export async function leerFilasArchivo(file) {
  const esXlsx = /\.xlsx?$/i.test(file.name) || (file.type || '').includes('spreadsheet');
  if (esXlsx) return leerFilasXlsx(file);
  const text = await file.text();
  return text.split('\n').filter(l => l.trim()).map(parseCSVLine);
}

/**
 * @param {File} file
 * @returns {Promise<Array<{nombre: string, codigo: string|null, cantidad: number, precio: number|null}>>}
 */
export async function leerExcelCompra(file) {
  const todasLasFilas = await leerFilasXlsx(file);
  if (!todasLasFilas.length) return [];
  const inicio = indiceEncabezado(todasLasFilas);
  const filas = todasLasFilas.slice(inicio);

  const cols = detectarColumnas(filas[0]);
  const desdeFila = cols ? 1 : 0; // si hay encabezado reconocible, lo saltea
  const { nombre: iNombre, cantidad: iCantidad, precio: iPrecio, codigo: iCodigo } = cols || { nombre: 0, cantidad: 1, precio: 2, codigo: -1 };

  const lineas = [];
  for (let i = desdeFila; i < filas.length; i++) {
    const fila = filas[i];
    const nombre = String(fila[iNombre] ?? '').trim();
    const codigo = iCodigo != null && iCodigo !== -1 ? String(fila[iCodigo] ?? '').trim() : '';
    if (!nombre && !codigo) continue;
    lineas.push({
      nombre: nombre || codigo,
      codigo: codigo || null,
      cantidad: parseNumero(fila[iCantidad]) || 1,
      precio: parseNumero(fila[iPrecio]),
    });
  }
  return lineas;
}

/**
 * Detecta a qué columna corresponde nombre/código/cantidad — mismo criterio
 * que detectarColumnas() pero para el formato que exporta Movimientos
 * (Producto, Código, Cantidad), pensado para poder reimportarse tal cual.
 */
function detectarColumnasMovimiento(filaEncabezado) {
  const celdas = filaEncabezado.map(normalizar);
  const buscar = (alias) => celdas.findIndex(c => c && alias.some(a => c.includes(a)));

  const iNombre   = buscar(ALIAS_NOMBRE);
  const iCodigo   = buscar(ALIAS_CODIGO);
  const iCantidad = buscar(ALIAS_CANTIDAD);

  if (iNombre === -1 && iCodigo === -1 && iCantidad === -1) return null;
  return {
    nombre:   iNombre   !== -1 ? iNombre   : 0,
    codigo:   iCodigo   !== -1 ? iCodigo   : 1,
    cantidad: iCantidad !== -1 ? iCantidad : 2,
  };
}

/**
 * Lee el .xlsx/.csv que exporta "Movimientos" (Producto, Código, Cantidad) —
 * pensado para transferir mercadería entre dos instalaciones separadas: se
 * exporta acá, se importa en la otra. El código es la clave real de matching
 * (se resuelve contra el catálogo en el llamador); el nombre es solo para
 * mostrarlo en la vista previa si el código no se encuentra.
 * @param {File} file
 * @returns {Promise<Array<{nombre: string, codigo: string, cantidad: number}>>}
 */
export async function leerExcelMovimientos(file) {
  const todasLasFilas = await leerFilasArchivo(file);
  if (!todasLasFilas.length) return [];
  const inicio = indiceEncabezado(todasLasFilas);
  const filas = todasLasFilas.slice(inicio);

  const cols = detectarColumnasMovimiento(filas[0]);
  const desdeFila = cols ? 1 : 0;
  const { nombre: iNombre, codigo: iCodigo, cantidad: iCantidad } = cols || { nombre: 0, codigo: 1, cantidad: 2 };

  const lineas = [];
  for (let i = desdeFila; i < filas.length; i++) {
    const fila = filas[i];
    const nombre = String(fila[iNombre] ?? '').trim();
    const codigo = String(fila[iCodigo] ?? '').trim();
    if (!nombre && !codigo) continue;
    lineas.push({
      nombre,
      codigo,
      cantidad: parseNumero(fila[iCantidad]) || 1,
    });
  }
  return lineas;
}
