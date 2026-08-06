import { useState, useMemo, useEffect, useRef, startTransition, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Dialog, Typography, Chip } from '@mui/material';
import SearchIcon         from '@mui/icons-material/Search';
import DashboardIcon      from '@mui/icons-material/Dashboard';
import StorefrontIcon     from '@mui/icons-material/Storefront';
import InventoryIcon      from '@mui/icons-material/Inventory';
import TrendingDownIcon   from '@mui/icons-material/TrendingDown';
import SwapVertIcon       from '@mui/icons-material/SwapVert';
import PeopleIcon         from '@mui/icons-material/People';
import PersonIcon                from '@mui/icons-material/Person';
import DescriptionIcon           from '@mui/icons-material/Description';
import useBusquedaProductos from '../../hooks/useBusquedaProductos';
import useHasPermiso from '../../hooks/useHasPermiso';
import { fmtMoney } from '../../utils/format';
import { BORDER, INK, MUTED, P, HOVER, MODAL, DROPDOWN, SUCCESS, ERROR } from '../../theme/tokens';

const PAGES = [
  { label: 'Reportes',          icon: DashboardIcon,    path: '/dashboard',    group: 'Páginas', permiso: 'verDashboard' },
  { label: 'Punto de Venta',    icon: StorefrontIcon,   path: '/pos',          group: 'Páginas', permiso: 'verPOS' },
  { label: 'Compras',           icon: TrendingDownIcon, path: '/compras',      group: 'Páginas', permiso: 'verCompras' },
  { label: 'Presupuestos',      icon: DescriptionIcon,  path: '/presupuestos', group: 'Páginas', permiso: 'verPresupuestos' },
  { label: 'Productos',         icon: InventoryIcon,    path: '/productos',    group: 'Páginas', permiso: 'verProductos' },
  { label: 'Movimientos',       icon: SwapVertIcon,     path: '/movimientos',  group: 'Páginas', permiso: 'verMovimientos' },
  { label: 'Clientes',          icon: PeopleIcon,       path: '/clientes',     group: 'Páginas', permiso: 'verClientes' },
  { label: 'Proveedores',       icon: StorefrontIcon,   path: '/proveedores',  group: 'Páginas', permiso: 'verProveedores' },
  { label: 'Usuarios',          icon: PersonIcon,       path: '/usuarios',     group: 'Páginas', permiso: 'verUsuarios' },
];

const CommandPalette = memo(function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { checkPermisos } = useHasPermiso();
  const [query, setQuery] = useState('');
  const { resultados: productos } = useBusquedaProductos(query, { perPage: 5, enabled: open });
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  const allowedPages = useMemo(() => PAGES.filter(p => checkPermisos(p.permiso)), [checkPermisos]);

  useEffect(() => {
    if (open) { startTransition(() => { setQuery(''); setActiveIdx(0); }); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  const prodResults = useMemo(() => productos
    .map(p => ({ label: p.nombre, sub: p.codigo, right: fmtMoney(p.precioFinal), stock: p.stock, alerta: p.alerta, group: 'Productos', isProduct: true })),
  [productos]);

  const pageResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allowedPages;
    return allowedPages.filter(p => p.label.toLowerCase().includes(q));
  }, [query, allowedPages]);

  const allResults = useMemo(() => [...pageResults, ...prodResults], [pageResults, prodResults]);

  useEffect(() => { startTransition(() => setActiveIdx(0)); }, [query]);

  const handleSelect = (item) => {
    if (item.isProduct) { onClose(); return; }
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allResults[activeIdx]) handleSelect(allResults[activeIdx]);
    if (e.key === 'Escape') onClose();
  };

  const groups = useMemo(() => {
    const map = {};
    allResults.forEach((item, i) => {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push({ ...item, _idx: i });
    });
    return map;
  }, [allResults]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: MODAL, backgroundImage: 'none',
          border: `1px solid ${BORDER}`, borderRadius: '14px',
          mt: '15vh', verticalAlign: 'top',
          overflow: 'hidden',
        },
      }}
      sx={{ '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)' } }}
    >
      {/* Input */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon sx={{ color: MUTED, fontSize: 20, flexShrink: 0 }} />
        <Box
          component="input"
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar páginas o productos..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit',
          }}
        />
        <Chip label="Esc" size="small" sx={{ height: 20, fontSize: 11, bgcolor: HOVER, color: MUTED, border: `1px solid ${BORDER}` }} />
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: 380, overflowY: 'auto', py: 1 }}>
        {allResults.length === 0 && query.trim() && (
          <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 4 }}>Sin resultados</Typography>
        )}

        {Object.entries(groups).map(([group, items]) => (
          <Box key={group}>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', px: 2.5, pt: 1.5, pb: 0.5 }}>
              {group.toUpperCase()}
            </Typography>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item._idx === activeIdx;
              return (
                <Box
                  key={item._idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIdx(item._idx)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    mx: 1, px: 1.5, py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    bgcolor: isActive ? HOVER : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  {Icon && (
                    <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: isActive ? P + '22' : DROPDOWN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 16, color: isActive ? P : MUTED }} />
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}>{item.label}</Typography>
                    {item.sub && <Typography sx={{ color: MUTED, fontSize: 12 }}>{item.sub}</Typography>}
                  </Box>
                  {item.right && (
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{item.right}</Typography>
                      <Typography sx={{ color: item.stock === 0 ? ERROR : SUCCESS, fontSize: 11 }}>
                        {item.stock === 0 ? 'Sin stock' : `Stock: ${item.stock}`}
                      </Typography>
                    </Box>
                  )}
                  {!item.isProduct && isActive && (
                    <Chip label="Enter" size="small" sx={{ height: 18, fontSize: 10, bgcolor: P + '22', color: P, border: 'none', flexShrink: 0 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 1.25, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 2.5 }}>
        {[['↑↓', 'Navegar'], ['Enter', 'Seleccionar'], ['Esc', 'Cerrar']].map(([key, label]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Chip label={key} size="small" sx={{ height: 18, fontSize: 10, bgcolor: HOVER, color: MUTED, border: `1px solid ${BORDER}` }} />
            <Typography sx={{ color: MUTED, fontSize: 11 }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
});

export default CommandPalette;
