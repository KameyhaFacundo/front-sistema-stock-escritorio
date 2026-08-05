import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { BG, CARD, BORDER, INK, INK2, MUTED, P } from '../../theme/tokens';

export default function PagoFallo() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan     = params.get('plan') || null;

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

        <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />

        <Typography sx={{ color: INK, fontWeight: 800, fontSize: 26, mb: 1 }}>
          El pago no se completó
        </Typography>
        <Typography sx={{ color: INK2, fontSize: 15, mb: 0.5 }}>
          Hubo un problema al procesar tu pago en Mercado Pago.
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>
          No se realizó ningún cobro. Podés intentarlo nuevamente.
        </Typography>

        <Box sx={{ mt: 4, borderTop: `1px solid ${BORDER}`, pt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/planes' + (plan ? `?plan=${plan}` : ''))}
            sx={{ bgcolor: P, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.4, borderRadius: '100px', '&:hover': { bgcolor: '#0891b2' } }}
          >
            Volver a intentar
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/dashboard')}
            sx={{ color: INK, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.4, borderRadius: '100px', '&:hover': { borderColor: P, color: P } }}
          >
            Ir al panel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
