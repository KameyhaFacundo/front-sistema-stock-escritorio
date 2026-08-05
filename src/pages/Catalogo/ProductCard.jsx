import { motion } from 'framer-motion';
import { Box, Typography, Chip } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckIcon from '@mui/icons-material/Check';
import { CARD, BORDER, INK, MUTED, P, HOVER } from '../../theme/tokens';
import { fmtMoney } from '../../utils/format';

export default function ProductCard({ product, onClick, selectable, selected, onToggleSelect, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.035, ease: 'easeOut' }}
      whileHover={onClick ? { y: -6 } : undefined}
      style={{ height: '100%' }}
    >
      <Box onClick={() => onClick && onClick(product)} sx={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}>
        <Box sx={{
          bgcolor: CARD,
          border: `1.5px solid ${selected ? P : BORDER}`,
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: product.disponible ? 1 : 0.6,
          transition: 'box-shadow .25s ease, border-color .2s ease',
          height: '100%',
          boxShadow: selected ? `0 0 0 3px ${P}22` : '0 1px 2px rgba(2,6,23,0.04)',
          '&:hover': onClick ? { boxShadow: '0 16px 32px -8px rgba(2,6,23,0.16)', '& img': { transform: 'scale(1.08)' } } : undefined,
        }}>
          <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1', bgcolor: HOVER }}>
            {product.imagenUrl ? (
              <Box component="img" src={product.imagenUrl} alt={product.nombre}
                sx={{
                  height: '100%', width: '100%', objectFit: 'cover', display: 'block',
                  transition: 'transform .5s cubic-bezier(.16,1,.3,1)',
                }} />
            ) : (
              <Box sx={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inventory2Icon sx={{ color: MUTED, fontSize: 38, opacity: 0.4 }} />
              </Box>
            )}

            {product.esCombo && (
              <Chip label="Combo" size="small" sx={{
                position: 'absolute', top: 10, right: 10, height: 22, fontSize: 10.5, fontWeight: 800,
                bgcolor: P, color: '#fff', letterSpacing: '0.02em',
              }} />
            )}
            {product.tieneVariantes && (
              <Chip label="Elegí talle" size="small" sx={{
                position: 'absolute', top: 10, right: 10, height: 22, fontSize: 10.5, fontWeight: 800,
                bgcolor: P, color: '#fff', letterSpacing: '0.02em',
              }} />
            )}
            {!product.tieneVariantes && product.talle && (
              <Chip label={`Talle ${product.talle}`} size="small" sx={{
                position: 'absolute', top: 10, right: 10, height: 22, fontSize: 10.5, fontWeight: 800,
                bgcolor: P, color: '#fff', letterSpacing: '0.02em',
              }} />
            )}

            {!product.disponible && (
              <Box sx={{
                position: 'absolute', inset: 0, bgcolor: 'rgba(15,17,23,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ color: '#fff', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sin stock
                </Typography>
              </Box>
            )}

            {selectable && (
              <Box
                onClick={e => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
                sx={{
                  position: 'absolute', top: 6, left: 6, width: 36, height: 36, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'transform .15s ease',
                  '&:hover': { transform: 'scale(1.06)' },
                }}
              >
                <Box sx={{
                  width: 24, height: 24, borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: selected ? P : 'rgba(255,255,255,0.92)',
                  border: `1.5px solid ${selected ? P : 'rgba(255,255,255,0.9)'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                }}>
                  {selected && <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Chip label={product.categoria} size="small" sx={{
              height: 19, fontSize: 10, fontWeight: 700, bgcolor: HOVER, color: MUTED,
              alignSelf: 'flex-start', letterSpacing: '0.02em', textTransform: 'uppercase',
            }} />
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, mt: 0.5 }}>
              {product.nombre}
            </Typography>
            {product.esCombo && product.componentes?.length > 0 && (
              <Typography sx={{ color: MUTED, fontSize: 11.5, lineHeight: 1.4 }}>
                Incluye: {product.componentes.map(c => c.nombre).join(', ')}
              </Typography>
            )}
            <Typography sx={{ color: P, fontWeight: 800, fontSize: 19, mt: 'auto', pt: 0.75, letterSpacing: '-0.01em' }}>
              {fmtMoney(product.precio)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
