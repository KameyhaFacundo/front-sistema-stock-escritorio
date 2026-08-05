import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { keyframes } from '@mui/system';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import StorefrontIcon     from '@mui/icons-material/Storefront';
import CategoryIcon       from '@mui/icons-material/Category';
import GridViewIcon       from '@mui/icons-material/GridView';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import { APP_NAME, PRIMARY_COLOR, PRIMARY_HOVER } from '../../config/brand';
import { BG, CARD, BORDER, INK, MUTED, HOVER } from '../../theme/tokens';
import { AuthContext } from '../../auth/AuthContextBase';
import { useAppTheme } from '../../theme/useAppTheme';
import useLogo from '../../hooks/useLogo';

const SUCCESS = '#10b981';

const fadeUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;

const getDotPattern = (mode) =>
  mode === 'dark'
    ? 'radial-gradient(circle, #ffffff0a 1px, transparent 1px)'
    : 'radial-gradient(circle, #c8cce830 1px, transparent 1px)';

const PRIMEROS_PASOS = [
  { icon: CategoryIcon,    label: 'Agregá tu primer producto',  sub: 'Creá tu catálogo de artículos',   path: '/productos' },
  { icon: StorefrontIcon,  label: 'Hacé tu primera venta',      sub: 'Abrí el punto de venta y vendé',  path: '/pos'       },
  { icon: GridViewIcon,    label: 'Explorá el dashboard',       sub: 'Mirá tus métricas y reportes',    path: '/dashboard' },
];

export default function Bienvenida() {
  const navigate         = useNavigate();
  const { user }         = useContext(AuthContext);
  const { mode }         = useAppTheme();
  const logoSrc          = useLogo();

  const userName     = user?.des_usu?.split(' ')[0] || 'allá';
  const businessName = user?.empresa?.nombre || APP_NAME;
  const trialEnds    = user?.empresa?.trial_ends_at;
  const daysLeft     = trialEnds
    ? Math.max(0, Math.ceil((new Date(trialEnds) - new Date()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <Box sx={{
      position: 'fixed', inset: 0,
      bgcolor: BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto',
      fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
      backgroundImage: getDotPattern(mode),
      backgroundSize: '28px 28px',
      px: 2, py: 5,
    }}>
      <Box sx={{ width: '100%', maxWidth: 540, animation: `${fadeUp} 0.5s cubic-bezier(0.16,1,0.3,1)` }}>

        {/* Logo */}
        <Box sx={{ mb: 6 }}>
          <Box component="img" src={logoSrc} alt={APP_NAME}
            sx={{ height: 50, width: 'auto', display: 'block' }} />
        </Box>

        {/* Check icon */}
        <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: `${SUCCESS}18`, border: `2px solid ${SUCCESS}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <CheckCircleIcon sx={{ color: SUCCESS, fontSize: 36 }} />
        </Box>

        {/* Título */}
        <Typography sx={{ color: INK, fontWeight: 900, fontSize: { xs: 28, sm: 36 }, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 1 }}>
          ¡Bienvenido, {userName}!
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 15, lineHeight: 1.7, mb: 1 }}>
          Tu cuenta <Box component="span" sx={{ color: INK, fontWeight: 600 }}>{businessName}</Box> está lista.
        </Typography>

        {/* Trial badge */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: `${PRIMARY_COLOR}14`, border: `1px solid ${PRIMARY_COLOR}28`, borderRadius: '20px', px: 2, py: '6px', mb: 4 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: SUCCESS }} />
          <Typography sx={{ color: PRIMARY_COLOR, fontSize: 13, fontWeight: 700 }}>
            {daysLeft} días de prueba gratuita activados
          </Typography>
        </Box>

        {/* Primeros pasos */}
        <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
          Por dónde empezar
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
          {PRIMEROS_PASOS.map(({ icon: Icon, label, sub, path }) => (
            <Box key={path} component={Link} to={path}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px',
                px: 2, py: 1.75, textDecoration: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': { borderColor: PRIMARY_COLOR, bgcolor: `${PRIMARY_COLOR}08` },
              }}
            >
              <Box sx={{ width: 38, height: 38, borderRadius: '9px', bgcolor: HOVER, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{label}</Typography>
                <Typography sx={{ color: MUTED, fontSize: 12, mt: 0.25 }}>{sub}</Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: MUTED, fontSize: 16, flexShrink: 0 }} />
            </Box>
          ))}
        </Box>

        {/* CTA principal */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: PRIMARY_COLOR, color: '#fff', textTransform: 'none',
            fontWeight: 700, fontSize: 15, py: 1.6, borderRadius: '12px',
            boxShadow: `0 4px 20px ${PRIMARY_COLOR}35`,
            '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 6px 28px ${PRIMARY_COLOR}50` },
          }}
        >
          Ir al panel
        </Button>

        <Typography sx={{ color: MUTED, fontSize: 12, textAlign: 'center', mt: 2.5 }}>
          Sin tarjeta de crédito · Podés cancelar cuando quieras
        </Typography>
      </Box>
    </Box>
  );
}
