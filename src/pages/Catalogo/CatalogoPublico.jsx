import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, TextField, InputAdornment, Chip, Skeleton, IconButton, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import { catalogoService } from '../../services/catalogoService';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, HOVER } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import { fmtMoney } from '../../utils/format';
import { APP_NAME } from '../../config/brand';
import useLogo from '../../hooks/useLogo';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

const WHATSAPP_GREEN = '#25D366';

export default function CatalogoPublico() {
  const { slug } = useParams();
  const { mode, toggle } = useAppTheme();
  const logoSrc = useLogo();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [busqueda,  setBusqueda]  = useState('');
  const [categoria, setCategoria] = useState('');
  const [soloCombos, setSoloCombos] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [elegidos, setElegidos] = useState([]);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(false);
    catalogoService.getPublico(slug)
      .then(d => { if (vivo) setData(d); })
      .catch(() => { if (vivo) setError(true); })
      .finally(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [slug]);

  const categorias = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.productos.map(p => p.categoria))].sort();
  }, [data]);

  const hayCombos = useMemo(() => !!data?.productos.some(p => p.esCombo), [data]);

  const toggleElegido = (id) => {
    setElegidos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const productosElegidos = useMemo(() => {
    if (!data) return [];
    return data.productos.filter(p => elegidos.includes(p.id));
  }, [data, elegidos]);

  const linkWhatsAppMultiple = useMemo(() => {
    const telefono = (data?.empresa.whatsapp || '').replace(/\D/g, '');
    if (!telefono || productosElegidos.length === 0) return null;
    const mensaje = encodeURIComponent(
      'Hola! Te consulto por estos productos que vi en el catálogo:\n'
      + productosElegidos.map(p => `• ${p.nombre} (${fmtMoney(p.precio)})`).join('\n')
    );
    return `https://wa.me/${telefono}?text=${mensaje}`;
  }, [data, productosElegidos]);

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = busqueda.trim().toLowerCase();
    return data.productos.filter(p =>
      (!q || p.nombre.toLowerCase().includes(q)) &&
      (!categoria || p.categoria === categoria) &&
      (!soloCombos || p.esCombo)
    );
  }, [data, busqueda, categoria, soloCombos]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: BG }}>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, sm: 3 }, pt: 4, pb: 3 }}>
          <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: '16px', mb: 2 }} />
          <Skeleton variant="text" width={220} height={38} />
          <Skeleton variant="rounded" height={44} sx={{ mt: 2, borderRadius: '12px' }} />
        </Box>
        <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, sm: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i}>
              <Skeleton variant="rounded" sx={{ aspectRatio: '1 / 1', width: '100%', borderRadius: '18px' }} />
              <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3, textAlign: 'center' }}>
        <Inventory2Icon sx={{ fontSize: 48, color: MUTED }} />
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Este catálogo no está disponible</Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, maxWidth: 320 }}>
          El link puede estar mal escrito, o el negocio todavía no activó su catálogo online.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: BG }}>
      {/* Hero */}
      <Box sx={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
        {/* Glow decorativo */}
        <Box sx={{
          position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
          width: 560, height: 360, borderRadius: '50%', pointerEvents: 'none',
          background: mode === 'dark'
            ? `radial-gradient(closest-side, ${P}3a, transparent)`
            : `radial-gradient(closest-side, ${P}22, transparent)`,
          filter: 'blur(10px)',
        }} />

        <Box sx={{ position: 'relative', maxWidth: 1080, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, sm: 4 } }}>
            <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{APP_NAME}</Typography>
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton onClick={toggle} size="small"
                sx={{ color: MUTED, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', '&:hover': { color: INK, bgcolor: HOVER } }}>
                {mode === 'dark' ? <WbSunnyOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3.5 }}>
              <Box component="img" src={data.empresa.logo_url || logoSrc} alt={data.empresa.nombre}
                onError={e => { e.target.onerror = null; e.target.src = logoSrc; }}
                sx={{ height: 72, width: 72, borderRadius: '18px', objectFit: 'contain', bgcolor: CARD, border: `1px solid ${BORDER}`, p: 1, flexShrink: 0, boxShadow: '0 8px 24px -8px rgba(2,6,23,0.15)' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 26, sm: 34 }, letterSpacing: '-0.03em', lineHeight: 1.1 }} noWrap>{data.empresa.nombre}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 14.5, mt: 0.5 }}>{data.productos.length} producto{data.productos.length === 1 ? '' : 's'} disponibles</Typography>
              </Box>
            </Box>
          </motion.div>

          <TextField
            fullWidth placeholder="Buscar producto..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: CARD, color: INK, borderRadius: '14px', height: 48,
                boxShadow: '0 4px 16px -4px rgba(2,6,23,0.10)',
                '& fieldset': { borderColor: BORDER },
                '&:hover fieldset': { borderColor: P },
                '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1.5 },
              },
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 20 }} /></InputAdornment> }}
          />
        </Box>
      </Box>

      {/* Filtros + grilla */}
      <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3.5 }}>
        {(categorias.length > 1 || hayCombos) && (
          <Box sx={{
            display: 'flex', gap: 1, mb: 3.5, overflowX: 'auto', pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
          }}>
            {hayCombos && (
              <Chip label="🏷️ Combos" onClick={() => setSoloCombos(v => !v)}
                sx={{
                  bgcolor: soloCombos ? P : CARD, color: soloCombos ? '#fff' : INK2, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${soloCombos ? P : BORDER}`, cursor: 'pointer', flexShrink: 0, px: 0.5, height: 32,
                  transition: 'all .15s ease', '&:hover': { borderColor: P },
                }} />
            )}
            <Chip label="Todas" onClick={() => setCategoria('')}
              sx={{
                bgcolor: !categoria ? P : CARD, color: !categoria ? '#fff' : INK2, fontWeight: 700, fontSize: 13,
                border: `1px solid ${!categoria ? P : BORDER}`, cursor: 'pointer', flexShrink: 0, px: 0.5, height: 32,
                transition: 'all .15s ease', '&:hover': { borderColor: P },
              }} />
            {categorias.map(c => (
              <Chip key={c} label={c} onClick={() => setCategoria(c)}
                sx={{
                  bgcolor: categoria === c ? P : CARD, color: categoria === c ? '#fff' : INK2, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${categoria === c ? P : BORDER}`, cursor: 'pointer', flexShrink: 0, px: 0.5, height: 32,
                  transition: 'all .15s ease', '&:hover': { borderColor: P },
                }} />
            ))}
          </Box>
        )}

        {filtrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Inventory2Icon sx={{ fontSize: 36, color: MUTED, opacity: 0.5, mb: 1 }} />
            <Typography sx={{ color: MUTED, fontSize: 14 }}>No se encontraron productos.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, pb: elegidos.length > 0 ? 9 : 0 }}>
            {filtrados.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onClick={setSeleccionado}
                selectable={!!data.empresa.whatsapp} selected={elegidos.includes(p.id)} onToggleSelect={() => toggleElegido(p.id)} />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ color: MUTED, fontSize: 11.5 }}>Catálogo generado con {APP_NAME}</Typography>
      </Box>

      <ProductModal open={!!seleccionado} onClose={() => setSeleccionado(null)} product={seleccionado} whatsapp={data.empresa.whatsapp} />

      {/* WhatsApp flotante: consultar varios productos elegidos en un solo mensaje */}
      {elegidos.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{ position: 'fixed', right: 20, bottom: 'calc(92px + env(safe-area-inset-bottom))', zIndex: 21 }}
          >
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: CARD, border: `1px solid ${BORDER}`,
              borderRadius: '999px', pl: 1.5, pr: 0.5, py: 0.5, boxShadow: '0 8px 20px -6px rgba(2,6,23,0.2)',
            }}>
              <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {elegidos.length} seleccionado{elegidos.length === 1 ? '' : 's'}
              </Typography>
              <IconButton size="small" onClick={() => setElegidos([])} sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER } }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
            style={{ position: 'fixed', right: 20, bottom: 'calc(20px + env(safe-area-inset-bottom))', zIndex: 21 }}
          >
            <Box
              component="a"
              href={linkWhatsAppMultiple}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                position: 'relative', width: 60, height: 60, borderRadius: '50%', bgcolor: WHATSAPP_GREEN,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 26px -6px rgba(37,211,102,0.55)',
              }}
            >
              <WhatsAppIcon sx={{ color: '#fff', fontSize: 30 }} />
              <Box sx={{
                position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, px: 0.5, borderRadius: '10px',
                bgcolor: '#fff', color: WHATSAPP_GREEN, fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${WHATSAPP_GREEN}`,
              }}>
                {elegidos.length}
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </Box>
  );
}
