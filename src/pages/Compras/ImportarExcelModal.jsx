import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, CircularProgress, TextField, Tooltip,
  Dialog, DialogTitle, DialogContent, Select, MenuItem, FormControl,
} from '@mui/material';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import CloseIcon        from '@mui/icons-material/Close';
import TableChartIcon   from '@mui/icons-material/TableChart';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { BORDER, INK, INK2, MUTED, P, HOVER, TABLE_HEADER, modalPaperSx } from '../../theme/tokens';
import { leerExcelCompra } from '../../utils/excelImport';
import { matchProducto, precioVentaSugerido } from './comprasMatching';
import { productosService } from '../../services/productosService';
import { toLocalDateStr } from '../../utils/format';
import { esFraccionable, abrevUnidad } from '../../utils/unidadMedida';
import TablePagination from '../../components/shared/TablePagination';

export default function ImportarExcelModal({ open, onClose, onConfirm, proveedores }) {
  const fileRef = useRef(null);
  const [idProveedor, setIdProveedor] = useState('');
  const [loading, setLoading] = useState(false);
  const [lineas,  setLineas]  = useState(null);
  const [error,   setError]   = useState(null);
  const [pagina,    setPagina]    = useState(1);
  const [pageSize,  setPageSize]  = useState(20);

  const reset = () => { setLineas(null); setError(null); setPagina(1); };
  const handleClose = () => { reset(); setIdProveedor(''); onClose(); };

  const handleEditarLinea = (idx, campo, valor) => {
    setLineas(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [campo]: valor };
      return next;
    });
  };

  const handleQuitarLinea = (idx) => {
    setLineas(prev => prev.filter((_, i) => i !== idx));
  };

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
      // Match contra el catálogo completo del backend, no un array local — se
      // pide de a lotes chicos en paralelo (un puñado de candidatos por
      // nombre único) y se aplica encima la misma lógica difusa de siempre.
      const nombresUnicos = [...new Set(filas.map(f => f.nombre))];
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
      setPagina(1);
      setLineas(filas.map(f => ({
        nombre_original: f.nombre,
        producto_match:  matchProducto(f.nombre, candidatosPorNombre.get(f.nombre) || []),
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

  /* ── PASO 2: tabla de revisión (mismo patrón que la importación de
      Productos y Proveedores — grilla con header sticky, celdas editables
      y paginada, en vez de una lista de tarjetas que se hacía lenta con
      archivos grandes al renderizar todas las filas de una). ── */
  if (lineas) {
    const importCols = [
      { key: 'nombre',   header: 'Producto',       width: '1.6fr' },
      { key: 'cantidad', header: 'Cant.',           width: '110px' },
      { key: 'precio',   header: 'Precio compra',   width: '140px' },
      { key: 'quitar',   header: '',                width: '48px' },
    ];
    const gridTemplate = importCols.map(c => c.width).join(' ');
    const totalPages = Math.max(1, Math.ceil(lineas.length / pageSize));
    const paginaActual = Math.min(pagina, totalPages);
    const inicioPag = (paginaActual - 1) * pageSize;
    const paginadas = lineas.slice(inicioPag, inicioPag + pageSize).map((l, i) => ({ ...l, _idx: inicioPag + i }));
    const celdaSx = { '& .MuiInputBase-root': { fontSize: 12.5 }, '& .MuiInputBase-input': { py: '6px', px: '8px' } };
    const validos = lineas.filter(l => l.producto_match).length;

    return (
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
        PaperProps={{ sx: { ...modalPaperSx, height: '85vh' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: INK }}>Confirmar importación</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
              {validos} de {lineas.length} producto{lineas.length !== 1 ? 's' : ''} matchearon con el catálogo — revisá y corregí lo que haga falta antes de importar
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 520 }}>
              <Box role="row" sx={{ display: 'contents' }}>
                {importCols.map(c => (
                  <Box key={c.key} sx={{
                    position: 'sticky', top: 0, zIndex: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`,
                    px: 1, py: 1, display: 'flex', alignItems: 'center',
                  }}>
                    <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.header}</Typography>
                  </Box>
                ))}
              </Box>
              {paginadas.map((l) => {
                const rowBg = l.producto_match ? 'transparent' : '#f59e0b12';
                return (
                  <Box key={l._idx} role="row" sx={{ display: 'contents' }}>
                    <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      {l.producto_match
                        ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0 }} />
                        : <Tooltip title="No matcheó con ningún producto del catálogo — no se va a incluir"><WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 14, flexShrink: 0 }} /></Tooltip>
                      }
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: INK, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.producto_match?.nombre || l.nombre_original}
                        </Typography>
                        {!l.producto_match && (
                          <Typography sx={{ color: '#f59e0b', fontSize: 10.5 }} noWrap>No encontrado</Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                      <TextField fullWidth variant="standard" type="number" value={l.cantidad}
                        onChange={e => handleEditarLinea(l._idx, 'cantidad', Number(e.target.value) || 0)}
                        InputProps={{ disableUnderline: true, endAdornment: l.producto_match && esFraccionable(l.producto_match.unidadMedida) ? abrevUnidad(l.producto_match.unidadMedida) : undefined }}
                        sx={celdaSx} />
                    </Box>
                    <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 1, py: 0.75 }}>
                      <TextField fullWidth variant="standard" type="number" value={l.precio_compra}
                        onChange={e => handleEditarLinea(l._idx, 'precio_compra', e.target.value)}
                        InputProps={{ disableUnderline: true, startAdornment: '$' }} sx={celdaSx} />
                    </Box>
                    <Box sx={{ bgcolor: rowBg, borderBottom: `1px solid ${BORDER}`, px: 0.5, py: 0.75, display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Quitar de la importación">
                        <IconButton size="small" onClick={() => handleQuitarLinea(l._idx)} sx={{ color: MUTED, '&:hover': { color: '#ef4444' } }}>
                          <CloseIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {totalPages > 1 && (
            <TablePagination pagina={paginaActual} totalPages={totalPages} pageSize={pageSize} totalItems={lineas.length} label="productos"
              onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
          )}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexShrink: 0 }}>
            <Button onClick={reset} sx={{
              flex: 1, color: INK2, textTransform: 'none', fontWeight: 600,
              border: `1px solid ${BORDER}`, borderRadius: '8px', py: 1.25,
              '&:hover': { bgcolor: HOVER },
            }}>
              Volver a elegir archivo
            </Button>
            <Button onClick={handleConfirm} disabled={!lineas.length} variant="contained" sx={{
              flex: 1, bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25,
              '&:hover': { bgcolor: '#0891b2' },
            }}>
              Usar estos datos →
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  /* ── PASO 1: Proveedor + archivo ── */
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
      </DialogContent>
    </Dialog>
  );
}
