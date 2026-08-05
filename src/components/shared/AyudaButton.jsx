import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IconButton, Tooltip, Badge } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useToast } from '../../context/ToastContext';
import { startTour, hasTour, onTourRegistered } from '../../utils/tour';
import { CARD, BORDER, MUTED, INK, HOVER, P } from '../../theme/tokens';

export default function AyudaButton() {
  const location = useLocation();
  const toast = useToast();
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    setTourReady(hasTour(location.pathname));
    const unsub = onTourRegistered(() => {
      setTourReady(hasTour(location.pathname));
    });
    return unsub;
  }, [location.pathname]);

  const handleClick = () => {
    const ok = startTour(location.pathname);
    if (!ok) toast('Todavia no hay una guia para esta pantalla', 'info');
  };

  return (
    <Tooltip title={tourReady ? 'Ayuda — recorrido guiado de esta pantalla' : 'Ayuda'}>
      <IconButton onClick={handleClick} size="small"
        sx={{
          bgcolor: CARD, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: '8px', p: '7px',
          '&:hover': { color: INK, bgcolor: HOVER, borderColor: 'var(--border-hover)' },
        }}>
        <Badge variant="dot" invisible={!tourReady}
          sx={{ '& .MuiBadge-badge': { bgcolor: P, width: 7, height: 7, minWidth: 7, borderRadius: '50%' } }}>
          <HelpOutlineIcon sx={{ fontSize: 18 }} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
