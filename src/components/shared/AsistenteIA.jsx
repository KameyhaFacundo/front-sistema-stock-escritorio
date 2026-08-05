import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, TextField, CircularProgress, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { asistenteService } from '../../services/asistenteService';
import usePlan from '../../hooks/usePlan';
import { CARD, BORDER, INK, MUTED, HOVER, BG } from '../../theme/tokens';

const SALUDO_INICIAL = '¡Hola! Preguntame lo que quieras sobre tus ventas, tu stock, o cómo usar el sistema 🙂';

// Color propio del asistente — distinto del primario de la app para que no
// se confunda con el resto de la UI y quede claro que es una función de IA.
const IA          = '#8b5cf6';
const IA_HOVER    = '#7c3aed';
const IA_GRADIENT = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';

export default function AsistenteIA() {
  const { tieneIA } = usePlan();
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState([{ role: 'ia', texto: SALUDO_INICIAL }]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, open]);

  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto || enviando) return;

    const historialPrevio = mensajes.slice(-10).map(m => ({ role: m.role, texto: m.texto }));
    setMensajes(m => [...m, { role: 'user', texto }]);
    setInput('');
    setEnviando(true);

    try {
      const respuesta = await asistenteService.preguntar(texto, historialPrevio);
      setMensajes(m => [...m, { role: 'ia', texto: respuesta || 'No pude responder eso, probá de nuevo.' }]);
    } catch (e) {
      setMensajes(m => [...m, { role: 'ia', texto: e.response?.data?.message || 'No pude responder en este momento. Probá de nuevo en un rato.' }]);
    } finally {
      setEnviando(false);
    }
  };

  if (!tieneIA) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — en mobile ocupa toda la pantalla y permite cerrar tocando afuera */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(15,23,42,0.45)' }}
              className="asistente-ia-backdrop"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'fixed', zIndex: 1501 }}
              className="asistente-ia-panel"
            >
              <Box sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: { xs: '20px', sm: '18px' }, overflow: 'hidden',
                boxShadow: '0 24px 60px -12px rgba(2,6,23,0.45)',
              }}>
                {/* Header */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.75,
                  background: IA_GRADIENT, flexShrink: 0,
                }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Asistente</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5 }}>Consultá tus datos o cómo usar el sistema</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                {/* Mensajes */}
                <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.75, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25, bgcolor: BG }}>
                  {mensajes.map((m, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.75, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {m.role === 'ia' && (
                        <Box sx={{ width: 24, height: 24, borderRadius: '7px', background: IA_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: '2px' }}>
                          <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 13 }} />
                        </Box>
                      )}
                      <Box sx={{
                        maxWidth: '80%', px: 1.5, py: 1, borderRadius: '14px', fontSize: 13.5, lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        bgcolor: m.role === 'user' ? IA : CARD,
                        color: m.role === 'user' ? '#fff' : INK,
                        border: m.role === 'user' ? 'none' : `1px solid ${BORDER}`,
                        borderBottomRightRadius: m.role === 'user' ? '4px' : '14px',
                        borderBottomLeftRadius: m.role === 'user' ? '14px' : '4px',
                      }}>
                        {m.texto}
                      </Box>
                    </Box>
                  ))}
                  {enviando && (
                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-start' }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '7px', background: IA_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 13 }} />
                      </Box>
                      <Box sx={{ px: 1.5, py: 1.1, borderRadius: '14px', borderBottomLeftRadius: '4px', bgcolor: CARD, border: `1px solid ${BORDER}` }}>
                        <CircularProgress size={14} sx={{ color: IA }} />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Input */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1.5, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                  <TextField
                    fullWidth multiline maxRows={4} size="small" placeholder="Escribí tu pregunta..."
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                    disabled={enviando}
                    sx={{
                      '& .MuiOutlinedInput-root': { bgcolor: HOVER, color: INK, borderRadius: '12px', fontSize: 13.5, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: `${IA}60` }, '&.Mui-focused fieldset': { borderColor: IA } },
                    }}
                  />
                  <IconButton onClick={handleEnviar} disabled={!input.trim() || enviando}
                    sx={{ background: IA_GRADIENT, color: '#fff', borderRadius: '10px', flexShrink: 0, '&:hover': { background: IA_HOVER }, '&.Mui-disabled': { background: HOVER, color: MUTED } }}>
                    <SendIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        style={{ position: 'fixed', right: 20, bottom: 'calc(20px + env(safe-area-inset-bottom))', zIndex: 1500 }}
      >
        <Tooltip title={open ? '' : 'Asistente de IA'} placement="left">
          <Box
            onClick={() => setOpen(o => !o)}
            sx={{
              width: 56, height: 56, borderRadius: '50%', background: IA_GRADIENT, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 10px 26px -6px ${IA}90`,
            }}
          >
            {open ? <CloseIcon sx={{ color: '#fff', fontSize: 24 }} /> : <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 24 }} />}
          </Box>
        </Tooltip>
      </motion.div>

      {/* Posición del panel: sheet casi completo en mobile, ventana flotante en desktop */}
      <style>{`
        .asistente-ia-panel {
          right: 12px; left: 12px;
          bottom: calc(12px + env(safe-area-inset-bottom));
          top: calc(12px + env(safe-area-inset-top));
        }
        @media (min-width: 600px) {
          .asistente-ia-panel {
            left: auto; top: auto;
            right: 20px;
            bottom: calc(88px + env(safe-area-inset-bottom));
            width: min(380px, calc(100vw - 32px));
            height: min(560px, calc(100vh - 140px));
          }
          .asistente-ia-backdrop { background: transparent !important; }
        }
      `}</style>
    </>
  );
}
