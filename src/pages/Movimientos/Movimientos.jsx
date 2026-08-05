import { useState, useMemo, useEffect, useContext } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Chip, Dialog, DialogContent, Tooltip, Collapse, FormControl, Select, MenuItem,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FilterListIcon   from '@mui/icons-material/FilterList';
import AddIcon          from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon        from '@mui/icons-material/Close';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckIcon        from '@mui/icons-material/Check';
import SwapHorizIcon    from '@mui/icons-material/SwapHoriz';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, DROPDOWN, MODAL, inputSx as fieldSx, SUCCESS, SUCCESS_BG, ERROR, ERROR_BG, modalPaperSx } from '../../theme/tokens';
import { useToast } from '../../context/ToastContext';
import { agruparPorProducto } from '../../utils/movimientosResumen';
import { exportarExcel } from '../../utils/excelExport';
import DataTable       from '../../components/shared/DataTable';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { useProductos } from '../../context/ProductosContextBase';
import { useMovimientos, useTransferirStock } from '../../hooks/queries/useMovimientosQueries';
import { useSucursales } from '../../hooks/queries/useSucursalesQueries';
import useHasPermiso from '../../hooks/useHasPermiso';
import { AuthContext } from '../../auth/AuthContextBase';
import { productosService } from '../../services/productosService';
import { esFraccionable, abrevUnidad } from '../../utils/unidadMedida';
import { toLocalDateStr } from '../../utils/format';

const TIPO_LABELS = {
  ajuste: 'Ajuste', venta: 'Venta', compra: 'Compra',
  transferencia_salida: 'Transferencia (salida)', transferencia_entrada: 'Transferencia (entrada)',
};

/* ── Export Excel ── */
function exportarCSV(rows, mostrarSucursales) {
  exportarExcel({
    filename: 'movimientos.xlsx',
    sheetName: 'Movimientos',
    subtitle: `Movimientos de stock · ${new Date().toLocaleDateString('es-AR')}`,
    columns: [
      { header: 'Fecha',       width: 13, align: 'center' },
      { header: 'Hora',        width: 10, align: 'center' },
      { header: 'Producto',    width: 28 },
      { header: 'Código',      width: 16 },
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
      fmtFechaCorta(r.fecha), r.hora, r.producto, r.codigo,
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
function TipoChip({ tipo }) {
  if (tipo === 'ajuste') {
    return <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500 }}>Ajuste</Typography>;
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
      key: 'hora', header: 'Fecha y hora', flex: true,
      render: (m) => (
        <Box>
          <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500 }}>{fmtFechaCorta(m.fecha)}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12 }}>{m.hora}</Typography>
        </Box>
      ),
    },
    {
      key: 'producto', header: 'Producto', flex: true,
      render: (m) => (
        <Box>
          <Typography sx={{ color: INK, fontSize: 14, fontWeight: 500 }} noWrap>{m.producto}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12 }}>{m.codigo}</Typography>
        </Box>
      ),
    },
    {
      key: 'tipo', header: 'Tipo', flex: true,
      render: (m) => <TipoChip tipo={m.tipo} />,
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
        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{r.producto}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12 }}>{r.codigo}</Typography>
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
  const { productos, ajustarStock } = useProductos();
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const transferirStock = useTransferirStock();
  const [modo,          setModo]          = useState('alta');
  const [searchProd,   setSearchProd]   = useState('');
  const [productoSel,  setProductoSel]  = useState(null);
  const [cantidad,     setCantidad]     = useState('0');
  const [nota,         setNota]         = useState('');
  const [registrando,  setRegistrando]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [idOrigen,     setIdOrigen]     = useState('');
  const [idDestino,    setIdDestino]    = useState('');
  const [stockOrigen,       setStockOrigen]       = useState(null);
  const [cargandoStockOrigen, setCargandoStockOrigen] = useState(false);

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

  // Un producto CON variantes no tiene stock propio (rechazado por el backend
  // para ajuste/transferencia) — se listan sus talles como opciones propias,
  // cada una con el id real de esa variante, para poder tocar su stock puntual.
  const productosParaMovimiento = useMemo(() => productos.flatMap(p => p.tieneVariantes
    ? p.variantes.map(v => ({ ...p, id: v.id, nombre: `${p.nombre} — Talle ${v.talle}`, codigo: v.codigo, talle: v.talle, stock: v.stock, alerta: v.alerta, tieneVariantes: false }))
    : [p]),
  [productos]);

  const filtrados = productosParaMovimiento.filter(p => {
    const q = searchProd.trim().toLowerCase();
    if (!q) return false;
    if (modo === 'transferencia' && p.esCombo) return false;
    return p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
  });

  const handleClose = () => {
    setSearchProd(''); setProductoSel(null);
    setModo('alta'); setCantidad('0'); setNota('');
    setIdOrigen(''); setIdDestino('');
    setStockOrigen(null); setCargandoStockOrigen(false);
    setShowDropdown(false);
    onClose();
  };

  const puedeConfirmar = () => {
    if (!productoSel || Number(cantidad) <= 0) return false;
    if (modo === 'baja' && Number(cantidad) > productoSel.stock) return false;
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
    setRegistrando(true);
    try {
      await ajustarStock(productoSel, cant, nota);
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
      PaperProps={{ sx: modalPaperSx }}>

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
            onChange={e => { setSearchProd(e.target.value); setProductoSel(null); setShowDropdown(true); }}
            onFocus={() => searchProd.trim() && setShowDropdown(true)}
            sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 18 }} /></InputAdornment> }}
          />
          {showDropdown && filtrados.length > 0 && (
            <Box sx={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 0.5,
              bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 260, overflowY: 'auto',
            }}>
              {filtrados.map(p => (
                <Box key={p.id}
                  onClick={() => { setProductoSel(p); setSearchProd(p.nombre); setShowDropdown(false); }}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.5, cursor: 'pointer',
                    borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
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
          onChange={e => setCantidad(e.target.value)}
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

        {/* Nota (solo ajuste) */}
        {modo !== 'transferencia' && (
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
  const { data: movimientos = [], isLoading: loadingData } = useMovimientos();
  const [search,         setSearch]         = useState('');
  const [seleccionados,  setSeleccionados]  = useState([]);
  const [vista,          setVista]          = useState('detalle');
  const [openModal,      setOpenModal]      = useState(false);
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

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Movimientos de stock
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{movimientos.length} movimientos registrados</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Tooltip title="Registrar movimiento">
            <Button data-tour="mov-registrar" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Registrar movimiento</Box>
            </Button>
          </Tooltip>
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
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
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
                <Tooltip title="Exportar Excel">
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
                    <TipoChip tipo={m.tipo} />
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtFechaCorta(m.fecha)} {m.hora}</Typography>
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

      <ModalMovimiento open={openModal} onClose={() => setOpenModal(false)} sucursales={sucursales} />
    </Box>
  );
}
