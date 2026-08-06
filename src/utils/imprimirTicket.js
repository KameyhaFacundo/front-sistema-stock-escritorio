import QRCode from 'qrcode';
import { fmtMoney } from './format';
import { COMPANY_NAME } from '../config/brand';
import { esFraccionable, abrevUnidad } from './unidadMedida';

// Mismo enfoque que back-comercial/front-comercial: arma un HTML autocontenido
// (sin depender del layout/CSS de la app) y lo manda a una ventana nueva para
// imprimir — evita los problemas de recorte de #ticket-print dentro del shell
// fijo de la app (ver DefaultLayout.jsx / #app-shell). El formato de la
// factura (razón social, condición del receptor, "Código NN", régimen de
// transparencia fiscal) calca el de back-comercial/front-comercial.

const METODO_LABELS = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', fiado: 'Fiado',
};

const TIPO_LABELS = { 1: 'Factura A', 6: 'Factura B', 11: 'Factura C', 3: 'Nota de Crédito A', 8: 'Nota de Crédito B', 13: 'Nota de Crédito C' };

// Los datos interpolados (nombre de cliente/producto, dirección, etc.) vienen
// de la empresa/sus clientes — sin escapar, un nombre con "<" o "&" rompe el
// HTML o (peor) inyecta markup en la ventana de impresión.
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtCuit(cuit) {
  if (!cuit) return '';
  const s = String(cuit).replace(/\D/g, '');
  if (s.length === 11) return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}`;
  return cuit;
}

function fmtFecha(f) {
  if (!f) return '';
  const s = String(f);
  if (s.length === 10 && s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

async function generarTicketHtml(data, empresa, factura) {
  const {
    ticketId, fecha, hora, items, subtotal, ajuste, total, metodo,
    pagos, cliente, clienteCondicionIva, efectivoRecibido, vuelto, vendedor,
  } = data;

  const storeName = empresa?.nombre || COMPANY_NAME;
  const esFactura = Boolean(factura?.cae);
  const esNotaCredito = factura?.tipoComprobante && [3, 8, 13].includes(factura.tipoComprobante);
  const tipoLabel = (TIPO_LABELS[factura?.tipoComprobante] || '').toUpperCase();
  // El "código de comprobante" AFIP es el propio tipo_comprobante, con padding
  // a 2 dígitos (1 → "01", 6 → "06", 11 → "11").
  const codigoComprobante = factura?.tipoComprobante != null ? String(factura.tipoComprobante).padStart(2, '0') : '';
  const comprobanteNro = factura?.numeroCompleto || '';
  const esConsumidorFinal = !cliente || cliente === 'Consumidor Final';

  // QR de ARCA/AFIP — mismo qrUrl que ya arma el backend (Factura.php) con
  // los campos oficiales (ver/fecha/cuit/ptoVta/tipoCmp/nroCmp/...), acá solo
  // se lo convierte a imagen (misma lib "qrcode" que ya se usaba antes).
  const qrImagen = factura?.qrUrl
    ? await QRCode.toDataURL(factura.qrUrl, { margin: 1, width: 260 })
    : null;

  const itemsBlocks = items.map((item) => {
    const cantidadLabel = esFraccionable(item.unidadMedida) ? `${item.cantidad} ${abrevUnidad(item.unidadMedida)}` : item.cantidad;
    return `
    <div class="tk-item">
      <div class="tk-row"><span>${cantidadLabel} x ${fmtMoney(item.precio)}</span><span>${fmtMoney(item.precio * item.cantidad)}</span></div>
      <div class="tk-desc">${esc(item.nombre)}</div>
      ${item.codigo ? `<div class="tk-codigo">Cod: ${esc(item.codigo)}</div>` : ''}
    </div>`;
  }).join('');

  const pagosRows = pagos
    ? pagos.map((p) => `<div class="tk-row"><span>${esc(METODO_LABELS[p.metodo] || p.metodo)}:</span><span>${fmtMoney(p.monto)}</span></div>`).join('')
    : `<div class="tk-row"><span>${esc(METODO_LABELS[metodo] || metodo)}:</span><span>${fmtMoney(total)}</span></div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Ticket ${esc(ticketId ?? '')}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #000; font-family: 'Courier New', Courier, monospace; font-size: 10pt; line-height: 1.4; }
  #ticket-print { width: 76mm; margin: 0 auto; padding: 4mm 3mm; }
  .tk-center  { text-align: center; }
  .tk-logo    { display: flex; justify-content: center; margin-bottom: 3mm; }
  .tk-logo img { max-width: 55mm; max-height: 20mm; }
  .tk-store   { font-size: 15pt; font-weight: bold; letter-spacing: 1px; }
  .tk-sub     { font-size: 9pt; color: #555; margin-bottom: 2mm; }
  .tk-sep     { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
  .tk-sep-sol { border: none; border-top: 2px solid #000; margin: 2mm 0; }
  .tk-row     { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 1mm; }
  .tk-item    { margin-bottom: 2mm; }
  .tk-desc    { font-size: 9.5pt; }
  .tk-total   { display: flex; justify-content: space-between; font-size: 13pt; font-weight: bold; margin: 1mm 0; }
  .tk-footer  { text-align: center; font-size: 11pt; font-weight: bold; margin-top: 3mm; }
  .tk-fiscal  { font-size: 9pt; margin-bottom: 0.5mm; }
  .tk-comprobante { font-size: 13pt; font-weight: bold; }
  .tk-section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1mm; margin-bottom: 1mm; text-align: center; }
  .tk-totales { font-size: 9.5pt; }
  .tk-codigo  { font-size: 8pt; color: #444; }
  .tk-cae-section { font-size: 8.5pt; }
</style>
</head>
<body>
  <div id="ticket-print">
    <div class="tk-logo">
      ${empresa?.logo_url ? `<img src="${empresa.logo_url}" alt="${esc(storeName)}" />` : `<div class="tk-store">${esc(storeName)}</div>`}
    </div>

    <div class="tk-fiscal">Razón social: ${esc(storeName)}</div>
    ${empresa?.direccion ? `<div class="tk-fiscal">Dirección: ${esc(empresa.direccion)}</div>` : ''}
    ${empresa?.cuit ? `<div class="tk-fiscal">C.U.I.T.: ${esc(fmtCuit(empresa.cuit))}</div>` : ''}
    ${empresa?.condicion_fiscal ? `<div class="tk-fiscal">${esc(empresa.condicion_fiscal)}</div>` : ''}
    ${empresa?.iibb ? `<div class="tk-fiscal">IIBB: ${esc(empresa.iibb)}</div>` : ''}
    ${empresa?.inicio_actividad ? `<div class="tk-fiscal">Inicio de actividad: ${esc(fmtFecha(empresa.inicio_actividad))}</div>` : ''}
    ${empresa?.whatsapp ? `<div class="tk-fiscal">Tel: ${esc(empresa.whatsapp)}</div>` : ''}
    ${empresa?.email ? `<div class="tk-fiscal">Email: ${esc(empresa.email)}</div>` : ''}
    ${vendedor ? `<div class="tk-fiscal">Vendedor: ${esc(vendedor)}</div>` : ''}

    <hr class="${esFactura ? 'tk-sep-sol' : 'tk-sep'}" />
    <div class="tk-center">
      ${esFactura ? `
        <div class="tk-comprobante">${esc(tipoLabel)}</div>
        <div class="tk-sub">Código ${esc(codigoComprobante)}</div>
        <div class="tk-fiscal">Nro comp: ${esc(comprobanteNro)}</div>
        <div class="tk-fiscal">Fecha: ${esc(fmtFecha(factura.fecha))}</div>
      ` : `
        <div class="tk-comprobante">Ticket de Venta</div>
        <div class="tk-sub">#${esc(ticketId)} &middot; ${esc(fecha)} ${esc(hora)}</div>
      `}
    </div>

    ${esFactura ? `
      <hr class="tk-sep" />
      <div class="tk-fiscal">A ${esc((clienteCondicionIva || 'Consumidor Final').toUpperCase())}</div>
      ${!esConsumidorFinal ? `<div class="tk-fiscal">${esc(cliente).toUpperCase()}</div>` : ''}
      ${factura.numeroDocumento ? `<div class="tk-fiscal">DNI/CUIT: ${esc(factura.numeroDocumento)}</div>` : ''}
    ` : (!esConsumidorFinal ? `
      <hr class="tk-sep" />
      <div class="tk-section-title">CLIENTE</div>
      <div class="tk-fiscal">${esc(cliente)}</div>
    ` : '')}

    <hr class="tk-sep" />
    ${itemsBlocks}

    <hr class="tk-sep-sol" />
    <div class="tk-totales">
      ${esFactura ? `
        <div class="tk-row"><span>Subtotal</span><span>${fmtMoney(factura.neto)}</span></div>
        <div class="tk-row"><span>IVA</span><span>${fmtMoney(factura.iva)}</span></div>
      ` : `
        <div class="tk-row"><span>Subtotal:</span><span>${fmtMoney(subtotal)}</span></div>
        ${ajuste ? `
          <div class="tk-row">
            <span>${ajuste.tipo === 'descuento' ? 'Descuento' : 'Recargo'}${ajuste.calculo === 'porcentaje' ? ` (${ajuste.valor}%)` : ''}:</span>
            <span>${ajuste.tipo === 'descuento' ? '-' : '+'}${fmtMoney(ajuste.monto)}</span>
          </div>
        ` : ''}
      `}
      <hr class="tk-sep-sol" />
      <div class="tk-total"><span>TOTAL:</span><span>${fmtMoney(total)}</span></div>
    </div>

    <hr class="tk-sep" />
    <div class="tk-section-title">FORMA DE PAGO</div>
    ${pagosRows}

    ${efectivoRecibido != null ? `
      <div class="tk-row"><span>Efectivo recibido:</span><span>${fmtMoney(efectivoRecibido)}</span></div>
      ${vuelto > 0 ? `<div class="tk-row"><span>Vuelto:</span><span>${fmtMoney(vuelto)}</span></div>` : ''}
    ` : ''}

    ${esFactura ? `
      <hr class="tk-sep" />
      <div class="tk-fiscal">El precio incluye impuestos nacionales.</div>
      <div class="tk-fiscal">IVA: ${fmtMoney(factura.iva)}</div>
      <div class="tk-fiscal">Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)</div>

      <hr class="tk-sep" />
      <div class="tk-cae-section">
        <div class="tk-row"><span>CAE:</span><span>${esc(factura.cae)}</span></div>
        <div class="tk-row"><span>Vto:</span><span>${esc(fmtFecha(factura.vencimientoCae))}</span></div>
        ${qrImagen ? `<div class="tk-center" style="margin-top:6px"><img src="${qrImagen}" alt="QR ARCA" width="130" height="130" style="display:block;margin:0 auto" /></div>` : ''}
        ${esNotaCredito ? '<div class="tk-fiscal" style="text-align:center;margin-top:4px">Esta Nota de Crédito anula total o parcialmente el comprobante original.</div>' : ''}
      </div>
    ` : `
      <hr class="tk-sep" />
      <div class="tk-footer">${factura?.estado === 'pendiente'
        ? 'Comprobante pendiente de confirmación ARCA — se emite solo apenas vuelva la conexión'
        : 'Comprobante no válido como factura'}</div>
      <div class="tk-footer">¡Gracias por su compra!</div>
    `}
    <div style="height:5mm"></div>
  </div>
</body>
</html>`;
}

/**
 * Si la app de escritorio tiene una impresora del sistema disponible, imprime
 * directo y en silencio (sin diálogo) vía el puente de Electron
 * (electron/preload.js + main.js). Si no hay impresora, o estamos en
 * `pnpm dev`/demo mode (window.electronAPI no existe ahí), cae al flujo de
 * siempre: abre una ventana con el ticket armado y dispara el diálogo de
 * impresión del navegador — mismo enfoque que front-comercial.
 */
export async function imprimirTicket(data, empresa, factura) {
  if (!data) return;
  const html = await generarTicketHtml(data, empresa, factura);

  if (window.electronAPI?.imprimirTicket) {
    try {
      const { printed } = await window.electronAPI.imprimirTicket(html);
      if (printed) return;
    } catch {
      // Sigue al flujo de ventana de abajo — no hay impresora o falló, el
      // usuario igual necesita ver el ticket.
    }
  }

  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) throw new Error('No se pudo abrir la ventana de impresión — habilitá las ventanas emergentes para este sitio.');

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.addEventListener('load', () => win.print());
}
