import { useContext, useState, useMemo, useEffect, Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Badge, Popover,
  Button,
} from '@mui/material';
import CloseIcon                 from '@mui/icons-material/Close';
import NotificationsIcon         from '@mui/icons-material/Notifications';
import WarningAmberIcon          from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon    from '@mui/icons-material/CheckCircleOutline';
import HandshakeIcon             from '@mui/icons-material/Handshake';
import BusinessIcon              from '@mui/icons-material/Business';
import LockIcon                  from '@mui/icons-material/Lock';
import MenuIcon                  from '@mui/icons-material/Menu';
import { AuthContext } from '../auth/AuthContextBase';
import { ConfigModal } from './ConfigModal';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../theme/useAppTheme';
import { useApp } from '../context/AppContextBase';
import CommandPalette  from '../components/shared/CommandPalette';
import ConfirmDialog   from '../components/shared/ConfirmDialog';
import AsistenteIA     from '../components/shared/AsistenteIA';
import useNotificaciones from '../hooks/useNotificaciones';
import usePlan from '../hooks/usePlan';
import {
  BG, CARD, BORDER, INK, MUTED, P, HOVER, DROPDOWN,
  SUCCESS, ERROR, WARNING, ERROR_BG,
} from '../theme/tokens';
import { fmtMoney } from '../utils/format';
import { APP_NAME } from '../config/brand';
import useLogo from '../hooks/useLogo';
import Sidebar from './Sidebar';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_COLLAPSED_STORAGE_KEY } from './sidebarConstants';

const W = SIDEBAR_WIDTH;
const W_COLLAPSED = SIDEBAR_WIDTH_COLLAPSED;

export default function DefaultLayout() {
  const { user, logout, recargarPermisos } = useContext(AuthContext);
  const toast = useToast();
  const logoSrc = useLogo();
  const { alertas } = useApp();
  const stockBajoCount = alertas?.stockBajo?.length || 0;
  const location = useLocation();
  const navigate = useNavigate();
  const [openConfig,      setOpenConfig]      = useState(false);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true');
  const [openPalette,     setOpenPalette]     = useState(false);
  const [alertasAnchor,   setAlertasAnchor]   = useState(null);
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const { tieneFacturacion, tieneEtiquetas } = usePlan();

  useEffect(() => {
    recargarPermisos();
  }, [recargarPermisos]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const mp = new URLSearchParams(location.search).get('mp');
    if (!mp) return;
    toast(
      mp === 'conectado' ? 'Cuenta de Mercado Pago conectada correctamente' : 'No se pudo conectar la cuenta de Mercado Pago',
      mp === 'conectado' ? 'success' : 'error'
    );
    navigate(location.pathname, { replace: true });
  }, [location.search]);

  useNotificaciones(alertas, user);

  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'k') { e.preventDefault(); setOpenPalette(v => !v); }
      if (ctrl && e.key === 'n') { e.preventDefault(); navigate('/productos'); }
      if (ctrl && e.key === 'p') { e.preventDefault(); navigate('/pos'); }
      if (ctrl && e.key === 'd') { e.preventDefault(); navigate('/dashboard'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const trialDaysLeft = useMemo(() => {
    const ends = user?.empresa?.trial_ends_at;
    if (!ends || user?.empresa?.plan !== 'free') return null;
    return Math.ceil((new Date(ends) - new Date()) / (1000 * 60 * 60 * 24));
  }, [user?.empresa?.trial_ends_at, user?.empresa?.plan]);

  const saldoFacturas = tieneFacturacion ? (user?.empresa?.facturas_disponibles ?? null) : null;
  const facturasBajo = saldoFacturas !== null && saldoFacturas <= 20;

  const hayAlertasNuevas = (alertas?.total || 0) > (parseInt(localStorage.getItem('alertas_vistas') || '0', 10));

  const handleOpenAlertas = (e) => setAlertasAnchor(e.currentTarget);
  const handleCloseAlertas = () => setAlertasAnchor(null);

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', display: 'flex', overflow: 'hidden', bgcolor: BG }}>

      {/* ── OVERLAY MOBILE ── */}
      {sidebarOpen && (
        <Box
          onClick={() => setSidebarOpen(false)}
          sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 99, display: { md: 'none' } }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={setSidebarCollapsed}
        onOpenConfig={() => setOpenConfig(true)}
        onOpenAlertas={handleOpenAlertas}
        onConfirmLogout={() => setConfirmarLogout(true)}
        stockBajoCount={stockBajoCount}
        trialDaysLeft={trialDaysLeft}
        facturasBajo={facturasBajo}
        saldoFacturas={saldoFacturas}
      />

      {/* ── CONTENIDO ── */}
      <Box sx={{
        ml: { xs: 0, md: `${sidebarCollapsed ? W_COLLAPSED : W}px` },
        width: { xs: '100%', md: `calc(100% - ${sidebarCollapsed ? W_COLLAPSED : W}px)` },
        height: '100%', overflow: 'hidden', bgcolor: BG, display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.2s ease, width 0.2s ease',
      }}>
        {/* Top bar mobile */}
        <Box sx={{ height: 52, minHeight: 52, px: 2, display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'space-between', bgcolor: CARD, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <Box component="img" src={logoSrc} alt={APP_NAME}
            sx={{ height: 30, width: 'auto', display: 'block' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={handleOpenAlertas}
              sx={{ color: hayAlertasNuevas ? WARNING : MUTED, '&:hover': { color: INK, bgcolor: HOVER } }}>
              <Badge badgeContent={hayAlertasNuevas ? alertas.total : null} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 14, height: 14, p: '0 3px' } }}>
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
            <IconButton size="small" onClick={() => setSidebarOpen(o => !o)} sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER } }}>
              {sidebarOpen ? <CloseIcon sx={{ fontSize: 20 }} /> : <MenuIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {trialDaysLeft !== null && trialDaysLeft <= 0 ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: `${ERROR}15`, border: `2px solid ${ERROR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <LockIcon sx={{ color: ERROR, fontSize: 34 }} />
              </Box>
              <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', mb: 1 }}>
                Tu prueba gratuita venció
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: 15, maxWidth: 380, lineHeight: 1.7, mb: 3 }}>
                Elegí un plan para seguir usando el sistema. Todos tus datos siguen guardados.
              </Typography>
              <Button component={Link} to="/planes" variant="contained"
                sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 15, px: 4, py: 1.5, borderRadius: '12px', boxShadow: `0 2px 14px ${P}35`, '&:hover': { bgcolor: '#0891b2' } }}>
                Ver planes →
              </Button>
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 2 }}>
                ¿Ya pagaste?{' '}
                <Box component="span" onClick={() => window.location.reload()} sx={{ color: P, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  Actualizá la página
                </Box>
              </Typography>
            </Box>
          ) : (
            <Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><CircularProgress size={24} sx={{ color: MUTED }} /></Box>}>
              <Outlet />
            </Suspense>
          )}
        </Box>
      </Box>

      {/* ── MODAL CONFIGURACIÓN ── */}
      <ConfigModal open={openConfig} onClose={() => setOpenConfig(false)} />

      {/* ── COMMAND PALETTE ── */}
      <CommandPalette open={openPalette} onClose={() => setOpenPalette(false)} />

      {/* ── PANEL ALERTAS ── */}
      <Popover
        open={Boolean(alertasAnchor)}
        anchorEl={alertasAnchor}
        onClose={handleCloseAlertas}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '12px',
            width: { xs: 'calc(100vw - 32px)', sm: 340 },
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 340 },
            maxHeight: { xs: '70vh', sm: 440 },
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon sx={{ color: alertas?.total > 0 ? WARNING : MUTED, fontSize: 16 }} />
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>Alertas</Typography>
            {alertas?.total > 0 && (
              <Chip label={alertas.total} size="small"
                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${ERROR}20`, color: ERROR, border: `1px solid ${ERROR}40`, '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>
          <IconButton size="small" onClick={handleCloseAlertas}
            sx={{ color: MUTED, p: '2px', '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '4px' }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ overflowY: 'auto', maxHeight: 370 }}>
          {!alertas || alertas.total === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', px: 2 }}>
              <CheckCircleOutlineIcon sx={{ color: SUCCESS, fontSize: 36, mb: 1 }} />
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>Todo en orden</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>No hay alertas activas</Typography>
            </Box>
          ) : (
            <>
              {/* Stock bajo */}
              {alertas.stockBajo?.length > 0 && (
                <Box sx={{ p: 1.5, borderBottom: `1px solid ${BORDER}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, px: 0.5 }}>
                    <WarningAmberIcon sx={{ color: WARNING, fontSize: 14 }} />
                    <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Stock bajo ({alertas.stockBajo.length})
                    </Typography>
                  </Box>
                  {alertas.stockBajo.slice(0, 5).map(p => (
                    <Box key={p.id} component={Link} to="/productos" onClick={handleCloseAlertas}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, px: 1, borderRadius: '6px', textDecoration: 'none', '&:hover': { bgcolor: HOVER } }}>
                      <Box sx={{ minWidth: 0, mr: 1 }}>
                        <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nombre}
                        </Typography>
                        <Typography sx={{ color: MUTED, fontSize: 11 }}>{p.codigo}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography sx={{ color: p.stock === 0 ? ERROR : WARNING, fontWeight: 700, fontSize: 13 }}>{p.stock} u</Typography>
                        <Typography sx={{ color: MUTED, fontSize: 11 }}>mín: {p.alerta}</Typography>
                      </Box>
                    </Box>
                  ))}
                  {alertas.stockBajo.length > 5 && (
                    <Box component={Link} to="/productos" onClick={handleCloseAlertas}
                      sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 1, borderRadius: '6px', textDecoration: 'none', '&:hover': { bgcolor: HOVER } }}>
                      <Typography sx={{ color: P, fontSize: 12, fontWeight: 600 }}>
                        +{alertas.stockBajo.length - 5} más — Ver productos
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Deudas a proveedores */}
              {alertas.deudasProveedores?.length > 0 && (
                <Box component={Link} to="/proveedores" onClick={handleCloseAlertas}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${BORDER}`, textDecoration: 'none', '&:hover': { bgcolor: HOVER }, cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: `${ERROR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BusinessIcon sx={{ color: ERROR, fontSize: 15 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>Deudas a proveedores</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>
                        {alertas.deudasProveedores.length} proveedor{alertas.deudasProveedores.length !== 1 ? 'es' : ''} con saldo
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 13, flexShrink: 0, ml: 1 }}>
                    {fmtMoney(alertas.totalDeudasProveedores)}
                  </Typography>
                </Box>
              )}

              {/* Fiados de clientes */}
              {alertas.fiadosClientes?.length > 0 && (
                <Box component={Link} to="/clientes" onClick={handleCloseAlertas}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, textDecoration: 'none', '&:hover': { bgcolor: HOVER }, cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: `${WARNING}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HandshakeIcon sx={{ color: WARNING, fontSize: 15 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>Fiados de clientes</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>
                        {alertas.fiadosClientes.length} cliente{alertas.fiadosClientes.length !== 1 ? 's' : ''} con deuda
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ color: WARNING, fontWeight: 700, fontSize: 13, flexShrink: 0, ml: 1 }}>
                    {fmtMoney(alertas.totalFiadosClientes)}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      <ConfirmDialog open={confirmarLogout} onClose={() => setConfirmarLogout(false)} onConfirm={logout}
        title="¿Cerrar sesión?"
        message="Vas a salir de tu cuenta y vas a necesitar volver a iniciar sesión para acceder al sistema."
        confirmLabel="Cerrar sesión"
      />

      {/* ── ASISTENTE DE IA ── */}
      <AsistenteIA />
    </Box>
  );
}
