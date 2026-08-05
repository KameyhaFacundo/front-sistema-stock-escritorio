import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, ERROR } from '../../theme/tokens';
import { usuariosService } from '../../services/usuariosService';

export default function ConfirmarEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const id = params.get('id');
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!token || !id) {
      setEstado('error');
      setMensaje('El enlace no es válido.');
      return;
    }
    usuariosService.confirmarCambioEmail(id, token)
      .then(res => {
        setEstado('ok');
        setMensaje(res.message || 'Tu correo se actualizó correctamente.');
      })
      .catch(e => {
        setEstado('error');
        setMensaje(e.response?.data?.message || 'El enlace no es válido o ya fue usado.');
      });
  }, [token, id]);

  return (
    <Box sx={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: BG,
      px: 2,
    }}>
      <Box sx={{
        bgcolor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: '20px',
        p: { xs: 4, md: 5 },
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        {estado === 'cargando' && (
          <>
            <CircularProgress size={48} sx={{ color: P, mb: 2 }} />
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 18 }}>Confirmando tu correo...</Typography>
          </>
        )}

        {estado === 'ok' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            <Typography sx={{ color: INK, fontWeight: 800, fontSize: 26, mb: 1 }}>¡Correo confirmado!</Typography>
            <Typography sx={{ color: INK2, fontSize: 15 }}>{mensaje}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.5 }}>Iniciá sesión con tu correo nuevo la próxima vez.</Typography>
          </>
        )}

        {estado === 'error' && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: ERROR, mb: 2 }} />
            <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, mb: 1 }}>No pudimos confirmar tu correo</Typography>
            <Typography sx={{ color: INK2, fontSize: 15 }}>{mensaje}</Typography>
          </>
        )}

        {estado !== 'cargando' && (
          <Box sx={{ mt: 4, borderTop: `1px solid ${BORDER}`, pt: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/signin')}
              sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.4, borderRadius: '100px' }}
            >
              Ir a iniciar sesión
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
