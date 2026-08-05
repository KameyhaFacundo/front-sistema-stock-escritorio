import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { BG, INK, INK2, MUTED, P, P_HOVER } from '../../theme/tokens';

export default function NotFound() {
  return (
    <Box sx={{
      width: '100%', height: '100dvh', bgcolor: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', p: 3,
    }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: '20px',
        bgcolor: 'rgba(92,110,248,0.1)', border: '1px solid rgba(92,110,248,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
      }}>
        <ErrorOutlineIcon sx={{ color: P, fontSize: 36 }} />
      </Box>

      <Typography sx={{ color: INK, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1, mb: 1 }}>
        404
      </Typography>
      <Typography sx={{ color: INK2, fontWeight: 700, fontSize: 20, mb: 0.75 }}>
        Página no encontrada
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 15, textAlign: 'center', maxWidth: 380, mb: 4 }}>
        La página que buscás no existe o fue movida a otra dirección.
      </Typography>

      <Button
        component={Link}
        to="/"
        variant="contained"
        sx={{
          bgcolor: P, textTransform: 'none', fontWeight: 600,
          fontSize: 15, px: 4, py: 1.5, borderRadius: '10px',
          '&:hover': { bgcolor: P_HOVER },
        }}
      >
        Volver al inicio
      </Button>
    </Box>
  );
}
