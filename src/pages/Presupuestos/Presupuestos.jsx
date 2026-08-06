import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Tooltip,
  Dialog, DialogContent, Chip, Button, MenuItem, Select, FormControl, InputLabel,
  Autocomplete,
} from '@mui/material';
import SearchIcon         from '@mui/icons-material/Search';
import CloseIcon          from '@mui/icons-material/Close';
import AddIcon             from '@mui/icons-material/Add';
import DeleteIcon          from '@mui/icons-material/Delete';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import DescriptionIcon    from '@mui/icons-material/Description';
import FilterListIcon     from '@mui/icons-material/FilterList';
import PictureAsPdfIcon   from '@mui/icons-material/PictureAsPdf';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, DROPDOWN, TABLE_HEADER, modalPaperSx,
  SUCCESS, SUCCESS_BG, SUCCESS_BORDER, ERROR, ERROR_BG, WARNING, WARNING_BG, fieldSx,
} from '../../theme/tokens';
import { useIsMobile } from '../../utils/responsive';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import ConfirmDialog   from '../../components/shared/ConfirmDialog';
import { registerTour } from '../../utils/tour';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../auth/AuthContextBase';
import useHasPermiso from '../../hooks/useHasPermiso';
import useBusquedaProductos from '../../hooks/useBusquedaProductos';
import useDropdownKeyboardNav from '../../hooks/useDropdownKeyboardNav';
import { clientesService } from '../../services/clientesService';
import { COMPANY_NAME } from '../../config/brand';
import {
  usePresupuestos, usePresupuesto, useCrearPresupuesto, useEliminarPresupuesto,
} from '../../hooks/queries/usePresupuestosQueries';

const ESTADO_LABELS = { vigente: 'Vigente', convertido: 'Convertido', vencido: 'Vencido', cancelado: 'Cancelado' };
const ESTADO_COLORS = {
  vigente:    { bg: WARNING_BG, fg: WARNING, border: `${WARNING}55` },
  convertido: { bg: SUCCESS_BG, fg: SUCCESS, border: SUCCESS_BORDER },
  vencido:    { bg: ERROR_BG,   fg: ERROR,   border: `${ERROR}55` },
  cancelado:  { bg: `${MUTED}18`, fg: MUTED, border: `${MUTED}40` },
};

function generarPdfPresupuesto(presupuesto, empresa) {
  const doc   = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(empresa?.nombre || COMPANY_NAME, 14, 18);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Presupuesto #${presupuesto.id}`, 14, 26);

  doc.setFontSize(9);
  doc.text(`Fecha: ${fmtDate(presupuesto.fecha)}`, pageW - 14, 18, { align: 'right' });
  doc.text(`Cliente: ${presupuesto.cliente}`, pageW - 14, 26, { align: 'right' });

  autoTable(doc, {
    startY: 36,
    head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
    body: presupuesto.lineas.map(l => [l.nombre, String(l.cantidad), fmtMoney(l.precio_venta), fmtMoney(l.subtotal)]),
    styles: { fontSize: 9, textColor: [30, 30, 30], lineColor: [210, 210, 210], lineWidth: 0.1 },
    headStyles: { fillColor: [245, 245, 245], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    foot: [['', '', 'Total', fmtMoney(presupuesto.total)]],
    footStyles: { fillColor: [255, 255, 255], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 10 },
  });

  if (presupuesto.notas) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Notas:', 14, finalY);
    doc.text(doc.splitTextToSize(presupuesto.notas, pageW - 28), 14, finalY + 6);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento no tiene validez fiscal — es un presupuesto, no una factura.', 14, doc.internal.pageSize.getHeight() - 10);

  doc.save(`presupuesto-${presupuesto.id}.pdf`);
}

/* ── Chip de estado ── */
function EstadoChip({ estado }) {
  const c = ESTADO_COLORS[estado] || ESTADO_COLORS.vigente;
  return (
    <Chip label={ESTADO_LABELS[estado] || estado} size="small"
      sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: c.bg, color: c.fg, border: `1px solid ${c.border}` }} />
  );
}

/* ── Modal: nuevo presupuesto ── */
function ModalNuevoPresupuesto({ open, onClose }) {
  const toast = useToast();
  const crearPresupuesto = useCrearPresupuesto();

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [fecha, setFecha] = useState(toLocalDateStr());
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (open) clientesService.getAll().then(setClientes).catch(() => {});
  }, [open]);

  const handleClose = () => {
    setClienteId(null); setFecha(toLocalDateStr()); setNotas('');
    setLineas([]); setSearch(''); setShowDropdown(false);
    onClose();
  };

  const { resultados: resultadosBusqueda } = useBusquedaProductos(search, { perPage: 8 });
  // Un combo no es un producto vendible como línea suelta, y uno con
  // variantes necesita elegir talle primero — ninguno de los dos entra acá.
  const filtrados = useMemo(() => resultadosBusqueda.filter(p => !p.esCombo && !p.tieneVariantes), [resultadosBusqueda]);

  const agregarLinea = (producto) => {
    setLineas(ls => {
      const existente = ls.find(l => l.id_producto === producto.id);
      if (existente) {
        return ls.map(l => l.id_producto === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      }
      return [...ls, { id_producto: producto.id, nombre: producto.nombre, cantidad: 1, precio_venta: producto.precioFinal }];
    });
    setSearch(''); setShowDropdown(false);
  };

  const { highlightIdx: searchHighlightIdx, onKeyDown: handleSearchKeyDown, highlightedRef } = useDropdownKeyboardNav(filtrados, agregarLinea);

  const quitarLinea = (idProducto) => setLineas(ls => ls.filter(l => l.id_producto !== idProducto));
  const actualizarLinea = (idProducto, campo, valor) =>
    setLineas(ls => ls.map(l => l.id_producto === idProducto ? { ...l, [campo]: valor } : l));

  const total = lineas.reduce((s, l) => s + (Number(l.precio_venta) || 0) * (Number(l.cantidad) || 0), 0);

  const handleGuardar = async () => {
    if (lineas.length === 0) { toast('Agregá al menos un producto', 'error'); return; }
    try {
      await crearPresupuesto.mutateAsync({
        id_cliente: clienteId,
        fecha,
        notas: notas || null,
        lineas: lineas.map(l => ({ id_producto: l.id_producto, precio_venta: Number(l.precio_venta) || 0, cantidad: Number(l.cantidad) || 0 })),
      });
      toast('Presupuesto guardado', 'success');
      handleClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo guardar el presupuesto', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Nuevo presupuesto</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Cliente</Typography>
            <Autocomplete
              size="small"
              options={clientes}
              value={clientes.find(c => c.id === clienteId) ?? null}
              getOptionLabel={(opt) => opt.nombre || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val?.id}
              onChange={(_, val) => setClienteId(val?.id ?? null)}
              renderInput={(params) => <TextField {...params} placeholder="Consumidor Final" sx={fieldSx} />}
              slotProps={{ paper: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px', '& .MuiAutocomplete-option': { color: INK, '&:hover, &[aria-selected="true"]': { bgcolor: HOVER } } } } }}
              noOptionsText={<Typography sx={{ color: MUTED, fontSize: 13 }}>Sin resultados</Typography>}
            />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Fecha</Typography>
            <TextField fullWidth type="date" size="small" value={fecha} onChange={e => setFecha(e.target.value)} sx={fieldSx} />
          </Box>
        </Box>

        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Productos</Typography>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField fullWidth placeholder="Buscar por nombre o código..." value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => search.trim() && setShowDropdown(true)}
            onKeyDown={handleSearchKeyDown}
            sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 18 }} /></InputAdornment> }} />
          {showDropdown && filtrados.length > 0 && (
            <Box sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 0.5, bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 240, overflowY: 'auto' }}>
              {filtrados.map((p, i) => (
                <Box key={p.id} onClick={() => agregarLinea(p)}
                  ref={i === searchHighlightIdx ? highlightedRef : undefined}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' }, bgcolor: i === searchHighlightIdx ? `${P}22` : 'transparent', boxShadow: i === searchHighlightIdx ? `inset 0 0 0 1px ${P}` : 'none', '&:hover': { bgcolor: HOVER } }}>
                  <Box>
                    <Typography sx={{ color: INK, fontSize: 13.5 }}>{p.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{p.codigo}</Typography>
                  </Box>
                  <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{fmtMoney(p.precioFinal)}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {lineas.length > 0 && (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', mb: 2.5 }}>
            {lineas.map((l, i) => (
              <Box key={l.id_producto} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: i < lineas.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <Typography sx={{ color: INK, fontSize: 13, flex: 1, minWidth: 0 }} noWrap>{l.nombre}</Typography>
                <TextField type="number" size="small" value={l.cantidad}
                  onChange={e => actualizarLinea(l.id_producto, 'cantidad', e.target.value)}
                  inputProps={{ min: 0.01, step: 'any', style: { textAlign: 'center', width: 48 } }}
                  sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '6px', px: '4px' } }} />
                <TextField type="number" size="small" value={l.precio_venta}
                  onChange={e => actualizarLinea(l.id_producto, 'precio_venta', e.target.value)}
                  inputProps={{ min: 0, step: 'any', style: { textAlign: 'right', width: 72 } }}
                  sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '6px', px: '4px' } }} />
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, minWidth: 72, textAlign: 'right' }}>
                  {fmtMoney((Number(l.precio_venta) || 0) * (Number(l.cantidad) || 0))}
                </Typography>
                <IconButton size="small" onClick={() => quitarLinea(l.id_producto)} sx={{ color: MUTED, '&:hover': { color: ERROR } }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <TextField fullWidth multiline minRows={2} placeholder="Notas (opcional)" value={notas}
          onChange={e => setNotas(e.target.value)} sx={{ ...fieldSx, mb: 2.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, p: 1.5, bgcolor: HOVER, borderRadius: '10px' }}>
          <Typography sx={{ color: INK2, fontSize: 14, fontWeight: 600 }}>Total</Typography>
          <Typography sx={{ color: INK, fontSize: 18, fontWeight: 800 }}>{fmtMoney(total)}</Typography>
        </Box>

        <Button fullWidth variant="contained" disabled={crearPresupuesto.isPending || lineas.length === 0} onClick={handleGuardar}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '10px', py: 1.25, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' } }}>
          {crearPresupuesto.isPending ? 'Guardando...' : 'Guardar presupuesto'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal: detalle / convertir ── */
function ModalDetallePresupuesto({ id, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkPermisos } = useHasPermiso();
  const { data: presupuesto, isLoading } = usePresupuesto(id);
  const eliminarPresupuesto = useEliminarPresupuesto();
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  if (!id) return null;
  const puedeGestionar = checkPermisos('gestionarPresupuestos');

  // En vez de crear la venta directo por API, manda al POS con el carrito
  // ya armado (mismos productos y precios cotizados) y el cliente elegido —
  // así el cajero ve la venta antes de confirmarla, en vez de que quede
  // registrada sin que nadie la haya revisado.
  const handleIrAPos = () => {
    navigate('/pos', { state: { presupuestoParaCargar: { id: presupuesto.id, id_cliente: presupuesto.id_cliente, lineas: presupuesto.lineas } } });
    onClose();
  };

  const handleEliminar = async () => {
    try {
      await eliminarPresupuesto.mutateAsync(presupuesto.id);
      toast('Presupuesto eliminado', 'success');
      setConfirmarEliminar(false);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo eliminar el presupuesto', 'error');
      setConfirmarEliminar(false);
    }
  };

  return (
    <Dialog open={!!id} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      {isLoading || !presupuesto ? (
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, py: 4 }}>
          <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center' }}>Cargando...</Typography>
        </DialogContent>
      ) : (
      <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Presupuesto #{presupuesto.id}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13 }}>{presupuesto.cliente} · {fmtDate(presupuesto.fecha)}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ mb: 2 }}><EstadoChip estado={presupuesto.estado} /></Box>

        <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', mb: 2.5 }}>
          {presupuesto.lineas.map((l, i) => (
            <Box key={l.id} sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, borderBottom: i < presupuesto.lineas.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <Typography sx={{ color: INK, fontSize: 13.5 }}>{l.nombre} <Box component="span" sx={{ color: MUTED }}>x{l.cantidad}</Box></Typography>
              <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>{fmtMoney(l.subtotal)}</Typography>
            </Box>
          ))}
        </Box>

        {presupuesto.notas && (
          <Box sx={{ p: 1.5, bgcolor: HOVER, borderRadius: '10px', mb: 2.5 }}>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Notas</Typography>
            <Typography sx={{ color: INK2, fontSize: 13 }}>{presupuesto.notas}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, p: 1.5, bgcolor: HOVER, borderRadius: '10px' }}>
          <Typography sx={{ color: INK2, fontSize: 14, fontWeight: 600 }}>Total</Typography>
          <Typography sx={{ color: INK, fontSize: 18, fontWeight: 800 }}>{fmtMoney(presupuesto.total)}</Typography>
        </Box>

        <Button fullWidth startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />} onClick={() => generarPdfPresupuesto(presupuesto, user?.empresa)}
          sx={{ color: P, textTransform: 'none', fontWeight: 600, borderRadius: '10px', border: `1px solid ${BORDER}`, py: 1.1, mb: 1.5, '&:hover': { bgcolor: `${P}0c`, borderColor: P } }}>
          Descargar PDF
        </Button>

        {presupuesto.estado === 'vigente' && puedeGestionar && (
          <>
            <Button fullWidth startIcon={<ShoppingCartCheckoutIcon sx={{ fontSize: 16 }} />} onClick={handleIrAPos}
              sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: '10px', py: 1.25, mb: 1, '&:hover': { bgcolor: P_HOVER } }}>
              Convertir en venta
            </Button>
            <Button fullWidth startIcon={<DeleteIcon sx={{ fontSize: 16 }} />} onClick={() => setConfirmarEliminar(true)}
              sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1, '&:hover': { bgcolor: ERROR_BG } }}>
              Eliminar presupuesto
            </Button>
          </>
        )}

        <ConfirmDialog open={confirmarEliminar} onClose={() => setConfirmarEliminar(false)} onConfirm={handleEliminar}
          title="¿Eliminar este presupuesto?"
          message="No se puede deshacer. El cliente ya no lo va a poder ver ni convertir."
          confirmLabel="Eliminar" />
      </DialogContent>
      </>
      )}
    </Dialog>
  );
}

/* ── Página principal ── */
export default function Presupuestos() {
  const isMobile = useIsMobile();
  const { checkPermisos } = useHasPermiso();
  const puedeGestionar = checkPermisos('gestionarPresupuestos');
  const hoy = toLocalDateStr();

  const [search,       setSearch]       = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDesde,  setFiltroDesde]  = useState('');
  const [filtroHasta,  setFiltroHasta]  = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina,       setPagina]       = useState(1);
  const [pageSize,     setPageSize]     = useState(10);
  const [verId,        setVerId]        = useState(null);
  const [openNuevo,    setOpenNuevo]    = useState(false);

  const { data: presupuestos = [], isLoading } = usePresupuestos({ per_page: 500 });

  useEffect(() => {
    registerTour('/presupuestos', [
      { element: '[data-tour="pres-nuevo"]', title: 'Nuevo presupuesto', description: 'Armá una lista de productos con precio para un cliente, sin comprometer stock ni caja todavía.' },
      { element: '[data-tour="pres-buscar"]', title: 'Buscar', description: 'Buscá por nombre del cliente.' },
      { element: '[data-tour="pres-tabla"]', title: 'Historial de presupuestos', description: 'Cada fila es un presupuesto guardado, con su estado y total.' },
      { element: '[data-tour="pres-ver"]', optional: true, title: 'Ver y convertir', description: 'Abrí un presupuesto para verlo completo, descargarlo en PDF, o convertirlo en una venta real cuando el cliente confirme.', click: true, clickDelay: 250 },
    ]);
  }, []);

  const filtrados = useMemo(() => {
    let list = presupuestos;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(p => p.cliente.toLowerCase().includes(q));
    if (filtroEstado !== 'todos') list = list.filter(p => p.estado === filtroEstado);
    if (filtroDesde) list = list.filter(p => p.fecha >= filtroDesde);
    if (filtroHasta) list = list.filter(p => p.fecha <= filtroHasta);
    return list;
  }, [presupuestos, search, filtroEstado, filtroDesde, filtroHasta]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paged      = filtrados.slice((pagina - 1) * pageSize, pagina * pageSize);

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Presupuestos</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{presupuestos.length} presupuestos guardados</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {puedeGestionar && (
            <Button data-tour="pres-nuevo" variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenNuevo(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              Nuevo presupuesto
            </Button>
          )}
          <AyudaButton />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField data-tour="pres-buscar" placeholder="Buscar por cliente..."
          value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
          sx={{
            flex: 1, minWidth: 220,
            '& .MuiOutlinedInput-root': { bgcolor: CARD, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
            '& .MuiInputBase-input': { py: '13px', px: '14px' },
            '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
          }} />
        <Button onClick={() => setMostrarFiltros(v => !v)} startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
          sx={{ color: mostrarFiltros || filtroEstado !== 'todos' || filtroDesde || filtroHasta ? P : MUTED, textTransform: 'none', fontWeight: 600, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.75, '&:hover': { bgcolor: HOVER } }}>
          Filtros{(filtroEstado !== 'todos' || filtroDesde || filtroHasta) ? ' •' : ''}
        </Button>
      </Box>

      {mostrarFiltros && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="pres-filtro-estado-label" sx={{ bgcolor: CARD, px: 0.5 }}>Estado</InputLabel>
            <Select labelId="pres-filtro-estado-label" value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}
              sx={{ bgcolor: CARD, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
              <MenuItem value="todos">Todos los estados</MenuItem>
              {Object.entries(ESTADO_LABELS).map(([k, label]) => <MenuItem key={k} value={k}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }}
            value={filtroDesde} inputProps={{ max: filtroHasta || undefined }}
            onChange={e => { setFiltroDesde(e.target.value); setPagina(1); }}
            sx={{ bgcolor: CARD, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }} />
          <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }}
            value={filtroHasta} inputProps={{ min: filtroDesde || undefined, max: hoy }}
            onChange={e => { setFiltroHasta(e.target.value); setPagina(1); }}
            sx={{ bgcolor: CARD, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }} />
          {(filtroEstado !== 'todos' || filtroDesde || filtroHasta) && (
            <Button onClick={() => { setFiltroEstado('todos'); setFiltroDesde(''); setFiltroHasta(''); setPagina(1); }}
              sx={{ color: MUTED, textTransform: 'none', fontSize: 12.5, '&:hover': { color: INK } }}>
              Limpiar
            </Button>
          )}
        </Box>
      )}

      <Box data-tour="pres-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Historial de presupuestos</Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando...</Typography></Box>
        ) : paged.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DescriptionIcon sx={{ color: P, fontSize: 28 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>
              {presupuestos.length === 0 ? 'Todavía no guardaste ningún presupuesto' : 'No hay resultados para este filtro'}
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {paged.map(p => (
              <Box key={p.id} onClick={() => setVerId(p.id)} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{p.cliente}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(p.fecha)}</Typography>
                  </Box>
                  <EstadoChip estado={p.estado} />
                </Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{fmtMoney(p.total)}</Typography>
              </Box>
            ))}
            <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtrados.length} label="presupuestos" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) 110px 64px', alignItems: 'center', px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Cliente</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Fecha</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Estado</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Total</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Ver</Typography>
            </Box>
            {paged.map(p => (
              <Box key={p.id} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) 110px 64px', alignItems: 'center', px: 3, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:hover': { bgcolor: HOVER } }}>
                <Typography sx={{ color: INK2, fontSize: 14 }} noWrap>{p.cliente}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13.5 }}>{fmtDate(p.fecha)}</Typography>
                <Box><EstadoChip estado={p.estado} /></Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, textAlign: 'right' }}>{fmtMoney(p.total)}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="Ver detalle">
                    <IconButton data-tour="pres-ver" size="small" onClick={() => setVerId(p.id)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
                      <VisibilityIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
            <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtrados.length} label="presupuestos" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          </>
        )}
      </Box>

      <ModalNuevoPresupuesto open={openNuevo} onClose={() => setOpenNuevo(false)} />
      <ModalDetallePresupuesto id={verId} onClose={() => setVerId(null)} />
    </Box>
  );
}
