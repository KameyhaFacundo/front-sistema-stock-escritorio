import { useContext } from 'react';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import { AuthContext } from '../../auth/AuthContextBase';

export default function ImpersonationBanner() {
  const { isImpersonating, impersonandoEmpresa, volverDeImpersonar } = useContext(AuthContext);

  if (!isImpersonating) return null;

  return (
    <Box sx={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2500,
      display: 'flex', alignItems: 'center', gap: 1.25,
      bgcolor: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(148, 163, 184, 0.18)',
      borderRadius: '16px',
      py: 1, px: 2,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
      animation: 'bannerIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      '@keyframes bannerIn': {
        from: { opacity: 0, transform: 'translateX(-50%) translateY(-12px)' },
        to:   { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
      },
    }}>
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%',
        bgcolor: '#f59e0b',
        boxShadow: '0 0 8px rgba(245,158,11,0.5)',
        flexShrink: 0,
      }} />

      <Typography sx={{ color: '#e2e8f0', fontSize: 12.5, fontWeight: 500, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
        <Box component="span" sx={{ color: '#94a3b8' }}>Soporte</Box>
        {' · '}
        {impersonandoEmpresa || 'esta empresa'}
      </Typography>

      <Tooltip title="Volver a tu sesión de Super Admin" placement="top">
        <Button
          onClick={volverDeImpersonar}
          size="small"
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 11.5,
            color: '#94a3b8',
            borderRadius: '10px', px: 1.5, py: 0.5, ml: 0.5,
            minWidth: 0, letterSpacing: '0.02em',
            '&:hover': { bgcolor: 'rgba(248,113,113,0.15)', color: '#f87171' },
            transition: 'all 0.2s',
          }}
        >
          Salir
        </Button>
      </Tooltip>
    </Box>
  );
}
