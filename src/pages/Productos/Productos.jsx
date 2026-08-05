import React, { useMemo, useState, useEffect, Suspense, useRef } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Select, MenuItem, ListSubheader, FormControl, Switch, Dialog, DialogContent, DialogTitle,
  Chip, Tooltip, Checkbox, Collapse, Autocomplete, CircularProgress,
} from "@mui/material";
import SearchIcon       from '@mui/icons-material/Search';
import FilterListIcon   from '@mui/icons-material/FilterList';
import SettingsIcon     from '@mui/icons-material/Settings';
import ShuffleIcon      from '@mui/icons-material/Shuffle';
import AddIcon          from '@mui/icons-material/Add';
import CloseIcon        from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon   from '@mui/icons-material/FileUpload';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import SaveIcon         from '@mui/icons-material/Save';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckIcon        from '@mui/icons-material/Check';
import AddBoxIcon       from '@mui/icons-material/AddBox';
import CameraAltIcon   from '@mui/icons-material/CameraAlt';
import HistoryIcon     from '@mui/icons-material/History';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Inventory2Icon  from '@mui/icons-material/Inventory2';
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore';
import ExpandLessIcon  from '@mui/icons-material/ExpandLess';
import CheckroomIcon   from '@mui/icons-material/Checkroom';
import BlockIcon       from '@mui/icons-material/Block';
import InventoryIcon   from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, INPUT, HOVER, TABLE_HEADER, DROPDOWN, fieldSx, selectSx, modalPaperSx,
         SUCCESS, SUCCESS_BG, ERROR, ERROR_BG, ERROR_DARK, WARNING } from '../../theme/tokens';
import { useToast } from '../../context/ToastContext';
import { fmtMoney, fmtDate } from '../../utils/format';
import { getVencimientoBadge } from '../../utils/vencimiento';
import { exportarExcel } from '../../utils/excelExport';
import { leerFilasArchivo, indiceEncabezado } from '../../utils/excelImport';
import ViewListIcon   from '@mui/icons-material/ViewList';
import GridViewIcon   from '@mui/icons-material/GridView';
import TablePagination from '../../components/shared/TablePagination';
import lazyWithRetry from '../../utils/lazyWithRetry';
const BarcodeScanner = lazyWithRetry(() => import('../../components/shared/BarcodeScanner'));
import ColSortHeader from '../../components/shared/ColSortHeader';
import { categoriasService } from '../../services/categoriasService';
import { proveedoresService } from '../../services/proveedoresService';
import { productosService } from '../../services/productosService';
import { gruposTallesService } from '../../services/gruposTallesService';
import { tallesService } from '../../services/tallesService';
import { useProductos } from '../../context/ProductosContextBase';
import { useSucursales } from '../../hooks/queries/useSucursalesQueries';
import useHasPermiso from '../../hooks/useHasPermiso';
import usePlan from '../../hooks/usePlan';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import AyudaButton from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { useIsMobile } from '../../utils/responsive';
import iaService from '../../services/iaService';
import { useAuth } from '../../auth/AuthContextBase';
import { abrevUnidad } from '../../utils/unidadMedida';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_NAME, PRIMARY_COLOR } from '../../config/brand';

function hexToRgbInventario(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
const PDF_INV_PRIMARY = hexToRgbInventario(PRIMARY_COLOR);

// PDF de control de inventario — solo lista stock actual + una columna vacía
// "Stock físico" para completar a mano contando en el local; no guarda nada
// ni genera ajustes automáticos (eso se sigue cargando en Movimientos si hace falta).
function generarPdfInventario(rows, empresa) {
  const doc   = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const hoy   = new Date().toLocaleDateString('es-AR');

  doc.setFillColor(...PDF_INV_PRIMARY);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(empresa?.nombre || COMPANY_NAME, 14, 18);
  doc.setFontSize(10.5);
  doc.setFont(undefined, 'normal');
  doc.text('Control de inventario — stock físico', 14, 26);

  doc.setFontSize(9);
  doc.text(`Emitido: ${hoy}`, pageW - 14, 18, { align: 'right' });
  doc.text(`${rows.length} producto${rows.length !== 1 ? 's' : ''}`, pageW - 14, 26, { align: 'right' });

  autoTable(doc, {
    startY: 40,
    head: [['Código', 'Producto', 'Categoría', 'Stock actual', 'Stock físico']],
    body: rows.map(p => [p.codigo || '', p.nombre, p.categoria || '', String(p.stock ?? 0), '']),
    styles: { fontSize: 9 },
    headStyles: { fillColor: PDF_INV_PRIMARY, textColor: 255, fontSize: 9 },
    columnStyles: { 3: { halign: 'center' }, 4: { halign: 'center', cellWidth: 32 } },
    margin: { left: 14, right: 14 },
  });

  doc.save(`inventario-${hoy.replace(/\//g, '-')}.pdf`);
}

function Label({ children, required }) {
  return (
    <Typography sx={{ color: INK2, fontSize: 12.5, fontWeight: 500, mb: 0.75 }}>
      {children}{required && <Box component="span" sx={{ color: P }}> *</Box>}
    </Typography>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Gestionar Categorías
────────────────────────────────────────────── */
function ModalCategorias({ open, onClose, categorias, setCategorias }) {
  const toast = useToast();
  const [nombre,     setNombre]     = useState('');
  const [color,      setColor]      = useState('#5c6ef8');
  const [loading,    setLoading]    = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const fileInputRef = React.useRef(null);

  const crear = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      const nueva = await categoriasService.create(nombre.trim());
      setCategorias(prev => [...prev, { ...nueva, color, productos: 0 }]);
      setNombre('');
      toast('Categoría creada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await categoriasService.delete(id);
      setCategorias(prev => prev.filter(c => c.id !== id));
      toast('Categoría eliminada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar (tiene productos asociados)', 'error');
    }
  };

  const iniciarEdicion = (cat) => {
    setEditandoId(cat.id);
    setEditNombre(cat.nombre);
  };

  const guardarEdicion = async (id) => {
    if (!editNombre.trim()) return;
    try {
      const updated = await categoriasService.update(id, editNombre.trim());
      setCategorias(prev => prev.map(c => c.id === id ? { ...c, nombre: updated.nombre } : c));
      setEditandoId(null);
      toast('Categoría actualizada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  const exportarCSV = () => {
    exportarExcel({
      filename: 'categorias.xlsx',
      sheetName: 'Categorías',
      subtitle: 'Listado de categorías',
      columns: [
        { header: 'ID', width: 10, align: 'center' },
        { header: 'Nombre', width: 32 },
      ],
      rows: categorias.map(c => [c.id, c.nombre]),
    });
  };

  const descargarPlantilla = () => {
    const csv = 'Nombre\n"Electrónica"\n"Ropa"\n"Alimentos"';
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_categorias.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const importarCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    let filas;
    try {
      filas = await leerFilasArchivo(file);
    } catch {
      toast('No se pudo leer el archivo. Asegurate de que sea un .csv o .xlsx válido.', 'error');
      e.target.value = '';
      return;
    }
    if (filas.length < 2) { e.target.value = ''; return; }

    // El propio "Exportar Excel" antepone título + subtítulo + fila en
    // blanco antes del encabezado real — hay que saltarlos para no tratar
    // el nombre de la empresa o el subtítulo como si fueran categorías.
    const inicio = indiceEncabezado(filas);

    // El propio "Exportar Excel" genera 2 columnas (ID, Nombre) — si el
    // encabezado no dice claramente cuál es "nombre", usamos la última
    // columna (así sirve tanto para ese archivo como para la plantilla,
    // que tiene una sola columna "Nombre").
    const header = filas[inicio].map(c => String(c || '').toLowerCase().trim());
    const iNombre = header.findIndex(c => c.includes('nombre') || c.includes('categoria') || c.includes('categoría'));
    const colNombre = iNombre !== -1 ? iNombre : filas[inicio].length - 1;

    let ok = 0;
    for (let i = inicio + 1; i < filas.length; i++) {
      const nombre = String(filas[i][colNombre] ?? '').replace(/^"|"$/g, '').trim();
      if (!nombre) continue;
      try {
        const nueva = await categoriasService.create(nombre);
        setCategorias(prev => [...prev, { ...nueva, color: '#5c6ef8', productos: 0 }]);
        ok++;
      } catch { /* skip duplicados */ }
    }
    if (ok > 0) toast(`${ok} categoría${ok !== 1 ? 's' : ''} importada${ok !== 1 ? 's' : ''}`, 'success');
    e.target.value = '';
  };

  const totalPages = Math.max(1, Math.ceil(categorias.length / pageSize));
  const paged = categorias.slice((pagina - 1) * pageSize, pagina * pageSize);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: INK }}>Gestionar Categorías</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Nueva categoría */}
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>Nueva categoría</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField fullWidth placeholder="Nombre de la categoría" value={nombre} onChange={e => setNombre(e.target.value)}
            sx={{ ...fieldSx, flex: 1 }} size="small" onKeyDown={e => e.key === 'Enter' && crear()} />
          <Box component="input" type="color" value={color} onChange={e => setColor(e.target.value)}
            sx={{ width: 44, height: 44, borderRadius: '8px', border: `1px solid ${BORDER}`, cursor: 'pointer', bgcolor: INPUT, p: 0.5 }} />
        </Box>
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={crear} disabled={loading}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mb: 1.5, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
          {loading ? 'Creando...' : 'Crear'}
        </Button>

        {/* CSV */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 1 }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportarCSV}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 12, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
            Exportar Excel
          </Button>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => fileInputRef.current?.click()}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 12, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
            Importar
          </Button>
          <Box component="input" ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={importarCSV} sx={{ display: 'none' }} />
        </Box>
        <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />} onClick={descargarPlantilla}
          sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', mb: 0.5, '&:hover': { bgcolor: HOVER } }}>
          Descargar plantilla
        </Button>
        <Typography sx={{ color: MUTED, fontSize: 12, mb: 2 }}>Descarga la plantilla para empezar.</Typography>

        {/* Existentes */}
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 1 }}>Categorías existentes</Typography>
        <Box sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
          {paged.length === 0 ? (
            <Typography sx={{ color: MUTED, fontSize: 13, p: 2, textAlign: 'center' }}>Sin categorías</Typography>
          ) : paged.map((cat) => (
            <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color ?? P, mr: 1.25, flexShrink: 0 }} />
              {editandoId === cat.id ? (
                <TextField
                  value={editNombre} onChange={e => setEditNombre(e.target.value)} size="small" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(cat.id); if (e.key === 'Escape') setEditandoId(null); }}
                  sx={{ flex: 1, mr: 1, ...fieldSx, '& .MuiInputBase-input': { py: '6px', px: '10px', fontSize: 13 } }}
                />
              ) : (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 500 }}>{cat.nombre}</Typography>
                </Box>
              )}
              {editandoId === cat.id ? (
                <>
                  <IconButton size="small" onClick={() => guardarEdicion(cat.id)} sx={{ color: SUCCESS, '&:hover': { bgcolor: SUCCESS_BG } }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditandoId(null)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={() => iniciarEdicion(cat)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setCategoriaAEliminar(cat)} sx={{ color: ERROR, '&:hover': { bgcolor: ERROR_BG } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
        </Box>
        {categorias.length > pageSize && (
          <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={categorias.length} label="categorías" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
        )}
      </DialogContent>
      <ConfirmDialog open={!!categoriaAEliminar} onClose={() => setCategoriaAEliminar(null)} onConfirm={() => eliminar(categoriaAEliminar.id)}
        title="¿Eliminar esta categoría?"
        message={`"${categoriaAEliminar?.nombre}" se va a eliminar. Si tiene productos asociados, no se va a poder borrar.`}
        confirmLabel="Eliminar" />
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Gestionar Proveedores
────────────────────────────────────────────── */
function ModalProveedores({ open, onClose, proveedores, setProveedores }) {
  const toast = useToast();
  const empty = { persona: '', cuit: '', telefono: '', email: '', direccion: '' };
  const [form,       setForm]       = useState(empty);
  const [loading,    setLoading]    = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm,   setEditForm]   = useState(empty);
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  const set     = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setEdit = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const crear = async () => {
    if (!form.persona.trim()) return;
    setLoading(true);
    try {
      const nuevo = await proveedoresService.create({ ...form, estado: true });
      setProveedores(prev => [...prev, nuevo]);
      setForm(empty);
      toast('Proveedor creado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear el proveedor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await proveedoresService.delete(id);
      setProveedores(prev => prev.filter(p => p.id !== id));
      toast('Proveedor eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar (tiene compras asociadas)', 'error');
    }
  };

  const iniciarEdicion = (p) => {
    setEditandoId(p.id);
    setEditForm({ persona: p.nombre || '', cuit: p.cuit || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' });
  };

  const guardarEdicion = async (id) => {
    if (!editForm.persona.trim()) return;
    try {
      const actualizado = await proveedoresService.update(id, editForm);
      setProveedores(prev => prev.map(p => p.id === id ? actualizado : p));
      setEditandoId(null);
      toast('Proveedor actualizado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(proveedores.length / pageSize));
  const paged = proveedores.slice((pagina - 1) * pageSize, pagina * pageSize);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: INK }}>Gestionar Proveedores</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Nuevo proveedor */}
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>Nuevo proveedor</Typography>
        <TextField fullWidth placeholder="Nombre / Razón social" value={form.persona} onChange={set('persona')}
          sx={{ ...fieldSx, mb: 1 }} size="small" onKeyDown={e => e.key === 'Enter' && crear()} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          <TextField placeholder="CUIT" value={form.cuit} onChange={set('cuit')} sx={fieldSx} size="small" />
          <TextField placeholder="Teléfono" value={form.telefono} onChange={set('telefono')} sx={fieldSx} size="small" />
        </Box>
        <TextField fullWidth placeholder="Email" value={form.email} onChange={set('email')} sx={{ ...fieldSx, mb: 1 }} size="small" />
        <TextField fullWidth placeholder="Dirección" value={form.direccion} onChange={set('direccion')} sx={{ ...fieldSx, mb: 1.5 }} size="small" />
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={crear} disabled={loading || !form.persona.trim()}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mb: 2, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
          {loading ? 'Creando...' : 'Crear'}
        </Button>

        {/* Existentes */}
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 1 }}>Proveedores existentes</Typography>
        <Box sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
          {paged.length === 0 ? (
            <Typography sx={{ color: MUTED, fontSize: 13, p: 2, textAlign: 'center' }}>Sin proveedores</Typography>
          ) : paged.map((p) => (
            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
              {editandoId === p.id ? (
                <TextField
                  value={editForm.persona} onChange={setEdit('persona')} size="small" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(p.id); if (e.key === 'Escape') setEditandoId(null); }}
                  sx={{ flex: 1, mr: 1, ...fieldSx, '& .MuiInputBase-input': { py: '6px', px: '10px', fontSize: 13 } }}
                />
              ) : (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 500 }}>{p.nombre}</Typography>
                  {p.telefono && <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.telefono}</Typography>}
                </Box>
              )}
              {editandoId === p.id ? (
                <>
                  <IconButton size="small" onClick={() => guardarEdicion(p.id)} sx={{ color: SUCCESS, '&:hover': { bgcolor: SUCCESS_BG } }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditandoId(null)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={() => iniciarEdicion(p)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setProveedorAEliminar(p)} sx={{ color: ERROR, '&:hover': { bgcolor: ERROR_BG } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
        </Box>
        {proveedores.length > pageSize && (
          <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={proveedores.length} label="proveedores" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
        )}
      </DialogContent>
      <ConfirmDialog open={!!proveedorAEliminar} onClose={() => setProveedorAEliminar(null)} onConfirm={() => eliminar(proveedorAEliminar.id)}
        title="¿Eliminar este proveedor?"
        message={`"${proveedorAEliminar?.nombre}" se va a eliminar. Si tiene compras asociadas, no se va a poder borrar.`}
        confirmLabel="Eliminar" />
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Gestionar Grupos de Talles (solo indumentaria)
────────────────────────────────────────────── */
// Alta/baja de talles de UN grupo — agregar uno a la vez, generar un rango
// numérico, o borrar un talle existente. Usado tanto acá (gestión de un grupo
// ya existente) como en el alta de producto (grupo recién creado, inline) —
// a este componente le da igual de dónde salió el grupo, solo necesita que
// ya exista en el backend (con id real) para poder crearle talles.
function TallesEditor({ grupo, onTallesChange }) {
  const toast = useToast();
  const [talleAEliminar, setTalleAEliminar] = useState(null);
  const [nuevoTalle, setNuevoTalle] = useState('');
  const [nuevoTalleCurva, setNuevoTalleCurva] = useState('');
  const [rango, setRango] = useState({ desde: '', hasta: '', salto: '' });

  const agregarTalleManual = async () => {
    const valor = nuevoTalle.trim();
    if (!valor) return;
    try {
      const orden = (grupo.talles.length || 0) + 1;
      const curva = nuevoTalleCurva ? Number(nuevoTalleCurva) : null;
      const talle = await tallesService.create(grupo.id, valor, orden, curva);
      onTallesChange([...grupo.talles, talle]);
      setNuevoTalle('');
      setNuevoTalleCurva('');
    } catch (e) {
      toast(e.response?.data?.errors?.valor?.[0] || e.response?.data?.message || 'Error al crear el talle', 'error');
    }
  };

  // "Desde X hasta Y salto de Z" — para curvas numéricas (ej. calzado 36 a 45)
  // en vez de tener que cargar cada talle uno por uno.
  const generarRango = async () => {
    const { desde, hasta, salto } = rango;
    const d = Number(desde), h = Number(hasta), s = Number(salto) || 1;
    if (isNaN(d) || isNaN(h) || s <= 0 || d > h) {
      toast('Revisá los valores del rango', 'error');
      return;
    }
    let orden = (grupo.talles.length || 0) + 1;
    const nuevos = [];
    for (let i = d; i <= h; i += s) {
      try {
        const talle = await tallesService.create(grupo.id, String(i), orden++);
        nuevos.push(talle);
      } catch { /* salteá duplicados */ }
    }
    if (nuevos.length) {
      onTallesChange([...grupo.talles, ...nuevos]);
      toast(`${nuevos.length} talle${nuevos.length !== 1 ? 's' : ''} creado${nuevos.length !== 1 ? 's' : ''}`, 'success');
    }
    setRango({ desde: '', hasta: '', salto: '' });
  };

  const confirmarEliminarTalle = async () => {
    try {
      await tallesService.delete(talleAEliminar.id);
      onTallesChange(grupo.talles.filter(t => t.id !== talleAEliminar.id));
      toast('Talle eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar (hay productos usando este talle)', 'error');
    } finally {
      setTalleAEliminar(null);
    }
  };

  return (
    <>
      {grupo.talles.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {[...grupo.talles].sort((a, b) => a.orden - b.orden).map(t => (
            <Tooltip key={t.id} title={t.cantidadCurva ? `${t.cantidadCurva} unidad${t.cantidadCurva !== 1 ? 'es' : ''} por curva` : 'Sin cantidad de curva configurada'}>
              <Chip label={t.cantidadCurva ? `${t.valor} ×${t.cantidadCurva}` : t.valor} size="small" onDelete={() => setTalleAEliminar(t)}
                sx={{ bgcolor: `${P}14`, color: P, fontWeight: 600, border: `1px solid ${P}30` }} />
            </Tooltip>
          ))}
        </Box>
      )}
      <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', mb: 0.75 }}>Agregar talle</Typography>
      <Typography sx={{ color: MUTED, fontSize: 11.5, mb: 0.75 }}>
        &quot;Cantidad en la curva&quot; es opcional — cuántas unidades de este talle vienen en un bulto/curva al comprarle al proveedor (ver Compras &gt; Comprar por curva).
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <TextField placeholder="Ej: XL" size="small" value={nuevoTalle}
          onChange={e => setNuevoTalle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarTalleManual()}
          sx={{ ...fieldSx, flex: 1 }} />
        <TextField placeholder="Curva" type="number" size="small" value={nuevoTalleCurva}
          onChange={e => setNuevoTalleCurva(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarTalleManual()}
          sx={{ ...fieldSx, width: 90 }} inputProps={{ min: 0 }} />
        <Button variant="outlined" onClick={agregarTalleManual}
          sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
          Agregar
        </Button>
      </Box>
      <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', mb: 0.75 }}>O generar un rango numérico</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 1 }}>
        <TextField placeholder="Desde" type="number" size="small" value={rango.desde}
          onChange={e => setRango(prev => ({ ...prev, desde: e.target.value }))} sx={fieldSx} />
        <TextField placeholder="Hasta" type="number" size="small" value={rango.hasta}
          onChange={e => setRango(prev => ({ ...prev, hasta: e.target.value }))} sx={fieldSx} />
        <TextField placeholder="Salto" type="number" size="small" value={rango.salto}
          onChange={e => setRango(prev => ({ ...prev, salto: e.target.value }))} sx={fieldSx} />
        <Button variant="outlined" onClick={generarRango}
          sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', borderRadius: '8px', px: 1.5, '&:hover': { bgcolor: HOVER } }}>
          Generar
        </Button>
      </Box>
      <ConfirmDialog open={!!talleAEliminar} onClose={() => setTalleAEliminar(null)} onConfirm={confirmarEliminarTalle}
        title="¿Eliminar este talle?"
        message={`"${talleAEliminar?.valor}" se va a eliminar. Si hay productos usándolo, no se va a poder borrar.`}
        confirmLabel="Eliminar" />
    </>
  );
}

function ModalGruposTalles({ open, onClose, grupos, setGrupos }) {
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);

  const crearGrupo = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      const nuevo = await gruposTallesService.create(nombre.trim());
      setGrupos(prev => [...prev, nuevo]);
      setNombre('');
      toast('Grupo creado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear el grupo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminarGrupo = async (id) => {
    try {
      await gruposTallesService.delete(id);
      setGrupos(prev => prev.filter(g => g.id !== id));
      toast('Grupo eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar (tiene productos asociados)', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: INK }}>Grupos de talles</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ color: MUTED, fontSize: 12.5, mb: 2 }}>
          Cada grupo es una curva de talles (ej. &quot;Ropa&quot;: S/M/L/XL, &quot;Calzado&quot;: 36 a 45) — un producto con variantes elige uno al crearse.
        </Typography>

        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>Nuevo grupo</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <TextField fullWidth placeholder="Ej: Ropa, Calzado" value={nombre} onChange={e => setNombre(e.target.value)}
            sx={{ ...fieldSx, flex: 1 }} size="small" onKeyDown={e => e.key === 'Enter' && crearGrupo()} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={crearGrupo} disabled={loading}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: P_HOVER } }}>
            Crear
          </Button>
        </Box>

        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 1 }}>Grupos existentes</Typography>
        {grupos.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: 13, p: 2, textAlign: 'center', bgcolor: INPUT, borderRadius: '10px' }}>Sin grupos todavía</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {grupos.map(g => (
              <Box key={g.id} sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.25, bgcolor: INPUT, cursor: 'pointer' }}
                  onClick={() => setExpandido(prev => prev === g.id ? null : g.id)}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{g.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{g.talles.length} talle{g.talles.length !== 1 ? 's' : ''}</Typography>
                  </Box>
                  <IconButton size="small" onClick={e => { e.stopPropagation(); setGrupoAEliminar(g); }} sx={{ color: ERROR, '&:hover': { bgcolor: ERROR_BG } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {expandido === g.id ? <ExpandLessIcon sx={{ color: MUTED }} /> : <ExpandMoreIcon sx={{ color: MUTED }} />}
                </Box>
                <Collapse in={expandido === g.id}>
                  <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}` }}>
                    <TallesEditor grupo={g}
                      onTallesChange={(talles) => setGrupos(prev => prev.map(x => x.id === g.id ? { ...x, talles } : x))} />
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <ConfirmDialog open={!!grupoAEliminar} onClose={() => setGrupoAEliminar(null)} onConfirm={() => { eliminarGrupo(grupoAEliminar.id); setGrupoAEliminar(null); }}
        title="¿Eliminar este grupo?"
        message={`"${grupoAEliminar?.nombre}" se va a eliminar. Si hay productos usándolo, no se va a poder borrar.`}
        confirmLabel="Eliminar" />
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   EDITOR: Componentes de un combo/kit
────────────────────────────────────────────── */
function ComboComponentesEditor({ productos, value, onChange, excludeId }) {
  const [seleccion, setSeleccion] = useState(null);
  const [cantidad,  setCantidad]  = useState('1');

  // Un producto con variantes no tiene stock propio (vive en cada talle) —
  // usarlo como componente dejaría el combo imposible de vender (el chequeo
  // de stock del componente siempre daría 0). Mismo criterio que ya excluye
  // a los combos de esta lista.
  const disponibles = useMemo(() => productos.filter(p =>
    !p.esCombo && !p.tieneVariantes && p.id !== excludeId && !value.some(c => c.id_producto === p.id)
  ), [productos, value, excludeId]);

  const agregar = () => {
    if (!seleccion) return;
    const cant = Math.max(1, Number(cantidad) || 1);
    onChange([...value, { id_producto: seleccion.id, cantidad: cant, nombre: seleccion.nombre, codigo: seleccion.codigo }]);
    setSeleccion(null);
    setCantidad('1');
  };

  const quitar = (id) => onChange(value.filter(c => c.id_producto !== id));

  const cambiarCantidad = (id, cant) => onChange(value.map(c =>
    c.id_producto === id ? { ...c, cantidad: Math.max(1, Number(cant) || 1) } : c
  ));

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <Autocomplete
          fullWidth size="small"
          options={disponibles}
          getOptionLabel={(o) => o.nombre || ''}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          value={seleccion}
          onChange={(_, v) => setSeleccion(v)}
          renderInput={(params) => <TextField {...params} placeholder="Buscar producto para agregar..." sx={fieldSx} />}
          renderOption={(props, o) => (
            <Box component="li" {...props} key={o.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, fontSize: 14 }}>
              <Box sx={{ minWidth: 0 }}>
                {o.nombre}
                <Typography component="span" sx={{ color: MUTED, fontSize: 12, ml: 1 }}>{o.codigo}</Typography>
              </Box>
              <Typography component="span" sx={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>
                Costo {fmtMoney(o.costo)} · Venta {fmtMoney(o.precioFinal)}
              </Typography>
            </Box>
          )}
          filterOptions={(options, { inputValue }) => {
            const q = inputValue.trim().toLowerCase();
            return q
              ? options.filter(o => o.nombre.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q))
              : options;
          }}
          noOptionsText="No hay productos disponibles"
        />
        <TextField type="number" size="small" value={cantidad} onChange={e => setCantidad(e.target.value)}
          inputProps={{ min: 1 }} sx={{ ...fieldSx, width: 90, flexShrink: 0 }} />
        <IconButton onClick={agregar} disabled={!seleccion}
          sx={{ bgcolor: P, color: '#fff', borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.4, color: '#fff' } }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {value.length === 0 ? (
        <Typography sx={{ color: MUTED, fontSize: 13 }}>Agregá al menos un producto que compone este combo.</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {value.map(c => {
              const prod = productos.find(p => p.id === c.id_producto);
              const costoLinea  = (prod?.costo ?? 0) * c.cantidad;
              const ventaLinea  = (prod?.precioFinal ?? 0) * c.cantidad;
              return (
                <Box key={c.id_producto} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 14 }} noWrap>{c.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>
                      Costo {fmtMoney(costoLinea)} · Venta {fmtMoney(ventaLinea)} {c.cantidad > 1 && `(${c.cantidad} × ${fmtMoney(prod?.precioFinal ?? 0)})`}
                    </Typography>
                  </Box>
                  <TextField type="number" size="small" value={c.cantidad} onChange={e => cambiarCantidad(c.id_producto, e.target.value)}
                    inputProps={{ min: 1 }} sx={{ ...fieldSx, width: 80, flexShrink: 0 }} />
                  <IconButton size="small" onClick={() => quitar(c.id_producto)} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: ERROR } }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>

          {/* Referencia para decidir el precio del combo: cuánto sale armarlo vs.
              cuánto costarían los componentes comprados por separado. */}
          {(() => {
            const costoTotal = value.reduce((s, c) => s + (productos.find(p => p.id === c.id_producto)?.costo ?? 0) * c.cantidad, 0);
            const ventaTotal = value.reduce((s, c) => s + (productos.find(p => p.id === c.id_producto)?.precioFinal ?? 0) * c.cantidad, 0);
            return (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1.5, px: 1.5, py: 1, bgcolor: `${P}0c`, border: `1px solid ${P}30`, borderRadius: '8px' }}>
                <Typography sx={{ color: INK2, fontSize: 12.5 }}>
                  Costo total de componentes: <Box component="span" sx={{ color: INK, fontWeight: 700 }}>{fmtMoney(costoTotal)}</Box>
                </Typography>
                <Typography sx={{ color: INK2, fontSize: 12.5, textAlign: 'right' }}>
                  Suma de precios de venta: <Box component="span" sx={{ color: INK, fontWeight: 700 }}>{fmtMoney(ventaTotal)}</Box>
                </Typography>
              </Box>
            );
          })()}
        </>
      )}
    </Box>
  );
}

// Bloque de foto reutilizado tanto en el formulario de edición como en el
// paso posterior a crear un producto (subir/generar imagen necesita que el
// producto ya exista en el backend, así que no puede estar en el form de alta).
function BloqueImagenProducto({ nombre, imagenUrl, loading, inputRef, onSubir, onGenerar, onEliminar, onComponerDesdeComponentes }) {
  const { tieneCatalogo, tieneIA } = usePlan();
  const cameraInputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Pegar con Ctrl+V: solo mientras este bloque está montado (un modal a la
  // vez), así no compite con otros inputs de la página.
  useEffect(() => {
    const handlePaste = (e) => {
      if (loading || !tieneCatalogo) return;
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) onSubir(file);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [loading, tieneCatalogo, onSubir]);

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (loading || !tieneCatalogo) return;
    const file = Array.from(e.dataTransfer.files ?? []).find(f => f.type.startsWith('image/'));
    if (file) onSubir(file);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box
        onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
      >
        {imagenUrl ? (
          <Box component="img" src={imagenUrl} alt={nombre}
            sx={{ width: 96, height: 96, borderRadius: '12px', objectFit: 'cover', border: `1px solid ${arrastrando ? P : BORDER}`, flexShrink: 0 }} />
        ) : (
          <Box sx={{
            width: 96, height: 96, borderRadius: '12px', bgcolor: arrastrando ? `${P}0f` : HOVER,
            border: `1px dashed ${arrastrando ? P : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Inventory2Icon sx={{ color: arrastrando ? P : MUTED, fontSize: 28, opacity: 0.5 }} />
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onSubir(f); }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onSubir(f); }} />
          <Tooltip title={tieneCatalogo ? '' : 'Disponible desde el plan Pro'}>
            <span>
              <Button size="small" variant="outlined" startIcon={<FileUploadIcon sx={{ fontSize: 16 }} />} disabled={loading || !tieneCatalogo}
                onClick={() => inputRef.current?.click()}
                sx={{ borderColor: BORDER, color: INK2, textTransform: 'none', '&:hover': { borderColor: P, bgcolor: `${P}0a` } }}>
                Subir foto
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={tieneCatalogo ? '' : 'Disponible desde el plan Pro'}>
            <span>
              <Button size="small" variant="outlined" startIcon={<CameraAltIcon sx={{ fontSize: 16 }} />} disabled={loading || !tieneCatalogo}
                onClick={() => cameraInputRef.current?.click()}
                sx={{ borderColor: BORDER, color: INK2, textTransform: 'none', '&:hover': { borderColor: P, bgcolor: `${P}0a` } }}>
                Tomar foto
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={tieneIA ? '' : 'Disponible en el plan IA'}>
            <span>
              <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} disabled={loading || !tieneIA}
                onClick={onGenerar}
                sx={{ borderColor: `${P}40`, color: P, textTransform: 'none', '&:hover': { borderColor: P, bgcolor: `${P}0a` } }}>
                Generar con IA
              </Button>
            </span>
          </Tooltip>
          {onComponerDesdeComponentes && (
            <Tooltip title={tieneIA ? '' : 'Disponible en el plan IA'}>
              <span>
                <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} disabled={loading || !tieneIA}
                  onClick={onComponerDesdeComponentes}
                  sx={{ borderColor: `${P}40`, color: P, textTransform: 'none', '&:hover': { borderColor: P, bgcolor: `${P}0a` } }}>
                  Componer con fotos de los productos
                </Button>
              </span>
            </Tooltip>
          )}
          {imagenUrl && (
            <Button size="small" variant="text" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />} disabled={loading}
              onClick={onEliminar}
              sx={{ color: MUTED, textTransform: 'none', '&:hover': { color: ERROR } }}>
              Quitar
            </Button>
          )}
        </Box>
        <Typography sx={{ color: MUTED, fontSize: 11.5 }}>
          Se usa en el catálogo online. JPG, PNG o WEBP, hasta 4MB. También podés arrastrar una imagen o pegarla con Ctrl+V.
        </Typography>
      </Box>
    </Box>
  );
}

/* ──────────────────────────────────────────────
   FORMULARIO: Nuevo Producto
────────────────────────────────────────────── */
// Arma el form de edición a partir de un producto existente. El precio sin IVA
// se reconstruye a partir del precio final con el 21% por defecto (el backend
// solo guarda el precio final, no desglosa el IVA) — el usuario puede ajustar
// el IVA/margen si no corresponde y la cadena se recalcula igual que al crear.
function formDesdeProducto(producto) {
  const round2 = (n) => Math.round(n * 100) / 100;
  const precioFinal = Number(producto.precioFinal ?? 0);
  const costo       = Number(producto.costo ?? 0);
  const precioSinIva = precioFinal ? round2(precioFinal / 1.21) : 0;
  return {
    nombre: producto.nombre || '', codigo: producto.codigo || '', descripcion: '',
    categoria: producto.categoria || '', proveedor: producto.id_proveedor ? String(producto.id_proveedor) : '',
    unidadMedida: producto.unidadMedida || 'unidad', activo: producto.activo ?? true,
    stock: String(producto.stock ?? 0), alertaStock: String(producto.alerta ?? 5),
    fechaVencimiento: producto.fechaVencimiento || '',
    iva: '21', costo: String(costo), margen: costo ? String(round2(((precioSinIva / costo) - 1) * 100)) : '0',
    precioSinIva: String(precioSinIva), precioFinal: String(precioFinal),
    tieneVariantes: producto.tieneVariantes ?? false, idGrupoTalle: producto.idGrupoTalle ? String(producto.idGrupoTalle) : '',
    idTalle: producto.idTalle ? String(producto.idTalle) : '',
  };
}

export function NuevoProducto({ onVolver, categorias, setCategorias, onCrear, onGuardar, proveedores = [], setProveedores, onCreado, initialNombre = '', producto = null, subirImagen, eliminarImagen, generarImagenIa, grupos = [], onAbrirGrupos, onGrupoCreado, onTallesChange }) {
  const toast = useToast();
  const { tieneIA } = usePlan();
  const { user } = useAuth();
  // Vender por peso/longitud (kg, metro, litro) es solo para ferretería — para
  // cualquier otro rubro el selector ni se muestra y todo sigue en 'unidad'.
  const esFerreteria = user?.empresa?.tipo === 'ferret';
  // Variantes por talle son solo para indumentaria, y nunca para un producto
  // que ya es en sí mismo una variante (no hay variantes de variantes).
  const esIndumentaria = user?.empresa?.tipo === 'indument' && !producto?.idProductoPadre;
  const isEdit = !!producto;
  const [modalCat, setModalCat] = useState(false);
  const [modalProv, setModalProv] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagenUrl, setImagenUrl] = useState(producto?.imagenUrl || null);
  const [imagenLoading, setImagenLoading] = useState(false);
  const imagenInputRef = useRef(null);
  // Una vez creado el producto (modo alta), guardamos acá la respuesta para
  // habilitar el bloque de foto sin tener que cerrar y volver a abrir el modal.
  const [creado, setCreado] = useState(null);
  const idProductoActual = producto?.id ?? creado?.id;
  const [form, setForm] = useState(() => isEdit ? formDesdeProducto(producto) : {
    nombre: initialNombre, codigo: '', descripcion: '',
    categoria: '', proveedor: '', unidadMedida: 'unidad',
    activo: true, stock: '0', alertaStock: '5',
    fechaVencimiento: '', iva: '21', costo: '0.00', margen: '0',
    precioSinIva: '0.00', precioFinal: '0.00',
    tieneVariantes: false, idGrupoTalle: '', idTalle: '',
  });
  const [openScanner, setOpenScanner] = useState(false);
  // Talles de todos los grupos, aplanados para el selector de "talle único" —
  // a diferencia del selector de grupo (que genera N variantes), acá se elige
  // un talle puntual y fijo para un producto que no tiene variantes.
  const talles = useMemo(() => grupos.flatMap(g => g.talles.map(t => ({ ...t, grupoNombre: g.nombre }))), [grupos]);

  // Alta de un grupo de talles nuevo sin salir del formulario — el grupo se
  // crea de una (vacío) apenas se confirma el nombre, y de ahí en más se le
  // cargan talles con el mismo TallesEditor que usa la gestión de grupos.
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState('');
  const [creandoGrupoLoading, setCreandoGrupoLoading] = useState(false);
  const grupoActivo = useMemo(() => grupos.find(g => g.id === Number(form.idGrupoTalle)) || null, [grupos, form.idGrupoTalle]);

  const crearGrupoInline = async () => {
    if (!nombreNuevoGrupo.trim()) return;
    setCreandoGrupoLoading(true);
    try {
      const nuevo = await gruposTallesService.create(nombreNuevoGrupo.trim());
      onGrupoCreado?.(nuevo);
      setForm(f => ({ ...f, idGrupoTalle: String(nuevo.id) }));
      setErrors(prev => { const next = { ...prev }; delete next.idGrupoTalle; return next; });
      setNombreNuevoGrupo('');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear el grupo', 'error');
    } finally {
      setCreandoGrupoLoading(false);
    }
  };

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const round2 = (n) => Math.round(n * 100) / 100;

  // Costo, Margen%, Precio sin IVA, IVA% y Precio final forman una cadena:
  // Costo + Margen → Precio sin IVA → (+ IVA) → Precio final. Tocar cualquier
  // campo recalcula los que dependen de él, y editar uno "de salida" (precio
  // sin IVA o precio final) recalcula el margen/precio hacia atrás en vez de
  // dejar que se desincronicen.
  const setCosto = (e) => {
    const costo = e.target.value;
    setForm(f => {
      const c = Number(costo) || 0;
      const sinIva = c ? round2(c * (1 + (Number(f.margen) || 0) / 100)) : Number(f.precioSinIva) || 0;
      const final = round2(sinIva * (1 + (Number(f.iva) || 0) / 100));
      return { ...f, costo, precioSinIva: c ? String(sinIva) : f.precioSinIva, precioFinal: c ? String(final) : f.precioFinal };
    });
    setErrors(prev => { const next = { ...prev }; delete next.costo; return next; });
  };

  const setMargen = (e) => {
    const margen = e.target.value;
    setForm(f => {
      const c = Number(f.costo) || 0;
      const sinIva = c ? round2(c * (1 + (Number(margen) || 0) / 100)) : Number(f.precioSinIva) || 0;
      const final = round2(sinIva * (1 + (Number(f.iva) || 0) / 100));
      return { ...f, margen, precioSinIva: c ? String(sinIva) : f.precioSinIva, precioFinal: c ? String(final) : f.precioFinal };
    });
  };

  const setIva = (e) => {
    const iva = e.target.value;
    setForm(f => {
      const sinIva = Number(f.precioSinIva) || 0;
      return { ...f, iva, precioFinal: sinIva ? String(round2(sinIva * (1 + (Number(iva) || 0) / 100))) : f.precioFinal };
    });
    setErrors(prev => { const next = { ...prev }; delete next.iva; return next; });
  };

  const setPrecioSinIva = (e) => {
    const precioSinIva = e.target.value;
    setForm(f => {
      const c = Number(f.costo) || 0;
      const sinIva = Number(precioSinIva) || 0;
      return {
        ...f, precioSinIva,
        margen: c ? String(round2(((sinIva / c) - 1) * 100)) : f.margen,
        precioFinal: precioSinIva ? String(round2(sinIva * (1 + (Number(f.iva) || 0) / 100))) : f.precioFinal,
      };
    });
    setErrors(prev => { const next = { ...prev }; delete next.precioSinIva; return next; });
  };

  const setPrecioFinal = (e) => {
    const precioFinal = e.target.value;
    setForm(f => {
      const iva = Number(f.iva) || 0;
      const c = Number(f.costo) || 0;
      const sinIva = precioFinal ? round2(Number(precioFinal) / (1 + iva / 100)) : Number(f.precioSinIva) || 0;
      return {
        ...f, precioFinal,
        precioSinIva: precioFinal ? String(sinIva) : f.precioSinIva,
        margen: c ? String(round2(((sinIva / c) - 1) * 100)) : f.margen,
      };
    });
    setErrors(prev => { const next = { ...prev }; delete next.precioFinal; return next; });
  };

  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    const errs = {};
    if (!form.nombre.trim())            errs.nombre    = 'El nombre es requerido';
    if (!isEdit && !form.codigo.trim()) errs.codigo    = 'El código es requerido';
    if (!form.categoria)                errs.categoria = 'La categoría es requerida';
    if (esIndumentaria && form.tieneVariantes && !form.idGrupoTalle) errs.idGrupoTalle = 'Elegí un grupo de talles';
    if (Object.keys(errs).length > 0) { setErrors(errs); toast('Completá los campos requeridos', 'error'); return; }

    const cat = categorias.find(c => c.nombre === form.categoria);
    if (!cat) { setErrors({ categoria: 'Categoría no encontrada' }); return; }

    setSaving(true);
    try {
      const payload = {
        producto:          form.nombre.trim(),
        codigo:            form.codigo.trim(),
        precio:            Number(form.precioFinal) || 0,
        costo:             Number(form.costo) || 0,
        stock_minimo:      Number(form.alertaStock) || 5,
        estado:            form.activo,
        id_categoria:      cat.id,
        // Solo relevante (y solo se manda algo distinto de 'unidad') si el
        // selector de abajo está visible, y eso ya está gateado por rubro.
        unidad_medida:     esFerreteria ? form.unidadMedida : 'unidad',
        // Idem para variantes por talle: solo indumentaria ve el selector, así
        // que para cualquier otro rubro esto siempre queda en false/null.
        tiene_variantes:   esIndumentaria ? form.tieneVariantes : false,
        id_grupo_talle:    esIndumentaria && form.tieneVariantes && form.idGrupoTalle ? Number(form.idGrupoTalle) : null,
        // Talle único: solo tiene sentido si NO genera variantes (son dos formas
        // mutuamente excluyentes de asociar talles a un producto).
        id_talle:          esIndumentaria && !form.tieneVariantes && form.idTalle ? Number(form.idTalle) : null,
        fecha_vencimiento: form.fechaVencimiento || null,
        // Al crear, sin proveedor simplemente no se manda la clave. Al editar
        // hay que mandar explícitamente null para poder DESASIGNAR un proveedor
        // que ya tenía — omitir la clave ahí dejaría el valor anterior intacto.
        ...(form.proveedor ? { id_proveedor: Number(form.proveedor) } : (isEdit ? { id_proveedor: null } : {})),
      };

      if (isEdit) {
        await onGuardar(producto.id, payload);
        toast('Producto actualizado', 'success');
        onVolver();
      } else {
        const nuevo = await onCrear({ ...payload, stock: Number(form.stock) || 0 });
        toast('Producto creado correctamente', 'success');
        onCreado?.(nuevo);
        if (subirImagen) {
          // No cerramos todavía: dejamos elegir una foto para el producto recién creado.
          setCreado(nuevo);
        } else {
          onVolver();
        }
      }
    } catch (e) {
      const errCodigo = e.response?.data?.errors?.codigo?.[0];
      if (errCodigo) {
        setErrors(prev => ({ ...prev, codigo: 'Este código ya existe' }));
        toast('El código ya existe. Usá uno diferente.', 'error');
      } else {
        toast(e.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el producto`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const generarCodigo = () => {
    setForm(f => ({ ...f, codigo: Math.random().toString(36).slice(2, 10).toUpperCase() }));
  };

  const handleSubirImagen = async (file) => {
    if (!file) return;
    setImagenLoading(true);
    try {
      const actualizado = await subirImagen(idProductoActual, file);
      setImagenUrl(actualizado.imagenUrl);
      toast('Imagen actualizada', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo subir la imagen', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const handleEliminarImagen = async () => {
    setImagenLoading(true);
    try {
      await eliminarImagen(idProductoActual);
      setImagenUrl(null);
      toast('Imagen eliminada', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo eliminar la imagen', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const handleGenerarImagenIa = async () => {
    setImagenLoading(true);
    try {
      const actualizado = await generarImagenIa(idProductoActual);
      setImagenUrl(actualizado.imagenUrl);
      toast('Imagen generada con IA', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo generar la imagen con IA', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const sectionCard = { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', p: { xs: 1.5, sm: 2.5 }, mb: 2.5 };
  const sectionEyebrow = { color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.75 };

  return (
    <Box sx={{ width: '100%', bgcolor: BG }}>

      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, bgcolor: CARD, borderBottom: `1px solid ${BORDER}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Inventory2Icon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25, display: { xs: 'none', sm: 'block' } }}>{isEdit ? 'Actualizá los datos, precios y stock mínimo.' : 'Datos generales, precios y stock inicial. Podrás agregarle una foto al finalizar.'}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onVolver}
          sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', flexShrink: 0, '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {creado ? (
      <>
      {/* Producto recién creado: paso opcional de foto */}
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: `${SUCCESS}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckIcon sx={{ color: SUCCESS, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>&quot;{creado.nombre}&quot; creado correctamente</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Opcional: agregale una foto para mostrarlo en el catálogo online.</Typography>
          </Box>
        </Box>
        <Box sx={sectionCard}>
          <Typography sx={sectionEyebrow}>Foto del producto</Typography>
          <BloqueImagenProducto nombre={creado.nombre} imagenUrl={imagenUrl} loading={imagenLoading}
            inputRef={imagenInputRef} onSubir={handleSubirImagen} onGenerar={handleGenerarImagenIa} onEliminar={handleEliminarImagen} />
        </Box>
      </Box>
      <Box sx={{
        flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 1.5,
        px: 3, py: 2, bgcolor: CARD, borderTop: `1px solid ${BORDER}`,
      }}>
        <Button variant="contained" onClick={onVolver}
          sx={{ bgcolor: P, fontSize: 14, fontWeight: 600, textTransform: 'none', px: 3, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: P_HOVER, boxShadow: 'none' } }}>
          Finalizar
        </Button>
      </Box>
      </>
      ) : (
      <>
      {/* Contenido */}
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>

        {/* Datos generales */}
        <Box sx={sectionCard}>
          <Typography sx={sectionEyebrow}>Datos generales</Typography>

          <Box data-tour="prod-modal-nombre" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <Box>
              <Label required>Nombre del producto</Label>
              <TextField fullWidth placeholder="Nombre del producto" value={form.nombre} onChange={set('nombre')} error={!!errors.nombre} helperText={errors.nombre} sx={fieldSx} />
            </Box>
            <Box>
              <Label required={!isEdit}>Código/SKU</Label>
              <TextField fullWidth placeholder="Código único" value={form.codigo} onChange={set('codigo')} error={!!errors.codigo} helperText={errors.codigo} sx={fieldSx}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Escanear código de barras">
                      <IconButton size="small" onClick={() => setOpenScanner(true)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                        <CameraAltIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Generar código">
                      <IconButton size="small" onClick={generarCodigo} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                        <ShuffleIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )}} />
            </Box>
          </Box>

          <Box data-tour="prod-modal-categoria" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Label required>Categoría</Label>
                <Tooltip title={tieneIA ? 'Sugerir con IA' : 'Disponible en el plan IA'}>
                  <Chip icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />} label="IA" size="small" clickable={tieneIA}
                    disabled={!tieneIA}
                    onClick={async () => {
                      if (!tieneIA || !form.nombre || form.nombre.length < 2) return;
                      try {
                        const sugerida = await iaService.sugerirCategoria(form.nombre);
                        if (sugerida) setForm(f => ({ ...f, categoria: sugerida }));
                        else toast('La IA no pudo sugerir una categoría para este producto', 'info');
                      } catch (e) {
                        toast(e.response?.data?.message || 'No se pudo obtener la sugerencia de categoría', 'error');
                      }
                    }}
                    sx={{ height: 22, fontSize: 10, fontWeight: 600, bgcolor: `${P}18`, color: P, border: `1px solid ${P}30`, '& .MuiChip-icon': { color: P, ml: 0.5 } }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <Select value={form.categoria} onChange={set('categoria')} displayEmpty sx={selectSx}
                    MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                    renderValue={(v) => v ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: categorias.find(c => c.nombre === v)?.color ?? P }} />
                        {v}
                      </Box>
                    ) : <Box sx={{ color: MUTED }}>Seleccionar categoría</Box>}>
                    {categorias.map(c => (
                      <MenuItem key={c.id} value={c.nombre} sx={{ '&:hover': { bgcolor: HOVER } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />{c.nombre}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Gestionar categorías">
                  <IconButton onClick={() => setModalCat(true)}
                    sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box>
              <Label>Proveedor</Label>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <Select value={form.proveedor} onChange={set('proveedor')} displayEmpty sx={selectSx}
                    MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                    renderValue={(v) => v ? (proveedores.find(p => p.id === Number(v))?.nombre || v) : <Box sx={{ color: MUTED }}>Sin proveedor</Box>}>
                    <MenuItem value="" sx={{ '&:hover': { bgcolor: HOVER } }}>Sin proveedor</MenuItem>
                    {proveedores.map(pv => (
                      <MenuItem key={pv.id} value={String(pv.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>{pv.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Gestionar proveedores">
                  <IconButton onClick={() => setModalProv(true)}
                    sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Label>Descripción</Label>
              <TextField fullWidth multiline rows={2} placeholder="Descripción del producto (opcional)"
                value={form.descripcion} onChange={set('descripcion')} sx={fieldSx} />
            </Box>
            <Box>
              {esFerreteria && (
                <>
                  <Label required>Unidad de medida</Label>
                  <FormControl fullWidth>
                    <Select value={form.unidadMedida} onChange={set('unidadMedida')} sx={selectSx}
                      MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                      <MenuItem value="unidad" sx={{ '&:hover': { bgcolor: HOVER } }}>Unidad</MenuItem>
                      <MenuItem value="kg" sx={{ '&:hover': { bgcolor: HOVER } }}>Kilogramo (kg)</MenuItem>
                      <MenuItem value="metro" sx={{ '&:hover': { bgcolor: HOVER } }}>Metro (m)</MenuItem>
                      <MenuItem value="litro" sx={{ '&:hover': { bgcolor: HOVER } }}>Litro (L)</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: esFerreteria ? 1.5 : 0 }}>
                <Switch checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }}>
                  {form.activo ? 'Activo' : 'Inactivo'} <Box component="span" sx={{ color: MUTED, fontWeight: 400 }}>— visible en el POS</Box>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Imagen (solo en edición — necesita un producto ya creado) */}
        {isEdit && subirImagen && (
          <Box sx={sectionCard}>
            <Typography sx={sectionEyebrow}>Foto del producto</Typography>
            <BloqueImagenProducto nombre={form.nombre} imagenUrl={imagenUrl} loading={imagenLoading}
              inputRef={imagenInputRef} onSubir={handleSubirImagen} onGenerar={handleGenerarImagenIa} onEliminar={handleEliminarImagen} />
          </Box>
        )}

        {/* Precios */}
        <Box data-tour="prod-modal-precio" sx={sectionCard}>
          <Typography sx={sectionEyebrow}>Precios</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 2 }}>
            <Box>
              <Label>Costo</Label>
              <TextField fullWidth type="number" value={form.costo} onChange={setCosto} sx={fieldSx} />
            </Box>
            <Box>
              <Label>Margen (%)</Label>
              <TextField fullWidth type="number" value={form.margen} onChange={setMargen} sx={fieldSx} />
            </Box>
            <Box>
              <Label required>IVA (%)</Label>
              <TextField fullWidth type="number" value={form.iva} onChange={setIva} sx={fieldSx} />
            </Box>
            <Box>
              <Label required>Precio sin IVA</Label>
              <TextField fullWidth type="number" value={form.precioSinIva} onChange={setPrecioSinIva} sx={fieldSx} />
            </Box>
            <Box>
              <Label required>Precio final</Label>
              <TextField fullWidth type="number" value={form.precioFinal} onChange={setPrecioFinal} sx={fieldSx} />
            </Box>
          </Box>
          <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 1.5 }}>
            Costo + Margen calculan el precio sin IVA, y ese más el IVA calculan el precio final — editar cualquiera de los tres últimos recalcula los anteriores.
          </Typography>
        </Box>

        {/* Inventario */}
        <Box sx={{ ...sectionCard, mb: 0 }}>
          <Typography sx={sectionEyebrow}>Inventario</Typography>

          {esIndumentaria && (
            <Box sx={{ mb: form.tieneVariantes ? 2.5 : 2, pb: form.tieneVariantes ? 2.5 : 0, borderBottom: form.tieneVariantes ? `1px solid ${BORDER}` : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch checked={form.tieneVariantes} disabled={isEdit && producto?.variantes?.length > 0}
                  onChange={e => setForm(f => ({ ...f, tieneVariantes: e.target.checked, idTalle: e.target.checked ? '' : f.idTalle }))}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 500 }}>
                  Vender por talle <Box component="span" sx={{ color: MUTED, fontWeight: 400 }}>— genera una variante con stock propio por cada talle</Box>
                </Typography>
              </Box>
              {form.tieneVariantes && (
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 1 }}>
                      <Label required>Grupo de talles</Label>
                      <FormControl fullWidth>
                        <Select value={form.idGrupoTalle} displayEmpty sx={selectSx}
                          onChange={(e) => {
                            if (e.target.value === '__nuevo__') { setCreandoGrupo(true); return; }
                            set('idGrupoTalle')(e);
                          }}
                          MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                          renderValue={(v) => v ? (grupos.find(g => g.id === Number(v))?.nombre || v) : <Box sx={{ color: MUTED }}>Elegir grupo</Box>}>
                          <MenuItem value="__nuevo__" sx={{ color: P, fontWeight: 600, '&:hover': { bgcolor: HOVER } }}>
                            <AddIcon sx={{ fontSize: 16, mr: 0.75 }} /> Crear nuevo grupo
                          </MenuItem>
                          {grupos.map(g => (
                            <MenuItem key={g.id} value={String(g.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>
                              {g.nombre} ({g.talles.length} talle{g.talles.length !== 1 ? 's' : ''})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Tooltip title="Gestionar grupos existentes">
                      <IconButton onClick={onAbrirGrupos}
                        sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                        <SettingsIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Collapse in={creandoGrupo}>
                    <Box sx={{ mt: 1.5, p: 1.5, border: `1px dashed ${BORDER}`, borderRadius: '10px', bgcolor: INPUT }}>
                      {!grupoActivo ? (
                        <>
                          <Label>Nombre del nuevo grupo</Label>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField fullWidth placeholder="Ej: Ropa, Calzado" size="small" value={nombreNuevoGrupo}
                              onChange={e => setNombreNuevoGrupo(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && crearGrupoInline()}
                              sx={{ ...fieldSx, flex: 1 }} />
                            <Button variant="contained" onClick={crearGrupoInline} disabled={creandoGrupoLoading}
                              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: P_HOVER } }}>
                              Crear
                            </Button>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{grupoActivo.nombre}</Typography>
                            <Button size="small" onClick={() => setCreandoGrupo(false)}
                              sx={{ color: P, textTransform: 'none', fontWeight: 700, fontSize: 12.5 }}>
                              Listo
                            </Button>
                          </Box>
                          <TallesEditor grupo={grupoActivo}
                            onTallesChange={(nuevosTalles) => onTallesChange?.(grupoActivo.id, nuevosTalles)} />
                        </>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}
              {!form.tieneVariantes && (
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Box sx={{ flex: 1 }}>
                    <Label>Talle <Box component="span" sx={{ color: MUTED, fontWeight: 400 }}>— opcional, para un producto que solo viene en una talla</Box></Label>
                    <FormControl fullWidth>
                      <Select value={form.idTalle} onChange={set('idTalle')} displayEmpty sx={selectSx}
                        MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                        renderValue={(v) => v ? (talles.find(t => t.id === Number(v))?.valor || v) : <Box sx={{ color: MUTED }}>Sin talle</Box>}>
                        <MenuItem value="" sx={{ '&:hover': { bgcolor: HOVER } }}>Sin talle</MenuItem>
                        {grupos.map(g => [
                          <ListSubheader key={`h-${g.id}`} sx={{ bgcolor: DROPDOWN, color: MUTED, lineHeight: '32px' }}>{g.nombre}</ListSubheader>,
                          ...g.talles.map(t => (
                            <MenuItem key={t.id} value={String(t.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>{t.valor}</MenuItem>
                          )),
                        ])}
                      </Select>
                    </FormControl>
                  </Box>
                  <Tooltip title="Gestionar grupos de talles">
                    <IconButton onClick={onAbrirGrupos}
                      sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                      <SettingsIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}

          {esIndumentaria && form.tieneVariantes ? (
            <Box>
              <Box sx={{ maxWidth: 220 }}>
                <Label>Vencimiento</Label>
                <TextField fullWidth type="date" value={form.fechaVencimiento} onChange={set('fechaVencimiento')}
                  sx={{ ...fieldSx, '& input': { colorScheme: 'dark' } }} />
              </Box>
              <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 1.5 }}>El stock se carga por talle, una vez creado el producto.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <Label required={!isEdit}>{isEdit ? 'Stock actual' : 'Stock inicial'}{esFerreteria && form.unidadMedida !== 'unidad' ? ` (${abrevUnidad(form.unidadMedida)})` : ''}</Label>
                <TextField fullWidth type="number" value={form.stock} onChange={set('stock')} disabled={isEdit} sx={fieldSx}
                  inputProps={esFerreteria && form.unidadMedida !== 'unidad' ? { step: '0.01' } : undefined} />
                {isEdit && <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.75 }}>Se ajusta desde Movimientos o registrando una compra.</Typography>}
              </Box>
              <Box>
                <Label>Alerta de stock{esFerreteria && form.unidadMedida !== 'unidad' ? ` (${abrevUnidad(form.unidadMedida)})` : ''}</Label>
                <TextField fullWidth type="number" value={form.alertaStock} onChange={set('alertaStock')} sx={fieldSx}
                  inputProps={esFerreteria && form.unidadMedida !== 'unidad' ? { step: '0.01' } : undefined} />
              </Box>
              <Box>
                <Label>Vencimiento</Label>
                <TextField fullWidth type="date" value={form.fechaVencimiento} onChange={set('fechaVencimiento')}
                  sx={{ ...fieldSx, '& input': { colorScheme: 'dark' } }} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer fijo */}
      <Box sx={{
        flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 1.5,
        px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, bgcolor: CARD, borderTop: `1px solid ${BORDER}`,
      }}>
        <Button data-tour="prod-modal-cancelar" onClick={onVolver}
          sx={{ color: INK2, fontSize: 14, textTransform: 'none', px: 3, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
          Cancelar
        </Button>
        <Button data-tour="prod-modal-crear" variant="contained" startIcon={<SaveIcon />} onClick={handleGuardar} disabled={saving}
          sx={{ bgcolor: P, fontSize: 14, fontWeight: 600, textTransform: 'none', px: 3, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: P_HOVER, boxShadow: 'none' }, '&.Mui-disabled': { opacity: 0.6 } }}>
          {saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Producto')}
        </Button>
      </Box>
      </>
      )}

      {/* Modal categorías */}
      <ModalCategorias open={modalCat} onClose={() => setModalCat(false)}
        categorias={categorias} setCategorias={setCategorias} />

      {/* Modal proveedores */}
      <ModalProveedores open={modalProv} onClose={() => setModalProv(false)}
        proveedores={proveedores} setProveedores={setProveedores} />

      {openScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            open={openScanner}
            onClose={() => setOpenScanner(false)}
            onScan={(code) => setForm(f => ({ ...f, codigo: code }))}
          />
        </Suspense>
      )}
    </Box>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Historial de Precios
────────────────────────────────────────────── */
function ModalHistorialPrecios({ open, onClose, producto }) {
  const isMobile = useIsMobile();
  const [historial, setHistorial] = useState(null); // null = cargando

  useEffect(() => {
    if (!open || !producto) return;
    let active = true;
    productosService.getHistorialPrecios(producto.id)
      .then(data => { if (active) setHistorial(data); })
      .catch(() => { if (active) setHistorial([]); });
    return () => { active = false; };
  }, [open, producto]);

  const loading = historial === null;

  const fmtFecha = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const variacion = (ant, nuevo) => {
    if (!ant) return null;
    const pct = ((nuevo - ant) / ant) * 100;
    return { pct: pct.toFixed(1), sube: pct >= 0 };
  };

  const COLS_HIST = '56px 1fr 1fr 0.85fr 0.85fr 64px';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Historial de Precios</Typography>
          {producto && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{producto.nombre}</Typography>}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        {loading ? (
          <Typography sx={{ color: MUTED, fontSize: 14, textAlign: 'center', py: 4 }}>Cargando historial...</Typography>
        ) : historial.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <HistoryIcon sx={{ color: MUTED, fontSize: 40, mb: 1 }} />
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Sin cambios de precio registrados</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>Los cambios futuros aparecerán aquí</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {historial.map((h) => {
              const v = variacion(h.precioAnterior, h.precioNuevo);
              return (
                <Box key={h.id} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Chip label={h.campo === 'costo' ? 'Costo' : 'Precio'} size="small"
                      sx={{ height: 18, fontSize: 10, fontWeight: 700,
                        bgcolor: h.campo === 'costo' ? `${WARNING}22` : `${P}22`, color: h.campo === 'costo' ? WARNING : P }} />
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{fmtFecha(h.fecha)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: h.usuario ? 0.5 : 0 }}>
                    <Typography sx={{ color: INK2, fontSize: 13, textDecoration: 'line-through' }}>{fmtMoney(h.precioAnterior)}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>→</Typography>
                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 700 }}>{fmtMoney(h.precioNuevo)}</Typography>
                    {v && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
                        {v.sube
                          ? <TrendingUpIcon sx={{ fontSize: 14, color: SUCCESS }} />
                          : <TrendingDownIcon sx={{ fontSize: 14, color: WARNING }} />}
                        <Typography sx={{ color: v.sube ? SUCCESS : WARNING, fontSize: 12, fontWeight: 700 }}>
                          {v.sube ? '+' : ''}{v.pct}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {h.usuario && <Typography sx={{ color: MUTED, fontSize: 12 }}>{h.usuario}</Typography>}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: COLS_HIST, gap: 1, px: 2, py: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
              {['Campo', 'Fecha', 'Usuario', 'Anterior', 'Nuevo', 'Cambio'].map(h => (
                <Typography key={h} sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Typography>
              ))}
            </Box>
            {historial.map((h) => {
              const v = variacion(h.precioAnterior, h.precioNuevo);
              return (
                <Box key={h.id} sx={{
                  display: 'grid', gridTemplateColumns: COLS_HIST, gap: 1, alignItems: 'center',
                  px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
                  '&:hover': { bgcolor: HOVER },
                }}>
                  <Chip label={h.campo === 'costo' ? 'Costo' : 'Precio'} size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 700, width: 'fit-content',
                      bgcolor: h.campo === 'costo' ? `${WARNING}22` : `${P}22`, color: h.campo === 'costo' ? WARNING : P }} />
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtFecha(h.fecha)}</Typography>
                  <Typography sx={{ color: INK2, fontSize: 12.5 }} noWrap>{h.usuario || '—'}</Typography>
                  <Typography sx={{ color: INK2, fontSize: 13, textDecoration: 'line-through' }}>{fmtMoney(h.precioAnterior)}</Typography>
                  <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700 }}>{fmtMoney(h.precioNuevo)}</Typography>
                  {v && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {v.sube
                        ? <TrendingUpIcon sx={{ fontSize: 14, color: SUCCESS }} />
                        : <TrendingDownIcon sx={{ fontSize: 14, color: WARNING }} />}
                      <Typography sx={{ color: v.sube ? SUCCESS : WARNING, fontSize: 12, fontWeight: 700 }}>
                        {v.sube ? '+' : ''}{v.pct}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Compras por proveedor (a quién se le compró
   este producto y a qué precio cada vez)
────────────────────────────────────────────── */
function ModalHistorialCompras({ open, onClose, producto }) {
  const isMobile = useIsMobile();
  const [historial, setHistorial] = useState(null); // null = cargando

  useEffect(() => {
    if (!open || !producto) return;
    let active = true;
    productosService.getHistorialCompras(producto.id)
      .then(data => { if (active) setHistorial(data); })
      .catch(() => { if (active) setHistorial([]); });
    return () => { active = false; };
  }, [open, producto]);

  const loading = historial === null;

  const COLS_COMPRAS = '1fr 1fr 0.85fr 0.7fr';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Compras por proveedor</Typography>
          {producto && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{producto.nombre}</Typography>}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        {loading ? (
          <Typography sx={{ color: MUTED, fontSize: 14, textAlign: 'center', py: 4 }}>Cargando historial...</Typography>
        ) : historial.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <HistoryIcon sx={{ color: MUTED, fontSize: 40, mb: 1 }} />
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Todavía no se compró este producto</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>Solo se cuentan las compras confirmadas</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {historial.map((h) => (
              <Box key={h.idLinea} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 700 }} noWrap>{h.proveedorNombre}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{fmtDate(h.fecha)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: INK2, fontSize: 12.5 }}>Cantidad: {h.cantidad}</Typography>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 700 }}>{fmtMoney(h.precioCompra)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: COLS_COMPRAS, px: 2, py: 1, bgcolor: HOVER, borderBottom: `1px solid ${BORDER}` }}>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Proveedor</Typography>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Cantidad</Typography>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Precio pagado</Typography>
            </Box>
            {historial.map((h, i) => (
              <Box key={h.idLinea} sx={{
                display: 'grid', gridTemplateColumns: COLS_COMPRAS, px: 2, py: 1.25, alignItems: 'center',
                borderBottom: i < historial.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }} noWrap>{h.proveedorNombre}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13 }}>{fmtDate(h.fecha)}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13, textAlign: 'right' }}>{h.cantidad}</Typography>
                <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{fmtMoney(h.precioCompra)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Detalle de Producto (solo lectura)
────────────────────────────────────────────── */
function DetalleItem({ label, value }) {
  return (
    <Box>
      <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

function ModalDetalleProducto({ open, onClose, producto, onVerHistorial, onVerHistorialCompras, productos = [], actualizarProducto }) {
  const toast = useToast();
  const [varianteADesactivar, setVarianteADesactivar] = useState(null);
  if (!producto) return null;
  const margen = producto.costo > 0 && producto.precioFinal > 0
    ? Math.round((producto.precioFinal - producto.costo) / producto.precioFinal * 100)
    : null;

  const handleDesactivarTalle = async () => {
    if (!varianteADesactivar) return;
    try {
      await actualizarProducto(varianteADesactivar.id, { estado: false });
      toast(`Talle ${varianteADesactivar.talle} descontinuado`, 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo descontinuar el talle', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {producto.imagenUrl ? (
            <Box component="img" src={producto.imagenUrl} alt={producto.nombre}
              sx={{ width: 40, height: 40, borderRadius: '12px', objectFit: 'cover', border: `1px solid ${BORDER}`, flexShrink: 0 }} />
          ) : (
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Inventory2Icon sx={{ color: P, fontSize: 20 }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }} noWrap>{producto.nombre}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>{producto.codigo}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
          <Chip label={producto.categoria} size="small"
            sx={{ bgcolor: `${producto.cColor}22`, color: producto.cColor, fontWeight: 600, fontSize: 11, border: `1px solid ${producto.cColor}44` }} />
          {producto.esCombo && (
            <Chip label="Promoción / Combo" size="small" sx={{ bgcolor: `${P}22`, color: P, fontWeight: 600, fontSize: 11, border: `1px solid ${P}44` }} />
          )}
          {producto.tieneVariantes && (
            <Chip label={`${producto.variantes.length} talles`} size="small" sx={{ bgcolor: `${P}22`, color: P, fontWeight: 600, fontSize: 11, border: `1px solid ${P}44` }} />
          )}
          {!producto.tieneVariantes && producto.talle && (
            <Chip label={`Talle ${producto.talle}`} size="small" sx={{ bgcolor: `${P}22`, color: P, fontWeight: 600, fontSize: 11, border: `1px solid ${P}44` }} />
          )}
          <Chip label={producto.activo ? 'Activo' : 'Inactivo'} size="small"
            sx={{ bgcolor: producto.activo ? `${SUCCESS}22` : `${MUTED}22`, color: producto.activo ? SUCCESS : MUTED, fontWeight: 600, fontSize: 11 }} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
          <DetalleItem label="Precio de venta" value={fmtMoney(producto.precioFinal)} />
          <DetalleItem label="Costo" value={fmtMoney(producto.costo)} />
          <DetalleItem label="Margen" value={margen !== null ? `${margen}%` : '—'} />
          <DetalleItem label="Proveedor" value={producto.proveedor || 'Sin proveedor'} />
          {!producto.esCombo && !producto.tieneVariantes && <DetalleItem label="Stock actual" value={`${producto.stock} ${abrevUnidad(producto.unidadMedida)}`} />}
          {!producto.esCombo && !producto.tieneVariantes && <DetalleItem label="Stock mínimo" value={`${producto.alerta} ${abrevUnidad(producto.unidadMedida)}`} />}
          {producto.tieneVariantes && <DetalleItem label="Stock total (todos los talles)" value={`${producto.variantes.reduce((s, v) => s + (v.stock || 0), 0)} u`} />}
          <DetalleItem label="Vencimiento" value={producto.fechaVencimiento ? fmtDate(producto.fechaVencimiento) : 'Sin vencimiento'} />
        </Box>

        {producto.tieneVariantes && producto.variantes.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Stock por talle
            </Typography>
            <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
              {[...producto.variantes].sort((a, b) => (a.ordenTalle ?? 0) - (b.ordenTalle ?? 0)).map((v, i) => (
                <Box key={v.id} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1,
                  borderBottom: i < producto.variantes.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>Talle {v.talle}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{v.codigo}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 1 }}>
                    <Typography sx={{ color: v.stock <= v.alerta ? '#f59e0b' : MUTED, fontSize: 13, fontWeight: 600 }}>
                      {v.stock} u
                    </Typography>
                    <Tooltip title="Descontinuar este talle">
                      <IconButton size="small" onClick={() => setVarianteADesactivar(v)}
                        sx={{ color: MUTED, p: '4px', '&:hover': { color: ERROR, bgcolor: `${ERROR}14` } }}>
                        <BlockIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <ConfirmDialog
          open={!!varianteADesactivar}
          onClose={() => setVarianteADesactivar(null)}
          onConfirm={handleDesactivarTalle}
          title={`¿Descontinuar el talle ${varianteADesactivar?.talle}?`}
          message="Deja de aparecer en el catálogo, el POS y el stock del producto — no se puede deshacer desde acá. Las ventas y compras ya registradas para este talle no se modifican."
          confirmLabel="Descontinuar"
        />

        {producto.esCombo && producto.componentes.length > 0 && (() => {
          const costoTotal = producto.componentes.reduce((s, c) => s + (productos.find(p => p.id === c.id_producto)?.costo ?? 0) * c.cantidad, 0);
          const ventaTotal = producto.componentes.reduce((s, c) => s + (productos.find(p => p.id === c.id_producto)?.precioFinal ?? 0) * c.cantidad, 0);
          return (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                Componentes del combo
              </Typography>
              <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                {producto.componentes.map((c, i) => {
                  const compProd = productos.find(p => p.id === c.id_producto);
                  return (
                    <Box key={c.id_producto} sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1,
                      borderBottom: i < producto.componentes.length - 1 ? `1px solid ${BORDER}` : 'none',
                    }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: INK, fontSize: 13 }} noWrap>{c.nombre}</Typography>
                        <Typography sx={{ color: MUTED, fontSize: 11.5 }}>
                          Costo {fmtMoney((compProd?.costo ?? 0) * c.cantidad)} · Venta {fmtMoney((compProd?.precioFinal ?? 0) * c.cantidad)}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: MUTED, fontSize: 13, flexShrink: 0, ml: 1 }}>x{c.cantidad}</Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1, px: 1.5, py: 1, bgcolor: `${P}0c`, border: `1px solid ${P}30`, borderRadius: '8px' }}>
                <Typography sx={{ color: INK2, fontSize: 12 }}>
                  Costo total: <Box component="span" sx={{ color: INK, fontWeight: 700 }}>{fmtMoney(costoTotal)}</Box>
                </Typography>
                <Typography sx={{ color: INK2, fontSize: 12, textAlign: 'right' }}>
                  Suma precios de venta: <Box component="span" sx={{ color: INK, fontWeight: 700 }}>{fmtMoney(ventaTotal)}</Box>
                </Typography>
              </Box>
            </Box>
          );
        })()}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button fullWidth startIcon={<HistoryIcon sx={{ fontSize: 16 }} />} onClick={onVerHistorial}
            sx={{ color: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', border: `1px solid ${BORDER}`, py: 1,
              '&:hover': { bgcolor: `${P}0c`, borderColor: P } }}>
            Ver historial de precios
          </Button>
          <Button fullWidth startIcon={<HistoryIcon sx={{ fontSize: 16 }} />} onClick={onVerHistorialCompras}
            sx={{ color: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', border: `1px solid ${BORDER}`, py: 1,
              '&:hover': { bgcolor: `${P}0c`, borderColor: P } }}>
            Ver compras por proveedor
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   DATOS DE EJEMPLO
────────────────────────────────────────────── */



/* ──────────────────────────────────────────────
   MODAL: Combo — creación y edición en un solo lugar, separado del
   alta/edición de producto normal (la mezcla anterior quedaba muy cargada).
────────────────────────────────────────────── */
function ModalCombo({ open, onClose, combo, productos, crearProducto, actualizarProducto, subirImagen, eliminarImagen, generarImagenIa, generarImagenComboIa }) {
  const toast = useToast();
  const isEdit = !!combo;
  const [openScanner, setOpenScanner] = useState(false);
  const [form, setForm] = useState({ nombre: '', codigo: '', precio: '0.00', costo: '0.00', activo: true });
  const [componentes, setComponentes] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imagenUrl, setImagenUrl] = useState(null);
  const [imagenLoading, setImagenLoading] = useState(false);
  const imagenInputRef = useRef(null);
  // Una vez creado el combo (modo alta), guardamos acá la respuesta para
  // habilitar el bloque de foto sin tener que cerrar y volver a abrir el modal.
  const [creado, setCreado] = useState(null);
  const idComboActual = combo?.id ?? creado?.id;

  useEffect(() => {
    if (!open) return;
    if (combo) {
      setForm({
        nombre: combo.nombre || '', codigo: combo.codigo || '',
        precio: combo.precioFinal ?? 0, costo: combo.costo ?? 0, activo: combo.activo ?? true,
      });
      setComponentes(combo.componentes ?? []);
      setImagenUrl(combo.imagenUrl || null);
    } else {
      setForm({ nombre: '', codigo: '', precio: '0.00', costo: '0.00', activo: true });
      setComponentes([]);
      setImagenUrl(null);
    }
    setCreado(null);
    setErrors({});
  }, [open, combo]);

  const handleSubirImagen = async (file) => {
    if (!file) return;
    setImagenLoading(true);
    try {
      const actualizado = await subirImagen(idComboActual, file);
      setImagenUrl(actualizado.imagenUrl);
      toast('Imagen actualizada', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo subir la imagen', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const handleEliminarImagen = async () => {
    setImagenLoading(true);
    try {
      await eliminarImagen(idComboActual);
      setImagenUrl(null);
      toast('Imagen eliminada', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo eliminar la imagen', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const handleGenerarImagenIa = async () => {
    setImagenLoading(true);
    try {
      const actualizado = await generarImagenIa(idComboActual);
      setImagenUrl(actualizado.imagenUrl);
      toast('Imagen generada con IA', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo generar la imagen con IA', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const handleComponerImagenCombo = async () => {
    setImagenLoading(true);
    try {
      const actualizado = await generarImagenComboIa(idComboActual);
      setImagenUrl(actualizado.imagenUrl);
      toast('Imagen compuesta con IA', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'No se pudo componer la imagen con IA', 'error');
    } finally {
      setImagenLoading(false);
    }
  };

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const setComponentesYLimpiar = (v) => {
    setComponentes(v);
    setErrors(prev => { const next = { ...prev }; delete next.componentes; return next; });
  };

  const generarCodigo = () => setForm(f => ({ ...f, codigo: Math.random().toString(36).slice(2, 10).toUpperCase() }));

  const handleGuardar = async () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!form.codigo.trim()) errs.codigo = 'El código es requerido';
    if (componentes.length === 0) errs.componentes = 'Agregá al menos un producto componente';
    if (Object.keys(errs).length) { setErrors(errs); toast('Completá los campos requeridos', 'error'); return; }

    const payload = {
      producto:     form.nombre.trim(),
      codigo:       form.codigo.trim(),
      precio:       Number(form.precio) || 0,
      costo:        Number(form.costo) || 0,
      estado:       form.activo,
      es_combo:     true,
      componentes:  componentes.map(c => ({ id_producto: c.id_producto, cantidad: c.cantidad })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await actualizarProducto(combo.id, payload);
        toast('Combo actualizado', 'success');
        onClose();
      } else {
        const nuevo = await crearProducto(payload);
        toast('Combo creado correctamente', 'success');
        if (subirImagen) {
          // No cerramos todavía: dejamos elegir una foto para el combo recién creado.
          setCreado(nuevo);
        } else {
          onClose();
        }
      }
    } catch (e) {
      const errCodigo = e.response?.data?.errors?.codigo?.[0];
      if (errCodigo) {
        setErrors(prev => ({ ...prev, codigo: 'Este código ya existe' }));
        toast('El código ya existe. Usá uno diferente.', 'error');
      } else {
        toast(e.response?.data?.message || 'No se pudo guardar el combo', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>{isEdit ? 'Editar combo' : 'Nuevo combo'}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25, display: { xs: 'none', sm: 'block' } }}>
            Se vende como un solo producto y descuenta stock de sus componentes.
            {!isEdit && ' Podrás agregarle una foto al finalizar.'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        {creado ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: `${SUCCESS}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckIcon sx={{ color: SUCCESS, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>&quot;{creado.nombre}&quot; creado correctamente</Typography>
                <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Opcional: agregale una foto para mostrarlo en el catálogo online.</Typography>
              </Box>
            </Box>
            <BloqueImagenProducto nombre={creado.nombre} imagenUrl={imagenUrl} loading={imagenLoading}
              inputRef={imagenInputRef} onSubir={handleSubirImagen} onGenerar={handleGenerarImagenIa}
              onEliminar={handleEliminarImagen} onComponerDesdeComponentes={handleComponerImagenCombo} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" onClick={onClose}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
                Finalizar
              </Button>
            </Box>
          </>
        ) : (
        <>
        {/* Nombre + Código */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <Label required>Nombre del combo</Label>
            <TextField fullWidth placeholder="Combo Familiar" value={form.nombre} onChange={set('nombre')} error={!!errors.nombre} helperText={errors.nombre} sx={fieldSx} />
          </Box>
          <Box>
            <Label required>Código/SKU</Label>
            <TextField fullWidth placeholder="Código único" value={form.codigo} onChange={set('codigo')} error={!!errors.codigo} helperText={errors.codigo} sx={fieldSx}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Escanear código de barras">
                    <IconButton size="small" onClick={() => setOpenScanner(true)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                      <CameraAltIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Generar código">
                    <IconButton size="small" onClick={generarCodigo} sx={{ color: MUTED, '&:hover': { color: INK } }}>
                      <ShuffleIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )}} />
          </Box>
        </Box>

        {/* Precio + Costo */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
          <Box>
            <Label required>Precio de venta ($)</Label>
            <TextField fullWidth type="number" value={form.precio} onChange={set('precio')} inputProps={{ min: 0 }} sx={fieldSx} />
          </Box>
          <Box>
            <Label>Costo ($, opcional)</Label>
            <TextField fullWidth type="number" value={form.costo} onChange={set('costo')} inputProps={{ min: 0 }} sx={fieldSx} />
          </Box>
        </Box>

        {/* Componentes */}
        <Box sx={{ mb: 2.5 }}>
          <Label required>Productos que componen el combo</Label>
          <ComboComponentesEditor productos={productos} value={componentes} onChange={setComponentesYLimpiar} excludeId={combo?.id} />
        </Box>

        {/* Imagen (solo en edición — necesita un combo ya creado) */}
        {isEdit && subirImagen && (
          <Box sx={{ mb: 2.5 }}>
            <Label>Foto del combo</Label>
            <BloqueImagenProducto nombre={form.nombre} imagenUrl={imagenUrl} loading={imagenLoading}
              inputRef={imagenInputRef} onSubir={handleSubirImagen} onGenerar={handleGenerarImagenIa}
              onEliminar={handleEliminarImagen} onComponerDesdeComponentes={handleComponerImagenCombo} />
          </Box>
        )}

        {/* Activo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, mt: 2 }}>
          <Switch checked={form.activo} onChange={(_, v) => setForm(f => ({ ...f, activo: v }))}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
          <Typography sx={{ color: INK, fontSize: 14 }}>{form.activo ? 'Activo' : 'Inactivo'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear combo'}
          </Button>
        </Box>
        </>
        )}
      </DialogContent>

      {openScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner open={openScanner} onClose={() => setOpenScanner(false)} onScan={(code) => setForm(f => ({ ...f, codigo: code }))} />
        </Suspense>
      )}
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   MODAL: Actualizar precios masivo
────────────────────────────────────────────── */
function ModalActualizarPrecios({ open, onClose, productos, categorias, proveedores, actualizarProducto, toast }) {
  const [tipo,               setTipo]               = useState('%');
  const [valor,              setValor]              = useState('');
  const [alcance,            setAlcance]            = useState('todos');
  const [categoria,          setCategoria]          = useState('');
  const [proveedor,          setProveedor]          = useState('');
  const [loading,            setLoading]            = useState(false);

  const targets = useMemo(() => {
    if (alcance === 'categoria' && categoria)
      return productos.filter(p => p.categoria === categoria && p.activo);
    if (alcance === 'proveedor' && proveedor)
      return productos.filter(p => p.id_proveedor === proveedor && p.activo);
    return productos.filter(p => p.activo);
  }, [alcance, categoria, proveedor, productos]);

  const preview = useMemo(() => {
    const v = parseFloat(valor);
    if (!targets.length || !v || isNaN(v)) return null;
    const sample = targets.slice(0, 3).map(p => {
      const delta = tipo === '%' ? p.precioFinal * v / 100 : v;
      const nuevo = Math.max(0, p.precioFinal + delta);
      return { nombre: p.nombre, antes: p.precioFinal, despues: Math.round(nuevo) };
    });
    return { sample, count: targets.length };
  }, [valor, tipo, targets]);

  const handleAplicar = async () => {
    const v = parseFloat(valor);
    if (!v || isNaN(v)) return;
    setLoading(true);
    let ok = 0;
    for (const p of targets) {
      const delta = tipo === '%' ? p.precioFinal * v / 100 : v;
      const nuevo = Math.round(Math.max(0, p.precioFinal + delta));
      try {
        await actualizarProducto(p.id, { precio: nuevo });
        ok++;
      } catch { /* skip */ }
    }
    setLoading(false);
    toast(`${ok} precio${ok !== 1 ? 's' : ''} actualizado${ok !== 1 ? 's' : ''}`, 'success');
    onClose();
  };

  const handleAlcance = (val) => {
    setAlcance(val);
    setCategoria('');
    setProveedor('');
  };

  const colorPrecio = (s) => s.despues > s.antes ? SUCCESS : s.despues < s.antes ? WARNING : MUTED;

  const fmtP = n => n.toLocaleString('es-AR');

  const isDisabled = !preview || loading
    || (alcance === 'categoria' && !categoria)
    || (alcance === 'proveedor' && !proveedor);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 2 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Actualizar precios</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Modificá precios en masa o por producto</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 } }}>

        {/* Alcance — primero para orientar el resto */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>Aplicar a</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: (alcance === 'categoria' || alcance === 'proveedor') ? 1.5 : 0 }}>
            {[['todos', 'Todos'], ['categoria', 'Una categoría'], ['proveedor', 'Un proveedor']].map(([val, label]) => (
              <Button key={val} onClick={() => handleAlcance(val)}
                variant={alcance === val ? 'contained' : 'outlined'}
                sx={alcance === val
                  ? { bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', py: 0.875, px: 2, '&:hover': { bgcolor: P_HOVER } }
                  : { color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', py: 0.875, px: 2, '&:hover': { borderColor: P, color: P, bgcolor: `${P}08` } }
                }>
                {label}
              </Button>
            ))}
          </Box>
          {alcance === 'categoria' && (
            <FormControl fullWidth>
              <Select value={categoria} onChange={e => setCategoria(e.target.value)} displayEmpty
                sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '11px', px: '14px' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={v => v || <Box sx={{ color: MUTED, fontSize: 14 }}>Seleccionar categoría</Box>}>
                {categorias.map(c => (
                  <MenuItem key={c.id} value={c.nombre} sx={{ fontSize: 13, '&:hover': { bgcolor: HOVER } }}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {alcance === 'proveedor' && (
            <FormControl fullWidth>
              <Select value={proveedor} onChange={e => setProveedor(e.target.value)} displayEmpty
                sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '11px', px: '14px' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={v => proveedores.find(pr => pr.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Seleccionar proveedor</Box>}>
                {proveedores.map(pr => (
                  <MenuItem key={pr.id} value={pr.id} sx={{ fontSize: 13, '&:hover': { bgcolor: HOVER } }}>{pr.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Tipo + Valor */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2, mb: 2.5 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>Tipo</Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {['%', '$'].map(t => (
                <Button key={t} onClick={() => setTipo(t)} variant={tipo === t ? 'contained' : 'outlined'}
                  sx={tipo === t
                    ? { bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 13, flex: 1, borderRadius: '8px', minWidth: 0, py: 1, '&:hover': { bgcolor: P_HOVER } }
                    : { color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, flex: 1, borderRadius: '8px', minWidth: 0, py: 1, '&:hover': { borderColor: P, color: P } }
                  }>
                  {t}
                </Button>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 1 }}>
              {tipo === '%' ? 'Valor (porcentaje, negativo para bajar)' : 'Valor (pesos, negativo para bajar)'}
            </Typography>
            <TextField fullWidth type="number"
              placeholder={tipo === '%' ? 'Ej: 10 o -10' : 'Ej: 500 o -500'}
              value={valor} onChange={e => setValor(e.target.value)}
              sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '11px', px: '14px', color: INK } }} />
          </Box>
        </Box>

        {/* Preview */}
        {preview && (
          <Box sx={{ bgcolor: `${P}0a`, border: `1px solid ${P}30`, borderRadius: '10px', p: 2, mb: 2.5 }}>
            <Typography sx={{ color: P, fontSize: 13, fontWeight: 600, mb: 1.25 }}>
              Vista previa · {preview.count} producto{preview.count !== 1 ? 's' : ''} afectado{preview.count !== 1 ? 's' : ''}
            </Typography>
            {preview.sample.map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ color: INK2, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{s.nombre}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Typography sx={{ color: MUTED, fontSize: 13, textDecoration: 'line-through' }}>${fmtP(s.antes)}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>→</Typography>
                  <Typography sx={{ color: colorPrecio(s), fontSize: 13, fontWeight: 700 }}>${fmtP(s.despues)}</Typography>
                </Box>
              </Box>
            ))}
            {preview.count > 3 && (
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>y {preview.count - 3} más...</Typography>
            )}
          </Box>
        )}

        <Button fullWidth variant="contained" disabled={isDisabled} onClick={handleAplicar}
          sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' } }}>
          {loading ? 'Actualizando...' : `Aplicar a ${preview?.count || 0} producto${(preview?.count || 0) !== 1 ? 's' : ''}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}


/* ──────────────────────────────────────────────
   PÁGINA PRINCIPAL
────────────────────────────────────────────── */
export default function Productos() {
  const isMobile = useIsMobile();
  const { productos, crearProducto, actualizarProducto, eliminarProducto, subirImagenProducto, eliminarImagenProducto, generarImagenIaProducto, generarImagenComboIaProducto } = useProductos();
  const toast = useToast();
  const { user } = useAuth();
  const esIndumentaria = user?.empresa?.tipo === 'indument';
  const { checkPermisos } = useHasPermiso();
  const { data: sucursales = [] } = useSucursales({ enabled: checkPermisos('list-sucursales') });
  const mostrarStockTotal = sucursales.length > 1;
  // Un producto con variantes no tiene stock propio (vive en cada talle) — para
  // mostrar algo útil en la lista se suma el stock de todas sus variantes.
  const stockDeFila = (p) => p.tieneVariantes ? p.variantes.reduce((s, v) => s + (v.stock || 0), 0) : p.stock;
  const [vista,           setVista]           = useState('lista');
  const [viewMode,        setViewMode]        = useState('tabla');
  const displayMode = viewMode;
  const [search,          setSearch]          = useState('');
  const [seleccionados,   setSeleccionados]   = useState([]);
  const [sortCol,         setSortCol]         = useState('reciente');
  const [sortDir,         setSortDir]         = useState('desc');
  const [pagina,          setPagina]          = useState(1);
  const [pageSize,        setPageSize]        = useState(10);
  const [categorias,      setCategorias]      = useState([]);
  const [proveedores,     setProveedores]     = useState([]);
  const [grupos,          setGrupos]          = useState([]);
  const [modalGrupos,     setModalGrupos]     = useState(false);
  const [productoEditar,  setProductoEditar]  = useState(null);
  const [openCombo,       setOpenCombo]       = useState(false);
  const [comboEditar,     setComboEditar]     = useState(null);
  const [productoElim,    setProductoElim]    = useState(null);
  const [eliminando,      setEliminando]      = useState(false);
  const [showFilters,     setShowFilters]     = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado,    setFiltroEstado]    = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroStockBajo,   setFiltroStockBajo]   = useState(false);
  const [filtroVencimiento, setFiltroVencimiento] = useState(false);
  const [filtroPromocion,   setFiltroPromocion]   = useState(false);
  const [historialProducto, setHistorialProducto] = useState(null);
  const [historialComprasProducto, setHistorialComprasProducto] = useState(null);
  const [productoDetalle,   setProductoDetalle]   = useState(null);
  const [elimSelLoading,  setElimSelLoading]  = useState(false);
  const [confirmBulkElim, setConfirmBulkElim] = useState(false);
  const [openScanner,     setOpenScanner]     = useState(false);
  const [openActualizar,  setOpenActualizar]  = useState(false);
  const [importPreview,   setImportPreview]   = useState(null);
  const [importando,      setImportando]      = useState(false);
  const csvRef = useRef(null);

  useEffect(() => {
    categoriasService.getAll().then(setCategorias).catch(() => {});
    proveedoresService.getAll().then(setProveedores).catch(() => {});
    if (esIndumentaria) {
      gruposTallesService.getAll().then(setGrupos).catch(() => {});
    }
  }, [esIndumentaria]);

  useEffect(() => {
    registerTour('/productos', [
      { element: '[data-tour="prod-buscar"]', title: 'Buscar y filtrar', description: 'Buscá por nombre o código, escaneá un código de barras, o usá Filtros para acotar por categoría, estado o stock bajo.' },
      { element: '[data-tour="prod-opciones"]', title: 'Acciones rápidas', description: 'Actualizá precios masivamente, creá una promoción o agregá un nuevo producto — todo desde acá.' },
      { element: '[data-tour="prod-tabla"]', title: 'Lista de productos', description: 'Todos tus productos con su stock, precio y estado. Cambiá entre vista de tabla o de tarjetas con los íconos de arriba.' },
      { element: '[data-tour="prod-acciones"]', title: 'Acciones de la fila', description: 'El reloj muestra el historial de precios. El lápiz abre el producto para editarlo. El tacho lo elimina.', optional: true },
      { element: '[data-tour="prod-nueva"]', title: 'Nuevo producto', description: 'Vamos a ver el formulario completo para dar de alta un producto. Hacé clic en "Siguiente".', click: true, clickDelay: 300 },
      { element: '[data-tour="prod-modal-nombre"]', title: 'Nombre y código', description: 'El código tiene que ser único. Podés escanearlo con la cámara o generar uno aleatorio con el ícono de al lado.' },
      { element: '[data-tour="prod-modal-categoria"]', title: 'Categoría y proveedor', description: 'Elegí una categoría existente o creá una nueva con el ícono de ajustes. También podés pedirle a la IA que sugiera la categoría según el nombre.' },
      { element: '[data-tour="prod-modal-precio"]', title: 'Precios', description: 'Cargá el costo y el margen deseado, y el precio sin IVA y el precio final se calculan solos (también podés editarlos directo).' },
      { element: '[data-tour="prod-modal-crear"]', title: 'Crear producto', description: 'Guardá el producto con los datos cargados.' },
      { element: '[data-tour="prod-modal-cancelar"]', title: 'Listo', description: 'Volvemos a la lista de productos sin guardar este ejemplo.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const exportarCSVProductos = (rows) => {
    exportarExcel({
      filename: 'productos.xlsx',
      sheetName: 'Productos',
      subtitle: `Listado de productos · ${new Date().toLocaleDateString('es-AR')}`,
      columns: [
        { header: 'Nombre',    width: 32 },
        { header: 'Código',    width: 16 },
        { header: 'Categoría', width: 18 },
        { header: 'Precio',    width: 14, numFmt: '"$" #,##0.00', align: 'right' },
        { header: 'Costo',     width: 14, numFmt: '"$" #,##0.00', align: 'right' },
        { header: 'Stock',     width: 10, align: 'center' },
        ...(mostrarStockTotal ? [{ header: 'Stock total', width: 12, align: 'center' }] : []),
        { header: 'Proveedor', width: 22 },
        { header: 'Estado',    width: 12 },
      ],
      rows: rows.map(p => [
        p.nombre, p.codigo, p.categoria,
        p.precioFinal, p.costo || null, p.stock,
        ...(mostrarStockTotal ? [p.stockTotal] : []),
        p.proveedor || '', p.activo ? 'Activo' : 'Inactivo',
      ]),
    });
  };

  // Solo parsea el archivo y arma la vista previa — la creación real de
  // productos pasa recién en confirmarImportacion(), cuando el usuario
  // revisó la lista y confirma (ver bug de antes: se creaban productos
  // basura del título/subtítulo del propio archivo exportado sin que nadie
  // llegara a verlo antes).
  const handleImportarCSV = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let lines;
    try {
      lines = await leerFilasArchivo(file);
    } catch {
      toast('No se pudo leer el archivo. Asegurate de que sea un .csv o .xlsx válido.', 'error');
      return;
    }
    if (lines.length < 2) { toast('El archivo está vacío o no tiene datos', 'warning'); return; }
    // El propio "Exportar Excel" antepone título + subtítulo + fila en
    // blanco antes del encabezado real de columnas — hay que saltarlos.
    const inicio = indiceEncabezado(lines);
    const header = lines[inicio].map(c => String(c || '').replace(/^"|"$/g, '').toLowerCase().trim());
    const findCol = (...terms) => header.findIndex(c => terms.some(t => c.includes(t)));
    // Exacta (no substring) para no confundir la columna "Grupo de talles" con
    // la columna "Talle" — con includes() cualquiera de las dos matchearía a
    // ambas, porque una contiene la palabra de la otra.
    const findColExacto = (...terms) => header.findIndex(c => terms.includes(c.trim()));
    const colNombre = findCol('nombre') !== -1 ? findCol('nombre') : 0;
    const colCodigo = findCol('codigo', 'código', 'sku');
    const colPrecio = findCol('precio') !== -1 ? findCol('precio') : 2;
    const colCosto  = findCol('costo');
    const colStock  = findCol('stock');
    const colCat    = findCol('categoria', 'categoría');
    // Solo indumentaria: "Grupo de talles" genera todas las variantes de ese
    // grupo (igual que el selector del alta manual); "Talle" solo (sin grupo)
    // asigna un talle fijo y propio, sin generar nada.
    const colGrupoTalle = esIndumentaria ? findColExacto('grupo de talles', 'grupo') : -1;
    const colTalle      = esIndumentaria ? findColExacto('talle') : -1;

    const filas = [];
    for (let i = inicio + 1; i < lines.length; i++) {
      const cols = lines[i];
      const nombre = cols[colNombre];
      if (!nombre) continue;
      const codigo = colCodigo >= 0 ? (cols[colCodigo] || '') : '';
      const catNombre = colCat >= 0 ? (cols[colCat] || '') : '';
      const catId = catNombre ? categorias.find(c => c.nombre.toLowerCase() === catNombre.toLowerCase())?.id : undefined;
      const grupoNombre = colGrupoTalle >= 0 ? (cols[colGrupoTalle] || '').trim() : '';
      const grupo = grupoNombre ? grupos.find(g => g.nombre.toLowerCase() === grupoNombre.toLowerCase()) : null;
      const talleValor = !grupo && colTalle >= 0 ? (cols[colTalle] || '').trim() : '';
      const talle = talleValor ? grupos.flatMap(g => g.talles).find(t => t.valor.toLowerCase() === talleValor.toLowerCase()) : null;
      filas.push({
        nombre,
        codigo,
        precio: colPrecio >= 0 ? Number(cols[colPrecio]) || 0 : 0,
        costo: colCosto >= 0 ? Number(cols[colCosto]) || 0 : undefined,
        stock: colStock >= 0 ? Number(cols[colStock]) || 0 : 0,
        catNombre,
        catId,
        grupo,
        talle,
        codigoDuplicado: codigo ? productos.some(p => p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase()) : false,
      });
    }
    if (!filas.length) { toast('No se encontraron productos válidos en el archivo', 'warning'); return; }
    setImportPreview(filas);
  };

  const confirmarImportacion = async () => {
    if (!importPreview) return;
    setImportando(true);
    let ok = 0, fallas = 0;
    for (const f of importPreview) {
      try {
        await crearProducto({
          producto: f.nombre,
          codigo: f.codigo || undefined,
          precio: f.precio,
          costo: f.costo,
          stock: f.stock,
          id_categoria: f.catId,
          ...(f.grupo ? { tiene_variantes: true, id_grupo_talle: f.grupo.id } : {}),
          ...(f.talle ? { id_talle: f.talle.id } : {}),
        });
        ok++;
      } catch { fallas++; }
    }
    setImportando(false);
    setImportPreview(null);
    toast(`${ok} producto${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''}${fallas ? ` · ${fallas} fallaron` : ''}`, ok > 0 ? 'success' : 'error');
  };

  const handleEliminarSeleccionados = async () => {
    if (!seleccionados.length) return;
    setElimSelLoading(true);
    let ok = 0;
    for (const id of seleccionados) {
      try { await eliminarProducto(id); ok++; } catch { /* ignore linked */ }
    }
    setSeleccionados([]);
    setElimSelLoading(false);
    toast(`${ok} producto${ok !== 1 ? 's' : ''} eliminado${ok !== 1 ? 's' : ''}`, 'success');
  };

  const handleEliminar = async () => {
    if (!productoElim) return;
    setEliminando(true);
    try {
      await eliminarProducto(productoElim.id);
      toast(`"${productoElim.nombre}" eliminado`, 'success');
      setProductoElim(null);
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar (tiene ventas asociadas)', 'error');
    } finally {
      setEliminando(false);
    }
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPagina(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...productos];
    if (q) list = list.filter(r => (r.nombre || '').toLowerCase().includes(q) || (r.codigo || '').toLowerCase().includes(q));
    if (filtroCategoria) list = list.filter(r => r.categoria === filtroCategoria);
    if (filtroEstado === 'activo')   list = list.filter(r => r.activo);
    if (filtroEstado === 'inactivo') list = list.filter(r => !r.activo);
    if (filtroProveedor) list = list.filter(r => String(r.id_proveedor) === filtroProveedor);
    if (filtroStockBajo) list = list.filter(r => r.stock <= (r.alerta ?? 5));
    if (filtroVencimiento) {
      const limit = new Date(); limit.setDate(limit.getDate() + 30);
      list = list.filter(r => {
        if (!r.fechaVencimiento) return false;
        return new Date(r.fechaVencimiento) <= limit;
      });
    }
    if (filtroPromocion) list = list.filter(r => r.esCombo);
    list.sort((a, b) => {
      const va = sortCol === 'stock' ? a.stock : sortCol === 'stockTotal' ? a.stockTotal : sortCol === 'precioFinal' ? a.precioFinal : sortCol === 'reciente' ? a.id : (a.nombre || '').toLowerCase();
      const vb = sortCol === 'stock' ? b.stock : sortCol === 'stockTotal' ? b.stockTotal : sortCol === 'precioFinal' ? b.precioFinal : sortCol === 'reciente' ? b.id : (b.nombre || '').toLowerCase();
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return list;
  }, [productos, search, filtroCategoria, filtroEstado, filtroProveedor, filtroStockBajo, filtroVencimiento, filtroPromocion, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged      = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);

  const todosOk  = paged.length > 0 && paged.every(r => seleccionados.includes(r.id));
  const algunoOk = paged.some(r => seleccionados.includes(r.id));

  const toggleTodos = () => {
    if (todosOk) setSeleccionados(s => s.filter(id => !paged.find(r => r.id === id)));
    else setSeleccionados(s => [...new Set([...s, ...paged.map(r => r.id)])]);
  };

  const colTh = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', userSelect: 'none' };
  const COLS = mostrarStockTotal
    ? '44px repeat(7, minmax(0, 1fr)) 130px 112px'
    : '44px repeat(6, minmax(0, 1fr)) 130px 112px';

  const swSx = {
    '& .MuiSwitch-switchBase.Mui-checked': { color: P },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P },
    '& .MuiSwitch-track': { bgcolor: BORDER },
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      {/* Modal Actualizar Precios */}
      {esIndumentaria && (
        <ModalGruposTalles open={modalGrupos} onClose={() => setModalGrupos(false)}
          grupos={grupos} setGrupos={setGrupos} />
      )}

      <ModalActualizarPrecios
        open={openActualizar} onClose={() => setOpenActualizar(false)}
        productos={productos} categorias={categorias} proveedores={proveedores}
        actualizarProducto={actualizarProducto} toast={toast}
      />

      {/* Modal Nuevo Producto — mismo diseño y tamaño que el modal de Combo */}
      <Dialog
        open={vista === 'nuevo'}
        onClose={() => setVista('lista')}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalPaperSx }}
      >
        <NuevoProducto onVolver={() => setVista('lista')} categorias={categorias} setCategorias={setCategorias} onCrear={crearProducto} proveedores={proveedores} setProveedores={setProveedores}
          subirImagen={subirImagenProducto} eliminarImagen={eliminarImagenProducto} generarImagenIa={generarImagenIaProducto}
          grupos={grupos} onAbrirGrupos={() => setModalGrupos(true)}
          onGrupoCreado={(g) => setGrupos(prev => [...prev, g])}
          onTallesChange={(grupoId, talles) => setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, talles } : g))} />
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Productos</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{productos.length} productos en inventario</Typography>
        </Box>
        <Box data-tour="prod-opciones" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Actualizar precios">
            <Button variant="outlined" startIcon={<TrendingUpIcon sx={{ fontSize: 15 }} />} onClick={() => setOpenActualizar(true)}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Actualizar precios</Box>
            </Button>
          </Tooltip>
          <Tooltip title="Promoción">
            <Button variant="outlined" startIcon={<Inventory2Icon sx={{ fontSize: 15 }} />} onClick={() => setOpenCombo(true)}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Promoción</Box>
            </Button>
          </Tooltip>
          {esIndumentaria && (
            <Tooltip title="Grupos de talles">
              <Button variant="outlined" startIcon={<CheckroomIcon sx={{ fontSize: 15 }} />} onClick={() => setModalGrupos(true)}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, fontWeight: 600, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Talles</Box>
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Nuevo Producto">
            <Button data-tour="prod-nueva" variant="contained" startIcon={<AddIcon />} onClick={() => setVista('nuevo')}
              sx={{ bgcolor: P, textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nuevo Producto</Box>
            </Button>
          </Tooltip>
          <AyudaButton />
        </Box>
      </Box>

      {/* Buscador */}
      <Box data-tour="prod-buscar" sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField placeholder="Buscar por nombre o código..." value={search}
          onChange={e => { setSearch(e.target.value); setPagina(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200, ...fieldSx, '& .MuiInputBase-input': { py: '13px', px: '14px' } }} />
        <Tooltip title="Escanear código de barras">
          <IconButton onClick={() => setOpenScanner(true)}
            sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', px: 1.5, color: MUTED, '&:hover': { color: P, bgcolor: `${P}14`, borderColor: P } }}>
            <CameraAltIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
        <Button variant="outlined" startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(v => !v)}
          sx={{ color: showFilters ? P : INK2, borderColor: showFilters ? P : BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5, whiteSpace: 'nowrap', '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
          Filtros{(filtroCategoria || filtroEstado || filtroProveedor || filtroStockBajo || filtroVencimiento || filtroPromocion) ? ' •' : ''}
        </Button>
      </Box>

      {/* Panel de filtros */}
      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
          <FormControl sx={{ minWidth: 190 }}>
            <Select
              value={sortCol === 'nombre' && sortDir === 'asc' ? 'alfabetico' : sortCol === 'reciente' && sortDir === 'asc' ? 'antiguos' : 'recientes'}
              onChange={e => {
                const v = e.target.value;
                if (v === 'alfabetico') { setSortCol('nombre'); setSortDir('asc'); }
                else if (v === 'antiguos') { setSortCol('reciente'); setSortDir('asc'); }
                else { setSortCol('reciente'); setSortDir('desc'); }
              }}
              sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="recientes" sx={{ '&:hover': { bgcolor: HOVER } }}>Más recientes primero</MenuItem>
              <MenuItem value="antiguos" sx={{ '&:hover': { bgcolor: HOVER } }}>Menos recientes primero</MenuItem>
              <MenuItem value="alfabetico" sx={{ '&:hover': { bgcolor: HOVER } }}>Alfabético (A-Z)</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <Select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1); }} displayEmpty
              sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="">Todas las categorías</MenuItem>
              {categorias.map(c => <MenuItem key={c.id} value={c.nombre} sx={{ '&:hover': { bgcolor: HOVER } }}>{c.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <Select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} displayEmpty
              sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="activo" sx={{ '&:hover': { bgcolor: HOVER } }}>Activos</MenuItem>
              <MenuItem value="inactivo" sx={{ '&:hover': { bgcolor: HOVER } }}>Inactivos</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 170 }}>
            <Select value={filtroProveedor} onChange={e => { setFiltroProveedor(e.target.value); setPagina(1); }} displayEmpty
              sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="">Todos los proveedores</MenuItem>
              {proveedores.map(pv => <MenuItem key={pv.id} value={String(pv.id)} sx={{ '&:hover': { bgcolor: HOVER } }}>{pv.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <Button
            onClick={() => { setFiltroStockBajo(v => !v); setPagina(1); }}
            variant={filtroStockBajo ? 'contained' : 'outlined'}
            sx={{ fontSize: 13, textTransform: 'none', borderRadius: '8px', py: '8px', px: 2,
              ...(filtroStockBajo ? { bgcolor: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b66', '&:hover': { bgcolor: '#f59e0b33' } }
                : { color: INK2, borderColor: BORDER, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }) }}>
            ⚠ Stock bajo
          </Button>
          <Button
            onClick={() => { setFiltroVencimiento(v => !v); setPagina(1); }}
            variant={filtroVencimiento ? 'contained' : 'outlined'}
            sx={{ fontSize: 13, textTransform: 'none', borderRadius: '8px', py: '8px', px: 2,
              ...(filtroVencimiento ? { bgcolor: '#ef444422', color: '#ef4444', border: '1px solid #ef444466', '&:hover': { bgcolor: '#ef444433' } }
                : { color: INK2, borderColor: BORDER, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }) }}>
            📅 Por vencer
          </Button>
          <Button
            onClick={() => { setFiltroPromocion(v => !v); setPagina(1); }}
            variant={filtroPromocion ? 'contained' : 'outlined'}
            sx={{ fontSize: 13, textTransform: 'none', borderRadius: '8px', py: '8px', px: 2,
              ...(filtroPromocion ? { bgcolor: `${P}22`, color: P, border: `1px solid ${P}66`, '&:hover': { bgcolor: `${P}33` } }
                : { color: INK2, borderColor: BORDER, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }) }}>
            🏷️ Promoción
          </Button>
          {(filtroCategoria || filtroEstado || filtroProveedor || filtroStockBajo || filtroVencimiento || filtroPromocion) && (
            <Button onClick={() => { setFiltroCategoria(''); setFiltroEstado(''); setFiltroProveedor(''); setFiltroStockBajo(false); setFiltroVencimiento(false); setFiltroPromocion(false); setPagina(1); }}
              sx={{ fontSize: 13, textTransform: 'none', color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '8px' }}>
              Limpiar
            </Button>
          )}
        </Box>
      </Collapse>

      {/* Card tabla */}
      <Box data-tour="prod-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>

        {/* Cabecera del card */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Productos</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>Lista de todos los productos registrados</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
              {(['tabla', 'grid']).map(mode => (
                <IconButton key={mode} size="small" onClick={() => setViewMode(mode)}
                  sx={{ borderRadius: 0, color: viewMode === mode ? P : MUTED, bgcolor: viewMode === mode ? P + '18' : 'transparent', px: 1.25, '&:hover': { bgcolor: HOVER } }}>
                  {mode === 'tabla' ? <ViewListIcon sx={{ fontSize: 17 }} /> : <GridViewIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              ))}
            </Box>
            <Tooltip title="Importar Excel o CSV">
              <Button variant="outlined" startIcon={<FileUploadIcon sx={{ fontSize: 15 }} />}
                onClick={() => csvRef.current?.click()}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Importar</Box>
              </Button>
            </Tooltip>
            <Tooltip title="Exportar Excel">
              <Button variant="outlined" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
                onClick={() => exportarCSVProductos(filtered)}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar</Box>
              </Button>
            </Tooltip>
            <Tooltip title="Eliminar seleccionados">
              <Button variant="outlined" startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
                disabled={seleccionados.length === 0 || elimSelLoading}
                onClick={() => setConfirmBulkElim(true)}
                sx={{ color: seleccionados.length ? ERROR : MUTED, borderColor: seleccionados.length ? ERROR : BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, opacity: seleccionados.length === 0 ? 0.5 : 1, '&:hover': { borderColor: seleccionados.length ? ERROR : 'var(--border-hover)', bgcolor: seleccionados.length ? ERROR_BG : HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{elimSelLoading ? 'Eliminando...' : 'Eliminar'}</Box>
                {seleccionados.length > 0 && <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{seleccionados.length}</Box>}
                {seleccionados.length > 0 && <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{` (${seleccionados.length})`}</Box>}
              </Button>
            </Tooltip>
            <Tooltip title="Descargar PDF para contar el stock físico">
              <Button
                variant="outlined"
                size="small"
                onClick={() => generarPdfInventario(filtered, user?.empresa)}
                startIcon={<InventoryIcon sx={{ fontSize: 15 }} />}
                sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontSize: 13, borderRadius: '8px', px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Inventario</Box>
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Vista Grid */}
        {displayMode === 'grid' && paged.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 3 }}>
            {paged.map(p => (
              <Box key={p.id} sx={{
                bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                '&:hover': { borderColor: P + '60', boxShadow: `0 0 0 1px ${P}30`, '& img': { transform: 'scale(1.06)' } },
                transition: 'border-color .15s, box-shadow .15s',
              }}>
                <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1', bgcolor: CARD }}>
                  {p.imagenUrl ? (
                    <Box component="img" src={p.imagenUrl} alt={p.nombre}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .35s ease' }} />
                  ) : null}
                  <Box sx={{
                    width: '100%', height: '100%', display: p.imagenUrl ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${p.cColor}14, ${p.cColor}05)`,
                  }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: `${p.cColor}1c`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Inventory2Icon sx={{ color: p.cColor, fontSize: 24, opacity: 0.75 }} />
                    </Box>
                  </Box>
                  {p.esCombo && (
                    <Chip label="Combo" size="small" sx={{
                      position: 'absolute', top: 8, right: 8, height: 20, fontSize: 10, fontWeight: 800,
                      bgcolor: P, color: '#fff', letterSpacing: '0.02em',
                    }} />
                  )}
                  {p.tieneVariantes && (
                    <Chip label={`${p.variantes.length} talle${p.variantes.length !== 1 ? 's' : ''}`} size="small" sx={{
                      position: 'absolute', top: 8, right: 8, height: 20, fontSize: 10, fontWeight: 800,
                      bgcolor: P, color: '#fff', letterSpacing: '0.02em',
                    }} />
                  )}
                  {!p.tieneVariantes && p.talle && (
                    <Chip label={`Talle ${p.talle}`} size="small" sx={{
                      position: 'absolute', top: 8, right: 8, height: 20, fontSize: 10, fontWeight: 800,
                      bgcolor: P, color: '#fff', letterSpacing: '0.02em',
                    }} />
                  )}
                  {(() => {
                    const [label, color] = getVencimientoBadge(p.fechaVencimiento);
                    if (!label) return null;
                    return (
                      <Box component="span" sx={{
                        position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, px: 0.75, py: 0.3, borderRadius: '4px',
                        bgcolor: color, color: '#fff',
                      }}>
                        {label}
                      </Box>
                    );
                  })()}
                </Box>

                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.4, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Chip label={p.categoria} size="small" sx={{ bgcolor: p.cColor + '22', color: p.cColor, fontWeight: 600, fontSize: 10.5, borderRadius: '6px', border: `1px solid ${p.cColor}44` }} />
                    <Switch checked={p.activo} size="small" onChange={() => actualizarProducto(p.id, { activo: !p.activo })}
                      sx={{ flexShrink: 0, mt: -0.5, mr: -0.5, '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P }, '& .MuiSwitch-track': { bgcolor: BORDER } }} />
                  </Box>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700, lineHeight: 1.3, mt: 0.25 }} noWrap>{p.nombre}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11.5 }}>{p.codigo}</Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto', pt: 0.75 }}>
                    <Box>
                      <Typography sx={{ color: INK, fontSize: 16, fontWeight: 800 }}>{fmtMoney(p.precioFinal)}</Typography>
                      <Typography sx={{ color: stockDeFila(p) <= p.alerta ? '#f59e0b' : MUTED, fontSize: 12 }}>
                        {stockDeFila(p)} {abrevUnidad(p.unidadMedida)}{mostrarStockTotal && p.stockTotal !== p.stock ? ` · ${p.stockTotal} total` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setProductoDetalle(p); }}
                          sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}14` }, borderRadius: '6px' }}>
                          <VisibilityIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); p.esCombo ? setComboEditar(p) : setProductoEditar(p); }}
                          sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: BORDER }, borderRadius: '6px' }}>
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Tabla */}
        {displayMode === 'tabla' && (isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {paged.length === 0 ? (
              <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AddBoxIcon sx={{ color: '#fff', fontSize: 26 }} />
                </Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay productos</Typography>
                <Typography sx={{ color: MUTED, fontSize: 14 }}>Aún no has creado ningún producto en tu negocio.</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setVista('nuevo')}
                  sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
                  Crear primer producto
                </Button>
              </Box>
            ) : paged.map(p => (
              <Box key={p.id}
                onClick={() => setSeleccionados(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id])}
                sx={{
                  display: 'flex', gap: 1.25, alignItems: 'flex-start', px: 2, py: 1.5,
                  borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
                  bgcolor: seleccionados.includes(p.id) ? 'rgba(92,110,248,0.06)' : 'transparent',
                  cursor: 'pointer',
                }}>
                <Checkbox size="small" checked={seleccionados.includes(p.id)}
                  onChange={(e) => { e.stopPropagation(); setSeleccionados(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id]); }}
                  onClick={e => e.stopPropagation()}
                  sx={{ color: BORDER, '&.Mui-checked': { color: P }, p: 0, mt: 0.25, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }} noWrap>{p.nombre}</Typography>
                        {p.esCombo && (
                          <Chip label="Combo" size="small" sx={{ height: 21, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                        )}
                        {p.tieneVariantes && (
                          <Chip label={`${p.variantes.length} talles`} size="small" sx={{ height: 21, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                        )}
                        {!p.tieneVariantes && p.talle && (
                          <Chip label={`Talle ${p.talle}`} size="small" sx={{ height: 21, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                        )}
                      </Box>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.codigo}</Typography>
                    </Box>
                    <Switch checked={p.activo} size="small" onClick={e => e.stopPropagation()}
                      onChange={() => actualizarProducto(p.id, { activo: !p.activo })} sx={{ ...swSx, flexShrink: 0 }} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                    <Chip label={p.categoria} size="small" sx={{ bgcolor: p.cColor + '22', color: p.cColor, fontWeight: 600, fontSize: 11, borderRadius: '6px', border: `1px solid ${p.cColor}44` }} />
                    {(() => {
                      const [label, color] = getVencimientoBadge(p.fechaVencimiento);
                      if (!label) return null;
                      return (
                        <Box component="span" sx={{ fontSize: 10, fontWeight: 700, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: color + '22', color, border: `1px solid ${color}55` }}>
                          {label}
                        </Box>
                      );
                    })()}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                    <Box>
                      <Typography sx={{ color: INK, fontSize: 15, fontWeight: 700 }}>{fmtMoney(p.precioFinal)}</Typography>
                      <Typography sx={{ color: stockDeFila(p) <= p.alerta ? '#f59e0b' : MUTED, fontSize: 12 }}>
                        {stockDeFila(p)} {abrevUnidad(p.unidadMedida)}{mostrarStockTotal && p.stockTotal !== p.stock ? ` · ${p.stockTotal} total` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.25 }} onClick={e => e.stopPropagation()}>
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => setProductoDetalle(p)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}14` }, borderRadius: '6px' }}>
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => p.esCombo ? setComboEditar(p) : setProductoEditar(p)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setProductoElim(p)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : <>
          <Box sx={{ display: 'grid', gridTemplateColumns: COLS, gap: 2, alignItems: 'center', px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
            <Checkbox size="small" checked={todosOk} indeterminate={algunoOk && !todosOk}
              onChange={toggleTodos}
              sx={{ color: BORDER, '&.Mui-checked': { color: P }, '&.MuiCheckbox-indeterminate': { color: P }, p: 0 }} />
            <ColSortHeader col="nombre"      label="Producto"  sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
            <Typography sx={colTh}>Categoría</Typography>
            <Typography sx={colTh}>Estado</Typography>
            <ColSortHeader col="stock"       label="Stock"     sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
            {mostrarStockTotal && (
              <ColSortHeader col="stockTotal" label="Stock total" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
            )}
            <ColSortHeader col="precioFinal" label="Precio"    sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
            <Typography sx={colTh}>Proveedor</Typography>
            <Typography sx={colTh}>Última modificación</Typography>
            <Typography data-tour="prod-acciones" sx={{ ...colTh, textAlign: 'right' }}>Acciones</Typography>
          </Box>

          {paged.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AddBoxIcon sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay productos</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Aún no has creado ningún producto en tu negocio.</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setVista('nuevo')}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
              Crear primer producto
            </Button>
          </Box>
        ) : paged.map(p => (
          <Box key={p.id}
            onClick={() => setSeleccionados(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id])}
            sx={{
              display: 'grid', gridTemplateColumns: COLS, gap: 2, alignItems: 'center', px: 3, py: 1.5,
              borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
              bgcolor: seleccionados.includes(p.id) ? 'rgba(92,110,248,0.06)' : 'transparent',
              '&:hover': { bgcolor: seleccionados.includes(p.id) ? 'rgba(92,110,248,0.09)' : HOVER },
              cursor: 'pointer',
            }}>
            <Checkbox size="small" checked={seleccionados.includes(p.id)} 
              onChange={(e) => {
                e.stopPropagation();
                setSeleccionados(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id]);
              }}
              onClick={e => e.stopPropagation()}
              sx={{ color: BORDER, '&.Mui-checked': { color: P }, p: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</Typography>
                {p.esCombo && (
                  <Chip label="Combo" size="small" sx={{ height: 21, flexShrink: 0, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                )}
                {p.tieneVariantes && (
                  <Chip label={`${p.variantes.length} talles`} size="small" sx={{ height: 21, flexShrink: 0, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                )}
                {!p.tieneVariantes && p.talle && (
                  <Chip label={`Talle ${p.talle}`} size="small" sx={{ height: 21, flexShrink: 0, bgcolor: `${P}22`, color: P, fontWeight: 700, fontSize: 10.5, borderRadius: '5px', border: `1px solid ${P}44`, '& .MuiChip-label': { px: 1 } }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.codigo}</Typography>
                {(() => {
                  const [label, color] = getVencimientoBadge(p.fechaVencimiento);
                  if (!label) return null;
                  return (
                    <Box component="span" sx={{ fontSize: 10, fontWeight: 700, px: 0.75, py: 0.2, borderRadius: '4px',
                      bgcolor: color + '22', color, border: `1px solid ${color}55` }}>
                      {label}
                    </Box>
                  );
                })()}
              </Box>
            </Box>
            <Box>
              <Chip label={p.categoria} size="small" sx={{
                bgcolor: p.cColor + '22', color: p.cColor, fontWeight: 600,
                fontSize: 12, borderRadius: '6px', border: `1px solid ${p.cColor}44`,
              }} />
            </Box>
            <Switch checked={p.activo} size="small"
              onChange={() => actualizarProducto(p.id, { activo: !p.activo })}
              onClick={e => e.stopPropagation()} sx={swSx} />
            <Box>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>{stockDeFila(p)} {abrevUnidad(p.unidadMedida)}</Typography>
              <Typography sx={{ color: stockDeFila(p) <= p.alerta ? '#f59e0b' : MUTED, fontSize: 12 }}>Alerta: {p.alerta} {abrevUnidad(p.unidadMedida)}</Typography>
            </Box>
            {mostrarStockTotal && (
              <Box>
                <Typography sx={{ color: INK2, fontSize: 14, fontWeight: 600 }}>{p.stockTotal} {abrevUnidad(p.unidadMedida)}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>Todas las sucursales</Typography>
              </Box>
            )}
            <Box>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>{fmtMoney(p.precioFinal)}</Typography>
              {p.costo > 0 && p.precioFinal > 0 && (() => {
                const margen = Math.round((p.precioFinal - p.costo) / p.precioFinal * 100);
                const mColor = margen >= 30 ? SUCCESS : margen >= 10 ? '#f59e0b' : ERROR;
                return <Typography sx={{ color: mColor, fontSize: 11, fontWeight: 600 }}>Margen: {margen}%</Typography>;
              })()}
            </Box>
            <Typography sx={{ color: p.proveedor === 'Sin proveedor' ? MUTED : INK2, fontSize: 14 }}>
              {p.proveedor}
            </Typography>
            <Typography sx={{ color: p.ultimaModificacionPrecio ? INK2 : MUTED, fontSize: 13 }}>
              {p.ultimaModificacionPrecio ? fmtDate(p.ultimaModificacionPrecio) : 'Sin cambios'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={e => e.stopPropagation()}>
              <Tooltip title="Ver detalle">
                <IconButton size="small" onClick={() => setProductoDetalle(p)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}14` }, borderRadius: '6px' }}>
                  <VisibilityIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Historial de precios">
                <IconButton size="small" onClick={() => setHistorialProducto(p)} sx={{ color: MUTED, '&:hover': { color: '#8b5cf6', bgcolor: '#8b5cf618' }, borderRadius: '6px' }}>
                  <HistoryIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => p.esCombo ? setComboEditar(p) : setProductoEditar(p)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => setProductoElim(p)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        ))}
        </>)}

        {/* Paginación — visible en ambas vistas, no solo en la tabla */}
        <TablePagination
          pagina={pagina} totalPages={totalPages}
          pageSize={pageSize} totalItems={filtered.length} label="productos"
          onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }}
        />
      </Box>

      {/* Modal editar producto — mismo componente que "Nuevo producto", en
          modo edición (misma lógica de precios/IVA/stock que crear, ver #6).
          Mismo diseño y tamaño que el modal de Combo. */}
      <Dialog
        open={!!productoEditar}
        onClose={() => setProductoEditar(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalPaperSx }}
      >
        {productoEditar && (
          <NuevoProducto
            key={productoEditar.id}
            producto={productoEditar}
            onVolver={() => setProductoEditar(null)}
            categorias={categorias}
            setCategorias={setCategorias}
            proveedores={proveedores}
            setProveedores={setProveedores}
            onGuardar={actualizarProducto}
            subirImagen={subirImagenProducto}
            eliminarImagen={eliminarImagenProducto}
            generarImagenIa={generarImagenIaProducto}
            grupos={grupos}
            onAbrirGrupos={() => setModalGrupos(true)}
            onGrupoCreado={(g) => setGrupos(prev => [...prev, g])}
            onTallesChange={(grupoId, talles) => setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, talles } : g))}
          />
        )}
      </Dialog>

      {/* Modal combo (crear / editar) */}
      <ModalCombo
        open={openCombo || !!comboEditar}
        onClose={() => { setOpenCombo(false); setComboEditar(null); }}
        combo={comboEditar}
        productos={productos}
        crearProducto={crearProducto}
        actualizarProducto={actualizarProducto}
        subirImagen={subirImagenProducto}
        eliminarImagen={eliminarImagenProducto}
        generarImagenIa={generarImagenIaProducto}
        generarImagenComboIa={generarImagenComboIaProducto}
      />

      {/* Modal historial de precios */}
      <ModalHistorialPrecios
        key={historialProducto?.id}
        open={!!historialProducto}
        onClose={() => setHistorialProducto(null)}
        producto={historialProducto}
      />

      {/* Modal compras por proveedor */}
      <ModalHistorialCompras
        key={historialComprasProducto?.id}
        open={!!historialComprasProducto}
        onClose={() => setHistorialComprasProducto(null)}
        producto={historialComprasProducto}
      />

      {/* Modal detalle de producto */}
      <ModalDetalleProducto
        open={!!productoDetalle}
        onClose={() => setProductoDetalle(null)}
        // Re-derivado del listado en vivo (no el snapshot del click) para que
        // desactivar un talle desaparezca de "Stock por talle" al instante,
        // sin tener que cerrar y volver a abrir el modal.
        producto={productos.find(p => p.id === productoDetalle?.id) ?? productoDetalle}
        productos={productos}
        actualizarProducto={actualizarProducto}
        onVerHistorial={() => { setHistorialProducto(productoDetalle); setProductoDetalle(null); }}
        onVerHistorialCompras={() => { setHistorialComprasProducto(productoDetalle); setProductoDetalle(null); }}
      />

      {/* Confirmación eliminar */}
      <Dialog open={!!productoElim} onClose={() => !eliminando && setProductoElim(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
        <Box sx={{ p: { xs: 1.75, sm: 3 } }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: ERROR_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <DeleteIcon sx={{ color: ERROR, fontSize: 22 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18, mb: 0.75 }}>¿Eliminar producto?</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mb: 3 }}>
            Vas a eliminar <Box component="span" sx={{ color: INK, fontWeight: 600 }}>&ldquo;{productoElim?.nombre}&rdquo;</Box>.
            Esta acción no se puede deshacer.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button fullWidth variant="outlined" onClick={() => setProductoElim(null)} disabled={eliminando}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.25, '&:hover': { bgcolor: HOVER } }}>
              Cancelar
            </Button>
            <Button fullWidth variant="contained" onClick={handleEliminar} disabled={eliminando}
              sx={{ bgcolor: ERROR, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.25, '&:hover': { bgcolor: ERROR_DARK }, '&.Mui-disabled': { opacity: 0.6 } }}>
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {openScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            open={openScanner}
            onClose={() => setOpenScanner(false)}
            onScan={(code) => { setSearch(code); setPagina(1); setOpenScanner(false); }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={confirmBulkElim}
        onClose={() => setConfirmBulkElim(false)}
        onConfirm={handleEliminarSeleccionados}
        title={`¿Eliminar ${seleccionados.length} producto${seleccionados.length !== 1 ? 's' : ''}?`}
        message="Esta acción no se puede deshacer. Los productos con ventas asociadas no se eliminarán."
        confirmLabel="Eliminar seleccionados"
      />

      <Box component="input" ref={csvRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportarCSV} sx={{ display: 'none' }} />

      {importPreview && (
        <Dialog open onClose={() => !importando && setImportPreview(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: modalPaperSx }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 17, color: INK }}>Confirmar importación</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
                {importPreview.length} producto{importPreview.length !== 1 ? 's' : ''} encontrado{importPreview.length !== 1 ? 's' : ''} en el archivo
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setImportPreview(null)} disabled={importando} sx={{ color: MUTED, '&:hover': { color: INK } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflowY: 'auto', mb: 2.5 }}>
              {importPreview.map((f, i) => (
                <Box key={i} sx={{
                  p: 1.5, bgcolor: HOVER,
                  border: `1px solid ${f.codigoDuplicado ? '#f59e0b44' : BORDER}`,
                  borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                    {f.codigoDuplicado
                      ? <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 14, flexShrink: 0, mt: '2px' }} />
                      : <CheckCircleIcon sx={{ color: '#10b981', fontSize: 14, flexShrink: 0, mt: '2px' }} />
                    }
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.nombre}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontSize: 11 }}>
                        {f.codigo || 'Sin código'}
                        {f.catNombre ? ` · ${f.catId ? f.catNombre : `"${f.catNombre}" (no existe, sin categoría)`}` : ''}
                      </Typography>
                      {f.codigoDuplicado && (
                        <Typography sx={{ color: '#f59e0b', fontSize: 11 }}>Ya existe un producto con ese código</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{fmtMoney(f.precio)}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11 }}>Stock: {f.stock}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button onClick={() => setImportPreview(null)} disabled={importando} sx={{
                flex: 1, color: INK2, border: `1px solid ${BORDER}`, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.25,
                '&:hover': { bgcolor: HOVER },
              }}>
                Cancelar
              </Button>
              <Button onClick={confirmarImportacion} disabled={importando} variant="contained" sx={{
                flex: 1, bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25,
                '&:hover': { bgcolor: P_HOVER },
              }}>
                {importando ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : `Importar ${importPreview.length} producto${importPreview.length !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
