import { useContext, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Divider, IconButton, Tooltip, Menu, MenuItem, Badge,
} from '@mui/material';
import GridViewIcon              from '@mui/icons-material/GridView';
import PointOfSaleIcon           from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon          from '@mui/icons-material/ShoppingCart';
import CategoryIcon              from '@mui/icons-material/Category';
import SwapHorizIcon             from '@mui/icons-material/SwapHoriz';
import GroupIcon                 from '@mui/icons-material/Group';
import BusinessIcon              from '@mui/icons-material/Business';
import BadgeIcon                 from '@mui/icons-material/Badge';
import SettingsIcon              from '@mui/icons-material/Settings';
import LogoutIcon                from '@mui/icons-material/Logout';
import LockOpenIcon              from '@mui/icons-material/LockOpen';
import WbSunnyOutlinedIcon       from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon      from '@mui/icons-material/DarkModeOutlined';
import NotificationsIcon         from '@mui/icons-material/Notifications';
import StorefrontIcon            from '@mui/icons-material/Storefront';
import ReceiptLongIcon           from '@mui/icons-material/ReceiptLong';
import DescriptionIcon           from '@mui/icons-material/Description';
import LocalPrintshopIcon       from '@mui/icons-material/LocalPrintshop';
import ExpandMoreIcon            from '@mui/icons-material/ExpandMore';
import CheckIcon                 from '@mui/icons-material/Check';
import KeyboardDoubleArrowLeftIcon  from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { AuthContext } from '../auth/AuthContextBase';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../theme/useAppTheme';
import { useApp } from '../context/AppContextBase';
import { useCaja } from '../context/CajaContextBase';
import useHasPermiso from '../hooks/useHasPermiso';
import usePlan from '../hooks/usePlan';
import {
  CARD, BORDER, INK, MUTED, P, ACCENT_INK, HOVER, ACTIVE_BG, DROPDOWN,
  SUCCESS, ERROR, WARNING, ERROR_BG,
} from '../theme/tokens';
import { APP_NAME, APP_VERSION } from '../config/brand';
import useLogo from '../hooks/useLogo';
import { useSucursales } from '../hooks/queries/useSucursalesQueries';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from './sidebarConstants';

const W = SIDEBAR_WIDTH;
const W_COLLAPSED = SIDEBAR_WIDTH_COLLAPSED;

const buildMenuSections = () => [
  {
    title: 'GENERAL',
    items: [
      { name: 'Dashboard',      icon: GridViewIcon,     path: '/dashboard', permiso: 'verDashboard' },
      { name: 'Punto de Venta', icon: PointOfSaleIcon,  path: '/pos',     permiso: 'verPOS' },
      { name: 'Compras',        icon: ShoppingCartIcon, path: '/compras', permiso: 'verCompras' },
      { name: 'Presupuestos',   icon: DescriptionIcon,  path: '/presupuestos', permiso: 'verPresupuestos' },
      { name: 'Facturas',       icon: ReceiptLongIcon,  path: '/facturas', permiso: 'verVentas', planFeature: 'facturacion' },
    ],
  },
  {
    title: 'CATÁLOGO',
    items: [
      { name: 'Productos',   icon: CategoryIcon,  path: '/productos',   permiso: 'verProductos' },
      { name: 'Movimientos', icon: SwapHorizIcon, path: '/movimientos', permiso: 'verMovimientos' },
      { name: 'Etiquetas',   icon: LocalPrintshopIcon, path: '/etiquetas', permiso: 'verEtiquetas', planFeature: 'etiquetas' },
    ],
  },
  {
    title: 'PERSONAS',
    items: [
      { name: 'Clientes',    icon: GroupIcon,    path: '/clientes',    permiso: 'verClientes' },
      { name: 'Proveedores', icon: BusinessIcon, path: '/proveedores', permiso: 'verProveedores' },
      { name: 'Usuarios',    icon: BadgeIcon,    path: '/usuarios',    permiso: 'verUsuarios' },
      { name: 'Caja',        icon: LockOpenIcon, path: '/caja',        permiso: 'verCaja' },
    ],
  },
];

function SidebarNavItem({ item, isActive, onClick, onMouseEnter, caja, collapsed }) {
  const Icon = item.icon;

  if (item.path === '/configuracion') {
    return null;
  }

  if (item.path === '/caja') {
    const content = (
      <Box
        component={Link}
        to="/caja"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          mx: 1, px: 1.25, py: 0.9,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: '999px',
          textDecoration: 'none',
          bgcolor: isActive ? ACTIVE_BG : 'transparent',
          color:   isActive ? ACCENT_INK : INK,
          transition: 'all 0.15s',
          '&:hover': { bgcolor: isActive ? ACTIVE_BG : HOVER, color: isActive ? ACCENT_INK : INK },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: collapsed ? 'auto' : '100%' }}>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Icon sx={{ fontSize: 16, flexShrink: 0 }} />
            <Box sx={{
              position: 'absolute', top: -2, right: -4,
              width: 7, height: 7, borderRadius: '50%',
              bgcolor: caja.abierta ? SUCCESS : MUTED,
              border: `1.5px solid ${CARD}`,
            }} />
          </Box>
          {!collapsed && (
            <>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1 }}>
                {item.name}
              </Typography>
              <Chip
                label={caja.abierta ? 'Abierta' : 'Cerrada'}
                size="small"
                sx={{ height: 16, fontSize: 9, fontWeight: 700, ml: 'auto', bgcolor: caja.abierta ? `${SUCCESS}20` : HOVER, color: caja.abierta ? SUCCESS : MUTED, border: `1px solid ${caja.abierta ? SUCCESS + '40' : BORDER}`, '& .MuiChip-label': { px: 0.75 } }}
              />
            </>
          )}
        </Box>
      </Box>
    );
    return collapsed
      ? <Tooltip title={`Caja — ${caja.abierta ? 'Abierta' : 'Cerrada'}`} placement="right">{content}</Tooltip>
      : content;
  }

  const content = (
    <Box
      component={Link}
      to={item.path}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        mx: 1, px: 1.25, py: 0.9,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '999px',
        textDecoration: 'none',
        bgcolor: isActive ? ACTIVE_BG : 'transparent',
        color:   isActive ? ACCENT_INK : INK,
        transition: 'all 0.15s',
        '&:hover': { bgcolor: isActive ? ACTIVE_BG : HOVER, color: isActive ? ACCENT_INK : INK },
      }}
    >
      <Icon sx={{ fontSize: 16, flexShrink: 0 }} />
      {!collapsed && (
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1 }}>
          {item.name}
        </Typography>
      )}
    </Box>
  );

  return collapsed
    ? <Tooltip title={item.name} placement="right">{content}</Tooltip>
    : content;
}

export default function Sidebar({ sidebarOpen, onToggleSidebar, collapsed, onToggleCollapsed, onOpenConfig, onOpenAlertas, onConfirmLogout, stockBajoCount }) {
  const { user, switchSucursal } = useContext(AuthContext);
  const toast = useToast();
  const { mode, toggle } = useAppTheme();
  const logoSrc = useLogo();
  const { caja } = useCaja();
  const { alertas } = useApp();
  const location = useLocation();
  const [sucursalAnchor, setSucursalAnchor] = useState(null);
  const [cambiandoSucursal, setCambiandoSucursal] = useState(false);
  const [alertasVistas, setAlertasVistas] = useState(() => parseInt(localStorage.getItem('alertas_vistas') || '0', 10));

  const { checkPermisos } = useHasPermiso();
  const { tieneFacturacion, tieneIA, tieneCobros, tieneCatalogo, tieneEtiquetas } = usePlan();
  const planFeatures = useMemo(() => ({
    facturacion: tieneFacturacion, ia: tieneIA, cobros: tieneCobros, catalogo: tieneCatalogo, etiquetas: tieneEtiquetas,
  }), [tieneFacturacion, tieneIA, tieneCobros, tieneCatalogo, tieneEtiquetas]);

  const { data: sucursales = [] } = useSucursales({ enabled: checkPermisos('list-sucursales') });
  const puedeConfigurar = checkPermisos('verConfiguracion');

  const menuSections = useMemo(() =>
    buildMenuSections()
      .map(section => ({ ...section, items: section.items.filter(item => checkPermisos(item.permiso) && (!item.planFeature || planFeatures[item.planFeature])) }))
      .filter(section => section.items.length > 0),
  [checkPermisos, planFeatures]);

  const hayAlertasNuevas = (alertas?.total || 0) > alertasVistas;

  const preloadPage = (path) => {
    const load = (p) => p.catch(() => {});
    if (path === '/dashboard') load(import('../pages/Dashboard/Dashboard'));
    else if (path === '/pos') load(import('../pages/Home/Home'));
    else if (path === '/compras') load(import('../pages/Compras/Compras'));
    else if (path === '/presupuestos') load(import('../pages/Presupuestos/Presupuestos'));
    else if (path === '/productos') load(import('../pages/Productos/Productos'));
    else if (path === '/movimientos') load(import('../pages/Movimientos/Movimientos'));
    else if (path === '/etiquetas') load(import('../pages/Etiquetas/Etiquetas'));
    else if (path === '/proveedores') load(import('../pages/Proveedores/Proveedores'));
    else if (path === '/clientes') load(import('../pages/Clientes/Clientes'));
    else if (path === '/usuarios') load(import('../pages/Usuarios/Usuarios'));
    else if (path === '/caja') load(import('../pages/Caja/Caja'));
  };

  const handleCambiarSucursal = async (idSucursal) => {
    setSucursalAnchor(null);
    if (idSucursal === user?.id_sucursal) return;
    setCambiandoSucursal(true);
    try {
      await switchSucursal(idSucursal);
      toast('Sucursal cambiada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo cambiar de sucursal', 'error');
    } finally {
      setCambiandoSucursal(false);
    }
  };

  const handleAlertasClick = (e) => {
    onOpenAlertas(e);
    setAlertasVistas(alertas?.total || 0);
    localStorage.setItem('alertas_vistas', String(alertas?.total || 0));
  };

  const handleSidebarClose = () => onToggleSidebar(false);

  const userName     = user?.des_usu || user?.email?.split('@')[0] || 'Admin';
  const businessName = user?.empresa?.nombre || localStorage.getItem('empresa_nombre') || APP_NAME;

  return (
    <Box
      sx={{
        width: { xs: W, md: collapsed ? W_COLLAPSED : W },
        minWidth: { xs: W, md: collapsed ? W_COLLAPSED : W },
        position: 'fixed', top: 0, left: 0, bottom: 0,
        bgcolor: CARD,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column',
        overflowX: 'hidden', overflowY: 'auto',
        zIndex: 100,
        transform: {
          xs: sidebarOpen ? 'translateX(0)' : `translateX(-${W}px)`,
          md: 'translateX(0)',
        },
        transition: 'transform 0.25s ease, width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {/* Riel de colapsar/expandir — solo escritorio. Ficha embebida en el
          borde del panel (estilo IDE/editor), no un FAB flotante suelto. */}
      <Tooltip title={collapsed ? 'Expandir menú' : 'Colapsar menú'} placement="right">
        <IconButton
          onClick={() => onToggleCollapsed?.(v => !v)}
          sx={{
            display: { xs: 'none', md: 'flex' },
            position: 'absolute', top: 28, right: -13, zIndex: 101,
            width: 26, height: 26, p: 0, borderRadius: '7px',
            bgcolor: CARD, color: MUTED,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            '&:hover': { color: P, borderColor: P, bgcolor: `${P}12` },
            transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
          }}
        >
          {collapsed
            ? <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16 }} />
            : <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>

      {/* Logo / workspace */}
      <Box sx={{ px: collapsed ? 1 : 2, py: 1.75, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Box component={Link} to="/dashboard"
            sx={{ display: 'block', flexShrink: 0, lineHeight: 0, '&:hover': { opacity: 0.85 } }}>
            <Box component="img"
              src={user?.empresa?.logo_url || logoSrc}
              alt={APP_NAME}
              onError={(e) => { e.target.src = logoSrc; }}
              sx={{ height: collapsed ? 42 : 46, width: collapsed ? 42 : 46, borderRadius: '9px', objectFit: 'contain', display: 'block', transition: 'height 0.15s, width 0.15s' }} />
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{businessName}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 11 }}>{userName}</Typography>
            </Box>
          )}
        </Box>
        {!collapsed && (
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton size="small" onClick={toggle}
                sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px', p: '4px' }}>
                {mode === 'dark'
                  ? <WbSunnyOutlinedIcon sx={{ fontSize: 17 }} />
                  : <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />
                }
              </IconButton>
            </Tooltip>
            <Tooltip title="Alertas">
              <IconButton size="small" onClick={handleAlertasClick}
                sx={{ color: hayAlertasNuevas ? WARNING : MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px', p: '4px', display: { xs: 'none', md: 'inline-flex' } }}>
                <Badge badgeContent={hayAlertasNuevas ? alertas.total : null} color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 14, height: 14, p: '0 3px' } }}>
                  <NotificationsIcon sx={{ fontSize: 17 }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Sucursal activa */}
      {!collapsed && user?.sucursal && sucursales.length > 1 && (
        <Box sx={{ px: 2, py: 0.75, borderBottom: `1px solid ${BORDER}` }}>
          {user?.is_super_admin ? (
            <Box
              onClick={(e) => setSucursalAnchor(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                color: MUTED, '&:hover': { color: INK }, opacity: cambiandoSucursal ? 0.5 : 1,
              }}
            >
              <StorefrontIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{user.sucursal.nombre}</Typography>
              <ExpandMoreIcon sx={{ fontSize: 15 }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: MUTED }}>
              <StorefrontIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{user.sucursal.nombre}</Typography>
            </Box>
          )}
          <Menu
            anchorEl={sucursalAnchor}
            open={Boolean(sucursalAnchor)}
            onClose={() => setSucursalAnchor(null)}
            PaperProps={{ sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px', minWidth: 200 } }}
          >
            {sucursales.map((s) => (
              <MenuItem key={s.id} onClick={() => handleCambiarSucursal(s.id)}
                sx={{ fontSize: 13, color: INK, gap: 1, py: 1, '&:hover': { bgcolor: HOVER } }}>
                {s.id === user.id_sucursal
                  ? <CheckIcon sx={{ fontSize: 15, color: P }} />
                  : <Box sx={{ width: 15 }} />}
                {s.nombre}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ flex: 1, minHeight: 0, py: 1, pb: 7, overflowY: 'auto' }}>
        {menuSections.map((section, i) => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            {collapsed ? (
              i > 0 && <Divider sx={{ borderColor: BORDER, mx: 1.5, my: 1 }} />
            ) : (
              <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 10.5, fontWeight: 700, color: MUTED, letterSpacing: '0.07em' }}>
                {section.title}
              </Typography>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;

              if (item.path === '/productos' && stockBajoCount > 0) {
                const Icon = item.icon;
                const content = (
                  <Box component={Link} to="/productos" onClick={handleSidebarClose}
                    onMouseEnter={() => preloadPage('/productos')}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 0.9, justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: '999px', textDecoration: 'none', bgcolor: isActive ? ACTIVE_BG : 'transparent', color: isActive ? ACCENT_INK : INK, transition: 'all 0.15s', '&:hover': { bgcolor: isActive ? ACTIVE_BG : HOVER, color: isActive ? ACCENT_INK : INK }, }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: collapsed ? 'auto' : '100%' }}>
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Icon sx={{ fontSize: 16, flexShrink: 0 }} />
                        {collapsed && (
                          <Box sx={{
                            position: 'absolute', top: -2, right: -4,
                            width: 7, height: 7, borderRadius: '50%',
                            bgcolor: ERROR, border: `1.5px solid ${CARD}`,
                          }} />
                        )}
                      </Box>
                      {!collapsed && (
                        <>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1 }}>{item.name}</Typography>
                          <Chip label={stockBajoCount} size="small"
                            sx={{ height: 18, fontSize: 10, fontWeight: 700, ml: 'auto', bgcolor: '#fff', color: ERROR, border: `1px solid ${ERROR}`, '& .MuiChip-label': { px: 0.75 } }} />
                        </>
                      )}
                    </Box>
                  </Box>
                );
                return collapsed
                  ? <Tooltip key={item.name} title={`${item.name} — ${stockBajoCount} con stock bajo`} placement="right">{content}</Tooltip>
                  : <Box key={item.name}>{content}</Box>;
              }

              return (
                <SidebarNavItem key={item.name} item={item} isActive={isActive} onClick={handleSidebarClose} onMouseEnter={() => preloadPage(item.path)} caja={caja} collapsed={collapsed} />
              );
            })}
          </Box>
        ))}

        {/* Sistema — antes vivían acá abajo, escondidos en un menú desplegable
            que abría hacia arriba desde el pie del sidebar; en ventanas más
            chicas ese menú podía quedar cortado y "Cerrar sesión" no se veía
            ni se podía tocar. Ítems fijos en el nav, siempre visibles y
            siempre alcanzables con scroll normal, igual que el resto. */}
        <Box sx={{ mb: 0.5 }}>
          {collapsed ? (
            <Divider sx={{ borderColor: BORDER, mx: 1.5, my: 1 }} />
          ) : (
            <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 10.5, fontWeight: 700, color: MUTED, letterSpacing: '0.07em' }}>
              SISTEMA
            </Typography>
          )}
          {puedeConfigurar && (
            collapsed ? (
              <Tooltip title="Configuración" placement="right">
                <Box onClick={onOpenConfig} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 0.9,
                  justifyContent: 'center', borderRadius: '999px', cursor: 'pointer',
                  color: INK, transition: 'all 0.15s', '&:hover': { bgcolor: HOVER, color: INK },
                }}>
                  <SettingsIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                </Box>
              </Tooltip>
            ) : (
              <Box onClick={onOpenConfig} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 0.9,
                borderRadius: '999px', cursor: 'pointer',
                color: INK, transition: 'all 0.15s', '&:hover': { bgcolor: HOVER, color: INK },
              }}>
                <SettingsIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1 }}>Configuración</Typography>
              </Box>
            )
          )}
          {collapsed ? (
            <Tooltip title="Cerrar sesión" placement="right">
              <Box onClick={onConfirmLogout} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 0.9,
                justifyContent: 'center', borderRadius: '999px', cursor: 'pointer',
                color: ERROR, transition: 'all 0.15s', '&:hover': { bgcolor: ERROR_BG },
              }}>
                <LogoutIcon sx={{ fontSize: 16, flexShrink: 0 }} />
              </Box>
            </Tooltip>
          ) : (
            <Box onClick={onConfirmLogout} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 0.9,
              borderRadius: '999px', cursor: 'pointer',
              color: ERROR, transition: 'all 0.15s', '&:hover': { bgcolor: ERROR_BG },
            }}>
              <LogoutIcon sx={{ fontSize: 16, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1 }}>Cerrar sesión</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Usuario */}
      <Divider sx={{ borderColor: BORDER }} />
      <Box sx={{ px: collapsed ? 1 : 1.5, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Tooltip title={collapsed ? userName : ''} placement="right">
            <Avatar sx={{ width: 28, height: 28, bgcolor: HOVER, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 700, color: INK, flexShrink: 0 }}>
              {userName[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || 'Administrador'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {!collapsed && (
        <Typography sx={{ textAlign: 'center', color: MUTED, fontSize: 10, py: 0.5, opacity: 0.5 }}>
          v{APP_VERSION}
        </Typography>
      )}
    </Box>
  );
}
