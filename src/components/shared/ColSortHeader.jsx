import { memo } from 'react';
import { Box, Typography } from '@mui/material';
import SortIco from './SortIco';
import { MUTED } from '../../theme/tokens';

const colTh = {
  color: MUTED,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  userSelect: 'none',
};

const ColSortHeader = memo(function ColSortHeader({ col, label, sortCol, sortDir, onSort }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(col);
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Ordenar por ${label}${sortCol === col ? (sortDir === 'asc' ? ', ascendente' : ', descendente') : ''}`}
      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      onClick={() => onSort(col)}
      onKeyDown={handleKeyDown}
    >
      <Typography sx={colTh}>{label}</Typography>
      <SortIco col={col} active={sortCol} dir={sortDir} />
    </Box>
  );
});

export default ColSortHeader;
