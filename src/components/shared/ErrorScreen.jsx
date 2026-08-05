import { Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BG, BORDER, INK, MUTED, ERROR, P } from '../../theme/tokens';

export default function ErrorScreen({ onReset }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', bgcolor: BG, px: 3, textAlign: 'center', gap: 2,
    }}>
      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: `${ERROR}18`, border: `1px solid ${ERROR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 28 }}>⚠</Typography>
      </Box>
      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 20 }}>Algo salió mal</Typography>
      <Typography sx={{ color: MUTED, fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
        Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}
          sx={{ color: INK, borderColor: BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { borderColor: 'var(--border-hover)', bgcolor: 'rgba(255,255,255,0.05)' } }}>
          Recargar
        </Button>
        <Button variant="contained" onClick={onReset}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { opacity: 0.9 } }}>
          Ir al inicio
        </Button>
      </Box>
    </Box>
  );
}
