import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import {
  Dialog, DialogContent, Box, Typography, IconButton,
} from '@mui/material';
import CloseIcon      from '@mui/icons-material/Close';
import CameraAltIcon  from '@mui/icons-material/CameraAlt';
import { INK, MUTED, P, ERROR, modalPaperSx } from '../../theme/tokens';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const videoRef    = useRef(null);
  const controlsRef = useRef(null);
  const [camError,  setCamError] = useState(null);

  useEffect(() => {
    if (!open) return;

    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    // Pequeño delay para que el Dialog termine de montar el video
    const timer = setTimeout(async () => {
      setCamError(null);
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,          // undefined = cámara trasera por defecto en mobile
          videoRef.current,
          (result, err) => {
            if (stopped) return;
            if (result) {
              // Cortar acá, sincrónico — "stopped" solo se ponía en true en el cleanup
              // del efecto, que corre después de que React procesa el onClose() de más
              // abajo (no en el mismo tick). ZXing sigue decodeando frames mientras
              // tanto, así que un código quieto en cuadro un par de frames disparaba
              // onScan varias veces (en el POS, el mismo producto se agregaba 2-3 veces
              // al carrito por un solo escaneo).
              stopped = true;
              controlsRef.current?.stop();
              onScan(result.getText());
              onClose();
              return;
            }
            // NotFoundException es normal cuando no hay código en cuadro — ignorar
            if (err && !(err instanceof NotFoundException)) {
              setCamError('Error al leer el código. Intentá de nuevo.');
            }
          }
        );
        controlsRef.current = controls;
      } catch {
        setCamError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
      }
    }, 100);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controlsRef.current?.stop();
      controlsRef.current = null;
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraAltIcon sx={{ color: P, fontSize: 20 }} />
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Escanear código</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 } }}>
        {camError ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CameraAltIcon sx={{ color: MUTED, fontSize: 40, mb: 1.5 }} />
            <Typography sx={{ color: ERROR, fontSize: 13, lineHeight: 1.5 }}>{camError}</Typography>
          </Box>
        ) : (
          <>
            {/* Vista previa de la cámara */}
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', bgcolor: '#000', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                autoPlay playsInline muted
              />
              {/* Guía de enfoque */}
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <Box sx={{
                  width: '70%', height: '35%',
                  border: `2px solid rgba(92,110,248,0.85)`,
                  borderRadius: '10px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                }} />
              </Box>
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', mt: 1.5 }}>
              Apuntá la cámara al código de barras
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
