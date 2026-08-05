import { PRIMARY_COLOR, COMPANY_NAME } from '../config/brand';

function hexToArgb(hex) {
  return `FF${hex.replace('#', '').toUpperCase()}`;
}

const ARGB_PRIMARY = hexToArgb(PRIMARY_COLOR);
const ARGB_WHITE    = 'FFFFFFFF';
const ARGB_INK      = 'FF1E2028';
const ARGB_MUTED    = 'FF6E7482';
const ARGB_ZEBRA    = 'FFF7F8FC';
const ARGB_BORDER   = 'FFE5E7EB';

/**
 * Genera y descarga un .xlsx con estética consistente en todo el sistema:
 * banner de título con el color de marca, columnas anchas, encabezado en
 * color, filas cebra, bordes suaves, autofiltro y fila de encabezado fija.
 *
 * @param {Object} opts
 * @param {string} opts.filename     — nombre de archivo, ej. "productos.xlsx"
 * @param {string} [opts.sheetName]  — nombre de la hoja
 * @param {string} [opts.title]      — título grande arriba (default: nombre de la empresa)
 * @param {string} [opts.subtitle]   — línea debajo del título (ej. rango de fechas)
 * @param {Array<{header: string, width?: number, numFmt?: string, align?: string}>} opts.columns
 * @param {Array<Array>} opts.rows   — filas de datos, en el mismo orden que `columns`
 */
export async function exportarExcel({ filename, sheetName = 'Datos', title, subtitle, columns, rows }) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY_NAME;
  wb.created = new Date();

  const sheet = wb.addWorksheet(sheetName, {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  sheet.columns = columns.map(c => ({ width: c.width ?? 16 }));

  let r = 1;

  // ── Banner de título ──
  const bannerTitle = title ?? COMPANY_NAME;
  sheet.mergeCells(r, 1, r, columns.length);
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = bannerTitle;
  titleCell.font = { bold: true, size: 16, color: { argb: ARGB_PRIMARY } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(r).height = 26;
  r++;

  if (subtitle) {
    sheet.mergeCells(r, 1, r, columns.length);
    const subCell = sheet.getCell(r, 1);
    subCell.value = subtitle;
    subCell.font = { italic: true, size: 10, color: { argb: ARGB_MUTED } };
    r++;
  }

  r++; // fila en blanco como separador

  // ── Encabezado de columnas ──
  const headerRowIndex = r;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_PRIMARY } };
    cell.font = { bold: true, size: 11, color: { argb: ARGB_WHITE } };
    cell.alignment = { vertical: 'middle', horizontal: c.align ?? 'left' };
  });
  headerRow.height = 22;
  headerRow.commit();
  r++;

  // ── Filas de datos, con cebra y bordes suaves ──
  rows.forEach((values, idx) => {
    const row = sheet.getRow(r);
    values.forEach((val, i) => {
      const col = columns[i];
      const cell = row.getCell(i + 1);
      cell.value = val;
      if (col.numFmt) cell.numFmt = col.numFmt;
      cell.alignment = { vertical: 'middle', horizontal: col.align ?? 'left' };
      cell.border = { bottom: { style: 'thin', color: { argb: ARGB_BORDER } } };
      cell.font = { color: { argb: ARGB_INK }, size: 10.5 };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_ZEBRA } };
      }
    });
    row.commit();
    r++;
  });

  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to:   { row: headerRowIndex, column: columns.length },
  };
  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
