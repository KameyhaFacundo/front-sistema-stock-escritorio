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
import { APP_NAME, PRIMARY_COLOR, PRIMARY_HOVER } from "../../config/brand";
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "../../layout/sidebarConstants";
import useLogo from "../../hooks/useLogo";
import { BG, CARD, BORDER, INK, INK2, MUTED, INPUT, HOVER, ERROR } from "../../theme/tokens";
import { useAppTheme } from "../../theme/useAppTheme";

const SUCCESS_COLOR = '#10b981';

const slideUp   = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const slideLeft = keyframes`from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}`;

/* Autofill fix: necesita hex reales (no CSS vars) */
const getAutofillFix = (mode) => {
  // Marrón oscuro (a juego con --input/--ink del tema dark, ver ThemeContext.jsx)
  const bg   = mode === 'dark' ? '#201f1f' : '#f8fafc';
  const text = mode === 'dark' ? '#f0edec' : '#0f172a';
  // Slate/Navy dark mode (versión anterior) — comentado: bg '#1e293b' / text '#f1f5f9'
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

  const pending2faToken = searchParams.get('pending_2fa');

  const initialView = pending2faToken ? '2fa' : (resetToken ? 'reset' : 'main');

  const [view, setView] = useState(initialView);
  const [pendingToken, setPendingToken] = useState(pending2faToken || null);

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
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
              <Box component="img" src={logoSrc} alt={APP_NAME}
                sx={{ height: 40, width: 'auto', display: 'block' }} />
            </Box>

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

                  <Box sx={{ animation: `${slideLeft} 0.25s ease` }}>
                    <ViewLogin onForgot={() => setView('forgot')} onRequiere2fa={(token) => { setPendingToken(token); setView('2fa'); }} />
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* ── Footer ── */}
          <Box sx={{ textAlign: 'center', px: 3, pb: 3 }}>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>
              © {new Date().getFullYear()} {APP_NAME} · Todos los derechos reservados
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
