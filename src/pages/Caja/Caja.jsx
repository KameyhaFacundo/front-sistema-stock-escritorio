import { useState, useEffect, useMemo, useRef, startTransition } from 'react';
import {
  Box, Typography, Tabs, Tab,
  TextField, Button, Chip, InputAdornment,
  Avatar, Skeleton, InputBase, Collapse,
  Dialog, DialogContent, IconButton, Tooltip,
} from '@mui/material';
import LockOpenIcon     from '@mui/icons-material/LockOpen';
import LockIcon         from '@mui/icons-material/Lock';
import AddIcon          from '@mui/icons-material/Add';
import SearchIcon       from '@mui/icons-material/Search';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PointOfSaleIcon  from '@mui/icons-material/PointOfSale';
import HistoryIcon      from '@mui/icons-material/History';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon   from '@mui/icons-material/AccessTime';
import SwapHorizIcon    from '@mui/icons-material/SwapHoriz';
import QrCode2Icon      from '@mui/icons-material/QrCode2';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import CloseIcon        from '@mui/icons-material/Close';
import ReceiptLongIcon  from '@mui/icons-material/ReceiptLong';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CreditCardIcon   from '@mui/icons-material/CreditCard';
import ExpandMoreIcon   from '@mui/icons-material/ExpandMore';
import ExpandLessIcon   from '@mui/icons-material/ExpandLess';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon  from '@mui/icons-material/NavigateNext';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, TABLE_HEADER,
         SUCCESS, SUCCESS_HOVER, SUCCESS_BG, SUCCESS_BORDER,
         ERROR, ERROR_BG, ERROR_BORDER, ORANGE, fieldSx, modalPaperSx } from '../../theme/tokens';
import { useAuth } from '../../auth/AuthContextBase';
import { useCaja } from '../../context/CajaContextBase';
import { useToast } from '../../context/ToastContext';
import { cajaService } from '../../services/cajaService';
import { ventasService } from '../../services/ventasService';
import { fmtDate, toLocalDateStr } from '../../utils/format';
import AyudaButton from '../../components/shared/AyudaButton';
import CampoPrecio from '../../components/shared/CampoPrecio';
import { registerTour } from '../../utils/tour';
import useHasPermiso from '../../hooks/useHasPermiso';

const METODO_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', fiado: 'Fiado' };

const card = { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' };

const fmt = v => `$${Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// Durante el arqueo, cualquier monto que ayude a reconstruir el "esperado" a
// mano (inicial + ventas efectivo + ingresos - egresos) se enmascara así.
const fmtOculto = (v, oculto) => (oculto ? '•••••' : fmt(v));

const iniciales = (nombre) => (nombre || '?')
  .split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase() || '?';

/* ─── Tarjeta KPI compacta (reusada en varias pestañas) ─── */
function StatCard({ label, value, Icon, color }) {
  return (
    <Box sx={{
      ...card, p: 2, display: 'flex', flexDirection: 'column', gap: 1.25,
      position: 'relative', overflow: 'hidden', borderColor: `${color}30`,
    }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 46, height: 46, borderRadius: '50%', bgcolor: `${color}0c`, border: `1px solid ${color}18` }} />
      <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ color, fontSize: 16 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color, fontWeight: 700, fontSize: { xs: 15, sm: 17 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', mt: 0.25 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

/* ─── TAB CAJA ─── */
function TabCaja({ caja, onAbrir, onCerrar, arqueoIniciado }) {
  const toast = useToast();
  const [montoInicial, setMontoInicial] = useState('');

  const handleAbrir = () => {
    const monto = Number(montoInicial);
    if (monto <= 0) { toast('Ingresa un monto inicial mayor a cero', 'warning'); return; }
    onAbrir(monto);
    setMontoInicial('');
  };

  if (!caja.abierta) {
    return (
      <Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 22, mb: 0.5 }}>Estado de caja</Typography>
        <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
          Abrí la caja para comenzar a registrar ventas y movimientos del turno.
        </Typography>
        <Box data-tour="caja-abrir-box" sx={{ ...card, p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: `${P}0c`, border: `1px solid ${P}18` }} />
          <Box sx={{ width: 60, height: 60, borderRadius: '16px', bgcolor: `${P}14`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ fontSize: 28, color: P }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17, mb: 0.5 }}>Caja cerrada</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13.5 }}>Ingresá el monto inicial para abrir el turno</Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 320 }}>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Monto inicial en efectivo</Typography>
            <CampoPrecio fullWidth placeholder="0" value={montoInicial} autoFocus
              onChange={e => setMontoInicial(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAbrir(); } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }}
              sx={fieldSx} />
          </Box>
          <Button variant="contained" startIcon={<LockOpenIcon />}
            onClick={handleAbrir}
            sx={{ bgcolor: SUCCESS, textTransform: 'none', fontWeight: 600, fontSize: 14, px: 4, py: 1.25, borderRadius: '10px', boxShadow: `0 4px 16px ${SUCCESS}35`, '&:hover': { bgcolor: SUCCESS_HOVER } }}>
            Abrir Caja
          </Button>
        </Box>
      </Box>
    );
  }

  const movCount = (caja.movimientosDetalle || []).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 22, mb: 0.5 }}>Estado de caja</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13.5 }}>Turno activo desde {caja.horaApertura}</Typography>
        </Box>
        <Chip icon={<LockOpenIcon sx={{ fontSize: 14, color: `${SUCCESS} !important` }} />} label="Abierta"
          sx={{ bgcolor: SUCCESS_BG, color: SUCCESS, fontWeight: 700, fontSize: 13, border: `1px solid ${SUCCESS_BORDER}` }} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 2.5 }}>
        <StatCard label="MONTO INICIAL" value={fmtOculto(caja.montoInicial, arqueoIniciado)} Icon={AccountBalanceWalletIcon} color={P} />
        <StatCard label="HORA APERTURA" value={caja.horaApertura} Icon={AccessTimeIcon} color={ORANGE} />
        <StatCard label="MOVIMIENTOS" value={movCount} Icon={SwapHorizIcon} color={SUCCESS} />
      </Box>

      {arqueoIniciado ? (
        <Box sx={{ ...card, px: 2.5, py: 2, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ fontSize: 22, color: MUTED }} />
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Arqueo en curso</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>El efectivo estimado se oculta hasta confirmar el conteo en &quot;Resumen&quot;.</Typography>
          </Box>
        </Box>
      ) : (
        <Box data-tour="caja-estado-box" sx={{
          ...card, px: 2.5, py: 2.5, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden', borderColor: `${SUCCESS}30`, bgcolor: `${SUCCESS}08`,
        }}>
          <Box sx={{ position: 'absolute', top: -16, right: -16, width: 90, height: 90, borderRadius: '50%', bgcolor: `${SUCCESS}0f`, border: `1px solid ${SUCCESS}20` }} />
          <Box sx={{ position: 'relative' }}>
            <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', mb: 0.5 }}>EFECTIVO ACTUAL ESTIMADO</Typography>
            <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 24, sm: 28 }, letterSpacing: '-0.02em' }}>{fmt(caja.efectivoActual)}</Typography>
          </Box>
          <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: `${SUCCESS}18`, border: `1px solid ${SUCCESS}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <PointOfSaleIcon sx={{ fontSize: 26, color: SUCCESS }} />
          </Box>
        </Box>
      )}

      {(caja.ventasEfectivo || 0) > 0 && (
        <Box sx={{ ...card, px: 2.5, py: 1.5, mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: MUTED, fontSize: 13 }}>Ventas en efectivo del turno:</Typography>
          <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 14 }}>{fmtOculto(caja.ventasEfectivo, arqueoIniciado)}</Typography>
        </Box>
      )}

      <Button data-tour="caja-cerrar-btn" variant="outlined" startIcon={<LockIcon />} onClick={onCerrar} fullWidth
        sx={{ color: ERROR, borderColor: ERROR_BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: ERROR_BG, borderColor: ERROR } }}>
        Cerrar Caja
      </Button>
    </Box>
  );
}

/* ─── TAB MOVIMIENTOS ─── */
function TabMovimientos({ movimientos, onAgregar, cajaAbierta, ocultarMontos }) {
  const [tipo,     setTipo]     = useState('ingreso');
  const [metodo,   setMetodo]   = useState('efectivo');
  const [monto,    setMonto]    = useState('');
  const [motivo,   setMotivo]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const montoRef = useRef(null);

  // El formulario queda abierto (no se cierra solo) y el foco vuelve a Monto
  // — cargar varios movimientos seguidos no debería obligar a reabrirlo cada
  // vez, mismo criterio que ya se usa en el carrito del POS.
  const handleAgregar = () => {
    if (!monto || Number(monto) <= 0) return;
    const now = new Date();
    onAgregar({
      id: Date.now(), tipo, metodo, monto: Number(monto),
      motivo: motivo.trim() || (tipo === 'ingreso' ? 'Ingreso manual' : 'Egreso manual'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
    setMonto(''); setMotivo('');
    montoRef.current?.focus();
  };

  const handleMontoEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleAgregar();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 22, mb: 0.5 }}>Movimientos</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13.5 }}>Ingresos y egresos manuales del turno.</Typography>
        </Box>
        {cajaAbierta && !showForm && (
          <Tooltip title="Agregar movimiento">
            <Button data-tour="caja-mov-agregar" variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Agregar</Box>
            </Button>
          </Tooltip>
        )}
      </Box>

      {ocultarMontos && (
        <Box sx={{ ...card, px: 2.5, py: 1.5, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ fontSize: 18, color: MUTED }} />
          <Typography sx={{ color: MUTED, fontSize: 12.5 }}>Los montos se ocultan mientras hay un arqueo en curso.</Typography>
        </Box>
      )}

      {showForm && (
        <Box sx={{ ...card, p: 2.5, mb: 2.5 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 2 }}>Nuevo movimiento</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            {[
              { key: 'ingreso', label: 'Ingreso', Icon: TrendingUpIcon,   color: SUCCESS, bg: SUCCESS_BG   },
              { key: 'egreso',  label: 'Egreso',  Icon: TrendingDownIcon, color: ERROR, bg: ERROR_BG },
            ].map(opt => (
              <Button key={opt.key} fullWidth startIcon={<opt.Icon />} onClick={() => setTipo(opt.key)}
                sx={{ py: 1.1, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px',
                  border: `1px solid ${tipo === opt.key ? opt.color : BORDER}`,
                  bgcolor: tipo === opt.key ? opt.bg : 'transparent',
                  color:   tipo === opt.key ? opt.color : INK2,
                  '&:hover': { bgcolor: opt.bg, borderColor: opt.color, color: opt.color } }}>
                {opt.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Método</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[
                { key: 'efectivo',     label: 'Efectivo' },
                { key: 'transferencia', label: 'Transferencia' },
              ].map(opt => (
                <Button key={opt.key} fullWidth onClick={() => setMetodo(opt.key)}
                  sx={{ py: 1, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px',
                    border: `1px solid ${metodo === opt.key ? P : BORDER}`,
                    bgcolor: metodo === opt.key ? `${P}18` : 'transparent',
                    color:   metodo === opt.key ? P : INK2,
                    '&:hover': { bgcolor: `${P}18`, borderColor: P, color: P } }}>
                  {opt.label}
                </Button>
              ))}
            </Box>
            {metodo === 'transferencia' && (
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.75 }}>
                No es plata física — no afecta el efectivo esperado ni el arqueo de cierre, solo queda registrado.
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Monto</Typography>
              <CampoPrecio fullWidth placeholder="0" value={monto} onChange={e => setMonto(e.target.value)}
                inputRef={el => { montoRef.current = el; }} autoFocus onKeyDown={handleMontoEnter}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }}
                sx={fieldSx} />
            </Box>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Motivo (opcional)</Typography>
              <TextField fullWidth placeholder="Ej: Retiro de caja" value={motivo} onChange={e => setMotivo(e.target.value)} onKeyDown={handleMontoEnter} sx={fieldSx} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setShowForm(false); setMonto(''); setMotivo(''); setMetodo('efectivo'); }}
              sx={{ color: INK2, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleAgregar} disabled={!monto || Number(monto) <= 0}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' } }}>
              Registrar
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ ...card, overflow: 'hidden' }}>
        {movimientos.length === 0 ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <PointOfSaleIcon sx={{ fontSize: 36, color: MUTED }} />
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 15 }}>Sin movimientos</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13 }}>No hay movimientos manuales en este turno.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '90px 1fr 1fr 110px' }, px: 2.5, py: 1.25, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
              {['Hora', 'Tipo', 'Motivo', 'Monto'].map((h, i) => (
                <Typography key={h} sx={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 3 ? 'right' : 'left', display: { xs: i < 2 ? 'block' : 'none', sm: 'block' } }}>{h}</Typography>
              ))}
            </Box>
            {movimientos.map(m => (
              <Box key={m.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '90px 1fr 1fr 110px' }, alignItems: 'center', px: 2.5, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: HOVER } }}>
                <Typography sx={{ color: MUTED, fontSize: 13 }}>{m.hora}</Typography>
                <Box>
                  <Chip label={m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} size="small"
                    sx={{ width: 'fit-content', bgcolor: m.tipo === 'ingreso' ? SUCCESS_BG : ERROR_BG, color: m.tipo === 'ingreso' ? SUCCESS : ERROR, fontWeight: 600, fontSize: 12, borderRadius: '6px' }} />
                  {m.metodo === 'transferencia' && (
                    <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>Transferencia</Typography>
                  )}
                </Box>
                <Typography sx={{ color: INK2, fontSize: 13, display: { xs: 'none', sm: 'block' } }}>{m.motivo}</Typography>
                <Typography sx={{ color: m.tipo === 'ingreso' ? SUCCESS : ERROR, fontSize: 14, fontWeight: 700, textAlign: { xs: 'left', sm: 'right' } }}>
                  {ocultarMontos ? '•••••' : `${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}`}
                </Typography>
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}

/* ─── TAB RESUMEN ─── */
function TabResumen({ caja, movimientos, onConfirmarCierre, cerrando, resultadoCierre, metodosVisibles = ['efectivo', 'tarjeta', 'transferencia', 'qr', 'fiado'], puedeVerMontos = true }) {
  const toast = useToast();
  const [contado, setContado] = useState('');

  // Solo los movimientos en efectivo entran acá — una transferencia no es
  // plata física, así que no puede formar parte del "esperado" que este
  // cálculo tiene que igualar (ver comentario más abajo).
  const totalIngresos   = movimientos.filter(m => m.tipo === 'ingreso' && (m.metodo ?? 'efectivo') === 'efectivo').reduce((s, m) => s + m.monto, 0);
  const totalEgresos    = movimientos.filter(m => m.tipo === 'egreso' && (m.metodo ?? 'efectivo') === 'efectivo').reduce((s, m) => s + m.monto, 0);
  // Mismo desglose que arriba, pero para transferencia — no entra al arqueo
  // ciego de efectivo (no es plata física), así que se muestra siempre, sin
  // ocultar. Sirve solo para ver de un vistazo cuánto se movió manual por
  // transferencia en el turno (retiros, pagos a proveedores a mano, etc.).
  const ingresosTransferencia = movimientos.filter(m => m.tipo === 'ingreso' && m.metodo === 'transferencia').reduce((s, m) => s + m.monto, 0);
  const egresosTransferencia  = movimientos.filter(m => m.tipo === 'egreso' && m.metodo === 'transferencia').reduce((s, m) => s + m.monto, 0);
  const ventasEfectivo  = caja.ventasEfectivo || 0;
  // Tarjeta/transferencia/QR/fiado no mueven plata física — no forman parte
  // del efectivo "esperado" que el arqueo ciego protege, así que se muestran
  // siempre (a diferencia de ventasEfectivo, que si se oculta hasta contar).
  const ventasTarjeta       = caja.ventasTarjeta || 0;
  const ventasTransferencia = caja.ventasTransferencia || 0;
  const ventasQr        = caja.ventasQr || 0;
  const ventasFiado     = caja.ventasFiado || 0;
  const verMetodo = (key) => metodosVisibles.includes(key);
  // Antes de confirmar el cierre, estos tres números suman exactamente el
  // "esperado" que el arqueo ciego tiene que esconder — una vez que el conteo
  // ya se mandó (resultadoCierre existe) no hay más nada que proteger. Quien
  // tiene el permiso ver-montos-caja se salta el arqueo ciego directamente
  // (ya veía estos mismos números en las otras pestañas de Caja, así que
  // tapárselos acá no suma nada); sin el permiso quedan ocultos siempre.
  const ocultarMontos = puedeVerMontos ? false : !resultadoCierre;

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 22, mb: 0.5 }}>Resumen del turno</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Revisá los totales del turno y realizá el arqueo de cierre.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        {verMetodo('efectivo') && (
          <StatCard label="VENTAS EFECTIVO" value={fmtOculto(ventasEfectivo, ocultarMontos)} Icon={PointOfSaleIcon} color={SUCCESS} />
        )}
        <StatCard label="INGRESOS MANUAL EFECTIVO" value={fmtOculto(totalIngresos, ocultarMontos)} Icon={TrendingUpIcon} color={SUCCESS} />
        <StatCard label="EGRESOS MANUAL EFECTIVO" value={fmtOculto(totalEgresos, ocultarMontos)} Icon={TrendingDownIcon} color={ERROR} />
        {/* Tarjeta/transferencia/QR/fiado no mueven efectivo físico — no hace
            falta ocultarlas durante el arqueo ciego, no hay que contarlas a mano.
            Cuáles se muestran se elige en Configuración → Negocio → Arqueo de caja. */}
        {verMetodo('transferencia') && (
          <StatCard label="VENTAS TRANSFERENCIA" value={fmt(ventasTransferencia)} Icon={SwapHorizIcon} color={P} />
        )}
        {verMetodo('transferencia') && (
          <StatCard label="INGRESOS MANUAL TRANSFERENCIA" value={fmt(ingresosTransferencia)} Icon={TrendingUpIcon} color={P} />
        )}
        {verMetodo('transferencia') && (
          <StatCard label="EGRESOS MANUAL TRANSFERENCIA" value={fmt(egresosTransferencia)} Icon={TrendingDownIcon} color={P} />
        )}
        {verMetodo('qr') && (
          <StatCard label="VENTAS QR" value={fmt(ventasQr)} Icon={QrCode2Icon} color={ORANGE} />
        )}
        {verMetodo('tarjeta') && (
          <StatCard label="VENTAS TARJETA" value={fmt(ventasTarjeta)} Icon={CreditCardIcon} color={P} />
        )}
        {verMetodo('fiado') && (
          <StatCard label="VENTAS FIADO" value={fmt(ventasFiado)} Icon={AccountBalanceWalletIcon} color={ORANGE} />
        )}
      </Box>

      {resultadoCierre ? (
        <Box sx={{ ...card, p: 2.5 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 1.5 }}>Resultado del arqueo</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography sx={{ color: INK2, fontSize: 14 }}>Efectivo esperado</Typography>
            <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{fmt(resultadoCierre.montoEsperado ?? 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography sx={{ color: INK2, fontSize: 14 }}>Efectivo contado</Typography>
            <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{fmt(resultadoCierre.montoFinal ?? 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.25, borderTop: `1px solid ${BORDER}` }}>
            <Typography sx={{ color: INK, fontSize: 15, fontWeight: 700 }}>Diferencia</Typography>
            <Chip
              label={`${(resultadoCierre.diferencia ?? 0) >= 0 ? '+' : ''}${fmt(resultadoCierre.diferencia ?? 0)}`}
              sx={{
                bgcolor: (resultadoCierre.diferencia ?? 0) === 0 ? SUCCESS_BG : (resultadoCierre.diferencia ?? 0) > 0 ? SUCCESS_BG : ERROR_BG,
                color: (resultadoCierre.diferencia ?? 0) >= 0 ? SUCCESS : ERROR,
                fontWeight: 700, fontSize: 14, borderRadius: '8px', height: 30, px: 1,
              }}
            />
          </Box>
        </Box>
      ) : caja.abierta ? (
        <Box data-tour="caja-arqueo-box" sx={{ ...card, p: 2.5 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Arqueo de cierre</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mb: 1.5 }}>
            Contá el efectivo físico de la caja antes de escribir el monto — el sistema recién te muestra si coincide después de confirmar.
          </Typography>
          <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Efectivo contado</Typography>
          <CampoPrecio fullWidth placeholder="0" value={contado} onChange={e => setContado(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key !== 'Enter' || contado === '' || cerrando) return;
              e.preventDefault();
              onConfirmarCierre(Number(contado));
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }}
            sx={fieldSx} />
        </Box>
      ) : (
        <Box sx={{ ...card, p: 3, textAlign: 'center' }}>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>No hay una caja abierta para arquear.</Typography>
        </Box>
      )}

      {/* Botón confirmar cierre */}
      {!resultadoCierre && caja.abierta && onConfirmarCierre && (
        <Button
          variant="outlined"
          startIcon={<LockIcon />}
          onClick={() => { if (contado === '') { toast('Ingresa el efectivo contado antes de cerrar', 'warning'); return; } onConfirmarCierre(Number(contado)); }}
          disabled={cerrando}
          fullWidth
          sx={{ mt: 2.5, color: ERROR, borderColor: ERROR_BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: ERROR_BG, borderColor: ERROR }, '&.Mui-disabled': { opacity: 0.6 } }}
        >
          {cerrando ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
        </Button>
      )}
    </Box>
  );
}

/* ─── Modal de detalle de una venta (productos, cliente, método de pago) ─── */
function VentaDetalleModal({ venta, onClose }) {
  return (
    <Dialog open={Boolean(venta)} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      {venta && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ReceiptLongIcon sx={{ color: P, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Detalle de venta</Typography>
                <Typography sx={{ color: MUTED, fontFamily: 'monospace', fontSize: 12 }}>#{venta.id}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, maxHeight: '72vh', overflowY: 'auto' }}>
            <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 2, mb: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[
                { label: 'Hora',   value: venta.hora || '—', Icon: AccessTimeIcon },
                { label: 'Método', value: (venta.pagos || []).map(p => METODO_LABELS[p.metodo] || p.metodo).join(' + ') || '—', Icon: CreditCardIcon },
                { label: 'Cliente', value: venta.cliente || 'Consumidor Final', Icon: PersonOutlineIcon },
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

            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5, mb: 1 }}>
              Productos {venta.items?.length > 0 && `(${venta.items.length})`}
            </Typography>
            <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', mb: 2.5 }}>
              {!venta.items || venta.items.length === 0 ? (
                <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Sin detalle de productos</Typography>
              ) : (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 30px 56px 64px', sm: '1fr 60px 90px 90px' }, px: 1.5, py: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
                    {['Producto', 'Cant.', 'Precio', 'Subtotal'].map((h, i) => (
                      <Typography key={h} sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</Typography>
                    ))}
                  </Box>
                  {venta.items.map((it, idx) => (
                    <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 30px 56px 64px', sm: '1fr 60px 90px 90px' }, alignItems: 'center', px: 1.5, py: 1, borderBottom: idx < venta.items.length - 1 ? `1px solid ${BORDER}` : 'none', '&:hover': { bgcolor: HOVER } }}>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }}>{it.nombre}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'right' }}>{it.cantidad}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'right' }}>{fmt(it.precio)}</Typography>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{fmt(it.precio * it.cantidad)}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.75, borderRadius: '10px', bgcolor: `${P}0c`, border: `1px solid ${P}18` }}>
              <Typography sx={{ color: INK, fontSize: 15, fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ color: P, fontSize: 20, fontWeight: 800 }}>{fmt(venta.total)}</Typography>
            </Box>
          </DialogContent>
        </Box>
      )}
    </Dialog>
  );
}

/* ─── VENTAS DE UN TURNO (drill-down) ─── */
const VENTAS_POR_PAGINA = 8;

function TurnoVentasDetalle({ idTurno }) {
  const [ventas,  setVentas]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [ventaVer, setVentaVer] = useState(null);
  const [pagina,   setPagina]   = useState(1);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    ventasService.getAll({ id_turno: idTurno, per_page: 100 })
      .then(data => { if (vivo) setVentas(Array.isArray(data) ? data : []); })
      .catch(() => { if (vivo) setVentas([]); })
      .finally(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [idTurno]);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={30} sx={{ borderRadius: '6px' }} />)}
    </Box>
  );

  if (!ventas || ventas.length === 0) return (
    <Box sx={{ py: 3, textAlign: 'center' }}>
      <Typography sx={{ color: MUTED, fontSize: 13 }}>No hay ventas registradas en este turno.</Typography>
    </Box>
  );

  const totalPages = Math.max(1, Math.ceil(ventas.length / VENTAS_POR_PAGINA));
  const paginadas  = ventas.slice((pagina - 1) * VENTAS_POR_PAGINA, pagina * VENTAS_POR_PAGINA);

  return (
    <>
      <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '48px 1fr 84px', sm: '80px 1fr 1fr 110px' }, gap: 1, px: 1.5, py: 0.85, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
          {['Hora', 'Ticket', 'Cliente', 'Total'].map((h, i) => (
            <Typography key={h} sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 3 ? 'right' : 'left', display: { xs: i === 2 ? 'none' : 'block', sm: 'block' } }}>{h}</Typography>
          ))}
        </Box>
        {paginadas.map((v, i) => (
          <Box key={v.id} onClick={() => setVentaVer(v)} sx={{
            display: 'grid', gridTemplateColumns: { xs: '48px 1fr 84px', sm: '80px 1fr 1fr 110px' }, gap: 1, alignItems: 'center',
            px: 1.5, py: 1, cursor: 'pointer',
            borderBottom: i < paginadas.length - 1 ? `1px solid ${BORDER}` : 'none', '&:hover': { bgcolor: HOVER },
          }}>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{v.hora}</Typography>
            <Typography sx={{ color: INK2, fontSize: 13, fontFamily: 'monospace', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{v.id}</Typography>
            <Typography sx={{ color: INK2, fontSize: 13, display: { xs: 'none', sm: 'block' } }}>{v.cliente}</Typography>
            <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
              {fmt(v.total)}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 1.25, borderTop: `1px solid ${BORDER}` }}>
          <IconButton size="small" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
            sx={{ width: 28, height: 28, borderRadius: '8px', border: `1px solid ${BORDER}`, color: pagina === 1 ? BORDER : INK2, '&:hover': { borderColor: P, color: P, bgcolor: `${P}18` } }}>
            <NavigateBeforeIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{pagina} / {totalPages}</Typography>
          <IconButton size="small" disabled={pagina === totalPages} onClick={() => setPagina(p => p + 1)}
            sx={{ width: 28, height: 28, borderRadius: '8px', border: `1px solid ${BORDER}`, color: pagina === totalPages ? BORDER : INK2, '&:hover': { borderColor: P, color: P, bgcolor: `${P}18` } }}>
            <NavigateNextIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
      <VentaDetalleModal venta={ventaVer} onClose={() => setVentaVer(null)} />
    </>
  );
}

/* ─── Fila de estadística inline (label + valor), usada en el detalle expandido ─── */
function MiniStat({ label, value, color = INK }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography sx={{ color, fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );
}

/* ─── Movimientos manuales, colapsados por defecto (no empujan el resto del modal) ─── */
function MovimientosCollapsable({ movimientos }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Button
        onClick={() => setAbierto(v => !v)}
        endIcon={abierto ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{ ml: -0.75, mb: abierto ? 1 : 0, color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 12.5, px: 0.75, py: 0.4, borderRadius: '6px', '&:hover': { color: P, bgcolor: `${P}0f` } }}>
        Movimientos manuales ({movimientos.length})
      </Button>
      <Collapse in={abierto}>
        <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
          {movimientos.map((m, i) => (
            <Box key={m.id} sx={{
              display: 'grid', gridTemplateColumns: { xs: '48px 66px 1fr auto', sm: '70px 90px 1fr auto' }, alignItems: 'center', gap: 1,
              px: 1.5, py: 0.85, borderBottom: i < movimientos.length - 1 ? `1px solid ${BORDER}` : 'none', '&:hover': { bgcolor: HOVER },
            }}>
              <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{m.hora}</Typography>
              <Chip label={m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} size="small"
                sx={{ width: 'fit-content', height: 20, fontSize: 11, bgcolor: m.tipo === 'ingreso' ? SUCCESS_BG : ERROR_BG, color: m.tipo === 'ingreso' ? SUCCESS : ERROR, fontWeight: 600, borderRadius: '6px' }} />
              <Typography sx={{ color: INK2, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.motivo}{m.metodo === 'transferencia' && <Box component="span" sx={{ color: MUTED }}> · Transferencia</Box>}
              </Typography>
              <Typography sx={{ color: m.tipo === 'ingreso' ? SUCCESS : ERROR, fontSize: 13, fontWeight: 700, textAlign: 'right' }}>
                {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

/* ─── Modal de detalle de un turno (desglose + ventas) ─── */
function TurnoDetalleModal({ turno: t, onClose, puedeVerMontos = true }) {
  const tieneDiferencia = t && !t.abierta && t.diferencia != null && t.diferencia !== 0;
  const accent = !t || t.abierta ? P : tieneDiferencia ? (t.diferencia > 0 ? SUCCESS : ERROR) : SUCCESS;
  const movimientos = t?.movimientosDetalle || [];

  return (
    <Dialog open={Boolean(t)} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      {t && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: `${accent}22`, color: accent, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {iniciales(t.usuario)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.usuario || 'Usuario desconocido'}
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>
                  {fmtDate(t.fecha)} · {t.horaApertura}–{t.horaCierre || '—'}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: INK } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Efectivo final + resultado — una sola fila, sin card pesada */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', pb: 1.5, mb: 1.5, borderBottom: `1px solid ${BORDER}` }}>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em' }}>EFECTIVO FINAL</Typography>
                <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>{fmt(t.efectivoActual)}</Typography>
              </Box>
              {t.abierta ? (
                <Chip icon={<LockOpenIcon sx={{ fontSize: 13, color: `${P} !important` }} />} label="Turno en curso" size="small"
                  sx={{ height: 24, fontSize: 11.5, fontWeight: 700, bgcolor: `${P}18`, color: P, border: `1px solid ${P}40` }} />
              ) : tieneDiferencia ? (
                <Chip label={`Diferencia: ${t.diferencia > 0 ? '+' : ''}${fmt(t.diferencia)}`} size="small"
                  sx={{ height: 24, fontSize: 11.5, fontWeight: 700, bgcolor: t.diferencia > 0 ? SUCCESS_BG : ERROR_BG, color: t.diferencia > 0 ? SUCCESS : ERROR, border: `1px solid ${t.diferencia > 0 ? SUCCESS_BORDER : ERROR_BORDER}` }} />
              ) : (
                <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: 13, color: `${SUCCESS} !important` }} />} label="Cuadró" size="small"
                  sx={{ height: 24, fontSize: 11.5, fontWeight: 700, bgcolor: SUCCESS_BG, color: SUCCESS, border: `1px solid ${SUCCESS_BORDER}` }} />
              )}
            </Box>

            {/* Datos del turno — grilla compacta, un solo box */}
            <Box sx={{
              ...card, p: 1.5, mb: 1.5, display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
              rowGap: 1.25,
            }}>
              <MiniStat label="MONTO INICIAL" value={fmtOculto(t.montoInicial, !puedeVerMontos)} />
              <MiniStat label="VENTAS EFECTIVO" value={fmtOculto(t.ventasEfectivo, !puedeVerMontos)} />
              <MiniStat label="MOVIMIENTOS" value={movimientos.length} />
              {!t.abierta && t.montoEsperado != null && <MiniStat label="ESPERADO" value={fmt(t.montoEsperado)} />}
              {!t.abierta && t.montoFinal != null && <MiniStat label="CONTADO" value={fmt(t.montoFinal)} />}
            </Box>

            {/* Movimientos manuales — colapsado por defecto para no empujar las ventas */}
            {movimientos.length > 0 && <MovimientosCollapsable movimientos={movimientos} />}

            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5, mb: 1 }}>
              Ventas del turno {t.ventasCount > 0 && `(${t.ventasCount})`}
            </Typography>
            <TurnoVentasDetalle idTurno={t.id} />
          </DialogContent>
        </Box>
      )}
    </Dialog>
  );
}

/* ─── Tarjeta de un turno en el historial ─── */
function TurnoCard({ t, puedeVerMontos = true }) {
  const [verDetalle, setVerDetalle] = useState(false);
  const tieneDiferencia = !t.abierta && t.diferencia != null && t.diferencia !== 0;
  const accent = t.abierta ? P : tieneDiferencia ? (t.diferencia > 0 ? SUCCESS : ERROR) : SUCCESS;

  return (
    <Box sx={{
      bgcolor: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${accent}`, borderRadius: '10px',
      overflow: 'hidden', mb: 1.5, transition: 'box-shadow 0.15s, border-color 0.15s',
      '&:hover': { borderColor: 'var(--border-hover)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
    }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: `${accent}22`, color: accent, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
              {iniciales(t.usuario)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fmtDate(t.fecha)} · {t.horaApertura}–{t.horaCierre || '—'}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.15 }}>
                {t.usuario || 'Usuario desconocido'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {t.abierta ? (
              <Chip icon={<LockOpenIcon sx={{ fontSize: 13, color: `${P} !important` }} />} label="Abierta" size="small"
                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${P}18`, color: P, border: `1px solid ${P}40` }} />
            ) : tieneDiferencia ? (
              <Chip label={`${t.diferencia > 0 ? '+' : ''}${fmt(t.diferencia)}`} size="small"
                sx={{ height: 22, fontSize: 11.5, fontWeight: 700, bgcolor: t.diferencia > 0 ? SUCCESS_BG : ERROR_BG, color: t.diferencia > 0 ? SUCCESS : ERROR, border: `1px solid ${t.diferencia > 0 ? SUCCESS_BORDER : ERROR_BORDER}` }} />
            ) : (
              <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: 13, color: `${SUCCESS} !important` }} />} label="Cuadró" size="small"
                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: SUCCESS_BG, color: SUCCESS, border: `1px solid ${SUCCESS_BORDER}` }} />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
          <Typography sx={{ color: MUTED, fontSize: 11.5, minWidth: 0 }}>
            {t.ventasCount || 0} venta{t.ventasCount === 1 ? '' : 's'} · {fmt(t.ventasMonto)}
          </Typography>
          <Typography sx={{ color: INK, fontWeight: 800, fontSize: 19, flexShrink: 0 }}>{fmt(t.efectivoActual)}</Typography>
        </Box>

        <Button
          onClick={() => setVerDetalle(true)}
          startIcon={<VisibilityIcon sx={{ fontSize: 15 }} />}
          sx={{ mt: 1, ml: -0.75, color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 12, px: 0.75, py: 0.5, borderRadius: '6px', '&:hover': { color: P, bgcolor: `${P}0f` } }}>
          Ver detalle
        </Button>
      </Box>

      {verDetalle && <TurnoDetalleModal turno={t} onClose={() => setVerDetalle(false)} puedeVerMontos={puedeVerMontos} />}
    </Box>
  );
}

/* ─── TAB HISTORIAL ─── */
function TabHistorial({ visible, puedeVerMontos = true, puedeFiltrarFechas = true }) {
  const hoy = useMemo(() => toLocalDateStr(), []);
  const [turnos,  setTurnos]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [soloDiferencias, setSoloDiferencias] = useState(false);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  // Sin el permiso ver-filtros-fechas, el historial queda forzado al día de hoy.
  const effDesde = puedeFiltrarFechas ? desde : hoy;
  const effHasta = puedeFiltrarFechas ? hasta : hoy;

  useEffect(() => {
    if (!visible) return;
    startTransition(() => setLoading(true));
    cajaService.historial({ per_page: 50 })
      .then(data => startTransition(() => setTurnos(Array.isArray(data) ? data : [])))
      .catch(() => startTransition(() => setTurnos([])))
      .finally(() => startTransition(() => setLoading(false)));
  }, [visible]);

  const enRango = useMemo(() => turnos.filter(t => t.fecha >= effDesde && t.fecha <= effHasta), [turnos, effDesde, effHasta]);
  const cerrados = useMemo(() => enRango.filter(t => !t.abierta), [enRango]);
  const conDiferencia = useMemo(() => cerrados.filter(t => t.diferencia != null && t.diferencia !== 0), [cerrados]);
  const diferenciaAcumulada = useMemo(() => cerrados.reduce((s, t) => s + (t.diferencia ?? 0), 0), [cerrados]);

  const filtrados = useMemo(() => {
    let list = enRango;
    if (soloDiferencias) list = list.filter(t => t.diferencia != null && t.diferencia !== 0);
    const q = busqueda.trim().toLowerCase();
    if (q) list = list.filter(t => (t.usuario || '').toLowerCase().includes(q) || fmtDate(t.fecha).includes(q));
    return list;
  }, [enRango, busqueda, soloDiferencias]);

  if (loading) return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={84} sx={{ borderRadius: '12px' }} />)}
      </Box>
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: '10px', mb: 1.5 }} />)}
    </Box>
  );

  if (turnos.length === 0) return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <HistoryIcon sx={{ fontSize: 40, color: MUTED, mb: 1 }} />
      <Typography sx={{ color: INK, fontWeight: 600, fontSize: 15 }}>Sin historial</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13 }}>Aún no hay turnos cerrados.</Typography>
    </Box>
  );

  return (
    <Box>
      <Box data-tour="caja-historial-stats" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        <StatCard label="TURNOS REGISTRADOS" value={enRango.length} Icon={HistoryIcon} color={P} />
        <StatCard label="CON DIFERENCIA" value={`${conDiferencia.length} de ${cerrados.length}`} Icon={WarningAmberIcon} color={conDiferencia.length > 0 ? ORANGE : SUCCESS} />
        <StatCard label="DIFERENCIA ACUMULADA" value={`${diferenciaAcumulada >= 0 ? '+' : ''}${fmt(diferenciaAcumulada)}`} Icon={AccountBalanceIcon} color={diferenciaAcumulada === 0 ? SUCCESS : diferenciaAcumulada > 0 ? SUCCESS : ERROR} />
      </Box>

      <Box data-tour="caja-historial-buscar" sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', px: 1.5, py: 0.9, flex: 1, minWidth: 200 }}>
          <SearchIcon sx={{ color: MUTED, fontSize: 17 }} />
          <InputBase value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por usuario o fecha..."
            sx={{ fontSize: 13.5, color: INK, width: '100%', '& input::placeholder': { color: MUTED, opacity: 1 } }} />
        </Box>
        <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }}
          value={effDesde} inputProps={{ max: hasta }} onChange={e => setDesde(e.target.value)}
          disabled={!puedeFiltrarFechas}
          sx={{ ...fieldSx, width: 152, '& .MuiInputBase-input': { py: '9px', px: '12px' } }} />
        <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }}
          value={effHasta} inputProps={{ min: desde }} onChange={e => setHasta(e.target.value)}
          disabled={!puedeFiltrarFechas}
          sx={{ ...fieldSx, width: 152, '& .MuiInputBase-input': { py: '9px', px: '12px' } }} />
        <Button onClick={() => setSoloDiferencias(v => !v)} startIcon={<WarningAmberIcon sx={{ fontSize: 15 }} />}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderRadius: '10px', px: 1.75, py: 0.9, whiteSpace: 'nowrap',
            border: `1px solid ${soloDiferencias ? ORANGE : BORDER}`,
            bgcolor: soloDiferencias ? `${ORANGE}18` : 'transparent',
            color: soloDiferencias ? ORANGE : INK2,
            '&:hover': { bgcolor: `${ORANGE}18`, borderColor: ORANGE, color: ORANGE },
          }}>
          Solo con diferencia
        </Button>
      </Box>

      {filtrados.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography sx={{ color: MUTED, fontSize: 13.5 }}>Ningún turno coincide con la búsqueda.</Typography>
        </Box>
      ) : (
        filtrados.map(t => <TurnoCard key={t.id} t={t} puedeVerMontos={puedeVerMontos} />)
      )}
    </Box>
  );
}

/* ─── PÁGINA PRINCIPAL ─── */
export default function Caja() {
  const toast = useToast();
  const [tab,      setTab]      = useState(0);
  const [cerrando, setCerrando] = useState(false);
  const [resultadoCierre, setResultadoCierre] = useState(null);
  // "arqueo en curso": una vez que se entra a Resumen (por el botón o tocando la
  // pestaña) hay que dejar de mostrar el efectivo esperado en CUALQUIER pestaña
  // (no solo en Resumen) hasta que termine el cierre — si no, alcanza con volver
  // a la pestaña "Caja" para ver el mismo número y listo, arqueo ciego roto.
  const [arqueoIniciado, setArqueoIniciado] = useState(false);
  const { caja, abrirCaja, cerrarCaja, agregarMovimientoCaja, recargarCaja } = useCaja();

  // registrarVenta (VentasContext) marca la caja como desactualizada pero
  // A PROPÓSITO no la vuelve a pedir en el momento del cobro (para no hacer
  // competir esa consulta con la del propio ticket en el servidor PHP de un
  // solo hilo, ver el comentario ahí) — la idea era que se actualizara sola
  // "apenas se vuelva a mirar", pero CajaProvider vive en toda la app y
  // nunca se desmonta al navegar a esta página, así que ese momento nunca
  // llegaba solo: los números quedaban viejos hasta recargar toda la app.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { recargarCaja(); }, []);
  const { user } = useAuth();
  // null/nunca configurado = las 5 (mismo default que ya usa ConfigModal).
  const arqueoMetodosVisibles = user?.empresa?.arqueo_metodos_visibles ?? ['efectivo', 'tarjeta', 'transferencia', 'qr', 'fiado'];
  const { checkPermisos } = useHasPermiso();
  const puedeVerHistorial = checkPermisos('verHistorialCaja');
  const puedeVerMontos = checkPermisos('verMontosCaja');
  const puedeFiltrarFechas = checkPermisos('verFiltrosFechas');
  const movimientos = caja.movimientosDetalle || [];

  useEffect(() => {
    registerTour('/caja', [
      { element: '[data-tour="caja-tabs"]', title: 'Secciones de Caja', description: 'Caja (estado del turno), Movimientos (ingresos/egresos manuales), Resumen (arqueo de cierre) e Historial (turnos anteriores).' },
      { element: '[data-tour="caja-abrir-box"]', optional: true, title: 'Abrir caja', description: 'Contá el efectivo físico que tenés antes de empezar a vender y cargalo acá. Ese es el punto de partida del turno.' },
      { element: '[data-tour="caja-estado-box"]', optional: true, title: 'Efectivo estimado', description: 'Monto inicial + ventas en efectivo del turno + ingresos manuales - egresos manuales. Esto se oculta automáticamente apenas empezás a cerrar la caja, para que el arqueo sea a ciegas.' },
      { element: '[data-tour="caja-cerrar-btn"]', optional: true, title: 'Cerrar caja', description: 'Te lleva a "Resumen" para hacer el arqueo antes de cerrar el turno.' },
      { element: '[data-tour="caja-tab-movimientos"]', title: 'Ver Movimientos', description: 'Vamos a la pestaña de movimientos manuales. Hacé clic en "Siguiente".', click: true, clickDelay: 250 },
      { element: '[data-tour="caja-mov-agregar"]', optional: true, title: 'Ingreso o egreso manual', description: 'Registrá un retiro, un pago o cualquier movimiento de efectivo que no sea una venta (por ejemplo, sacar plata para comprar algo). Queda anotado con hora y motivo.' },
      { element: '[data-tour="caja-tab-resumen"]', title: 'Ver Resumen', description: 'Ahora la pestaña de resumen y arqueo. Hacé clic en "Siguiente".', click: true, clickDelay: 250 },
      { element: '[data-tour="caja-arqueo-box"]', optional: true, title: 'Arqueo de cierre', description: 'Contá el efectivo físico ANTES de escribir el número acá — el sistema recién te muestra si coincide con lo esperado después de confirmar. Así el conteo sirve para detectar errores o faltantes reales.' },
      { element: '[data-tour="caja-tab-historial"]', optional: true, title: 'Ver Historial', description: 'Por último, el historial de turnos. Hacé clic en "Siguiente".', click: true, clickDelay: 250 },
      { element: '[data-tour="caja-historial-stats"]', optional: true, title: 'Resumen del historial', description: 'De un vistazo: cuántos turnos hay registrados, cuántos cerraron con diferencia, y la diferencia acumulada de todo el historial cargado.' },
      { element: '[data-tour="caja-historial-buscar"]', optional: true, title: 'Buscar y filtrar', description: 'Buscá por usuario o fecha, elegí el rango Desde/Hasta (por defecto muestra el día de hoy), o activá "Solo con diferencia" para ver rápido qué turnos no cuadraron.' },
      { element: '[data-tour="caja-historial-box"]', optional: true, title: 'Turnos anteriores', description: 'Cada tarjeta muestra el resultado del arqueo de un vistazo (color verde si cuadró, o la diferencia si no). Hacé clic en "Ver detalle" para ver el desglose completo y las ventas de ese turno.' },
    ]);
  }, []);

  const handleChangeTab = (_, v) => {
    setTab(v);
    if (v === 2) setArqueoIniciado(true);
  };

  // "Cerrar Caja" desde TabCaja → ir al Resumen para revisar antes de confirmar
  const handleIrAResumen = () => { setResultadoCierre(null); setArqueoIniciado(true); setTab(2); };

  // Abrir una caja nueva reinicia el estado de arqueo del turno anterior
  const handleAbrir = (montoInicial) => {
    setResultadoCierre(null);
    setArqueoIniciado(false);
    abrirCaja(montoInicial);
  };

  // Confirmar cierre desde TabResumen — se queda en Resumen mostrando el resultado
  // del arqueo (la caja activa ya se resetea a "cerrada" apenas resuelve el cierre,
  // así que hay que guardar la respuesta acá para poder mostrarla).
  const handleConfirmarCierre = async (montoContado = null) => {
    setCerrando(true);
    try {
      const cerrado = await cerrarCaja(montoContado);
      setResultadoCierre(cerrado);
    } catch (e) {
      toast(e.response?.data?.message || 'Error al cerrar la caja', 'error');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG }}>

      {/* Header + tabs: se mantienen visibles al scrollear */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: BG, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2.5 }}>
        <Box sx={{ mb: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: -12, left: -12, right: -12, height: 3, background: `linear-gradient(90deg, ${P} 0%, ${P}80 65%, transparent 100%)`, borderRadius: '0 0 2px 2px' }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: '12px', bgcolor: `${SUCCESS}16`, border: `1px solid ${SUCCESS}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PointOfSaleIcon sx={{ color: SUCCESS, fontSize: 21 }} />
              </Box>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Caja</Typography>
                <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>
                  {caja.abierta ? `Turno activo desde ${caja.horaApertura}` : 'No hay un turno abierto'}
                </Typography>
              </Box>
            </Box>
            <AyudaButton />
          </Box>
        </Box>

        <Box data-tour="caja-tabs" sx={{ ...card, p: 0.75 }}>
          <Tabs value={tab} onChange={handleChangeTab} variant="scrollable" scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': { textTransform: 'none', color: MUTED, minHeight: 44, fontSize: 13.5, fontWeight: 700, borderRadius: '8px', transition: 'all 0.15s' },
              '& .Mui-selected': { color: INK, fontWeight: 800, bgcolor: HOVER },
            }}>
            <Tab label="Caja" />
            <Tab data-tour="caja-tab-movimientos" label="Movimientos" />
            <Tab data-tour="caja-tab-resumen" label="Resumen" />
            {puedeVerHistorial && <Tab data-tour="caja-tab-historial" label="Historial" />}
          </Tabs>
        </Box>
      </Box>

      {/* Contenido scrolleable */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        {tab === 0 && <TabCaja caja={caja} onAbrir={handleAbrir} onCerrar={handleIrAResumen} arqueoIniciado={puedeVerMontos ? false : (arqueoIniciado && !resultadoCierre)} />}
        {tab === 1 && <TabMovimientos movimientos={movimientos} onAgregar={agregarMovimientoCaja} cajaAbierta={caja.abierta} ocultarMontos={puedeVerMontos ? false : (arqueoIniciado && !resultadoCierre)} />}
        {tab === 2 && <TabResumen caja={caja} movimientos={movimientos} onConfirmarCierre={handleConfirmarCierre} cerrando={cerrando} resultadoCierre={resultadoCierre} metodosVisibles={arqueoMetodosVisibles} puedeVerMontos={puedeVerMontos} />}
        {tab === 3 && puedeVerHistorial && <Box data-tour="caja-historial-box"><TabHistorial visible={tab === 3} puedeVerMontos={puedeVerMontos} puedeFiltrarFechas={puedeFiltrarFechas} /></Box>}
      </Box>
    </Box>
  );
}
