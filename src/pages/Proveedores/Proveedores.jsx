import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, Chip, Tooltip, LinearProgress,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import AddIcon          from '@mui/icons-material/Add';
import CloseIcon        from '@mui/icons-material/Close';
import PaymentIcon      from '@mui/icons-material/Payment';
import BusinessIcon     from '@mui/icons-material/Business';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import FileUploadIcon   from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, INPUT, HOVER, fieldSx, TABLE_HEADER,
         SUCCESS, SUCCESS_BG, SUCCESS_BORDER, SUCCESS_LIGHT,
         ERROR, ERROR_BG, ERROR_BORDER, modalPaperSx } from '../../theme/tokens';
import { useToast }    from '../../context/ToastContext';
import { useAuth }     from '../../auth/AuthContextBase';
import { PRIMARY_COLOR, COMPANY_NAME } from '../../config/brand';
import { fmtMoney, fmtDate } from '../../utils/format';
import { exportarExcel } from '../../utils/excelExport';
import { leerFilasArchivo, indiceEncabezado } from '../../utils/excelImport';
import DataTable       from '../../components/shared/DataTable';
import TablePagination from '../../components/shared/TablePagination';
import PaymentModal   from '../../components/shared/PaymentModal';
import ConfirmDialog  from '../../components/shared/ConfirmDialog';
import AyudaButton    from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { proveedoresService } from '../../services/proveedoresService';
import { deudasService }      from '../../services/deudasService';
import { comprasService }     from '../../services/comprasService';
import DEUDA_COLORS from '../../constants/deudaStatus';
import useHasPermiso from '../../hooks/useHasPermiso';

const METODO_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', cuenta_corriente: 'Cuenta corriente' };

/* ── Exportar / Importar Excel ── */
function exportarCSVProveedores(rows) {
  exportarExcel({
    filename: 'proveedores.xlsx',
    sheetName: 'Proveedores',
    subtitle: `Listado de proveedores · ${new Date().toLocaleDateString('es-AR')}`,
    columns: [
      { header: 'Código',    width: 12 },
      { header: 'Nombre',    width: 30 },
      { header: 'CUIT',      width: 16 },
      { header: 'Teléfono',  width: 16 },
      { header: 'Email',     width: 26 },
      { header: 'Dirección', width: 30 },
    ],
    rows: rows.map(p => [p.codigo || '', p.nombre, p.cuit || '', p.telefono || '', p.email || '', p.direccion || '']),
  });
}

/* ── Helper de color para PDF (jsPDF quiere RGB 0-255, no hex) ── */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}
const PDF_PRIMARY = hexToRgb(PRIMARY_COLOR);
const PDF_INK     = [30, 32, 40];
const PDF_MUTED   = [110, 116, 130];
const PDF_BORDER  = [222, 217, 209];

// Mismo criterio ink-light que el comprobante de Compras — nada de bandas de
// color sólidas, para que imprima limpio en blanco y negro. jsPDF/autoTable
// se cargan solo acá, al toque de exportar (no en el bundle de siempre).
async function exportarPDFProveedores(rows, empresaNombre) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'), import('jspdf-autotable'),
  ]);
  const doc     = new jsPDF({ orientation: 'landscape' });
  const pageW   = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const hoy     = new Date().toLocaleDateString('es-AR');

  let y = 16;
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...PDF_INK);
  doc.text(empresaNombre || COMPANY_NAME, marginX, y);

  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...PDF_MUTED);
  doc.text(`Emitido ${hoy}`, pageW - marginX, y, { align: 'right' });

  y += 5;
  doc.setFontSize(9.5);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...PDF_PRIMARY);
  doc.text('LISTADO DE PROVEEDORES', marginX, y);
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...PDF_MUTED);
  doc.text(`${rows.length} proveedor${rows.length !== 1 ? 'es' : ''}`, pageW - marginX, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(...PDF_BORDER);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);

  y += 6;
  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'Código' }, { content: 'Nombre' }, { content: 'CUIT' },
      { content: 'Teléfono' }, { content: 'Email' }, { content: 'Dirección' },
    ]],
    body: rows.map(p => [p.codigo || '-', p.nombre, p.cuit || '-', p.telefono || '-', p.email || '-', p.direccion || '-']),
    theme: 'plain',
    styles:       { fontSize: 9, textColor: PDF_INK, lineColor: PDF_BORDER, lineWidth: { top: 0, right: 0, bottom: 0.15, left: 0 }, cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 } },
    headStyles:   { textColor: PDF_INK, fontSize: 8.5, fontStyle: 'bold', lineColor: PDF_INK, lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 } },
    columnStyles: { 0: { cellWidth: 26 }, 2: { cellWidth: 36 }, 3: { cellWidth: 32 } },
    margin: { left: marginX, right: marginX },
  });

  doc.save(`proveedores-${hoy.replaceAll('/', '-')}.pdf`);
}


/* ── Modal nuevo proveedor ── */
export function ModalNuevoProveedor({ open, onClose, onCrear }) {
  const toast = useToast();
  const empty = { persona: '', codigo: '', cuit: '', telefono: '', email: '', direccion: '' };
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const handleCrear = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const nuevo = await proveedoresService.create({ ...form, estado: true });
      onCrear(nuevo);
      toast('Proveedor creado correctamente', 'success');
      setForm(empty);
      setErrors({});
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear el proveedor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(empty); setErrors({}); onClose(); };

  // Un poco más chico que el fieldSx de base — este modal es angosto (maxWidth="sm")
  // y en mobile el 14px por defecto se sentía grande para un form tan compacto.
  const fieldSxSm = { ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], fontSize: 13 } };
  const labelSx = { color: INK2, fontSize: 12.5, fontWeight: 500, mb: 0.75 };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Nuevo Proveedor</Typography>
        <IconButton data-tour="prov-modal-cerrar" size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box data-tour="prov-modal-datos" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={labelSx}>Nombre / Razón social *</Typography>
            <TextField fullWidth placeholder="Textiles S.A." value={form.persona} onChange={set('persona')} error={!!errors.persona} helperText={errors.persona} sx={fieldSxSm} />
          </Box>
          <Box>
            <Typography sx={labelSx}>CUIT</Typography>
            <TextField fullWidth placeholder="30-12345678-9" value={form.cuit} onChange={set('cuit')} sx={fieldSxSm} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={labelSx}>Código</Typography>
            <TextField fullWidth placeholder="AA223, 111..." value={form.codigo} onChange={set('codigo')} sx={fieldSxSm} />
          </Box>
          <Box>
            <Typography sx={labelSx}>Teléfono</Typography>
            <TextField fullWidth placeholder="11-1234-5678" value={form.telefono} onChange={set('telefono')} sx={fieldSxSm} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={labelSx}>Email</Typography>
            <TextField fullWidth placeholder="contacto@empresa.com" value={form.email} onChange={set('email')} sx={fieldSxSm} />
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography sx={labelSx}>Dirección</Typography>
          <TextField fullWidth placeholder="Dirección completa" value={form.direccion} onChange={set('direccion')} sx={fieldSxSm} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 13, px: 3, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button data-tour="prov-modal-crear" variant="contained" onClick={handleCrear} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, px: 3, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Guardando...' : 'Crear Proveedor'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal editar proveedor ── */
function ModalEditarProveedor({ open, onClose, onActualizar, proveedor }) {
  const toast = useToast();
  const empty = { persona: '', codigo: '', cuit: '', telefono: '', email: '', direccion: '' };
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setForm({
        persona:   proveedor.nombre    || '',
        codigo:    proveedor.codigo    || '',
        cuit:      proveedor.cuit      || '',
        telefono:  proveedor.telefono  || '',
        email:     proveedor.email     || '',
        direccion: proveedor.direccion || '',
      });
      setErrors({});
    }
  }, [proveedor]);

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
      const actualizado = await proveedoresService.update(proveedor.id, form);
      onActualizar(actualizado);
      toast('Proveedor actualizado correctamente', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al actualizar el proveedor', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>Editar Proveedor</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Nombre / Razón social *</Typography>
            <TextField fullWidth placeholder="Textiles S.A." value={form.persona} onChange={set('persona')} error={!!errors.persona} helperText={errors.persona} sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>CUIT</Typography>
            <TextField fullWidth placeholder="30-12345678-9" value={form.cuit} onChange={set('cuit')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Código</Typography>
            <TextField fullWidth placeholder="AA223, 111..." value={form.codigo} onChange={set('codigo')} sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Teléfono</Typography>
            <TextField fullWidth placeholder="11-1234-5678" value={form.telefono} onChange={set('telefono')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Email</Typography>
            <TextField fullWidth placeholder="contacto@empresa.com" value={form.email} onChange={set('email')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Dirección</Typography>
          <TextField fullWidth placeholder="Dirección completa" value={form.direccion} onChange={set('direccion')} sx={fieldSx} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal Detalle de Proveedor ── */
function ModalProveedorDetalle({ open, onClose, proveedor, onPagar }) {
  const { checkPermisos } = useHasPermiso();
  const puedePagarDeuda = checkPermisos('actualizarCompra');
  const [deudas,     setDeudas]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deudaPagar, setDeudaPagar] = useState(null);
  // Todas las compras a este proveedor (pagadas incluidas), no solo las que
  // tienen saldo pendiente — se pide recién al abrir, mismo criterio que el
  // "Ver historial" de ventas saldadas en Clientes.jsx.
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [todasCompras,     setTodasCompras]     = useState(null);
  const [loadingTodas,     setLoadingTodas]     = useState(false);

  useEffect(() => {
    if (proveedor && open) {
      deudasService.getAll({ id_proveedor: proveedor.id })
        .then(({ deudas: d }) => setDeudas(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [proveedor, open]);

  const handleVerHistorial = async () => {
    const abrir = !historialAbierto;
    setHistorialAbierto(abrir);
    if (abrir && todasCompras === null) {
      setLoadingTodas(true);
      try {
        const todas = await comprasService.getAll({ id_proveedor: proveedor.id, sort: 'fecha', dir: 'desc' });
        setTodasCompras(todas);
      } catch { setTodasCompras([]); } finally { setLoadingTodas(false); }
    }
  };

  const handlePagado = (actualizada) => {
    if (actualizada.estado_deuda === 'pagado') {
      setDeudas(prev => prev.filter(d => d.id !== actualizada.id));
    } else {
      setDeudas(prev => prev.map(d => d.id === actualizada.id ? actualizada : d));
    }
    onPagar();
    setDeudaPagar(null);
  };

  if (!proveedor) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Detalle del Proveedor</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13 }}>{proveedor.nombre}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 } }}>
        {loading && <Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando deudas...</Typography>}

        {!loading && deudas.length === 0 && (
          <Typography sx={{ color: MUTED, fontSize: 13 }}>✓ Sin deudas pendientes con este proveedor.</Typography>
        )}

        {!loading && deudas.length > 0 && (
          <>
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13, mb: 1.5 }}>Compras pendientes de pago</Typography>
            {deudas.map(d => {
              const ec = DEUDA_COLORS[d.estado_deuda] || DEUDA_COLORS.pendiente;
              const pct = d.total > 0 ? Math.round((d.pagado / d.total) * 100) : 0;
              return (
                <Box key={d.id} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
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
                      <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: pct === 100 ? SUCCESS : P, borderRadius: 3 }} />
                    </Box>
                    <Typography sx={{ color: MUTED, fontSize: 11, flexShrink: 0 }}>{pct}%</Typography>
                  </Box>
                  {d.pagos.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {d.pagos.map(p => (
                        <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                          <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(p.fecha)} — {p.metodo_pago}{p.nota ? ` · ${p.nota}` : ''}</Typography>
                          <Typography sx={{ color: SUCCESS, fontSize: 12, fontWeight: 600 }}>{fmtMoney(p.monto)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {puedePagarDeuda && (
                    <Button size="small" startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setDeudaPagar(d)}
                      sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12, '&:hover': { bgcolor: HOVER } }}>
                      Registrar pago
                    </Button>
                  )}
                </Box>
              );
            })}
          </>
        )}

        {!loading && (
          <Box sx={{ mt: deudas.length > 0 ? 2.5 : 0 }}>
            <Typography onClick={handleVerHistorial}
              sx={{ color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-block', '&:hover': { textDecoration: 'underline' } }}>
              {historialAbierto ? 'Ocultar todas las compras' : 'Ver todas las compras'}
            </Typography>

            {historialAbierto && (
              loadingTodas ? (
                <Typography sx={{ color: MUTED, fontSize: 13, mt: 1 }}>Cargando compras...</Typography>
              ) : !todasCompras?.length ? (
                <Typography sx={{ color: MUTED, fontSize: 13, mt: 1 }}>Sin compras registradas a este proveedor.</Typography>
              ) : (
                <Box sx={{ mt: 1.5, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {todasCompras.map((c, i) => {
                    const ec = DEUDA_COLORS[c.estadoDeuda] || DEUDA_COLORS.pagado;
                    const anulada = c.estado === 'cancelada';
                    return (
                      <Box key={c.id} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                        px: 1.5, py: 1.25, borderBottom: i < todasCompras.length - 1 ? `1px solid ${BORDER}` : 'none',
                        '&:hover': { bgcolor: HOVER },
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flexWrap: 'wrap' }}>
                          <Typography sx={{ color: INK2, fontSize: 13, flexShrink: 0 }}>{fmtDate(c.fecha)}</Typography>
                          <Chip label={anulada ? 'Anulada' : ec.label} size="small"
                            sx={{
                              height: 18, fontSize: 10.5, fontWeight: 600,
                              bgcolor: anulada ? ERROR_BG : ec.bg, color: anulada ? ERROR : ec.fg,
                              border: `1px solid ${anulada ? ERROR_BORDER : ec.border}`,
                            }} />
                        </Box>
                        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>{fmtMoney(c.total)}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )
            )}
          </Box>
        )}

        <PaymentModal
          open={!!deudaPagar} onClose={() => setDeudaPagar(null)}
          deuda={deudaPagar}
          type="pago"
          title="Registrar Pago"
          subtitle={deudaPagar ? `Compra del ${fmtDate(deudaPagar.fecha)}` : ''}
          serviceFn={(id, payload) => deudasService.pagar(id, payload)}
          onSuccess={handlePagado}
          confirmLabel="Registrar Pago"
        />
      </DialogContent>
    </Dialog>
  );
}

const PROV_COLUMNS = [
  {
    key: 'codigo', header: 'Código', width: 110,
    render: (p) => <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>{p.codigo || '—'}</Typography>,
  },
  {
    key: 'nombre', header: 'Proveedor', flex: true,
    render: (p) => (
      <Box>
        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{p.nombre}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.cuit || '—'}</Typography>
      </Box>
    ),
  },
  {
    key: 'telefono', header: 'Teléfono', flex: true,
    render: (p) => <Typography sx={{ color: INK2, fontSize: 14 }}>{p.telefono || '—'}</Typography>,
  },
  {
    key: 'email', header: 'Email', flex: true,
    render: (p) => <Typography sx={{ color: INK2, fontSize: 13 }} noWrap>{p.email || '—'}</Typography>,
  },
  {
    key: '_deuda', header: 'Deuda', flex: true,
    render: (p) => {
      if (!p.tieneDeuda) return <Typography sx={{ color: MUTED, fontSize: 13 }}>Sin deuda</Typography>;
      const porMetodo = Object.entries(p._deuda.pagado_por_metodo || {});
      const celda = (
        <Box>
          <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 14 }}>{fmtMoney(p._deuda.saldo_pendiente)}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 11 }}>{p._deuda.cantidad_compras} compra{p._deuda.cantidad_compras !== 1 ? 's' : ''}</Typography>
        </Box>
      );
      if (!porMetodo.length) return celda;
      return (
        <Tooltip title={
          <Box sx={{ py: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>Pagado hasta ahora:</Typography>
            {porMetodo.map(([metodo, monto]) => (
              <Typography key={metodo} sx={{ fontSize: 12 }}>{METODO_LABELS[metodo] || metodo}: {fmtMoney(monto)}</Typography>
            ))}
          </Box>
        }>
          {celda}
        </Tooltip>
      );
    },
  },
  {
    key: 'activo', header: 'Estado', flex: true,
    render: (p) => (
      <Chip label={p.activo ? 'Activo' : 'Inactivo'} size="small"
        sx={{ height: 20, fontSize: 11, fontWeight: 600, width: 'fit-content',
          bgcolor: p.activo ? SUCCESS_BG : ERROR_BG,
          color: p.activo ? SUCCESS_LIGHT : ERROR,
          border: `1px solid ${p.activo ? SUCCESS_BORDER : ERROR_BORDER}` }} />
    ),
  },
];

export default function Proveedores() {
  const toast = useToast();
  const { user } = useAuth();
  const { checkPermisos } = useHasPermiso();
  const puedeCrear = checkPermisos('crearProveedor');
  const puedeEditar = checkPermisos('actualizarProveedor');
  const puedeEliminar = checkPermisos('eliminarProveedor');
  const [proveedores,  setProveedores]  = useState([]);
  const [deudaResumen, setDeudaResumen] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [openModal,    setOpenModal]    = useState(false);
  const [proveedorVer, setProveedorVer] = useState(null);
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [pagina,       setPagina]       = useState(1);
  const [pageSize,     setPageSize]     = useState(10);
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
        fila.cuitDuplicado = valor ? proveedores.some(p => p.cuit && p.cuit === valor) : false;
      }
      next[idx] = fila;
      return next;
    });
  };

  const handleQuitarFilaImport = (idx) => {
    setImportPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const cargarDeudas = useCallback(async () => {
    try { setDeudaResumen(await deudasService.resumen()); } catch { toast('No se pudo cargar el resumen de deudas', 'error'); }
  }, [toast]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [ps] = await Promise.all([proveedoresService.getAll(), cargarDeudas()]);
      setProveedores(ps);
    } catch { toast('Error al cargar los proveedores', 'error'); } finally {
      setLoading(false);
    }
  }, [cargarDeudas]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    registerTour('/proveedores', [
      { element: '[data-tour="prov-deuda"]', optional: true, title: 'Deuda total', description: 'La suma de todo lo que le debés a tus proveedores por cuenta corriente.' },
      { element: '[data-tour="prov-buscar"]', title: 'Buscar proveedor', description: 'Encontrá un proveedor por nombre o CUIT.' },
      { element: '[data-tour="prov-tabla"]', title: 'Lista de proveedores', description: 'Hacé clic en una fila para ver el detalle de deudas y registrar pagos.' },
      { element: '[data-tour="prov-acciones"]', title: 'Acciones de la fila', description: 'Ojo: ver el detalle de deudas y pagos. Lápiz: editar los datos del proveedor. Tacho: eliminarlo (si no tiene compras asociadas).' },
      { element: '[data-tour="prov-nueva"]', title: 'Nuevo proveedor', description: 'Vamos a ver el formulario para dar de alta uno. Hacé clic en "Siguiente".', click: true, clickDelay: 300 },
      { element: '[data-tour="prov-modal-datos"]', title: 'Datos del proveedor', description: 'Solo el nombre o razón social es obligatorio. El resto de los datos (CUIT, teléfono, email, dirección) son opcionales y podés completarlos después.' },
      { element: '[data-tour="prov-modal-crear"]', title: 'Crear proveedor', description: 'Guardá el proveedor con los datos cargados.' },
      { element: '[data-tour="prov-modal-cerrar"]', title: 'Listo', description: 'Cerramos el formulario y volvemos al listado.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const totalDeuda = useMemo(
    () => deudaResumen.reduce((s, d) => s + d.saldo_pendiente, 0),
    [deudaResumen]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? proveedores.filter(p => p.nombre.toLowerCase().includes(q) || (p.cuit || '').includes(q) || (p.codigo || '').toLowerCase().includes(q)) : proveedores;
  }, [proveedores, search]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged        = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);
  const pagedEnriched = paged.map(p => {
    const dr = deudaResumen.find(d => d.id_proveedor === p.id) ?? null;
    return { ...p, _deuda: dr, tieneDeuda: Boolean(dr?.saldo_pendiente > 0) };
  });

  const handleCrear      = (nuevo) => setProveedores(ps => [...ps, nuevo]);

  // Solo parsea el archivo y arma la vista previa — la creación real pasa
  // recién en confirmarImportacion(), cuando el usuario revisó la lista y
  // confirma (mismo criterio que la importación de Productos).
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
    const colCodigo   = findCol('codigo', 'código');
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
        codigo:    colCodigo >= 0 ? (cols[colCodigo] || '') : '',
        cuit,
        telefono:  colTelefono >= 0 ? (cols[colTelefono] || '') : '',
        email:     colEmail >= 0 ? (cols[colEmail] || '') : '',
        direccion: colDireccion >= 0 ? (cols[colDireccion] || '') : '',
        cuitDuplicado: cuit ? proveedores.some(p => p.cuit && p.cuit === cuit) : false,
      });
    }
    if (!filas.length) { toast('No se encontraron proveedores válidos en el archivo', 'warning'); return; }
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
        const nuevo = await proveedoresService.create({
          persona: f.nombre,
          codigo: f.codigo || undefined,
          cuit: f.cuit || undefined,
          telefono: f.telefono || undefined,
          email: f.email || undefined,
          direccion: f.direccion || undefined,
        });
        setProveedores(ps => [...ps, nuevo]);
        ok++;
      } catch { fallas++; }
      setImportProgreso(p => ({ ...p, hecho: p.hecho + 1 }));
    }
    setImportando(false);
    setImportPreview(null);
    toast(`${ok} proveedor${ok !== 1 ? 'es' : ''} importado${ok !== 1 ? 's' : ''}${fallas ? ` · ${fallas} fallaron` : ''}`, ok > 0 ? 'success' : 'error');
  };
  const handleActualizar = (actualizado) => setProveedores(ps => ps.map(p => p.id === actualizado.id ? actualizado : p));
  const handleEliminar = async (row) => {
    setEliminandoId(row.id);
    try {
      await proveedoresService.delete(row.id);
      setProveedores(ps => ps.filter(p => p.id !== row.id));
      toast('Proveedor eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar este proveedor', 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG }}>

      {/* Header + buscador */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: BG, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Proveedores</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{proveedores.length} {proveedores.length === 1 ? 'proveedor registrado' : 'proveedores registrados'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {totalDeuda > 0 && (
            <Box data-tour="prov-deuda" sx={{ bgcolor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', px: 2, py: 1, textAlign: 'right' }}>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>DEUDA TOTAL</Typography>
              <Typography sx={{ color: ERROR, fontWeight: 800, fontSize: 18 }}>{fmtMoney(totalDeuda)}</Typography>
            </Box>
          )}
          {puedeCrear && (
            <Tooltip title="Importar Excel o CSV">
              <Button variant="outlined" startIcon={<FileUploadIcon sx={{ fontSize: 15 }} />}
                onClick={() => csvRef.current?.click()}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Importar</Box>
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Exportar Excel">
            <Button variant="outlined" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
              onClick={() => exportarCSVProveedores(filtered)}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Excel</Box>
            </Button>
          </Tooltip>
          <Tooltip title="Exportar PDF">
            <Button variant="outlined" startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
              onClick={() => exportarPDFProveedores(filtered, user?.empresa?.nombre)}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>PDF</Box>
            </Button>
          </Tooltip>
          {puedeCrear && (
            <Tooltip title="Nuevo Proveedor">
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
                sx={{ bgcolor: P, textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nuevo Proveedor</Box>
              </Button>
            </Tooltip>
          )}
          <AyudaButton />
        </Box>
      </Box>

      <Box component="input" ref={csvRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportarCSV} sx={{ display: 'none' }} />

      <TextField data-tour="prov-buscar" fullWidth placeholder="Buscar por nombre, código o CUIT..."
        value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
          '& .MuiInputBase-input': { py: '13px', px: '14px' },
          '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
        }}
      />
      </Box>

      {/* Contenido scrolleable */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <Box data-tour="prov-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Lista de Proveedores</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{proveedores.length} proveedores · hacé clic en una fila para ver las deudas</Typography>
        </Box>

        {!loading && pagedEnriched.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessIcon sx={{ color: P, fontSize: 28 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay proveedores</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Registrá tu primer proveedor para empezar.</Typography>
          {puedeCrear && (
            <Button data-tour="prov-nueva" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
              Registrar primer proveedor
            </Button>
          )}
          </Box>
        ) : (
          <>
            <DataTable
              columns={PROV_COLUMNS}
              rows={pagedEnriched}
              loading={loading}
              actions={{
                onView: setProveedorVer,
                onEdit: puedeEditar ? setProveedorEditar : undefined,
                onDelete: puedeEliminar ? setConfirmandoEliminar : undefined,
                deleteLoading: eliminandoId,
              }}
              actionsTourId="prov-acciones"
              emptyMessage="Sin proveedores"
              mobileCard={(p, acts) => (
                <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                    <Box>
                      <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{p.nombre}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{[p.codigo, p.cuit].filter(Boolean).join(' · ') || '—'}</Typography>
                    </Box>
                    <Chip label={p.activo ? 'Activo' : 'Inactivo'} size="small"
                      sx={{ height: 20, fontSize: 11, fontWeight: 600,
                        bgcolor: p.activo ? SUCCESS_BG : ERROR_BG,
                        color: p.activo ? SUCCESS_LIGHT : ERROR,
                        border: `1px solid ${p.activo ? SUCCESS_BORDER : ERROR_BORDER}` }} />
                  </Box>
                  {p.telefono && <Typography sx={{ color: INK2, fontSize: 13, mb: 0.25 }}>{p.telefono}</Typography>}
                  {p.email && <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.5 }}>{p.email}</Typography>}
                  {p.tieneDeuda && (
                    <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 13, mb: 0.5 }}>Deuda: {fmtMoney(p._deuda.saldo_pendiente)}</Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5, pt: 1, borderTop: `1px solid ${BORDER}` }}>
                    {acts.onView && (
                      <Tooltip title="Ver detalle de deudas">
                        <IconButton size="small" onClick={() => acts.onView(p)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}18` }, borderRadius: '6px' }}>
                          <VisibilityIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {acts.onEdit && (
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => acts.onEdit(p)} sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px' }}>
                          <EditIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {acts.onDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => acts.onDelete(p)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )}
            />
            <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="proveedores" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          </>
        )}
        </Box>
      </Box>

      <ModalNuevoProveedor open={openModal} onClose={() => setOpenModal(false)} onCrear={handleCrear} />
      <ModalEditarProveedor open={!!proveedorEditar} onClose={() => setProveedorEditar(null)} onActualizar={handleActualizar} proveedor={proveedorEditar} />
      {proveedorVer && (
        <ModalProveedorDetalle open onClose={() => setProveedorVer(null)} proveedor={proveedorVer} onPagar={cargarDeudas} />
      )}
      <ConfirmDialog
        open={!!confirmandoEliminar}
        onClose={() => setConfirmandoEliminar(null)}
        onConfirm={() => confirmandoEliminar && handleEliminar(confirmandoEliminar)}
        title="¿Eliminar este proveedor?"
        message="Se eliminarán todos sus datos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />

      {importPreview && (() => {
        const importCols = [
          { key: 'nombre',    header: 'Nombre',    width: '1.4fr' },
          { key: 'codigo',    header: 'Código',    width: '0.8fr' },
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
                {importPreview.length} proveedor{importPreview.length !== 1 ? 'es' : ''} encontrado{importPreview.length !== 1 ? 's' : ''} en el archivo — revisá y corregí lo que haga falta antes de importar
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
                          ? <Tooltip title="Ya existe un proveedor con ese CUIT"><WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 14, flexShrink: 0 }} /></Tooltip>
                          : <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0 }} />
                        }
                        <TextField fullWidth variant="standard" value={f.nombre} onChange={e => handleEditarFilaImport(f._idx, 'nombre', e.target.value)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                        <TextField fullWidth variant="standard" value={f.codigo} placeholder="Sin código"
                          onChange={e => handleEditarFilaImport(f._idx, 'codigo', e.target.value)}
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
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={importPageSize} totalItems={importPreview.length} label="proveedores"
                onPageChange={setImportPagina} onPageSizeChange={(s) => { setImportPageSize(s); setImportPagina(1); }} />
            )}

            {importando ? (
              <Box sx={{ mt: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ color: INK2, fontSize: 12.5, fontWeight: 600 }}>Importando proveedores…</Typography>
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
                  {`Importar ${importPreview.length} proveedor${importPreview.length !== 1 ? 'es' : ''}`}
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
