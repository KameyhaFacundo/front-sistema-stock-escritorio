import { memo } from 'react';
import UnfoldMoreIcon     from '@mui/icons-material/UnfoldMore';
import ArrowUpwardIcon    from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon  from '@mui/icons-material/ArrowDownward';
import { MUTED, P } from '../../theme/tokens';

/** Ícono de columna ordenable. */
const SortIco = memo(function SortIco({ col, active, dir }) {
  if (active !== col)
    return <UnfoldMoreIcon sx={{ fontSize: 14, color: MUTED, ml: 0.25 }} />;
  return dir === 'asc'
    ? <ArrowUpwardIcon   sx={{ fontSize: 14, color: P, ml: 0.25 }} />
    : <ArrowDownwardIcon sx={{ fontSize: 14, color: P, ml: 0.25 }} />;
});

export default SortIco;
