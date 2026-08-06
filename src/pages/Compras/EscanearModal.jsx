import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, CircularProgress,
  Dialog, DialogContent,
} from '@mui/material';
import CameraAltIcon    from '@mui/icons-material/CameraAlt';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import CloseIcon        from '@mui/icons-material/Close';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { BG, BORDER, INK, INK2, MUTED, P, HOVER, modalPaperSx } from '../../theme/tokens';
import { escanearFacturaApi } from '../../services/escanearApi';
import { productosService } from '../../services/productosService';
import { toLocalDateStr } from '../../utils/format';
import { matchProducto, matchProveedor, precioVentaSugerido } from './comprasMatching';

// La IA cobra por resolución de imagen — para leer texto de una factura no
// hace falta la foto entera de 12+ megapíxeles que saca un celu. Achicarla
// acá reduce bastante el costo de cada escaneo sin perder legibilidad.
function comprimirImagen(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo procesar la imagen')); };
    img.src = objectUrl;
  });
}

export default function EscanearModal({ open, onClose, onConfirm, proveedores }) {
  const fileRef   = useRef(null);
  const [preview, setPreview]   = useState(null);
  const [base64,  setBase64]    = useState(null);
  const [mime,    setMime]      = useState('image/jpeg');
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [error,   setError]     = useState(null);

  const reset = () => { setPreview(null); setBase64(null); setResult(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResult(null);
    setError(null);
    try {
      const dataUrl = await comprimirImagen(file);
      setMime('image/jpeg');
      setPreview(dataUrl);
      setBase64(dataUrl.split(',')[1]);
    } catch {
      // Fallback: si no se pudo comprimir (ej. un archivo que no es una
      // imagen rasterizable), se manda tal cual como se hacía antes.
      setMime(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setPreview(dataUrl);
        setBase64(dataUrl.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analizar = async () => {
    if (!base64) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await escanearFacturaApi(base64, mime);
      const data = res.data;

      // Match contra el catálogo completo del backend, no un array local — se
      // pide un puñado de candidatos por nombre único detectado (una factura
      // tiene pocas líneas, no hace falta más que eso) y se aplica encima la
      // misma lógica difusa de siempre (exacto → includes → included-by).
      const nombresUnicos = [...new Set((data.productos || []).map(p => p.nombre))];
      const candidatosPorNombre = new Map();
      const LOTE = 8;
      for (let i = 0; i < nombresUnicos.length; i += LOTE) {
        const lote = nombresUnicos.slice(i, i + LOTE);
        await Promise.all(lote.map(async (nombre) => {
          try {
            candidatosPorNombre.set(nombre, await productosService.getAll({ search: nombre, per_page: 5 }));
          } catch {
            candidatosPorNombre.set(nombre, []);
          }
        }));
      }

      const lineasMapped = (data.productos || []).map(p => {
        const match = matchProducto(p.nombre, candidatosPorNombre.get(p.nombre) || []);
        return {
          nombre_original: p.nombre,
          id_producto:     match?.id || '',
          producto_match:  match,
          cantidad:        Number(p.cantidad) || 1,
          precio_compra:   p.precio_unitario || '',
        };
      });

      const proveedor_match = matchProveedor(data.proveedor, proveedores);
      setResult({ ...data, lineasMapped, proveedor_match });
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo analizar la imagen. Asegurate de que sea clara y esté bien iluminada.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    const lineasValidas = result.lineasMapped.filter(l => l.id_producto !== '');
    onConfirm({
      id_proveedor: result.proveedor_match?.id || '',
      fecha:        result.fecha || toLocalDateStr(),
      estado:       'confirmada',
      metodo_pago:  'efectivo',
      lineas: lineasValidas.length
        ? lineasValidas.map(l => ({
            id_producto: l.id_producto,
            cantidad: l.cantidad,
            precio_compra: l.precio_compra,
            precio_venta: precioVentaSugerido(l.precio_compra, l.producto_match),
          }))
        : [{ id_producto: '', cantidad: 1, precio_compra: '' }],
    });
    handleClose();
  };

  const triggerCamera = () => {
    fileRef.current.setAttribute('capture', 'environment');
    fileRef.current.click();
  };

  const triggerUpload = () => {
    fileRef.current.removeAttribute('capture');
    fileRef.current.click();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesomeIcon sx={{ color: P, fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Escanear factura con IA</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>Extrae los datos automáticamente</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 } }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* ── PASO 1: Selección ── */}
        {!preview && (
          <Box>
            <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.65, mb: 3 }}>
              Sacá una foto o subí la imagen de la factura del proveedor. La IA extrae el proveedor, productos, cantidades y precios.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box onClick={triggerCamera} sx={{
                flex: 1, py: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                bgcolor: HOVER, border: `1.5px dashed ${BORDER}`, borderRadius: '14px',
                cursor: 'pointer', transition: 'all 0.15s',
                '&:hover': { borderColor: P, bgcolor: `${P}08` },
              }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${P}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CameraAltIcon sx={{ color: P, fontSize: 26 }} />
                </Box>
                <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Tomar foto</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11, textAlign: 'center' }}>Cámara del dispositivo</Typography>
              </Box>
              <Box onClick={triggerUpload} sx={{
                flex: 1, py: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                bgcolor: HOVER, border: `1.5px dashed ${BORDER}`, borderRadius: '14px',
                cursor: 'pointer', transition: 'all 0.15s',
                '&:hover': { borderColor: P, bgcolor: `${P}08` },
              }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${P}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadFileIcon sx={{ color: P, fontSize: 26 }} />
                </Box>
                <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Subir imagen</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11, textAlign: 'center' }}>JPG, PNG</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── PASO 2: Preview + Analizar ── */}
        {preview && !result && (
          <Box>
            <Box sx={{ position: 'relative', mb: 2.5 }}>
              <Box component="img" src={preview} alt="Factura"
                sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: '10px', border: `1px solid ${BORDER}`, bgcolor: BG }} />
              <IconButton size="small" onClick={reset}
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>

            {error && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ef444415', border: '1px solid #ef444435', borderRadius: '8px' }}>
                <Typography sx={{ color: '#ef4444', fontSize: 13 }}>{error}</Typography>
              </Box>
            )}

            <Button fullWidth variant="contained" onClick={analizar} disabled={loading}
              startIcon={loading
                ? <CircularProgress size={15} sx={{ color: '#fff' }} />
                : <AutoAwesomeIcon sx={{ fontSize: 17 }} />
              }
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.4, borderRadius: '10px', '&:hover': { bgcolor: '#0891b2' } }}>
              {loading ? 'Analizando factura...' : 'Analizar con IA'}
            </Button>
          </Box>
        )}

        {/* ── PASO 3: Resultados ── */}
        {result && (
          <Box>
            {/* Proveedor */}
            <Box sx={{ mb: 1.5, p: 1.75, bgcolor: HOVER, border: `1px solid ${result.proveedor_match ? BORDER : '#f59e0b44'}`, borderRadius: '10px' }}>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Proveedor</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {result.proveedor_match
                  ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16, flexShrink: 0 }} />
                  : <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 16, flexShrink: 0 }} />
                }
                <Box>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{result.proveedor || '—'}</Typography>
                  {result.proveedor_match
                    ? <Typography sx={{ color: '#10b981', fontSize: 11 }}>Encontrado en el sistema</Typography>
                    : <Typography sx={{ color: '#f59e0b', fontSize: 11 }}>No encontrado — podés seleccionarlo manualmente</Typography>
                  }
                </Box>
              </Box>
            </Box>

            {/* Fecha */}
            {result.fecha && (
              <Box sx={{ mb: 1.5, px: 1.75, py: 1.25, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>Fecha detectada</Typography>
                <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{result.fecha}</Typography>
              </Box>
            )}

            {/* Productos */}
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              Productos detectados ({result.lineasMapped.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5, maxHeight: 260, overflowY: 'auto' }}>
              {result.lineasMapped.map((l, i) => (
                <Box key={i} sx={{
                  p: 1.5, bgcolor: HOVER,
                  border: `1px solid ${l.producto_match ? BORDER : '#f59e0b44'}`,
                  borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                    {l.producto_match
                      ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0, mt: '2px' }} />
                      : <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 14, flexShrink: 0, mt: '2px' }} />
                    }
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.producto_match?.nombre || l.nombre_original}
                      </Typography>
                      {!l.producto_match && (
                        <Typography sx={{ color: '#f59e0b', fontSize: 11 }}>Seleccioná manualmente</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>x{l.cantidad}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>${Number(l.precio_compra || 0).toLocaleString('es-AR')}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Total detectado */}
            {result.total && (
              <Box sx={{ px: 2, py: 1.25, mb: 2, bgcolor: `${P}12`, border: `1px solid ${P}25`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: MUTED, fontSize: 13 }}>Total detectado</Typography>
                <Typography sx={{ color: P, fontWeight: 800, fontSize: 16 }}>${Number(result.total).toLocaleString('es-AR')}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button onClick={reset} sx={{
                flex: 1, color: INK2, textTransform: 'none', fontWeight: 600,
                border: `1px solid ${BORDER}`, borderRadius: '8px', py: 1.25,
                '&:hover': { bgcolor: HOVER },
              }}>
                Volver a escanear
              </Button>
              <Button onClick={handleConfirm} variant="contained" sx={{
                flex: 1, bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25,
                '&:hover': { bgcolor: '#0891b2' },
              }}>
                Usar estos datos →
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
