import { useState, useMemo, useEffect, useCallback, useContext, useRef } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, Chip, Collapse, Tooltip, Select, MenuItem, FormControl, LinearProgress,
} from '@mui/material';
import SearchIcon         from '@mui/icons-material/Search';
import AddIcon            from '@mui/icons-material/Add';
import CloseIcon          from '@mui/icons-material/Close';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import PaymentIcon        from '@mui/icons-material/Payment';
import WhatsAppIcon       from '@mui/icons-material/WhatsApp';
import PictureAsPdfIcon   from '@mui/icons-material/PictureAsPdf';
import GroupIcon          from '@mui/icons-material/Group';
import LocalAtmIcon       from '@mui/icons-material/LocalAtm';
import CreditCardIcon     from '@mui/icons-material/CreditCard';
import PhoneIphoneIcon    from '@mui/icons-material/PhoneIphone';
import QrCodeIcon         from '@mui/icons-material/QrCode';
import PaymentsIcon       from '@mui/icons-material/Payments';
import EventIcon          from '@mui/icons-material/Event';
import NotesIcon          from '@mui/icons-material/Notes';
import DeleteIcon         from '@mui/icons-material/Delete';
import EditIcon           from '@mui/icons-material/Edit';
import FileUploadIcon     from '@mui/icons-material/FileUpload';
import FileDownloadIcon   from '@mui/icons-material/FileDownload';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import jsPDF              from 'jspdf';
import autoTable          from 'jspdf-autotable';

import { COMPANY_NAME, PRIMARY_COLOR }   from '../../config/brand';
import { AuthContext } from '../../auth/AuthContextBase';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, INPUT, TABLE_HEADER, fieldSx, modalPaperSx,
         SUCCESS, SUCCESS_BG, SUCCESS_BORDER, SUCCESS_LIGHT, SUCCESS_HOVER,
         ERROR, ERROR_BG, ERROR_BORDER, WARNING, WARNING_BG } from '../../theme/tokens';
import { useIsMobile } from '../../utils/responsive';
import { useToast }    from '../../context/ToastContext';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import { exportarExcel } from '../../utils/excelExport';
import { leerFilasArchivo, indiceEncabezado } from '../../utils/excelImport';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmDialog   from '../../components/shared/ConfirmDialog';
import PaymentModal    from '../../components/shared/PaymentModal';
import AyudaButton     from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { clientesService }          from '../../services/clientesService';
import { deudasClientesService }    from '../../services/deudasClientesService';
import DEUDA_COLORS from '../../constants/deudaStatus';

/* ── Exportar / Importar Excel ── */
function exportarCSVClientes(rows) {
  exportarExcel({
    filename: 'clientes.xlsx',
    sheetName: 'Clientes',
    subtitle: `Listado de clientes · ${new Date().toLocaleDateString('es-AR')}`,
    columns: [
      { header: 'Nombre',    width: 30 },
      { header: 'CUIT',      width: 16 },
      { header: 'Teléfono',  width: 16 },
      { header: 'Email',     width: 26 },
      { header: 'Dirección', width: 30 },
    ],
    rows: rows.map(c => [c.nombre, c.cuit || '', c.telefono || '', c.email || '', c.direccion || '']),
  });
}

const labelSx = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 };

/* ── Helpers de color para PDF (jsPDF quiere RGB 0-255, no hex) ── */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

const PDF_PRIMARY = hexToRgb(PRIMARY_COLOR);
const PDF_INK      = [30, 32, 40];
const PDF_MUTED    = [110, 116, 130];
const PDF_ESTADO   = {
  pendiente: { fill: [239, 68, 68],  label: 'Pendiente' },
  parcial:   { fill: [245, 158, 11], label: 'Parcial'   },
  pagado:    { fill: [34, 197, 94],  label: 'Pagado'    },
};

/* ── PDF de deudas ── */
function generarPdfDeudas(cliente, deudas, empresa) {
  const doc   = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const hoy   = new Date().toLocaleDateString('es-AR');
  const total = deudas.reduce((s, d) => s + d.saldo, 0);

  // ── Encabezado con banda de color de marca ──
  doc.setFillColor(...PDF_PRIMARY);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(empresa?.nombre || COMPANY_NAME, 14, 18);
  doc.setFontSize(10.5);
  doc.setFont(undefined, 'normal');
  doc.text('Cuenta corriente de cliente', 14, 26);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const datosEmpresa = [empresa?.cuit && `CUIT ${empresa.cuit}`, empresa?.direccion]
    .filter(Boolean).join('  ·  ');
  if (datosEmpresa) doc.text(datosEmpresa, pageW - 14, 14, { align: 'right' });
  doc.text(`Emitido: ${hoy}`, pageW - 14, 26, { align: 'right' });

  // ── Datos del cliente ──
  let y = 44;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...PDF_INK);
  doc.text(cliente.nombre, 14, y);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_MUTED);
  const datosCliente = [cliente.cuit && `CUIT/DNI ${cliente.cuit}`, cliente.telefono, cliente.email]
    .filter(Boolean).join('  ·  ');
  if (datosCliente) { y += 6; doc.text(datosCliente, 14, y); }

  y += 10;

  // Detalle por cada venta
  deudas.forEach((d, i) => {
    const estado = PDF_ESTADO[d.estado_pago] || PDF_ESTADO.pendiente;

    // Título de la venta + pill de estado
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...PDF_INK);
    let subtitulo = `Venta #${d.id}   ·   ${fmtDate(d.fecha)}`;
    if (d.vendedor) subtitulo += `   ·   Vendedor: ${d.vendedor}`;
    doc.text(subtitulo, 14, y);

    const pillLabel = estado.label;
    const pillW = doc.getTextWidth(pillLabel) + 8;
    doc.setFillColor(...estado.fill);
    doc.roundedRect(pageW - 14 - pillW, y - 5, pillW, 6.5, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(pillLabel, pageW - 14 - pillW / 2, y - 0.7, { align: 'center' });

    doc.setFont(undefined, 'normal');
    y += 3;

    // Tabla de productos de esa venta
    const lineas = d.lineas || [];
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Cant.', 'Precio unit.', 'Subtotal']],
      body: lineas.length > 0
        ? lineas.map(l => [
            l.nombre,
            l.cantidad,
            fmtMoney(l.precio),
            fmtMoney(l.subtotal),
          ])
        : [['Sin detalle de productos', '', '', '']],
      foot: [
        ['', '', 'Total venta:',      fmtMoney(d.total)],
        ['', '', 'Cobrado:',          fmtMoney(d.cobrado)],
        ['', '', 'Saldo pendiente:',  fmtMoney(d.saldo)],
      ],
      styles:       { fontSize: 9 },
      headStyles:   { fillColor: PDF_PRIMARY, textColor: 255, fontSize: 9 },
      footStyles:   { fillColor: [245, 246, 250], textColor: PDF_INK, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + (i < deudas.length - 1 ? 12 : 8);
  });

  // ── Resumen total, en caja de color ──
  const totalLabel = `TOTAL PENDIENTE: ${fmtMoney(total)}`;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  const totalW = doc.getTextWidth(totalLabel) + 12;
  doc.setFillColor(...PDF_PRIMARY);
  doc.roundedRect(pageW - 14 - totalW, y, totalW, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(totalLabel, pageW - 14 - totalW / 2, y + 6.7, { align: 'center' });

  doc.save(`cuenta-corriente-${cliente.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

/* ── WhatsApp de deudas ── */
function abrirWhatsApp(cliente, deudas) {
  const hoy   = new Date().toLocaleDateString('es-AR');
  const total = deudas.reduce((s, d) => s + d.saldo, 0);

  const bloques = deudas.map(d => {
    const items = (d.lineas || [])
      .map(l => `   - ${l.nombre} x${l.cantidad}  $${l.precio.toLocaleString('es-AR')} c/u = *$${l.subtotal.toLocaleString('es-AR')}*`)
      .join('\n');
    return [
      `*Venta #${d.id}* - ${fmtDate(d.fecha)}`,
      items || '   (sin detalle de productos)',
      `   Saldo pendiente: *$${d.saldo.toLocaleString('es-AR')}*`,
    ].join('\n');
  }).join('\n\n');

  const msg = `Hola ${cliente.nombre}!\nTe enviamos el resumen de tu cuenta corriente al ${hoy}:\n\n${bloques}\n\n*Total pendiente: $${total.toLocaleString('es-AR')}*\n\nGracias por tu confianza!`;
  const phone = (cliente.telefono || '').replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function abrirWhatsAppResumen(cliente, saldo) {
  const msg = `Hola ${cliente.nombre}!\nTe recordamos que tenes una deuda pendiente de *$${saldo.toLocaleString('es-AR')}*. Gracias!`;
  const phone = (cliente.telefono || '').replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── Modal cliente (crear + editar, un solo componente) ── */
function ModalCliente({ open, onClose, onGuardar, cliente }) {
  const toast = useToast();
  const esEdicion = Boolean(cliente);
  const empty = { persona: '', telefono: '', cuit: '', email: '', direccion: '', condicionIva: '' };
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(cliente ? {
      persona:   cliente.nombre    || '',
      telefono:  cliente.telefono  || '',
      cuit:      cliente.cuit      || '',
      email:     cliente.email     || '',
      direccion: cliente.direccion || '',
      condicionIva: cliente.condicionIva || '',
    } : empty);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente]);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const validate = () => {
    const errs = {};
    if (!form.persona.trim()) errs.persona = 'El nombre es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { condicionIva, ...resto } = form;
      const payload = { ...resto, cuit: form.cuit.trim() || null, condicion_iva: condicionIva || null };
      const resultado = esEdicion
        ? await clientesService.update(cliente.id, payload)
        : await clientesService.create({ ...payload, estado: true });
      onGuardar(resultado, esEdicion);
      toast(esEdicion ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', 'success');
      onClose();
    } catch (e) {
      // errors.* primero — el "message" genérico de una 422 de validación
      // ("The given data was invalid.") no dice nada útil, lo que importa es
      // el mensaje puntual del campo (ver CreateClienteRequest::messages()).
      const errores = e.response?.data?.errors;
      toast(errores?.email?.[0] || errores?.cuit?.[0] || e.response?.data?.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} el cliente`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>{esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</Typography>
        <IconButton data-tour="cli-modal-cerrar" size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box data-tour="cli-modal-datos" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Nombre *</Typography>
            <TextField fullWidth placeholder="Juan García" value={form.persona} onChange={set('persona')} error={!!errors.persona} helperText={errors.persona} sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>CUIT / DNI</Typography>
            <TextField fullWidth placeholder="20-12345678-9" value={form.cuit} onChange={set('cuit')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Teléfono</Typography>
            <TextField fullWidth placeholder="+54 11 1234-5678" value={form.telefono} onChange={set('telefono')} sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Email</Typography>
            <TextField fullWidth placeholder="correo@ejemplo.com" value={form.email} onChange={set('email')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Dirección</Typography>
            <TextField fullWidth placeholder="Dirección completa" value={form.direccion} onChange={set('direccion')} sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Condición frente al IVA</Typography>
            <FormControl fullWidth>
              <Select value={form.condicionIva} onChange={set('condicionIva')} displayEmpty sx={fieldSx}
                renderValue={v => v || <Box component="span" sx={{ color: MUTED }}>Consumidor Final</Box>}>
                <MenuItem value="">Sin especificar</MenuItem>
                {['Monotributista', 'Responsable Inscripto', 'Exento', 'Consumidor Final'].map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button data-tour="cli-modal-crear" variant="contained" onClick={handleGuardar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Cliente'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}


/* ── Modal saldar todas las deudas ── */
function ModalSaldarTodo({ open, onClose, deudas, onSaldado }) {
  const toast  = useToast();
  const hoy    = toLocalDateStr();
  const total  = deudas.reduce((s, d) => s + d.saldo, 0);
  const [form, setForm]   = useState({ fecha: hoy, metodo_pago: 'efectivo', nota: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSaldar = async () => {
    setSaving(true);
    try {
      for (const d of deudas) {
        await deudasClientesService.cobrar(d.id, {
          monto:       d.saldo,
          fecha:       form.fecha,
          metodo_pago: form.metodo_pago,
          nota:        form.nota || `Saldo total — ${new Date(form.fecha).toLocaleDateString('es-AR')}`,
        });
      }
      toast('Todas las deudas saldadas correctamente', 'success');
      onSaldado();
      onClose();
    } catch {
      toast('Error al registrar algún cobro', 'error');
    } finally {
      setSaving(false);
    }
  };

  const metodos = [
    { key: 'efectivo',      label: 'Efectivo',      Icon: LocalAtmIcon,    note: 'Suma al arqueo', color: SUCCESS,   bg: SUCCESS_BG },
    { key: 'transferencia', label: 'Transferencia', Icon: PhoneIphoneIcon, note: 'No afecta caja',  color: P,         bg: `${P}14` },
    { key: 'tarjeta',       label: 'Tarjeta',       Icon: CreditCardIcon,  note: 'No afecta caja',  color: WARNING,   bg: `${WARNING}14` },
    { key: 'qr',            label: 'QR / Billetera',Icon: QrCodeIcon,      note: 'No afecta caja',  color: '#a78bfa', bg: '#a78bfa18' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: '16px', overflow: 'hidden' } }}>

      {/* ── Header ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 1.5, sm: 4 }, pt: { xs: 1.75, sm: 3.5 }, pb: { xs: 1.5, sm: 2.5 }, bgcolor: CARD, borderBottom: `1px solid ${BORDER}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', bgcolor: `${SUCCESS}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <PaymentsIcon sx={{ color: SUCCESS, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }}>Saldar todo</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>
              {deudas.length} venta{deudas.length !== 1 ? 's' : ''} pendiente{deudas.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 4 }, pt: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 4 } }}>

        {/* ── Total ── */}
        <Box sx={{ p: 2.5, mb: 3.5, bgcolor: SUCCESS_BG, border: `1px solid ${SUCCESS_BORDER}`, borderRadius: '12px', textAlign: 'center' }}>
          <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
            Total a cobrar
          </Typography>
          <Typography sx={{ color: SUCCESS, fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em' }}>
            {fmtMoney(total)}
          </Typography>
        </Box>

        {/* ── Fecha + Método ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 2fr' }, gap: 3, mb: 3 }}>
          <Box>
            <Typography sx={labelSx}>Fecha</Typography>
            <TextField fullWidth type="date" value={form.fecha} onChange={set('fecha')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ color: MUTED, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={labelSx}>Método de pago</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
              {metodos.map(({ key, label, Icon, note, color, bg }) => {
                const active = form.metodo_pago === key;
                return (
                  <Box key={key} onClick={() => setForm(f => ({ ...f, metodo_pago: key }))}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      p: '11px 13px', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${active ? color : BORDER}`,
                      bgcolor: active ? bg : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: color, bgcolor: active ? bg : `${color}08` },
                    }}>
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '8px',
                      bgcolor: active ? `${color}25` : `${color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon sx={{ fontSize: 18, color: active ? color : MUTED }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: active ? INK : INK2, fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{label}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 10.5, whiteSpace: 'nowrap' }}>{note}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ── Nota ── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={labelSx}>Nota (opcional)</Typography>
          <TextField fullWidth placeholder="Ej: Pago total en efectivo" value={form.nota} onChange={set('nota')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NotesIcon sx={{ color: MUTED, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx} />
        </Box>

        {/* ── Actions ── */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button fullWidth onClick={onClose}
            sx={{
              color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.5,
              borderRadius: '12px', border: `1.5px solid ${BORDER}`,
              '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' },
            }}>
            Cancelar
          </Button>
          <Button fullWidth variant="contained" onClick={handleSaldar} disabled={saving}
            sx={{
              bgcolor: SUCCESS, textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.5,
              borderRadius: '12px', boxShadow: 'none',
              '&:hover': { bgcolor: SUCCESS_HOVER, boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: SUCCESS, opacity: 0.35, color: '#fff' },
            }}>
            {saving ? 'Registrando...' : `Cobrar ${fmtMoney(total)}`}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Fila de cliente ── */
function ClienteRow({ cliente, deudaResumen, onEditar, onEliminar, onCobrar }) {
  const { user } = useContext(AuthContext);
  const isMobile = useIsMobile();
  const [expanded,        setExpanded]        = useState(false);
  const [deudas,          setDeudas]          = useState([]);
  const [loadingD,        setLoadingD]        = useState(false);
  const [deudaCobrar,     setDeudaCobrar]     = useState(null);
  const [openSaldarTodo,  setOpenSaldarTodo]  = useState(false);
  const [lineasAbiertas,  setLineasAbiertas]  = useState(new Set());
  const [actualizandoId,  setActualizandoId]  = useState(null);
  const [reviertendoId,   setRevirtiendoId]   = useState(null);
  const [puntosMovs,      setPuntosMovs]      = useState(null);
  const [historial,       setHistorial]       = useState(null);
  const [loadingH,        setLoadingH]        = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const puntosActivo = Boolean(user?.empresa?.puntos_activo);
  const toast = useToast();

  const toggleLineas = (id) => setLineasAbiertas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleExpand = async () => {
    const nuevoEstado = !expanded;
    setExpanded(nuevoEstado);
    if (nuevoEstado && deudas.length === 0) {
      setLoadingD(true);
      try {
        const { deudas: d } = await deudasClientesService.getAll({ id_cliente: cliente.id });
        setDeudas(d);
      } catch { /* ignore */ } finally {
        setLoadingD(false);
      }
    }
    if (nuevoEstado && puntosActivo && puntosMovs === null) {
      clientesService.getPuntos(cliente.id)
        .then(({ movimientos }) => setPuntosMovs(movimientos))
        .catch(() => setPuntosMovs([]));
    }
  };

  // Ventas ya saldadas de este cliente — no aparecen en `deudas` (esa lista
  // solo trae pendiente/parcial a propósito), así que se piden aparte y se
  // muestran en una sección separada de solo lectura.
  const handleVerHistorial = async () => {
    const abrir = !historialAbierto;
    setHistorialAbierto(abrir);
    if (abrir && historial === null) {
      setLoadingH(true);
      try {
        const { deudas: todas } = await deudasClientesService.getAll({ id_cliente: cliente.id, incluir_pagadas: 1 });
        setHistorial(todas.filter(d => d.estado_pago === 'pagado'));
      } catch { setHistorial([]); } finally {
        setLoadingH(false);
      }
    }
  };

  // El historial de "ya saldadas" se cachea en `historial` (no null) una vez
  // que se abrió una vez — sin esto, pagar una deuda la sacaba de la lista de
  // pendientes pero nunca aparecía como saldada hasta recargar la página
  // entera (que remonta el componente y vuelve a pedir todo de cero).
  const refrescarHistorial = async () => {
    if (historial === null) return;
    try {
      const { deudas: todas } = await deudasClientesService.getAll({ id_cliente: cliente.id, incluir_pagadas: 1 });
      setHistorial(todas.filter(d => d.estado_pago === 'pagado'));
    } catch { /* deja el historial como estaba, no es crítico */ }
  };

  const handleCobrado = (actualizada) => {
    if (actualizada.estado_pago === 'pagado') {
      setDeudas(prev => prev.filter(d => d.id !== actualizada.id));
      refrescarHistorial();
    } else {
      setDeudas(prev => prev.map(d => d.id === actualizada.id ? actualizada : d));
    }
    onCobrar();
    setDeudaCobrar(null);
  };

  const handleActualizarPrecios = async (deudaId) => {
    setActualizandoId(deudaId);
    try {
      const actualizada = await deudasClientesService.actualizarPrecios(deudaId);
      setDeudas(prev => prev.map(d => d.id === deudaId ? actualizada : d));
      toast('Precios actualizados al valor actual', 'success');
      onCobrar();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al actualizar precios', 'error');
    } finally {
      setActualizandoId(null);
    }
  };

  const handleRevertirPrecios = async (deudaId) => {
    setRevirtiendoId(deudaId);
    try {
      const actualizada = await deudasClientesService.revertirPrecios(deudaId);
      setDeudas(prev => prev.map(d => d.id === deudaId ? actualizada : d));
      toast('Precios revertidos al valor original', 'success');
      onCobrar();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al revertir precios', 'error');
    } finally {
      setRevirtiendoId(null);
    }
  };

  const tieneDeuda   = deudaResumen && deudaResumen.saldo_pendiente > 0;
  const totalVentas  = deudas.reduce((s, d) => s + d.total,   0);
  const totalCobrado = deudas.reduce((s, d) => s + d.cobrado, 0);
  const totalSaldo   = deudas.reduce((s, d) => s + d.saldo,   0);

  return (
    <>
      {isMobile ? (
        <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{cliente.nombre}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12 }}>{cliente.cuit || '—'}</Typography>
            </Box>
            <Chip label={cliente.activo ? 'Activo' : 'Inactivo'} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: cliente.activo ? SUCCESS_BG : ERROR_BG, color: cliente.activo ? SUCCESS_LIGHT : ERROR, border: `1px solid ${cliente.activo ? SUCCESS_BORDER : ERROR_BORDER}` }} />
          </Box>
          {cliente.telefono && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
              <Typography
                onClick={deudaResumen?.saldo_pendiente > 0 ? e => { e.stopPropagation(); abrirWhatsAppResumen(cliente, deudaResumen.saldo_pendiente); } : undefined}
                sx={{ color: INK2, fontSize: 13, cursor: deudaResumen?.saldo_pendiente > 0 ? 'pointer' : 'default' }}>
                {cliente.telefono}
              </Typography>
              {deudaResumen?.saldo_pendiente > 0 ? (
                <IconButton size="small" onClick={e => { e.stopPropagation(); abrirWhatsAppResumen(cliente, deudaResumen.saldo_pendiente); }}
                  sx={{ p: 0.25, color: '#25d366', '&:hover': { bgcolor: '#25d36620' } }}>
                  <WhatsAppIcon sx={{ fontSize: 14 }} />
                </IconButton>
              ) : (
                <WhatsAppIcon sx={{ fontSize: 14, color: '#25d36650' }} />
              )}
            </Box>
          )}
          {cliente.email && <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.5 }}>{cliente.email}</Typography>}
          {tieneDeuda && (
            <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 13 }}>Debe: {fmtMoney(deudaResumen.saldo_pendiente)}</Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1, pt: 1, borderTop: `1px solid ${BORDER}` }}>
            <Tooltip title="Ver detalle">
              <IconButton size="small" onClick={handleExpand} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}18` }, borderRadius: '6px' }}>
                <VisibilityIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => onEditar(cliente)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
              <EditIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onEliminar(cliente.id)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
              <DeleteIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
      <Box sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:hover': { bgcolor: HOVER } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{cliente.nombre}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>{cliente.cuit || '—'}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography
            onClick={cliente.telefono && deudaResumen?.saldo_pendiente > 0
              ? e => { e.stopPropagation(); abrirWhatsAppResumen(cliente, deudaResumen.saldo_pendiente); }
              : undefined}
            sx={{
              color: INK2, fontSize: 14,
              cursor: cliente.telefono && deudaResumen?.saldo_pendiente > 0 ? 'pointer' : 'default',
              '&:hover': cliente.telefono && deudaResumen?.saldo_pendiente > 0 ? { color: '#25d366' } : undefined,
            }}>
            {cliente.telefono || '—'}
          </Typography>
          {cliente.telefono && deudaResumen?.saldo_pendiente > 0 && (
            <Tooltip title="Enviar deuda por WhatsApp">
              <IconButton size="small" onClick={e => { e.stopPropagation(); abrirWhatsAppResumen(cliente, deudaResumen.saldo_pendiente); }}
                sx={{ p: 0.25, color: '#25d366', '&:hover': { bgcolor: '#25d36620' } }}>
                <WhatsAppIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
          {cliente.telefono && !deudaResumen?.saldo_pendiente && (
            <WhatsAppIcon sx={{ fontSize: 15, color: '#25d36650' }} />
          )}
        </Box>
        <Typography sx={{ color: INK2, fontSize: 13 }} noWrap>{cliente.email || '—'}</Typography>

        {/* Columna deuda */}
        <Box>
          {tieneDeuda ? (
            <Box>
              <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 14 }}>
                {fmtMoney(deudaResumen.saldo_pendiente)}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: 11 }}>
                {deudaResumen.cantidad_ventas} venta{deudaResumen.cantidad_ventas !== 1 ? 's' : ''}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ color: MUTED, fontSize: 13 }}>Al día</Typography>
          )}
        </Box>

        <Chip label={cliente.activo ? 'Activo' : 'Inactivo'} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: cliente.activo ? SUCCESS_BG : ERROR_BG, color: cliente.activo ? SUCCESS_LIGHT : ERROR, border: `1px solid ${cliente.activo ? SUCCESS_BORDER : ERROR_BORDER}`, width: 'fit-content' }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={handleExpand} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEditar(cliente)} sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: BORDER }, borderRadius: '6px' }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => onEliminar(cliente.id)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      )}

      {/* Modal expandido */}
      <Dialog open={expanded} onClose={() => setExpanded(false)} maxWidth="md" fullWidth PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Detalle del Cliente</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13 }}>{cliente.nombre}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(false)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 } }}>
          {puntosActivo && (
            <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: puntosMovs?.length ? 1.25 : 0 }}>
                <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>Puntos</Typography>
                <Typography sx={{ color: P, fontWeight: 700, fontSize: 15 }}>{cliente.puntos} pts</Typography>
              </Box>
              {puntosMovs?.length > 0 && (
                <Box sx={{ maxHeight: 160, overflowY: 'auto' }}>
                  {puntosMovs.map(m => (
                    <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: `1px solid ${BORDER}` }}>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(m.created_at)} · {m.nota}</Typography>
                      <Typography sx={{ color: m.tipo === 'ganado' ? SUCCESS : ERROR, fontSize: 12, fontWeight: 700 }}>
                        {m.puntos > 0 ? '+' : ''}{m.puntos}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {loadingD && <Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando deudas...</Typography>}

          {!loadingD && deudas.length === 0 && (
            <Typography sx={{ color: MUTED, fontSize: 13 }}>✓ {cliente.nombre} está al día, sin deudas pendientes.</Typography>
          )}

          {!loadingD && deudas.length > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>Ventas pendientes de cobro</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
                    onClick={() => generarPdfDeudas(cliente, deudas, user?.empresa)}
                    sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, fontSize: 12, border: `1px solid ${ERROR_BORDER}`, borderRadius: '7px', px: 1.5, '&:hover': { bgcolor: ERROR_BG } }}>
                    Exportar PDF
                  </Button>
                  {cliente.telefono && (
                    <Button size="small" startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                      onClick={() => abrirWhatsApp(cliente, deudas)}
                      sx={{ color: '#25d366', textTransform: 'none', fontWeight: 600, fontSize: 12, border: '1px solid #25d36640', borderRadius: '7px', px: 1.5, '&:hover': { bgcolor: '#25d36615' } }}>
                      Enviar por WA
                    </Button>
                  )}
                </Box>
              </Box>
              {/* Resumen total */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, flex: 1, minWidth: 240 }}>
                  {[
                    { label: 'Total ventas fiadas', value: fmtMoney(totalVentas),  color: INK    },
                    { label: 'Total cobrado',        value: fmtMoney(totalCobrado), color: SUCCESS },
                    { label: 'Saldo pendiente',      value: fmtMoney(totalSaldo),   color: ERROR   },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>{label}</Typography>
                      <Typography sx={{ color, fontWeight: 700, fontSize: 14 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
                <Button size="small" variant="contained" onClick={() => setOpenSaldarTodo(true)}
                  sx={{ bgcolor: SUCCESS, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2, py: 0.75, borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: SUCCESS_HOVER } }}>
                  Saldar todo
                </Button>
              </Box>

              {deudas.map(d => {
                const ec  = DEUDA_COLORS[d.estado_pago] || DEUDA_COLORS.pendiente;
                const pct = d.total > 0 ? Math.round((d.cobrado / d.total) * 100) : 0;
                return (
                  <Box key={d.id} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
                        <Typography sx={{ color: P, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>#{d.id}</Typography>
                        <Typography sx={{ color: INK2, fontSize: 13 }}>{fmtDate(d.fecha)}</Typography>
                        <Chip label={ec.label} size="small" sx={{ height: 18, fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.fg, border: `1px solid ${ec.border}` }} />
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 14 }}>{fmtMoney(d.saldo)}</Typography>
                        <Typography sx={{ color: MUTED, fontSize: 11 }}>de {fmtMoney(d.total)}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ flex: 1, height: 5, bgcolor: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: pct === 100 ? SUCCESS : SUCCESS, borderRadius: 3 }} />
                      </Box>
                      <Typography sx={{ color: MUTED, fontSize: 11, flexShrink: 0 }}>{pct}% cobrado</Typography>
                    </Box>

                    {d.pagos.length > 0 && d.pagos.map(p => (
                      <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(p.fecha)} — {p.metodo_pago}{p.nota ? ` · ${p.nota}` : ''}</Typography>
                        <Typography sx={{ color: SUCCESS, fontSize: 12, fontWeight: 600 }}>{fmtMoney(p.monto)}</Typography>
                      </Box>
                    ))}

                    {/* Detalle de productos */}
                    {(d.lineas?.length > 0) && (
                      <Box sx={{ mt: 1 }}>
                        <Button size="small"
                          onClick={() => toggleLineas(d.id)}
                          endIcon={<ExpandMoreIcon sx={{ fontSize: 14, transform: lineasAbiertas.has(d.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                          sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12, px: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                          {lineasAbiertas.has(d.id) ? 'Ocultar productos' : `Ver productos (${d.lineas.length})`}
                        </Button>
                        <Collapse in={lineasAbiertas.has(d.id)}>
                          <Box sx={{ mt: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                            {isMobile ? (
                              <>
                                {d.lineas.map((l, i) => (
                                  <Box key={i} sx={{ p: 1.25, borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 600, mb: 0.25 }}>{l.nombre}</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ color: MUTED, fontSize: 12, minWidth: 0 }}>×{l.cantidad} · {fmtMoney(l.precio)} c/u</Typography>
                                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmtMoney(l.subtotal)}</Typography>
                                    </Box>
                                    {l.precioActual > 0 && Math.abs(l.precioActual - l.precio) > 0.01 && (
                                      <Typography sx={{ color: l.precioActual > l.precio ? ERROR : SUCCESS, fontSize: 10.5, fontWeight: 600, mt: 0.25 }}>
                                        actual: {fmtMoney(l.precioActual)} {l.precioActual > l.precio ? '↑' : '↓'}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </>
                            ) : (
                              <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0, bgcolor: TABLE_HEADER, px: 1.5, py: 0.75 }}>
                                  {['Producto', 'Cant.', 'Precio', 'Subtotal'].map(h => (
                                    <Typography key={h} sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h !== 'Producto' ? 'right' : 'left', px: h !== 'Producto' ? 1.5 : 0 }}>{h}</Typography>
                                  ))}
                                </Box>
                                {d.lineas.map((l, i) => (
                                  <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0, px: 1.5, py: 0.75, borderTop: `1px solid ${BORDER}`, '&:hover': { bgcolor: HOVER } }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5 }}>{l.nombre}</Typography>
                                    <Typography sx={{ color: INK2, fontSize: 12.5, textAlign: 'right', px: 1.5 }}>×{l.cantidad}</Typography>
                                    <Box sx={{ textAlign: 'right', px: 1.5 }}>
                                      <Typography sx={{ color: INK2, fontSize: 12.5 }}>{fmtMoney(l.precio)}</Typography>
                                      {l.precioActual > 0 && Math.abs(l.precioActual - l.precio) > 0.01 && (
                                        <Typography sx={{ color: l.precioActual > l.precio ? ERROR : SUCCESS, fontSize: 10.5, fontWeight: 600 }}>
                                          actual: {fmtMoney(l.precioActual)} {l.precioActual > l.precio ? '↑' : '↓'}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 600, textAlign: 'right', pl: 1.5 }}>{fmtMoney(l.subtotal)}</Typography>
                                  </Box>
                                ))}
                              </>
                            )}
                            {(() => {
                              // El descuento/recargo se aplica a la venta entera (ajuste manual
                              // en el POS), no por línea — se calcula por diferencia contra la
                              // suma de subtotales, no comparando precio vs precio_original.
                              const sumaSubtotales = d.lineas.reduce((s, l) => s + l.subtotal, 0);
                              const ajuste = d.total - sumaSubtotales;
                              const esDescuento = ajuste < 0;
                              const pctAjuste = sumaSubtotales > 0 ? Math.round((Math.abs(ajuste) / sumaSubtotales) * 100) : 0;
                              return (
                                <>
                                  {Math.abs(ajuste) > 0.01 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, px: 1.5, py: 0.6, borderTop: `1px solid ${BORDER}` }}>
                                      <Typography sx={{ color: esDescuento ? SUCCESS : WARNING, fontSize: 12, fontWeight: 600, minWidth: 0 }}>
                                        {esDescuento ? 'Descuento' : 'Recargo'} ({pctAjuste}%)
                                      </Typography>
                                      <Typography sx={{ color: esDescuento ? SUCCESS : WARNING, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                                        {esDescuento ? '-' : '+'}{fmtMoney(Math.abs(ajuste))}
                                      </Typography>
                                    </Box>
                                  )}
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, px: 1.5, py: 0.85, borderTop: `2px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 700, minWidth: 0 }}>Total</Typography>
                                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 800, flexShrink: 0 }}>{fmtMoney(d.total)}</Typography>
                                  </Box>
                                </>
                              );
                            })()}
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Button size="small" startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                        onClick={() => setDeudaCobrar(d)}
                        sx={{ color: SUCCESS, textTransform: 'none', fontWeight: 600, fontSize: 12, '&:hover': { bgcolor: HOVER } }}>
                        Registrar cobro
                      </Button>
                      {d.lineas?.some(l => l.precioActual > 0 && Math.abs(l.precioActual - l.precio) > 0.01) && (
                        <Button size="small"
                          onClick={() => handleActualizarPrecios(d.id)}
                          disabled={actualizandoId === d.id}
                          sx={{ color: WARNING, textTransform: 'none', fontWeight: 600, fontSize: 12, '&:hover': { bgcolor: WARNING_BG } }}>
                          {actualizandoId === d.id ? 'Actualizando...' : '↑ Actualizar a precios actuales'}
                        </Button>
                      )}
                      {d.lineas?.some(l => l.precioOriginal > 0 && Math.abs(l.precioOriginal - l.precio) > 0.01) && (
                        <Button size="small"
                          onClick={() => handleRevertirPrecios(d.id)}
                          disabled={reviertendoId === d.id}
                          sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 12, '&:hover': { bgcolor: HOVER } }}>
                          {reviertendoId === d.id ? 'Revirtiendo...' : '↩ Revertir al precio original'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </>
          )}

          {/* Historial de ventas ya saldadas — no aparecen arriba a propósito,
              se piden aparte para no mezclarlas con lo pendiente de cobro. */}
          <Box sx={{ mt: !loadingD && deudas.length > 0 ? 2.5 : 1.5, pt: !loadingD && deudas.length > 0 ? 2 : 0, borderTop: !loadingD && deudas.length > 0 ? `1px solid ${BORDER}` : 'none' }}>
            <Button size="small" onClick={handleVerHistorial}
              endIcon={<ExpandMoreIcon sx={{ fontSize: 14, transform: historialAbierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
              sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 12.5, px: 0, '&:hover': { bgcolor: 'transparent', color: INK } }}>
              Historial de ventas saldadas{historial?.length ? ` (${historial.length})` : ''}
            </Button>
            <Collapse in={historialAbierto}>
              <Box sx={{ mt: 1.5 }}>
                {loadingH && <Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando historial...</Typography>}
                {!loadingH && historial?.length === 0 && (
                  <Typography sx={{ color: MUTED, fontSize: 13 }}>Todavía no hay ventas saldadas de este cliente.</Typography>
                )}
                {!loadingH && historial?.map(d => (
                  <Box key={d.id} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, mb: 1.5, opacity: 0.85 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
                        <Typography sx={{ color: P, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>#{d.id}</Typography>
                        <Typography sx={{ color: INK2, fontSize: 13 }}>{fmtDate(d.fecha)}</Typography>
                        <Chip label="Saldada" size="small" sx={{ height: 18, fontSize: 11, fontWeight: 600, bgcolor: SUCCESS_BG, color: SUCCESS_LIGHT, border: `1px solid ${SUCCESS_BORDER}` }} />
                      </Box>
                      <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{fmtMoney(d.total)}</Typography>
                    </Box>

                    {d.pagos.length > 0 && d.pagos.map(p => (
                      <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(p.fecha)} — {p.metodo_pago}{p.nota ? ` · ${p.nota}` : ''}</Typography>
                        <Typography sx={{ color: SUCCESS, fontSize: 12, fontWeight: 600 }}>{fmtMoney(p.monto)}</Typography>
                      </Box>
                    ))}

                    {(d.lineas?.length > 0) && (
                      <Box sx={{ mt: 1 }}>
                        <Button size="small"
                          onClick={() => toggleLineas(d.id)}
                          endIcon={<ExpandMoreIcon sx={{ fontSize: 14, transform: lineasAbiertas.has(d.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                          sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12, px: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                          {lineasAbiertas.has(d.id) ? 'Ocultar productos' : `Ver productos (${d.lineas.length})`}
                        </Button>
                        <Collapse in={lineasAbiertas.has(d.id)}>
                          <Box sx={{ mt: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                            {isMobile ? (
                              <>
                                {d.lineas.map((l, i) => (
                                  <Box key={i} sx={{ p: 1.25, borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 600, mb: 0.25 }}>{l.nombre}</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ color: MUTED, fontSize: 12, minWidth: 0 }}>×{l.cantidad} · {fmtMoney(l.precio)} c/u</Typography>
                                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmtMoney(l.subtotal)}</Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </>
                            ) : (
                              <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0, bgcolor: TABLE_HEADER, px: 1.5, py: 0.75 }}>
                                  {['Producto', 'Cant.', 'Precio', 'Subtotal'].map(h => (
                                    <Typography key={h} sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h !== 'Producto' ? 'right' : 'left', px: h !== 'Producto' ? 1.5 : 0 }}>{h}</Typography>
                                  ))}
                                </Box>
                                {d.lineas.map((l, i) => (
                                  <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0, px: 1.5, py: 0.75, borderTop: `1px solid ${BORDER}`, '&:hover': { bgcolor: HOVER } }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5 }}>{l.nombre}</Typography>
                                    <Typography sx={{ color: INK2, fontSize: 12.5, textAlign: 'right', px: 1.5 }}>×{l.cantidad}</Typography>
                                    <Typography sx={{ color: INK2, fontSize: 12.5, textAlign: 'right', px: 1.5 }}>{fmtMoney(l.precio)}</Typography>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 600, textAlign: 'right', pl: 1.5 }}>{fmtMoney(l.subtotal)}</Typography>
                                  </Box>
                                ))}
                              </>
                            )}
                            {(() => {
                              // El descuento/recargo se aplica a la venta entera (ajuste manual
                              // en el POS), no por línea — se calcula por diferencia contra la
                              // suma de subtotales, no comparando precio vs precio_original.
                              const sumaSubtotales = d.lineas.reduce((s, l) => s + l.subtotal, 0);
                              const ajuste = d.total - sumaSubtotales;
                              const esDescuento = ajuste < 0;
                              const pctAjuste = sumaSubtotales > 0 ? Math.round((Math.abs(ajuste) / sumaSubtotales) * 100) : 0;
                              return (
                                <>
                                  {Math.abs(ajuste) > 0.01 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, px: 1.5, py: 0.6, borderTop: `1px solid ${BORDER}` }}>
                                      <Typography sx={{ color: esDescuento ? SUCCESS : WARNING, fontSize: 12, fontWeight: 600, minWidth: 0 }}>
                                        {esDescuento ? 'Descuento' : 'Recargo'} ({pctAjuste}%)
                                      </Typography>
                                      <Typography sx={{ color: esDescuento ? SUCCESS : WARNING, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                                        {esDescuento ? '-' : '+'}{fmtMoney(Math.abs(ajuste))}
                                      </Typography>
                                    </Box>
                                  )}
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, px: 1.5, py: 0.85, borderTop: `2px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
                                    <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 700, minWidth: 0 }}>Total</Typography>
                                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 800, flexShrink: 0 }}>{fmtMoney(d.total)}</Typography>
                                  </Box>
                                </>
                              );
                            })()}
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        </DialogContent>
      </Dialog>

      <PaymentModal
        open={!!deudaCobrar} onClose={() => setDeudaCobrar(null)}
        deuda={deudaCobrar}
        type="cobro"
        title="Registrar Cobro"
        subtitle={deudaCobrar ? `Venta #${deudaCobrar.id} — ${fmtDate(deudaCobrar.fecha)}` : ''}
        summaryLabels={{ total: 'Total', paid: 'Cobrado', pending: 'Saldo' }}
        serviceFn={(id, payload) => deudasClientesService.cobrar(id, payload)}
        onSuccess={handleCobrado}
        confirmLabel="Registrar Cobro"
        confirmColor={SUCCESS}
      />
      <ModalSaldarTodo
        open={openSaldarTodo}
        onClose={() => setOpenSaldarTodo(false)}
        deudas={deudas}
        onSaldado={() => { setDeudas([]); refrescarHistorial(); onCobrar(); }}
      />
    </>
  );
}

const COLS  = 'repeat(5, minmax(0, 1fr)) 84px';
const colTh = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

export default function Clientes() {
  const isMobile = useIsMobile();
  const toast = useToast();
  const [clientes,     setClientes]     = useState([]);
  const [deudaResumen, setDeudaResumen] = useState([]);
  const [search,       setSearch]       = useState('');
  const [openModal,    setOpenModal]    = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [pagina,       setPagina]       = useState(1);
  const [pageSize,          setPageSize]          = useState(10);
  const [eliminarPendiente, setEliminarPendiente] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importando,    setImportando]    = useState(false);
  const [importProgreso, setImportProgreso] = useState({ hecho: 0, total: 0 });
  const [importPagina,    setImportPagina]    = useState(1);
  const [importPageSize,  setImportPageSize]  = useState(20);
  const csvRef = useRef(null);

  const handleEditarFilaImport = (idx, campo, valor) => {
    setImportPreview(prev => {
      const next = [...prev];
      const fila = { ...next[idx], [campo]: valor };
      if (campo === 'cuit') {
        fila.cuitDuplicado = valor ? clientes.some(c => c.cuit && c.cuit === valor) : false;
      }
      next[idx] = fila;
      return next;
    });
  };

  const handleQuitarFilaImport = (idx) => {
    setImportPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const cargarDeudas = useCallback(async () => {
    try { setDeudaResumen(await deudasClientesService.resumen()); } catch { setDeudaResumen([]); }
  }, []);

  const cargar = useCallback(async () => {
    try {
      const cs = await clientesService.getAll();
      setClientes(cs);
      cargarDeudas();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al cargar los clientes', 'error');
    }
  }, [cargarDeudas, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    registerTour('/clientes', [
      { element: '[data-tour="cli-deuda"]', optional: true, title: 'Deuda total', description: 'La suma de todos los fiados pendientes de tus clientes.' },
      { element: '[data-tour="cli-buscar"]', title: 'Buscar cliente', description: 'Encontrá un cliente por nombre, CUIT o email.' },
      { element: '[data-tour="cli-tabla"]', title: 'Lista de clientes', description: 'Cada cliente con su deuda y estado.' },
      { element: '[data-tour="cli-acciones"]', title: 'Acciones de la fila', description: 'Ojo: despliega el detalle de fiados de ese cliente, con opción de cobrar pagos parciales o totales (y un botón para mandarle el resumen por WhatsApp). Lápiz: editar sus datos. Tacho: eliminarlo.' },
      { element: '[data-tour="cli-nueva"]', title: 'Nuevo cliente', description: 'Vamos a ver el formulario de alta. Hacé clic en "Siguiente".', click: true, clickDelay: 300 },
      { element: '[data-tour="cli-modal-datos"]', title: 'Datos del cliente', description: 'Solo el nombre es obligatorio. El resto (CUIT/DNI, teléfono, email, dirección) es opcional.' },
      { element: '[data-tour="cli-modal-crear"]', title: 'Crear cliente', description: 'Guardá el cliente con los datos cargados.' },
      { element: '[data-tour="cli-modal-cerrar"]', title: 'Listo', description: 'Cerramos el formulario y volvemos al listado.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const totalDeuda = useMemo(
    () => deudaResumen.reduce((s, d) => s + d.saldo_pendiente, 0),
    [deudaResumen]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? clientes.filter(c => (c.nombre || '').toLowerCase().includes(q) || (c.cuit || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)) : clientes;
  }, [clientes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged      = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);

  const handleGuardar = (resultado, esEdicion) => {
    if (esEdicion) {
      setClientes(cs => cs.map(c => c.id === resultado.id ? resultado : c));
    } else {
      setClientes(cs => [...cs, resultado]);
    }
  };
  const handleEliminar = async (id) => {
    try {
      await clientesService.delete(id);
      setClientes(cs => cs.filter(c => c.id !== id));
      toast('Cliente eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar este cliente', 'error');
    }
  };

  // Solo parsea el archivo y arma la vista previa — la creación real pasa
  // recién en confirmarImportacion(), cuando el usuario revisó la lista y
  // confirma (mismo criterio que la importación de Productos/Proveedores).
  const handleImportarCSV = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let lines;
    try {
      lines = await leerFilasArchivo(file);
    } catch {
      toast('No se pudo leer el archivo. Asegurate de que sea un .csv o .xlsx válido.', 'error');
      return;
    }
    if (lines.length < 2) { toast('El archivo está vacío o no tiene datos', 'warning'); return; }
    const inicio = indiceEncabezado(lines);
    const header = lines[inicio].map(c => String(c || '').replace(/^"|"$/g, '').toLowerCase().trim());
    const findCol = (...terms) => header.findIndex(c => terms.some(t => c.includes(t)));
    const colNombre = findCol('nombre', 'persona', 'razon', 'razón') !== -1 ? findCol('nombre', 'persona', 'razon', 'razón') : 0;
    const colCuit     = findCol('cuit');
    const colTelefono = findCol('telefono', 'teléfono', 'tel');
    const colEmail    = findCol('email', 'correo', 'mail');
    const colDireccion = findCol('direccion', 'dirección');

    const filas = [];
    for (let i = inicio + 1; i < lines.length; i++) {
      const cols = lines[i];
      const nombre = cols[colNombre];
      if (!nombre) continue;
      const cuit = colCuit >= 0 ? (cols[colCuit] || '') : '';
      filas.push({
        nombre,
        cuit,
        telefono:  colTelefono >= 0 ? (cols[colTelefono] || '') : '',
        email:     colEmail >= 0 ? (cols[colEmail] || '') : '',
        direccion: colDireccion >= 0 ? (cols[colDireccion] || '') : '',
        cuitDuplicado: cuit ? clientes.some(c => c.cuit && c.cuit === cuit) : false,
      });
    }
    if (!filas.length) { toast('No se encontraron clientes válidos en el archivo', 'warning'); return; }
    setImportPagina(1);
    setImportPreview(filas);
  };

  const confirmarImportacion = async () => {
    if (!importPreview) return;
    setImportando(true);
    setImportProgreso({ hecho: 0, total: importPreview.length });
    let ok = 0, fallas = 0;
    for (const f of importPreview) {
      try {
        const nuevo = await clientesService.create({
          persona: f.nombre,
          cuit: f.cuit || undefined,
          telefono: f.telefono || undefined,
          email: f.email || undefined,
          direccion: f.direccion || undefined,
        });
        setClientes(cs => [...cs, nuevo]);
        ok++;
      } catch { fallas++; }
      setImportProgreso(p => ({ ...p, hecho: p.hecho + 1 }));
    }
    setImportando(false);
    setImportPreview(null);
    toast(`${ok} cliente${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''}${fallas ? ` · ${fallas} fallaron` : ''}`, ok > 0 ? 'success' : 'error');
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Clientes</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{clientes.length} clientes registrados</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {totalDeuda > 0 && (
            <Box data-tour="cli-deuda" sx={{ bgcolor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', px: 2, py: 1, textAlign: 'right' }}>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>DEUDA TOTAL</Typography>
              <Typography sx={{ color: ERROR, fontWeight: 800, fontSize: 18 }}>{fmtMoney(totalDeuda)}</Typography>
            </Box>
          )}
          <Tooltip title="Importar Excel o CSV">
            <Button variant="outlined" startIcon={<FileUploadIcon sx={{ fontSize: 15 }} />}
              onClick={() => csvRef.current?.click()}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Importar</Box>
            </Button>
          </Tooltip>
          <Tooltip title="Exportar Excel">
            <Button variant="outlined" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
              onClick={() => exportarCSVClientes(filtered)}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar</Box>
            </Button>
          </Tooltip>
          <Tooltip title="Nuevo Cliente">
            <Button data-tour="cli-nueva" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nuevo Cliente</Box>
            </Button>
          </Tooltip>
          <AyudaButton />
        </Box>
      </Box>

      <Box component="input" ref={csvRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportarCSV} sx={{ display: 'none' }} />

      <TextField data-tour="cli-buscar" fullWidth placeholder="Buscar por nombre, CUIT o email..."
        value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
          '& .MuiInputBase-input': { py: '13px', px: '14px' },
          '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
        }}
      />

      <Box data-tour="cli-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Lista de Clientes</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{clientes.length} clientes · hacé clic en una fila para ver sus deudas</Typography>
          </Box>

          {paged.length === 0 ? (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GroupIcon sx={{ color: P, fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay clientes</Typography>
              <Typography sx={{ color: MUTED, fontSize: 14 }}>Registrá tu primer cliente para empezar.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
                Registrar primer cliente
              </Button>
            </Box>
          ) : isMobile ? (
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {paged.map(c => (
                <ClienteRow
                  key={c.id}
                  cliente={c}
                  deudaResumen={deudaResumen.find(d => d.id_cliente === c.id)}
                  onEditar={setClienteEditar}
                  onEliminar={(id) => setEliminarPendiente(id)}
                  onCobrar={cargarDeudas}
                />
              ))}
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="clientes" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
                <Typography sx={colTh}>Cliente</Typography>
                <Typography sx={colTh}>Teléfono</Typography>
                <Typography sx={colTh}>Email</Typography>
                <Typography sx={{ ...colTh, color: ERROR }}>Debe</Typography>
                <Typography sx={colTh}>Estado</Typography>
                <Typography data-tour="cli-acciones" sx={{ ...colTh, textAlign: 'right' }}>ACCIONES</Typography>
              </Box>

              {paged.map(c => (
                <ClienteRow
                  key={c.id}
                  cliente={c}
                  deudaResumen={deudaResumen.find(d => d.id_cliente === c.id)}
                  onEditar={setClienteEditar}
                  onEliminar={(id) => setEliminarPendiente(id)}
                  onCobrar={cargarDeudas}
                />
              ))}

              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="clientes" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            </>
          )}
        </Box>

      <ModalCliente
        open={openModal || !!clienteEditar}
        onClose={() => { setOpenModal(false); setClienteEditar(null); }}
        onGuardar={handleGuardar}
        cliente={clienteEditar}
      />

      <ConfirmDialog
        open={eliminarPendiente !== null}
        onClose={() => setEliminarPendiente(null)}
        onConfirm={() => { handleEliminar(eliminarPendiente); setEliminarPendiente(null); }}
        title="¿Eliminar cliente?"
        message="Se eliminarán también sus deudas registradas. Esta acción no se puede deshacer."
      />

      {importPreview && (() => {
        const importCols = [
          { key: 'nombre',    header: 'Nombre',    width: '1.4fr' },
          { key: 'cuit',      header: 'CUIT',      width: '1fr' },
          { key: 'telefono',  header: 'Teléfono',  width: '1fr' },
          { key: 'email',     header: 'Email',     width: '1.2fr' },
          { key: 'direccion', header: 'Dirección', width: '1.2fr' },
          { key: '_quitar',   header: '',          width: '36px' },
        ];
        const gridTemplate = importCols.map(c => c.width).join(' ');
        const totalPages = Math.max(1, Math.ceil(importPreview.length / importPageSize));
        const pagina = Math.min(importPagina, totalPages);
        const inicioPag = (pagina - 1) * importPageSize;
        const paginadas = importPreview.slice(inicioPag, inicioPag + importPageSize).map((f, i) => ({ ...f, _idx: inicioPag + i }));
        const celdaSx = { '& .MuiInputBase-root': { fontSize: 12.5 }, '& .MuiInputBase-input': { py: '6px', px: '8px' } };

        return (
        <Dialog open onClose={() => !importando && setImportPreview(null)} maxWidth="lg" fullWidth
          PaperProps={{ sx: { ...modalPaperSx, height: '88vh' } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 17, color: INK }}>Confirmar importación</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
                {importPreview.length} cliente{importPreview.length !== 1 ? 's' : ''} encontrado{importPreview.length !== 1 ? 's' : ''} en el archivo — revisá y corregí lo que haga falta antes de importar
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setImportPreview(null)} disabled={importando} sx={{ color: MUTED, '&:hover': { color: INK } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 640 }}>
                <Box role="row" sx={{ display: 'contents' }}>
                  {importCols.map(c => (
                    <Box key={c.key} sx={{
                      position: 'sticky', top: 0, zIndex: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`,
                      px: 1, py: 1, display: 'flex', alignItems: 'center',
                    }}>
                      <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.header}</Typography>
                    </Box>
                  ))}
                </Box>
                {paginadas.map((f) => {
                  const rowBg = f.cuitDuplicado ? '#f59e0b12' : 'transparent';
                  return (
                    <Box key={f._idx} role="row" sx={{ display: 'contents' }}>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        {f.cuitDuplicado
                          ? <Tooltip title="Ya existe un cliente con ese CUIT"><WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 14, flexShrink: 0 }} /></Tooltip>
                          : <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0 }} />
                        }
                        <TextField fullWidth variant="standard" value={f.nombre} onChange={e => handleEditarFilaImport(f._idx, 'nombre', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                        <TextField fullWidth variant="standard" value={f.cuit} placeholder="Sin CUIT"
                          onChange={e => handleEditarFilaImport(f._idx, 'cuit', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                        <TextField fullWidth variant="standard" value={f.telefono}
                          onChange={e => handleEditarFilaImport(f._idx, 'telefono', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                        <TextField fullWidth variant="standard" value={f.email}
                          onChange={e => handleEditarFilaImport(f._idx, 'email', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                        <TextField fullWidth variant="standard" value={f.direccion}
                          onChange={e => handleEditarFilaImport(f._idx, 'direccion', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 0.5, py: 0.75, display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Quitar de la importación">
                          <IconButton size="small" onClick={() => handleQuitarFilaImport(f._idx)} sx={{ color: MUTED, '&:hover': { color: '#ef4444' } }}>
                            <CloseIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {totalPages > 1 && (
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={importPageSize} totalItems={importPreview.length} label="clientes"
                onPageChange={setImportPagina} onPageSizeChange={(s) => { setImportPageSize(s); setImportPagina(1); }} />
            )}

            {importando ? (
              <Box sx={{ mt: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ color: INK2, fontSize: 12.5, fontWeight: 600 }}>Importando clientes…</Typography>
                  <Typography sx={{ color: P, fontSize: 12.5, fontWeight: 700 }}>{importProgreso.hecho} / {importProgreso.total}</Typography>
                </Box>
                <LinearProgress variant="determinate"
                  value={importProgreso.total ? (importProgreso.hecho / importProgreso.total) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: `${P}20`, '& .MuiLinearProgress-bar': { bgcolor: P, borderRadius: 4 } }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexShrink: 0 }}>
                <Button onClick={() => setImportPreview(null)} sx={{
                  flex: 1, color: INK2, border: `1px solid ${BORDER}`, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.25,
                  '&:hover': { bgcolor: HOVER },
                }}>
                  Cancelar
                </Button>
                <Button onClick={confirmarImportacion} disabled={!importPreview.length} variant="contained" sx={{
                  flex: 1, bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25,
                  '&:hover': { bgcolor: P_HOVER },
                }}>
                  {`Importar ${importPreview.length} cliente${importPreview.length !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            )}
          </DialogContent>
        </Dialog>
        );
      })()}
    </Box>
  );
}
