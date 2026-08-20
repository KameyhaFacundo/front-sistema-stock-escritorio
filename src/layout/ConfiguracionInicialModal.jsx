import { useEffect, useRef, useState, useContext } from 'react';
import {
  Avatar, Box, Button, CircularProgress, Dialog, DialogContent,
  InputAdornment, TextField, Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AuthContext } from '../auth/AuthContextBase';
import { usuariosService } from '../services/usuariosService';
import { empresaService } from '../services/empresaService';
import { useToast } from '../context/ToastContext';
import {
  BORDER, CARD, INK, INK2, INPUT, MUTED, P, P_HOVER, fieldSx,
} from '../theme/tokens';

export default function ConfiguracionInicialModal({ open }) {
  const { user, setToken, setUser, setMyPermisos, recargarPermisos } = useContext(AuthContext);
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ nombreNegocio: '', nombreUsuario: '', email: '', password: '', confirmar: '' });
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm(current => ({
      ...current,
      nombreNegocio: user.empresa?.nombre || '',
      nombreUsuario: user.des_usu || '',
      email: '',
    }));
  }, [user]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (key) => (event) => setForm(current => ({ ...current, [key]: event.target.value }));

  const elegirLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('El logo no puede superar los 2 MB', 'error');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const guardar = async () => {
    if (!form.nombreNegocio.trim() || !form.nombreUsuario.trim() || !form.email.trim()) {
      toast('Completá nombre del negocio, tu nombre y email', 'error');
      return;
    }
    if (form.password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (form.password !== form.confirmar) {
      toast('Las contraseñas no coinciden', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await usuariosService.configurarUsuarioInicial({
        nombre_negocio: form.nombreNegocio.trim(),
        des_usu: form.nombreUsuario.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.confirmar,
      });

      localStorage.setItem('token', res.access_token);
      localStorage.setItem('expires_at', new Date(Date.now() + res.expires_in * 1000).toISOString());
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('permisos', JSON.stringify((res.permisos || []).map(p => p.codigo?.toLowerCase()).filter(Boolean)));
      setToken(res.access_token);
      setUser(res.user);
      setMyPermisos((res.permisos || []).map(p => p.codigo?.toLowerCase()).filter(Boolean));

      if (logo) {
        await empresaService.subirLogo(logo);
      }
      await recargarPermisos();
      toast('Configuración guardada. Ya podés usar el sistema.', 'success');
    } catch (error) {
      toast(error.response?.data?.message || error.response?.data?.errors?.email?.[0] || 'No se pudo guardar la configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" disableEscapeKeyDown PaperProps={{ sx: { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px' } }}>
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 24, mb: 1 }}>
          Configurá tu sistema
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.6, mb: 3 }}>
          Este es el primer ingreso. Elegí el nombre del negocio y tus datos para usar el sistema con tu propia cuenta.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={preview || user?.empresa?.logo_url || undefined} sx={{ width: 64, height: 64, bgcolor: P, fontSize: 24 }}>
            {!preview && !user?.empresa?.logo_url && (form.nombreNegocio[0]?.toUpperCase() || 'N')}
          </Avatar>
          <Box>
            <Button variant="outlined" startIcon={<CameraAltIcon />} onClick={() => fileRef.current?.click()}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: INPUT } }}>
              Elegir logo
            </Button>
            <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.5 }}>PNG, JPG o WEBP. Máximo 2 MB.</Typography>
            <Box component="input" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={elegirLogo} sx={{ display: 'none' }} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75 }}>Nombre del negocio</Typography>
            <TextField fullWidth value={form.nombreNegocio} onChange={set('nombreNegocio')} placeholder="Ej: Ferretería Norte" sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75 }}>Tu nombre</Typography>
            <TextField fullWidth value={form.nombreUsuario} onChange={set('nombreUsuario')} placeholder="Ej: Juan Pérez" sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75 }}>Tu correo para ingresar</Typography>
            <TextField fullWidth type="email" value={form.email} onChange={set('email')} placeholder="tu correo@gmail.com" sx={fieldSx} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75 }}>Nueva contraseña</Typography>
              <TextField fullWidth type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" sx={fieldSx}
                InputProps={{ endAdornment: <InputAdornment position="end"><Button onClick={() => setShowPassword(value => !value)} sx={{ minWidth: 0, color: MUTED, p: 0.5 }}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</Button></InputAdornment> }} />
            </Box>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75 }}>Repetir contraseña</Typography>
              <TextField fullWidth type="password" value={form.confirmar} onChange={set('confirmar')} sx={fieldSx} />
            </Box>
          </Box>
        </Box>

        <Button fullWidth variant="contained" onClick={guardar} disabled={saving}
          sx={{ mt: 3, bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25, '&:hover': { bgcolor: P_HOVER } }}>
          {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Guardar y entrar con mi cuenta'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
