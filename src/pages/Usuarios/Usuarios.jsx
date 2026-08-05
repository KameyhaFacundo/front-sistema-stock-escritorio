import { useEffect, useMemo, useState, useCallback, useContext } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Dialog, DialogContent, Select, MenuItem, FormControl, Avatar, Chip, Tooltip,
  Checkbox, CircularProgress,
} from '@mui/material';
import { useIsMobile } from '../../utils/responsive';
import SearchIcon  from '@mui/icons-material/Search';
import AddIcon     from '@mui/icons-material/Add';
import CloseIcon   from '@mui/icons-material/Close';
import GroupIcon   from '@mui/icons-material/Group';
import DeleteIcon  from '@mui/icons-material/Delete';
import EditIcon    from '@mui/icons-material/Edit';
import VpnKeyIcon  from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';

import {
  BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, INPUT, HOVER, TABLE_HEADER, DROPDOWN,
  fieldSx, selectSx as selectFieldSx, modalPaperSx, SUCCESS_LIGHT, ERROR,
} from '../../theme/tokens';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WatchLaterIcon  from '@mui/icons-material/WatchLater';
import { useToast }    from '../../context/ToastContext';
import { fmtDate }     from '../../utils/format';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import { registerTour } from '../../utils/tour';
import { AuthContext } from '../../auth/AuthContextBase';

import { usuariosService, rolesService } from '../../services/usuariosService';
import { permisosService } from '../../services/permisosService';
import { useSucursales } from '../../hooks/queries/useSucursalesQueries';
import useHasPermiso from '../../hooks/useHasPermiso';
import usePlan from '../../hooks/usePlan';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const ROL_COLORS = {
  default:       { bg: '#5c6ef822', fg: '#818cf8', border: '#5c6ef844' },
  admin:         { bg: '#5c6ef822', fg: '#818cf8', border: '#5c6ef844' },
  gerente:       { bg: '#0ea5e922', fg: '#38bdf8', border: '#0ea5e944' },
  usuario:       { bg: '#65a30d22', fg: '#86efac', border: '#65a30d44' },
  Administrador: { bg: '#5c6ef822', fg: '#818cf8', border: '#5c6ef844' },
  Gerente:       { bg: '#0ea5e922', fg: '#38bdf8', border: '#0ea5e944' },
  Usuario:       { bg: '#65a30d22', fg: '#86efac', border: '#65a30d44' },
};


function FieldLabel({ children, required }) {
  return (
    <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>
      {children}{required && <Box component="span" sx={{ color: P }}> *</Box>}
    </Typography>
  );
}

function ModalNuevoUsuario({ open, onClose, onCreate, roles, sucursales = [] }) {
  const toast = useToast();
  const empty = { des_usu: '', email: '', password: '', id_rol: '', id_sucursal: '' };
  const [form,   setForm]   = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const validate = () => {
    const errs = {};
    if (!form.des_usu.trim())  errs.des_usu  = 'El nombre es requerido';
    if (!form.email.trim())    errs.email    = 'El email es requerido';
    if (!form.password.trim()) errs.password = 'La contraseña es requerida';
    if (form.password && form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCrear = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        des_usu:  form.des_usu.trim(),
        email:    form.email.trim(),
        password: form.password,
        id_rol:   form.id_rol || null,
        ...(form.id_sucursal ? { id_sucursal: form.id_sucursal } : {}),
      };
      const nuevo = await usuariosService.create(payload);
      onCreate(nuevo);
      toast('Usuario creado correctamente', 'success');
      setForm(empty);
      setErrors({});
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear el usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(empty); setErrors({}); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 3 } } }}
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>Nuevo Usuario</Typography>
        <IconButton data-tour="usr-modal-cerrar" size="small" onClick={handleClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box data-tour="usr-modal-datos" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel required>Nombre completo</FieldLabel>
            <TextField fullWidth placeholder="Juan Pérez" value={form.des_usu} onChange={set('des_usu')} error={!!errors.des_usu} helperText={errors.des_usu} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel required>Email</FieldLabel>
            <TextField fullWidth placeholder="correo@ejemplo.com" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Box>
            <FieldLabel required>Contraseña</FieldLabel>
            <TextField fullWidth type="password" placeholder="••••••••" value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password} sx={fieldSx} />
          </Box>
          <Box data-tour="usr-modal-rol">
            <FieldLabel>Rol</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.id_rol} onChange={set('id_rol')} displayEmpty sx={selectFieldSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={(v) => roles.find(r => r.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Sin rol</Box>}>
                <MenuItem value="" sx={{ fontSize: 14, color: MUTED, '&:hover': { bgcolor: HOVER } }}>Sin rol</MenuItem>
                {roles.map(r => (
                  <MenuItem key={r.id} value={r.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{r.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {sucursales.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <FieldLabel>Sucursal</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.id_sucursal} onChange={set('id_sucursal')} displayEmpty sx={selectFieldSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={(v) => sucursales.find(s => s.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Tu misma sucursal</Box>}>
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{s.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>Si no elegís, queda en tu misma sucursal.</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
            Cancelar
          </Button>
          <Button data-tour="usr-modal-crear" variant="contained" onClick={handleCrear} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function ModalEditarUsuario({ open, onClose, onUpdate, usuario, roles, sucursales = [] }) {
  const toast = useToast();
  const { user, recargarPermisos } = useContext(AuthContext);
  const empty = { des_usu: '', email: '', password: '', id_rol: '', id_sucursal: '' };
  const [form,   setForm]   = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        des_usu:     usuario.nombre      || '',
        email:       usuario.email       || '',
        password:    '',
        id_rol:      usuario.id_rol      || '',
        id_sucursal: usuario.id_sucursal || '',
      });
      setErrors({});
    }
  }, [usuario]);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const validate = () => {
    const errs = {};
    if (!form.des_usu.trim()) errs.des_usu = 'El nombre es requerido';
    if (!form.email.trim())   errs.email   = 'El email es requerido';
    if (form.password && form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        des_usu: form.des_usu.trim(),
        email:   form.email.trim(),
        id_rol:  form.id_rol || null,
        ...(form.id_sucursal ? { id_sucursal: form.id_sucursal } : {}),
      };
      if (form.password.trim()) payload.password = form.password.trim();

      const actualizado = await usuariosService.update(usuario.id, payload);
      onUpdate(actualizado);
      if (user?.nro_usu === usuario.id) {
        await recargarPermisos();
      }
      toast('Usuario actualizado correctamente', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al actualizar el usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 3 } } }}
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>Editar Usuario</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel required>Nombre completo</FieldLabel>
            <TextField fullWidth placeholder="Juan Pérez" value={form.des_usu} onChange={set('des_usu')} error={!!errors.des_usu} helperText={errors.des_usu} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel required>Email</FieldLabel>
            <TextField fullWidth placeholder="correo@ejemplo.com" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Box>
            <FieldLabel>Nueva contraseña</FieldLabel>
            <TextField fullWidth type="password" placeholder="Dejar vacío para no cambiarla" value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>Rol</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.id_rol} onChange={set('id_rol')} displayEmpty sx={selectFieldSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={(v) => roles.find(r => r.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Sin rol</Box>}>
                <MenuItem value="" sx={{ fontSize: 14, color: MUTED, '&:hover': { bgcolor: HOVER } }}>Sin rol</MenuItem>
                {roles.map(r => (
                  <MenuItem key={r.id} value={r.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{r.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {sucursales.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <FieldLabel>Sucursal</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.id_sucursal} onChange={set('id_sucursal')} displayEmpty sx={selectFieldSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={(v) => sucursales.find(s => s.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Sin asignar</Box>}>
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{s.nombre}</MenuItem>
                ))}
                <MenuItem value="" sx={{ fontSize: 14, color: MUTED, '&:hover': { bgcolor: HOVER } }}>Sin asignar</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        <Typography sx={{ color: MUTED, fontSize: 12, mb: 3, mt: -1.5 }}>
          Cambiar el rol aplica sus permisos por defecto (reemplaza los actuales). Para ajustes finos, usá el botón de Permisos.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function ModalPermisosUsuario({ open, onClose, usuario }) {
  const toast = useToast();
  const { user, recargarPermisos } = useContext(AuthContext);
  const { tieneEtiquetas } = usePlan();
  const [grupos,        setGrupos]        = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    if (!open || !usuario) return;
    setLoading(true);
    Promise.all([permisosService.getAgrupados(), permisosService.getUsuario(usuario.id)])
      .then(([gruposData, usuarioData]) => {
        setGrupos(gruposData);
        setSeleccionados(usuarioData.idsDirectos);
      })
      .catch(() => toast('No se pudieron cargar los permisos', 'error'))
      .finally(() => setLoading(false));
  }, [open, usuario]);

  useEffect(() => {
    if (!open) { setShowHistorial(false); setHistorial(null); }
  }, [open]);

  const toggleHistorial = () => {
    const nuevo = !showHistorial;
    setShowHistorial(nuevo);
    if (nuevo && historial === null) {
      permisosService.getHistorial(usuario.id).then(setHistorial).catch(() => setHistorial([]));
    }
  };

  const toggle = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleGrupo = (permisos) => {
    const ids = permisos.map(p => p.id);
    const todosMarcados = ids.every(id => seleccionados.includes(id));
    setSeleccionados(prev => todosMarcados
      ? prev.filter(id => !ids.includes(id))
      : [...new Set([...prev, ...ids])]
    );
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await permisosService.asignar(usuario.id, seleccionados);
      toast('Permisos actualizados correctamente', 'success');
      if (user?.nro_usu === usuario.id) {
        await recargarPermisos();
      }
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudieron guardar los permisos', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 3 } } }}
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>Permisos de {usuario?.nombre}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>
            Esto define exactamente lo que puede hacer, sin importar su rol.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="Historial de cambios">
            <IconButton size="small" onClick={toggleHistorial}
              sx={{ color: showHistorial ? P : MUTED, '&:hover': { color: P } }}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: 1, maxHeight: 440, overflowY: 'auto' }}>
        {showHistorial ? (
          historial === null ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={26} sx={{ color: P }} />
            </Box>
          ) : historial.length === 0 ? (
            <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 4 }}>
              Sin cambios de permisos registrados todavía.
            </Typography>
          ) : (
            historial.map(h => (
              <Box key={h.id} sx={{ borderBottom: `1px solid ${BORDER}`, py: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(h.fecha)}</Typography>
                  <Typography sx={{ color: INK2, fontSize: 12 }} noWrap>{h.actor || '—'}</Typography>
                </Box>
                {h.agregados.length > 0 && (
                  <Typography sx={{ color: SUCCESS_LIGHT, fontSize: 12.5, mt: 0.5 }}>
                    + Agregó: {h.agregados.join(', ')}
                  </Typography>
                )}
                {h.quitados.length > 0 && (
                  <Typography sx={{ color: ERROR, fontSize: 12.5, mt: 0.5 }}>
                    − Quitó: {h.quitados.join(', ')}
                  </Typography>
                )}
              </Box>
            ))
          )
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={26} sx={{ color: P }} />
          </Box>
        ) : (
          grupos
            // "etiquetas" es el único grupo de permisos atado a una feature
            // de plan (ver tieneEtiquetas en usePlan.js) — sin este filtro,
            // una empresa en plan Esencial podía asignarle a un empleado el
            // permiso de una sección a la que ni ella misma tiene acceso.
            .filter(({ grupo }) => grupo !== 'etiquetas' || tieneEtiquetas)
            .map(({ grupo, permisos }) => {
            const ids = permisos.map(p => p.id);
            const todosMarcados = ids.length > 0 && ids.every(id => seleccionados.includes(id));
            return (
              <Box key={grupo} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {grupo}
                  </Typography>
                  <Button size="small" onClick={() => toggleGrupo(permisos)}
                    sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 11.5, px: 0.5, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                    {todosMarcados ? 'Quitar todos' : 'Marcar todos'}
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  {permisos.map(p => (
                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Checkbox size="small" checked={seleccionados.includes(p.id)}
                        onChange={() => toggle(p.id)}
                        sx={{ p: 0.5, color: BORDER, '&.Mui-checked': { color: P } }} />
                      <Typography sx={{ color: INK2, fontSize: 13 }}>{p.nombre}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })
        )}
      </DialogContent>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', px: { xs: 1.5, sm: 3 }, pt: 1.5, pb: { xs: 1.75, sm: 3 } }}>
        <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleGuardar} disabled={saving || loading}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
          {saving ? 'Guardando...' : 'Guardar permisos'}
        </Button>
      </Box>
    </Dialog>
  );
}

const COLS  = '44px repeat(4, minmax(0, 1fr)) 112px';
const colTh = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

export default function Usuarios() {
  const isMobile = useIsMobile();
  const toast = useToast();
  const { checkPermisos } = useHasPermiso();
  const { data: sucursales = [] } = useSucursales({ enabled: checkPermisos('list-sucursales') });
  const [usuarios,  setUsuarios]  = useState([]);
  const [roles,     setRoles]     = useState([]);
  const [search,    setSearch]    = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [pagina,    setPagina]    = useState(1);
  const [pageSize,  setPageSize]  = useState(10);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
  const [usuarioEditar,   setUsuarioEditar]   = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [us, rs] = await Promise.all([usuariosService.getAll(), rolesService.getAll()]);
      setUsuarios(us);
      setRoles(rs);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    registerTour('/usuarios', [
      { element: '[data-tour="usr-buscar"]', title: 'Buscar usuario', description: 'Buscá por nombre, email o rol.' },
      { element: '[data-tour="usr-tabla"]', title: 'Equipo', description: 'Todos los usuarios con acceso al sistema.' },
      { element: '[data-tour="usr-acciones"]', title: 'Acciones de la fila', description: 'Lápiz: editar nombre, email o contraseña. Llave: elegir exactamente qué pantallas y acciones puede usar ese usuario. Tacho: eliminarlo.', optional: true },
      { element: '[data-tour="usr-agregar"]', title: 'Agregar usuario', description: 'Vamos a ver el formulario de alta. Hacé clic en "Siguiente".', click: true, clickDelay: 300 },
      { element: '[data-tour="usr-modal-datos"]', title: 'Datos de acceso', description: 'Nombre, email y contraseña con los que va a iniciar sesión (mínimo 6 caracteres).' },
      { element: '[data-tour="usr-modal-rol"]', title: 'Rol', description: 'El rol define un conjunto de permisos por defecto. Después podés ajustar permisos individuales desde el ícono de la llave en la tabla.' },
      { element: '[data-tour="usr-modal-crear"]', title: 'Crear usuario', description: 'Guardá el nuevo usuario con los datos cargados.' },
      { element: '[data-tour="usr-modal-cerrar"]', title: 'Listo', description: 'Cerramos el formulario y volvemos al listado del equipo.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? usuarios.filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.rol || '').toLowerCase().includes(q))
      : usuarios;
  }, [usuarios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged      = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);

  const handleCrear      = (nuevo) => { setUsuarios(us => [...us, nuevo]); setPagina(1); };
  const handleActualizar = (actualizado) => { setUsuarios(us => us.map(u => u.id === actualizado.id ? actualizado : u)); };
  const handleEliminar = async (id) => {
    try {
      await usuariosService.delete(id);
      setUsuarios(us => us.filter(u => u.id !== id));
      toast('Usuario eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar este usuario', 'error');
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Usuarios</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{usuarios.length} usuarios registrados</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title="Agregar Usuario">
            <Button data-tour="usr-agregar" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Agregar Usuario</Box>
            </Button>
          </Tooltip>
          <AyudaButton />
        </Box>
      </Box>

      <TextField data-tour="usr-buscar" fullWidth placeholder="Buscar por nombre, email o rol..."
        value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
          '& .MuiInputBase-input': { py: '13px', px: '14px' },
          '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
        }}
      />

      <Box data-tour="usr-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Equipo</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{usuarios.length} usuarios con acceso al sistema</Typography>
          </Box>

          {paged.length === 0 ? (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '16px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GroupIcon sx={{ color: P, fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay usuarios</Typography>
              <Typography sx={{ color: MUTED, fontSize: 14 }}>Aún no has agregado ningún usuario.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
                Agregar primer usuario
              </Button>
            </Box>
          ) : isMobile ? (
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {paged.map(u => {
                const rolColor = ROL_COLORS[u.rol] || ROL_COLORS.default;
                const initials = (u.nombre || 'SN').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase() || 'SN';
                return (
                  <Box key={u.id} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: P + '33', color: P, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{u.nombre}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                            <Typography sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</Typography>
                            <Tooltip title={u.emailVerificado ? 'Email verificado' : 'Todavía no confirmó el email'}>
                              {u.emailVerificado
                                ? <CheckCircleIcon sx={{ fontSize: 13, color: SUCCESS_LIGHT, flexShrink: 0 }} />
                                : <WatchLaterIcon sx={{ fontSize: 13, color: MUTED, flexShrink: 0 }} />}
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => setUsuarioEditar(u)}
                            sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: BORDER }, borderRadius: '6px' }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Permisos">
                          <IconButton size="small" onClick={() => setUsuarioPermisos(u)}
                            sx={{ color: MUTED, '&:hover': { color: P, bgcolor: P + '18' }, borderRadius: '6px' }}>
                            <VpnKeyIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => setConfirmandoEliminar(u.id)}
                            sx={{ color: MUTED, '&:hover': { color: '#f87171', bgcolor: '#f8717118' }, borderRadius: '6px' }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.25, alignItems: 'center' }}>
                      <Chip label={u.rol || 'Sin rol'} size="small" sx={{ bgcolor: rolColor.bg, color: rolColor.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${rolColor.border}` }} />
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{u.createdAt ? fmtDate(u.createdAt) : '—'}</Typography>
                    </Box>
                  </Box>
                );
              })}
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="usuarios" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
                <Box />
                <Typography sx={colTh}>Usuario</Typography>
                <Typography sx={colTh}>Email</Typography>
                <Typography sx={colTh}>Rol</Typography>
                <Typography sx={colTh}>Registro</Typography>
                <Typography data-tour="usr-acciones" sx={{ ...colTh, textAlign: 'right' }}>Acciones</Typography>
              </Box>

              {paged.map(u => {
                const rolColor = ROL_COLORS[u.rol] || ROL_COLORS.default;
                const initials = (u.nombre || 'SN').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase() || 'SN';
                return (
                  <Box key={u.id} sx={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', px: 3, py: 1.5, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: HOVER } }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: P + '33', color: P, fontSize: 12, fontWeight: 700 }}>
                      {initials}
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{u.nombre}</Typography>
                      {u.isAdmin && <Typography sx={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>Admin</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Typography sx={{ color: INK2, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</Typography>
                      <Tooltip title={u.emailVerificado ? 'Email verificado' : 'Todavía no confirmó el email'}>
                        {u.emailVerificado
                          ? <CheckCircleIcon sx={{ fontSize: 15, color: SUCCESS_LIGHT, flexShrink: 0 }} />
                          : <WatchLaterIcon sx={{ fontSize: 15, color: MUTED, flexShrink: 0 }} />}
                      </Tooltip>
                    </Box>
                    <Chip label={u.rol || 'Sin rol'} size="small" sx={{ bgcolor: rolColor.bg, color: rolColor.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${rolColor.border}`, width: 'fit-content' }} />
                    <Typography sx={{ color: INK2, fontSize: 14 }}>{u.createdAt ? fmtDate(u.createdAt) : '—'}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => setUsuarioEditar(u)}
                          sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: BORDER }, borderRadius: '6px' }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Permisos">
                        <IconButton size="small" onClick={() => setUsuarioPermisos(u)}
                          sx={{ color: MUTED, '&:hover': { color: P, bgcolor: P + '18' }, borderRadius: '6px' }}>
                          <VpnKeyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => setConfirmandoEliminar(u.id)}
                          sx={{ color: MUTED, '&:hover': { color: '#f87171', bgcolor: '#f8717118' }, borderRadius: '6px' }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}

              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="usuarios" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            </>
          )}
        </Box>

      <ModalNuevoUsuario open={openModal} onClose={() => setOpenModal(false)} onCreate={handleCrear} roles={roles} sucursales={sucursales} />
      <ModalEditarUsuario open={!!usuarioEditar} onClose={() => setUsuarioEditar(null)} onUpdate={handleActualizar} usuario={usuarioEditar} roles={roles} sucursales={sucursales} />
      <ModalPermisosUsuario open={!!usuarioPermisos} onClose={() => setUsuarioPermisos(null)} usuario={usuarioPermisos} />
      <ConfirmDialog
        open={!!confirmandoEliminar}
        onClose={() => setConfirmandoEliminar(null)}
        onConfirm={() => handleEliminar(confirmandoEliminar)}
        title="¿Eliminar este usuario?"
        message="El usuario perderá el acceso al sistema. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
