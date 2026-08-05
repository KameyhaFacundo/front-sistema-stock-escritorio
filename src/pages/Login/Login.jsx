import { useState, useContext } from "react";
import { useForm, Controller } from "react-hook-form";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { loginApi, forgotPasswordApi, resetPasswordApi, verificar2faApi } from "../../auth/authServiceApi";
import { AuthContext } from "../../auth/AuthContextBase";
import {
  Box, Typography, TextField, Button, InputAdornment,
  IconButton, Alert, CircularProgress, Stack, Tooltip,
} from "@mui/material";
import { keyframes } from "@mui/system";
import VisibilityIcon         from "@mui/icons-material/Visibility";
import VisibilityOffIcon      from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon          from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WbSunnyOutlinedIcon    from "@mui/icons-material/WbSunnyOutlined";
import DarkModeOutlinedIcon   from "@mui/icons-material/DarkModeOutlined";
import PointOfSaleIcon        from "@mui/icons-material/PointOfSale";
import InventoryIcon          from "@mui/icons-material/Inventory";
import BarChartIcon           from "@mui/icons-material/BarChart";
import GroupIcon              from "@mui/icons-material/Group";
import { APP_NAME, APP_TAGLINE, PRIMARY_COLOR, PRIMARY_HOVER, LOGO_URL } from "../../config/brand";
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "../../layout/sidebarConstants";
import useLogo from "../../hooks/useLogo";
import { BG, CARD, BORDER, INK, INK2, MUTED, INPUT, HOVER, ERROR } from "../../theme/tokens";
import { useAppTheme } from "../../theme/useAppTheme";
import TiltCard from "../../components/shared/TiltCard";

const SUCCESS_COLOR = '#10b981';

const slideUp   = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const slideLeft = keyframes`from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}`;
const floatBlob = keyframes`0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-18px,22px) scale(1.08)}`;

/* Autofill fix: necesita hex reales (no CSS vars) */
const getAutofillFix = (mode) => {
  // Slate/Navy dark mode
  const bg   = mode === 'dark' ? '#1e293b' : '#f8fafc';
  const text = mode === 'dark' ? '#f1f5f9' : '#0f172a';
  // Original dark mode — comentado: bg '#201f1f' / text '#f0edec'
  return `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px ${bg} inset !important;
      -webkit-text-fill-color: ${text} !important;
      caret-color: ${text};
      transition: background-color 9999s ease-in-out 0s;
    }
  `;
};

/* Patrón de puntos adaptado al modo */
const getDotPattern = (mode) =>
  mode === 'dark'
    ? 'radial-gradient(circle, #ffffff0a 1px, transparent 1px)'
    : 'radial-gradient(circle, #c8cce830 1px, transparent 1px)';

/* Estilos de input usando CSS vars del tema */
const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT,
    borderRadius: '10px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '1.5px' },
    '&.Mui-error fieldset': { borderColor: ERROR },
  },
  '& .MuiInputBase-input': {
    // 16px en mobile (no 14.5) porque iOS Safari hace zoom automático al
    // enfocar un input con letra más chica que esa — el zoom queda pegado
    // al pasar a /dashboard (SPA, sin recarga), rompiendo el layout ahí
    // hasta que el usuario scrollea o refresca.
    color: INK, fontSize: { xs: 16, sm: 14.5 }, py: '12px', px: '14px',
    '&::placeholder': { color: MUTED, opacity: 1 },
  },
  '& .MuiFormHelperText-root': { color: ERROR, mx: 0, mt: 0.5, fontSize: 12 },
};

function Label({ children }) {
  return (
    <Typography component="label" sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 0.75, display: 'block' }}>
      {children}
    </Typography>
  );
}

/* ══════════════════════════════
   VISTA LOGIN
══════════════════════════════ */
const expiresAtISO = (expiresInSeconds) => new Date(Date.now() + expiresInSeconds * 1000).toISOString();

function guardarSesion(res, { setToken, setUser, setMyPermisos }) {
  localStorage.setItem('token', res.access_token);
  localStorage.setItem('expires_at', expiresAtISO(res.expires_in));
  localStorage.setItem('user', JSON.stringify(res.user));
  // Ojo: solo los permisos directos del usuario (permisos_usuarios) — el
  // backend (User::chequearPermisos) nunca mira los del rol al autorizar un
  // request, así que unirlos acá mostraría accesos en el sidebar que la API
  // termina rechazando con 403 si el rol se actualizó después de asignarlo.
  const todos = res.user?.permisos?.map(p => p.codigo?.toLowerCase()) || [];
  localStorage.setItem('permisos', JSON.stringify(todos));
  // El menú siempre arranca desplegado en un login nuevo, sin importar
  // si se había dejado colapsado en una sesión anterior.
  localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, 'false');
  setMyPermisos(todos); setToken(res.access_token); setUser(res.user);
}

/* Segundo paso del login cuando la cuenta tiene 2FA activo */
function View2FA({ pendingToken, onVerificado, onCancelar }) {
  const { control, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const res = await verificar2faApi(pendingToken, data.codigo);
      guardarSesion(res, authCtx);
      onVerificado();
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ animation: `${slideUp} 0.3s ease` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 3 }}>
        <IconButton size="small" onClick={onCancelar}
          sx={{ color: INK2, bgcolor: HOVER, '&:hover': { bgcolor: BORDER }, borderRadius: '8px', p: '6px' }}>
          <ArrowBackIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Verificación en dos pasos</Typography>
      </Box>

      <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3 }}>
        Ingresá el código de 6 dígitos de tu app de autenticación.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5, fontSize: 13, borderRadius: '10px' }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Box>
            <Label>Código</Label>
            <Controller name="codigo" control={control} defaultValue=""
              rules={{ required: 'El código es obligatorio', minLength: { value: 6, message: '6 dígitos' } }}
              render={({ field }) => (
                <TextField {...field} placeholder="000000" fullWidth autoFocus
                  inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 } }}
                  error={!!errors.codigo} helperText={errors.codigo?.message}
                  InputLabelProps={{ shrink: false }} label="" sx={inputSx} />
              )} />
          </Box>
          <Button type="submit" variant="contained" fullWidth disabled={loading}
            sx={{ py: 1.45, bgcolor: PRIMARY_COLOR, fontSize: 15, fontWeight: 700, borderRadius: '10px', textTransform: 'none',
              boxShadow: `0 2px 14px ${PRIMARY_COLOR}35`,
              '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 4px 22px ${PRIMARY_COLOR}50` },
              '&.Mui-disabled': { bgcolor: PRIMARY_COLOR, opacity: 0.45, color: '#fff' } }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Verificar'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function ViewLogin({ onForgot, onRequiere2fa }) {
  const { control, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const authCtx = useContext(AuthContext);
  const { setToken } = authCtx;
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}auth/google/redirect`;
  };

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const res = await loginApi(data.email, data.password);
      if (res.requiere_2fa) {
        onRequiere2fa(res.pending_token);
        return;
      }
      guardarSesion(res, authCtx);
      navigate('/dashboard');
    } catch (e) {
      setToken(null); localStorage.removeItem('token');
      if (e.response?.status === 429) {
        setError('Demasiados intentos. Esperá un minuto e intentá de nuevo.');
      } else {
        setError(e.response?.data?.message || 'Credenciales inválidas. Verificá tu correo y contraseña.');
      }
    } finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert severity="error" sx={{ mb: 2.5, fontSize: 13, borderRadius: '10px' }}>{error}</Alert>}
      <Stack spacing={2.5}>
        <Box>
          <Label>Correo electrónico</Label>
          <Controller name="email" control={control} defaultValue=""
            rules={{ required: 'El correo es obligatorio', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Correo inválido' } }}
            render={({ field }) => (
              <TextField {...field} type="email" placeholder="nombre@empresa.com" fullWidth
                autoComplete="email" autoFocus error={!!errors.email} helperText={errors.email?.message}
                InputLabelProps={{ shrink: false }} label="" sx={inputSx} />
            )} />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Label>Contraseña</Label>
            <Typography onClick={onForgot}
              sx={{ color: PRIMARY_COLOR, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              ¿Olvidaste tu contraseña?
            </Typography>
          </Box>
          <Controller name="password" control={control} defaultValue=""
            render={({ field }) => (
              <TextField {...field} type={showPass ? 'text' : 'password'} placeholder="Tu contraseña"
                fullWidth autoComplete="current-password" error={!!errors.password} helperText={errors.password?.message}
                InputLabelProps={{ shrink: false }} label="" sx={inputSx}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(v => !v)} edge="end" size="small" tabIndex={-1}
                      sx={{ color: MUTED, mr: 0.25, '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
                      {showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )}} />
            )} />
        </Box>

        <Button type="submit" variant="contained" fullWidth disabled={loading}
          sx={{ py: 1.45, bgcolor: PRIMARY_COLOR, fontSize: 15, fontWeight: 700, borderRadius: '10px', textTransform: 'none',
            boxShadow: `0 2px 14px ${PRIMARY_COLOR}35`,
            '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 4px 22px ${PRIMARY_COLOR}50` },
            '&.Mui-disabled': { bgcolor: PRIMARY_COLOR, opacity: 0.45, color: '#fff' } }}>
          {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Iniciar sesión'}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: BORDER }} />
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 500 }}>o</Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: BORDER }} />
        </Box>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleGoogleLogin}
          sx={{
            py: 1.2,
            fontSize: 14,
            fontWeight: 600,
            borderRadius: '10px',
            textTransform: 'none',
            borderColor: BORDER,
            color: INK,
            bgcolor: INPUT,
            '&:hover': { bgcolor: HOVER, borderColor: BORDER },
          }}
        >
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Box>
        </Button>
      </Stack>
    </Box>
  );
}

/* ══════════════════════════════
   VISTA OLVIDÉ MI CONTRASEÑA
══════════════════════════════ */
function ViewForgot({ onBack }) {
  const { control, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      await forgotPasswordApi(data.email);
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <Box sx={{ animation: `${slideUp} 0.35s ease`, textAlign: 'center', py: 2 }}>
        <Box sx={{ width: 58, height: 58, borderRadius: '50%', bgcolor: `${SUCCESS_COLOR}18`, border: `1px solid ${SUCCESS_COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
          <CheckCircleOutlineIcon sx={{ color: SUCCESS_COLOR, fontSize: 32 }} />
        </Box>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', mb: 1 }}>
          Revisá tu correo
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3.5, maxWidth: 300, mx: 'auto' }}>
          Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña en breve.
        </Typography>
        <Button onClick={onBack} startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
          sx={{ color: PRIMARY_COLOR, textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: '8px',
            '&:hover': { bgcolor: `${PRIMARY_COLOR}0c` } }}>
          Volver al inicio de sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: `${slideUp} 0.3s ease` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 3 }}>
        <IconButton size="small" onClick={onBack}
          sx={{ color: INK2, bgcolor: HOVER, '&:hover': { bgcolor: BORDER }, borderRadius: '8px', p: '6px' }}>
          <ArrowBackIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600 }}>Recuperar contraseña</Typography>
      </Box>

      <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', mb: 0.75 }}>
        ¿Olvidaste tu contraseña?
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3 }}>
        Ingresá tu correo y te mandamos las instrucciones para crear una nueva.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5, fontSize: 13, borderRadius: '10px' }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Box>
          <Label>Correo electrónico</Label>
          <Controller name="email" control={control} defaultValue=""
              render={({ field }) => (
                <TextField {...field} type="email" placeholder="nombre@empresa.com" fullWidth autoFocus
                  error={!!errors.email} helperText={errors.email?.message}
                  InputLabelProps={{ shrink: false }} label="" sx={inputSx} />
              )} />
          </Box>
          <Button type="submit" variant="contained" fullWidth disabled={loading}
            sx={{ py: 1.45, bgcolor: PRIMARY_COLOR, fontSize: 15, fontWeight: 700, borderRadius: '10px', textTransform: 'none',
              boxShadow: `0 2px 14px ${PRIMARY_COLOR}35`,
              '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 4px 22px ${PRIMARY_COLOR}50` },
              '&.Mui-disabled': { bgcolor: PRIMARY_COLOR, opacity: 0.45, color: '#fff' } }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Enviar instrucciones'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/* ══════════════════════════════
   VISTA RESTABLECER CONTRASEÑA
   (se llega acá desde el link del mail: /reset-password?token=...&email=...)
══════════════════════════════ */
function ViewReset({ token, email, onDone }) {
  const { control, handleSubmit, getValues, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  if (!token || !email) {
    return (
      <Box sx={{ animation: `${slideUp} 0.35s ease`, textAlign: 'center', py: 2 }}>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', mb: 1 }}>
          Enlace inválido
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3.5, maxWidth: 320, mx: 'auto' }}>
          Este enlace de restablecimiento de contraseña está incompleto o ya fue usado. Pedí uno nuevo desde &ldquo;¿Olvidaste tu contraseña?&rdquo;.
        </Typography>
        <Button onClick={onDone} startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
          sx={{ color: PRIMARY_COLOR, textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: '8px',
            '&:hover': { bgcolor: `${PRIMARY_COLOR}0c` } }}>
          Volver al inicio de sesión
        </Button>
      </Box>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      await resetPasswordApi(email, token, data.password, data.confirm);
      setDone(true);
    } catch (e) {
      setError(e.message || 'No se pudo restablecer la contraseña. Pedí un enlace nuevo.');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <Box sx={{ animation: `${slideUp} 0.35s ease`, textAlign: 'center', py: 2 }}>
        <Box sx={{ width: 58, height: 58, borderRadius: '50%', bgcolor: `${SUCCESS_COLOR}18`, border: `1px solid ${SUCCESS_COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
          <CheckCircleOutlineIcon sx={{ color: SUCCESS_COLOR, fontSize: 32 }} />
        </Box>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', mb: 1 }}>
          Contraseña actualizada
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3.5, maxWidth: 300, mx: 'auto' }}>
          Ya podés iniciar sesión con tu nueva contraseña.
        </Typography>
        <Button onClick={onDone} variant="contained"
          sx={{ px: 3, py: 1.2, bgcolor: PRIMARY_COLOR, fontSize: 14, fontWeight: 700, borderRadius: '10px', textTransform: 'none',
            '&:hover': { bgcolor: PRIMARY_HOVER } }}>
          Iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: `${slideUp} 0.3s ease` }}>
      <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', mb: 0.75 }}>
        Elegí una nueva contraseña
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 14, lineHeight: 1.7, mb: 3 }}>
        Para {email}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5, fontSize: 13, borderRadius: '10px' }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Box>
            <Label>Nueva contraseña</Label>
            <Controller name="password" control={control} defaultValue=""
              rules={{ required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
              render={({ field }) => (
                <TextField {...field} type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                  fullWidth autoFocus autoComplete="new-password" error={!!errors.password} helperText={errors.password?.message}
                  InputLabelProps={{ shrink: false }} label="" sx={inputSx}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(v => !v)} edge="end" size="small" tabIndex={-1}
                        sx={{ color: MUTED, mr: 0.25, '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
                        {showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  )}} />
              )} />
          </Box>

          <Box>
            <Label>Confirmar contraseña</Label>
            <Controller name="confirm" control={control} defaultValue=""
              rules={{ required: 'Confirmá tu contraseña', validate: v => v === getValues('password') || 'Las contraseñas no coinciden' }}
              render={({ field }) => (
                <TextField {...field} type={showConfirm ? 'text' : 'password'} placeholder="Repetí tu contraseña"
                  fullWidth autoComplete="new-password" error={!!errors.confirm} helperText={errors.confirm?.message}
                  InputLabelProps={{ shrink: false }} label="" sx={inputSx}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(v => !v)} edge="end" size="small" tabIndex={-1}
                        sx={{ color: MUTED, mr: 0.25, '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
                        {showConfirm ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  )}} />
              )} />
          </Box>

          <Button type="submit" variant="contained" fullWidth disabled={loading}
            sx={{ py: 1.45, bgcolor: PRIMARY_COLOR, fontSize: 15, fontWeight: 700, borderRadius: '10px', textTransform: 'none',
              boxShadow: `0 2px 14px ${PRIMARY_COLOR}35`,
              '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 4px 22px ${PRIMARY_COLOR}50` },
              '&.Mui-disabled': { bgcolor: PRIMARY_COLOR, opacity: 0.45, color: '#fff' } }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Restablecer contraseña'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/* ── Panel de marca (solo desktop) ── */
const BRAND_FEATURES = [
  { icon: InventoryIcon,   label: 'Stock y lotes con vencimientos bajo control' },
  { icon: PointOfSaleIcon, label: 'Ventas y caja en un mismo flujo' },
  { icon: BarChartIcon,    label: 'Reportes claros para decidir mejor' },
  { icon: GroupIcon,       label: 'Multiusuario con permisos por rol' },
];

function FeatureItem({ icon: Icon, label }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: '9px', flexShrink: 0,
        bgcolor: `${PRIMARY_COLOR}14`, border: `1px solid ${PRIMARY_COLOR}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ fontSize: 17, color: PRIMARY_COLOR }} />
      </Box>
      <Typography sx={{ color: '#334155', fontSize: 14, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}

function BrandPanel({ onLogoClick }) {
  return (
    <Box sx={{
      display: { xs: 'none', md: 'flex' },
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '42%', minWidth: 'clamp(300px, 30vw, 420px)', maxWidth: 'clamp(360px, 34vw, 560px)',
      position: 'relative', overflowX: 'hidden', overflowY: 'auto',
      background: 'linear-gradient(165deg, #f8faff 0%, #f3f0ff 50%, #eef6ff 100%)',
      borderRight: '1px solid #e2e8f0',
      p: 'clamp(24px, 3vw, 48px)',
    }}>
      {/* Glow blobs */}
      <Box sx={{ position:'absolute', top:-140, right:-100, width:420, height:420, borderRadius:'50%', background:`radial-gradient(closest-side, ${PRIMARY_COLOR}30, transparent)`, filter:'blur(70px)', animation:`${floatBlob} 12s ease-in-out infinite` }} />
      <Box sx={{ position:'absolute', bottom:-120, left:-90, width:380, height:380, borderRadius:'50%', background:'radial-gradient(closest-side, #8b5cf630, transparent)', filter:'blur(70px)', animation:`${floatBlob} 15s ease-in-out infinite 2s` }} />
      <Box sx={{ position:'absolute', top:'40%', left:'52%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(closest-side, #22d3ee22, transparent)', filter:'blur(60px)', animation:`${floatBlob} 18s ease-in-out infinite 4s` }} />

      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, #64748b1c 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onLogoClick}>
        <Box component="img" src={LOGO_URL} alt={APP_NAME}
          sx={{ height: 'clamp(28px, 3vw, 40px)', width: 'auto', display: 'block' }} />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: 'clamp(20px, 2.2vw, 32px)', lineHeight: 1.25, letterSpacing: '-0.02em', mb: 'clamp(8px, 1vw, 12px)' }}>
          Gestioná tu negocio<br />de punta a punta.
        </Typography>
        <Typography sx={{ color: '#475569', fontSize: 'clamp(12.5px, 1vw, 15px)', lineHeight: 1.7, mb: 'clamp(16px, 2.2vw, 28px)', maxWidth: 380 }}>
          {APP_TAGLINE} — stock, ventas, caja y reportes en un solo lugar, pensado para comercios que necesitan moverse rápido.
        </Typography>

        {/* Mismo mockup del hero de la Landing, más chico — para que el panel
            del login no se sienta como una página aparte sin nada de producto. */}
        <Box sx={{ animation: `${slideUp} 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both`, mb: 'clamp(16px, 2.2vw, 28px)', maxWidth: 'clamp(220px, 22vw, 320px)' }}>
          <TiltCard sx={{
            bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', p: 2,
            boxShadow: '0 24px 60px rgba(15,23,42,0.12)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <Box key={c} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />)}
              <Box sx={{ flex: 1, height: 15, bgcolor: '#f1f5f9', borderRadius: '5px' }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.25 }}>
              {[['Ventas hoy', '$284.500', PRIMARY_COLOR], ['Stock bajo', '3 items', '#f59e0b']].map(([l, v, c]) => (
                <Box key={l} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', p: 1.25 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: 10.5 }}>{l}</Typography>
                  <Typography sx={{ color: c, fontWeight: 800, fontSize: 15, mt: 0.25 }}>{v}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', p: 1.25 }}>
              <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'flex-end', height: 28 }}>
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <Box key={i} sx={{ flex: 1, height: `${h}%`, bgcolor: PRIMARY_COLOR, opacity: i === 5 ? 1 : 0.3, borderRadius: '2px 2px 0 0' }} />
                ))}
              </Box>
            </Box>
          </TiltCard>
        </Box>

        <Stack spacing={1.5}>
          {BRAND_FEATURES.map(f => <FeatureItem key={f.label} icon={f.icon} label={f.label} />)}
        </Stack>
      </Box>

      <Typography sx={{ position: 'relative', color: '#94a3b8', fontSize: 12.5 }}>
        © {new Date().getFullYear()} {APP_NAME} · Todos los derechos reservados
      </Typography>
    </Box>
  );
}

/* ══════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════ */
export default function Login() {
  const { token }           = useContext(AuthContext);
  const navigate            = useNavigate();
  const location            = useLocation();
  const { mode, toggle }    = useAppTheme();
  const logoSrc             = useLogo();
  const searchParams = new URLSearchParams(location.search);
  const resetToken  = searchParams.get('token');
  const resetEmail  = searchParams.get('email');

  const googleError     = searchParams.get('error');
  const pending2faToken = searchParams.get('pending_2fa');

  const initialView = pending2faToken ? '2fa' : (resetToken ? 'reset' : 'main');

  const [view, setView] = useState(initialView);
  const [pendingToken, setPendingToken] = useState(pending2faToken || null);
  const oauthError = googleError || null;

  if (token) return <Navigate to="/dashboard" />;

  return (
    <>
      <style>{getAutofillFix(mode)}</style>
      <Box sx={{
        position: 'fixed', inset: 0,
        bgcolor: BG,
        display: 'flex',
        fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
      }}>

        <BrandPanel onLogoClick={() => navigate('/')} />

        {/* ── Panel del formulario ── */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundImage: getDotPattern(mode),
          backgroundSize: '28px 28px',
        }}>

          {/* ── Top bar ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' }, px: { xs: 3, sm: 5 }, py: { xs: 1.5, md: 2.5 } }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Box component="img" src={logoSrc} alt={APP_NAME}
                sx={{ height: 40, width: 'auto', display: 'block' }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                <IconButton onClick={toggle} size="small"
                  sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', p: '7px',
                    '&:hover': { color: INK, bgcolor: BORDER } }}>
                  {mode === 'dark'
                    ? <WbSunnyOutlinedIcon sx={{ fontSize: 18 }} />
                    : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
                  }
                </IconButton>
              </Tooltip>
              <Button onClick={() => navigate('/')}
                sx={{ color: MUTED, textTransform: 'none', fontWeight: 500, fontSize: 13, borderRadius: '8px',
                  '&:hover': { bgcolor: HOVER, color: INK } }}>
                ← Volver al inicio
              </Button>
            </Box>
          </Box>

          {/* ── Card centrada ── */}
          <Box sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2,
            py: { xs: 2, md: 4 },
            '@media (max-height: 800px)': { py: 1.5 },
          }}>
            <Box sx={{
              width: '100%',
              maxWidth: 430,
              bgcolor: CARD,
              borderRadius: '20px',
              border: `1px solid ${BORDER}`,
              boxShadow: mode === 'dark' ? '0 8px 48px rgba(0,0,0,0.35)' : '0 8px 48px rgba(60,70,130,0.10)',
              p: { xs: '24px 20px', sm: '40px 44px' },
              '@media (max-height: 800px)': { padding: '20px 24px' },
              animation: `${slideUp} 0.4s cubic-bezier(0.16,1,0.3,1)`,
            }}>

              {view === 'reset' ? (
                <ViewReset token={resetToken} email={resetEmail}
                  onDone={() => { setView('main'); navigate('/signin', { replace: true }); }} />
              ) : view === 'forgot' ? (
                <ViewForgot onBack={() => setView('main')} />
              ) : view === '2fa' ? (
                <View2FA
                  pendingToken={pendingToken}
                  onVerificado={() => setPendingToken(null)}
                  onCancelar={() => { setView('main'); setPendingToken(null); }}
                />
              ) : (
                <>
                  <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 }, '@media (max-height: 800px)': { mb: 1.5 } }}>
                    {/* En mobile ya se ve el logo en la barra de arriba — repetirlo
                        acá solo suma scroll antes de llegar al formulario. */}
                    <Box component="img" src={logoSrc} alt={APP_NAME}
                      sx={{
                        height: 56, width: 'auto', display: { xs: 'none', md: 'block' }, mx: 'auto', mb: 2.5,
                        '@media (max-height: 800px)': { height: 36, mb: 1 },
                      }} />
                    <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em', mb: 0.5 }}>
                      Bienvenido
                    </Typography>
                    <Typography sx={{ color: MUTED, fontSize: 13.5 }}>
                      Accedé a tu panel de control.
                    </Typography>
                  </Box>

                  {oauthError && (
                    <Alert severity="error" sx={{ mb: 2.5, fontSize: 13, borderRadius: '10px' }}>
                      {oauthError === 'google_auth_failed' && 'No se pudo autenticar con Google. Intentá de nuevo.'}
                      {oauthError === 'google_no_email' && 'Google no compartió tu correo. Intentá con otro método.'}
                      {oauthError === 'oauth_no_token' && 'El inicio de sesión con Google no se completó correctamente.'}
                      {oauthError === 'oauth_failed' && 'No se pudo verificar tu cuenta. Probá iniciar sesión con correo y contraseña.'}
                    </Alert>
                  )}

                  <Box sx={{ animation: `${slideLeft} 0.25s ease` }}>
                    <ViewLogin onForgot={() => setView('forgot')} onRequiere2fa={(token) => { setPendingToken(token); setView('2fa'); }} />
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* ── Footer (solo mobile, en desktop vive en el panel de marca) ── */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', px: 3, pb: 3 }}>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>
              © {new Date().getFullYear()} {APP_NAME} · Todos los derechos reservados
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
