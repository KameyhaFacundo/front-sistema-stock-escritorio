import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Tooltip,
  Dialog, DialogContent, Chip, Button, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import SearchIcon         from '@mui/icons-material/Search';
import CloseIcon          from '@mui/icons-material/Close';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import ReceiptLongIcon    from '@mui/icons-material/ReceiptLong';
import QrCode2Icon        from '@mui/icons-material/QrCode2';
import FilterListIcon     from '@mui/icons-material/FilterList';
import { Navigate } from 'react-router-dom';

import {
  BG, CARD, BORDER, INK, INK2, MUTED, P, HOVER, TABLE_HEADER, modalPaperSx,
  SUCCESS, SUCCESS_BG, SUCCESS_BORDER, SUCCESS_LIGHT, ERROR, WARNING, WARNING_BG,
} from '../../theme/tokens';
import { useIsMobile } from '../../utils/responsive';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import usePlan from '../../hooks/usePlan';
import useHasPermiso from '../../hooks/useHasPermiso';
import { useFacturas, useFactura } from '../../hooks/queries/useFacturasQueries';

const COLS  = 'repeat(4, minmax(0, 1fr)) 110px 64px';
const colTh = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

/* ── Chip de tipo (factura vs nota de crédito) ── */
function TipoChip({ factura }) {
  const nc = factura.esNotaCredito;
  return (
    <Chip label={factura.tipoLabel} size="small"
      sx={{
        height: 20, fontSize: 11, fontWeight: 600,
        bgcolor: nc ? WARNING_BG : SUCCESS_BG,
        color: nc ? WARNING : SUCCESS_LIGHT,
        border: `1px solid ${nc ? `${WARNING}55` : SUCCESS_BORDER}`,
      }} />
  );
}

/* ── Modal detalle de un comprobante ── */
function ModalDetalleFactura({ id, onClose }) {
  const { data: factura, isLoading } = useFactura(id);

  return (
    <Dialog open={!!id} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Detalle del comprobante</Typography>
          {factura && <Typography sx={{ color: MUTED, fontSize: 13 }}>{factura.tipoLabel} {factura.numeroCompleto}</Typography>}
        </Box>
        <IconButton data-tour="fac-modal-cerrar" size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1, pb: { xs: 1.75, sm: 3 } }}>
        {isLoading && <Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando...</Typography>}
        {factura && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Cliente</Typography>
                <Typography sx={{ color: INK, fontSize: 14 }}>{factura.clienteNombre}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Fecha</Typography>
                <Typography sx={{ color: INK, fontSize: 14 }}>{fmtDate(factura.fecha)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>CAE</Typography>
                <Typography sx={{ color: INK, fontSize: 14, fontFamily: 'monospace' }}>{factura.cae || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vencimiento CAE</Typography>
                <Typography sx={{ color: INK, fontSize: 14 }}>{fmtDate(factura.vencimientoCae)}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', mb: 2.5 }}>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total</Typography>
                <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22 }}>{fmtMoney(factura.total)}</Typography>
              </Box>
              {factura.qrUrl && (
                <Button component="a" href={factura.qrUrl} target="_blank" rel="noopener noreferrer"
                  startIcon={<QrCode2Icon sx={{ fontSize: 16 }} />}
                  sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12.5, border: `1px solid ${P}55`, borderRadius: '8px', px: 1.5, '&:hover': { bgcolor: `${P}12` } }}>
                  Ver QR (ARCA)
                </Button>
              )}
            </Box>

            {factura.esNotaCredito && factura.comprobanteAsociado && (
              <Box sx={{ p: 2, bgcolor: `${WARNING}0c`, border: `1px solid ${WARNING}40`, borderRadius: '10px', mb: factura.devolucionVenta ? 1.5 : 0 }}>
                <Typography sx={{ color: INK, fontSize: 13 }}>
                  Nota de crédito de la factura{' '}
                  <Box component="span" sx={{ fontWeight: 700 }}>{factura.comprobanteAsociado.numeroCompleto}</Box>
                  {' '}({fmtMoney(factura.comprobanteAsociado.total)} total).
                </Typography>
              </Box>
            )}

            {factura.devolucionVenta && (
              <Box sx={{ p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                  Devolución que originó esta nota de crédito
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mb: factura.devolucionVenta.motivo ? 0.75 : 0 }}>
                  <Typography sx={{ color: INK2, fontSize: 13, minWidth: 0 }}>
                    {fmtDate(factura.devolucionVenta.fecha)}{factura.devolucionVenta.usuario ? ` · ${factura.devolucionVenta.usuario}` : ''}
                  </Typography>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{fmtMoney(factura.devolucionVenta.montoDevuelto)}</Typography>
                </Box>
                {factura.devolucionVenta.motivo && (
                  <Typography sx={{ color: INK2, fontSize: 13 }}>{factura.devolucionVenta.motivo}</Typography>
                )}
              </Box>
            )}

            {!factura.esNotaCredito && factura.disponible != null && (
              <Box sx={{ mt: factura.notasCredito.length > 0 ? 0 : 0 }}>
                {factura.yaAcreditado > 0 && (
                  <Box sx={{ p: 2, bgcolor: `${WARNING}0c`, border: `1px solid ${WARNING}40`, borderRadius: '10px', mb: factura.notasCredito.length > 0 ? 1.5 : 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13 }}>
                      Ya se acreditaron <Box component="span" sx={{ fontWeight: 700 }}>{fmtMoney(factura.yaAcreditado)}</Box> de {fmtMoney(factura.total)}.
                      Disponible para nuevas notas de crédito: <Box component="span" sx={{ fontWeight: 700, color: factura.disponible > 0 ? SUCCESS : ERROR }}>{fmtMoney(factura.disponible)}</Box>.
                    </Typography>
                  </Box>
                )}
                {factura.notasCredito.length > 0 && (
                  <Box>
                    <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                      Notas de crédito emitidas
                    </Typography>
                    {factura.notasCredito.map(nc => (
                      <Box key={nc.id} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, py: 0.75, borderTop: `1px solid ${BORDER}` }}>
                        <Typography sx={{ color: INK2, fontSize: 13, minWidth: 0 }}>{nc.numeroCompleto} · {fmtDate(nc.fecha)}</Typography>
                        <Typography sx={{ color: WARNING, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{fmtMoney(nc.total)}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Facturas() {
  const isMobile = useIsMobile();
  const { tieneFacturacion } = usePlan();
  const { checkPermisos } = useHasPermiso();
  // Sin el permiso ver-filtros-fechas, el filtro queda forzado al día de hoy.
  const puedeFiltrarFechas = checkPermisos('verFiltrosFechas');
  const hoy = toLocalDateStr();
  const [search,       setSearch]       = useState('');
  const [filtroTipo,   setFiltroTipo]   = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDesde,  setFiltroDesde]  = useState('');
  const [filtroHasta,  setFiltroHasta]  = useState('');
  const effDesde = puedeFiltrarFechas ? filtroDesde : hoy;
  const effHasta = puedeFiltrarFechas ? filtroHasta : hoy;
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina,       setPagina]       = useState(1);
  const [pageSize,     setPageSize]     = useState(10);
  const [verId,        setVerId]        = useState(null);

  // enabled: false evita el pedido de red para un plan sin facturación,
  // aunque el redirect de abajo lo saque de la pantalla igual.
  const { data: facturas = [], isLoading } = useFacturas({ per_page: 500 }, { enabled: tieneFacturacion });

  useEffect(() => {
    registerTour('/facturas', [
      { element: '[data-tour="fac-buscar"]', title: 'Buscar comprobante', description: 'Buscá por número de comprobante o nombre del cliente.' },
      { element: '[data-tour="fac-filtros"]', title: 'Filtrar', description: 'Filtrá por tipo (facturas o notas de crédito), estado, o por un rango de fechas.' },
      { element: '[data-tour="fac-tabla"]', title: 'Historial de comprobantes', description: 'Todas las facturas y notas de crédito emitidas, con su CAE y estado.' },
      { element: '[data-tour="fac-ver"]', optional: true, title: 'Ver detalle', description: 'Abrí un comprobante para ver el QR de ARCA y, si es una factura, cuánto ya se acreditó con notas de crédito.', click: true, clickDelay: 250 },
      { element: '[data-tour="fac-modal-cerrar"]', optional: true, title: 'Listo', description: 'Cerramos el detalle del comprobante.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const filtradas = useMemo(() => {
    let list = facturas;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f => f.numeroCompleto.toLowerCase().includes(q) || f.clienteNombre.toLowerCase().includes(q));
    if (filtroTipo === 'factura')      list = list.filter(f => !f.esNotaCredito);
    if (filtroTipo === 'nota_credito') list = list.filter(f => f.esNotaCredito);
    if (filtroEstado !== 'todos') list = list.filter(f => f.estado === filtroEstado);
    if (effDesde) list = list.filter(f => f.fecha >= effDesde);
    if (effHasta) list = list.filter(f => f.fecha <= effHasta);
    return list;
  }, [facturas, search, filtroTipo, filtroEstado, effDesde, effHasta]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const paged      = filtradas.slice((pagina - 1) * pageSize, pagina * pageSize);

  // El ítem del sidebar ya está oculto para estos planes — esto solo cubre
  // acceso directo por URL (bookmark viejo, link compartido, etc.).
  if (!tieneFacturacion) return <Navigate to="/dashboard" replace />;

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Facturas</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{facturas.length} comprobantes emitidos</Typography>
        </Box>
        <AyudaButton />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField data-tour="fac-buscar" placeholder="Buscar por número o cliente..."
          value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
          sx={{
            flex: 1, minWidth: 220,
            '& .MuiOutlinedInput-root': { bgcolor: CARD, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
            '& .MuiInputBase-input': { py: '13px', px: '14px' },
            '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
          }} />
        <Button data-tour="fac-filtros" onClick={() => setMostrarFiltros(v => !v)} startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
          sx={{ color: mostrarFiltros || filtroTipo !== 'todas' || filtroEstado !== 'todos' || filtroDesde || filtroHasta ? P : MUTED, textTransform: 'none', fontWeight: 600, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.75, '&:hover': { bgcolor: HOVER } }}>
          Filtros{(filtroTipo !== 'todas' || filtroEstado !== 'todos' || filtroDesde || filtroHasta) ? ' •' : ''}
        </Button>
      </Box>

      {mostrarFiltros && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="fac-filtro-tipo-label" sx={{ bgcolor: CARD, px: 0.5 }}>Tipo</InputLabel>
            <Select labelId="fac-filtro-tipo-label" value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1); }}
              sx={{ bgcolor: CARD, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
              <MenuItem value="todas">Todos los comprobantes</MenuItem>
              <MenuItem value="factura">Solo facturas</MenuItem>
              <MenuItem value="nota_credito">Solo notas de crédito</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="fac-filtro-estado-label" sx={{ bgcolor: CARD, px: 0.5 }}>Estado</InputLabel>
            <Select labelId="fac-filtro-estado-label" value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}
              sx={{ bgcolor: CARD, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
              <MenuItem value="todos">Todos los estados</MenuItem>
              <MenuItem value="emitida">Emitida</MenuItem>
              <MenuItem value="prueba">Modo prueba</MenuItem>
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }}
            value={effDesde} inputProps={{ max: filtroHasta || undefined }}
            onChange={e => { setFiltroDesde(e.target.value); setPagina(1); }}
            disabled={!puedeFiltrarFechas}
            sx={{ bgcolor: CARD, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }} />
          <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }}
            value={effHasta} inputProps={{ min: filtroDesde || undefined }}
            onChange={e => { setFiltroHasta(e.target.value); setPagina(1); }}
            disabled={!puedeFiltrarFechas}
            sx={{ bgcolor: CARD, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }} />
          {(filtroTipo !== 'todas' || filtroEstado !== 'todos' || filtroDesde || filtroHasta) && (
            <Button onClick={() => { setFiltroTipo('todas'); setFiltroEstado('todos'); setFiltroDesde(''); setFiltroHasta(''); setPagina(1); }}
              sx={{ color: MUTED, textTransform: 'none', fontSize: 12.5, '&:hover': { color: INK } }}>
              Limpiar
            </Button>
          )}
        </Box>
      )}

      <Box data-tour="fac-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Historial de comprobantes</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Facturas y notas de crédito emitidas con CAE de ARCA</Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><Typography sx={{ color: MUTED, fontSize: 13 }}>Cargando...</Typography></Box>
        ) : paged.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptLongIcon sx={{ color: P, fontSize: 28 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>
              {facturas.length === 0 ? 'Todavía no emitiste comprobantes' : 'No hay resultados para este filtro'}
            </Typography>
            {facturas.length === 0 && (
              <Typography sx={{ color: MUTED, fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
                Las facturas se emiten desde el Punto de Venta al confirmar una venta.
              </Typography>
            )}
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {paged.map(f => (
              <Box key={f.id} onClick={() => setVerId(f.id)} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: P, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{f.numeroCompleto}</Typography>
                    <Typography sx={{ color: INK2, fontSize: 13 }}>{f.clienteNombre}</Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}><TipoChip factura={f} /></Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(f.fecha)}</Typography>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{fmtMoney(f.total)}</Typography>
                </Box>
              </Box>
            ))}
            <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtradas.length} label="comprobantes" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
              <Typography sx={colTh}>Comprobante</Typography>
              <Typography sx={colTh}>Cliente</Typography>
              <Typography sx={colTh}>Fecha</Typography>
              <Typography sx={colTh}>Tipo</Typography>
              <Typography sx={{ ...colTh, textAlign: 'right' }}>Total</Typography>
              <Typography sx={{ ...colTh, textAlign: 'right' }}>Ver</Typography>
            </Box>
            {paged.map(f => (
              <Box key={f.id} sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:hover': { bgcolor: HOVER } }}>
                <Typography sx={{ color: P, fontSize: 13.5, fontWeight: 700, fontFamily: 'monospace' }}>{f.numeroCompleto}</Typography>
                <Typography sx={{ color: INK2, fontSize: 14 }} noWrap>{f.clienteNombre}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13.5 }}>{fmtDate(f.fecha)}</Typography>
                <Box><TipoChip factura={f} /></Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, textAlign: 'right' }}>{fmtMoney(f.total)}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="Ver detalle">
                    <IconButton data-tour="fac-ver" size="small" onClick={() => setVerId(f.id)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
                      <VisibilityIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
            <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtradas.length} label="comprobantes" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          </>
        )}
      </Box>

      <ModalDetalleFactura id={verId} onClose={() => setVerId(null)} />
    </Box>
  );
}
