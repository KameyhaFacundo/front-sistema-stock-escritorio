import { useState } from 'react';
import {
  Box, Typography, IconButton, Accordion, AccordionSummary, AccordionDetails, Button, Fade,
} from '@mui/material';
import HelpOutlineIcon    from '@mui/icons-material/HelpOutline';
import CloseIcon          from '@mui/icons-material/Close';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import WhatsAppIcon       from '@mui/icons-material/WhatsApp';
import { CARD, BORDER, INK, INK2, MUTED, HOVER, SUCCESS } from '../../theme/tokens';

export const WA_NUMBER = '54938150693332'; // Código país (54) + 9 + área + número, sin +
const WA_MSG    = encodeURIComponent('Hola, tengo una consulta sobre el sistema de stock.');

const FAQS = [
  {
    q: '¿Cómo registro una compra?',
    a: 'Andá a Compras → Nueva Compra. Seleccioná el proveedor, agregá los productos con cantidad y costo. Si el producto no existe, escribí el nombre y elegí "+ Crear" para crearlo al vuelo. Al guardar con estado "Confirmada" el stock se actualiza automáticamente.',
  },
  {
    q: '¿Cómo ajusto el stock manualmente?',
    a: 'Andá a Movimientos → botón "Ajuste manual". Elegí el producto, ingresá la cantidad (positiva para sumar, negativa para restar) y una nota opcional. El cambio queda registrado en el historial.',
  },
  {
    q: '¿Cómo registro una venta?',
    a: 'Desde el Punto de Venta (POS) podés agregar productos al carrito, elegir el método de pago y confirmar la venta. El stock se descuenta automáticamente.',
  },
  {
    q: '¿Qué significa una compra "Pendiente"?',
    a: 'Una compra pendiente no afecta el stock todavía. Cuando la confirmás cambia a "Confirmada" y el stock se incrementa. Si la cancelás, no se toca el stock. Revisá las compras pendientes viejas para mantener el inventario actualizado.',
  },
  {
    q: '¿Cómo gestiono las deudas?',
    a: 'Las deudas con proveedores se ven en la sección Proveedores (deuda por cuenta corriente). Las deudas de clientes (fiados) se ven en Clientes. Desde cada una podés registrar pagos parciales o totales.',
  },
  {
    q: '¿Cómo agrego un nuevo producto?',
    a: 'Podés hacerlo desde Productos → botón "Nuevo producto", o también directamente desde Nueva Compra escribiendo el nombre en el campo de producto y eligiendo "+ Crear [nombre]".',
  },
];

export default function SoporteWidget() {
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Panel flotante */}
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 1299,
          width: { xs: 'calc(100vw - 48px)', sm: 360 },
          maxHeight: '70vh',
          bgcolor: CARD, border: `1px solid ${BORDER}`,
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${SUCCESS}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpOutlineIcon sx={{ color: SUCCESS, fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Centro de ayuda</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>Preguntas frecuentes</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px', p: '4px' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* FAQ list */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {FAQS.map((item, i) => (
              <Accordion
                key={i}
                expanded={expanded === i}
                onChange={(_, isExp) => setExpanded(isExp ? i : false)}
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  borderBottom: `1px solid ${BORDER}`,
                  '&:last-of-type': { borderBottom: 'none' },
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: MUTED }} />}
                  sx={{ px: 2.5, py: 0, minHeight: 48, '& .MuiAccordionSummary-content': { my: 1.25 }, '&:hover': { bgcolor: HOVER } }}
                >
                  <Typography sx={{ color: expanded === i ? SUCCESS : INK2, fontSize: 13, fontWeight: expanded === i ? 600 : 400, lineHeight: 1.4 }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2 }}>
                  <Typography sx={{ color: MUTED, fontSize: 13, lineHeight: 1.65 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* Footer WA */}
          <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <Typography sx={{ color: MUTED, fontSize: 12, mb: 1.25 }}>¿No encontrás lo que buscás?</Typography>
            <Button
              fullWidth
              href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: '#25D366', color: '#fff',
                textTransform: 'none', fontWeight: 700, fontSize: 13,
                borderRadius: '10px', py: 1.1,
                '&:hover': { bgcolor: '#1ebe5d' },
              }}
            >
              Escribinos por WhatsApp
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Botón flotante */}
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          width: 52, height: 52, borderRadius: '50%',
          bgcolor: open ? INK2 : SUCCESS,
          boxShadow: `0 4px 20px ${SUCCESS}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'scale(1.08)', boxShadow: `0 6px 24px ${SUCCESS}70` },
        }}
      >
        {open
          ? <CloseIcon sx={{ color: '#fff', fontSize: 22 }} />
          : <HelpOutlineIcon sx={{ color: '#fff', fontSize: 22 }} />
        }
      </Box>
    </>
  );
}
