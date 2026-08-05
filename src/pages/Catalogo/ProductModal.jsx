import { useState, useEffect } from 'react';
import { Dialog, Box, IconButton, Typography, Chip, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { fmtMoney } from '../../utils/format';
import { CARD, INK, MUTED, P, HOVER } from '../../theme/tokens';

const WHATSAPP_GREEN = '#25D366';

export default function ProductModal({ open, onClose, product, whatsapp }) {
  const [talleElegido, setTalleElegido] = useState(null);

  // Cada vez que se abre un producto distinto, arranca sin talle elegido —
  // si solo tiene uno con stock, se lo preselecciona para no obligar a
  // tocarlo si no hace falta elegir entre varios.
  useEffect(() => {
    if (!product?.tieneVariantes) { setTalleElegido(null); return; }
    const disponibles = product.variantes?.filter(v => v.disponible) ?? [];
    setTalleElegido(disponibles.length === 1 ? disponibles[0].talle : null);
  }, [product]);

  if (!product) return null;

  const necesitaTalle = product.tieneVariantes && !talleElegido;
  const telefono = (whatsapp || '').replace(/\D/g, '');
  const detalleTalle = product.tieneVariantes && talleElegido ? ` (talle ${talleElegido})`
    : (!product.tieneVariantes && product.talle) ? ` (talle ${product.talle})` : '';
  const mensaje = encodeURIComponent(`Hola! Te consulto por "${product.nombre}"${detalleTalle} (${fmtMoney(product.precio)}) que vi en el catálogo.`);
  const linkWhatsApp = telefono && !necesitaTalle ? `https://wa.me/${telefono}?text=${mensaje}` : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: {
        borderRadius: '22px', overflow: 'hidden', bgcolor: CARD,
        maxHeight: 'min(90vh, 680px)', display: 'flex', flexDirection: 'column',
      } }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: HOVER, flexShrink: 0 }}>
        {product.imagenUrl ? (
          <Box component="img" src={product.imagenUrl} alt={product.nombre}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2Icon sx={{ color: MUTED, fontSize: 56, opacity: 0.4 }} />
          </Box>
        )}

        <IconButton onClick={onClose} size="small" sx={{
          position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.92)', color: INK,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)', '&:hover': { bgcolor: '#fff' },
        }}>
          <CloseIcon fontSize="small" />
        </IconButton>

        {product.esCombo && (
          <Chip label="Combo" size="small" sx={{
            position: 'absolute', top: 12, left: 12, height: 24, fontSize: 11, fontWeight: 800,
            bgcolor: P, color: '#fff', letterSpacing: '0.02em',
          }} />
        )}

        {!product.disponible && (
          <Box sx={{
            position: 'absolute', inset: 0, bgcolor: 'rgba(15,17,23,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Sin stock
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.75, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label={product.categoria} size="small" sx={{
            height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: HOVER, color: MUTED,
            letterSpacing: '0.02em', textTransform: 'uppercase',
          }} />
          {!product.tieneVariantes && product.talle && (
            <Chip label={`Talle ${product.talle}`} size="small" sx={{
              height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: `${P}18`, color: P,
              letterSpacing: '0.02em',
            }} />
          )}
        </Box>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 20, lineHeight: 1.25, mt: 0.5 }}>
          {product.nombre}
        </Typography>
        <Typography sx={{ color: P, fontWeight: 800, fontSize: 28, letterSpacing: '-0.01em', mt: 0.25 }}>
          {fmtMoney(product.precio)}
        </Typography>

        {product.esCombo && product.componentes?.length > 0 && (
          <Box sx={{ bgcolor: HOVER, borderRadius: '12px', p: 1.5, mt: 0.5 }}>
            <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.75 }}>
              Incluye
            </Typography>
            {product.componentes.map((c, i) => (
              <Typography key={i} sx={{ color: INK, fontSize: 13.5, lineHeight: 1.7 }}>
                {c.cantidad > 1 ? `${c.cantidad}x ` : ''}{c.nombre}
              </Typography>
            ))}
          </Box>
        )}

        {product.tieneVariantes && (
          <Box sx={{ mt: 0.5 }}>
            <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 1 }}>
              Elegí un talle
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {[...(product.variantes ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map(v => (
                <Chip
                  key={v.id}
                  label={v.talle}
                  clickable={v.disponible}
                  onClick={() => v.disponible && setTalleElegido(v.talle)}
                  sx={{
                    fontWeight: 700, fontSize: 13,
                    bgcolor: talleElegido === v.talle ? P : HOVER,
                    color: talleElegido === v.talle ? '#fff' : (v.disponible ? INK : MUTED),
                    border: `1px solid ${talleElegido === v.talle ? P : 'transparent'}`,
                    textDecoration: v.disponible ? 'none' : 'line-through',
                    opacity: v.disponible ? 1 : 0.5,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {telefono && (
        <Box sx={{ p: { xs: 1.75, sm: 3 }, pt: 1.5, flexShrink: 0, borderTop: `1px solid ${HOVER}` }}>
          <Button
            component={linkWhatsApp ? 'a' : 'button'}
            href={linkWhatsApp || undefined}
            target={linkWhatsApp ? '_blank' : undefined}
            rel={linkWhatsApp ? 'noopener noreferrer' : undefined}
            disabled={!linkWhatsApp}
            variant="contained"
            startIcon={<WhatsAppIcon />}
            sx={{
              bgcolor: WHATSAPP_GREEN, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 15,
              borderRadius: '12px', py: 1.3, width: '100%', boxShadow: 'none',
              '&:hover': { bgcolor: '#1ebe57', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: `${WHATSAPP_GREEN}55`, color: '#fff' },
            }}
          >
            {necesitaTalle ? 'Elegí un talle para consultar' : 'Consultar por WhatsApp'}
          </Button>
        </Box>
      )}
    </Dialog>
  );
}
