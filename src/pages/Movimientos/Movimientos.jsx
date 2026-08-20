import { useState, useMemo, useEffect, useContext, useRef } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Chip, Dialog, DialogTitle, DialogContent, Tooltip, Collapse, FormControl, Select, MenuItem,
  Autocomplete, LinearProgress,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FilterListIcon   from '@mui/icons-material/FilterList';
import AddIcon          from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import CloseIcon        from '@mui/icons-material/Close';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckIcon        from '@mui/icons-material/Check';
import SwapHorizIcon    from '@mui/icons-material/SwapHoriz';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, DROPDOWN, MODAL, TABLE_HEADER, inputSx as fieldSx, SUCCESS, SUCCESS_BG, ERROR, ERROR_BG, modalPaperSx } from '../../theme/tokens';
import { useToast } from '../../context/ToastContext';
import { agruparPorProducto } from '../../utils/movimientosResumen';
import { exportarExcel } from '../../utils/excelExport';
import { leerExcelMovimientos } from '../../utils/excelImport';
import DataTable       from '../../components/shared/DataTable';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { useProductos } from '../../context/ProductosContextBase';
import useBusquedaProductos from '../../hooks/useBusquedaProductos';
import useDropdownKeyboardNav from '../../hooks/useDropdownKeyboardNav';
import { useMovimientos, useTransferirStock } from '../../hooks/queries/useMovimientosQueries';
import { useSucursales } from '../../hooks/queries/useSucursalesQueries';
import useHasPermiso from '../../hooks/useHasPermiso';
import { AuthContext } from '../../auth/AuthContextBase';
import { productosService } from '../../services/productosService';
import { movimientosService } from '../../services/movimientosService';
import { esFraccionable, abrevUnidad } from '../../utils/unidadMedida';
import { toLocalDateStr } from '../../utils/format';

const TIPO_LABELS = {
  ajuste: 'Ajuste', venta: 'Venta', compra: 'Compra',
  transferencia_salida: 'Transferencia (salida)', transferencia_entrada: 'Transferencia (entrada)',
};

// Motivos preseteados para una "Baja" — antes era una nota libre y opcional,
// así que dos ferreteros anotaban lo mismo con palabras distintas (o no
// anotaban nada), imposible de agrupar después en un reporte. "Alta" se deja
// con nota libre y opcional: es menos común y suele ser una corrección
// puntual sin necesidad de categorizarla.
const MOTIVOS_BAJA = [
  { key: 'rotura',       label: 'Rotura' },
  { key: 'vencimiento',  label: 'Vencimiento' },
  { key: 'uso_interno',  label: 'Uso interno' },
  { key: 'perdida_robo', label: 'Pérdida / robo' },
  { key: 'otro',         label: 'Otro' },
];

/* ── Excel de un solo movimiento — solo Producto/Código/Cantidad, pensado
   para poder reimportarse en otra instalación (ver "Importar Excel" más
   abajo) y sumar o restar ese mismo stock del otro lado. ── */
function exportarMovimientoExcel(m) {
  exportarExcel({
    filename: `movimiento-${m.codigo || m.id}.xlsx`,
    sheetName: 'Movimiento',
    title: 'Comprobante de movimiento de stock',
    subtitle: `${fmtFechaCorta(m.fecha)} ${m.hora || ''} — no válido como comprobante fiscal`,
    columns: [
      { header: 'Código',     width: 18 },
      { header: 'Producto',   width: 30 },
      { header: 'Cantidad',   width: 12, align: 'right' },
    ],
    rows: [[
      m.codigo, m.producto, Math.abs(m.cantidad),
    ]],
  });
}

/* ── Excel de varios movimientos a la vez, mismo formato Código/Producto/
   Cantidad — para volver a bajar el Excel de un ajuste masivo (o cualquier
   selección de filas) si el archivo original se perdió o hace falta de
   nuevo: se seleccionan las filas con los checkboxes de la tabla y se usa
   este botón en vez de "Exportar Excel" (que trae más columnas, pensado
   para auditoría, no para reimportar). El signo de la cantidad se conserva
   (positivo/negativo) tal cual lo espera "Importar Excel". ── */
function exportarMovimientosSimplificado(rows) {
  exportarExcel({
    filename: `movimientos-${toLocalDateStr()}.xlsx`,
    sheetName: 'Movimientos',
    title: 'Movimientos de stock',
    subtitle: `${rows.length} fila${rows.length !== 1 ? 's' : ''} — no válido como comprobante fiscal`,
    columns: [
      { header: 'Código',     width: 18 },
      { header: 'Producto',   width: 30 },
      { header: 'Cantidad',   width: 12, align: 'right' },
    ],
    rows: rows.map(m => [m.codigo, m.producto, m.cantidad]),
  });
}

/* ── Export Excel ── */
function exportarCSV(rows, mostrarSucursales) {
  exportarExcel({
    filename: 'movimientos.xlsx',
    sheetName: 'Movimientos',
    subtitle: `Movimientos de stock · ${new Date().toLocaleDateString('es-AR')}`,
    columns: [
      { header: 'Fecha',       width: 13, align: 'center' },
      { header: 'Hora',        width: 10, align: 'center' },
      { header: 'Código',      width: 16 },
      { header: 'Producto',    width: 28 },
      { header: 'Tipo',        width: 14 },
      { header: 'Cantidad',    width: 12, align: 'right' },
      ...(mostrarSucursales ? [
        { header: 'Sucursal entrante', width: 18 },
        { header: 'Sucursal saliente', width: 18 },
      ] : []),
      { header: 'Descripción', width: 32 },
      { header: 'Usuario',     width: 18 },
    ],
    rows: rows.map(r => [
      fmtFechaCorta(r.fecha), r.hora, r.codigo, r.producto,
      TIPO_LABELS[r.tipo] || r.tipo, r.cantidad,
      ...(mostrarSucursales ? [
        r.cantidad > 0 ? (r.sucursal || '') : '',
        r.cantidad < 0 ? (r.sucursal || '') : '',
      ] : []),
      r.nota || r.subTipo || '', r.usuario || '',
    ]),
  });
}

/* ── Chip de tipo ── */
function TipoChip({ tipo, cantidad }) {
  if (tipo === 'ajuste') {
    // Baja (rotura/pérdida/uso interno) en rojo, alta (corrección a favor) en verde —
    // mismo criterio de color que venta/compra, para que se distinga de un vistazo
    // en vez de perderse como texto plano entre chips de color.
    const esBaja = cantidad < 0;
    return (
      <Chip label="Ajuste" size="small"
        sx={{ bgcolor: esBaja ? ERROR_BG : SUCCESS_BG, color: esBaja ? ERROR : SUCCESS, fontWeight: 600, fontSize: 12, borderRadius: '6px' }} />
    );
  }
  if (tipo === 'venta') {
    return (
      <Chip label="Venta" size="small"
        sx={{ bgcolor: ERROR_BG, color: ERROR, fontWeight: 600, fontSize: 12, borderRadius: '6px' }} />
    );
  }
  if (tipo === 'compra') {
    return (
      <Chip label="Compra" size="small"
        sx={{ bgcolor: SUCCESS_BG, color: SUCCESS, fontWeight: 600, fontSize: 12, borderRadius: '6px' }} />
    );
  }
  if (tipo === 'transferencia_salida' || tipo === 'transferencia_entrada') {
    return (
      <Chip label={TIPO_LABELS[tipo]} size="small"
        sx={{ bgcolor: `${P}18`, color: P, fontWeight: 600, fontSize: 12, borderRadius: '6px' }} />
    );
  }
  return <Typography sx={{ color: MUTED, fontSize: 13 }}>{tipo}</Typography>;
}

/* ── Cantidad con ícono ── */
function CantidadCell({ cantidad }) {
  const positivo = cantidad >= 0;
  return (
    <Typography sx={{ color: positivo ? SUCCESS : ERROR, fontWeight: 700, fontSize: 14 }}>
      {positivo ? `+${cantidad}` : cantidad}
    </Typography>
  );
}

function fmtFechaCorta(fecha) {
  const [y, mo, d] = String(fecha || '').slice(0, 10).split('-').map(Number);
  return y ? `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y}` : '';
}

// mostrarSucursales solo tiene sentido con más de una sucursal — con una sola,
// "entrante"/"saliente" serían siempre la misma y no aportan nada.
function getDetalleColumns(mostrarSucursales) {
  return [
    {
      key: 'hora', header: 'Fecha y hora', flex: 0.65,
      render: (m) => (
        <Box>
          <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500 }}>{fmtFechaCorta(m.fecha)}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12 }}>{m.hora}</Typography>
        </Box>
      ),
    },
    {
      key: 'producto', header: 'Producto', flex: 1.8,
      render: (m) => (
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }} noWrap>{m.producto}</Typography>
          <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 700 }} noWrap>{m.codigo}</Typography>
        </Box>
      ),
    },
    {
      key: 'tipo', header: 'Tipo', flex: true,
      render: (m) => <TipoChip tipo={m.tipo} cantidad={m.cantidad} />,
    },
    {
      key: 'cantidad', header: 'Cantidad', flex: true,
      render: (m) => <CantidadCell cantidad={m.cantidad} />,
    },
    ...(mostrarSucursales ? [
      {
        key: 'entrante', header: 'Sucursal entrante', flex: true,
        render: (m) => <Typography sx={{ color: m.cantidad > 0 && m.sucursal ? INK2 : MUTED, fontSize: 13 }} noWrap>{m.cantidad > 0 ? (m.sucursal || '—') : '—'}</Typography>,
      },
      {
        key: 'saliente', header: 'Sucursal saliente', flex: true,
        render: (m) => <Typography sx={{ color: m.cantidad < 0 && m.sucursal ? INK2 : MUTED, fontSize: 13 }} noWrap>{m.cantidad < 0 ? (m.sucursal || '—') : '—'}</Typography>,
      },
    ] : []),
    {
      key: 'descripcion', header: 'Descripción', flex: true,
      render: (m) => {
        const desc = m.nota || m.subTipo;
        return (
          <Tooltip title={desc || ''} disableHoverListener={!desc}>
            <Typography sx={{ color: desc ? INK2 : MUTED, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} noWrap>
              {desc || '—'}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      key: 'usuario', header: 'Usuario', flex: true,
      render: (m) => <Typography sx={{ color: m.usuario ? INK2 : MUTED, fontSize: 13 }} noWrap>{m.usuario || '—'}</Typography>,
    },
  ];
}

const RESUMEN_COLUMNS = [
  {
    key: 'producto', header: 'Producto', flex: true,
    render: (r) => (
      <Box>
        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>{r.producto}</Typography>
        <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 700 }}>{r.codigo}</Typography>
      </Box>
    ),
  },
  {
    key: 'entradas', header: 'Entradas', flex: true, align: 'center',
    render: (r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <TrendingUpIcon sx={{ color: SUCCESS, fontSize: 16 }} />
        <Typography sx={{ color: SUCCESS, fontSize: 14, fontWeight: 600 }}>+{r.entradas}</Typography>
      </Box>
    ),
  },
  {
    key: 'salidas', header: 'Salidas', flex: true, align: 'center',
    render: (r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <TrendingDownIcon sx={{ color: ERROR, fontSize: 16 }} />
        <Typography sx={{ color: ERROR, fontSize: 14, fontWeight: 600 }}>{r.salidas}</Typography>
      </Box>
    ),
  },
  {
    key: 'neto', header: 'Movimiento neto', flex: true, align: 'center',
    render: (r) => <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>{r.entradas + r.salidas}</Typography>,
  },
];

/* ── Modal Registrar Movimiento ── */
function ModalMovimiento({ open, onClose, sucursales }) {
  const { ajustarStock } = useProductos();
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const transferirStock = useTransferirStock();
  const [modo,          setModo]          = useState('alta');
  const [searchProd,   setSearchProd]   = useState('');
  const [productoSel,  setProductoSel]  = useState(null);
  const [cantidad,     setCantidad]     = useState('0');
  const [nota,         setNota]         = useState('');
  const [motivoBaja,     setMotivoBaja]     = useState('');
  const [motivoBajaOtro, setMotivoBajaOtro] = useState('');
  const [registrando,  setRegistrando]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [idOrigen,     setIdOrigen]     = useState('');
  const [idDestino,    setIdDestino]    = useState('');
  const [stockOrigen,       setStockOrigen]       = useState(null);
  const [cargandoStockOrigen, setCargandoStockOrigen] = useState(false);
  const searchRef   = useRef(null);
  const cantidadRef = useRef(null);

  useEffect(() => {
    if (open) setIdOrigen(user?.id_sucursal ? String(user.id_sucursal) : '');
  }, [open, user?.id_sucursal]);

  // El stock que ya tenemos en memoria (contexto de productos) está siempre
  // scopeado a la sucursal activa del usuario — si elige transferir DESDE otra
  // sucursal, ese número no sirve para validar. Se pide puntualmente el stock
  // real de esa sucursal para no dejar transferir más de lo que hay ahí.
  useEffect(() => {
    if (modo !== 'transferencia' || !productoSel || !idOrigen) { setStockOrigen(null); return; }
    let vivo = true;
    setCargandoStockOrigen(true);
    productosService.getById(productoSel.id, { id_sucursal: idOrigen })
      .then(p => { if (vivo) setStockOrigen(p.stockPropio ?? p.stock ?? 0); })
      .catch(() => { if (vivo) setStockOrigen(null); })
      .finally(() => { if (vivo) setCargandoStockOrigen(false); });
    return () => { vivo = false; };
  }, [modo, productoSel, idOrigen]);

  const { resultados: resultadosBusqueda } = useBusquedaProductos(searchProd, { perPage: 20 });

  // Un producto CON variantes no tiene stock propio (rechazado por el backend
  // para ajuste/transferencia) — se listan sus talles como opciones propias,
  // cada una con el id real de esa variante, para poder tocar su stock puntual.
  const productosParaMovimiento = useMemo(() => resultadosBusqueda.flatMap(p => p.tieneVariantes
    ? p.variantes.map(v => ({ ...p, id: v.id, nombre: `${p.nombre} — Talle ${v.talle}`, codigo: v.codigo, codigoBarras: v.codigoBarras, talle: v.talle, stock: v.stock, alerta: v.alerta, tieneVariantes: false }))
    : [p]),
  [resultadosBusqueda]);

  const filtrados = productosParaMovimiento.filter(p => !(modo === 'transferencia' && p.esCombo));

  // Único lugar donde se elige un producto (click en el dropdown o Enter con
  // un solo resultado filtrado) — de acá se pasa el foco a Cantidad para
  // no obligar a tocar el mouse en el flujo rápido de teclado.
  const seleccionarProducto = (p) => {
    setProductoSel(p); setSearchProd(p.nombre); setShowDropdown(false);
    setTimeout(() => { cantidadRef.current?.focus(); cantidadRef.current?.select(); }, 50);
  };

  const { highlightIdx: searchHighlightIdx, onKeyDown: handleSearchEnter, highlightedRef } = useDropdownKeyboardNav(filtrados, seleccionarProducto);

  const handleCantidadEnter = (e) => {
    if (e.key !== 'Enter') return;
    if (!puedeConfirmar() || saving) return;
    e.preventDefault();
    handleRegistrar();
  };

  const handleClose = () => {
    setSearchProd(''); setProductoSel(null);
    setModo('alta'); setCantidad('0'); setNota('');
    setMotivoBaja(''); setMotivoBajaOtro('');
    setIdOrigen(''); setIdDestino('');
    setStockOrigen(null); setCargandoStockOrigen(false);
    setShowDropdown(false);
    onClose();
  };

  const puedeConfirmar = () => {
    if (!productoSel || Number(cantidad) <= 0) return false;
    if (modo === 'baja') {
      if (Number(cantidad) > productoSel.stock) return false;
      if (!motivoBaja) return false;
      if (motivoBaja === 'otro' && !motivoBajaOtro.trim()) return false;
    }
    if (modo === 'transferencia') {
      if (!(idOrigen && idDestino && idOrigen !== idDestino)) return false;
      if (cargandoStockOrigen || stockOrigen === null || Number(cantidad) > stockOrigen) return false;
    }
    return true;
  };

  const saving = registrando || transferirStock.isPending;

  // Tope de cantidad según el modo — "alta" no tiene techo (estás sumando stock).
  const maxDisponible = modo === 'baja' ? productoSel?.stock ?? null : modo === 'transferencia' ? stockOrigen : null;
  const excedeStock = maxDisponible != null && Number(cantidad) > maxDisponible;

  const handleRegistrar = async () => {
    if (modo === 'transferencia') {
      setRegistrando(true);
      try {
        await transferirStock.mutateAsync({
          idProducto: productoSel.id,
          cantidad: Number(cantidad),
          idSucursalOrigen: Number(idOrigen),
          idSucursalDestino: Number(idDestino),
        });
        toast(`Se transfirieron ${cantidad} ${abrevUnidad(productoSel.unidadMedida)} de "${productoSel.nombre}"`, 'success');
        handleClose();
      } catch (e) {
        toast(e.response?.data?.message || 'No se pudo registrar la transferencia', 'error');
      } finally {
        setRegistrando(false);
      }
      return;
    }

    const cant = modo === 'alta' ? Number(cantidad) : -Number(cantidad);
    const notaFinal = modo === 'baja'
      ? (motivoBaja === 'otro' ? motivoBajaOtro.trim() : MOTIVOS_BAJA.find(m => m.key === motivoBaja)?.label || '')
      : nota;
    setRegistrando(true);
    try {
      await ajustarStock(productoSel, cant, notaFinal);
      toast(`Stock de "${productoSel.nombre}" ${modo === 'alta' ? 'aumentado' : 'disminuido'} en ${Number(cantidad)} ${abrevUnidad(productoSel.unidadMedida)}`, 'success');
      handleClose();
    } catch {
      // ajustarStock ya muestra su propio toast de error
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}
      TransitionProps={{ onEntered: () => searchRef.current?.focus() }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 } }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Registrar movimiento de stock</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25, display: { xs: 'none', sm: 'block' } }}>
            {modo === 'transferencia'
              ? 'Movés mercadería de una sucursal a otra.'
              : 'Aumentá o disminuí manualmente el stock de un producto.'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        {/* Modo */}
        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Tipo de movimiento</Typography>
        <Box data-tour="mov-modal-tipo" sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          {[
            { key: 'alta',          label: 'Alta',   Icon: TrendingUpIcon,  color: SUCCESS, bg: SUCCESS_BG },
            { key: 'baja',          label: 'Baja',   Icon: TrendingDownIcon, color: ERROR,   bg: ERROR_BG  },
            ...(sucursales.length > 1 ? [{ key: 'transferencia', label: 'Transferir', Icon: SwapHorizIcon, color: P, bg: 'rgba(92,110,248,0.12)' }] : []),
          ].map(opt => (
            <Button key={opt.key} fullWidth startIcon={<opt.Icon />}
              onClick={() => { setModo(opt.key); setCantidad(opt.key === 'transferencia' ? '1' : '0'); }}
              sx={{
                py: 1.25, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '10px',
                border: `1px solid ${modo === opt.key ? opt.color : BORDER}`,
                bgcolor: modo === opt.key ? opt.bg : 'transparent',
                color:   modo === opt.key ? opt.color : INK2,
                '&:hover': { bgcolor: opt.bg, borderColor: opt.color, color: opt.color },
              }}>
              {opt.label}
            </Button>
          ))}
        </Box>

        {/* Producto */}
        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Producto</Typography>
        <Box data-tour="mov-modal-producto" sx={{ position: 'relative', mb: 2.5 }}>
          <TextField fullWidth placeholder="Buscar por nombre o código..."
            value={searchProd}
            inputRef={searchRef}
            onChange={e => { setSearchProd(e.target.value); setProductoSel(null); setShowDropdown(true); }}
            onFocus={() => searchProd.trim() && setShowDropdown(true)}
            onKeyDown={handleSearchEnter}
            sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 18 }} /></InputAdornment> }}
          />
          {showDropdown && filtrados.length > 0 && (
            <Box sx={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 0.5,
              bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 260, overflowY: 'auto',
            }}>
              {filtrados.map((p, i) => (
                <Box key={p.id}
                  ref={i === searchHighlightIdx ? highlightedRef : undefined}
                  onClick={() => seleccionarProducto(p)}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.5, cursor: 'pointer',
                    borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
                    bgcolor: i === searchHighlightIdx ? `${P}22` : 'transparent',
                    boxShadow: i === searchHighlightIdx ? `inset 0 0 0 1px ${P}` : 'none',
                    '&:hover': { bgcolor: HOVER },
                  }}>
                  <Box>
                    <Typography sx={{ color: INK, fontSize: 14, fontWeight: 500 }}>{p.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.codigo}{modo !== 'transferencia' ? ` · Stock: ${p.stock}` : ''}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Sucursales (transferencia) */}
        {modo === 'transferencia' && sucursales.length > 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Desde</Typography>
              <FormControl fullWidth>
                <Select value={idOrigen} onChange={e => setIdOrigen(e.target.value)} displayEmpty
                  sx={{ bgcolor: MODAL, color: INK, fontSize: 14, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '11px', px: '14px' } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                  <MenuItem value="" disabled>Sucursal origen</MenuItem>
                  {sucursales.map(s => <MenuItem key={s.id} value={String(s.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>{s.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Hacia</Typography>
              <FormControl fullWidth>
                <Select value={idDestino} onChange={e => setIdDestino(e.target.value)} displayEmpty
                  sx={{ bgcolor: MODAL, color: INK, fontSize: 14, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '11px', px: '14px' } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                  <MenuItem value="" disabled>Sucursal destino</MenuItem>
                  {sucursales.filter(s => String(s.id) !== idOrigen).map(s => <MenuItem key={s.id} value={String(s.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>{s.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}

        {/* Cantidad */}
        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>
          Cantidad{esFraccionable(productoSel?.unidadMedida) ? ` (${abrevUnidad(productoSel.unidadMedida)})` : ''}
        </Typography>
        <TextField fullWidth type="number" value={cantidad}
          inputRef={cantidadRef}
          onChange={e => setCantidad(e.target.value)}
          onKeyDown={handleCantidadEnter}
          inputProps={{ min: 0, max: maxDisponible ?? undefined, ...(esFraccionable(productoSel?.unidadMedida) ? { step: '0.01' } : {}) }}
          error={excedeStock}
          sx={{ ...fieldSx, mb: 0.5 }} />
        {modo === 'transferencia' && productoSel && idOrigen && (
          <Typography sx={{ color: excedeStock ? ERROR : MUTED, fontSize: 12, mb: 3 }}>
            {cargandoStockOrigen ? 'Consultando stock en la sucursal de origen...'
              : stockOrigen === null ? 'No se pudo consultar el stock de origen'
              : `Disponible en origen: ${stockOrigen}`}
          </Typography>
        )}
        {modo === 'baja' && productoSel && (
          <Typography sx={{ color: excedeStock ? ERROR : MUTED, fontSize: 12, mb: 2.5 }}>
            Disponible: {productoSel.stock}
          </Typography>
        )}
        {modo === 'alta' && <Box sx={{ mb: 2.5 }} />}

        {/* Motivo (obligatorio en Baja) / Nota (opcional en Alta) */}
        {modo === 'baja' && (
          <>
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Motivo</Typography>
            <FormControl fullWidth sx={{ mb: motivoBaja === 'otro' ? 1.5 : 3 }}>
              <Select value={motivoBaja} onChange={e => setMotivoBaja(e.target.value)} displayEmpty
                sx={{ bgcolor: MODAL, color: INK, fontSize: 14, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '11px', px: '14px' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                <MenuItem value="" disabled>Elegí un motivo</MenuItem>
                {MOTIVOS_BAJA.map(m => <MenuItem key={m.key} value={m.key} sx={{ '&:hover': { bgcolor: HOVER } }}>{m.label}</MenuItem>)}
              </Select>
            </FormControl>
            {motivoBaja === 'otro' && (
              <TextField fullWidth placeholder="Detalle del motivo..." value={motivoBajaOtro}
                onChange={e => setMotivoBajaOtro(e.target.value)}
                sx={{ ...fieldSx, mb: 3 }} />
            )}
          </>
        )}
        {modo === 'alta' && (
          <>
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>Nota (opcional)</Typography>
            <TextField fullWidth placeholder="Motivo del ajuste..." value={nota}
              onChange={e => setNota(e.target.value)}
              sx={{ ...fieldSx, mb: 3 }} />
          </>
        )}

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button data-tour="mov-modal-cancelar" fullWidth variant="outlined" onClick={handleClose}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
            Cancelar
          </Button>
          <Button data-tour="mov-modal-registrar" fullWidth variant="contained"
            startIcon={modo === 'transferencia' ? <SwapHorizIcon /> : <CheckIcon />}
            disabled={!puedeConfirmar() || saving}
            onClick={handleRegistrar}
            sx={{
              bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25,
              '&:hover': { bgcolor: P_HOVER },
              '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' },
            }}>
            {saving
              ? (modo === 'transferencia' ? 'Transfiriendo...' : 'Registrando...')
              : (modo === 'transferencia' ? 'Transferir' : 'Registrar')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// Autocomplete de una fila de la vista previa de importación — busca contra
// el backend en vez de un array local, para poder reasignar a mano un
// producto de todo el catálogo (no solo los primeros N cargados).
function AutocompleteProductoFila({ value, onChange, placeholder, celdaSx }) {
  const [query, setQuery] = useState(value?.nombre || '');
  const { resultados } = useBusquedaProductos(query, { perPage: 20 });
  return (
    <Autocomplete
      fullWidth size="small"
      options={resultados}
      value={value}
      getOptionLabel={(o) => o?.nombre || ''}
      isOptionEqualToValue={(o, v) => o.id === v?.id}
      onChange={(_, val) => { onChange(val); setQuery(val ? val.nombre : ''); }}
      inputValue={query}
      onInputChange={(_, v) => setQuery(v)}
      filterOptions={(options) => options}
      renderInput={(params) => (
        <TextField {...params} variant="standard" placeholder={placeholder}
          InputProps={{ ...params.InputProps, disableUnderline: true }} sx={celdaSx} />
      )}
      slotProps={{ paper: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, '& .MuiAutocomplete-option': { color: INK, fontSize: 13, '&:hover, &[aria-selected=true]': { bgcolor: HOVER } } } } }}
    />
  );
}

/* ── Modal: Importar Excel — lee el mismo formato Producto/Código/Cantidad
   que exporta el botón de Acciones (ver exportarMovimientoExcel), resuelve
   cada código contra el catálogo local, y aplica todo junto como alta o
   baja de stock. Pensado para el caso de dos instalaciones separadas: se
   exporta del lado que envía la mercadería, se importa acá. ── */
function ModalImportarMovimientos({ open, onClose, onCompletado }) {
  const toast = useToast();
  const [parseando, setParseando]   = useState(false);
  const [filas, setFilas]           = useState(null);
  const [aplicando, setAplicando]   = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [pagina,   setPagina]   = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleClose = () => {
    setFilas(null); setNombreArchivo(''); setPagina(1);
    onClose();
  };

  // Match exacto contra el backend (no un array local, que nunca tiene el
  // catálogo completo) — por código/código de barras, o por nombre si la fila
  // no trae código. Se pide de a lotes chicos en paralelo para no demorar
  // minutos con un archivo de miles de filas.
  const resolverProductoAsync = async (codigo, nombre) => {
    const c = codigo.trim();
    const n = nombre.trim();
    try {
      if (c) {
        const coincidencias = await productosService.getAll({ codigo_exacto: c });
        return coincidencias[0] || null;
      }
      if (n) {
        const coincidencias = await productosService.getAll({ search: n, per_page: 5 });
        return coincidencias.find(p => p.nombre.toLowerCase() === n.toLowerCase()) || null;
      }
    } catch { /* fila queda como no encontrada */ }
    return null;
  };

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParseando(true);
    setNombreArchivo(file.name);
    try {
      const lineas = await leerExcelMovimientos(file);
      const productosResueltos = new Array(lineas.length);
      const LOTE = 8;
      for (let i = 0; i < lineas.length; i += LOTE) {
        const lote = lineas.slice(i, i + LOTE);
        await Promise.all(lote.map((l, j) =>
          resolverProductoAsync(l.codigo, l.nombre).then(p => { productosResueltos[i + j] = p; })
        ));
      }
      setPagina(1);
      setFilas(lineas.map((l, i) => ({ ...l, producto: productosResueltos[i] })));
    } catch {
      toast('No se pudo leer el archivo. Verificá que sea un Excel válido.', 'error');
      setNombreArchivo('');
    } finally {
      setParseando(false);
    }
  };

  const handleEditarFila = (idx, campo, valor) => {
    setFilas(prev => { const next = [...prev]; next[idx] = { ...next[idx], [campo]: valor }; return next; });
  };

  const handleQuitarFila = (idx) => {
    setFilas(prev => prev.filter((_, i) => i !== idx));
  };

  const encontrados = (filas || []).filter(f => f.producto);
  const noEncontrados = (filas || []).filter(f => !f.producto);

  const handleConfirmar = async () => {
    setAplicando(true);
    // En lotes de a LOTE_BULK filas por request, no todo en una — el PHP
    // embebido corta cualquier request a los 30s (max_execution_time): con
    // miles de filas una única request puede tardar más que eso y perderse
    // entera. Ver el mismo criterio en Productos::confirmarImportacion().
    const items = encontrados.map(f => ({
      id_producto: f.producto.id, producto: f.producto.nombre, codigo: f.producto.codigo || '',
      // El signo viene directo del Excel: una cantidad negativa resta del
      // stock, una positiva suma — no hace falta elegir un modo aparte.
      cantidad: f.cantidad, nota: 'Importado desde Excel',
    }));
    let ok = 0, fallidos = 0;
    const LOTE_BULK = 300;
    for (let i = 0; i < items.length; i += LOTE_BULK) {
      const lote = items.slice(i, i + LOTE_BULK);
      try {
        const { aplicados, fallidos: fallidosBack } = await movimientosService.bulkCreate(lote);
        ok += aplicados;
        fallidos += fallidosBack;
      } catch {
        fallidos += lote.length;
      }
    }
    setAplicando(false);
    if (ok > 0) onCompletado?.();
    toast(
      fallidos > 0 ? `${ok} productos actualizados, ${fallidos} fallaron` : `${ok} productos actualizados`,
      fallidos > 0 ? 'error' : 'success'
    );
    handleClose();
  };

  const totalPages  = filas ? Math.max(1, Math.ceil(filas.length / pageSize)) : 1;
  const paginaClamp = Math.min(pagina, totalPages);
  const inicioPag   = (paginaClamp - 1) * pageSize;
  const paginadas   = (filas || []).slice(inicioPag, inicioPag + pageSize).map((f, i) => ({ ...f, _idx: inicioPag + i }));
  const celdaSx = { '& .MuiInputBase-root': { fontSize: 12.5 }, '& .MuiInputBase-input': { py: '6px', px: '8px' } };

  return (
    <Dialog open={open} onClose={() => !aplicando && handleClose()} maxWidth={filas ? 'lg' : 'xs'} fullWidth
      PaperProps={{ sx: filas ? { ...modalPaperSx, height: '88vh' } : modalPaperSx }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Importar Excel</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>
            {filas ? 'Revisá y corregí lo que haga falta antes de confirmar' : 'Excel de Código/Producto/Cantidad — cantidad positiva suma stock, negativa resta.'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} disabled={aplicando} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!filas ? (
          <Button component="label" fullWidth startIcon={<UploadFileIcon />} disabled={parseando}
            sx={{ py: 2, border: `1.5px dashed ${BORDER}`, borderRadius: '10px', color: INK2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: HOVER, borderColor: P } }}>
            {parseando ? 'Leyendo archivo...' : 'Elegir archivo Excel (.xlsx)'}
            <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleArchivo} />
          </Button>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexShrink: 0 }}>
              <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{nombreArchivo} — {filas.length} filas</Typography>
              <Typography sx={{ color: encontrados.length ? SUCCESS : MUTED, fontSize: 12.5, fontWeight: 600 }}>
                {encontrados.length} encontrados{noEncontrados.length > 0 ? ` · ${noEncontrados.length} no encontrados` : ''}
              </Typography>
            </Box>

            {/* Vista previa — el signo de la cantidad (columna del Excel) decide
                si ese producto suma o resta stock, no hace falta elegirlo acá.
                Si el matching por código/nombre falló, se puede reasignar el
                producto correcto a mano acá mismo. */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 130px 130px 36px', minWidth: 560 }}>
                <Box role="row" sx={{ display: 'contents' }}>
                  {['Producto', 'Código', 'Cantidad', ''].map(h => (
                    <Box key={h} sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, px: 1, py: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
                {paginadas.map((f) => {
                  const rowBg = f.producto ? 'transparent' : '#ef444412';
                  return (
                    <Box key={f._idx} role="row" sx={{ display: 'contents' }}>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        {f.producto
                          ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0 }} />
                          : <Tooltip title="No se encontró por código/nombre — elegí el producto correcto"><WarningAmberIcon sx={{ color: ERROR, fontSize: 14, flexShrink: 0 }} /></Tooltip>
                        }
                        <AutocompleteProductoFila
                          value={f.producto}
                          placeholder={f.nombre || 'Producto sin nombre'}
                          celdaSx={celdaSx}
                          onChange={(val) => handleEditarFila(f._idx, 'producto', val)}
                        />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.6, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ color: MUTED, fontSize: 12.5, fontFamily: 'monospace' }} noWrap>{f.codigo || '—'}</Typography>
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {f.cantidad >= 0
                          ? <TrendingUpIcon sx={{ fontSize: 15, color: SUCCESS, flexShrink: 0 }} />
                          : <TrendingDownIcon sx={{ fontSize: 15, color: ERROR, flexShrink: 0 }} />}
                        <TextField fullWidth variant="standard" type="number" value={f.cantidad}
                          onChange={e => handleEditarFila(f._idx, 'cantidad', Number(e.target.value) || 0)}
                          InputProps={{ disableUnderline: true }} sx={celdaSx} />
                      </Box>
                      <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 0.5, py: 0.6, display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Quitar de la importación">
                          <IconButton size="small" onClick={() => handleQuitarFila(f._idx)} sx={{ color: MUTED, '&:hover': { color: ERROR } }}>
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
              <TablePagination pagina={paginaClamp} totalPages={totalPages} pageSize={pageSize} totalItems={filas.length} label="filas"
                onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            )}

            {noEncontrados.length > 0 && (
              <Typography sx={{ color: ERROR, fontSize: 12.5, mt: 1.5, flexShrink: 0 }}>
                {noEncontrados.length} {noEncontrados.length === 1 ? 'producto no se encontró' : 'productos no se encontraron'} y se van a omitir salvo que le asignes uno a mano.
              </Typography>
            )}

            {aplicando ? (
              // Una sola request atómica — no hay progreso fila a fila ni
              // forma de cancelarla a mitad de camino.
              <Box sx={{ mt: 2, flexShrink: 0 }}>
                <Typography sx={{ color: INK2, fontSize: 12.5, fontWeight: 600, mb: 0.75 }}>
                  Aplicando movimientos…
                </Typography>
                <LinearProgress variant="indeterminate"
                  sx={{ height: 8, borderRadius: 4, bgcolor: `${P}20`, '& .MuiLinearProgress-bar': { bgcolor: P, borderRadius: 4 } }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexShrink: 0 }}>
                <Button fullWidth variant="outlined" onClick={handleClose}
                  sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                  Cancelar
                </Button>
                <Button fullWidth variant="contained" disabled={encontrados.length === 0} onClick={handleConfirmar}
                  sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' } }}>
                  {`Confirmar (${encontrados.length})`}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal: Ajuste masivo — cargar varios productos con su cantidad de una,
   aplicar todos como alta o baja, y descargar automáticamente el Excel
   (Código/Producto/Cantidad) de ese mismo lote — para llevarlo a otra
   instalación e importarlo ahí con "Importar Excel", sin tener que ir
   seleccionando movimientos sueltos después de cargarlos uno por uno. ── */
function ModalAjusteMasivo({ open, onClose, onCompletado }) {
  const toast = useToast();
  const [modo,          setModo]          = useState('alta');
  const [searchProd,    setSearchProd]    = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [lineas,        setLineas]        = useState([]);
  const [nota,          setNota]          = useState('');
  const [aplicando,     setAplicando]     = useState(false);
  const searchRef   = useRef(null);

  const { resultados: resultadosBusqueda } = useBusquedaProductos(searchProd, { perPage: 20 });

  const productosParaMovimiento = useMemo(() => resultadosBusqueda.flatMap(p => p.tieneVariantes
    ? p.variantes.map(v => ({ ...p, id: v.id, nombre: `${p.nombre} — Talle ${v.talle}`, codigo: v.codigo, codigoBarras: v.codigoBarras, talle: v.talle, stock: v.stock }))
    : [p]),
  [resultadosBusqueda]);

  const filtrados = useMemo(() =>
    productosParaMovimiento.filter(p => !lineas.some(l => l.id === p.id)),
  [productosParaMovimiento, lineas]);

  const agregarProducto = (p) => {
    setLineas(ls => [...ls, { id: p.id, nombre: p.nombre, codigo: p.codigo, stock: p.stock, cantidad: '1' }]);
    setSearchProd('');
    setShowDropdown(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const { highlightIdx: searchHighlightIdx, onKeyDown: handleSearchEnter, highlightedRef } = useDropdownKeyboardNav(filtrados, agregarProducto);

  const quitarLinea = (id) => setLineas(ls => ls.filter(l => l.id !== id));
  const setCantidadLinea = (id, v) => setLineas(ls => ls.map(l => l.id === id ? { ...l, cantidad: v } : l));

  const handleClose = () => {
    setLineas([]); setSearchProd(''); setNota(''); setModo('alta'); setShowDropdown(false);
    onClose();
  };

  const lineasValidas = lineas.filter(l => Number(l.cantidad) > 0);

  const handleConfirmar = async () => {
    if (!lineasValidas.length) return;
    setAplicando(true);
    // En lotes de a LOTE_BULK filas por request, no todo en una — el PHP
    // embebido corta cualquier request a los 30s (max_execution_time): con
    // muchas líneas una única request puede tardar más que eso y perderse
    // entera. Ver el mismo criterio en Productos::confirmarImportacion().
    const notaFinal = nota.trim() || 'Ajuste masivo';
    const items = lineasValidas.map(l => ({
      id_producto: l.id, producto: l.nombre, codigo: l.codigo,
      cantidad: modo === 'alta' ? Number(l.cantidad) : -Number(l.cantidad),
      nota: notaFinal,
    }));
    let ok = 0, fallidos = 0;
    const fallidosSet = new Set();
    const LOTE_BULK = 300;
    for (let i = 0; i < items.length; i += LOTE_BULK) {
      const lote = items.slice(i, i + LOTE_BULK);
      try {
        const { aplicados, fallidos: fallidosBack, indicesFallidos } = await movimientosService.bulkCreate(lote);
        ok += aplicados;
        fallidos += fallidosBack;
        indicesFallidos.forEach(idx => fallidosSet.add(i + idx));
      } catch {
        fallidos += lote.length;
        for (let k = 0; k < lote.length; k++) fallidosSet.add(i + k);
      }
    }
    const aplicadas = lineasValidas.filter((_, i) => !fallidosSet.has(i));
    setAplicando(false);
    if (ok > 0) onCompletado?.();
    if (aplicadas.length) {
      exportarExcel({
        filename: `ajuste-masivo-${toLocalDateStr()}.xlsx`,
        sheetName: 'Ajuste',
        title: `Ajuste masivo — ${modo === 'alta' ? 'Alta' : 'Baja'}`,
        subtitle: `${fmtFechaCorta(toLocalDateStr())} — no válido como comprobante fiscal`,
        columns: [
          { header: 'Código',   width: 18 },
          { header: 'Producto', width: 30 },
          { header: 'Cantidad', width: 12, align: 'right' },
        ],
        rows: aplicadas.map(l => [l.codigo, l.nombre, Number(l.cantidad)]),
      });
    }
    toast(
      fallidos > 0 ? `${ok} productos actualizados, ${fallidos} fallaron` : `${ok} productos actualizados — Excel descargado`,
      fallidos > 0 ? 'error' : 'success'
    );
    handleClose();
  };

  return (
    <Dialog open={open} onClose={() => !aplicando && handleClose()} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}
      TransitionProps={{ onEntered: () => searchRef.current?.focus() }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 } }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Ajuste masivo</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Cargá varios productos, aplicá el ajuste a todos, y descargá el Excel del lote.</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} disabled={aplicando} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        {/* Alta / Baja */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[
            { key: 'alta', label: 'Alta',  Icon: TrendingUpIcon,   color: SUCCESS, bg: SUCCESS_BG },
            { key: 'baja', label: 'Baja',  Icon: TrendingDownIcon, color: ERROR,   bg: ERROR_BG  },
          ].map(opt => (
            <Button key={opt.key} fullWidth startIcon={<opt.Icon />} onClick={() => setModo(opt.key)}
              sx={{
                py: 1.1, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '10px',
                border: `1px solid ${modo === opt.key ? opt.color : BORDER}`,
                bgcolor: modo === opt.key ? opt.bg : 'transparent',
                color:   modo === opt.key ? opt.color : INK2,
                '&:hover': { bgcolor: opt.bg, borderColor: opt.color, color: opt.color },
              }}>
              {opt.label}
            </Button>
          ))}
        </Box>

        {/* Buscador de productos */}
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField fullWidth placeholder="Buscar por nombre o código para agregar..."
            value={searchProd}
            inputRef={searchRef}
            onChange={e => { setSearchProd(e.target.value); setShowDropdown(true); }}
            onFocus={() => searchProd.trim() && setShowDropdown(true)}
            onKeyDown={handleSearchEnter}
            sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 18 }} /></InputAdornment> }}
          />
          {showDropdown && filtrados.length > 0 && (
            <Box sx={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 0.5,
              bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 220, overflowY: 'auto',
            }}>
              {filtrados.slice(0, 20).map((p, i) => (
                <Box key={p.id}
                  ref={i === searchHighlightIdx ? highlightedRef : undefined}
                  onClick={() => agregarProducto(p)}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.25, cursor: 'pointer',
                    borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
                    bgcolor: i === searchHighlightIdx ? `${P}22` : 'transparent',
                    boxShadow: i === searchHighlightIdx ? `inset 0 0 0 1px ${P}` : 'none',
                    '&:hover': { bgcolor: HOVER },
                  }}>
                  <Typography sx={{ color: INK, fontSize: 13.5 }}>{p.nombre}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.codigo}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Líneas agregadas */}
        {lineas.length > 0 && (
          <Box sx={{ maxHeight: 260, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px', mb: 2 }}>
            {lineas.map((l, i) => (
              <Box key={l.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: i < lineas.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }} noWrap>{l.nombre}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{l.codigo || '—'} · Stock: {l.stock}</Typography>
                </Box>
                <TextField type="number" size="small" value={l.cantidad}
                  onChange={e => setCantidadLinea(l.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchRef.current?.focus(); } }}
                  inputProps={{ min: 0, style: { textAlign: 'right' } }}
                  sx={{ ...fieldSx, width: 90, flexShrink: 0, '& .MuiInputBase-input': { py: '6px', px: '8px' } }} />
                <IconButton size="small" onClick={() => quitarLinea(l.id)} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: ERROR, bgcolor: ERROR_BG } }}>
                  <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* Obligatoria solo para baja — una suba de stock no oculta ningún
            faltante, así que ahí se deja libre como antes (ver
            MovimientosController::store, mismo criterio del lado del backend). */}
        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, mb: 1 }}>
          Nota {modo === 'baja' ? '(obligatoria)' : '(opcional)'}
        </Typography>
        <TextField fullWidth placeholder="Motivo del ajuste..." value={nota}
          onChange={e => setNota(e.target.value)}
          error={modo === 'baja' && !nota.trim()}
          sx={{ ...fieldSx, mb: 3 }} />

        {aplicando ? (
          // Una sola request atómica — no hay progreso fila a fila ni forma
          // de cancelarla a mitad de camino.
          <Box>
            <Typography sx={{ color: INK2, fontSize: 12.5, fontWeight: 600, mb: 0.75 }}>
              Aplicando ajustes…
            </Typography>
            <LinearProgress variant="indeterminate"
              sx={{ height: 8, borderRadius: 4, bgcolor: `${P}20`, '& .MuiLinearProgress-bar': { bgcolor: P, borderRadius: 4 } }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button fullWidth variant="outlined" onClick={handleClose}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              Cancelar
            </Button>
            <Button fullWidth variant="contained" disabled={lineasValidas.length === 0 || (modo === 'baja' && !nota.trim())} onClick={handleConfirmar}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '10px', py: 1.25, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' } }}>
              {`Aplicar y exportar (${lineasValidas.length})`}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Vista Resumen ── */
function VistaResumen({ movimientos }) {
  const [pageSize, setPageSize] = useState(10);
  const [pagina,   setPagina]   = useState(1);

  const porProducto = useMemo(() => agruparPorProducto(movimientos), [movimientos]);

  const totalPages = Math.max(1, Math.ceil(porProducto.length / pageSize));
  const paginados  = porProducto.slice((pagina - 1) * pageSize, pagina * pageSize);

  return (
    <>
      <DataTable
        columns={RESUMEN_COLUMNS}
        rows={paginados}
        emptyMessage="Sin movimientos para mostrar."
        mobileCard={(r) => (
          <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }} noWrap>{r.producto}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12 }}>{r.codigo}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <TrendingUpIcon sx={{ color: SUCCESS, fontSize: 15 }} />
                <Typography sx={{ color: SUCCESS, fontSize: 13, fontWeight: 600 }}>+{r.entradas}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <TrendingDownIcon sx={{ color: ERROR, fontSize: 15 }} />
                <Typography sx={{ color: ERROR, fontSize: 13, fontWeight: 600 }}>{r.salidas}</Typography>
              </Box>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'right' }}>{r.entradas + r.salidas}</Typography>
            </Box>
          </Box>
        )}
      />
      <TablePagination
        pagina={pagina} totalPages={totalPages}
        pageSize={pageSize} totalItems={porProducto.length} label="productos"
        onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }}
      />
    </>
  );
}

/* ── Página principal ── */
export default function Movimientos() {
  const { data: movimientos = [], isLoading: loadingData, refetch: recargarMovimientos } = useMovimientos();
  const [search,         setSearch]         = useState('');
  const [seleccionados,  setSeleccionados]  = useState([]);
  const [vista,          setVista]          = useState('detalle');
  const [openModal,      setOpenModal]      = useState(false);
  const [openImportar,   setOpenImportar]   = useState(false);
  const [openAjusteMasivo, setOpenAjusteMasivo] = useState(false);
  const { recargarProductos } = useProductos();
  const { checkPermisos } = useHasPermiso();
  const { data: sucursales = [] } = useSucursales({ enabled: checkPermisos('list-sucursales') });
  const detalleColumns = useMemo(() => getDetalleColumns(sucursales.length > 1), [sucursales.length]);
  const [pagina,         setPagina]         = useState(1);
  const [pageSize,       setPageSize]       = useState(10);
  const [showFilters,    setShowFilters]    = useState(false);
  const [filtroTipo,     setFiltroTipo]     = useState('');
  const [filtroDesde,    setFiltroDesde]    = useState('');
  const [filtroHasta,    setFiltroHasta]    = useState('');

  // Sin el permiso ver-filtros-fechas, el filtro queda forzado al día de hoy.
  const puedeFiltrarFechas = checkPermisos('verFiltrosFechas');
  const puedeGestionar = checkPermisos('gestionarMovimientos');
  const hoy = toLocalDateStr();
  const effDesde = puedeFiltrarFechas ? filtroDesde : hoy;
  const effHasta = puedeFiltrarFechas ? filtroHasta : hoy;

  const hayFiltros = Boolean(filtroTipo || filtroDesde || filtroHasta);
  const limpiarFiltros = () => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); setPagina(1); };

  useEffect(() => {
    registerTour('/movimientos', [
      { element: '[data-tour="mov-buscar"]', title: 'Buscar y filtrar', description: 'Buscá por producto o código, y filtrá por tipo de movimiento (venta, compra, ajuste) o por rango de fechas.' },
      { element: '[data-tour="mov-vista"]', title: 'Resumen o Detalle', description: 'Vista Resumen: totales agrupados por producto. Vista Detalle: cada movimiento individual, con exportación a Excel.' },
      { element: '[data-tour="mov-tabla"]', title: 'Historial de movimientos', description: 'Cada entrada o salida de stock queda registrada acá: ventas, compras confirmadas y ajustes manuales. Es de solo lectura — no se puede editar ni borrar, para mantener la trazabilidad del inventario.' },
      { element: '[data-tour="mov-registrar"]', title: 'Registrar movimiento', description: 'Vamos a ver cómo se registra un movimiento de stock. Hacé clic en "Siguiente".', click: true, clickDelay: 250 },
      { element: '[data-tour="mov-modal-producto"]', title: 'Producto', description: 'Buscá el producto por nombre o código y elegilo de la lista.' },
      { element: '[data-tour="mov-modal-tipo"]', title: 'Alta, Baja o Transferir', description: 'Elegí el tipo de movimiento: Alta suma stock, Baja resta stock, o Transferir mueve mercadería entre sucursales.' },
      { element: '[data-tour="mov-modal-registrar"]', title: 'Registrar', description: 'Cargá la cantidad, una nota opcional con el motivo, y confirmá para aplicar el ajuste.' },
      { element: '[data-tour="mov-modal-cancelar"]', title: 'Listo', description: 'Cerramos el formulario sin aplicar ningún movimiento.', click: true, clickDelay: 200 },
    ]);
  }, []);

  /* Filtrado */
  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movimientos.filter(m => {
      if (q && !(m.producto.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q))) return false;
      if (filtroTipo && m.tipo !== filtroTipo) return false;
      const fecha = String(m.fecha || '').slice(0, 10);
      if (effDesde && fecha < effDesde) return false;
      if (effHasta && fecha > effHasta) return false;
      return true;
    });
  }, [movimientos, search, filtroTipo, effDesde, effHasta]);

  /* Paginación */
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginados  = filtrados.slice((pagina - 1) * pageSize, pagina * pageSize);

  /* Selección */
  const todosSeleccionados  = paginados.length > 0 && paginados.every(m => seleccionados.includes(m.id));

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(s => s.filter(id => !paginados.find(m => m.id === id)));
    } else {
      setSeleccionados(s => [...new Set([...s, ...paginados.map(m => m.id)])]);
    }
  };

  const toggleUno = (id) => {
    setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const limpiarSeleccion = () => setSeleccionados([]);

  const handleExportar = () => {
    const rows = movimientos.filter(m => seleccionados.includes(m.id));
    exportarCSV(rows, sucursales.length > 1);
  };

  const handleExportarSimplificado = () => {
    const rows = movimientos.filter(m => seleccionados.includes(m.id));
    exportarMovimientosSimplificado(rows);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG }}>

      {/* Header + buscador + filtros */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: BG, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2.5 }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Movimientos de stock
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{movimientos.length} movimientos registrados</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {puedeGestionar && (
            <Tooltip title="Ajuste masivo (varios productos + exportar Excel)">
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => setOpenAjusteMasivo(true)}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Ajuste masivo</Box>
              </Button>
            </Tooltip>
          )}
          {puedeGestionar && (
            <Tooltip title="Importar Excel (sumar o restar stock)">
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setOpenImportar(true)}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Importar Excel</Box>
              </Button>
            </Tooltip>
          )}
          {puedeGestionar && (
            <Tooltip title="Registrar movimiento">
              <Button data-tour="mov-registrar" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: P_HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Registrar movimiento</Box>
              </Button>
            </Tooltip>
          )}
          <AyudaButton />
        </Box>
      </Box>

      {/* ── Buscador ── */}
      <Box data-tour="mov-buscar" sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        <TextField fullWidth placeholder="Buscar por nombre o código..."
          value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
          sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '13px', px: '14px' } }}
        />
        <Button variant="outlined" startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(v => !v)}
          sx={{ color: showFilters || hayFiltros ? P : INK2, borderColor: showFilters || hayFiltros ? P : BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5, whiteSpace: 'nowrap', '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
          Filtros{hayFiltros ? ' •' : ''}
        </Button>
      </Box>

      {/* ── Panel de filtros ── */}
      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
          <FormControl sx={{ minWidth: 160 }}>
            <Select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1); }} displayEmpty
              sx={{ bgcolor: MODAL, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="">Todos los tipos</MenuItem>
              <MenuItem value="venta"  sx={{ '&:hover': { bgcolor: HOVER } }}>Venta</MenuItem>
              <MenuItem value="compra" sx={{ '&:hover': { bgcolor: HOVER } }}>Compra</MenuItem>
              <MenuItem value="ajuste" sx={{ '&:hover': { bgcolor: HOVER } }}>Ajuste</MenuItem>
              <MenuItem value="transferencia_salida"  sx={{ '&:hover': { bgcolor: HOVER } }}>Transferencia (salida)</MenuItem>
              <MenuItem value="transferencia_entrada" sx={{ '&:hover': { bgcolor: HOVER } }}>Transferencia (entrada)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }}
              value={effDesde} onChange={e => { setFiltroDesde(e.target.value); setPagina(1); }}
              disabled={!puedeFiltrarFechas}
              sx={{ ...fieldSx, width: { xs: '100%', sm: 150 }, '& .MuiInputBase-input': { py: '9px', px: '10px', fontSize: 13 } }} />
            <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }}
              value={effHasta} onChange={e => { setFiltroHasta(e.target.value); setPagina(1); }}
              disabled={!puedeFiltrarFechas}
              sx={{ ...fieldSx, width: { xs: '100%', sm: 150 }, '& .MuiInputBase-input': { py: '9px', px: '10px', fontSize: 13 } }} />
          </Box>
          {hayFiltros && (
            <Button onClick={limpiarFiltros}
              sx={{ fontSize: 13, textTransform: 'none', color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '8px' }}>
              Limpiar
            </Button>
          )}
        </Box>
      </Collapse>
      </Box>

      {/* Contenido scrolleable */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        {/* ── Card tabla ── */}
        <Box data-tour="mov-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>

        {/* Cabecera del card */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Movimientos</Typography>
            {seleccionados.length > 0 && (
              <Chip label={`${seleccionados.length} seleccionados`} size="small"
                sx={{ bgcolor: 'rgba(92,110,248,0.15)', color: P, fontWeight: 600, fontSize: 12 }} />
            )}
          </Box>
          <Box data-tour="mov-vista" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {seleccionados.length > 0 && (
              <>
                <Tooltip title="Exportar Excel simplificado (Código/Producto/Cantidad) — para reimportar en otra instalación">
                  <Button size="small" startIcon={<FileDownloadIcon />} onClick={handleExportarSimplificado}
                    sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: HOVER, color: INK } }}>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar simple</Box>
                  </Button>
                </Tooltip>
                <Tooltip title="Exportar Excel completo (fecha, tipo, usuario, etc. — para auditoría)">
                  <Button size="small" startIcon={<FileDownloadIcon />} onClick={handleExportar}
                    sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: HOVER, color: INK } }}>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar Excel</Box>
                  </Button>
                </Tooltip>
                <Button size="small" onClick={limpiarSeleccion}
                  sx={{ color: MUTED, textTransform: 'none', fontSize: 13, '&:hover': { color: INK } }}>
                  Limpiar
                </Button>
              </>
            )}
            {[
              { key: 'resumen', label: 'Resumen' },
              { key: 'detalle', label: 'Detalle' },
            ].map(opt => (
              <Button key={opt.key} size="small" variant={vista === opt.key ? 'contained' : 'outlined'}
                onClick={() => setVista(opt.key)}
                sx={vista === opt.key
                  ? { bgcolor: P, color: '#fff', textTransform: 'none', fontSize: 13, fontWeight: 600, borderRadius: '8px', px: 2, '&:hover': { bgcolor: P_HOVER } }
                  : { color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: 2, '&:hover': { bgcolor: HOVER, color: INK } }
                }>
                {opt.label}
              </Button>
            ))}
          </Box>
        </Box>

        {vista === 'resumen' ? (
          <VistaResumen movimientos={filtrados} />
        ) : (
          <>
            <DataTable
              columns={detalleColumns}
              rows={paginados}
              loading={loadingData}
              select={{
                selected: new Set(seleccionados),
                onToggle: (m) => toggleUno(m.id),
                onToggleAll: toggleTodos,
              }}
              onRowClick={(m) => toggleUno(m.id)}
              emptyMessage="No se encontraron movimientos."
              mobileCard={(m) => (
                <Box onClick={() => toggleUno(m.id)}
                  sx={{ bgcolor: seleccionados.includes(m.id) ? `${P}12` : HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{m.producto}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{m.codigo}</Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}><CantidadCell cantidad={m.cantidad} /></Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TipoChip tipo={m.tipo} cantidad={m.cantidad} />
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtFechaCorta(m.fecha)} {m.hora}</Typography>
                    {m.tipo === 'ajuste' && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); exportarMovimientoExcel(m); }}
                        sx={{ color: MUTED, ml: 'auto', '&:hover': { color: INK }, p: '4px' }}>
                        <FileDownloadIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    )}
                  </Box>
                  {(m.nota || m.subTipo) && (
                    <Typography sx={{ color: INK2, fontSize: 12.5, mt: 0.75 }}>{m.nota || m.subTipo}</Typography>
                  )}
                  {m.usuario && (
                    <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>{m.usuario}</Typography>
                  )}
                </Box>
              )}
            />
            <TablePagination
              pagina={pagina} totalPages={totalPages}
              pageSize={pageSize} totalItems={filtrados.length} label="movimientos"
              onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }}
            />
          </>
        )}
        </Box>
      </Box>

      <ModalMovimiento open={openModal} onClose={() => setOpenModal(false)} sucursales={sucursales} />
      <ModalImportarMovimientos open={openImportar} onClose={() => setOpenImportar(false)}
        onCompletado={() => { recargarMovimientos(); recargarProductos(); }} />
      <ModalAjusteMasivo open={openAjusteMasivo} onClose={() => setOpenAjusteMasivo(false)}
        onCompletado={() => { recargarMovimientos(); recargarProductos(); }} />
    </Box>
  );
}
