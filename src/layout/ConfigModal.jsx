import { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Dialog, DialogContent, Tabs, Tab, IconButton,
  TextField, Select, MenuItem, FormControl, Button, Avatar, CircularProgress, Tooltip, Switch, Chip,
  InputAdornment,
} from '@mui/material';
import CloseIcon            from '@mui/icons-material/Close';
import VisibilityIcon       from '@mui/icons-material/Visibility';
import VisibilityOffIcon    from '@mui/icons-material/VisibilityOff';
import PersonIcon           from '@mui/icons-material/Person';
import SettingsIcon         from '@mui/icons-material/Settings';
import ContentCopyIcon      from '@mui/icons-material/ContentCopy';
import WarningAmberIcon     from '@mui/icons-material/WarningAmber';
import ReceiptLongIcon      from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import PointOfSaleIcon      from '@mui/icons-material/PointOfSale';
import StorefrontIcon       from '@mui/icons-material/Storefront';
// Solo usadas por TabSucursales, comentada junto con ella más abajo.
// import AddIcon              from '@mui/icons-material/Add';
// import EditIcon             from '@mui/icons-material/Edit';
// import DeleteIcon           from '@mui/icons-material/Delete';
// import SaveIcon             from '@mui/icons-material/Save';
import CameraAltIcon        from '@mui/icons-material/CameraAlt';
import UploadFileIcon       from '@mui/icons-material/UploadFile';
import CreditCardIcon       from '@mui/icons-material/CreditCard';
import SwapHorizIcon        from '@mui/icons-material/SwapHoriz';
import QrCode2Icon          from '@mui/icons-material/QrCode2';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WhatsAppIcon         from '@mui/icons-material/WhatsApp';
import CloudDoneIcon        from '@mui/icons-material/CloudDone';
import CloudUploadIcon      from '@mui/icons-material/CloudUpload';
// import WifiIcon             from '@mui/icons-material/Wifi'; // Solo usado por "Conectar otra caja", comentado más abajo.
import {
  CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, INPUT, TABLE_HEADER, DROPDOWN,
  ERROR, ERROR_BG, ERROR_BORDER, SUCCESS, SUCCESS_BG, WARNING, ORANGE, modalPaperSx,
} from '../theme/tokens';
import QRCode from 'qrcode';
import { COMPANY_NAME, POINT_HABILITADO, CATALOGO_HABILITADO } from '../config/brand';
import { mercadopagoService } from '../services/mercadopagoService';
import { empresaService } from '../services/empresaService';
// import { sistemaService } from '../services/sistemaService'; // Solo usado por "Conectar otra caja", comentado más abajo.
import { usuariosService } from '../services/usuariosService';
import { getEstadoArca } from '../services/arcaService';
import { twoFactorService } from '../services/twoFactorService';
// Solo usados por TabSucursales, comentada más abajo.
// import { useSucursales, useCrearSucursal, useActualizarSucursal, useEliminarSucursal } from '../hooks/queries/useSucursalesQueries';
// import ConfirmDialog from '../components/shared/ConfirmDialog';
import { WA_NUMBER } from '../components/shared/SoporteWidget';
import { useToast } from '../context/ToastContext';
import { AlertaWithConfirmation } from '../functions/alerts';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../auth/AuthContextBase';
import useHasPermiso from '../hooks/useHasPermiso';
import usePlan from '../hooks/usePlan';

const card = { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' };

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '8px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 },
  },
  '& .MuiInputBase-input': { py: '11px', px: '14px' },
  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none', margin: 0,
  },
};

const selectSx = {
  bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 },
  '& .MuiSvgIcon-root': { color: MUTED },
  '& .MuiSelect-select': { py: '11px', px: '14px' },
};

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>{children}</Typography>
  );
}

/* ─────────────────────────── TAB MI PERFIL ─────────────────────────── */
function ModalCambiarPassword({ open, onClose }) {
  const toast = useToast();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [showNuevo, setShowNuevo] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setPasswordActual(''); setPasswordNuevo(''); setPasswordConfirmar('');
      setShowNuevo(false);
    }
  }, [open]);

  const cambiarPassword = async () => {
    if (!passwordActual || !passwordNuevo) {
      toast('Completá la contraseña actual y la nueva', 'error');
      return;
    }
    if (passwordNuevo.length < 6) {
      toast('La contraseña nueva debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (passwordNuevo !== passwordConfirmar) {
      toast('Las contraseñas nuevas no coinciden', 'error');
      return;
    }
    setCambiandoPassword(true);
    try {
      await usuariosService.cambiarPassword(passwordActual, passwordNuevo);
      toast('Contraseña actualizada', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo cambiar la contraseña', 'error');
    } finally {
      setCambiandoPassword(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { ...modalPaperSx, borderRadius: '14px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: INK }}>Cambiar contraseña</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 2 }}>
          <FieldLabel>Contraseña actual</FieldLabel>
          <TextField fullWidth type="password" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} sx={fieldSx} />
        </Box>
        <Box sx={{ mb: 2 }}>
          <FieldLabel>Contraseña nueva</FieldLabel>
          <TextField fullWidth type={showNuevo ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={passwordNuevo} onChange={e => setPasswordNuevo(e.target.value)}
            sx={fieldSx}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowNuevo(v => !v)} sx={{ color: MUTED }}>
                  {showNuevo ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ) }} />
        </Box>
        <Box sx={{ mb: 3 }}>
          <FieldLabel>Confirmar contraseña nueva</FieldLabel>
          <TextField fullWidth type={showNuevo ? 'text' : 'password'} value={passwordConfirmar} onChange={e => setPasswordConfirmar(e.target.value)} sx={fieldSx} />
        </Box>
        <Button fullWidth variant="contained" onClick={cambiarPassword} disabled={cambiandoPassword}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: P_HOVER } }}>
          {cambiandoPassword ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function TabPerfil() {
  const toast = useToast();
  const { user, recargarPermisos } = useContext(AuthContext);
  const [nombre, setNombre] = useState(user?.des_usu || '');
  // Deshabilitado por el momento para usuarios comunes — el email solo se
  // muestra, no se edita. El super admin sí puede, porque administra todo
  // el sistema (no un solo negocio) y necesita control total de su cuenta.
  const puedeEditarEmail = !!user?.is_super_admin;
  const [email, setEmail] = useState(user?.email || '');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);

  const guardarPerfil = async () => {
    if (!nombre.trim() || !email.trim()) {
      toast('Completá tu nombre y email', 'error');
      return;
    }
    setGuardandoPerfil(true);
    try {
      const res = await usuariosService.actualizarPerfil({ des_usu: nombre.trim(), email: email.trim() });
      await recargarPermisos();
      toast(res.message || 'Perfil actualizado', res.email_pendiente ? 'info' : 'success');
    } catch (e) {
      toast(e.response?.data?.message || e.response?.data?.errors?.email?.[0] || 'No se pudo actualizar el perfil', 'error');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Mi perfil</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Tus datos personales de acceso al sistema — distintos a los del negocio.
      </Typography>

      <Box sx={{ ...card, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: P, borderRadius: '12px' }}>
            <PersonIcon />
          </Avatar>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Datos personales</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
          <Box>
            <FieldLabel>Nombre completo</FieldLabel>
            <TextField fullWidth value={nombre} onChange={e => setNombre(e.target.value)} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>Email</FieldLabel>
            <TextField fullWidth type="email" value={email} disabled={!puedeEditarEmail}
              onChange={e => setEmail(e.target.value)} sx={fieldSx} />
            <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.5 }}>
              {puedeEditarEmail
                ? 'Si lo cambiás, te vamos a pedir que lo confirmes desde un link que mandamos a la dirección nueva.'
                : 'El cambio de email todavía no está disponible.'}
            </Typography>
          </Box>
        </Box>
        {user?.email_pendiente && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, mb: 2.5, bgcolor: `${WARNING}14`, border: `1px solid ${WARNING}40`, borderRadius: '8px' }}>
            <WarningAmberIcon sx={{ color: WARNING, fontSize: 18, mt: 0.1 }} />
            <Typography sx={{ color: INK2, fontSize: 12.5, lineHeight: 1.5 }}>
              Tenés un cambio de email pendiente a <strong style={{ color: INK }}>{user.email_pendiente}</strong> — confirmalo desde el link que te mandamos a esa dirección. Si volvés a guardar con tu email actual, se cancela.
            </Typography>
          </Box>
        )}
        <Button variant="contained" onClick={guardarPerfil} disabled={guardandoPerfil}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 3, '&:hover': { bgcolor: P_HOVER } }}>
          {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Box>

      <Box sx={{ ...card, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Contraseña</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>Cambiá la contraseña con la que iniciás sesión.</Typography>
        </Box>
        <Button variant="outlined" onClick={() => setModalPassword(true)}
          sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, '&:hover': { bgcolor: HOVER } }}>
          Cambiar contraseña
        </Button>
      </Box>

      <ModalCambiarPassword open={modalPassword} onClose={() => setModalPassword(false)} />
    </Box>
  );
}

/* ─────────────────────────── TAB NEGOCIO ─────────────────────────── */
// Mismos íconos/colores que ya usa Caja.jsx para estos StatCards — así lo que
// se tilda acá se reconoce de un vistazo en el resumen real de la caja.
// Mismos códigos de rubro que usa el resto del sistema —
// tiene que ser el valor exacto que el resto del sistema compara contra
// empresa.tipo (esIndumentaria/esFerreteria en Productos.jsx, categorías
// precargadas en el registro), no una etiqueta de texto libre.
const TIPOS_NEGOCIO = [
  { value: 'almacen',  label: 'Almacén' },
  { value: 'kiosco',   label: 'Kiosco' },
  { value: 'indument', label: 'Indumentaria' },
  { value: 'ferret',   label: 'Ferretería' },
  { value: 'otro',     label: 'Otro' },
];

const METODOS_ARQUEO = [
  { key: 'efectivo',      label: 'Efectivo',      Icon: PointOfSaleIcon,          color: SUCCESS },
  { key: 'tarjeta',       label: 'Tarjeta',       Icon: CreditCardIcon,           color: P },
  { key: 'transferencia', label: 'Transferencia', Icon: SwapHorizIcon,            color: P },
  { key: 'qr',            label: 'QR',            Icon: QrCode2Icon,              color: ORANGE },
  { key: 'fiado',         label: 'Fiado',         Icon: AccountBalanceWalletIcon, color: ORANGE },
];

const formFromEmpresa = (empresa) => ({
  nombre: empresa?.nombre ?? COMPANY_NAME,
  cuit: empresa?.cuit ?? '',
  pais: empresa?.pais ?? '',
  tipoNegocio: empresa?.tipo ?? '',
  direccion: empresa?.direccion ?? '',
  whatsapp: empresa?.whatsapp ?? '',
  condicionFiscal: empresa?.condicion_fiscal ?? '',
  iibb: empresa?.iibb ?? '',
  inicioActividad: empresa?.inicio_actividad ?? '',
  email: empresa?.email ?? '',
  puntosActivo: empresa?.puntos_activo ?? false,
  puntosPorMoneda: empresa?.puntos_por_moneda ?? '',
  puntosValorPesos: empresa?.puntos_valor_pesos ?? '',
  // null/nunca configurado = las 5 (mismo default que ya usa CajaController).
  arqueoMetodos: empresa?.arqueo_metodos_visibles ?? METODOS_ARQUEO.map(m => m.key),
});

function TabNegocio() {
  const toast = useToast();
  const { user, recargarPermisos } = useContext(AuthContext);
  const empresaId = user?.empresa?.id;
  const [form, setForm] = useState(() => formFromEmpresa(user?.empresa));
  const [saving, setSaving] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  // Backup en la nube (Google Drive) — 100% opcional, ver electron/gdrive.js.
  // window.electronAPI solo existe en la app de escritorio empaquetada, así
  // que esta sección entera queda oculta en `pnpm dev`/demo/acceso por
  // navegador de una segunda PC.
  const [driveDisponible, setDriveDisponible] = useState(false);
  const [driveConectado, setDriveConectado] = useState(false);
  const [driveEmail, setDriveEmail] = useState(null);
  const [driveCargando, setDriveCargando] = useState(true);
  const [driveConectando, setDriveConectando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  // Estado de "Conectar otra caja" — comentado junto con el botón/modal más
  // abajo, descomentar los tres si se reactiva.
  // const [lanModal, setLanModal] = useState(false);
  // const [lanInfo, setLanInfo] = useState(null);
  // const [lanLoading, setLanLoading] = useState(false);
  const logoUrl = user?.empresa?.logo_url || null;
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(formFromEmpresa(user?.empresa));
  }, [user?.empresa]);

  useEffect(() => {
    if (!window.electronAPI?.driveConectado) { setDriveCargando(false); return; }
    setDriveDisponible(true);
    window.electronAPI.driveConectado().then(ok => {
      setDriveConectado(ok);
      if (ok) window.electronAPI.driveEmail?.().then(setDriveEmail);
    }).finally(() => setDriveCargando(false));
  }, []);

  const conectarDrive = async () => {
    setDriveConectando(true);
    try {
      const res = await window.electronAPI.driveConectar();
      if (res.ok) {
        setDriveConectado(true);
        window.electronAPI.driveEmail?.().then(setDriveEmail);
        toast('Google Drive conectado — los próximos backups se van a subir solos', 'success');
      } else {
        toast(res.error || 'No se pudo conectar con Google Drive', 'error');
      }
    } finally {
      setDriveConectando(false);
    }
  };

  const desconectarDrive = async () => {
    await window.electronAPI.driveDesconectar();
    setDriveConectado(false);
    setDriveEmail(null);
    toast('Google Drive desconectado — los backups siguen guardándose local, nomás', 'info');
  };

  const descargarBackup = async () => {
    setDescargando(true);
    try {
      await empresaService.descargarBackup();
      localStorage.setItem('ultimo_backup', new Date().toISOString());
    } catch {
      toast('No se pudo generar el backup', 'error');
    } finally {
      setDescargando(false);
    }
  };

  // const abrirConectarCaja = async () => {
  //   setLanModal(true);
  //   setLanLoading(true);
  //   try {
  //     const info = await sistemaService.getLanIp();
  //     setLanInfo(info);
  //   } catch {
  //     setLanInfo(null);
  //   } finally {
  //     setLanLoading(false);
  //   }
  // };

  // Reemplaza la base ENTERA por la del backup elegido — automatiza el
  // procedimiento manual de RESTAURAR-BACKUP.md (cerrar la app, descomprimir,
  // reemplazar el archivo, reabrir). El propio proceso principal ya para y
  // reinicia el servidor solo; acá solo hace falta recargar la ventana al
  // final para que el front deje de mostrar datos viejos en memoria.
  const restaurarBackup = async () => {
    setRestaurando(true);
    try {
      const res = await window.electronAPI.restaurarBackup();
      if (res.cancelado) return;
      if (!res.ok) {
        toast(res.error || 'No se pudo restaurar el backup', 'error');
        return;
      }
      toast('Backup restaurado — recargando...', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } finally {
      setRestaurando(false);
    }
  };

  const ultimoBackup = localStorage.getItem('ultimo_backup');
  const backupTooltip = ultimoBackup
    ? `Ultimo backup: ${new Date(ultimoBackup).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : 'Nunca se hizo un backup';

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleMetodoArqueo = (key) => setForm(f => ({
    ...f,
    arqueoMetodos: f.arqueoMetodos.includes(key)
      ? f.arqueoMetodos.filter(m => m !== key)
      : [...f.arqueoMetodos, key],
  }));

  const guardar = async () => {
    setSaving(true);
    try {
      await empresaService.update({
        nombre: form.nombre,
        cuit: form.cuit,
        tipo: form.tipoNegocio,
        pais: form.pais,
        direccion: form.direccion,
        whatsapp: form.whatsapp || null,
        condicion_fiscal: form.condicionFiscal,
        iibb: form.iibb || null,
        inicio_actividad: form.inicioActividad || null,
        email: form.email || null,
        puntos_activo: form.puntosActivo,
        puntos_por_moneda: form.puntosPorMoneda || null,
        puntos_valor_pesos: form.puntosValorPesos || null,
        arqueo_metodos_visibles: form.arqueoMetodos,
      });
      await recargarPermisos();
      toast('Datos del negocio guardados', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudieron guardar los datos', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Negocio</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Información general de tu negocio que aparecerá en tickets y reportes.
      </Typography>

      {/* Card datos */}
      <Box sx={{ ...card, p: 2.5, mb: 3 }}>
        {/* Avatar + nombre + ID */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={logoUrl}
              sx={{ width: 52, height: 52, bgcolor: P, fontWeight: 700, fontSize: 20, borderRadius: '12px' }}
            >
              {!logoUrl && (form.nombre[0]?.toUpperCase() || 'N')}
            </Avatar>
            <IconButton
              size="small"
              disabled={subiendoLogo}
              onClick={() => fileRef.current?.click()}
              sx={{
                position: 'absolute', bottom: -4, right: -4,
                bgcolor: P, color: '#fff', width: 22, height: 22,
                borderRadius: '6px', p: 0,
                '&:hover': { bgcolor: P_HOVER },
              }}
            >
              {subiendoLogo ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <CameraAltIcon sx={{ fontSize: 12 }} />}
            </IconButton>
            {logoUrl && (
              <IconButton
                size="small"
                disabled={subiendoLogo}
                onClick={async () => {
                  setSubiendoLogo(true);
                  try {
                    await empresaService.eliminarLogo();
                    await recargarPermisos();
                    toast('Logo restaurado al original', 'success');
                  } catch {
                    toast('No se pudo quitar el logo', 'error');
                  } finally {
                    setSubiendoLogo(false);
                  }
                }}
                sx={{
                  position: 'absolute', top: -4, left: -4,
                  bgcolor: ERROR, color: '#fff', width: 18, height: 18,
                  borderRadius: '5px', p: 0,
                  '&:hover': { bgcolor: '#dc2626' },
                }}
              >
                <CloseIcon sx={{ fontSize: 10 }} />
              </IconButton>
            )}
            <Box
              component="input"
              ref={fileRef}
              type="file"
              accept="image/*"
              sx={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast('La imagen no puede superar 2 MB', 'warning');
                  return;
                }
                setSubiendoLogo(true);
                try {
                  await empresaService.subirLogo(file);
                  await recargarPermisos();
                  toast('Logo actualizado', 'success');
                } catch (err) {
                  toast(err.response?.data?.message || 'No se pudo subir el logo', 'error');
                } finally {
                  setSubiendoLogo(false);
                }
              }}
            />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>{form.nombre || 'Mi negocio'}</Typography>
            {empresaId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>{empresaId}</Typography>
                <IconButton
                  size="small"
                  sx={{ color: MUTED, p: 0.25, '&:hover': { color: INK } }}
                  onClick={() => {
                    navigator.clipboard.writeText(String(empresaId));
                    toast('ID copiado', 'success');
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel>Nombre del Negocio</FieldLabel>
            <TextField fullWidth value={form.nombre} onChange={set('nombre')} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>CUIT del Negocio</FieldLabel>
            <TextField fullWidth value={form.cuit} onChange={set('cuit')} sx={fieldSx} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel>País</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.pais} onChange={set('pais')} displayEmpty sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={v => v || <Box component="span" sx={{ color: MUTED }}>Sin especificar</Box>}>
                {['Argentina', 'Chile', 'Uruguay', 'Brasil', 'Paraguay'].map(p => (
                  <MenuItem key={p} value={p} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FieldLabel>Tipo de negocio</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.tipoNegocio} onChange={set('tipoNegocio')} displayEmpty sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={v => TIPOS_NEGOCIO.find(t => t.value === v)?.label || <Box component="span" sx={{ color: MUTED }}>Sin especificar</Box>}>
                {TIPOS_NEGOCIO.map(t => (
                  <MenuItem key={t.value} value={t.value} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box>
            <FieldLabel>Dirección</FieldLabel>
            <TextField fullWidth placeholder="Calle Falsa 123, Ciudad" value={form.direccion} onChange={set('direccion')} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>WhatsApp para consultas</FieldLabel>
            <TextField fullWidth placeholder="+54 9 11 1234-5678" value={form.whatsapp} onChange={set('whatsapp')} sx={fieldSx} />
            <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.5 }}>Aparece como botón de contacto en tu catálogo online.</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <FieldLabel>Condición fiscal</FieldLabel>
          <FormControl>
            <Select value={form.condicionFiscal} onChange={set('condicionFiscal')} displayEmpty sx={selectSx}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
              renderValue={v => v || <Box component="span" sx={{ color: MUTED }}>Sin especificar</Box>}>
              {['Monotributista', 'Responsable Inscripto', 'Exento', 'Consumidor Final'].map(c => (
                <MenuItem key={c} value={c} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Datos que solo aparecen en el ticket impreso (factura) — opcionales,
            quedan en blanco si no se cargan. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2.5 }}>
          <Box>
            <FieldLabel>Ingresos Brutos (IIBB)</FieldLabel>
            <TextField fullWidth placeholder="901-123456-7" value={form.iibb} onChange={set('iibb')} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>Inicio de actividad</FieldLabel>
            <TextField fullWidth type="date" value={form.inicioActividad} onChange={set('inicioActividad')}
              InputLabelProps={{ shrink: true }} sx={fieldSx} />
          </Box>
          <Box>
            <FieldLabel>Email de contacto</FieldLabel>
            <TextField fullWidth placeholder="contacto@minegocio.com" value={form.email} onChange={set('email')} sx={fieldSx} />
          </Box>
        </Box>
      </Box>

      {/* Programa de puntos */}
      <Box sx={{ ...card, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: form.puntosActivo ? 2 : 0 }}>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Programa de puntos</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
              Tus clientes acumulan puntos por sus compras y los canjean como descuento.
            </Typography>
          </Box>
          <Switch checked={form.puntosActivo}
            onChange={e => setForm(f => ({ ...f, puntosActivo: e.target.checked }))}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
        </Box>
        {form.puntosActivo && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <FieldLabel>Pesos de compra por cada punto</FieldLabel>
              <TextField fullWidth type="number" placeholder="100" value={form.puntosPorMoneda}
                onChange={set('puntosPorMoneda')} sx={fieldSx}
                helperText="Ej: 100 = gana 1 punto cada $100 de compra" />
            </Box>
            <Box>
              <FieldLabel>Valor del punto al canjear ($)</FieldLabel>
              <TextField fullWidth type="number" placeholder="1" value={form.puntosValorPesos}
                onChange={set('puntosValorPesos')} sx={fieldSx}
                helperText="Ej: 1 = cada punto vale $1 de descuento" />
            </Box>
          </Box>
        )}
      </Box>

      {/* Arqueo de caja */}
      <Box sx={{ ...card, p: 2.5, mb: 3 }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Arqueo de caja</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25, mb: 1.5 }}>
          Elegí qué métodos de pago mostrar como tarjetas en el Resumen/arqueo de caja — desmarcá los que tu negocio no usa.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.25 }}>
          {METODOS_ARQUEO.map(({ key, label, Icon, color }) => {
            const activo = form.arqueoMetodos.includes(key);
            return (
              <Box key={key} onClick={() => toggleMetodoArqueo(key)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.1, p: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                  minWidth: 0,
                  border: `2px solid ${activo ? color : BORDER}`,
                  bgcolor: activo ? `${color}12` : 'transparent',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': { borderColor: color, bgcolor: `${color}0a` },
                }}>
                <Box sx={{
                  width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                  bgcolor: activo ? `${color}22` : HOVER,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 16, color: activo ? color : MUTED }} />
                </Box>
                <Typography sx={{ color: activo ? INK : MUTED, fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0 }} noWrap>
                  {label}
                </Typography>
                <CheckCircleIcon sx={{ fontSize: 16, color: activo ? color : 'transparent', flexShrink: 0 }} />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Guarda todo lo de arriba: datos del negocio, programa de puntos y
          arqueo de caja comparten el mismo form/guardar — un solo botón al
          final de las 3 tarjetas, para que quede claro que las cubre a todas. */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, mt: -1.5 }}>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={saving || !form.nombre.trim()}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', px: 3, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Box>

      {/* Backup de datos */}
      <Box sx={{ ...card, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Descargar todos tus datos</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
            Un .zip con productos, clientes, proveedores, ventas, compras y movimientos en CSV.
          </Typography>
        </Box>
        <Tooltip title={backupTooltip}>
          <Button
            variant="outlined"
            onClick={descargarBackup}
            disabled={descargando}
            startIcon={descargando ? <CircularProgress size={14} /> : <ReceiptLongIcon sx={{ fontSize: 16 }} />}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}
          >
            {descargando ? 'Generando...' : 'Descargar backup'}
          </Button>
        </Tooltip>
      </Box>

      {/* Backup automático en Google Drive — 100% opcional, oculto fuera de
          la app de escritorio empaquetada (no existe window.electronAPI en
          pnpm dev/demo/acceso por navegador). Si nunca se conecta, no cambia
          nada de lo que ya hay: el backup local automático sigue solo. */}
      {driveDisponible && (
        <Box sx={{ ...card, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              bgcolor: driveConectado ? SUCCESS_BG : HOVER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {driveConectado
                ? <CloudDoneIcon sx={{ color: SUCCESS, fontSize: 18 }} />
                : <CloudUploadIcon sx={{ color: MUTED, fontSize: 18 }} />}
            </Box>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Backup en Google Drive</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
                {driveConectado
                  ? `Conectado${driveEmail ? ` (${driveEmail})` : ''} — el backup diario se sube solo a tu Drive, además de guardarse local.`
                  : 'Conectá tu propia cuenta de Google para que el backup diario, además de local, quede a salvo en tu Drive.'}
              </Typography>
            </Box>
          </Box>
          {driveConectado ? (
            <Button
              variant="outlined"
              onClick={desconectarDrive}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: HOVER, borderColor: ERROR, color: ERROR } }}
            >
              Desconectar
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={conectarDrive}
              disabled={driveCargando || driveConectando}
              startIcon={driveConectando ? <CircularProgress size={14} /> : <CloudUploadIcon sx={{ fontSize: 16 }} />}
              sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}
            >
              {driveConectando ? 'Abrí el navegador y aprobá el acceso...' : 'Conectar Google Drive'}
            </Button>
          )}
        </Box>
      )}

      {/* Restaurar backup — reemplaza la base ENTERA por la de un .gz elegido
          a mano (cambio de PC, o recuperar datos perdidos). Mismo criterio
          que la sección de Drive: solo existe en la app empaquetada. */}
      {driveDisponible && (
        <Box sx={{ ...card, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              bgcolor: HOVER, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RestoreIcon sx={{ color: MUTED, fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Restaurar un backup</Typography>
              <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
                Reemplaza TODOS los datos actuales por los de un backup (.gz) — para cambiar de PC o recuperar datos perdidos.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            disabled={restaurando}
            onClick={() => AlertaWithConfirmation({
              title: '¿Restaurar este backup?',
              textMain: 'Esto reemplaza TODOS los productos, ventas, clientes y demás datos actuales por los del backup que elijas. No se puede deshacer (aunque se guarda una copia de la base actual por las dudas). ¿Continuar?',
              textSuccesfull: 'Backup restaurado',
              textError: 'No se pudo restaurar el backup',
              functionConfirmed: restaurarBackup,
            })}
            startIcon={restaurando ? <CircularProgress size={14} /> : <RestoreIcon sx={{ fontSize: 16 }} />}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: HOVER, borderColor: ERROR, color: ERROR }, '&.Mui-disabled': { opacity: 0.6 } }}
          >
            {restaurando ? 'Restaurando...' : 'Restaurar backup'}
          </Button>
        </Box>
      )}

      {/* "Conectar otra caja" comentado a pedido — no hace falta multi-caja por
          ahora. Ojo: esto solo oculta el atajo de la UI, NO cierra el acceso
          por red — el backend sigue escuchando en toda la red local
          (--host=0.0.0.0 en escritorio-launcher/electron/backend.js) esté o
          no este botón visible. Para reactivar el botón, descomentar este
          bloque + el <Dialog> de abajo + el estado/handler (lanModal,
          lanInfo, lanLoading, abrirConectarCaja) más arriba en este archivo.
      <Box sx={{ ...card, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Conectar otra caja</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
            Mostrá la dirección de red para abrir el sistema desde otra computadora, en el mismo local.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={abrirConectarCaja}
          startIcon={<WifiIcon sx={{ fontSize: 16 }} />}
          sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: HOVER } }}
        >
          Conectar otra caja
        </Button>
      </Box>

      <Dialog open={lanModal} onClose={() => setLanModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }}>Conectar otra caja</Typography>
          <IconButton size="small" onClick={() => setLanModal(false)} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: 3, pt: 1.5, pb: 3 }}>
          {lanLoading ? (
            <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Buscando la dirección de red...</Typography>
          ) : lanInfo?.ip ? (
            <>
              <Typography sx={{ color: INK2, fontSize: 13.5, mb: 2, lineHeight: 1.6 }}>
                Para conectar otra caja a este sistema, abrí un navegador ahí (no hace falta instalar nada) y entrá a:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth value={`http://${lanInfo.ip}:${lanInfo.puerto}`} InputProps={{ readOnly: true }} sx={fieldSx} />
                <Tooltip title="Copiar">
                  <IconButton onClick={() => { navigator.clipboard.writeText(`http://${lanInfo.ip}:${lanInfo.puerto}`); toast('Dirección copiada', 'success'); }}
                    sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography sx={{ color: MUTED, fontSize: 12, mt: 2, lineHeight: 1.6 }}>
                Las dos computadoras tienen que estar en la misma red (mismo WiFi o cable). Esta PC tiene que quedar prendida y con el sistema abierto — si lo cerrás, la otra caja se queda sin conexión.
              </Typography>
            </>
          ) : (
            <Typography sx={{ color: ERROR, fontSize: 13.5, textAlign: 'center', py: 2 }}>
              No se pudo detectar la dirección de red. Revisá que esta PC esté conectada por WiFi o cable.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
      */}

      {/* Zona peligrosa */}
      <Box sx={{ border: `1px solid ${ERROR_BORDER}`, borderRadius: '12px', p: 2.5, bgcolor: ERROR_BG }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: ERROR_BG, border: `1px solid ${ERROR_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <WarningAmberIcon sx={{ color: ERROR, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 15, mb: 0.5 }}>Restablecer negocio</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mb: 2, lineHeight: 1.6 }}>
              Elimina productos, compras, clientes, ventas y datos relacionados.{' '}
              <Box component="span" sx={{ color: INK, fontWeight: 600 }}>No borra usuarios, plan ni configuración.</Box>
              {' '}Esta acción{' '}
              <Box component="span" sx={{ color: INK, fontWeight: 600 }}>no se puede deshacer.</Box>
            </Typography>
            <Tooltip title="Próximamente — todavía no está disponible">
              <span>
                <Button
                  disabled
                  startIcon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: ERROR_BG, color: ERROR,
                    border: '1px solid rgba(248,113,113,0.3)', textTransform: 'none',
                    fontWeight: 600, fontSize: 13, borderRadius: '8px',
                    '&.Mui-disabled': { bgcolor: ERROR_BG, color: ERROR, opacity: 0.5 },
                  }}
                >
                  Restablecer negocio
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── TAB CATÁLOGO ─────────────────────────── */
// Módulo opcional por cliente — ver CATALOGO_HABILITADO en config/brand.js.
// Ya no depende de ningún plan (build local de un solo comercio, ver
// ChecksPlanLimits::planTieneFuncion en el backend, siempre true).
function TabCatalogo() {
  const toast = useToast();
  const [config, setConfig] = useState(null); // null = cargando
  const [guardando, setGuardando] = useState(false);
  const [qrImagen, setQrImagen] = useState(null);

  const cargar = useCallback(() => {
    empresaService.getCatalogoConfig()
      .then(setConfig)
      .catch(() => toast('No se pudo cargar el estado del catálogo', 'error'));
  }, [toast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (config?.url) {
      QRCode.toDataURL(config.url, { margin: 1, width: 180 }).then(setQrImagen);
    } else {
      setQrImagen(null);
    }
  }, [config?.url]);

  const handleToggle = async (activo) => {
    setGuardando(true);
    try {
      const nuevo = await empresaService.actualizarCatalogo(activo);
      setConfig(nuevo);
      toast(activo ? 'Catálogo activado' : 'Catálogo desactivado', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo actualizar el catálogo', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(config.url);
    toast('Link copiado', 'success');
  };

  if (!config) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={24} sx={{ color: P }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Catálogo online</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Una página pública, sin login, con tus productos activos — compartila con tus clientes.
      </Typography>

      <Box sx={{ ...card, p: 2.5, mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <StorefrontIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>
              {config.activo ? 'Catálogo activo' : 'Catálogo desactivado'}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>
              {config.activo ? 'Cualquiera con el link puede verlo' : 'Nadie puede ver tu catálogo mientras esté apagado'}
            </Typography>
          </Box>
        </Box>
        <Switch checked={config.activo} disabled={guardando} onChange={(_, v) => handleToggle(v)}
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
      </Box>

      {config.activo && config.url && (
        <Box sx={{ ...card, p: 2.5, display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {qrImagen && (
            <Box component="img" src={qrImagen} alt="QR del catálogo"
              sx={{ width: 120, height: 120, borderRadius: '10px', border: `1px solid ${BORDER}`, flexShrink: 0 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Link público</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth value={config.url} InputProps={{ readOnly: true }} sx={fieldSx} />
              <Tooltip title="Copiar link">
                <IconButton onClick={copiarLink}
                  sx={{ bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, '&:hover': { color: INK, bgcolor: BORDER } }}>
                  <ContentCopyIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Button component="a" href={config.url} target="_blank" rel="noopener noreferrer"
              sx={{ mt: 1.5, color: P, textTransform: 'none', fontWeight: 600, fontSize: 13, px: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
              Ver catálogo →
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* ─────────────────────────── TAB SUCURSALES ─────────────────────────── */
// Comentada junto con su entrada en `tabs` más arriba — ver esa nota.
/*
const emptySucursal = { nombre: '', direccion: '', telefono: '' };

function TabSucursales() {
  const toast = useToast();
  const navigate = useNavigate();
  const { recargarPermisos } = useContext(AuthContext);
  const { checkPermisos } = useHasPermiso();
  const { sucursalesMax } = usePlan();
  const puedeCrear = checkPermisos('create-sucursales');
  const puedeEditar = checkPermisos('update-sucursales');
  const puedeBorrar = checkPermisos('delete-sucursales');
  const { data: sucursales = [], isLoading: loading } = useSucursales();
  const crearSucursal = useCrearSucursal();
  const actualizarSucursal = useActualizarSucursal();
  const eliminarSucursal = useEliminarSucursal();
  const [showNueva, setShowNueva]   = useState(false);
  const [nueva, setNueva]           = useState(emptySucursal);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm]     = useState(emptySucursal);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const saving = crearSucursal.isPending || actualizarSucursal.isPending;
  const alLimite = sucursalesMax !== null && sucursales.length >= sucursalesMax;

  const crear = async () => {
    if (!nueva.nombre.trim()) return;
    try {
      await crearSucursal.mutateAsync(nueva);
      setNueva(emptySucursal);
      setShowNueva(false);
      toast('Sucursal creada', 'success');
      await recargarPermisos();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo crear la sucursal', 'error');
    }
  };

  const iniciarEdicion = (s) => {
    setEditandoId(s.id);
    setEditForm({ nombre: s.nombre, direccion: s.direccion, telefono: s.telefono });
  };

  const guardarEdicion = async (id) => {
    if (!editForm.nombre.trim()) return;
    try {
      await actualizarSucursal.mutateAsync({ id, data: editForm });
      setEditandoId(null);
      toast('Sucursal actualizada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo actualizar la sucursal', 'error');
    }
  };

  const toggleActivo = async (s) => {
    try {
      await actualizarSucursal.mutateAsync({ id: s.id, data: { activo: !s.activo } });
      toast(s.activo ? 'Sucursal desactivada' : 'Sucursal activada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo actualizar la sucursal', 'error');
    }
  };

  const eliminar = async (id) => {
    setEliminandoId(id);
    try {
      await eliminarSucursal.mutateAsync(id);
      toast('Sucursal eliminada', 'success');
      await recargarPermisos();
    } catch (e) {
      toast(e.response?.data?.message || 'No se puede eliminar esta sucursal', 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Sucursales</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13.5 }}>
            Cada sucursal tiene su propio stock. Los empleados quedan fijos a la sucursal que les asignes en Usuarios.
            {' '}{sucursales.length}{sucursalesMax !== null ? ` de ${sucursalesMax}` : ''} sucursales de tu plan.
          </Typography>
        </Box>
        {puedeCrear && (
          <Tooltip title={alLimite ? 'Alcanzaste el límite de sucursales de tu plan' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => alLimite ? navigate('/planes') : setShowNueva(v => !v)}
                sx={{ bgcolor: alLimite ? MUTED : P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: alLimite ? MUTED : P_HOVER } }}
              >
                {alLimite ? 'Ver planes →' : 'Nueva sucursal'}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {showNueva && puedeCrear && (
        <Box sx={{ ...card, p: 2.5, mb: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <Box>
              <FieldLabel>Nombre</FieldLabel>
              <TextField fullWidth placeholder="Sucursal Norte" value={nueva.nombre}
                onChange={e => setNueva(f => ({ ...f, nombre: e.target.value }))} sx={fieldSx} />
            </Box>
            <Box>
              <FieldLabel>Teléfono</FieldLabel>
              <TextField fullWidth value={nueva.telefono}
                onChange={e => setNueva(f => ({ ...f, telefono: e.target.value }))} sx={fieldSx} />
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <FieldLabel>Dirección</FieldLabel>
            <TextField fullWidth value={nueva.direccion}
              onChange={e => setNueva(f => ({ ...f, direccion: e.target.value }))} sx={fieldSx} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" disabled={saving || !nueva.nombre.trim()} onClick={crear}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.6 } }}>
              {saving ? 'Creando...' : 'Crear sucursal'}
            </Button>
            <Button onClick={() => { setShowNueva(false); setNueva(emptySucursal); }}
              sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px' }}>
              Cancelar
            </Button>
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: P }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sucursales.map(s => (
            <Box key={s.id} sx={{ ...card, p: 2 }}>
              {editandoId === s.id ? (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <TextField fullWidth size="small" label="Nombre" value={editForm.nombre}
                      onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} sx={fieldSx} />
                    <TextField fullWidth size="small" label="Teléfono" value={editForm.telefono}
                      onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} sx={fieldSx} />
                  </Box>
                  <TextField fullWidth size="small" label="Dirección" value={editForm.direccion}
                    onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))} sx={{ ...fieldSx, mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
                      disabled={saving} onClick={() => guardarEdicion(s.id)}
                      sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
                      Guardar
                    </Button>
                    <Button size="small" onClick={() => setEditandoId(null)}
                      sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 12.5 }}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StorefrontIcon sx={{ color: P, fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>{s.nombre}</Typography>
                      {s.esPrincipal && (
                        <Chip label="Principal" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${P}18`, color: P, '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                      {!s.activo && (
                        <Chip label="Inactiva" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ERROR_BG, color: ERROR, '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                    </Box>
                    <Typography sx={{ color: MUTED, fontSize: 12 }}>
                      {[s.direccion, s.telefono].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                    </Typography>
                  </Box>
                  <Switch checked={s.activo} onChange={() => toggleActivo(s)} disabled={!puedeEditar || saving}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
                  {puedeEditar && (
                    <IconButton size="small" onClick={() => iniciarEdicion(s)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER } }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  {!s.esPrincipal && puedeBorrar && (
                    <IconButton size="small" disabled={eliminandoId === s.id} onClick={() => setConfirmandoId(s.id)}
                      sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG } }}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
      <ConfirmDialog
        open={!!confirmandoId}
        onClose={() => setConfirmandoId(null)}
        onConfirm={() => eliminar(confirmandoId)}
        title="¿Eliminar esta sucursal?"
        message="Se eliminarán todos los datos asociados a esta sucursal. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
*/

/* ─────────────────────────── TAB COBROS ─────────────────────────── */
function TabCobros() {
  const toast = useToast();
  const navigate = useNavigate();
  const { tieneCobros } = usePlan();
  const [loading, setLoading]         = useState(true);
  const [conectando, setConectando]   = useState(false);
  const [conectado, setConectado]     = useState(false);
  const [dispositivos, setDispositivos] = useState([]);
  const [deviceId, setDeviceId]       = useState('');
  const [guardando, setGuardando]     = useState(false);

  const cargarEstado = useCallback(async () => {
    setLoading(true);
    try {
      const { conectado: est, pointDeviceId } = await mercadopagoService.getEstado();
      setConectado(est);
      setDeviceId(pointDeviceId || '');
      if (est) {
        const devices = await mercadopagoService.getDispositivos();
        setDispositivos(devices);
      }
    } catch {
      toast('No se pudo consultar el estado de Mercado Pago', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const handleConectar = async () => {
    setConectando(true);
    try {
      const url = await mercadopagoService.conectar();
      window.location.href = url;
    } catch {
      toast('No se pudo iniciar la conexión con Mercado Pago', 'error');
      setConectando(false);
    }
  };

  const handleDesconectar = async () => {
    try {
      await mercadopagoService.desconectar();
      setConectado(false);
      setDispositivos([]);
      setDeviceId('');
      toast('Cuenta de Mercado Pago desconectada', 'success');
    } catch {
      toast('No se pudo desconectar la cuenta', 'error');
    }
  };

  const handleGuardarDispositivo = async () => {
    if (!deviceId) return;
    setGuardando(true);
    try {
      await mercadopagoService.guardarDispositivo(deviceId);
      toast('Dispositivo Point guardado correctamente', 'success');
    } catch {
      toast('No se pudo guardar el dispositivo', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: P }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Cobros</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Conectá tu propia cuenta de Mercado Pago para cobrar con Point directo a tu banco.
      </Typography>

      {!tieneCobros && (
        <Box sx={{ ...card, p: 2.5, mb: 2.5, bgcolor: `${P}0c`, border: `1px solid ${P}40` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, mb: 0.5 }}>Disponible desde el plan Pro</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mb: 1.5 }}>
            Cobrar con Mercado Pago Point o QR es parte de los planes Pro e IA.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/planes')}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            Ver planes →
          </Button>
        </Box>
      )}

      <Box sx={{ ...card, p: 2.5, mb: 2.5, opacity: tieneCobros ? 1 : 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: conectado ? 2.5 : 0 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
            bgcolor: conectado ? SUCCESS_BG : HOVER, border: `1px solid ${conectado ? SUCCESS : BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PointOfSaleIcon sx={{ color: conectado ? SUCCESS : MUTED, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Mercado Pago</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>
              {conectado ? 'Cuenta conectada' : 'Todavía no conectaste tu cuenta'}
            </Typography>
          </Box>
          {conectado ? (
            <Button onClick={handleDesconectar}
              sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { bgcolor: ERROR_BG } }}>
              Desconectar
            </Button>
          ) : (
            <Button variant="contained" disabled={conectando || !tieneCobros} onClick={handleConectar}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              {conectando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Conectar con Mercado Pago'}
            </Button>
          )}
        </Box>

        {conectado && (
          <Box>
            <FieldLabel>Dispositivo Point</FieldLabel>
            {dispositivos.length === 0 ? (
              <Typography sx={{ color: MUTED, fontSize: 13 }}>
                No encontramos ningún dispositivo Point vinculado a tu cuenta todavía. Emparejá tu lector desde
                la app de Mercado Pago y volvé a abrir esta pantalla.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl fullWidth>
                  <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} sx={selectSx}
                    displayEmpty
                    MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                    <MenuItem value="" disabled sx={{ fontSize: 14 }}>Elegí un dispositivo</MenuItem>
                    {dispositivos.map(d => (
                      <MenuItem key={d.id} value={d.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>
                        {d.pos_id || d.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" disabled={guardando || !deviceId} onClick={handleGuardarDispositivo}
                  sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: P_HOVER } }}>
                  {guardando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Guardar'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {conectado && deviceId && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: SUCCESS, fontSize: 13 }}>
          <CheckCircleIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 13 }}>
            Listo — ya podés cobrar con Point desde el punto de venta.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/* ─────────────────────────── TAB FACTURACIÓN (ARCA) ─────────────────────────── */
function TabFacturacion() {
  const toast = useToast();
  const navigate = useNavigate();
  const { recargarPermisos } = useContext(AuthContext);
  const { planTieneFacturacion, facturacionActivada } = usePlan();
  const [loading, setLoading]     = useState(true);
  const [estado, setEstado]       = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardandoActivacion, setGuardandoActivacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [certFile, setCertFile]   = useState(null);
  const [keyFile, setKeyFile]     = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [puntoVenta, setPuntoVenta] = useState('');
  const [homologacion, setHomologacion] = useState(true);
  const certRef = useRef(null);
  const keyRef  = useRef(null);

  const cargarEstado = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEstadoArca();
      setEstado(data);
    } catch {
      toast('No se pudo consultar el estado de ARCA', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const handleGuardar = async () => {
    if (!certFile || !keyFile || !puntoVenta) {
      toast('Cargá el certificado, la clave y el punto de venta', 'error');
      return;
    }
    setGuardando(true);
    try {
      await empresaService.actualizarArca({ cert: certFile, key: keyFile, passphrase, puntoVenta, homologacion });
      toast('Certificado de ARCA guardado correctamente', 'success');
      setCertFile(null); setKeyFile(null); setPassphrase(''); setPuntoVenta('');
      if (certRef.current) certRef.current.value = '';
      if (keyRef.current) keyRef.current.value = '';
      cargarEstado();
    } catch (e) {
      toast(e.response?.data?.message || 'El certificado o la clave no son válidos', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await empresaService.eliminarArca();
      toast('Certificado de ARCA eliminado', 'success');
      cargarEstado();
    } catch {
      toast('No se pudo eliminar el certificado', 'error');
    } finally {
      setEliminando(false);
    }
  };

  const handleToggleActivacion = async (activo) => {
    setGuardandoActivacion(true);
    try {
      await empresaService.update({ arca: activo });
      await recargarPermisos();
      toast(activo ? 'Facturación activada' : 'Facturación desactivada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo actualizar la facturación', 'error');
    } finally {
      setGuardandoActivacion(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: P }} />
      </Box>
    );
  }

  const configurado = !!estado?.disponible;

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Facturación</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 1.5 }}>
        Cargá tu certificado de ARCA (ex AFIP) para emitir facturas electrónicas con tu propio CUIT.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18, flexShrink: 0 }} />
        <Typography sx={{ color: MUTED, fontSize: 12.5 }}>
          ¿No sabés cómo completar estos datos para empezar a facturar?{' '}
          <Box component="a" href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, necesito ayuda para configurar la facturación electrónica.')}`}
            target="_blank" rel="noopener noreferrer"
            sx={{ color: '#25D366', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
            Contactá a soporte
          </Box>.
        </Typography>
      </Box>

      {!planTieneFacturacion && (
        <Box sx={{ ...card, p: 2.5, mb: 2.5, bgcolor: `${P}0c`, border: `1px solid ${P}40` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, mb: 0.5 }}>Disponible desde el plan Pro</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mb: 1.5 }}>
            La facturación electrónica con ARCA es parte de los planes Pro e IA.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/planes')}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            Ver planes →
          </Button>
        </Box>
      )}

      <Box sx={{ ...card, p: 2.5, mb: 2.5, opacity: planTieneFacturacion ? 1 : 0.5, pointerEvents: planTieneFacturacion ? 'auto' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Facturación electrónica</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
            {facturacionActivada
              ? 'El botón "Facturar ARCA" y la sección de Facturas están visibles.'
              : 'Desactivada — no se muestra el botón de facturar ni la sección de Facturas.'}
          </Typography>
        </Box>
        <Switch checked={facturacionActivada} disabled={guardandoActivacion || !planTieneFacturacion}
          onChange={(_, v) => handleToggleActivacion(v)}
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
      </Box>

      <Box sx={{ ...card, p: 2.5, opacity: planTieneFacturacion ? 1 : 0.5, pointerEvents: planTieneFacturacion ? 'auto' : 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: configurado ? 2.5 : 2 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
            bgcolor: configurado ? SUCCESS_BG : HOVER, border: `1px solid ${configurado ? SUCCESS : BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReceiptLongIcon sx={{ color: configurado ? SUCCESS : MUTED, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>
              {configurado ? `CUIT ${estado.cuit}` : 'Sin certificado cargado'}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5 }}>
              {configurado
                ? `Punto de venta ${estado.punto_venta} · ${estado.homologacion ? 'Modo prueba (homologación)' : 'Producción'}`
                : 'Cargá tu certificado para facturar con tu propio CUIT'}
            </Typography>
          </Box>
          {configurado && (
            <Button onClick={handleEliminar} disabled={eliminando}
              sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { bgcolor: ERROR_BG } }}>
              {eliminando ? <CircularProgress size={16} sx={{ color: ERROR }} /> : 'Quitar certificado'}
            </Button>
          )}
        </Box>

        {!configurado && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box>
                <FieldLabel>Certificado (.crt / .pem)</FieldLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', pl: 1.5, pr: 1, py: 1, minWidth: 0 }}>
                  <Button size="small" variant="outlined" startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                    onClick={() => certRef.current?.click()}
                    sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: INK2, borderColor: BORDER, borderRadius: '6px', flexShrink: 0, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                    Elegir
                  </Button>
                  <Typography sx={{ color: certFile ? INK : MUTED, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {certFile?.name || 'Ningún archivo'}
                  </Typography>
                  <input ref={certRef} type="file" accept=".crt,.pem,.cer" hidden
                    onChange={e => setCertFile(e.target.files?.[0] || null)} />
                </Box>
              </Box>
              <Box>
                <FieldLabel>Clave privada (.key / .pem)</FieldLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: INPUT, border: `1px solid ${BORDER}`, borderRadius: '8px', pl: 1.5, pr: 1, py: 1, minWidth: 0 }}>
                  <Button size="small" variant="outlined" startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                    onClick={() => keyRef.current?.click()}
                    sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: INK2, borderColor: BORDER, borderRadius: '6px', flexShrink: 0, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
                    Elegir
                  </Button>
                  <Typography sx={{ color: keyFile ? INK : MUTED, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {keyFile?.name || 'Ningún archivo'}
                  </Typography>
                  <input ref={keyRef} type="file" accept=".key,.pem" hidden
                    onChange={e => setKeyFile(e.target.files?.[0] || null)} />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box>
                <FieldLabel>Contraseña de la clave (si tiene)</FieldLabel>
                <TextField fullWidth size="small" type="password" value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 13.5 } }} />
              </Box>
              <Box>
                <FieldLabel>Punto de venta</FieldLabel>
                <TextField fullWidth size="small" type="number" value={puntoVenta}
                  onChange={e => setPuntoVenta(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 13.5 } }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>Modo prueba (homologación)</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12 }}>Desactivalo recién cuando tengas un certificado de producción real.</Typography>
              </Box>
              <Switch checked={homologacion} onChange={(_, v) => setHomologacion(v)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P } }} />
            </Box>
            <Button variant="contained" disabled={guardando} onClick={handleGuardar}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: '8px', alignSelf: 'flex-start', px: 3, '&:hover': { bgcolor: P_HOVER } }}>
              {guardando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Guardar certificado'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ─────────────────────────── TAB SEGURIDAD ─────────────────────────── */
function TabSeguridad() {
  const toast = useToast();
  const [activo, setActivo] = useState(null);
  const [disponible, setDisponible] = useState(true);
  const [paso, setPaso] = useState('idle'); // idle | qr | confirmar
  const [qrImagen, setQrImagen] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [showDesactivar, setShowDesactivar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    twoFactorService.getEstado()
      .then(({ activo, disponible }) => { setActivo(activo); setDisponible(disponible); })
      .catch(() => setActivo(false));
  }, []);

  const iniciarActivacion = async () => {
    setLoading(true);
    try {
      const url = await twoFactorService.activar();
      setQrImagen(await QRCode.toDataURL(url, { margin: 1, width: 220 }));
      setPaso('qr');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo iniciar la activación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmarActivacion = async () => {
    setLoading(true);
    try {
      await twoFactorService.confirmar(codigo);
      setActivo(true);
      setPaso('idle');
      setCodigo('');
      toast('Verificación en dos pasos activada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Código incorrecto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const desactivar = async () => {
    setLoading(true);
    try {
      await twoFactorService.desactivar(password);
      setActivo(false);
      setShowDesactivar(false);
      setPassword('');
      toast('Verificación en dos pasos desactivada', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo desactivar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 18, sm: 22 }, mb: 0.5 }}>Seguridad</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        Protegé tu cuenta con un segundo paso de verificación al iniciar sesión.
      </Typography>

      <Box sx={{ ...card, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: paso !== 'idle' || showDesactivar ? 2.5 : 0 }}>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15 }}>Verificación en dos pasos</Typography>
            <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 0.25 }}>
              {activo
                ? 'Activa — se pide un código de tu app de autenticación al iniciar sesión.'
                : disponible ? 'Usá Google Authenticator, Authy o similar.' : 'No está disponible en este momento.'}
            </Typography>
          </Box>
          {activo === null ? null : activo ? (
            <Chip label="Activa" size="small" sx={{ bgcolor: SUCCESS_BG, color: SUCCESS, fontWeight: 700 }} />
          ) : (
            disponible && paso === 'idle' && (
              <Button variant="contained" onClick={iniciarActivacion} disabled={loading}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
                Activar
              </Button>
            )
          )}
        </Box>

        {paso === 'qr' && (
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, mb: 1.5 }}>
              Escaneá este código con tu app de autenticación y después ingresá el código de 6 dígitos que te muestra.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {qrImagen && <Box component="img" src={qrImagen} alt="QR de verificación en dos pasos" sx={{ borderRadius: '8px' }} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="000000" value={codigo}
                onChange={e => setCodigo(e.target.value)}
                inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.3em', textAlign: 'center' } }}
                sx={fieldSx} />
              <Button variant="contained" onClick={confirmarActivacion} disabled={loading || codigo.length < 6}
                sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.5 } }}>
                Confirmar
              </Button>
            </Box>
          </Box>
        )}

        {activo && !showDesactivar && (
          <Button onClick={() => setShowDesactivar(true)}
            sx={{ color: ERROR, textTransform: 'none', fontWeight: 600, fontSize: 12.5, p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
            Desactivar
          </Button>
        )}

        {showDesactivar && (
          <Box>
            <Typography sx={{ color: INK2, fontSize: 13, mb: 1.5 }}>Ingresá tu contraseña para desactivarla.</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth type="password" placeholder="Tu contraseña" value={password}
                onChange={e => setPassword(e.target.value)} sx={fieldSx} />
              <Button variant="contained" onClick={desactivar} disabled={loading || !password}
                sx={{ bgcolor: ERROR, textTransform: 'none', fontWeight: 600, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { bgcolor: ERROR }, '&.Mui-disabled': { opacity: 0.5 } }}>
                Desactivar
              </Button>
              <Button onClick={() => { setShowDesactivar(false); setPassword(''); }}
                sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                Cancelar
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ─────────────────────────── MODAL ─────────────────────────── */
export function ConfigModal({ open, onClose }) {
  const [tab, setTab] = useState(0);
  const { checkPermisos } = useHasPermiso();

  // Negocio/Catálogo/Cobros/Facturación/Plan tocan endpoints que el backend
  // ya protege con view-configuracion/update-configuracion (EmpresaController,
  // CatalogoController, MercadoPagoConexionController — ver routes/api.php).
  // Antes el frontend no lo chequeaba: un usuario sin ese permiso veía y
  // completaba estas pestañas igual, y recién se enteraba al guardar que el
  // backend lo rechazaba. Mi perfil y Seguridad quedan siempre visibles —
  // son de la cuenta propia, no del negocio.
  const puedeConfigurar = checkPermisos('verConfiguracion');

  // Antes "Mi perfil" y "Seguridad" quedaban siempre visibles sin importar el
  // permiso (el criterio era "son de la cuenta propia, no del negocio") — a
  // pedido, el rol básico (vendedor) no debe ver Configuración en absoluto,
  // ni siquiera esas dos. Sigue existiendo "olvidé mi contraseña" en el login
  // (público, sin login) para quien de verdad necesite cambiarla.
  const tabs = useMemo(() => !puedeConfigurar ? [] : [
    { label: 'Mi perfil', render: () => <TabPerfil /> },
    { label: 'Negocio', render: () => <TabNegocio /> },
    // Módulo opcional por cliente — ver CATALOGO_HABILITADO en config/brand.js.
    ...(CATALOGO_HABILITADO ? [{ label: 'Catálogo', render: () => <TabCatalogo /> }] : []),
    // Gestión de sucursales desactivada por ahora a pedido — comentado, no
    // borrado. El negocio sigue operando con la única sucursal ("Casa
    // Central") creada al instalar; el resto del sistema (stock, turnos,
    // ventas) ya sabe trabajar con multi-sucursal si esto se reactiva —
    // descomentar esta línea y la función TabSucursales más abajo alcanza.
    // ...(checkPermisos('list-sucursales') ? [{ label: 'Sucursales', render: () => <TabSucursales /> }] : []),
    // Cobros es enteramente sobre conectar Mercado Pago para Point — con Point
    // deshabilitado (VITE_POINT_HABILITADO=false) no tiene sentido mostrarla.
    ...(POINT_HABILITADO ? [{ label: 'Cobros', render: () => <TabCobros /> }] : []),
    { label: 'Facturación', render: () => <TabFacturacion /> },
    { label: 'Seguridad', render: () => <TabSeguridad /> },
  ], [puedeConfigurar]);

  const tabActual = tabs[tab] ?? tabs[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: modalPaperSx }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon sx={{ color: INK2, fontSize: { xs: 18, sm: 20 } }} />
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}>Configuración</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: { xs: 2, sm: 3 }, borderBottom: `1px solid ${BORDER}` }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': { bgcolor: P, height: 2 },
            '& .MuiTab-root': {
              textTransform: 'none', color: MUTED,
              minHeight: 44, fontSize: 14, fontWeight: 500,
              px: 0, mr: 3, transition: 'color 0.15s',
            },
            '& .Mui-selected': { color: INK, fontWeight: 600 },
          }}
        >
          {tabs.map(t => <Tab key={t.label} label={t.label} />)}
        </Tabs>
      </Box>

      {/* Content — en mobile sin altura forzada (el contenido de cada
          pestaña es largo, encerrarlo en una caja de 560px fijos lo dejaba
          apretado); en desktop mantiene el scroll interno acotado. */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, maxHeight: { xs: 'none', sm: 560 }, overflowY: { xs: 'visible', sm: 'auto' } }}>
        {tabActual
          ? tabActual.render()
          : <Typography sx={{ color: MUTED, fontSize: 13.5, textAlign: 'center', py: 4 }}>No tenés permiso para ver Configuración.</Typography>}
      </DialogContent>
    </Dialog>
  );
}
