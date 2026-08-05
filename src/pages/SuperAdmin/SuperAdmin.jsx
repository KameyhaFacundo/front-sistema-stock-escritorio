import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Dialog, DialogContent,
  Chip, InputAdornment, Select, MenuItem, FormControl, Tab, Tabs,
  Menu, Tooltip,
} from '@mui/material';
import SearchIcon             from '@mui/icons-material/Search';
import AddIcon                from '@mui/icons-material/Add';
import CloseIcon              from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteOutlineIcon      from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon       from '@mui/icons-material/FileDownload';
import BusinessIcon           from '@mui/icons-material/Business';
import StorefrontIcon         from '@mui/icons-material/Storefront';
import PersonIcon             from '@mui/icons-material/Person';
import EditIcon               from '@mui/icons-material/Edit';
import BlockIcon              from '@mui/icons-material/Block';
import AyudaButton            from '../../components/shared/AyudaButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WatchLaterIcon         from '@mui/icons-material/WatchLater';
import LockResetIcon          from '@mui/icons-material/LockReset';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import WarningAmberIcon       from '@mui/icons-material/WarningAmber';
import PaymentsIcon           from '@mui/icons-material/Payments';
import ArrowForwardIcon       from '@mui/icons-material/ArrowForward';
import StarIcon               from '@mui/icons-material/Star';
import AttachMoneyIcon        from '@mui/icons-material/AttachMoney';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon        from '@mui/icons-material/ReceiptLong';
import DescriptionIcon        from '@mui/icons-material/Description';
import VisibilityIcon         from '@mui/icons-material/Visibility';
import VisibilityOffIcon      from '@mui/icons-material/VisibilityOff';
import LoginIcon              from '@mui/icons-material/Login';
import ShoppingBasketIcon     from '@mui/icons-material/ShoppingBasket';
import CheckroomIcon          from '@mui/icons-material/Checkroom';
import BuildIcon              from '@mui/icons-material/Build';
import CategoryIcon           from '@mui/icons-material/Category';
import {
  BarChart, Bar, XAxis, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, INPUT, DROPDOWN, TABLE_HEADER, fieldSx, selectSx, modalPaperSx, WARNING, WARNING_BG, SUCCESS, SUCCESS_BG, ERROR, ERROR_BG } from '../../theme/tokens';
import { useToast }          from '../../context/ToastContext';
import { useAuth }           from '../../auth/AuthContextBase';
import { useIsMobile }       from '../../utils/responsive';
import { fmtDate, fmtTime }  from '../../utils/format';
import { exportarExcel }     from '../../utils/excelExport';
import { superAdminService } from '../../services/superAdminService';
import ConfirmDialog          from '../../components/shared/ConfirmDialog';
import TablePagination        from '../../components/shared/TablePagination';

const PLAN_COLORS = {
  free:     { bg: '#64748b22', fg: '#94a3b8', border: '#64748b44' },
  esencial: { bg: `${SUCCESS_BG}`, fg: SUCCESS,  border: SUCCESS + '44' },
  pro:      { bg: '#7c3aed22', fg: '#a78bfa', border: '#7c3aed44' },
  ia:       { bg: '#ea580c22', fg: '#fb923c', border: '#ea580c44' },
};

// 'esencial'/'pro'/'ia' ya son válidos en español tal cual — solo 'free'
// (o la ausencia de plan) necesita traducirse para el badge en mayúsculas.
const planEnMayusculas = (plan) => (!plan || plan === 'free') ? 'GRATIS' : plan.toUpperCase();

// Mismos códigos/orden que el selector de rubro en el Onboarding — 'empresa.tipo'
// llega tal cual del backend. Una empresa vieja (previa a este campo) puede
// tener 'tipo' null, por eso 'otro' cubre ese caso además de rubros futuros.
const RUBRO_META = {
  almacen:  { label: 'Almacén',      Icon: ShoppingBasketIcon },
  kiosco:   { label: 'Kiosco',       Icon: StorefrontIcon },
  indument: { label: 'Indumentaria', Icon: CheckroomIcon },
  ferret:   { label: 'Ferretería',   Icon: BuildIcon },
  otro:     { label: 'Otro',         Icon: CategoryIcon },
};
const rubroMeta = (tipo) => RUBRO_META[tipo] ?? RUBRO_META.otro;

function fmtMes(m) { const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; const i = parseInt(String(m).split('-')[1], 10); return meses[i - 1] || m; }

function FieldLabel({ children, required }) {
  return (
    <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>
      {children}{required && <Box component="span" sx={{ color: P }}> *</Box>}
    </Typography>
  );
}

function ModalEditEmpresa({ open, empresa, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ plan: '', trial_ends_at: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (empresa) setForm({
      plan:          empresa.plan ?? 'free',
      trial_ends_at: empresa.trial_ends_at ? String(empresa.trial_ends_at).slice(0, 10) : '',
    });
  }, [empresa]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateEmpresa(empresa.id, {
        plan:          form.plan,
        trial_ends_at: form.trial_ends_at || null,
      });
      toast('Empresa actualizada', 'success');
      onSaved();
      onClose();
    } catch {
      toast('Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <EditIcon sx={{ color: P, fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Editar plan</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa?.nombre}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, flexShrink: 0 }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ mb: 2.5 }}>
          <FieldLabel>Plan</FieldLabel>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
            {['free', 'esencial', 'pro', 'ia'].map(p => {
              const pc  = PLAN_COLORS[p];
              const sel = form.plan === p;
              return (
                <Box key={p} onClick={() => setForm(f => ({ ...f, plan: p }))} sx={{
                  py: 1.25, borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                  border: `1.5px solid ${sel ? pc.fg : BORDER}`,
                  bgcolor: sel ? pc.bg : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: pc.fg },
                }}>
                  <Typography sx={{ color: sel ? pc.fg : INK2, fontSize: 12.5, fontWeight: sel ? 700 : 500 }}>{PLAN_LABELS[p]}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <FieldLabel>Vence la prueba</FieldLabel>
          <TextField fullWidth type="date" value={form.trial_ends_at}
            onChange={e => setForm(f => ({ ...f, trial_ends_at: e.target.value }))}
            sx={fieldSx} InputLabelProps={{ shrink: true }} />
          <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.75 }}>Dejá vacío para quitar la prueba.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: P_HOVER, boxShadow: 'none' } }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function ModalNuevoUsuario({ open, empresa, onClose, onCreated }) {
  const toast = useToast();
  const empty = { des_usu: '', email: '', password: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCrear = async () => {
    if (!form.des_usu || !form.email || !form.password) return;
    setSaving(true);
    try {
      const u = await superAdminService.crearUsuario(empresa.id, form);
      toast('Usuario creado', 'success');
      onCreated(u);
      setForm(empty);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al crear', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: { xs: 1.75, sm: 2.5 } }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Nuevo usuario</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        <Typography sx={{ color: INK2, fontSize: 13, mb: 2 }}>Para: <strong>{empresa?.nombre}</strong></Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel required>Nombre</FieldLabel>
            <TextField fullWidth value={form.des_usu} onChange={set('des_usu')} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel required>Email</FieldLabel>
            <TextField fullWidth value={form.email} onChange={set('email')} sx={fieldSx} />
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <FieldLabel required>Contraseña</FieldLabel>
          <TextField fullWidth type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
            sx={fieldSx}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPassword(v => !v)} sx={{ color: MUTED }}>
                  {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ) }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            {saving ? 'Creando...' : 'Crear'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function ModalResetPassword({ open, usuario, onClose }) {
  const toast = useToast();
  const [pwd, setPwd]       = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = async () => {
    if (pwd.length < 6) return;
    setSaving(true);
    try {
      await superAdminService.resetearPassword(usuario.id, pwd);
      toast(`Contraseña de ${usuario.nombre} actualizada`, 'success');
      setPwd('');
      onClose();
    } catch {
      toast('Error al resetear contraseña', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: { xs: 1.75, sm: 2.5 } }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Resetear contraseña</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        <Typography sx={{ color: INK2, fontSize: 13, mb: 2 }}>Usuario: <strong>{usuario?.nombre}</strong> ({usuario?.email})</Typography>
        <FieldLabel required>Nueva contraseña</FieldLabel>
        <TextField fullWidth type="password" placeholder="Mínimo 6 caracteres"
          value={pwd} onChange={e => setPwd(e.target.value)} sx={fieldSx} />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleReset} disabled={saving || pwd.length < 6}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// A diferencia de "Mi perfil" (self-service, requiere confirmar el email
// nuevo por mail), acá el super admin edita a otro usuario como acción de
// soporte/administración — se aplica directo, sin verificación.
function ModalEditarUsuario({ open, usuario, onClose, onSaved }) {
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [email, setEmail]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario) { setNombre(usuario.nombre || ''); setEmail(usuario.email || ''); }
  }, [usuario]);

  const handleGuardar = async () => {
    if (!nombre.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const data = await superAdminService.actualizarUsuario(usuario.id, { des_usu: nombre.trim(), email: email.trim() });
      toast('Usuario actualizado', 'success');
      onSaved(data);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || e.response?.data?.errors?.email?.[0] || 'Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: { xs: 1.75, sm: 2.5 } }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Editar usuario</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <FieldLabel required>Nombre</FieldLabel>
          <TextField fullWidth value={nombre} onChange={e => setNombre(e.target.value)} sx={fieldSx} />
        </Box>
        <Box>
          <FieldLabel required>Email</FieldLabel>
          <TextField fullWidth type="email" value={email} onChange={e => setEmail(e.target.value)} sx={fieldSx} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

const PRECIOS = {
  esencial: { mensual: 27000, anual: 259200 },
  pro:      { mensual: 40000, anual: 384000 },
  ia:       { mensual: 50000, anual: 480000 },
};

const METODOS = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro',          label: 'Otro' },
];

function ModalRegistrarPago({ open, empresa, onClose, onRegistrado }) {
  const toast = useToast();
  const empty = { plan: 'esencial', ciclo: 'mensual', monto: '27000', metodo: 'efectivo' };
  const [form, setForm]   = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(f => ({
      ...f,
      plan:  empresa?.plan !== 'free' ? (empresa?.plan ?? 'esencial') : 'esencial',
      monto: String(PRECIOS['esencial'].mensual),
    }));
  }, [open, empresa]);

  const set = k => v => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'plan' || k === 'ciclo') {
        next.monto = String(PRECIOS[next.plan]?.[next.ciclo] ?? '');
      }
      return next;
    });
  };

  const handleGuardar = async () => {
    if (!form.monto || isNaN(Number(form.monto))) return;
    setSaving(true);
    try {
      await superAdminService.registrarPago(empresa.id, {
        plan:   form.plan,
        ciclo:  form.ciclo,
        monto:  Number(form.monto),
        metodo: form.metodo,
      });
      toast(`Pago registrado — ${form.plan} (${form.ciclo})`, 'success');
      onRegistrado(form.plan);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al registrar pago', 'error');
    } finally {
      setSaving(false);
    }
  };

  const planColor = PLAN_COLORS[form.plan] ?? PLAN_COLORS.free;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: { xs: 1.75, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${SUCCESS}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AttachMoneyIcon sx={{ color: SUCCESS, fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Registrar pago</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>{empresa?.nombre}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        {/* Plan */}
        <Box sx={{ mb: 2 }}>
          <FieldLabel required>Plan</FieldLabel>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['esencial','pro','ia'].map(p => {
              const pc = PLAN_COLORS[p];
              const sel = form.plan === p;
              return (
                <Box key={p} onClick={() => set('plan')(p)} sx={{
                  flex: 1, py: 1, borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                  border: `1.5px solid ${sel ? pc.fg : BORDER}`,
                  bgcolor: sel ? pc.bg : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <Typography sx={{ color: sel ? pc.fg : INK2, fontSize: 13, fontWeight: sel ? 700 : 500 }}>{PLAN_LABELS[p]}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Ciclo */}
        <Box sx={{ mb: 2 }}>
          <FieldLabel required>Ciclo</FieldLabel>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[{ v: 'mensual', l: 'Mensual' }, { v: 'anual', l: 'Anual' }].map(({ v, l }) => (
              <Box key={v} onClick={() => set('ciclo')(v)} sx={{
                flex: 1, py: 1, borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                border: `1.5px solid ${form.ciclo === v ? P : BORDER}`,
                bgcolor: form.ciclo === v ? `${P}15` : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Typography sx={{ color: form.ciclo === v ? P : INK2, fontSize: 13, fontWeight: form.ciclo === v ? 700 : 500 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Monto */}
        <Box sx={{ mb: 2 }}>
          <FieldLabel required>Monto ($)</FieldLabel>
          <TextField fullWidth value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
            placeholder="Ej: 27000" type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }} />
        </Box>

        {/* Método */}
        <Box sx={{ mb: 3 }}>
          <FieldLabel>Método de pago</FieldLabel>
          <FormControl fullWidth>
            <Select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))} sx={selectSx}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              {METODOS.map(m => (
                <MenuItem key={m.value} value={m.value} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Resumen */}
        <Box sx={{ bgcolor: `${SUCCESS}08`, border: `1px solid ${SUCCESS}25`, borderRadius: '8px', px: 2, py: 1.5, mb: 3 }}>
          <Typography sx={{ color: MUTED, fontSize: 12 }}>Resumen</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={form.plan?.toUpperCase()} size="small"
                sx={{ bgcolor: planColor.bg, color: planColor.fg, fontWeight: 700, fontSize: 11, borderRadius: '5px', border: `1px solid ${planColor.border}` }} />
              <Typography sx={{ color: INK2, fontSize: 13 }}>{form.ciclo}</Typography>
            </Box>
            <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 16 }}>
              ${Number(form.monto || 0).toLocaleString('es-AR')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving || !form.monto}
            sx={{ bgcolor: SUCCESS, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: '#16a34a' } }}>
            {saving ? 'Guardando...' : 'Registrar pago'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* Acredita facturas manualmente (pago por fuera de Mercado Pago, o cortesía) —
   mismo patrón visual que ModalRegistrarPago, sin restringirse a los packs
   fijos de /planes (acá se puede cargar cualquier cantidad). */
function ModalAcreditarFacturas({ open, empresa, onClose, onAcreditado }) {
  const toast = useToast();
  const [form, setForm] = useState({ cantidad: '500', monto: '', metodo: 'efectivo' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ cantidad: '500', monto: '', metodo: 'efectivo' });
  }, [open]);

  const handleGuardar = async () => {
    const cantidad = parseInt(form.cantidad, 10);
    if (!cantidad || cantidad < 1) return;
    setSaving(true);
    try {
      const data = await superAdminService.acreditarFacturas(empresa.id, {
        cantidad,
        monto:  form.monto ? Number(form.monto) : null,
        metodo: form.metodo,
      });
      toast(`${cantidad.toLocaleString('es-AR')} facturas acreditadas`, 'success');
      onAcreditado(data.facturas_disponibles);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al acreditar facturas', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: { xs: 1.75, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DescriptionIcon sx={{ color: P, fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Acreditar facturas</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>{empresa?.nombre}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <FieldLabel required>Cantidad de facturas</FieldLabel>
          <TextField fullWidth value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
            placeholder="Ej: 500" type="number" sx={fieldSx} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FieldLabel>Monto ($) — opcional, si fue un pago real</FieldLabel>
          <TextField fullWidth value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
            placeholder="Dejalo vacío si es una cortesía" type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: MUTED, fontSize: 14 }}>$</Typography></InputAdornment> }} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <FieldLabel>Método de pago</FieldLabel>
          <FormControl fullWidth>
            <Select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))} sx={selectSx}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              {METODOS.map(m => (
                <MenuItem key={m.value} value={m.value} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving || !form.cantidad}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            {saving ? 'Guardando...' : 'Acreditar'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* Barra de uso vs límite del plan (productos/usuarios) — cambia de color
   cuando la empresa se está por quedar sin lugar. */
function BarraLimite({ label, usados, max }) {
  const pct = max ? Math.min(100, Math.round((usados / max) * 100)) : 0;
  const color = pct >= 100 ? ERROR : pct >= 80 ? WARNING : SUCCESS;
  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ color: INK2, fontSize: 12 }}>{label}</Typography>
        <Typography sx={{ color, fontSize: 12, fontWeight: 700 }}>{usados}{max ? ` / ${max}` : ''}</Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: '3px', bgcolor: HOVER, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${max ? pct : 0}%`, bgcolor: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </Box>
    </Box>
  );
}

/* Actividad/salud de la empresa — última venta, ventas del mes, uso vs plan.
   Pensado para detectar clientes inactivos o al borde de su límite. */
function ActividadEmpresa({ actividad }) {
  if (!actividad) return null;
  const sinVentas = !actividad.ultima_venta_fecha;
  const diasSinVender = actividad.ultima_venta_fecha
    ? Math.floor((new Date() - new Date(actividad.ultima_venta_fecha)) / 86400000)
    : null;
  const inactiva = diasSinVender !== null && diasSinVender > 14;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 1.5 }}>Actividad</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <ReceiptLongIcon sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ color: MUTED, fontSize: 11.5 }}>Última venta</Typography>
          </Box>
          {sinVentas ? (
            <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>Sin ventas todavía</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ color: inactiva ? WARNING : INK, fontSize: 13, fontWeight: 700 }}>{fmtDate(actividad.ultima_venta_fecha)}</Typography>
              {inactiva && (
                <Chip label={`${diasSinVender}d sin vender`} size="small"
                  sx={{ bgcolor: WARNING_BG, color: WARNING, fontWeight: 600, fontSize: 10, height: 18, borderRadius: '5px' }} />
              )}
            </Box>
          )}
        </Box>
        <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ color: MUTED, fontSize: 11.5 }}>Ventas este mes</Typography>
          </Box>
          <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700 }}>
            {actividad.ventas_mes.cantidad} · ${Number(actividad.ventas_mes.monto).toLocaleString('es-AR')}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <DescriptionIcon sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ color: MUTED, fontSize: 11.5 }}>Facturas disponibles</Typography>
          </Box>
          <Typography sx={{ color: (actividad.facturas_disponibles ?? 0) > 0 ? INK : WARNING, fontSize: 13, fontWeight: 700 }}>
            {(actividad.facturas_disponibles ?? 0).toLocaleString('es-AR')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.5, display: 'flex', gap: 3 }}>
        <BarraLimite label="Productos" usados={actividad.limites.productos.usados} max={actividad.limites.productos.max} />
        <BarraLimite label="Usuarios" usados={actividad.limites.usuarios.usados} max={actividad.limites.usuarios.max} />
      </Box>
    </Box>
  );
}

/* Modal de detalle de empresa — muestra y gestiona usuarios */
function ModalDetalleEmpresa({ open, empresa: empresaProp, onClose, onUpdated }) {
  const toast = useToast();
  const { impersonarEmpresa } = useAuth();
  const [empresa,      setEmpresa]      = useState(empresaProp);
  const [detalle,      setDetalle]      = useState(null);
  const [loadingDet,   setLoadingDet]   = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [resetUsuario, setResetUsuario] = useState(null);
  const [editUsuario,  setEditUsuario]  = useState(null);
  const [confirmImpersonar, setConfirmImpersonar] = useState(false);
  const [impersonando, setImpersonando] = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [pagoOpen,     setPagoOpen]     = useState(false);
  const [facturasOpen, setFacturasOpen] = useState(false);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [trialMenuAnchor, setTrialMenuAnchor] = useState(null);
  const [confirmSuspender, setConfirmSuspender] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  useEffect(() => { setEmpresa(empresaProp); }, [empresaProp]);

  const cargarDetalle = useCallback(() => {
    if (!empresaProp) return;
    setLoadingDet(true);
    superAdminService.getEmpresa(empresaProp.id)
      .then(data => {
        setDetalle(data);
        // El header (plan/estado/trial) vive del prop original — lo sincronizamos
        // con lo que acaba de devolver el backend para que quede al día después
        // de cualquier acción, sin esperar a que el listado de atrás se refresque.
        setEmpresa(e => ({ ...e, plan: data.plan, trial_ends_at: data.trial_ends_at, suspendida: data.suspendida, owner_email: data.owner_email ?? e?.owner_email }));
        setLoadingDet(false);
      })
      .catch(() => setLoadingDet(false));
  }, [empresaProp]);

  useEffect(() => {
    if (!open || !empresaProp) return;
    cargarDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaProp?.id]);

  // Refresca el detalle de este modal Y avisa al listado de atrás para que
  // no quede desactualizado cuando el usuario lo cierre.
  const refrescar = () => { cargarDetalle(); onUpdated?.(); };

  const handleImpersonar = async () => {
    setImpersonando(true);
    try {
      await impersonarEmpresa(empresa.id, empresa.nombre);
    } catch (e) {
      toast(e.response?.data?.message || 'Error al entrar como esta empresa', 'error');
      setImpersonando(false);
    }
  };

  const handleEliminarUsuario = async () => {
    const uid = usuarioAEliminar?.id;
    if (!uid) return;
    try {
      await superAdminService.eliminarUsuario(uid);
      setDetalle(d => ({ ...d, usuarios: d.usuarios.filter(u => u.id !== uid) }));
      toast('Usuario eliminado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error', 'error');
    }
  };

  const handleToggleAdmin = async (uid) => {
    try {
      const isAdmin = await superAdminService.toggleAdmin(uid);
      setDetalle(d => ({ ...d, usuarios: d.usuarios.map(u => u.id === uid ? { ...u, is_admin: isAdmin } : u) }));
    } catch {
      toast('Error', 'error');
    }
  };

  const handleUsuarioEditado = (data) => {
    const emailAnterior = detalle?.usuarios.find(u => u.id === data.id)?.email;
    setDetalle(d => ({ ...d, usuarios: d.usuarios.map(u => u.id === data.id ? { ...u, nombre: data.nombre, email: data.email } : u) }));
    // Si el editado era el propietario, el header (que compara contra
    // empresa.owner_email) tiene que enterarse del email nuevo también.
    if (emailAnterior && emailAnterior === empresa.owner_email) {
      setEmpresa(e => ({ ...e, owner_email: data.email }));
    }
  };

  const handleExtenderTrial = async (dias) => {
    setTrialMenuAnchor(null);
    try {
      await superAdminService.extenderTrial(empresa.id, dias);
      toast(`Prueba extendida +${dias} días`, 'success');
      refrescar();
    } catch {
      toast('Error al extender la prueba', 'error');
    }
  };

  const handleToggleSuspendida = async () => {
    setSuspendiendo(true);
    try {
      const suspendida = await superAdminService.toggleSuspendida(empresa.id);
      toast(suspendida ? 'Empresa suspendida' : 'Empresa reactivada', suspendida ? 'error' : 'success');
      refrescar();
    } catch {
      toast('Error', 'error');
    } finally {
      setSuspendiendo(false);
    }
  };

  if (!empresa) return null;

  const planColor  = PLAN_COLORS[empresa.plan] ?? PLAN_COLORS.free;
  const trialActivo = empresa.trial_ends_at && new Date(empresa.trial_ends_at) > new Date();
  const diasTrial  = trialActivo ? Math.ceil((new Date(empresa.trial_ends_at) - new Date()) / 86400000) : 0;

  const actionBtnSx = { textTransform: 'none', fontWeight: 600, fontSize: { xs: 11.5, sm: 12.5 }, borderRadius: '8px', px: { xs: 0.8, sm: 1.5 }, py: { xs: 0.55, sm: 0.75 }, minWidth: 0, flexShrink: 0, whiteSpace: 'nowrap', '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } } };
  const actionLabelSx = { display: { xs: 'none', sm: 'inline' } };

  const sectionHeaderSx = { display: 'flex', alignItems: 'center', gap: 0.75, px: 2, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: {
        ...modalPaperSx, borderRadius: '16px', overflow: 'hidden',
        // dvh (no vh) en mobile — Safari cuenta 100vh como si la barra de
        // direcciones/toolbar ya estuviera oculta, así que con vh el modal
        // quedaba más alto que el viewport realmente visible y tapaba el
        // header y el final del contenido sin poder verlos ni scrolleando.
        maxHeight: { xs: '92dvh', sm: 'min(88vh, 760px)' }, display: 'flex', flexDirection: 'column',
      } }}>

      {/* Cabecera (fija) — dos filas fijas en vez de un solo flex-wrap, para que el
          orden (avatar+nombre+cerrar arriba, chips abajo) sea siempre el mismo y no
          dependa de cuánto entre en una sola línea. */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 }, px: { xs: 1.25, sm: 3 }, py: { xs: 0.9, sm: 2 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
          <Box sx={{ width: { xs: 32, sm: 46 }, height: { xs: 32, sm: 46 }, borderRadius: '11px', bgcolor: empresa.suspendida ? `${ERROR}18` : `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {empresa.suspendida
              ? <BlockIcon sx={{ color: ERROR, fontSize: { xs: 16, sm: 23 } }} />
              : <BusinessIcon sx={{ color: P, fontSize: { xs: 16, sm: 23 } }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 19 }, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.nombre}</Typography>
            <Typography sx={{ color: MUTED, fontSize: { xs: 11, sm: 13 }, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.owner_email}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', flexShrink: 0, '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', pl: { xs: '42px', sm: '57px' } }}>
          <Chip label={planEnMayusculas(empresa.plan)} size="small"
            sx={{ bgcolor: planColor.bg, color: planColor.fg, fontWeight: 700, fontSize: 10.5, height: 20, borderRadius: '6px', border: `1px solid ${planColor.border}` }} />
          {empresa.suspendida && (
            <Chip label="Suspendida" size="small" sx={{ bgcolor: ERROR_BG, color: ERROR, fontWeight: 700, fontSize: 10.5, height: 20, borderRadius: '6px' }} />
          )}
          {!empresa.suspendida && trialActivo && (
            <Chip label={`Prueba ${diasTrial}d`} size="small"
              sx={{ bgcolor: WARNING_BG, color: WARNING, fontWeight: 600, fontSize: 10.5, height: 20, borderRadius: '6px' }} />
          )}
        </Box>
      </Box>

      {/* Barra de acciones (fija) — todas las acciones en una sola fila, sin
          wrap: en mobile solo íconos (con tooltip) para ganar espacio, y si
          aun así no entran todas, la fila scrollea horizontalmente en vez de
          partirse en dos líneas. */}
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: { xs: 0.7, sm: 1 }, px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 1.75 }, borderBottom: `1px solid ${BORDER}`, bgcolor: CARD, flexShrink: 0, overflowX: 'auto' }}>
        <Tooltip title="Registrar pago">
          <Button size="small" variant="outlined" startIcon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
            onClick={() => setPagoOpen(true)}
            sx={{ ...actionBtnSx, color: SUCCESS, borderColor: `${SUCCESS}50`, '&:hover': { borderColor: SUCCESS, bgcolor: SUCCESS_BG } }}>
            <Box component="span" sx={actionLabelSx}>Registrar pago</Box>
          </Button>
        </Tooltip>
        <Tooltip title="Acreditar facturas">
          <Button size="small" variant="outlined" startIcon={<DescriptionIcon sx={{ fontSize: 15 }} />}
            onClick={() => setFacturasOpen(true)}
            sx={{ ...actionBtnSx, color: P, borderColor: `${P}50`, '&:hover': { borderColor: P, bgcolor: `${P}14` } }}>
            <Box component="span" sx={actionLabelSx}>Acreditar facturas</Box>
          </Button>
        </Tooltip>
        <Tooltip title="Editar plan">
          <Button size="small" variant="outlined" startIcon={<EditIcon sx={{ fontSize: 15 }} />}
            onClick={() => setEditOpen(true)}
            sx={{ ...actionBtnSx, color: INK2, borderColor: BORDER, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
            <Box component="span" sx={actionLabelSx}>Editar plan</Box>
          </Button>
        </Tooltip>
        {!empresa.suspendida && (
          <Tooltip title="Extender prueba">
            <Button size="small" variant="outlined" startIcon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
              onClick={e => setTrialMenuAnchor(e.currentTarget)}
              sx={{ ...actionBtnSx, color: WARNING, borderColor: `${WARNING}50`, '&:hover': { borderColor: WARNING, bgcolor: WARNING_BG } }}>
              <Box component="span" sx={actionLabelSx}>Extender prueba</Box>
            </Button>
          </Tooltip>
        )}
        <Tooltip title={empresa.suspendida ? 'Reactivar empresa' : 'Suspender empresa'}>
          <span>
            <Button size="small" variant="outlined" disabled={suspendiendo} onClick={() => setConfirmSuspender(true)}
              startIcon={empresa.suspendida ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> : <BlockIcon sx={{ fontSize: 15 }} />}
              sx={{
                ...actionBtnSx, color: empresa.suspendida ? SUCCESS : ERROR, borderColor: empresa.suspendida ? `${SUCCESS}50` : `${ERROR}50`,
                '&:hover': { borderColor: empresa.suspendida ? SUCCESS : ERROR, bgcolor: empresa.suspendida ? SUCCESS_BG : ERROR_BG },
              }}>
              <Box component="span" sx={actionLabelSx}>{empresa.suspendida ? 'Reactivar empresa' : 'Suspender empresa'}</Box>
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Entrar como">
          <span style={{ flexShrink: 0 }}>
            <Button size="small" variant="outlined" startIcon={<LoginIcon sx={{ fontSize: 15 }} />}
              disabled={impersonando} onClick={() => setConfirmImpersonar(true)}
              sx={{ ...actionBtnSx, color: P, borderColor: `${P}50`, '&:hover': { borderColor: P, bgcolor: `${P}12` } }}>
              <Box component="span" sx={actionLabelSx}>Entrar como</Box>
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Menu anchorEl={trialMenuAnchor} open={!!trialMenuAnchor} onClose={() => setTrialMenuAnchor(null)}
        PaperProps={{ sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px' } }}>
        {[7, 15, 30].map(dias => (
          <MenuItem key={dias} onClick={() => handleExtenderTrial(dias)} sx={{ fontSize: 13.5, '&:hover': { bgcolor: HOVER } }}>
            +{dias} días
          </MenuItem>
        ))}
      </Menu>

      {/* Contenido (scrollea) */}
      <DialogContent sx={{ px: { xs: 1.25, sm: 3 }, pt: { xs: 1, sm: 2.5 }, pb: { xs: 1.25, sm: 3 }, flex: 1, overflowY: 'auto' }}>
        <ActividadEmpresa actividad={detalle?.actividad} />

        {loadingDet && (
          <Typography sx={{ color: MUTED, fontSize: 13, py: 3, textAlign: 'center' }}>Cargando...</Typography>
        )}

        {detalle && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
            {/* Usuarios */}
            <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={sectionHeaderSx}>
                <PersonIcon sx={{ fontSize: 16, color: INK2 }} />
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700, flex: 1 }}>
                  Usuarios ({detalle.usuarios.length})
                </Typography>
                <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={() => setUserOpen(true)}
                  sx={{ color: P, textTransform: 'none', fontSize: 12, fontWeight: 600, minWidth: 0, px: 1, '&:hover': { bgcolor: `${P}10` } }}>
                  Agregar
                </Button>
              </Box>

              {detalle.usuarios.length === 0 && (
                <Typography sx={{ color: MUTED, fontSize: 13, p: 2 }}>Sin usuarios</Typography>
              )}
              {detalle.usuarios.map((u, i) => {
                const esPropietario = u.email === empresa.owner_email;
                return (
                  <Box key={u.id} sx={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, px: 2, py: 1.25,
                    borderBottom: i < detalle.usuarios.length - 1 ? `1px solid ${BORDER}` : 'none',
                    ...(esPropietario && { bgcolor: '#f59e0b07' }),
                  }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: esPropietario ? '#f59e0b22' : `${P}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {esPropietario
                        ? <StarIcon sx={{ color: '#f59e0b', fontSize: 15 }} />
                        : <PersonIcon sx={{ color: P, fontSize: 15 }} />}
                    </Box>
                    <Box sx={{ flex: '1 1 140px', minWidth: 0 }}>
                      <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{u.nombre}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        <Typography sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</Typography>
                        <Tooltip title={u.email_verified_at ? 'Email verificado' : 'Todavía no confirmó el email'}>
                          {u.email_verified_at
                            ? <CheckCircleOutlineIcon sx={{ fontSize: 13, color: SUCCESS, flexShrink: 0 }} />
                            : <WatchLaterIcon sx={{ fontSize: 13, color: MUTED, flexShrink: 0 }} />}
                        </Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                      {esPropietario && (
                        <Chip label="Propietario" size="small"
                          icon={<StarIcon style={{ fontSize: 11, color: '#f59e0b' }} />}
                          sx={{ bgcolor: '#f59e0b22', color: '#b45309', fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
                      )}
                      {u.is_admin && !esPropietario && (
                        <Chip label="Admin" size="small"
                          sx={{ bgcolor: '#5c6ef822', color: '#818cf8', fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
                      )}
                      <IconButton size="small" onClick={() => setEditUsuario(u)} title="Editar nombre/email"
                        sx={{ color: MUTED, '&:hover': { color: P } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleToggleAdmin(u.id)}
                        title={u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                        sx={{ color: u.is_admin ? P : MUTED, '&:hover': { color: P } }}>
                        <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setResetUsuario(u)} title="Resetear contraseña"
                        sx={{ color: MUTED, '&:hover': { color: WARNING } }}>
                        <LockResetIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      {!esPropietario && (
                        <IconButton size="small" onClick={() => setUsuarioAEliminar(u)}
                          sx={{ color: MUTED, '&:hover': { color: ERROR } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Sucursales */}
            <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={sectionHeaderSx}>
                <StorefrontIcon sx={{ fontSize: 16, color: INK2 }} />
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 700 }}>
                  Sucursales ({detalle.sucursales.length})
                </Typography>
              </Box>

              {detalle.sucursales.length === 0 && (
                <Typography sx={{ color: MUTED, fontSize: 13, p: 2 }}>Sin sucursales</Typography>
              )}
              {detalle.sucursales.map((s, i) => (
                <Box key={s.id} sx={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, px: 2, py: 1.25,
                  borderBottom: i < detalle.sucursales.length - 1 ? `1px solid ${BORDER}` : 'none',
                  opacity: s.activo ? 1 : 0.6,
                }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: `${P}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StorefrontIcon sx={{ color: P, fontSize: 15 }} />
                  </Box>
                  <Box sx={{ flex: '1 1 140px', minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600 }}>{s.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.direccion || 'Sin dirección'} · {s.productos_con_stock} producto{s.productos_con_stock !== 1 ? 's' : ''} con stock
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                    {s.es_principal && (
                      <Chip label="Principal" size="small"
                        sx={{ bgcolor: `${P}22`, color: P, fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
                    )}
                    {!s.activo && (
                      <Chip label="Inactiva" size="small" sx={{ bgcolor: ERROR_BG, color: ERROR, fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <ModalNuevoUsuario open={userOpen} empresa={empresa} onClose={() => setUserOpen(false)}
        onCreated={u => setDetalle(d => d ? { ...d, usuarios: [...d.usuarios, u] } : d)} />
      <ModalResetPassword open={!!resetUsuario} usuario={resetUsuario} onClose={() => setResetUsuario(null)} />
      <ModalEditarUsuario open={!!editUsuario} usuario={editUsuario} onClose={() => setEditUsuario(null)} onSaved={handleUsuarioEditado} />
      <ConfirmDialog open={confirmImpersonar} onClose={() => setConfirmImpersonar(false)} onConfirm={handleImpersonar}
        title="¿Entrar como esta empresa?"
        message={`Vas a iniciar sesión como el usuario de "${empresa.nombre}" para dar soporte. Podés volver a tu sesión de Super Admin en cualquier momento desde el aviso que va a quedar fijo arriba de la pantalla.`}
        confirmLabel="Entrar" />
      <ModalEditEmpresa open={editOpen} empresa={empresa} onClose={() => setEditOpen(false)} onSaved={refrescar} />
      <ModalRegistrarPago open={pagoOpen} empresa={empresa} onClose={() => setPagoOpen(false)} onRegistrado={refrescar} />
      <ModalAcreditarFacturas open={facturasOpen} empresa={empresa} onClose={() => setFacturasOpen(false)} onAcreditado={refrescar} />
      <ConfirmDialog open={confirmSuspender} onClose={() => setConfirmSuspender(false)} onConfirm={handleToggleSuspendida}
        title={empresa.suspendida ? '¿Reactivar esta empresa?' : '¿Suspender esta empresa?'}
        message={empresa.suspendida
          ? `"${empresa.nombre}" va a recuperar el acceso al sistema de inmediato.`
          : `"${empresa.nombre}" va a perder el acceso al sistema hasta que la reactives. Podés reactivarla en cualquier momento.`}
        confirmLabel={empresa.suspendida ? 'Reactivar' : 'Suspender'} />
      <ConfirmDialog open={!!usuarioAEliminar} onClose={() => setUsuarioAEliminar(null)} onConfirm={handleEliminarUsuario}
        title="¿Eliminar este usuario?"
        message={`"${usuarioAEliminar?.nombre}" va a perder el acceso al sistema.`}
        confirmLabel="Eliminar" />
    </Dialog>
  );
}

// Fila con una columna de Acciones para lo más frecuente (ver, suspender,
// editar plan, entrar como) sin abrir el modal — que sigue teniendo estas
// mismas acciones más "Registrar pago" y "Extender prueba" para cuando ya
// estás mirando el detalle completo.
function EmpresaRow({ empresa: empresaProp, onDetalle, onUpdated }) {
  const toast = useToast();
  const { impersonarEmpresa } = useAuth();
  const [empresa,      setEmpresa]      = useState(empresaProp);
  useEffect(() => { setEmpresa(empresaProp); }, [empresaProp]);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [confirmImpersonar, setConfirmImpersonar] = useState(false);
  const [impersonando, setImpersonando] = useState(false);
  const [confirmSuspender, setConfirmSuspender] = useState(false);

  const handleToggleSuspendida = async () => {
    setSuspendiendo(true);
    try {
      const suspendida = await superAdminService.toggleSuspendida(empresa.id);
      setEmpresa(e => ({ ...e, suspendida }));
      toast(suspendida ? 'Empresa suspendida' : 'Empresa reactivada', suspendida ? 'error' : 'success');
      onUpdated?.();
    } catch {
      toast('Error', 'error');
    } finally {
      setSuspendiendo(false);
    }
  };

  const handleImpersonar = async () => {
    setImpersonando(true);
    try {
      await impersonarEmpresa(empresa.id, empresa.nombre);
    } catch (e) {
      toast(e.response?.data?.message || 'Error al entrar como esta empresa', 'error');
      setImpersonando(false);
    }
  };

  const planColor    = PLAN_COLORS[empresa.plan] ?? PLAN_COLORS.free;
  const trialActivo  = empresa.trial_ends_at && new Date(empresa.trial_ends_at) > new Date();
  const trialVencido = empresa.trial_ends_at && new Date(empresa.trial_ends_at) <= new Date();
  const iconBtnSx = { p: '6px', borderRadius: '7px' };
  const { label: rubroLabel, Icon: RubroIcon } = rubroMeta(empresa.tipo);

  return (
    <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', bgcolor: CARD }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.25, sm: 2 }, p: 2, opacity: empresa.suspendida ? 0.65 : 1, '&:hover': { bgcolor: HOVER } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: empresa.suspendida ? `${ERROR}18` : `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {empresa.suspendida ? <BlockIcon sx={{ color: ERROR, fontSize: 18 }} /> : <BusinessIcon sx={{ color: P, fontSize: 18 }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>{empresa.nombre}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {empresa.owner_email} · {empresa.usuarios_count} usuario{empresa.usuarios_count !== 1 ? 's' : ''} · {empresa.sucursales_count} sucursal{empresa.sucursales_count !== 1 ? 'es' : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          <Chip icon={<RubroIcon sx={{ fontSize: '15px !important', color: `${INK2} !important` }} />} label={rubroLabel} size="small"
            sx={{ bgcolor: HOVER, color: INK2, fontWeight: 600, fontSize: 11, borderRadius: '6px', border: `1px solid ${BORDER}` }} />
          <Chip label={planEnMayusculas(empresa.plan)} size="small"
            sx={{ bgcolor: planColor.bg, color: planColor.fg, fontWeight: 700, fontSize: 11, borderRadius: '6px', border: `1px solid ${planColor.border}` }} />
          {empresa.suspendida && (
            <Chip label="Suspendida" size="small" sx={{ bgcolor: ERROR_BG, color: ERROR, fontWeight: 700, fontSize: 11, borderRadius: '6px' }} />
          )}
          {!empresa.suspendida && trialActivo && (
            <Chip label={`Prueba ${Math.ceil((new Date(empresa.trial_ends_at) - new Date()) / 86400000)}d`} size="small"
              sx={{ bgcolor: WARNING_BG, color: WARNING, fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
          )}
          {!empresa.suspendida && trialVencido && (
            <Chip label="Prueba vencida" size="small" sx={{ bgcolor: ERROR_BG, color: ERROR, fontWeight: 600, fontSize: 11, borderRadius: '6px' }} />
          )}
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-end', sm: 'flex-start' }, gap: 0.25, flexShrink: 0, pl: { xs: 0, sm: 1 }, borderLeft: { xs: 'none', sm: `1px solid ${BORDER}` } }}>
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => onDetalle(empresa)} sx={{ ...iconBtnSx, color: MUTED, '&:hover': { color: P, bgcolor: `${P}14` } }}>
              <VisibilityIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={empresa.suspendida ? 'Reactivar empresa' : 'Suspender empresa'}>
            <span>
              <IconButton size="small" disabled={suspendiendo} onClick={() => setConfirmSuspender(true)}
                sx={{ ...iconBtnSx, color: empresa.suspendida ? SUCCESS : ERROR, '&:hover': { bgcolor: empresa.suspendida ? SUCCESS_BG : ERROR_BG } }}>
                {empresa.suspendida ? <CheckCircleOutlineIcon sx={{ fontSize: 17 }} /> : <BlockIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Editar plan">
            <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ ...iconBtnSx, color: MUTED, '&:hover': { color: INK, bgcolor: HOVER } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Entrar como (soporte)">
            <span>
              <IconButton size="small" disabled={impersonando} onClick={() => setConfirmImpersonar(true)}
                sx={{ ...iconBtnSx, color: MUTED, '&:hover': { color: P, bgcolor: `${P}14` } }}>
                <LoginIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <ModalEditEmpresa open={editOpen} empresa={empresa} onClose={() => setEditOpen(false)}
        onSaved={() => { onUpdated?.(); }} />
      <ConfirmDialog open={confirmImpersonar} onClose={() => setConfirmImpersonar(false)} onConfirm={handleImpersonar}
        title="¿Entrar como esta empresa?"
        message={`Vas a iniciar sesión como el usuario de "${empresa.nombre}" para dar soporte. Podés volver a tu sesión de Super Admin en cualquier momento desde el aviso que va a quedar fijo arriba de la pantalla.`}
        confirmLabel="Entrar" />
      <ConfirmDialog open={confirmSuspender} onClose={() => setConfirmSuspender(false)} onConfirm={handleToggleSuspendida}
        title={empresa.suspendida ? '¿Reactivar esta empresa?' : '¿Suspender esta empresa?'}
        message={empresa.suspendida
          ? `"${empresa.nombre}" va a recuperar el acceso al sistema de inmediato.`
          : `"${empresa.nombre}" va a perder el acceso al sistema hasta que la reactives. Podés reactivarla en cualquier momento.`}
        confirmLabel={empresa.suspendida ? 'Reactivar' : 'Suspender'} />
    </Box>
  );
}

const PLAN_LABELS = { free: 'Gratis', esencial: 'Esencial', pro: 'Pro', ia: 'IA' };

function TabAlertas() {
  const toast = useToast();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getAlertasTrial()
      .then(setAlertas)
      .catch(() => toast('Error al cargar alertas', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Typography sx={{ color: MUTED, py: 4, textAlign: 'center' }}>Cargando...</Typography>;

  if (alertas.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: `${SUCCESS}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <CheckCircleOutlineIcon sx={{ color: SUCCESS, fontSize: 28 }} />
        </Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Sin alertas</Typography>
        <Typography sx={{ color: MUTED, fontSize: 14 }}>No hay pruebas que venzan en los próximos 3 días.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {alertas.map(a => {
        const urgente = a.dias_restantes <= 1;
        return (
          <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: urgente ? `${ERROR}08` : `${WARNING}08`, border: `1px solid ${urgente ? ERROR : WARNING}30`, borderRadius: '12px' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: urgente ? `${ERROR}18` : `${WARNING}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmberIcon sx={{ color: urgente ? ERROR : WARNING, fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{a.nombre}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12 }}>{a.owner_email}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip label={`Vence en ${a.dias_restantes}d`} size="small"
                sx={{ bgcolor: urgente ? ERROR_BG : WARNING_BG, color: urgente ? ERROR : WARNING, fontWeight: 700, fontSize: 12, borderRadius: '6px' }} />
              <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.5 }}>{fmtDate(a.trial_ends_at)}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function TabHistorialPagos() {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [pagos,   setPagos]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getHistorialPagos()
      .then(setPagos)
      .catch(() => toast('Error al cargar historial de pagos', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Typography sx={{ color: MUTED, py: 6, textAlign: 'center', fontSize: 14 }}>Cargando...</Typography>;

  if (pagos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: 'linear-gradient(135deg, #6366f114 0%, #6366f108 100%)', border: '1px solid #6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
          <PaymentsIcon sx={{ color: P, fontSize: 28 }} />
        </Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Sin pagos registrados</Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.5 }}>Ejecutá <Box component="code" sx={{ bgcolor: HOVER, px: 1, py: 0.25, borderRadius: '4px', fontSize: 12 }}>php artisan db:seed --class=PagosDemoSeeder</Box> para generar datos de prueba.</Typography>
      </Box>
    );
  }

  const totalRecaudado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const esteMes = pagos.filter(p => new Date(p.fecha).getMonth() === new Date().getMonth()).reduce((s, p) => s + (Number(p.monto) || 0), 0);

  return (
    <Box>
      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Box sx={{ bgcolor: `${SUCCESS}06`, border: `1px solid ${SUCCESS}20`, borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>Total recaudado</Typography>
          <Typography sx={{ color: SUCCESS, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>${totalRecaudado.toLocaleString('es-AR')}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.25 }}>{pagos.length} pagos registrados</Typography>
        </Box>
        <Box sx={{ bgcolor: `${P}06`, border: `1px solid ${P}20`, borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>Este mes</Typography>
          <Typography sx={{ color: P, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>${esteMes.toLocaleString('es-AR')}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.25 }}>Recaudación del mes en curso</Typography>
        </Box>
      </Box>

      {/* Tabla */}
      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, bgcolor: TABLE_HEADER, borderBottom: `2px solid ${BORDER}` }}>
            <Typography sx={{ flex: 1, color: INK, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</Typography>
            <Typography sx={{ width: 160, flexShrink: 0, color: INK, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Plan</Typography>
            <Typography sx={{ width: 100, flexShrink: 0, color: INK, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Monto</Typography>
            <Typography sx={{ width: 100, flexShrink: 0, color: INK, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Fecha</Typography>
          </Box>
        )}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {pagos.map((p, i) => {
            const esPack = p.tipo === 'pack';
            const pc = PLAN_COLORS[p.plan] ?? PLAN_COLORS.free;
            const ac = PLAN_COLORS[p.plan_anterior] ?? PLAN_COLORS.free;
            const esMejora = !esPack && p.plan_anterior && p.plan_anterior !== p.plan;

            // Chip de "qué se pagó" — packs de facturación no tienen plan
            // anterior/nuevo, se muestran con su propia etiqueta neutra.
            const chipTipo = esPack ? (
              <Chip label={p.pack_label} size="small" sx={{ bgcolor: `${P}18`, color: P, fontSize: 10, fontWeight: 700, height: 18, borderRadius: '4px' }} />
            ) : esMejora ? (
              <>
                <Chip label={PLAN_LABELS[p.plan_anterior] || p.plan_anterior} size="small" sx={{ bgcolor: ac.bg, color: ac.fg, fontSize: 10, fontWeight: 600, height: 18, borderRadius: '4px' }} />
                <ArrowForwardIcon sx={{ color: MUTED, fontSize: 10 }} />
                <Chip label={PLAN_LABELS[p.plan] || p.plan} size="small" sx={{ bgcolor: pc.bg, color: pc.fg, fontSize: 10, fontWeight: 700, height: 18, borderRadius: '4px' }} />
              </>
            ) : (
              <>
                <Chip label={PLAN_LABELS[p.plan] || p.plan} size="small" sx={{ bgcolor: pc.bg, color: pc.fg, fontSize: 10, fontWeight: 700, height: 18, borderRadius: '4px' }} />
                {p.ciclo && <Typography sx={{ color: MUTED, fontSize: 11 }}>{p.ciclo}</Typography>}
              </>
            );
            const descripcionTipo = esPack ? 'Pack de facturas' : esMejora ? 'Mejora de plan' : 'Renovación';

            if (isMobile) {
              return (
                <Box key={p.id} sx={{ px: 2, py: 1.5, borderBottom: i < pagos.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, minWidth: 0 }}>{p.empresa_nombre}</Typography>
                    <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      ${Number(p.monto || 0).toLocaleString('es-AR')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {chipTipo}
                    </Box>
                    <Typography sx={{ color: MUTED, fontSize: 11.5, flexShrink: 0 }}>
                      {descripcionTipo} · {fmtDate(p.fecha)}
                    </Typography>
                  </Box>
                </Box>
              );
            }

            return (
              <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, borderBottom: i < pagos.length - 1 ? `1px solid ${BORDER}` : 'none', '&:hover': { bgcolor: HOVER }, transition: 'background 0.15s' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5 }}>{p.empresa_nombre}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    {chipTipo}
                  </Box>
                </Box>
                <Typography sx={{ width: 160, flexShrink: 0, color: INK2, fontSize: 12.5, textAlign: 'center' }}>
                  {descripcionTipo}
                </Typography>
                <Typography sx={{ width: 100, flexShrink: 0, color: SUCCESS, fontWeight: 700, fontSize: 14, textAlign: 'right' }}>
                  ${Number(p.monto || 0).toLocaleString('es-AR')}
                </Typography>
                <Typography sx={{ width: 100, flexShrink: 0, color: MUTED, fontSize: 12.5, textAlign: 'right' }}>
                  {fmtDate(p.fecha)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

const ACCION_LABELS = {
  suspender: 'Suspendió la empresa',
  reactivar: 'Reactivó la empresa',
  extender_prueba: 'Extendió la prueba',
  editar_plan: 'Editó el plan',
  registrar_pago: 'Registró un pago',
  crear_usuario: 'Creó un usuario',
  eliminar_usuario: 'Eliminó un usuario',
  otorgar_admin: 'Otorgó admin',
  quitar_admin: 'Quitó admin',
  resetear_password: 'Reseteó una contraseña',
  impersonar: 'Entró como soporte',
};

const ACCION_COLORS = {
  suspender: ERROR, reactivar: SUCCESS, extender_prueba: WARNING, editar_plan: P,
  registrar_pago: SUCCESS, crear_usuario: P, eliminar_usuario: ERROR,
  otorgar_admin: P, quitar_admin: MUTED, resetear_password: WARNING, impersonar: P,
};

const ACCION_ICONS = {
  suspender: BlockIcon, reactivar: CheckCircleOutlineIcon, extender_prueba: AccessTimeIcon,
  editar_plan: EditIcon, registrar_pago: AttachMoneyIcon, crear_usuario: PersonIcon,
  eliminar_usuario: DeleteOutlineIcon, otorgar_admin: AdminPanelSettingsIcon, quitar_admin: AdminPanelSettingsIcon,
  resetear_password: LockResetIcon, impersonar: LoginIcon,
};

/* Registro de auditoría — qué hizo el super admin y cuándo, para no
   depender de la memoria cuando hay que revisar por qué se tomó una
   decisión sobre una empresa. */
function TabActividad({ empresas = [] }) {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    setLoading(true);
    superAdminService.getActividad({
      empresa_id: filtroEmpresa || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    })
      .then(setLogs)
      .catch(() => toast('Error al cargar la actividad', 'error'))
      .finally(() => setLoading(false));
  }, [toast, filtroEmpresa, desde, hasta]);

  const hayFiltros = Boolean(filtroEmpresa || desde || hasta);
  const limpiarFiltros = () => { setFiltroEmpresa(''); setDesde(''); setHasta(''); };

  const filtros = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end', mb: 2.5 }}>
      <Box sx={{ minWidth: 200 }}>
        <FieldLabel>Empresa</FieldLabel>
        <FormControl fullWidth>
          <Select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} displayEmpty sx={selectSx}
            MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK, maxHeight: 300 } } }}
            renderValue={(v) => v ? (empresas.find(e => e.id === v)?.nombre || v) : <Box sx={{ color: MUTED }}>Todas las empresas</Box>}>
            <MenuItem value="" sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>Todas las empresas</MenuItem>
            {empresas.map(e => (
              <MenuItem key={e.id} value={e.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{e.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ minWidth: 150 }}>
        <FieldLabel>Desde</FieldLabel>
        <TextField fullWidth type="date" value={desde} onChange={e => setDesde(e.target.value)} sx={fieldSx} InputLabelProps={{ shrink: true }} />
      </Box>
      <Box sx={{ minWidth: 150 }}>
        <FieldLabel>Hasta</FieldLabel>
        <TextField fullWidth type="date" value={hasta} onChange={e => setHasta(e.target.value)} sx={fieldSx} InputLabelProps={{ shrink: true }} />
      </Box>
      {hayFiltros && (
        <Button onClick={limpiarFiltros} sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 13, mb: 0.25, '&:hover': { color: INK, bgcolor: HOVER } }}>
          Limpiar
        </Button>
      )}
    </Box>
  );

  if (loading) return (
    <Box>
      {filtros}
      <Typography sx={{ color: MUTED, py: 4, textAlign: 'center' }}>Cargando...</Typography>
    </Box>
  );

  if (logs.length === 0) {
    return (
      <Box>
        {filtros}
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <ReceiptLongIcon sx={{ color: P, fontSize: 28 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>
            {hayFiltros ? 'Sin resultados para este filtro' : 'Sin actividad todavía'}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>
            {hayFiltros ? 'Probá con otra empresa o rango de fechas.' : 'Las acciones que hagas sobre las empresas van a quedar registradas acá.'}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {filtros}
      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
      {logs.map((l, i) => {
        const color = ACCION_COLORS[l.accion] ?? MUTED;
        const Icon  = ACCION_ICONS[l.accion] ?? ReceiptLongIcon;
        return (
          <Box key={l.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.75, borderBottom: i < logs.length - 1 ? `1px solid ${BORDER}` : 'none', '&:hover': { bgcolor: HOVER } }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon sx={{ color, fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5 }}>
                {ACCION_LABELS[l.accion] ?? l.accion}
                {l.empresa_nombre && <Box component="span" sx={{ color: MUTED, fontWeight: 400 }}> · {l.empresa_nombre}</Box>}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.super_admin_email}{l.detalle ? ` · ${l.detalle}` : ''}
              </Typography>
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 12, flexShrink: 0, textAlign: 'right' }}>
              {fmtDate(l.fecha)}<br />{fmtTime(l.fecha)}
            </Typography>
          </Box>
        );
      })}
      </Box>
    </Box>
  );
}

function TabIngresos() {
  const toast = useToast();
  const [ingresos, setIngresos] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    superAdminService.getIngresos()
      .then(setIngresos)
      .catch(() => { toast('Error al cargar ingresos', 'error'); setIngresos(null); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Typography sx={{ color: MUTED, py: 4, textAlign: 'center' }}>Cargando...</Typography>;
  if (!ingresos) return <Typography sx={{ color: MUTED, py: 4, textAlign: 'center' }}>No se pudo cargar</Typography>;

  const mr = ingresos.mrr_total || 0;
  const planes = Object.keys(ingresos.mrr_por_plan || {});
  const topPlan = planes.sort((a, b) => (ingresos.mrr_por_plan[b] || 0) - (ingresos.mrr_por_plan[a] || 0))[0];
  const totalEmpresas = Object.values(ingresos.empresas_por_plan || {}).reduce((a, b) => a + b, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Ingresos</Typography>
        <Button size="small" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />} onClick={() => {
          exportarExcel({
            filename: 'ingresos-superadmin.xlsx',
            title: 'Ingresos por Plan',
            subtitle: `Ingreso mensual: $${mr.toLocaleString('es-AR')}`,
            columns: [
              { header: 'Plan', width: 20 },
              { header: 'Empresas', width: 12, align: 'center' },
              { header: 'Ingreso mensual', width: 18, numFmt: '$#,##0' },
            ],
            rows: Object.entries(ingresos.mrr_por_plan).map(([plan, monto]) => [PLAN_LABELS[plan] || plan, ingresos.empresas_por_plan[plan] || 0, monto]),
          });
        }}
          sx={{ color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '8px', border: `1px solid ${BORDER}`, px: 1.5, '&:hover': { bgcolor: HOVER } }}>
          Exportar Excel
        </Button>
      </Box>

      {/* KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Box sx={{ bgcolor: `${SUCCESS}06`, border: `1px solid ${SUCCESS}20`, borderRadius: '14px', p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUpIcon sx={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 600 }}>Ingreso mensual</Typography>
          </Box>
          <Typography sx={{ color: SUCCESS, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>${mr.toLocaleString('es-AR')}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>{totalEmpresas} empresas activas</Typography>
        </Box>
        <Box sx={{ bgcolor: `${P}06`, border: `1px solid ${P}20`, borderRadius: '14px', p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StarIcon sx={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 600 }}>Plan lider</Typography>
          </Box>
          <Typography sx={{ color: P, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>
            {topPlan ? PLAN_LABELS[topPlan] || topPlan : '—'}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>
            {topPlan ? `$${(ingresos.mrr_por_plan[topPlan] || 0).toLocaleString('es-AR')} por mes` : 'Sin datos'}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: `${WARNING}06`, border: `1px solid ${WARNING}20`, borderRadius: '14px', p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PaymentsIcon sx={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 600 }}>Ingreso anual estimado</Typography>
          </Box>
          <Typography sx={{ color: WARNING, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>
            ${(mr * 12).toLocaleString('es-AR')}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.25 }}>Proyección a 12 meses del ingreso mensual actual</Typography>
        </Box>
      </Box>

      {/* Ingreso mensual por plan */}
      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', p: 2.5, mb: 3 }}>
        <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 600, mb: 2 }}>Desglose por plan</Typography>
        {planes.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ color: MUTED, fontSize: 13 }}>Ejecutá <Box component="code" sx={{ bgcolor: HOVER, px: 1, py: 0.25, borderRadius: '4px', fontSize: 12 }}>php artisan db:seed --class=PagosDemoSeeder</Box></Typography>
          </Box>
        ) : (
          planes.map(p => {
            const pc = PLAN_COLORS[p] ?? PLAN_COLORS.free;
            const monto = ingresos.mrr_por_plan[p] || 0;
            const empresas = ingresos.empresas_por_plan[p] || 0;
            const pct = mr > 0 ? Math.round((monto / mr) * 100) : 0;
            return (
              <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: planes.indexOf(p) < planes.length - 1 ? 1.5 : 0 }}>
                <Box sx={{ width: 90, flexShrink: 0 }}>
                  <Chip label={PLAN_LABELS[p] || p} size="small" sx={{ bgcolor: pc.bg, color: pc.fg, fontWeight: 700, fontSize: 11, borderRadius: '6px' }} />
                </Box>
                <Box sx={{ flex: 1, height: 10, borderRadius: '5px', bgcolor: HOVER, overflow: 'hidden', position: 'relative' }}>
                  <Box sx={{ height: '100%', width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${pc.fg}, ${pc.fg}dd)`, borderRadius: '5px', transition: 'width 0.5s ease' }} />
                </Box>
                <Typography sx={{ width: 140, flexShrink: 0, textAlign: 'right', color: INK2, fontSize: 13, fontWeight: 600 }}>
                  ${monto.toLocaleString('es-AR')}
                  <Box component="span" sx={{ color: MUTED, fontWeight: 400, fontSize: 12, ml: 0.5 }}>· {empresas} emp.</Box>
                </Typography>
              </Box>
            );
          })
        )}
      </Box>

      {/* Tendencia */}
      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', p: 2.5 }}>
        <Typography sx={{ color: INK2, fontSize: 12, fontWeight: 600, mb: 2 }}>Ingresos cobrados por mes</Typography>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ingresos.tendencia_mensual} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
            <ReTooltip formatter={(v) => [`$${Number(v).toLocaleString('es-AR')}`, '']} labelFormatter={fmtMes} contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: 12 }} />
            <Bar dataKey="monto" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={40}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P} stopOpacity={1} />
                  <stop offset="100%" stopColor={P} stopOpacity={0.5} />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export default function SuperAdmin() {
  const { user }  = useAuth();
  const toast = useToast();
  const [tab,      setTab]     = useState(0);
  const [empresas, setEmpresas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [pagina,   setPagina]   = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalEmpresa, setModalEmpresa] = useState(null);
  const [modalType,    setModalType]    = useState(null); // 'detalle' — el resto de las acciones vive dentro de ese modal
  const [filtroRapido, setFiltroRapido] = useState(null);
  const [filtroRubro,  setFiltroRubro]  = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getEmpresas();
      setEmpresas(data);
    } catch { toast('Error al cargar empresas', 'error'); } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPagina(1); }, [search, filtroRapido, filtroRubro]);

  if (!user?.is_super_admin) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: BG }}>
        <Typography sx={{ color: MUTED }}>Acceso denegado</Typography>
      </Box>
    );
  }

  const filtered = (() => {
    let list = empresas;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.nombre?.toLowerCase().includes(q) || e.owner_email?.toLowerCase().includes(q) || e.plan?.toLowerCase().includes(q));
    }
    if (filtroRapido === 'plan') list = list.filter(e => e.plan !== 'free');
    if (filtroRapido === 'trial') list = list.filter(e => e.trial_ends_at && new Date(e.trial_ends_at) > new Date());
    if (filtroRapido === 'susp') list = list.filter(e => e.suspendida);
    if (filtroRubro) list = list.filter(e => (e.tipo ?? null) === filtroRubro || (filtroRubro === 'otro' && !RUBRO_META[e.tipo]));
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);

  const exportarClientes = () => {
    exportarExcel({
      filename: 'clientes-superadmin.xlsx',
      title: 'Directorio de Empresas',
      columns: [
        { header: 'Empresa', width: 28 },
        { header: 'Rubro', width: 16 },
        { header: 'Email', width: 28 },
        { header: 'Plan', width: 12, align: 'center' },
        { header: 'Usuarios', width: 10, align: 'center' },
        { header: 'Sucursales', width: 12, align: 'center' },
        { header: 'Estado', width: 12, align: 'center' },
        { header: 'Vence prueba', width: 16 },
      ],
      rows: filtered.map(e => [
        e.nombre, rubroMeta(e.tipo).label, e.owner_email, planEnMayusculas(e.plan),
        e.usuarios_count ?? 0, e.sucursales_count ?? 0,
        e.suspendida ? 'Suspendida' : (e.trial_ends_at && new Date(e.trial_ends_at) <= new Date() ? 'Prueba vencida' : 'Activa'),
        e.trial_ends_at ? fmtDate(e.trial_ends_at) : '—',
      ]),
    });
  };

  const stats = {
    total:       empresas.length,
    activos:     empresas.filter(e => e.plan !== 'free').length,
    trials:      empresas.filter(e => e.trial_ends_at && new Date(e.trial_ends_at) > new Date()).length,
    suspendidas: empresas.filter(e => e.suspendida).length,
  };

  const trialesUrgentes = empresas.filter(e =>
    e.trial_ends_at && new Date(e.trial_ends_at) > new Date() &&
    Math.ceil((new Date(e.trial_ends_at) - new Date()) / 86400000) <= 3
  ).length;

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG }}>
      {/* ── Header ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${P} 0%, ${P}dd 40%, #1e1b4b 100%)`,
        px: { xs: 2.5, md: 3 }, py: { xs: 1.5, md: 1.75 },
        borderBottom: `1px solid ${P}30`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: 16, md: 18 }, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Panel Super Admin</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, lineHeight: 1.2 }}>
                Gestión global de clientes del sistema
              </Typography>
            </Box>
          </Box>
          <AyudaButton />
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {[
            { label: 'Total clientes',  value: stats.total,       icon: BusinessIcon,   color: '#818cf8', gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' },
            { label: 'Planes pagos',    value: stats.activos,     icon: StarIcon,       color: SUCCESS,   gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
            { label: 'Pruebas activas', value: stats.trials,      icon: AccessTimeIcon, color: WARNING,   gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
            { label: 'Suspendidas',     value: stats.suspendidas, icon: BlockIcon,      color: ERROR,     gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' },
          ].map((s) => (
            <Box key={s.label}
              sx={{
                bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', p: 2.5,
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.2s', cursor: 'default',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${s.color}20` },
              }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: s.gradient, opacity: 0.08 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 46, height: 46, borderRadius: '14px', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${s.color}30` }}>
                  <s.icon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ color: s.color, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.5 }}>{s.label}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 1px 3px rgba(0,0,0,0.04)` }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${BORDER}`, minHeight: 48,
              '& .MuiTabs-indicator': { bgcolor: P, height: 3, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13.5, color: MUTED, minHeight: 48, py: 0, transition: 'all 0.2s', '&:hover': { color: INK, bgcolor: `${HOVER}40` } },
              '& .Mui-selected': { color: P, fontWeight: 700 },
            }}>
            <Tab label="Clientes" />
            <Tab label={trialesUrgentes > 0 ? `Alertas (${trialesUrgentes})` : 'Alertas'}
              sx={{ '& .MuiBadge-badge': { bgcolor: ERROR } }} />
            <Tab label="Ingresos" />
            <Tab label="Historial" />
            <Tab label="Actividad" />
          </Tabs>

          <Box sx={{ p: 2.5 }}>
            {tab === 0 && (
            <>
              <TextField fullWidth placeholder="Buscar empresa, email o plan..."
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
                  '& .MuiInputBase-input': { py: '12px', px: '14px' },
                  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Typography sx={{ color: MUTED, fontSize: 13 }}>{filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {[{ key: null, label: 'Todas' }, { key: 'plan', label: 'Plan pago' }, { key: 'trial', label: 'En prueba' }, { key: 'susp', label: 'Suspendidas' }].map(f => (
                      <Chip key={f.label} label={f.label} size="small" onClick={() => setFiltroRapido(f.key)}
                        sx={{ fontSize: 11, fontWeight: 600, borderRadius: '6px', cursor: 'pointer',
                          bgcolor: filtroRapido === f.key ? `${P}18` : HOVER, color: filtroRapido === f.key ? P : MUTED,
                          border: `1px solid ${filtroRapido === f.key ? `${P}40` : BORDER}`,
                          '&:hover': { bgcolor: `${P}18`, color: P },
                        }} />
                    ))}
                  </Box>
                  {filtered.length > 0 && (
                    <Button size="small" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />} onClick={exportarClientes}
                      sx={{ color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '8px', border: `1px solid ${BORDER}`, px: 1.5, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '&:hover': { bgcolor: HOVER } }}>
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar Excel</Box>
                    </Button>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip label="Todos los rubros" size="small" onClick={() => setFiltroRubro(null)}
                  sx={{ fontSize: 11, fontWeight: 600, borderRadius: '6px', cursor: 'pointer',
                    bgcolor: !filtroRubro ? `${P}18` : HOVER, color: !filtroRubro ? P : MUTED,
                    border: `1px solid ${!filtroRubro ? `${P}40` : BORDER}`,
                    '&:hover': { bgcolor: `${P}18`, color: P },
                  }} />
                {Object.entries(RUBRO_META).map(([key, { label, Icon }]) => (
                  <Chip key={key} icon={<Icon sx={{ fontSize: '14px !important', color: `${filtroRubro === key ? P : MUTED} !important` }} />}
                    label={label} size="small" onClick={() => setFiltroRubro(key)}
                    sx={{ fontSize: 11, fontWeight: 600, borderRadius: '6px', cursor: 'pointer',
                      bgcolor: filtroRubro === key ? `${P}18` : HOVER, color: filtroRubro === key ? P : MUTED,
                      border: `1px solid ${filtroRubro === key ? `${P}40` : BORDER}`,
                      '&:hover': { bgcolor: `${P}18`, color: P },
                    }} />
                ))}
              </Box>
              {loading && <Typography sx={{ color: MUTED, textAlign: 'center', py: 4 }}>Cargando empresas...</Typography>}
              {!loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {paged.length === 0 && <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: MUTED }}>No hay resultados</Typography></Box>}
                  {paged.map(e => <EmpresaRow key={e.id} empresa={e}
                    onDetalle={emp => { setModalEmpresa(emp); setModalType('detalle'); }}
                    onUpdated={cargar}
                  />)}
                </Box>
              )}
              {filtered.length > pageSize && (
                <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="empresas" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
              )}
            </>
          )}
          {tab === 1 && <TabAlertas />}
          {tab === 2 && <TabIngresos />}
          {tab === 3 && <TabHistorialPagos />}
          {tab === 4 && <TabActividad empresas={empresas} />}
        </Box>

        <ModalDetalleEmpresa open={modalType === 'detalle'} empresa={modalEmpresa} onClose={() => { setModalEmpresa(null); setModalType(null); }} onUpdated={cargar} />
      </Box>
      </Box>
    </Box>
  );
}
