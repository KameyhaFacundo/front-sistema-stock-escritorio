import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, CircularProgress,
  Dialog, DialogContent, Select, MenuItem, FormControl,
} from '@mui/material';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import CloseIcon        from '@mui/icons-material/Close';
import TableChartIcon   from '@mui/icons-material/TableChart';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { BORDER, INK, INK2, MUTED, P, HOVER, modalPaperSx } from '../../theme/tokens';
import { leerExcelCompra } from '../../utils/excelImport';
import { matchProducto, precioVentaSugerido } from './comprasMatching';
import { toLocalDateStr } from '../../utils/format';

export default function ImportarExcelModal({ open, onClose, onConfirm, proveedores, productos }) {
  const fileRef = useRef(null);
  const [idProveedor, setIdProveedor] = useState('');
  const [loading, setLoading] = useState(false);
  const [lineas,  setLineas]  = useState(null);
  const [error,   setError]   = useState(null);

  const reset = () => { setLineas(null); setError(null); };
  const handleClose = () => { reset(); setIdProveedor(''); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const filas = await leerExcelCompra(file);
      if (!filas.length) {
        setError('No se encontraron productos en el archivo. Revisá que tenga columnas de nombre, cantidad y precio.');
        return;
      }
      setLineas(filas.map(f => ({
        nombre_original: f.nombre,
        producto_match:  matchProducto(f.nombre, productos),
        cantidad:        f.cantidad,
        precio_compra:   f.precio ?? '',
      })));
    } catch {
      setError('No se pudo leer el archivo. Asegurate de que sea un .xlsx válido.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!lineas) return;
    const lineasValidas = lineas.filter(l => l.producto_match);
    onConfirm({
      id_proveedor: idProveedor || '',
      fecha:        toLocalDateStr(),
      estado:       'confirmada',
      metodo_pago:  'efectivo',
      lineas: lineasValidas.length
        ? lineasValidas.map(l => ({
            id_producto: l.producto_match.id,
            cantidad: l.cantidad,
            precio_compra: l.precio_compra,
            precio_venta: precioVentaSugerido(l.precio_compra, l.producto_match),
          }))
        : [{ id_producto: '', cantidad: 1, precio_compra: '' }],
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TableChartIcon sx={{ color: P, fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Importar desde Excel</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>Lee un .xlsx del proveedor (sin IA)</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 } }}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: 'none' }} onChange={handleFile} />

        {/* ── PASO 1: Proveedor + archivo ── */}
        {!lineas && (
          <Box>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
              Proveedor (opcional)
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <Select value={idProveedor} onChange={e => setIdProveedor(e.target.value)} displayEmpty>
                <MenuItem value=""><em style={{ color: MUTED }}>Sin especificar</em></MenuItem>
                {proveedores.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </Select>
            </FormControl>

            <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.65, mb: 2 }}>
              El archivo debe tener columnas de <strong>nombre</strong>, <strong>cantidad</strong> y <strong>precio</strong>
              {' '}(con o sin encabezado — si no hay encabezado, toma las 3 primeras columnas en ese orden).
            </Typography>

            {error && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ef444415', border: '1px solid #ef444435', borderRadius: '8px' }}>
                <Typography sx={{ color: '#ef4444', fontSize: 13 }}>{error}</Typography>
              </Box>
            )}

            <Box onClick={() => fileRef.current.click()} sx={{
              py: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              bgcolor: HOVER, border: `1.5px dashed ${BORDER}`, borderRadius: '14px',
              cursor: 'pointer', transition: 'all 0.15s',
              '&:hover': { borderColor: P, bgcolor: `${P}08` },
            }}>
              {loading ? (
                <CircularProgress size={26} sx={{ color: P }} />
              ) : (
                <>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${P}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadFileIcon sx={{ color: P, fontSize: 26 }} />
                  </Box>
                  <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Elegir archivo .xlsx</Typography>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ── PASO 2: Revisión antes de confirmar ── */}
        {lineas && (
          <Box>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              Productos encontrados ({lineas.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5, maxHeight: 320, overflowY: 'auto' }}>
              {lineas.map((l, i) => (
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
                        <Typography sx={{ color: '#f59e0b', fontSize: 11 }}>No encontrado — no se va a incluir</Typography>
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

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button onClick={reset} sx={{
                flex: 1, color: INK2, textTransform: 'none', fontWeight: 600,
                border: `1px solid ${BORDER}`, borderRadius: '8px', py: 1.25,
                '&:hover': { bgcolor: HOVER },
              }}>
                Volver a elegir archivo
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
