import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EditorVisual from './EditorVisual';
import ColorPickerPopover from './ColorPickerPopover';
import etiquetasService from '../../services/etiquetasService';
import { CAMPOS_DEFAULT, migrarCampos } from './etiquetasConstants';
import { useToast } from '../../context/ToastContext';
import { Alerta } from '../../functions/alerts';
import { P, P_HOVER, BORDER, HOVER, INK, INK2, MUTED, CARD, BG } from '../../theme/tokens';

function Label({ children }) {
  return (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

export default function EditorPlantilla({ plantillaActiva, onPlantillaChange }) {
  const [plantillas, setPlantillas] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [nombre, setNombre]         = useState('');
  const [anchoCm, setAnchoCm]       = useState(4);
  const [altoCm, setAltoCm]         = useState(2.5);
  const [fondo, setFondo]           = useState('#ffffff');
  const [borde, setBorde]           = useState(true);
  const [campos, setCampos]         = useState(CAMPOS_DEFAULT);
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalNombre, setModalNombre] = useState('');
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const toast = useToast();

  useEffect(() => {
    etiquetasService.fetchPlantillas().then(setPlantillas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!plantillaActiva) return;
    const c = plantillaActiva.config || {};
    setSelectedId(plantillaActiva.id || '');
    setNombre(plantillaActiva.nombre || '');
    setAnchoCm(c.anchoCm || 4);
    setAltoCm(c.altoCm   || 2.5);
    setFondo(c.fondo || '#ffffff');
    setBorde(c.borde !== false);
    setCampos(migrarCampos(c.campos));
  }, [plantillaActiva?.id]);

  const emit = (ov = {}) => {
    onPlantillaChange({
      id:     ov.id     !== undefined ? ov.id     : selectedId || undefined,
      nombre: ov.nombre !== undefined ? ov.nombre : nombre,
      config: {
        campos:  ov.campos  !== undefined ? ov.campos  : campos,
        anchoCm: ov.anchoCm !== undefined ? ov.anchoCm : anchoCm,
        altoCm:  ov.altoCm  !== undefined ? ov.altoCm  : altoCm,
        fondo:   ov.fondo   !== undefined ? ov.fondo   : fondo,
        borde:   ov.borde   !== undefined ? ov.borde   : borde,
      },
    });
  };

  const handleSelectPlantilla = (e) => {
    const id = e.target.value;
    if (!id) {
      setSelectedId(''); setNombre(''); setAnchoCm(4); setAltoCm(2.5);
      setFondo('#ffffff'); setBorde(true); setCampos(CAMPOS_DEFAULT);
      onPlantillaChange({ config: { campos: CAMPOS_DEFAULT, anchoCm: 4, altoCm: 2.5, fondo: '#ffffff', borde: true } });
      return;
    }
    const p = plantillas.find(x => x.id == id);
    if (!p) return;
    const c = p.config || {};
    const cam = migrarCampos(c.campos);
    setSelectedId(p.id); setNombre(p.nombre);
    setAnchoCm(c.anchoCm || 4); setAltoCm(c.altoCm || 2.5);
    setFondo(c.fondo || '#ffffff'); setBorde(c.borde !== false);
    setCampos(cam);
    onPlantillaChange({ id: p.id, nombre: p.nombre, config: { ...c, campos: cam } });
  };

  const handleGuardar = async () => {
    if (!modalNombre.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await etiquetasService.savePlantilla({ nombre: modalNombre, config: { campos, anchoCm, altoCm, fondo, borde } });
      setPlantillas(prev => [saved, ...prev]);
      setSelectedId(saved.id); setNombre(saved.nombre);
      emit({ id: saved.id, nombre: saved.nombre });
      setModalOpen(false); setModalNombre('');
      toast('Plantilla guardada', 'success');
    } catch (e) {
      toast(e?.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleActualizar = async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      const updated = await etiquetasService.updatePlantilla(selectedId, { nombre, config: { campos, anchoCm, altoCm, fondo, borde } });
      setPlantillas(prev => prev.map(p => p.id == updated.id ? updated : p));
      emit();
      toast('Plantilla actualizada', 'success');
    } catch (e) {
      toast(e?.response?.data?.message || 'Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedId || deleting) return;
    const confirm = await Alerta()
      .title('¿Eliminar plantilla?')
      .text(nombre)
      .confirmText('Eliminar')
      .cancelText('Cancelar')
      .ask();
    if (!confirm) return;
    setDeleting(true);
    try {
      await etiquetasService.deletePlantilla(selectedId);
      setPlantillas(prev => prev.filter(p => p.id != selectedId));
      setSelectedId(''); setNombre(''); setCampos(CAMPOS_DEFAULT);
      onPlantillaChange({ config: { campos: CAMPOS_DEFAULT, anchoCm, altoCm, fondo, borde } });
      toast('Plantilla eliminada', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0, px: 2, pt: 1.5, pb: 1.2, borderBottom: `1px solid ${BORDER}` }}>
        <Label>Plantilla guardada</Label>
        <Box sx={{ display: 'flex', gap: 0.8, mb: 1.2 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={selectedId} onChange={handleSelectPlantilla} displayEmpty sx={{ fontSize: '0.82rem', bgcolor: HOVER }}>
              <MenuItem value=""><em style={{ color: MUTED }}>Sin plantilla (nueva)</em></MenuItem>
              {plantillas.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.82rem' }}>{p.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          {selectedId && (
            <Button size="small" color="error" variant="outlined" onClick={handleEliminar} disabled={deleting}
              sx={{ minWidth: 0, px: 1.2, fontSize: '0.72rem' }}>
              {deleting ? '...' : 'Eliminar'}
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <Box>
            <Label>Ancho (cm)</Label>
            <input type="number" min="1" max="30" step="0.5" value={anchoCm}
              onChange={e => { const v = Math.max(1, parseFloat(e.target.value) || 4); setAnchoCm(v); emit({ anchoCm: v }); }}
              style={{ width: 64, height: 32, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '0 6px', fontSize: '0.82rem', outline: 'none', background: HOVER, color: INK }} />
          </Box>
          <Box>
            <Label>Alto (cm)</Label>
            <input type="number" min="1" max="30" step="0.5" value={altoCm}
              onChange={e => { const v = Math.max(1, parseFloat(e.target.value) || 2.5); setAltoCm(v); emit({ altoCm: v }); }}
              style={{ width: 64, height: 32, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '0 6px', fontSize: '0.82rem', outline: 'none', background: HOVER, color: INK }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Label>Fondo</Label>
            <Box sx={{ mt: 0.5 }}>
              <ColorPickerPopover value={fondo} onChange={v => { setFondo(v || '#ffffff'); emit({ fondo: v || '#ffffff' }); }} allowNull={false} />
            </Box>
          </Box>
          <Box>
            <Label>Borde</Label>
            <FormControl size="small">
              <Select value={borde ? 'si' : 'no'}
                onChange={e => { const v = e.target.value === 'si'; setBorde(v); emit({ borde: v }); }}
                sx={{ fontSize: '0.78rem', bgcolor: HOVER, minWidth: 56 }}>
                <MenuItem value="si" sx={{ fontSize: '0.78rem' }}>Sí</MenuItem>
                <MenuItem value="no" sx={{ fontSize: '0.78rem' }}>No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <EditorVisual campos={campos} anchoCm={anchoCm} altoCm={altoCm} fondo={fondo} borde={borde}
          onChange={(newCampos) => { setCampos(newCampos); emit({ campos: newCampos }); }} />
      </Box>

      <Box sx={{ flexShrink: 0, px: 2, py: 1.2, borderTop: `1px solid ${BORDER}` }}>
        {!selectedId ? (
          <Button variant="contained" size="small" fullWidth onClick={() => setModalOpen(true)}
            sx={{ bgcolor: P, '&:hover': { bgcolor: P_HOVER }, fontSize: '0.78rem', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}>
            Guardar como nueva plantilla
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            <Button variant="contained" size="small" onClick={handleActualizar} disabled={saving}
              sx={{ flex: 1, bgcolor: P, '&:hover': { bgcolor: P_HOVER }, fontSize: '0.75rem', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}>
              {saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Guardar cambios'}
            </Button>
            <Button variant="outlined" size="small" onClick={() => {
              setSelectedId(''); setNombre(''); setCampos(CAMPOS_DEFAULT);
              onPlantillaChange({ config: { campos: CAMPOS_DEFAULT, anchoCm, altoCm, fondo, borde } });
            }} sx={{ fontSize: '0.75rem', borderRadius: 1.5, color: INK2, borderColor: BORDER }}>
              Nueva
            </Button>
          </Box>
        )}
      </Box>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: CARD,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              bgcolor: `${P}16`, border: `1px solid ${P}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookmarkIcon sx={{ color: P, fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: INK, lineHeight: 1.2 }}>
                Guardar plantilla
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: MUTED, mt: 0.15 }}>
                El diseño actual se guarda para reutilizarlo después
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setModalOpen(false)}
            sx={{ color: MUTED, borderRadius: '8px', '&:hover': { bgcolor: HOVER, color: INK } }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, mb: 0.75 }}>
            Nombre de la plantilla
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Ej: Chica 4×2.5 cm"
            value={modalNombre}
            onChange={e => setModalNombre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGuardar(); }}
            inputProps={{ style: { fontSize: '0.9rem', fontWeight: 600 } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: BG,
                borderRadius: '10px',
                '& fieldset': { borderColor: BORDER },
                '&:hover fieldset': { borderColor: 'var(--border-hover)' },
                '&.Mui-focused fieldset': { borderColor: P, borderWidth: '1.5px' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 0.75 }}>
          <Button
            onClick={() => setModalOpen(false)}
            sx={{
              color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
              borderRadius: '9px', px: 2,
              '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={!modalNombre.trim() || saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <SaveIcon sx={{ fontSize: 15 }} />}
            sx={{
              bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
              borderRadius: '9px', px: 2.5, boxShadow: `0 2px 10px ${P}40`,
              '&:hover': { bgcolor: P_HOVER, boxShadow: `0 4px 18px ${P}55` },
              '&.Mui-disabled': { bgcolor: P, opacity: 0.4, color: '#fff' },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
