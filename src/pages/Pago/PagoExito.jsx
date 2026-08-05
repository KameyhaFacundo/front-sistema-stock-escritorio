import { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { BG, CARD, BORDER, INK, INK2, MUTED, P } from '../../theme/tokens';
import { AuthContext } from '../../auth/AuthContextBase';
import api from '../../api/client';

const NOMBRES = {
  esencial: 'Plan Esencial',
  pro:      'Plan Pro',
  ia:       'Plan IA',
};

export default function PagoExito() {
  const [params]     = useSearchParams();
  const navigate     = useNavigate();
  const { setUser }  = useContext(AuthContext);
  const tipo         = params.get('tipo')    || 'plan';
  const esPack       = tipo === 'pack';
  const plan         = params.get('plan')    || 'pro';
  const ciclo        = params.get('ciclo')   || 'mensual';
  const pack         = params.get('pack')    || '';
  const pending      = params.get('pending') === '1';
  const planNombre   = NOMBRES[plan] || plan;

  useEffect(() => {
    api.get('me')
      .then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      })
      .catch(() => {});
  }, [setUser]);

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

        {pending ? (
          <AccessTimeIcon sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
        ) : (
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
        )}

        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 26, mb: 1 }}>
          {pending ? 'Pago en proceso' : '¡Pago exitoso!'}
        </Typography>

        <Typography sx={{ color: INK2, fontSize: 15, mb: 0.5 }}>
          {pending
            ? 'Tu pago está siendo procesado por Mercado Pago.'
            : esPack
              ? `Activaste tu pack de ${Number(pack).toLocaleString('es-AR')} facturas.`
              : `Activaste el ${planNombre} (${ciclo}).`
          }
        </Typography>

        {pending && (
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 0 }}>
            Te avisaremos cuando se confirme.
          </Typography>
        )}

        <Box sx={{ mt: 4, borderTop: `1px solid ${BORDER}`, pt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/dashboard')}
            sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.4, borderRadius: '100px', '&:hover': { bgcolor: '#0891b2' } }}
          >
            Ir al panel
          </Button>
          {pending && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/planes')}
              sx={{ color: INK, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.4, borderRadius: '100px', '&:hover': { borderColor: P, color: P } }}
            >
              Ver planes
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
