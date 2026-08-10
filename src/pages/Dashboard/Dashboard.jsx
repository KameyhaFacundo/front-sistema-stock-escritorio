import { useState, useMemo, useEffect, useCallback, useContext, startTransition } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, IconButton, Checkbox, Chip, Select, MenuItem,
  CircularProgress, Tooltip, Dialog, TextField, InputAdornment,
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import FileDownloadIcon  from '@mui/icons-material/FileDownload';
import AttachMoneyIcon   from '@mui/icons-material/AttachMoney';
import BarChartIcon      from '@mui/icons-material/BarChart';
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong';
import ReceiptIcon       from '@mui/icons-material/Receipt';
import CreditCardIcon    from '@mui/icons-material/CreditCard';
import ShoppingBagIcon   from '@mui/icons-material/ShoppingBag';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import StorefrontIcon    from '@mui/icons-material/Storefront';
import SearchIcon        from '@mui/icons-material/Search';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import PrintIcon         from '@mui/icons-material/Print';
import CloseIcon         from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeIcon         from '@mui/icons-material/Badge';
import BlockIcon         from '@mui/icons-material/Block';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteSweepIcon  from '@mui/icons-material/DeleteSweep';
import {
  BG, CARD, BORDER, INK, INK2, MUTED, P, HOVER, TABLE_HEADER,
  SUCCESS, SUCCESS_BG, ERROR, ERROR_BG, ERROR_BORDER, WARNING, WARNING_BG,
  MONEY, PURPLE, ORANGE, modalPaperSx,
} from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import { useApp } from '../../context/AppContextBase';
import { useVentas } from '../../context/VentasContextBase';
import { useVencimientosProximos } from '../../hooks/queries/useLotesQueries';
import { useIsMobile } from '../../utils/responsive';
import { getDashboardStats, getRankingProductos } from '../../services/dashboardService';
import { ventasService } from '../../services/ventasService';
import { emitirNotaCredito, getFactura } from '../../services/arcaService';
import { comprasService } from '../../services/comprasService';
import { cajaService } from '../../services/cajaService';
import { carritosVaciadosService } from '../../services/carritosVaciadosService';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import { metodoMasUsado as calcularMetodoMasUsado } from '../../utils/dashboardAgregados';
import { exportarExcel } from '../../utils/excelExport';
import { useToast } from '../../context/ToastContext';
import useHasPermiso from '../../hooks/useHasPermiso';
import { AuthContext } from '../../auth/AuthContextBase';
import { imprimirTicket } from '../../utils/imprimirTicket';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import AyudaButton from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { getVencimientoBadge } from '../../utils/vencimiento';
import { PRIMARY_COLOR } from '../../config/brand';
import { DEMO_VENTAS } from '../../auth/demoData';
import { DEMO_MODE } from '../../auth/demoMode';

/* ── Constantes ── */
const METODO_LABELS  = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', fiado: 'Fiado' };
const METODO_COLORS  = { efectivo: MONEY, tarjeta: PRIMARY_COLOR, transferencia: PURPLE, qr: ORANGE, fiado: ERROR };
const PIE_COLORS     = [PRIMARY_COLOR, MONEY, PURPLE, ORANGE, WARNING];
const TABS           = ['Resumen', 'Ventas', 'Compras', 'Productos', 'Métodos de pago', 'Historial de Caja'];
const card           = { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px' };
const COL_TH         = { color: MUTED, fontSize: 13, fontWeight: 600, py: 1.5, px: 2, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap', bgcolor: TABLE_HEADER };
const COL_TD         = { color: INK,   fontSize: 13, py: 1.5, px: 2, borderBottom: `1px solid ${BORDER}` };

/* ── Export Excel ── */
function exportarCSV(ventas, desde, hasta) {
  exportarExcel({
    filename: `ventas_${desde}_${hasta}.xlsx`,
    sheetName: 'Ventas',
    subtitle: `Ventas del ${fmtDate(desde)} al ${fmtDate(hasta)}`,
    columns: [
      { header: 'Ticket',     width: 16 },
      { header: 'Fecha',      width: 13, align: 'center' },
      { header: 'Hora',       width: 10, align: 'center' },
      { header: 'Cliente',    width: 22 },
      { header: 'Productos',  width: 45 },
      { header: 'Total',      width: 14, numFmt: '"$" #,##0.00', align: 'right' },
      { header: 'Método',     width: 16 },
    ],
    rows: ventas.map(v => [
      v.numero || v.id,
      v.fecha ? fmtDate(v.fecha) : '',
      v.hora || '',
      v.cliente || 'Consumidor Final',
      (v.items || []).map(i => `${i.nombre} x${i.cantidad}`).join(' | '),
      v.total,
      METODO_LABELS[v.metodo] || v.metodo || '',
    ]),
  });
}

/* ── Tooltips para recharts ── */
function TooltipLinea({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', p: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.5 }}>Día {label}</Typography>
      {payload.map(p => (
        <Typography key={p.name} sx={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {fmtMoney(p.value)}
        </Typography>
      ))}
    </Box>
  );
}
function TooltipBarra({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', p: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ color: P, fontSize: 13, fontWeight: 700 }}>{fmtMoney(payload[0].value)}</Typography>
    </Box>
  );
}
function TooltipHora({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', p: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.5 }}>{label}hs</Typography>
      <Typography sx={{ color: MONEY, fontSize: 13, fontWeight: 700 }}>{payload[0].value} operaciones</Typography>
    </Box>
  );
}

/* ══════════════════════════════════════════
   TAB RESUMEN
══════════════════════════════════════════ */
function TabResumen({ ventas, dashStats, lineData, totalVentasN, ventasPorDia, ventasPorHora, chartBorder, chartMuted }) {
  const metodoMasUsado = useMemo(
    () => calcularMetodoMasUsado(ventas, METODO_LABELS, totalVentasN),
    [ventas, totalVentasN]
  );

  const productoMasVendido = useMemo(() => {
    const map = {};
    ventas.forEach(v => v.items?.forEach(i => { map[i.nombre] = (map[i.nombre] || 0) + (i.cantidad || 1); }));
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return top ? { nombre: top[0], uni: top[1] } : null;
  }, [ventas]);

  const topProductos = useMemo(() => {
    const map = {};
    ventas.forEach(v => v.items?.forEach(i => {
      if (!map[i.nombre]) map[i.nombre] = { nombre: i.nombre, unidades: 0, ingresos: 0 };
      map[i.nombre].unidades += i.cantidad || 1;
      map[i.nombre].ingresos += (i.precio || 0) * (i.cantidad || 1);
    }));
    return Object.values(map).sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  }, [ventas]);

  // Agregados reales del backend (suma/filtra sobre TODO el catálogo, no
  // solo lo que haya en memoria) — ver DashboardController::stats().
  const stockBajo = (dashStats?.stockBajo ?? []).slice(0, 6);
  const ventasRecientes = ventas.slice(0, 5);
  const valorInventario = dashStats?.valorInventario ?? { costo: 0, venta: 0 };

  const infoCards = [
    { label: 'Valor del inventario', value: fmtMoney(valorInventario.costo),                 sub: `Precio de venta: ${fmtMoney(valorInventario.venta)}`,          color: MONEY, Icon: AttachMoneyIcon },
    { label: 'Pago más usado',       value: metodoMasUsado.nombre,                          sub: metodoMasUsado.pct,                             color: WARNING, Icon: CreditCardIcon   },
    { label: 'Producto más popular', value: productoMasVendido?.nombre || 'Sin ventas',      sub: productoMasVendido ? `${productoMasVendido.uni} unidades` : '', color: P, Icon: ShoppingBagIcon  },
    { label: 'Stock bajo',           value: stockBajo.length > 0 ? `${stockBajo.length} productos` : 'Todo en orden', sub: stockBajo.length > 0 ? 'Requieren reposición' : '', color: ERROR, Icon: WarningAmberIcon },
  ];

  return (
    <>
      {/* Info cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
        {infoCards.map(c => (
          <Box key={c.label} sx={{ ...card, p: 2.5, display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, overflow: 'hidden' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${c.color}18`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.Icon sx={{ color: c.color, fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: MUTED, fontSize: 12, mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</Typography>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</Typography>
              {c.sub && <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</Typography>}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2.5 }}>

        {/* Línea — período filtrado */}
        <Box sx={{ ...card, p: 3, height: 320 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Ingresos por día</Typography>
              <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Total vendido por día en el período</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {[{ label: 'Ingresos', color: PRIMARY_COLOR }].map(l => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color }} />
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{l.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={218}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartBorder} vertical={false} />
              <XAxis dataKey="dia" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <ReTooltip content={<TooltipLinea />} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke={PRIMARY_COLOR} strokeWidth={2} dot={{ fill: PRIMARY_COLOR, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Barras — últimos 7 días */}
        <Box sx={{ ...card, p: 3, height: 320 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Últimos 7 días</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>Ingresos diarios recientes</Typography>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ventasPorDia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartBorder} vertical={false} />
              <XAxis dataKey="dia" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <ReTooltip content={<TooltipBarra />} cursor={{ fill: 'rgba(92,110,248,0.06)', radius: 6 }} />
              <Bar dataKey="ingresos" fill={PRIMARY_COLOR} radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Operaciones por hora */}
      <Box sx={{ ...card, p: 3, mb: 2.5, height: 260 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Operaciones por hora del día</Typography>
        <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>Cantidad de ventas según horario</Typography>
        <ResponsiveContainer width="100%" height={158}>
          <BarChart data={ventasPorHora} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartBorder} vertical={false} />
            <XAxis dataKey="hora" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <ReTooltip content={<TooltipHora />} cursor={{ fill: `${MONEY}10`, radius: 6 }} />
            <Bar dataKey="ops" fill={MONEY} radius={[5, 5, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Bottom — ventas recientes + top productos + stock bajo */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>

        {/* Ventas recientes */}
        <Box sx={{ ...card, p: 3 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Ventas recientes</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>Últimas operaciones</Typography>
          {ventasRecientes.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: MUTED, fontSize: 13 }}>Sin ventas registradas</Typography>
            </Box>
          ) : ventasRecientes.map(v => (
            <Box key={v.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(92,110,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StorefrontIcon sx={{ color: P, fontSize: 15 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.cliente || 'Consumidor Final'}
                  </Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11 }}>#{v.id}</Typography>
                </Box>
              </Box>
              <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmtMoney(v.total)}</Typography>
            </Box>
          ))}
        </Box>

        {/* Top productos */}
        <Box sx={{ ...card, p: 3 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Top productos</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>Por unidades vendidas</Typography>
          {topProductos.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: MUTED, fontSize: 13 }}>Sin datos</Typography>
            </Box>
          ) : topProductos.map((p, i) => {
            const max = topProductos[0].unidades;
            return (
              <Box key={p.nombre} sx={{ mb: 1.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ color: MUTED, fontSize: 12, minWidth: 16 }}>{i + 1}.</Typography>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{p.nombre}</Typography>
                  </Box>
                  <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{p.unidades} u</Typography>
                </Box>
                <Box sx={{ height: 4, borderRadius: 2, bgcolor: HOVER }}>
                  <Box sx={{ height: '100%', width: `${(p.unidades / max) * 100}%`, borderRadius: 2, bgcolor: P }} />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Alertas de stock */}
        <Box sx={{ ...card, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Alertas de stock</Typography>
            {stockBajo.length > 0 && (
              <Chip label={stockBajo.length} size="small"
                sx={{ bgcolor: WARNING_BG, color: WARNING, fontWeight: 700, fontSize: 11, height: 20, '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>Productos bajo el mínimo</Typography>
          {stockBajo.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: SUCCESS, fontSize: 13, fontWeight: 500 }}>Todo el stock en orden</Typography>
            </Box>
          ) : stockBajo.map(p => (
            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box>
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }}>{p.nombre}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11 }}>{p.codigo}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: p.stock === 0 ? ERROR : WARNING, fontSize: 13, fontWeight: 700 }}>{p.stock} u</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11 }}>mín: {p.alerta}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}

/* ── Modal: devolución parcial de una venta ── */
function ModalDevolucionVenta({ open, onClose, venta, onDevuelto }) {
  const toast = useToast();
  const [cantidades, setCantidades] = useState({});
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setCantidades({}); setMotivo(''); }
  }, [open, venta?.rawId]);

  if (!venta) return null;

  const itemsDevolvibles = (venta.items || []).filter(i => (i.disponibleDevolver ?? i.cantidad) > 0);

  const totalADevolver = itemsDevolvibles.reduce((s, i) => {
    const cant = Math.min(Number(cantidades[i.id]) || 0, i.disponibleDevolver ?? i.cantidad);
    return s + cant * i.precio;
  }, 0);

  const handleConfirmar = async () => {
    const lineas = itemsDevolvibles
      .map(i => ({ idLineaVenta: i.id, cantidad: Math.min(Number(cantidades[i.id]) || 0, i.disponibleDevolver ?? i.cantidad) }))
      .filter(l => l.cantidad > 0);
    if (lineas.length === 0) { toast('Ingresá una cantidad a devolver', 'error'); return; }

    setSaving(true);
    try {
      const { message, montoDevuelto, idDevolucion } = await ventasService.crearDevolucion(venta.rawId, { lineas, motivo: motivo.trim() });
      // El endpoint devuelve la devolución en sí, no la venta actualizada —
      // se refresca aparte para reflejar el nuevo estado/cantidades.
      const ventaActualizada = await ventasService.getById(venta.rawId);
      onDevuelto?.(ventaActualizada, montoDevuelto, idDevolucion);
      toast(message || 'Devolución registrada', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo registrar la devolución', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AssignmentReturnIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Devolver productos</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, maxHeight: '70vh', overflowY: 'auto' }}>
        {itemsDevolvibles.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>
            No queda nada de esta venta disponible para devolver.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
              {itemsDevolvibles.map(i => (
                <Box key={i.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }} noWrap>{i.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>
                      {fmtMoney(i.precio)} c/u · disponible: {i.disponibleDevolver ?? i.cantidad} de {i.cantidad}
                    </Typography>
                  </Box>
                  <TextField type="number" size="small" placeholder="0" value={cantidades[i.id] ?? ''}
                    onChange={e => {
                      const raw = e.target.value;
                      const max = i.disponibleDevolver ?? i.cantidad;
                      const clamped = raw === '' ? '' : String(Math.max(0, Math.min(Number(raw) || 0, max)));
                      setCantidades(c => ({ ...c, [i.id]: clamped }));
                    }}
                    inputProps={{ min: 0, max: i.disponibleDevolver ?? i.cantidad, step: '0.01' }}
                    sx={{ width: 84, '& input': { textAlign: 'center' } }} />
                </Box>
              ))}
            </Box>

            <TextField fullWidth placeholder="Motivo (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.75, borderRadius: '10px', bgcolor: `${P}0c`, border: `1px solid ${P}18`, mb: 2.5 }}>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>Total a devolver</Typography>
              <Typography sx={{ color: P, fontSize: 18, fontWeight: 800 }}>{fmtMoney(totalADevolver)}</Typography>
            </Box>

            <Button fullWidth variant="contained" disabled={saving || totalADevolver <= 0} onClick={handleConfirmar}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25, '&:hover': { bgcolor: P, filter: 'brightness(0.92)' }, '&.Mui-disabled': { opacity: 0.4, color: '#fff', bgcolor: P } }}>
              {saving ? 'Registrando...' : 'Confirmar devolución'}
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  );
}

/* ── Modal: ofrecer Nota de Crédito tras anular/devolver una venta facturada ── */
function ModalNotaCredito({ open, onClose, factura, montoSugerido, idDevolucion }) {
  const toast = useToast();
  const [monto, setMonto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setMonto(montoSugerido != null ? String(montoSugerido) : '');
  }, [open, montoSugerido]);

  if (!factura) return null;

  const handleEmitir = async () => {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) { toast('Ingresá un monto válido', 'error'); return; }
    setSaving(true);
    try {
      const res = await emitirNotaCredito(factura.id, montoNum, idDevolucion);
      if (res.success) {
        if (res.pendiente) {
          // Sin internet o ARCA no respondió — igual que con una factura, el
          // backend la termina sola en cuanto vuelva la conexión (ver
          // EmitirNotaCreditoJob); se puede seguir el resultado desde Facturas.
          toast('Sin conexión con ARCA — la nota de crédito se va a confirmar sola. Podés seguirla desde Facturas.', 'warning');
        } else {
          toast(`Nota de crédito ${res.data.numero_completo ?? 'emitida'}${res.data.cae ? ` · CAE: ${res.data.cae.slice(0, 6)}...` : ''}`, 'success');
        }
        onClose();
      } else {
        toast(res.errores?.[0] || res.message || 'No se pudo emitir la nota de crédito', 'error');
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Error al conectar con ARCA', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ReceiptLongIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Emitir Nota de Crédito</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 } }}>
        <Typography sx={{ color: MUTED, fontSize: 13, mb: 2, lineHeight: 1.6 }}>
          Esta venta tiene la factura <Box component="span" sx={{ color: INK, fontWeight: 600 }}>{factura.numeroCompleto}</Box> — para que tus libros fiscales queden bien, emitile una Nota de Crédito por lo que se anuló/devolvió.
        </Typography>
        <TextField fullWidth type="number" label="Monto a acreditar" value={monto} onChange={e => setMonto(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }}
          sx={{ mb: 2.5 }} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} fullWidth
            sx={{ color: INK2, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: HOVER } }}>
            Ahora no
          </Button>
          <Button variant="contained" fullWidth disabled={saving} onClick={handleEmitir}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: P, filter: 'brightness(0.92)' }, '&.Mui-disabled': { opacity: 0.4, color: '#fff', bgcolor: P } }}>
            {saving ? 'Emitiendo...' : 'Emitir Nota de Crédito'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   TAB VENTAS
══════════════════════════════════════════ */
function TabVentas({ ventas, onVentaActualizada }) {
  const [busqueda, setBusqueda] = useState('');
  const [perPage,  setPerPage]  = useState(10);
  const [selected, setSelected] = useState([]);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [confirmarAnular, setConfirmarAnular] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [modalDevolucion, setModalDevolucion] = useState(false);
  const [modalNotaCredito, setModalNotaCredito] = useState({ open: false, factura: null, montoSugerido: 0, idDevolucion: null });
  const isMobile = useIsMobile();
  const toast = useToast();
  const { checkPermisos } = useHasPermiso();
  const { user } = useContext(AuthContext);
  const puedeAnular = checkPermisos('anularVenta');
  const puedeDevolver = checkPermisos('devolverVenta');

  // Reimprimir cualquier venta pasada (no solo la última) desde el listado —
  // si tiene factura, se trae completa (CAE/QR) porque la que viaja embebida
  // en mapVenta() es un resumen recortado (ver ventasService.js).
  const handleImprimir = async (rawId) => {
    const v = ventas.find(vv => vv.id === rawId);
    if (!v) return;
    try {
      const factura = v.factura ? await getFactura(v.factura.id) : null;
      await imprimirTicket({
        ticketId: v.id,
        fecha: fmtDate(v.fecha),
        hora: v.hora,
        items: (v.items || []).map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, unidadMedida: i.unidadMedida, precioOriginal: i.precioOriginal ?? i.precio })),
        subtotal: (v.items || []).reduce((s, i) => s + i.precio * i.cantidad, 0),
        ajuste: null,
        total: v.total,
        metodo: v.metodo,
        pagos: v.pagos,
        cliente: v.cliente,
        efectivoRecibido: null,
        vuelto: null,
        vendedor: v.usuario,
      }, user?.empresa, factura);
    } catch (e) {
      toast(e.message || 'No se pudo abrir la impresión del ticket', 'error');
    }
  };

  const rows = useMemo(() => ventas.map(v => ({
    rawId:     v.id,
    // El código interno (v.numero, ej. "MSGL50HT-6790") es un timestamp en
    // base-36 pensado para generarse offline sin ir al servidor — sirve para
    // el ticket impreso y para matchear el movimiento de stock, pero como
    // "ID" visible en la lista es ilegible; se muestra el id real de la venta.
    id:        String(v.id),
    ticketCodigo: v.numero || '',
    fecha:     v.fecha || '—',
    hora:      v.hora  || '',
    cliente:   v.cliente || 'Consumidor Final',
    usuario:   v.usuario || '—',
    items:     v.items || [],
    pagos:     v.pagos || null,
    metodo:    METODO_LABELS[v.metodo] || v.metodo || '—',
    total:     fmtMoney(v.total || 0),
    estado:    v.estado || 'confirmada',
    factura:   v.factura || null,
  })), [ventas]);

  const handleAnularVenta = async () => {
    if (!detalleVenta) return;
    setAnulando(true);
    try {
      const { venta, message } = await ventasService.anular(detalleVenta.rawId);
      toast(message || 'Venta anulada correctamente', 'success');
      onVentaActualizada?.(venta);
      setDetalleVenta(v => v ? { ...v, estado: venta.estado, factura: venta.factura } : v);
      // Esta venta ya tenía una factura con CAE — ofrecer la Nota de Crédito
      // correspondiente (nunca se emite en silencio, el modal pide confirmar).
      if (venta.factura) {
        setModalNotaCredito({ open: true, factura: venta.factura, montoSugerido: venta.factura.total });
      }
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo anular la venta', 'error');
    } finally {
      setAnulando(false);
    }
  };

  const filtradas = rows.filter(v =>
    v.id.includes(busqueda) ||
    v.ticketCodigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Box data-tour="dash-ventas-header" sx={{ ...card, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, borderBottom: `1px solid ${BORDER}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BarChartIcon sx={{ color: INK2, fontSize: 20 }} />
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Ventas Realizadas</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{filtradas.length} venta{filtradas.length !== 1 ? 's' : ''} en el período</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 0.75, width: isMobile ? '100%' : 'auto' }}>
          <SearchIcon sx={{ color: MUTED, fontSize: 17, flexShrink: 0 }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por ID, cliente o vendedor..."
            style={{ background: 'transparent', border: 'none', color: INK, fontSize: 13, outline: 'none', width: isMobile ? '100%' : 180, minWidth: 0, fontFamily: 'inherit' }} />
        </Box>
      </Box>
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
          {filtradas.length === 0 ? (
            <Typography sx={{ color: MUTED, fontSize: 14, textAlign: 'center', py: 4 }}>Sin ventas en el período</Typography>
          ) : filtradas.slice(0, perPage).map((v, i) => (
            <Box key={v.id} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, display: 'flex', alignItems: 'center', gap: 1.5, opacity: v.estado === 'cancelada' ? 0.55 : 1 }}>
              <Checkbox size="small" checked={selected.includes(v.id)} onChange={() => setSelected(s => s.includes(v.id) ? s.filter(x => x !== v.id) : [...s, v.id])}
                sx={{ color: MUTED, '&.Mui-checked': { color: P }, p: 0.5, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                  <Typography sx={{ color: INK2, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>#{v.id}</Typography>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{v.total}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ color: INK, fontSize: 13 }}>{v.cliente}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11 }}>{fmtDate(v.fecha)}</Typography>
                  <Chip label={v.metodo} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: HOVER, color: MUTED }} />
                  {v.estado === 'cancelada' && (
                    <Chip label="Anulada" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ERROR_BG, color: ERROR }} />
                  )}
                </Box>
                {v.usuario !== '—' && (
                  <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>Vendió: {v.usuario}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                <IconButton data-tour={i === 0 ? 'dash-venta-ver' : undefined} size="small" onClick={() => setDetalleVenta(v)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}12` } }}>
                  <VisibilityIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => handleImprimir(v.rawId)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}12` } }}>
                  <PrintIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <Box component="th" sx={{ ...COL_TH, width: 40, px: 1.5 }}>
                <Checkbox size="small" sx={{ color: MUTED, '&.Mui-checked': { color: P } }} />
              </Box>
              {['ID', 'Fecha', 'Cliente', 'Usuario', 'Método', 'Total', 'Acciones'].map(h => (
                <Box component="th" key={h} sx={COL_TH}>{h}</Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: MUTED, fontSize: 14 }}>Sin ventas en el período</td></tr>
            ) : filtradas.slice(0, perPage).map((v, i) => (
              <Box component="tr" key={v.id} sx={{ '&:hover': { bgcolor: HOVER }, transition: 'background 0.15s', opacity: v.estado === 'cancelada' ? 0.55 : 1 }}>
                <Box component="td" sx={{ ...COL_TD, px: 1.5, width: 40 }}>
                  <Checkbox size="small" checked={selected.includes(v.id)} onChange={() => setSelected(s => s.includes(v.id) ? s.filter(x => x !== v.id) : [...s, v.id])}
                    sx={{ color: MUTED, '&.Mui-checked': { color: P } }} />
                </Box>
                <Box component="td" sx={COL_TD}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ color: INK2, fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600 }}>#{v.id}</Typography>
                    {v.estado === 'cancelada' && (
                      <Chip label="Anulada" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: ERROR_BG, color: ERROR, '& .MuiChip-label': { px: 0.6 } }} />
                    )}
                  </Box>
                </Box>
                <Box component="td" sx={COL_TD}>{fmtDate(v.fecha)}</Box>
                <Box component="td" sx={COL_TD}>{v.cliente}</Box>
                <Box component="td" sx={{ ...COL_TD, color: INK2 }}>{v.usuario}</Box>
                <Box component="td" sx={COL_TD}>{v.metodo}</Box>
                <Box component="td" sx={{ ...COL_TD, fontWeight: 700 }}>{v.total}</Box>
                <Box component="td" sx={COL_TD}>
                  <Tooltip title="Ver detalle">
                    <IconButton data-tour={i === 0 ? 'dash-venta-ver' : undefined} size="small" onClick={() => setDetalleVenta(v)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}12` } }}>
                      <VisibilityIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Imprimir ticket">
                    <IconButton size="small" onClick={() => handleImprimir(v.rawId)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}12` } }}>
                      <PrintIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </tbody>
        </table>
      </Box>
      )}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${BORDER}` }}>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>Mostrando</Typography>
        <Select value={perPage} onChange={e => setPerPage(e.target.value)} size="small"
          sx={{ bgcolor: HOVER, color: INK, fontSize: 13, '.MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, height: 28 }}>
          {[10, 25, 50].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>)}
        </Select>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>de <strong style={{ color: INK }}>{filtradas.length}</strong> ventas</Typography>
      </Box>

      {/* Modal: Detalle de venta — md (no sm) para que la tabla de productos
          (Producto/Cant./Precio/Subtotal) no quede amontonada. */}
      <Dialog open={Boolean(detalleVenta)} onClose={() => setDetalleVenta(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: modalPaperSx }}>
        {detalleVenta && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ReceiptLongIcon sx={{ color: P, fontSize: 20 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Detalle de venta</Typography>
                    {detalleVenta.estado === 'cancelada' && (
                      <Chip label="ANULADA" size="small" icon={<BlockIcon sx={{ fontSize: '13px !important' }} />}
                        sx={{ bgcolor: ERROR_BG, color: ERROR, border: `1px solid ${ERROR_BORDER}`, fontSize: 10.5, fontWeight: 700, height: 20 }} />
                    )}
                  </Box>
                  <Typography sx={{ color: MUTED, fontFamily: 'monospace', fontSize: 12 }}>{detalleVenta.id}</Typography>
                </Box>
              </Box>
              <IconButton data-tour="dash-venta-cerrar" size="small" onClick={() => setDetalleVenta(null)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Info general */}
              <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 2, mb: 2.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                  { label: 'Fecha',   value: `${fmtDate(detalleVenta.fecha)} ${detalleVenta.hora}`.trim(), Icon: CalendarTodayIcon },
                  { label: 'Método',  value: detalleVenta.metodo,  Icon: CreditCardIcon },
                  { label: 'Cliente', value: detalleVenta.cliente, Icon: PersonOutlineIcon },
                  { label: 'Vendió',  value: detalleVenta.usuario, Icon: BadgeIcon },
                ].map(({ label, value, Icon }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Icon sx={{ color: P, fontSize: 16, mt: '2px', flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: MUTED, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</Typography>
                      <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Productos */}
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5, mb: 1 }}>
                Productos {detalleVenta.items.length > 0 && `(${detalleVenta.items.length})`}
              </Typography>
              <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', mb: 2.5 }}>
                {detalleVenta.items.length === 0 ? (
                  <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Sin detalle de productos</Typography>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Producto', 'Cant.', 'Precio', 'Subtotal'].map((h, idx) => (
                          <Box component="th" key={h} sx={{
                            color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                            textAlign: idx === 0 ? 'left' : 'right', py: 1, px: 1.5, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`,
                          }}>{h}</Box>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.items.map((i, idx) => (
                        <Box component="tr" key={idx} sx={{ '&:hover': { bgcolor: HOVER } }}>
                          <Box component="td" sx={{ py: 1, px: 1.5, borderBottom: idx < detalleVenta.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }}>{i.nombre}</Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1.5, textAlign: 'right', color: MUTED, fontSize: 13, borderBottom: idx < detalleVenta.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            {i.cantidad}
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1.5, textAlign: 'right', color: MUTED, fontSize: 13, borderBottom: idx < detalleVenta.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            {fmtMoney(i.precio)}
                          </Box>
                          <Box component="td" sx={{ py: 1, px: 1.5, textAlign: 'right', color: INK, fontSize: 13, fontWeight: 700, borderBottom: idx < detalleVenta.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            {fmtMoney(i.precio * i.cantidad)}
                          </Box>
                        </Box>
                      ))}
                    </tbody>
                  </table>
                )}
              </Box>

              {Array.isArray(detalleVenta.pagos) && detalleVenta.pagos.length > 1 && (
                <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, mb: 2.5 }}>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13, mb: 1 }}>Pagos combinados</Typography>
                  {detalleVenta.pagos.map((p, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                      <Typography sx={{ color: INK2, fontSize: 13 }}>{METODO_LABELS[p.metodo] || p.metodo}</Typography>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{fmtMoney(p.monto)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.75, borderRadius: '10px', bgcolor: `${P}0c`, border: `1px solid ${P}18` }}>
                <Typography sx={{ color: INK, fontSize: 15, fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ color: P, fontSize: 20, fontWeight: 800 }}>{detalleVenta.total}</Typography>
              </Box>

              {detalleVenta.estado !== 'cancelada' && puedeDevolver && (detalleVenta.items || []).some(i => (i.disponibleDevolver ?? i.cantidad) > 0) && (
                <Button data-tour="dash-venta-devolver" fullWidth startIcon={<AssignmentReturnIcon sx={{ fontSize: 17 }} />} onClick={() => setModalDevolucion(true)}
                  sx={{ mt: 2.5, color: P, borderColor: `${P}55`, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1, border: `1px solid ${P}55`, '&:hover': { bgcolor: `${P}12` } }}>
                  Devolver productos
                </Button>
              )}

              {detalleVenta.estado !== 'cancelada' && puedeAnular && (
                <Button data-tour="dash-venta-anular" fullWidth startIcon={<BlockIcon sx={{ fontSize: 17 }} />} onClick={() => setConfirmarAnular(true)}
                  sx={{ mt: 1, color: ERROR, borderColor: ERROR_BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1, border: `1px solid ${ERROR_BORDER}`, '&:hover': { bgcolor: ERROR_BG } }}>
                  Anular venta
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmarAnular}
        onClose={() => setConfirmarAnular(false)}
        onConfirm={handleAnularVenta}
        title="¿Anular esta venta?"
        message="Se repondrá el stock de los productos y se ajustará la caja si corresponde (efectivo cobrado o pagos de fiado ya registrados). Esta acción no se puede deshacer."
        confirmLabel={anulando ? 'Anulando...' : 'Anular venta'}
      />

      <ModalDevolucionVenta
        open={modalDevolucion}
        onClose={() => setModalDevolucion(false)}
        venta={detalleVenta}
        onDevuelto={(ventaActualizada, montoDevuelto, idDevolucion) => {
          // ventaActualizada viene "plana" de mapVenta() (misma forma que usan
          // ventasFiltradas/onVentaActualizada) — acá adentro detalleVenta tiene
          // además rawId/id de display que hay que conservar, por eso se
          // mergean solo los campos que la devolución pudo haber cambiado.
          onVentaActualizada?.(ventaActualizada);
          setDetalleVenta(v => v ? {
            ...v,
            estado: ventaActualizada.estado,
            items: ventaActualizada.items,
            total: fmtMoney(ventaActualizada.total),
            factura: ventaActualizada.factura,
          } : v);
          // Esta venta ya tenía una factura con CAE — ofrecer la Nota de
          // Crédito por el monto de esta devolución puntual.
          if (ventaActualizada.factura) {
            setModalNotaCredito({ open: true, factura: ventaActualizada.factura, montoSugerido: montoDevuelto, idDevolucion });
          }
        }}
      />

      <ModalNotaCredito
        open={modalNotaCredito.open}
        onClose={() => setModalNotaCredito(m => ({ ...m, open: false }))}
        factura={modalNotaCredito.factura}
        montoSugerido={modalNotaCredito.montoSugerido}
        idDevolucion={modalNotaCredito.idDevolucion}
      />
    </Box>
  );
}

/* ══════════════════════════════════════════
   TAB PRODUCTOS
══════════════════════════════════════════ */
function ListaProductos({ datos, labelCol, labelSub, placeholder, footer }) {
  const [busq, setBusq] = useState('');
  const filtrados = datos.filter(d => d.nombre.toLowerCase().includes(busq.toLowerCase()));
  const max = Math.max(...datos.map(d => d.ingresos), 1);
  return (
    <Box sx={{ ...card, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>{labelCol}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>{footer}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 1 }}>
        <SearchIcon sx={{ color: MUTED, fontSize: 17 }} />
        <input value={busq} onChange={e => setBusq(e.target.value)} placeholder={placeholder}
          style={{ background: 'transparent', border: 'none', color: INK, fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
      </Box>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: `1px solid ${BORDER}`, mb: 1 }}>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>PRODUCTO</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>INGRESOS</Typography>
        </Box>
        {filtrados.length === 0
          ? <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Sin datos</Typography>
          : filtrados.map((d, i) => (
            <Box key={d.nombre} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: MUTED, fontSize: 12, minWidth: 16 }}>{i + 1}.</Typography>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color ?? P, flexShrink: 0 }} />
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 500 }}>{d.nombre}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>{fmtMoney(d.ingresos)}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11 }}>{d.unidades ?? d.ventas} {d.unidades !== undefined ? 'uni.' : 'venta'}</Typography>
                </Box>
              </Box>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: HOVER, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${(d.ingresos / max) * 100}%`, borderRadius: 2, bgcolor: d.color ?? P, transition: 'width 0.4s ease' }} />
              </Box>
            </Box>
          ))
        }
      </Box>
      <Typography sx={{ color: MUTED, fontSize: 12, mt: 'auto' }}>
        Mostrando {filtrados.length} de {datos.length} {labelSub}
      </Typography>
    </Box>
  );
}

const COMPRA_ESTADO_LABELS = { confirmada: 'Confirmada', pendiente: 'Pendiente', cancelada: 'Anulada' };
const COMPRA_ESTADO_COLORS = {
  confirmada: { bg: SUCCESS_BG, fg: SUCCESS },
  pendiente:  { bg: WARNING_BG, fg: WARNING },
  cancelada:  { bg: ERROR_BG,   fg: ERROR },
};

function TabCompras({ compras, onCompraActualizada }) {
  const [busqueda, setBusqueda] = useState('');
  const [perPage,  setPerPage]  = useState(10);
  const [detalleCompra,   setDetalleCompra]   = useState(null);
  const [detalleLoading,  setDetalleLoading]  = useState(false);
  const [confirmarAnular, setConfirmarAnular] = useState(false);
  const [anulando,        setAnulando]        = useState(false);
  const isMobile = useIsMobile();
  const toast = useToast();
  const { checkPermisos } = useHasPermiso();
  const puedeAnular = checkPermisos('anularCompra');

  const rows = useMemo(() => compras.map(c => ({
    rawId:     c.id,
    id:        String(c.id).padStart(5, '0'),
    fecha:     c.fecha || '—',
    proveedor: c.proveedor || 'Sin proveedor',
    usuario:   c.usuario || '—',
    metodo:    METODO_LABELS[c.metodo_pago] || c.metodo_pago || '—',
    total:     fmtMoney(c.total || 0),
    estado:    c.estado || 'pendiente',
  })), [compras]);

  const filtradas = rows.filter(c =>
    c.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleVerDetalle = async (rawId) => {
    setDetalleLoading(true);
    try {
      const full = await comprasService.getById(rawId);
      setDetalleCompra(full);
    } catch { toast('Error al cargar el detalle de la compra', 'error'); } finally {
      setDetalleLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!detalleCompra) return;
    setAnulando(true);
    try {
      const actualizada = await comprasService.changeStatus(detalleCompra.id, 'cancelada');
      toast('Compra anulada. Se revirtió el stock y la caja correspondiente.', 'success');
      onCompraActualizada?.(actualizada);
      setDetalleCompra(actualizada);
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo anular la compra', 'error');
    } finally {
      setAnulando(false);
    }
  };

  return (
    <Box data-tour="dash-compras-header" sx={{ ...card, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, borderBottom: `1px solid ${BORDER}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon sx={{ color: INK2, fontSize: 20 }} />
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Compras Registradas</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{filtradas.length} compra{filtradas.length !== 1 ? 's' : ''} en el período</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 0.75, width: isMobile ? '100%' : 'auto' }}>
          <SearchIcon sx={{ color: MUTED, fontSize: 17, flexShrink: 0 }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por ID, proveedor o usuario..."
            style={{ background: 'transparent', border: 'none', color: INK, fontSize: 13, outline: 'none', width: isMobile ? '100%' : 190, minWidth: 0, fontFamily: 'inherit' }} />
        </Box>
      </Box>
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
          {filtradas.length === 0 ? (
            <Typography sx={{ color: MUTED, fontSize: 14, textAlign: 'center', py: 4 }}>Sin compras en el período</Typography>
          ) : filtradas.slice(0, perPage).map((c, i) => {
            const ec = COMPRA_ESTADO_COLORS[c.estado] || COMPRA_ESTADO_COLORS.pendiente;
            return (
              <Box key={c.id} data-tour={i === 0 ? 'dash-compra-ver' : undefined} onClick={() => handleVerDetalle(c.rawId)}
                sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2, cursor: 'pointer', opacity: c.estado === 'cancelada' ? 0.55 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                  <Typography sx={{ color: INK2, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{c.id}</Typography>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{c.total}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ color: INK, fontSize: 13 }}>{c.proveedor}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11 }}>{fmtDate(c.fecha)}</Typography>
                  <Chip label={COMPRA_ESTADO_LABELS[c.estado]} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ec.bg, color: ec.fg }} />
                </Box>
                {c.usuario !== '—' && (
                  <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>Registró: {c.usuario}</Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {['ID', 'Fecha', 'Proveedor', 'Usuario', 'Método', 'Total', 'Estado', 'Acciones'].map(h => (
                <Box component="th" key={h} sx={COL_TH}>{h}</Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: MUTED, fontSize: 14 }}>Sin compras en el período</td></tr>
            ) : filtradas.slice(0, perPage).map((c, i) => {
              const ec = COMPRA_ESTADO_COLORS[c.estado] || COMPRA_ESTADO_COLORS.pendiente;
              return (
                <Box component="tr" key={c.id} onClick={() => handleVerDetalle(c.rawId)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: HOVER }, transition: 'background 0.15s', opacity: c.estado === 'cancelada' ? 0.55 : 1 }}>
                  <Box component="td" sx={COL_TD}>
                    <Typography sx={{ color: INK2, fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600 }}>{c.id}</Typography>
                  </Box>
                  <Box component="td" sx={COL_TD}>{fmtDate(c.fecha)}</Box>
                  <Box component="td" sx={COL_TD}>{c.proveedor}</Box>
                  <Box component="td" sx={{ ...COL_TD, color: INK2 }}>{c.usuario}</Box>
                  <Box component="td" sx={COL_TD}>{c.metodo}</Box>
                  <Box component="td" sx={{ ...COL_TD, fontWeight: 700 }}>{c.total}</Box>
                  <Box component="td" sx={COL_TD}>
                    <Chip label={COMPRA_ESTADO_LABELS[c.estado]} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: ec.bg, color: ec.fg }} />
                  </Box>
                  <Box component="td" sx={COL_TD} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Ver detalle">
                      <IconButton data-tour={i === 0 ? 'dash-compra-ver' : undefined} size="small" onClick={() => handleVerDetalle(c.rawId)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}12` } }}>
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </tbody>
        </table>
      </Box>
      )}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${BORDER}` }}>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>Mostrando</Typography>
        <Select value={perPage} onChange={e => setPerPage(e.target.value)} size="small"
          sx={{ bgcolor: HOVER, color: INK, fontSize: 13, '.MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, height: 28 }}>
          {[10, 25, 50].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>)}
        </Select>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>de <strong style={{ color: INK }}>{filtradas.length}</strong> compras</Typography>
      </Box>

      {/* Modal: Detalle de compra */}
      <Dialog open={Boolean(detalleCompra) || detalleLoading} onClose={() => setDetalleCompra(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: modalPaperSx }}>
        {detalleCompra && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LocalShippingIcon sx={{ color: P, fontSize: 20 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Detalle de compra</Typography>
                    <Chip label={COMPRA_ESTADO_LABELS[detalleCompra.estado]} size="small"
                      icon={detalleCompra.estado === 'cancelada' ? <BlockIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                      sx={{
                        bgcolor: (COMPRA_ESTADO_COLORS[detalleCompra.estado] || COMPRA_ESTADO_COLORS.pendiente).bg,
                        color:   (COMPRA_ESTADO_COLORS[detalleCompra.estado] || COMPRA_ESTADO_COLORS.pendiente).fg,
                        fontSize: 10.5, fontWeight: 700, height: 20,
                      }} />
                  </Box>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>Proveedor: {detalleCompra.proveedor}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setDetalleCompra(null)} sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, maxHeight: '55vh', overflowY: 'auto' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Fecha</Typography>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>{fmtDate(detalleCompra.fecha)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Registró</Typography>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>{detalleCompra.usuario || '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Método de pago</Typography>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>{METODO_LABELS[detalleCompra.metodo_pago] || detalleCompra.metodo_pago}</Typography>
                </Box>
                {detalleCompra.estado === 'cancelada' && detalleCompra.anuladoPor && (
                  <Box>
                    <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Anulado por</Typography>
                    <Typography sx={{ color: ERROR, fontSize: 13.5, fontWeight: 600 }}>
                      {detalleCompra.anuladoPor}{detalleCompra.fechaAnulacion ? ` · ${fmtDate(detalleCompra.fechaAnulacion)}` : ''}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 1fr 1fr', px: 2, py: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
                  {['Producto', 'Cant.', 'Costo', 'Subtotal'].map(h => (
                    <Typography key={h} sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</Typography>
                  ))}
                </Box>
                {(detalleCompra.lineas || []).length === 0 ? (
                  <Typography sx={{ color: MUTED, fontSize: 13, p: 2 }}>Sin detalle de productos</Typography>
                ) : detalleCompra.lineas.map((l, i) => (
                  <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 1fr 1fr', px: 2, py: 1.25, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
                    <Typography sx={{ color: INK, fontSize: 13 }} noWrap>{l.nombre}</Typography>
                    <Typography sx={{ color: INK2, fontSize: 13 }}>{l.cantidad}</Typography>
                    <Typography sx={{ color: INK2, fontSize: 13 }}>{fmtMoney(l.precio_compra)}</Typography>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{fmtMoney(l.subtotal)}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography sx={{ color: MUTED, fontSize: 13 }}>Total</Typography>
                <Typography sx={{ color: INK, fontWeight: 800, fontSize: 18 }}>{fmtMoney(detalleCompra.total)}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, borderTop: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
              {detalleCompra.estado === 'confirmada' && puedeAnular && (
                <Button data-tour="dash-compra-anular" onClick={() => setConfirmarAnular(true)} startIcon={<BlockIcon sx={{ fontSize: 16 }} />}
                  sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: ERROR_BG } }}>
                  Anular compra
                </Button>
              )}
              <Button data-tour="dash-compra-cerrar" onClick={() => setDetalleCompra(null)} variant="contained"
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                Cerrar
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmarAnular}
        onClose={() => setConfirmarAnular(false)}
        onConfirm={handleAnular}
        title="¿Anular esta compra?"
        message={`Se va a revertir el stock que sumó esta compra${detalleCompra?.metodo_pago === 'efectivo' ? ' y devolver el monto a la caja' : ''}. Esta acción no se puede deshacer.`}
        confirmLabel={anulando ? 'Anulando...' : 'Anular compra'}
      />
    </Box>
  );
}

function TablaSinMovimiento({ datos, dias }) {
  const [busq, setBusq] = useState('');
  const filtrados = datos.filter(d => d.nombre.toLowerCase().includes(busq.toLowerCase()));
  return (
    <Box sx={{ ...card, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Sin movimiento</Typography>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>
          Sin ventas en los últimos {dias} días · capital parado, ordenado de mayor a menor
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 1 }}>
        <SearchIcon sx={{ color: MUTED, fontSize: 17 }} />
        <input value={busq} onChange={e => setBusq(e.target.value)} placeholder="Buscar producto..."
          style={{ background: 'transparent', border: 'none', color: INK, fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit' }} />
      </Box>
      <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', gap: 1, pb: 1, borderBottom: `1px solid ${BORDER}`, mb: 1 }}>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>PRODUCTO</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>STOCK</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>CAPITAL</Typography>
        </Box>
        {filtrados.length === 0
          ? <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Sin datos</Typography>
          : filtrados.map(d => (
            <Box key={d.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', gap: 1, py: 0.75, borderBottom: `1px solid ${BORDER}` }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 500 }} noWrap>{d.nombre}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11 }}>{d.codigo}</Typography>
              </Box>
              <Typography sx={{ color: INK2, fontSize: 13, textAlign: 'right' }}>{d.stock}</Typography>
              <Typography sx={{ color: WARNING, fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{fmtMoney(d.valorCapital)}</Typography>
            </Box>
          ))
        }
      </Box>
      <Typography sx={{ color: MUTED, fontSize: 12, mt: 'auto' }}>
        Mostrando {filtrados.length} de {datos.length} productos
      </Typography>
    </Box>
  );
}

function TabProductos({ ventas, ranking }) {
  // Se reemplazó el cálculo client-side (limitado a las 300 ventas que trae
  // el fetch de esta pestaña, impreciso en rangos grandes) por el agregado
  // real del backend — ver DashboardController::rankingProductos().
  const productosData = useMemo(() => (ranking?.masVendidos ?? []).map(p => ({ ...p, color: P })), [ranking]);

  const categoriasData = useMemo(() => {
    const map = {};
    ventas.forEach(v => v.items?.forEach(i => {
      const cat = i.categoria || 'Sin categoría';
      if (!map[cat]) map[cat] = { nombre: cat, ingresos: 0, ventas: 0, color: '#a78bfa' };
      map[cat].ingresos += (i.precio || 0) * (i.cantidad || 1);
      map[cat].ventas += 1;
    }));
    return Object.values(map).sort((a, b) => b.ingresos - a.ingresos);
  }, [ventas]);

  if (ranking && productosData.length === 0 && categoriasData.length === 0) return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <Typography sx={{ color: MUTED, fontSize: 14 }}>Sin ventas en el período seleccionado</Typography>
    </Box>
  );

  return (
    <Box data-tour="dash-productos-grid" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ListaProductos datos={productosData} labelCol="Productos" labelSub="productos" placeholder="Buscar producto..."
          footer={`${productosData.length} producto${productosData.length !== 1 ? 's' : ''} vendido${productosData.length !== 1 ? 's' : ''}`} />
        <ListaProductos datos={categoriasData} labelCol="Categorías" labelSub="categorías" placeholder="Buscar categoría..."
          footer={`${categoriasData.length} categoría${categoriasData.length !== 1 ? 's' : ''}`} />
      </Box>
      {ranking?.sinMovimiento && (
        <TablaSinMovimiento datos={ranking.sinMovimiento} dias={ranking.diasSinMovimiento} />
      )}
    </Box>
  );
}

/* ── DonutChart fuera del render para no recrearlo ── */
function DonutChart({ data, centro, subtitulo, metodosPago, chartInk, chartMuted }) {
  return (
    <Box sx={{ ...card, p: 3 }}>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>{subtitulo}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270}>
              {data.map((_, i) => <Cell key={i} fill={metodosPago[i % metodosPago.length]?.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
              <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill={chartInk} fontSize={20} fontWeight={700}>{centro}</text>
              <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fill={chartMuted} fontSize={11}>métodos</text>
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ flex: 1 }}>
          {metodosPago.map(m => (
            <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: m.color }} />
              <Typography sx={{ color: INK, fontSize: 13 }}>{m.name}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, ml: 'auto' }}>{Math.round((m.ventas / (metodosPago.reduce((s, x) => s + x.ventas, 0) || 1)) * 100)}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ══════════════════════════════════════════
   TAB MÉTODOS DE PAGO
══════════════════════════════════════════ */
function TabMetodosPago({ ventas }) {
  const { mode } = useAppTheme();
  const chartInk   = mode === 'dark' ? '#e4e7f0' : '#0f172a';
  const chartMuted = mode === 'dark' ? '#656e85' : '#94a3b8';

  const metodosPago = useMemo(() => {
    const map = {};
    ventas.forEach(v => {
      const name = METODO_LABELS[v.metodo] || v.metodo || 'Otro';
      if (!map[name]) map[name] = { name, ventas: 0, ingresos: 0, color: METODO_COLORS[v.metodo] || '#a78bfa' };
      map[name].ventas   += 1;
      map[name].ingresos += v.total || 0;
    });
    return Object.values(map);
  }, [ventas]);

  const totalVentas   = metodosPago.reduce((s, m) => s + m.ventas,   0);
  const totalIngresos = metodosPago.reduce((s, m) => s + m.ingresos, 0);
  const pieDataVentas = metodosPago.map(m => ({ name: m.name, value: m.ventas }));
  const pieDataDinero = metodosPago.map(m => ({ name: m.name, value: m.ingresos }));

  if (metodosPago.length === 0) return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <Typography sx={{ color: MUTED, fontSize: 14 }}>Sin ventas en el período seleccionado</Typography>
    </Box>
  );

  const TH = { color: MUTED, fontSize: 12, fontWeight: 700, py: 1.25, px: 2, borderBottom: `1px solid ${BORDER}`, letterSpacing: '0.05em', bgcolor: TABLE_HEADER };
  const TD = { color: INK,   fontSize: 13, py: 1.5, px: 2, borderBottom: `1px solid ${BORDER}` };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box data-tour="dash-metodos-charts" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <DonutChart data={pieDataVentas} centro={totalVentas}       subtitulo="Ventas por medio de pago"  metodosPago={metodosPago} chartInk={chartInk} chartMuted={chartMuted} />
        <DonutChart data={pieDataDinero} centro={metodosPago.length} subtitulo="Dinero por medio de pago" metodosPago={metodosPago} chartInk={chartInk} chartMuted={chartMuted} />
      </Box>
      <Box data-tour="dash-metodos-tabla" sx={{ ...card, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Detalle por medio de pago</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                {['MEDIO', 'VENTAS', 'INGRESOS', 'TICKET PROM.'].map(h => (
                  <Box component="th" key={h} sx={{ ...TH, textAlign: h === 'MEDIO' ? 'left' : 'right' }}>{h}</Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {metodosPago.map(m => (
              <Box component="tr" key={m.name} sx={{ '&:hover': { bgcolor: HOVER } }}>
                <Box component="td" sx={TD}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: m.color }} />
                    {m.name}
                  </Box>
                </Box>
                <Box component="td" sx={{ ...TD, textAlign: 'right' }}>{m.ventas}</Box>
                <Box component="td" sx={{ ...TD, textAlign: 'right' }}>{fmtMoney(m.ingresos)}</Box>
                <Box component="td" sx={{ ...TD, textAlign: 'right' }}>{fmtMoney(m.ventas ? m.ingresos / m.ventas : 0)}</Box>
              </Box>
            ))}
            <Box component="tr" sx={{ bgcolor: HOVER }}>
              <Box component="td" sx={{ ...TD, fontWeight: 700, color: MUTED, letterSpacing: '0.05em', fontSize: 12 }}>TOTAL</Box>
              <Box component="td" sx={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{totalVentas}</Box>
              <Box component="td" sx={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(totalIngresos)}</Box>
              <Box component="td" sx={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(totalVentas ? totalIngresos / totalVentas : 0)}</Box>
            </Box>
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    );
  }

/* ══════════════════════════════════════════
   TAB AUDITORÍA — carritos vaciados en el POS
══════════════════════════════════════════ */
function TabAuditoria() {
  const [carritos, setCarritos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [verDetalle, setVerDetalle] = useState(null);

  useEffect(() => {
    let vivo = true;
    startTransition(() => setLoading(true));
    carritosVaciadosService.getAll()
      .then(data => { if (vivo) startTransition(() => setCarritos(data)); })
      .catch(() => { if (vivo) startTransition(() => setCarritos([])); })
      .finally(() => { if (vivo) startTransition(() => setLoading(false)); });
    return () => { vivo = false; };
  }, []);

  const TH = { color: MUTED, fontSize: 13, fontWeight: 600, py: 1.5, px: 2.5, borderBottom: `1px solid ${BORDER}`, textAlign: 'left', whiteSpace: 'nowrap', bgcolor: TABLE_HEADER };
  const TD = { color: INK,   fontSize: 13, py: 1.75, px: 2.5, borderBottom: `1px solid ${BORDER}` };

  if (loading) {
    return (
      <Box sx={{ ...card, display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: P }} />
      </Box>
    );
  }

  return (
    <Box data-tour="dash-auditoria-tabla" sx={{ ...card, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Carritos vaciados</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12.5 }}>Registro de cada “Vaciar carrito” del POS — qué había cargado y quién lo vació.</Typography>
      </Box>
      {carritos.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: `${MUTED}12`, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <DeleteSweepIcon sx={{ color: MUTED, fontSize: 26 }} />
          </Box>
          <Typography sx={{ color: INK2, fontWeight: 600, fontSize: 15, mb: 0.5 }}>Sin carritos vaciados</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, maxWidth: 320, mx: 'auto', lineHeight: 1.5 }}>
            Cuando alguien use “Vaciar carrito” en el POS, va a aparecer acá.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr>{['Fecha', 'Usuario', 'Sucursal', 'Ítems', 'Total', ''].map(h => (
                <Box component="th" key={h} sx={TH}>{h}</Box>
              ))}</tr>
            </thead>
            <tbody>
              {carritos.map(c => (
                <Box component="tr" key={c.id} sx={{ '&:hover': { bgcolor: HOVER }, cursor: 'pointer' }} onClick={() => setVerDetalle(c)}>
                  <Box component="td" sx={TD}>{fmtDate(c.fecha)}</Box>
                  <Box component="td" sx={{ ...TD, color: INK2 }}>{c.usuario || '—'}</Box>
                  <Box component="td" sx={{ ...TD, color: MUTED }}>{c.sucursal || '—'}</Box>
                  <Box component="td" sx={TD}>{c.items.length}</Box>
                  <Box component="td" sx={{ ...TD, fontWeight: 600 }}>{fmtMoney(c.total)}</Box>
                  <Box component="td" sx={{ ...TD, textAlign: 'right' }}>
                    <Tooltip title="Ver detalle"><VisibilityIcon sx={{ fontSize: 16, color: MUTED }} /></Tooltip>
                  </Box>
                </Box>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      <Dialog open={!!verDetalle} onClose={() => setVerDetalle(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: CARD, backgroundImage: 'none', border: `1px solid ${BORDER}`, borderRadius: '16px' } }}>
        {verDetalle && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Carrito vaciado</Typography>
              <IconButton size="small" onClick={() => setVerDetalle(null)} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 12.5, mb: 2 }}>
              {fmtDate(verDetalle.fecha)} · {verDetalle.usuario || 'Usuario desconocido'} · {verDetalle.sucursal || 'Sin sucursal'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {verDetalle.items.map((it, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.75, borderBottom: i < verDetalle.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <Typography sx={{ color: INK, fontSize: 13.5 }}>{it.cantidad} x {it.nombre}</Typography>
                  <Typography sx={{ color: INK2, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>{fmtMoney(it.precio * it.cantidad)}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: `1px solid ${BORDER}` }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>Total</Typography>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{fmtMoney(verDetalle.total)}</Typography>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}

/* ══════════════════════════════════════════
   TAB HISTORIAL DE CAJA
══════════════════════════════════════════ */
function TabCaja({ desde, hasta }) {
  const [turnos,  setTurnos]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    startTransition(() => setLoading(true));
    cajaService.historial({ per_page: 100 })
      .then(data => { if (vivo) startTransition(() => setTurnos(Array.isArray(data) ? data : [])); })
      .catch(() => { if (vivo) startTransition(() => setTurnos([])); })
      .finally(() => { if (vivo) startTransition(() => setLoading(false)); });
    return () => { vivo = false; };
  }, []);

  const TH = { color: MUTED, fontSize: 13, fontWeight: 600, py: 1.5, px: 2.5, borderBottom: `1px solid ${BORDER}`, textAlign: 'left', whiteSpace: 'nowrap', bgcolor: TABLE_HEADER };
  const TD = { color: INK,   fontSize: 13, py: 1.75, px: 2.5, borderBottom: `1px solid ${BORDER}` };

  const filas = turnos
    .filter(t => t.fecha >= desde && t.fecha <= hasta)
    .map(t => {
      const ingresos   = t.movimientosDetalle.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
      const egresos    = t.movimientosDetalle.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
      const esperado   = t.montoInicial + t.ventasEfectivo + ingresos - egresos;
      const diferencia = t.montoFinal != null ? t.montoFinal - esperado : null;
      return {
        apertura:   `${fmtDate(t.fecha)} ${t.horaApertura || ''}`.trim(),
        cierre:     t.horaCierre || '—',
        usuario:    t.usuario || '—',
        inicial:    t.montoInicial,
        final:      t.montoFinal,
        diferencia,
        estado:     t.abierta ? 'Abierta' : 'Cerrada',
      };
    });

  if (loading) {
    return (
      <Box sx={{ ...card, display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: P }} />
      </Box>
    );
  }

  return (
    <Box data-tour="dash-caja-tabla" sx={{ ...card, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Historial de Caja</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12.5 }}>Sesiones de caja en el período seleccionado</Typography>
      </Box>
      {filas.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: `${MONEY}12`, border: `1px solid ${MONEY}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <AttachMoneyIcon sx={{ color: MONEY, fontSize: 28 }} />
          </Box>
          <Typography sx={{ color: INK2, fontWeight: 600, fontSize: 15, mb: 0.5 }}>Sin sesiones de caja</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, maxWidth: 320, mx: 'auto', lineHeight: 1.5 }}>
            Las sesiones de caja cerradas aparecerán aquí con su balance detallado.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr>{['Apertura', 'Cierre', 'Usuario', 'Monto Inicial', 'Monto Final', 'Diferencia', 'Estado'].map(h => (
                <Box component="th" key={h} sx={TH}>{h}</Box>
              ))}</tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <Box component="tr" key={i} sx={{ '&:hover': { bgcolor: HOVER } }}>
                  <Box component="td" sx={TD}>{f.apertura}</Box>
                  <Box component="td" sx={{ ...TD, color: MUTED }}>{f.cierre}</Box>
                  <Box component="td" sx={{ ...TD, color: INK2 }}>{f.usuario}</Box>
                  <Box component="td" sx={{ ...TD, fontWeight: 600 }}>{fmtMoney(f.inicial)}</Box>
                  <Box component="td" sx={{ ...TD, color: MUTED }}>{f.final != null ? fmtMoney(f.final) : '—'}</Box>
                  <Box component="td" sx={{ ...TD, color: f.diferencia == null ? MUTED : f.diferencia === 0 ? SUCCESS : ERROR, fontWeight: 600 }}>
                    {f.diferencia != null ? fmtMoney(f.diferencia) : '—'}
                  </Box>
                  <Box component="td" sx={TD}>
                    <Chip label={f.estado} size="small"
                      sx={{
                        bgcolor: f.estado === 'Abierta' ? SUCCESS_BG : HOVER,
                        color:   f.estado === 'Abierta' ? SUCCESS : MUTED,
                        fontSize: 12, fontWeight: 600, height: 24,
                      }} />
                  </Box>
                </Box>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function Dashboard() {
  const { checkPermisos } = useHasPermiso();
  // Sin el permiso ver-filtros-fechas, el período queda forzado al día de hoy.
  const puedeFiltrarFechas = checkPermisos('verFiltrosFechas');
  const [tab,   setTab]   = useState(0);
  const [desde, setDesde] = useState(() => {
    if (!puedeFiltrarFechas) return toLocalDateStr();
    const d = new Date(); d.setDate(1); return toLocalDateStr(d);
  });
  const [hasta, setHasta] = useState(() => toLocalDateStr());

  const { mode } = useAppTheme();
  const ventasCtx = useVentas().ventas;
  const { statsHoy, loadingData, recargarDashboardStats } = useApp();
  const [dashStats, setDashStats] = useState(null);
  // Pestaña sensible (detectar mal uso de "vaciar carrito") — a diferencia
  // del resto de las pestañas, esta se oculta del todo sin el permiso, no
  // solo sus acciones internas.
  const puedeVerAuditoria = checkPermisos('verCarritosVaciados');
  const tabs = puedeVerAuditoria ? [...TABS, 'Auditoría'] : TABS;
  const tabAuditoriaIndex = TABS.length;

  const chartBorder = mode === 'dark' ? '#1e2230' : '#e2e8f0';
  const chartMuted  = mode === 'dark' ? '#656e85' : '#94a3b8';

  // Stats rápidas del endpoint /dashboard/stats
  const refetchDashStats = useCallback(() => {
    getDashboardStats({ desde, hasta }).then(s => startTransition(() => setDashStats(s))).catch(() => {});
  }, [desde, hasta]);

  useEffect(() => { refetchDashStats(); }, [refetchDashStats]);

  // Ranking de productos (agregado real del backend) — separado de dashStats
  // porque solo hace falta en la pestaña "Productos", sin límite de 300 filas.
  const [rankingProductos, setRankingProductos] = useState(null);
  useEffect(() => {
    getRankingProductos({ desde, hasta }).then(r => startTransition(() => setRankingProductos(r))).catch(() => {});
  }, [desde, hasta]);

  // La ayuda del dashboard depende de la pestaña activa: cada una tiene su
  // propio recorrido que explica solo lo que se ve en pantalla en ese momento
  // (antes era un único tour fijo que siempre arrancaba en Resumen y saltaba
  // solo a Ventas, sin explicar Productos/Métodos de pago/Caja).
  useEffect(() => {
    const porTab = {
      0: [
        { element: '[data-tour="dash-kpis"]', title: 'Indicadores clave', description: 'Un vistazo rápido a las ventas, ingresos, ganancia y stock bajo del período seleccionado.' },
        { element: '[data-tour="dash-filtros"]', title: 'Filtrar por fecha', description: 'Elegí el rango DESDE / HASTA para analizar cualquier período. El botón Excel exporta las ventas filtradas.' },
        { element: '[data-tour="dash-tabs"]', title: 'Secciones del dashboard', description: 'Resumen, Ventas, Compras, Productos, Métodos de pago e Historial de Caja — cada pestaña analiza el mismo período desde otro ángulo. Abrí la Ayuda de nuevo parado en cualquiera de ellas para ver su propia explicación.' },
      ],
      1: [
        { element: '[data-tour="dash-ventas-header"]', title: 'Listado de ventas', description: 'Cada fila es una venta del período seleccionado. Buscá por número, cliente o vendedor con el buscador de arriba.' },
        { element: '[data-tour="dash-venta-ver"]', optional: true, title: 'Ver detalle de una venta', description: 'Abre el ticket completo: productos, cliente, método de pago y quién la vendió.', click: true, clickDelay: 250 },
        { element: '[data-tour="dash-venta-devolver"]', optional: true, title: 'Devolver productos', description: 'Devolvé una o varias líneas de la venta — repone el stock y ajusta la caja o el saldo de fiado. Si la venta ya tenía factura, después te ofrece emitir la Nota de Crédito correspondiente.' },
        { element: '[data-tour="dash-venta-anular"]', optional: true, title: 'Anular venta', description: 'Si algo salió mal, podés anular la venta desde acá — repone el stock vendido y ajusta la caja si corresponde. Te pide una confirmación aparte antes de aplicarlo.' },
        { element: '[data-tour="dash-venta-cerrar"]', optional: true, title: 'Listo', description: 'Cerramos el detalle de la venta.', click: true, clickDelay: 200 },
      ],
      2: [
        { element: '[data-tour="dash-compras-header"]', title: 'Listado de compras', description: 'Cada fila es una compra a proveedor del período seleccionado. Buscá por ID, proveedor o usuario con el buscador de arriba.' },
        { element: '[data-tour="dash-compra-ver"]', optional: true, title: 'Ver detalle de una compra', description: 'Abre el detalle completo: productos, proveedor, método de pago y quién la registró.', click: true, clickDelay: 250 },
        { element: '[data-tour="dash-compra-anular"]', optional: true, title: 'Anular compra', description: 'Si algo salió mal, podés anular la compra desde acá — revierte el stock sumado y ajusta la caja si corresponde. Te pide una confirmación aparte antes de aplicarlo.' },
        { element: '[data-tour="dash-compra-cerrar"]', optional: true, title: 'Listo', description: 'Cerramos el detalle de la compra.', click: true, clickDelay: 200 },
      ],
      3: [
        { element: '[data-tour="dash-productos-grid"]', title: 'Ranking de productos y categorías', description: 'Los productos y categorías más vendidos del período, ordenados por ingresos. Cada lista tiene su propio buscador.' },
      ],
      4: [
        { element: '[data-tour="dash-metodos-charts"]', title: 'Ventas por medio de pago', description: 'Comparación entre cantidad de ventas y dinero recaudado según el método de pago usado.' },
        { element: '[data-tour="dash-metodos-tabla"]', title: 'Detalle por medio de pago', description: 'Ventas, ingresos y ticket promedio de cada método, con el total al pie.' },
      ],
      5: [
        { element: '[data-tour="dash-caja-tabla"]', title: 'Historial de caja', description: 'Cada sesión de caja del período: apertura, cierre, montos y la diferencia entre lo esperado y lo contado al cerrar.' },
      ],
      [tabAuditoriaIndex]: [
        { element: '[data-tour="dash-auditoria-tabla"]', title: 'Carritos vaciados', description: 'Cada vez que alguien usa "Vaciar carrito" en el POS queda registrado acá: qué tenía cargado y quién lo vació.' },
      ],
    };
    registerTour('/dashboard', porTab[tab] || porTab[0]);
  }, [tab, tabAuditoriaIndex]);

  // Fetch propio por rango de fecha — no limitado por el caché global
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loadingDash,     setLoadingDash]     = useState(true);

  useEffect(() => {
    let active = true;
    ventasService.getAll({ fecha_desde: desde, fecha_hasta: hasta, per_page: 300 })
      .then(data => {
        if (!active) return;
        // DEMO_VENTAS es relleno para el modo demo — fuera de DEMO_MODE, una cuenta
        // real sin ventas en el rango (negocio nuevo, día tranquilo) o con la request
        // fallada mostraba ventas inventadas como si fueran reales.
        const resultado = data?.length
          ? data
          : (DEMO_MODE ? DEMO_VENTAS.filter(v => v.fecha >= desde && v.fecha <= hasta) : []);
        startTransition(() => { setVentasFiltradas(resultado); setLoadingDash(false); });
      })
      .catch(() => {
        if (!active) return;
        const fallback = DEMO_MODE ? DEMO_VENTAS.filter(v => v.fecha >= desde && v.fecha <= hasta) : [];
        startTransition(() => { setVentasFiltradas(fallback); setLoadingDash(false); });
      });
    return () => { active = false; };
  }, [desde, hasta]);

  const actualizarVentaLocal = (ventaActualizada) => {
    setVentasFiltradas(prev => prev.map(v => v.id === ventaActualizada.id ? ventaActualizada : v));
    // La venta anulada ya no debe contar en los totales — recargamos ambas fuentes de stats
    // (el propio rango de fechas del Dashboard y el "hoy" global del AppContext).
    refetchDashStats();
    recargarDashboardStats();
  };

  // Mismo patrón que ventasFiltradas: fetch propio por rango de fecha para la
  // pestaña "Compras" — quién registró cada compra y su estado actual
  // (confirmada/pendiente/anulada), para poder auditarlas a simple vista.
  const [comprasFiltradas, setComprasFiltradas] = useState([]);

  useEffect(() => {
    let active = true;
    comprasService.getAll({ fecha_desde: desde, fecha_hasta: hasta, per_page: 300 })
      .then(data => { if (active) startTransition(() => setComprasFiltradas(data || [])); })
      .catch(() => { if (active) setComprasFiltradas([]); });
    return () => { active = false; };
  }, [desde, hasta]);

  const actualizarCompraLocal = (compraActualizada) => {
    setComprasFiltradas(prev => prev.map(c => c.id === compraActualizada.id ? compraActualizada : c));
  };

  // Una venta anulada no debe contarse como ingreso/venta real en ningún gráfico o total
  // (sí se sigue mostrando en el listado de TabVentas, marcada con el badge "Anulada").
  const ventasActivas = useMemo(() => ventasFiltradas.filter(v => v.estado !== 'cancelada'), [ventasFiltradas]);

  const ingresos       = dashStats?.totalIngresos ?? ventasActivas.reduce((s, v) => s + (v.total || 0), 0);
  const totalVentasN   = dashStats?.totalVentas ?? ventasActivas.length;
  const ticketPromedio = dashStats?.ticketPromedio ?? (totalVentasN ? ingresos / totalVentasN : 0);
  const stockBajoCount = dashStats?.stockBajo?.length ?? 0;

  const statsData = [
    { label: 'Ingresos del período', value: fmtMoney(ingresos),      Icon: AttachMoneyIcon, color: MONEY  },
    { label: 'Total de Ventas',      value: String(totalVentasN),     Icon: BarChartIcon,    color: P      },
    { label: 'Ticket Promedio',      value: fmtMoney(ticketPromedio), Icon: ReceiptLongIcon, color: ORANGE  },
    { label: 'Ventas hoy',           value: statsHoy.totalVentas,     Icon: ReceiptIcon,     color: PRIMARY_COLOR },
  ];

  const lineData = useMemo(() => {
    const result = [];
    const start = new Date(desde + 'T12:00:00');
    const end   = new Date(hasta + 'T12:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const dia     = d.toISOString().slice(8, 10);
      const dayV    = ventasActivas.filter(v => v.fecha?.slice(0, 10) === dateStr);
      result.push({ dia, ingresos: dayV.reduce((s, v) => s + (v.total || 0), 0) });
    }
    return result.length ? result : [{ dia: '01', ingresos: 0 }];
  }, [ventasActivas, desde, hasta]);


  const ventasPorDia = useMemo(() => {
    const dias = [];
    const ctxActivas = ventasCtx.filter(v => v.estado !== 'cancelada');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = toLocalDateStr(d);
      const dayV    = ctxActivas.filter(v => v.fecha?.slice(0, 10) === dateStr);
      const label   = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es-AR', { weekday: 'short' });
      dias.push({ dia: label.charAt(0).toUpperCase() + label.slice(1), ingresos: dayV.reduce((s, v) => s + (v.total || 0), 0) });
    }
    return dias;
  }, [ventasCtx]);

  const ventasPorHora = useMemo(() => {
    const counts = {};
    ventasActivas.forEach(v => {
      const h = v.hora ? parseInt(v.hora.slice(0, 2), 10) : null;
      if (h !== null && !isNaN(h)) counts[h] = (counts[h] || 0) + 1;
    });
    const horas = [];
    for (let h = 6; h <= 22; h++) {
      horas.push({ hora: `${String(h).padStart(2, '0')}`, ops: counts[h] || 0 });
    }
    return horas;
  }, [ventasActivas]);

  const { data: vencimientosProximos = [] } = useVencimientosProximos(7);

  if (loadingData) return (
    <Box sx={{ width: '100%', height: '100%', overflowX: 'hidden', bgcolor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <CircularProgress size={36} sx={{ color: P }} />
      <Typography sx={{ color: MUTED, fontSize: 14 }}>Cargando datos...</Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', bgcolor: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header — fijo arriba, no scrollea con el resto */}
      <Box sx={{ flexShrink: 0, position: 'relative', zIndex: 2, bgcolor: BG, borderBottom: `1px solid ${BORDER}`, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
        {/* Gradiente de acento */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${P}, ${MONEY}, ${ORANGE})` }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: '12px', bgcolor: `${P}16`, border: `1px solid ${P}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChartIcon sx={{ color: P, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Reportes</Typography>
              <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>
                {loadingDash
                  ? <CircularProgress size={12} sx={{ color: MUTED, mr: 1 }} />
                  : `${totalVentasN} venta${totalVentasN !== 1 ? 's' : ''} · ${fmtMoney(ingresos)} · ${stockBajoCount} alertas de stock`
                }
              </Typography>
            </Box>
          </Box>
          <Box data-tour="dash-filtros" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
            <Tooltip title="Exportar ventas a Excel">
              <Box onClick={() => exportarCSV(ventasFiltradas, desde, hasta)}
                sx={{ ...card, px: { xs: 1.25, sm: 2 }, py: { xs: 1, sm: 1.25 }, display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', '&:hover': { borderColor: P, bgcolor: HOVER }, transition: 'all 0.15s', flexShrink: 0 }}>
                <FileDownloadIcon sx={{ color: P, fontSize: 15 }} />
                <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>Excel</Typography>
              </Box>
            </Tooltip>
            {[{ label: 'DESDE', val: desde, set: setDesde }, { label: 'HASTA', val: hasta, set: setHasta }].map(({ label, val, set }) => (
              <Box key={label} sx={{
                ...card, px: { xs: 1.25, sm: 2 }, py: { xs: 1, sm: 1.25 },
                display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 },
                borderColor: BORDER, transition: 'all 0.15s',
                '&:hover': puedeFiltrarFechas ? { borderColor: 'var(--border-hover)' } : undefined,
                flexShrink: 0, opacity: puedeFiltrarFechas ? 1 : 0.6,
              }}>
                <Typography sx={{ color: MUTED, fontSize: { xs: 9, sm: 10.5 }, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1, display: { xs: 'none', sm: 'block' } }}>{label}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1, display: { xs: 'block', sm: 'none' } }}>{label}</Typography>
                <Typography sx={{ color: INK, fontSize: { xs: 11, sm: 13 }, fontWeight: 600, cursor: puedeFiltrarFechas ? 'pointer' : 'default', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (!puedeFiltrarFechas) return;
                    const inp = document.getElementById(`date-${label}`);
                    // showPicker() tira excepción en varios navegadores si el input
                    // mide 0x0 (por eso el tamaño de 1px de abajo, no 0) — con el
                    // try/catch igual queda un fallback si el browser no lo soporta.
                    try { inp?.showPicker?.(); } catch { inp?.focus(); }
                  }}>
                  {fmtDate(val)}
                </Typography>
                <input id={`date-${label}`} type="date" value={val} disabled={!puedeFiltrarFechas}
                  onChange={e => puedeFiltrarFechas && set(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
              </Box>
            ))}
            <AyudaButton />
          </Box>
        </Box>
      </Box>

      {/* Resto de la página — esto sí scrollea, el header de arriba queda fijo */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: { xs: 2, md: 3 }, pt: 2.5, pb: { xs: 2, md: 3 } }}>

      {/* KPI cards */}
      <Box data-tour="dash-kpis" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
        {statsData.map(stat => (
          <Box key={stat.label} sx={{
            ...card, p: { xs: 2, md: 2.5 },
            display: 'flex', flexDirection: 'column', gap: 1.5,
            position: 'relative', overflow: 'hidden',
            borderColor: `${stat.color}30`,
            '&:hover': { borderColor: `${stat.color}50`, transform: 'translateY(-1px)' },
            transition: 'all 0.2s',
          }}>
            <Box sx={{ position: 'absolute', top: -12, right: -12, width: 60, height: 60, borderRadius: '50%', bgcolor: `${stat.color}0c`, border: `1px solid ${stat.color}18` }} />
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${stat.color}18`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.Icon sx={{ color: stat.color, fontSize: 19 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 18, sm: 22, md: 26 }, letterSpacing: '-0.02em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stat.value}
              </Typography>
              <Typography sx={{ color: INK2, fontSize: { xs: 11, md: 12 }, fontWeight: 500, mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stat.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Vencimientos próximos */}
      {vencimientosProximos.length > 0 && (
        <Box sx={{ ...card, p: 2.5, mb: 2.5, borderColor: `${WARNING}30` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: vencimientosProximos.length > 0 ? 1.5 : 0 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: `${WARNING}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccessTimeIcon sx={{ color: WARNING, fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>Próximos a vencer</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12 }}>{vencimientosProximos.length} producto{vencimientosProximos.length !== 1 ? 's' : ''} en los próximos 7 días</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {vencimientosProximos.slice(0, 8).map(l => {
              const [label, color] = getVencimientoBadge(l.fecha_vencimiento);
              return (
                <Chip key={l.id} label={`${l.producto}${label ? ` — ${label}` : ''}`} size="small"
                  sx={{ bgcolor: `${color || WARNING}12`, color: color || WARNING, fontWeight: 600, fontSize: 11, borderRadius: '6px', border: `1px solid ${color || WARNING}30` }} />
              );
            })}
            {vencimientosProximos.length > 8 && (
              <Chip label={`+${vencimientosProximos.length - 8} mas`} size="small"
                sx={{ bgcolor: HOVER, color: MUTED, fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
            )}
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Box data-tour="dash-tabs" sx={{ ...card, p: 0.75, mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': { textTransform: 'none', color: MUTED, minHeight: 44, fontSize: 13.5, fontWeight: 500, borderRadius: '8px', transition: 'all 0.15s' },
            '& .Mui-selected': { color: INK, fontWeight: 600, bgcolor: HOVER },
          }}>
          {tabs.map(t => <Tab key={t} label={t} />)}
        </Tabs>
      </Box>

      {tab === 0 && (
        <TabResumen
          ventas={ventasActivas} dashStats={dashStats}
          lineData={lineData} totalVentasN={totalVentasN}
          ventasPorDia={ventasPorDia} ventasPorHora={ventasPorHora}
          chartBorder={chartBorder} chartMuted={chartMuted}
        />
      )}
      {tab === 1 && <TabVentas ventas={ventasFiltradas} onVentaActualizada={actualizarVentaLocal} />}
      {tab === 2 && <TabCompras compras={comprasFiltradas} onCompraActualizada={actualizarCompraLocal} />}
      {tab === 3 && <TabProductos ventas={ventasActivas} ranking={rankingProductos} />}
      {tab === 4 && <TabMetodosPago ventas={ventasActivas} />}
      {tab === 5 && <TabCaja desde={desde} hasta={hasta} />}
      {tab === tabAuditoriaIndex && puedeVerAuditoria && <TabAuditoria />}
      </Box>
    </Box>
  );
}
