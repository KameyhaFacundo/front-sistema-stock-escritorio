import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { APP_NAME } from '../../config/brand';
import useLogo from '../../hooks/useLogo';
import { BG, CARD, BORDER, INK, INK2, MUTED } from '../../theme/tokens';

export default function LegalLayout({ titulo, actualizado, children }) {
  const navigate = useNavigate();
  const logoSrc = useLogo();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      <Box component="nav" sx={{ borderBottom: `1px solid ${BORDER}`, bgcolor: CARD }}>
        <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 3 }, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box component="img" src={logoSrc} alt={APP_NAME} sx={{ height: 32, width: 'auto', display: 'block', cursor: 'pointer' }} onClick={() => navigate('/')} />
          <Button startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />} onClick={() => navigate('/')}
            sx={{ color: INK2, textTransform: 'none', fontSize: 13, fontWeight: 600 }}>
            Volver al inicio
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 5, md: 8 } }}>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 26, md: 34 }, letterSpacing: '-0.02em', mb: 1 }}>
          {titulo}
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 13, mb: 5 }}>
          Última actualización: {actualizado}
        </Typography>

        <Box sx={{
          '& h2': { color: INK, fontWeight: 700, fontSize: 18, mt: 5, mb: 1.5 },
          '& p': { color: INK2, fontSize: 14.5, lineHeight: 1.8, mb: 2 },
          '& ul': { color: INK2, fontSize: 14.5, lineHeight: 1.8, mb: 2, pl: 3 },
          '& li': { mb: 0.5 },
          '& strong': { color: INK, fontWeight: 700 },
          '& a': { color: 'var(--p)' },
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
